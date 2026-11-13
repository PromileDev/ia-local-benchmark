// Interactividad de la página: filtros, gráficas SVG, tabla ordenable y tooltips.
import { resumir, fmt, slotFamilia, type Modelo, type Prueba, type Resumen } from '../lib/metricas';

type Metrica = 'indice' | 'velSalida' | 'velEntrada' | 'tokensSalida' | 'tiempoTotal';

interface DefMetrica {
  titulo: string;
  sub: string;
  mayorMejor: boolean;
  valor: (r: Resumen) => number | null;
  texto: (r: Resumen) => string;
}

const METRICAS: Record<Metrica, DefMetrica> = {
  indice: {
    titulo: 'Índice IA Local',
    sub: 'Puntos sobre 100 en el benchmark estricto. Más es mejor.',
    mayorMejor: true,
    valor: (r) => r.indice,
    texto: (r) => String(r.indice),
  },
  velSalida: {
    titulo: 'Velocidad de salida',
    sub: 'Tokens por segundo al escribir la respuesta (mediana de las pruebas). Más es mejor.',
    mayorMejor: true,
    valor: (r) => r.velSalida,
    texto: (r) => fmt.tps(r.velSalida),
  },
  velEntrada: {
    titulo: 'Velocidad de entrada',
    sub: 'Tokens por segundo al leer el mensaje. Más es mejor.',
    mayorMejor: true,
    valor: (r) => r.velEntrada,
    texto: (r) => fmt.tps(r.velEntrada) + (r.velEntradaFuente === 'cortas' ? '*' : ''),
  },
  tokensSalida: {
    titulo: 'Tokens generados',
    sub: 'Tokens escritos en las pruebas hechas, razonamiento incluido. Menos es mejor.',
    mayorMejor: false,
    valor: (r) => (r.completadas ? r.tokensSalida : null),
    texto: (r) => fmt.num(r.tokensSalida),
  },
  tiempoTotal: {
    titulo: 'Tiempo total',
    sub: 'Suma del tiempo de lectura y de escritura en las pruebas hechas. Menos es mejor.',
    mayorMejor: false,
    valor: (r) => (r.completadas ? r.tiempoTotal : null),
    texto: (r) => fmt.tiempo(r.tiempoTotal),
  },
};

const NS = 'http://www.w3.org/2000/svg';
const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const color = (familia: string) => `var(--s${slotFamilia(familia)})`;

const FUENTE = 'system-ui, -apple-system, "Segoe UI", sans-serif';
let lienzo: CanvasRenderingContext2D | null = null;
// Recorta un texto con «…» para que quepa en maxPx con la fuente indicada.
function ajustar(texto: string, maxPx: number, fuente: string): string {
  lienzo ??= document.createElement('canvas').getContext('2d');
  if (!lienzo) return texto;
  lienzo.font = `${fuente} ${FUENTE}`;
  if (lienzo.measureText(texto).width <= maxPx) return texto;
  let t = texto;
  while (t.length > 1 && lienzo.measureText(t + '…').width > maxPx) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}

// Escala con marcas redondas (pasos de 1, 2, 2,5 o 5 × 10^n).
function escala(maxDato: number, minimo = 0, objetivo = 4): { max: number; ticks: number[] } {
  const x = Math.max(maxDato, minimo, 1);
  const bruto = x / objetivo;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * pot).find((v) => v >= bruto) ?? 10 * pot;
  const max = Math.ceil(x / paso - 1e-9) * paso;
  const ticks: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += paso) ticks.push(+t.toFixed(6));
  return { max, ticks };
}

// Barra horizontal con el extremo de datos redondeado (4 px) y apoyada en la base.
function barra(x: number, y: number, w: number, h: number, r = 4): string {
  if (w <= 0) return '';
  const rr = Math.min(r, w, h / 2);
  return `M${x},${y}h${w - rr}a${rr},${rr} 0 0 1 ${rr},${rr}v${h - 2 * rr}a${rr},${rr} 0 0 1 ${-rr},${rr}h${-(w - rr)}z`;
}

export function iniciar(): void {
  const datos = JSON.parse(($('#datos') as HTMLScriptElement).textContent || '{}') as {
    pruebas: Prueba[];
    modelos: Modelo[];
  };
  const pruebas = datos.pruebas;
  const todos = datos.modelos.map((m) => resumir(m, pruebas));
  const maxPuntosPrueba = Math.max(...pruebas.map((p) => p.puntos));

  const estado = {
    texto: '',
    razonamiento: 'todos',
    cuant: 'todas',
    completos: false,
    metrica: 'indice' as Metrica,
    orden: { col: 'indice', asc: false },
    seleccionado: todos[0]?.modelo.id ?? '',
  };
  let visibles: Resumen[] = [];
  const tips = new Map<string, string>();

  // ---------------------------------------------------------------- tooltip
  const tip = $('#tooltip');
  function mostrarTip(clave: string, x: number, y: number) {
    const html = tips.get(clave);
    if (!html) return;
    tip.innerHTML = html;
    tip.style.opacity = '1';
    const r = tip.getBoundingClientRect();
    let left = x + 14;
    let top = y + 14;
    if (left + r.width > window.innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > window.innerHeight - 8) top = y - r.height - 14;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;
  }
  const ocultarTip = () => (tip.style.opacity = '0');

  function conectarTips(cont: HTMLElement) {
    cont.addEventListener('pointermove', (e) => {
      const el = (e.target as Element).closest('[data-k]');
      if (el) mostrarTip(el.getAttribute('data-k') as string, e.clientX, e.clientY);
      else ocultarTip();
    });
    cont.addEventListener('pointerleave', ocultarTip);
    cont.addEventListener('focusin', (e) => {
      const el = (e.target as Element).closest('[data-k]');
      if (!el) return;
      const b = el.getBoundingClientRect();
      mostrarTip(el.getAttribute('data-k') as string, b.left + b.width / 2, b.top + b.height / 2);
    });
    cont.addEventListener('focusout', ocultarTip);
    cont.addEventListener('click', (e) => {
      const el = (e.target as Element).closest('[data-id]');
      if (el) seleccionar(el.getAttribute('data-id') as string, false);
    });
    cont.addEventListener('keydown', (e) => {
      const el = (e.target as Element).closest('[data-id]');
      if (el && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        seleccionar(el.getAttribute('data-id') as string, false);
      }
    });
  }

  function tipModelo(r: Resumen, extra = ''): string {
    const m = r.modelo;
    return (
      `<strong><span class="punto" style="background:${color(m.familia)}"></span>${esc(m.nombre)}</strong>` +
      `<div class="fila"><span>Cuantización</span><b>${esc(m.cuantizacion)}</b></div>` +
      `<div class="fila"><span>Puntuación</span><b>${r.indice} / 100${r.provisional ? ' (provisional)' : ''}</b></div>` +
      `<div class="fila"><span>Pruebas hechas</span><b>${r.completadas} de ${r.total}</b></div>` +
      `<div class="fila"><span>Vel. salida</span><b>${fmt.tps(r.velSalida)}</b></div>` +
      `<div class="fila"><span>Vel. entrada</span><b>${fmt.tps(r.velEntrada)}${r.velEntradaFuente === 'cortas' ? '*' : ''}</b></div>` +
      `<div class="fila"><span>Equipo</span><b>${esc(m.equipo)}</b></div>` +
      extra
    );
  }

  // ---------------------------------------------------------------- filtros
  function aplicarFiltros() {
    const t = estado.texto.trim().toLowerCase();
    visibles = todos.filter((r) => {
      const m = r.modelo;
      if (t && !`${m.nombre} ${m.familia} ${m.cuantizacion}`.toLowerCase().includes(t)) return false;
      if (estado.razonamiento === 'si' && !m.razonamiento) return false;
      if (estado.razonamiento === 'no' && m.razonamiento) return false;
      if (estado.cuant !== 'todas' && m.cuantizacion !== estado.cuant) return false;
      if (estado.completos && r.provisional) return false;
      return true;
    });
    $('#contador').textContent = `${visibles.length} de ${todos.length} ${todos.length === 1 ? 'modelo' : 'modelos'}`;
  }

  // ---------------------------------------------------------------- ranking
  function pintarRanking() {
    const cont = $('#g-ranking');
    const def = METRICAS[estado.metrica];
    $('#ranking-titulo').textContent = def.titulo;
    $('#ranking-sub').textContent = def.sub;
    const conDato = visibles.filter((r) => def.valor(r) !== null);
    const sinDato = visibles.filter((r) => def.valor(r) === null);
    conDato.sort((a, b) => {
      const va = def.valor(a) as number;
      const vb = def.valor(b) as number;
      return def.mayorMejor ? vb - va : va - vb;
    });

    const notas: string[] = [];
    if (estado.metrica === 'velEntrada' && conDato.some((r) => r.velEntradaFuente === 'cortas'))
      notas.push('* Medida con entradas cortas: será más fiable cuando se haga la prueba 8 (entrada larga).');
    if (estado.metrica === 'tokensSalida' || estado.metrica === 'tiempoTotal') {
      const parciales = conDato.filter((r) => r.conVelocidad < r.total);
      if (parciales.length)
        notas.push(
          `Solo incluye las pruebas con datos de velocidad: ${parciales.map((r) => `${r.modelo.nombre} (${r.conVelocidad} de ${r.total})`).join(', ')}. Solo es comparable entre modelos con los datos de las 10 pruebas.`,
        );
    }
    if (sinDato.length) notas.push(`Sin datos todavía: ${sinDato.map((r) => r.modelo.nombre).join(', ')}.`);
    $('#nota-ranking').textContent = notas.join(' ');

    const leyenda: string[] = [];
    const familias = [...new Set(visibles.map((r) => r.modelo.familia))];
    if (familias.length > 1)
      for (const f of familias) leyenda.push(`<span><i class="punto" style="background:${color(f)}"></i>${esc(f)}</span>`);
    if (estado.metrica === 'indice' && conDato.some((r) => r.provisional))
      leyenda.push('<span><i class="muestra-pendiente"></i>Puntos de pruebas aún sin hacer</span>');
    $('#leyenda-ranking').innerHTML = leyenda.join('');

    if (!conDato.length) {
      cont.innerHTML = '<p class="vacio">No hay datos para esta métrica con los filtros actuales.</p>';
      return;
    }

    const W = Math.max(cont.clientWidth, 320);
    const estrecho = W < 560;
    const labelW = estrecho ? 130 : Math.min(250, W * 0.3);
    const valW = estado.metrica === 'indice' ? (estrecho ? 92 : 190) : estrecho ? 70 : 96;
    const plotW = W - labelW - valW;
    const filaH = 48;
    const barH = 20;
    const arriba = 6;
    const ejeH = 24;
    const H = arriba + conDato.length * filaH + ejeH;
    const { max, ticks } =
      estado.metrica === 'indice'
        ? escala(100)
        : escala(Math.max(...conDato.map((r) => def.valor(r) as number)), estado.metrica.startsWith('vel') ? 40 : 0);
    const xs = (v: number) => labelW + (plotW * v) / max;
    const etiquetaTick = (t: number) => (estado.metrica === 'tiempoTotal' ? `${fmt.num(t)} s` : fmt.num(t));

    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(def.titulo)}">`;
    s += `<defs><pattern id="rayado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" style="fill:var(--surface)"/><line x1="0" y1="0" x2="0" y2="6" style="stroke:var(--grid);stroke-width:3"/></pattern></defs>`;
    for (const t of ticks) {
      const x = xs(t);
      s += `<line x1="${x}" x2="${x}" y1="${arriba}" y2="${H - ejeH}" style="stroke:${t === 0 ? 'var(--axis)' : 'var(--grid)'};stroke-width:1"/>`;
      s += `<text x="${x}" y="${H - 6}" text-anchor="middle" style="fill:var(--muted);font-size:11px">${etiquetaTick(t)}</text>`;
    }
    conDato.forEach((r, i) => {
      const y = arriba + i * filaH;
      const yb = y + (filaH - barH) / 2;
      const v = def.valor(r) as number;
      const m = r.modelo;
      const w = xs(v) - labelW;
      const nombre = ajustar(m.nombre, labelW - 12, '600 13.5px');
      const cuant = ajustar(m.cuantizacion, labelW - 12, '11.5px');
      s += `<text x="0" y="${y + filaH / 2 - 3}" style="fill:var(--ink-1);font-size:13.5px;font-weight:600">${esc(nombre)}</text>`;
      s += `<text x="0" y="${y + filaH / 2 + 13}" style="fill:var(--muted);font-size:11.5px">${esc(cuant)}</text>`;
      s += `<path d="${barra(labelW, yb, Math.max(w, 2), barH)}" style="fill:${color(m.familia)}"/>`;
      let finX = labelW + w;
      if (estado.metrica === 'indice' && r.pendientes > 0) {
        const wp = (plotW * r.pendientes) / max - 2;
        s += `<rect x="${finX + 2}" y="${yb + 0.75}" width="${Math.max(wp, 0)}" height="${barH - 1.5}" rx="4" style="fill:url(#rayado);stroke:var(--muted);stroke-width:1;stroke-dasharray:3 3"/>`;
        finX += 2 + Math.max(wp, 0);
      }
      const tx = Math.min(finX + 8, W - valW + 8);
      s += `<text x="${tx}" y="${y + filaH / 2 + 5}" style="fill:var(--ink-1);font-size:13.5px;font-weight:700">${esc(def.texto(r))}`;
      if (estado.metrica === 'indice' && r.provisional && !estrecho)
        s += `<tspan style="fill:var(--muted);font-weight:400;font-size:12px"> · provisional (${r.completadas}/${r.total})</tspan>`;
      s += `</text>`;
      const k = `r-${m.id}`;
      tips.set(k, tipModelo(r));
      s += `<rect data-k="${k}" data-id="${esc(m.id)}" tabindex="0" x="0" y="${y}" width="${W}" height="${filaH}" style="fill:transparent;cursor:pointer;outline:none"/>`;
    });
    s += '</svg>';
    cont.innerHTML = s;
  }

  // ---------------------------------------------------------------- dispersión
  function pintarDispersion() {
    const cont = $('#g-dispersion');
    const puntos = visibles.filter((r) => r.velSalida !== null);
    if (!puntos.length) {
      cont.innerHTML = '<p class="vacio">No hay modelos con velocidad medida.</p>';
      return;
    }
    const W = Math.max(cont.clientWidth, 300);
    const H = 340;
    const mg = { l: 46, r: 18, t: 14, b: 46 };
    const pw = W - mg.l - mg.r;
    const ph = H - mg.t - mg.b;
    const { max: xmax, ticks: xticks } = escala(Math.max(...puntos.map((r) => r.velSalida as number)) * 1.15, 40);
    const xs = (v: number) => mg.l + (pw * v) / xmax;
    const ys = (v: number) => mg.t + ph - (ph * v) / 100;

    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Puntuación frente a velocidad de salida">`;
    const zx = xs(Math.min(20, xmax));
    s += `<rect x="${zx}" y="${ys(100)}" width="${xs(xmax) - zx}" height="${ys(70) - ys(100)}" style="fill:var(--zona)"/>`;
    s += `<text x="${xs(xmax) - 8}" y="${ys(100) + 16}" text-anchor="end" style="fill:var(--zona-ink);font-size:11.5px;font-weight:600">Zona más atractiva</text>`;
    for (const t of [0, 25, 50, 75, 100]) {
      s += `<line x1="${mg.l}" x2="${W - mg.r}" y1="${ys(t)}" y2="${ys(t)}" style="stroke:${t === 0 ? 'var(--axis)' : 'var(--grid)'};stroke-width:1"/>`;
      s += `<text x="${mg.l - 8}" y="${ys(t) + 4}" text-anchor="end" style="fill:var(--muted);font-size:11px">${t}</text>`;
    }
    for (const t of xticks) {
      s += `<text x="${xs(t)}" y="${H - mg.b + 18}" text-anchor="middle" style="fill:var(--muted);font-size:11px">${fmt.num(t)}</text>`;
    }
    s += `<text x="${mg.l + pw / 2}" y="${H - 6}" text-anchor="middle" style="fill:var(--ink-2);font-size:12px">Velocidad de salida (tokens/s)</text>`;
    s += `<text transform="translate(13 ${mg.t + ph / 2}) rotate(-90)" text-anchor="middle" style="fill:var(--ink-2);font-size:12px">Puntuación (sobre 100)</text>`;

    for (const r of puntos) {
      const m = r.modelo;
      const cx = xs(r.velSalida as number);
      const cy = ys(r.indice);
      const c = color(m.familia);
      if (r.provisional && r.pendientes > 0) {
        // Rango posible: entre lo ya conseguido y el máximo si acertara todo lo pendiente.
        s += `<line x1="${cx}" x2="${cx}" y1="${cy}" y2="${ys(r.indice + r.pendientes)}" style="stroke:var(--muted);stroke-width:1.5;stroke-dasharray:3 4"/>`;
        s += `<line x1="${cx - 5}" x2="${cx + 5}" y1="${ys(r.indice + r.pendientes)}" y2="${ys(r.indice + r.pendientes)}" style="stroke:var(--muted);stroke-width:1.5"/>`;
        s += `<circle cx="${cx}" cy="${cy}" r="7" style="fill:var(--surface);stroke:${c};stroke-width:2.5"/>`;
      } else {
        s += `<circle cx="${cx}" cy="${cy}" r="7" style="fill:${c};stroke:var(--surface);stroke-width:2"/>`;
      }
      const derecha = cx > W - 150;
      s += `<text x="${derecha ? cx - 12 : cx + 12}" y="${cy + 4}" text-anchor="${derecha ? 'end' : 'start'}" style="fill:var(--ink-2);font-size:12px;font-weight:600">${esc(m.nombre)}</text>`;
      const k = `d-${m.id}`;
      tips.set(
        k,
        tipModelo(
          r,
          r.provisional
            ? `<div class="fila" style="margin-top:4px"><span>Rango posible</span><b>${r.indice}–${r.indice + r.pendientes}</b></div>`
            : '',
        ),
      );
      s += `<circle data-k="${k}" data-id="${esc(m.id)}" tabindex="0" cx="${cx}" cy="${cy}" r="16" style="fill:transparent;cursor:pointer;outline:none"/>`;
    }
    s += '</svg>';
    cont.innerHTML = s;
  }

  // ---------------------------------------------------------------- desglose
  function pintarDesglose() {
    const sel = $<HTMLSelectElement>('#sel-modelo');
    if (sel.options.length !== todos.length) {
      sel.innerHTML = todos.map((r) => `<option value="${esc(r.modelo.id)}">${esc(r.modelo.nombre)} · ${esc(r.modelo.cuantizacion)}</option>`).join('');
    }
    sel.value = estado.seleccionado;
    const cont = $('#g-desglose');
    const r = todos.find((x) => x.modelo.id === estado.seleccionado);
    if (!r) {
      cont.innerHTML = '<p class="vacio">Elige un modelo.</p>';
      return;
    }
    const m = r.modelo;
    const W = Math.max(cont.clientWidth, 300);
    const labelW = W < 460 ? 120 : Math.min(200, W * 0.4);
    const valW = 78;
    const plotW = W - labelW - valW;
    const filaH = 31;
    const barH = 13;
    const H = pruebas.length * filaH + 4;
    const xs = (v: number) => (plotW * v) / maxPuntosPrueba;
    const c = color(m.familia);

    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Desglose por prueba de ${esc(m.nombre)}">`;
    pruebas.forEach((p, i) => {
      const y = i * filaH;
      const yb = y + (filaH - barH) / 2;
      const res = m.pruebas[p.id];
      const etiqueta = ajustar(`${p.id}. ${p.nombre}`, labelW - 10, '12.5px');
      s += `<text x="0" y="${y + filaH / 2 + 4}" style="fill:var(--ink-1);font-size:12.5px">${esc(etiqueta)}</text>`;
      const wMax = xs(p.puntos);
      if (res) {
        s += `<path d="${barra(labelW, yb, wMax, barH)}" style="fill:var(--surface-2)"/>`;
        if (res.puntos > 0) s += `<path d="${barra(labelW, yb, xs(res.puntos), barH)}" style="fill:${c}"/>`;
        s += `<text x="${W - valW + 10}" y="${y + filaH / 2 + 4}" style="fill:var(--ink-1);font-size:12.5px;font-weight:700">${res.puntos}<tspan style="fill:var(--muted);font-weight:400"> / ${p.puntos}</tspan></text>`;
      } else {
        s += `<rect x="${labelW + 0.75}" y="${yb + 0.75}" width="${wMax - 1.5}" height="${barH - 1.5}" rx="4" style="fill:none;stroke:var(--muted);stroke-width:1;stroke-dasharray:3 3"/>`;
        s += `<text x="${W - valW + 10}" y="${y + filaH / 2 + 4}" style="fill:var(--muted);font-size:12px">pendiente</text>`;
      }
      const filas = [
        `<div class="fila"><span>Nivel</span><b>${esc(p.nivel)} · ${p.puntos} puntos</b></div>`,
        `<div class="fila"><span>Resultado</span><b>${res ? `${res.puntos} / ${p.puntos}` : 'pendiente'}</b></div>`,
      ];
      if (res?.entrada)
        filas.push(`<div class="fila"><span>Entrada</span><b>${fmt.num(res.entrada.tokens)} tok · ${fmt.tiempo(res.entrada.segundos)} · ${fmt.tps(res.entrada.tps)}</b></div>`);
      if (res?.salida)
        filas.push(`<div class="fila"><span>Salida</span><b>${fmt.num(res.salida.tokens)} tok · ${fmt.tiempo(res.salida.segundos)} · ${fmt.tps(res.salida.tps)}${res.salida.tpsCalculada ? '*' : ''}</b></div>`);
      if (res?.nota) filas.push(`<div style="margin-top:4px">${esc(res.nota)}</div>`);
      if (res && !res.entrada && !res.salida) filas.push(`<div style="color:var(--muted)">Sin datos de velocidad.</div>`);
      filas.push(`<div style="color:var(--muted);margin-top:4px">${esc(p.correccion)}</div>`);
      const k = `p-${m.id}-${p.id}`;
      tips.set(k, `<strong>${esc(p.id)}. ${esc(p.nombre)}</strong>${filas.join('')}`);
      s += `<rect data-k="${k}" tabindex="0" x="0" y="${y}" width="${W}" height="${filaH}" style="fill:transparent;outline:none"/>`;
    });
    s += '</svg>';
    cont.innerHTML = s;
  }

  // ---------------------------------------------------------------- tabla
  const valorCol = (r: Resumen, col: string): string | number | null => {
    const m = r.modelo as unknown as Record<string, unknown>;
    if (col in m && typeof m[col] !== 'object') return m[col] as string;
    return (r as unknown as Record<string, number | null>)[col];
  };

  function pintarTabla() {
    const { col, asc } = estado.orden;
    const filas = [...visibles].sort((a, b) => {
      const va = valorCol(a, col);
      const vb = valorCol(b, col);
      if (va === null) return 1;
      if (vb === null) return -1;
      const cmp = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb), 'es');
      return asc ? cmp : -cmp;
    });
    document.querySelectorAll<HTMLButtonElement>('th button').forEach((b) => {
      const activa = b.dataset.col === col;
      b.closest('th')?.setAttribute('aria-sort', activa ? (asc ? 'ascending' : 'descending') : 'none');
      b.textContent = b.textContent!.replace(/ [▲▼]$/, '') + (activa ? (asc ? ' ▲' : ' ▼') : '');
    });
    $('#cuerpo-tabla').innerHTML = filas.length
      ? filas
          .map((r) => {
            const m = r.modelo;
            return `<tr data-id="${esc(m.id)}" aria-selected="${m.id === estado.seleccionado}" tabindex="0">
            <td><span class="punto" style="background:${color(m.familia)};margin-right:8px"></span><b>${esc(m.nombre)}</b>${r.provisional ? '<span class="chip provisional">provisional</span>' : ''}${m.razonamiento ? '<span class="chip">razona</span>' : ''}</td>
            <td>${esc(m.cuantizacion)}</td>
            <td class="num"><b>${r.indice}</b><span style="color:var(--muted)"> / 100</span></td>
            <td class="num">${r.completadas}/${r.total}</td>
            <td class="num">${fmt.tps(r.velSalida)}</td>
            <td class="num">${fmt.tps(r.velEntrada)}${r.velEntradaFuente === 'cortas' ? '*' : ''}</td>
            <td class="num">${fmt.num(r.tokensSalida)}${r.conVelocidad < r.total ? '†' : ''}</td>
            <td class="num">${fmt.tiempo(r.tiempoTotal)}${r.conVelocidad < r.total ? '†' : ''}</td>
            <td class="envolver">${esc(m.equipo)}</td>
            <td>${esc(fmt.fecha(m.fecha))}</td>
          </tr>`;
          })
          .join('')
      : '<tr><td colspan="10" class="vacio">Ningún modelo coincide con los filtros.</td></tr>';
    const notas: string[] = [];
    if (filas.some((r) => r.velEntradaFuente === 'cortas'))
      notas.push('* Velocidad de entrada medida con entradas cortas (falta el dato de la prueba 8).');
    if (filas.some((r) => r.conVelocidad < r.total))
      notas.push('† Tokens y tiempo solo de las pruebas con datos de velocidad.');
    $('#nota-tabla').textContent = notas.join(' ');
  }

  // ---------------------------------------------------------------- general
  function seleccionar(id: string, desplazar: boolean) {
    estado.seleccionado = id;
    pintarDesglose();
    pintarTabla();
    if (desplazar) $('#desglose').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function pintarTodo() {
    tips.clear();
    aplicarFiltros();
    pintarRanking();
    pintarDispersion();
    pintarDesglose();
    pintarTabla();
  }

  $<HTMLInputElement>('#f-texto').addEventListener('input', (e) => {
    estado.texto = (e.target as HTMLInputElement).value;
    pintarTodo();
  });
  $<HTMLSelectElement>('#f-razonamiento').addEventListener('change', (e) => {
    estado.razonamiento = (e.target as HTMLSelectElement).value;
    pintarTodo();
  });
  $<HTMLSelectElement>('#f-cuant').addEventListener('change', (e) => {
    estado.cuant = (e.target as HTMLSelectElement).value;
    pintarTodo();
  });
  $<HTMLInputElement>('#f-completos').addEventListener('change', (e) => {
    estado.completos = (e.target as HTMLInputElement).checked;
    pintarTodo();
  });
  document.querySelectorAll<HTMLButtonElement>('.pestanas button').forEach((b) =>
    b.addEventListener('click', () => {
      estado.metrica = b.dataset.metrica as Metrica;
      document.querySelectorAll('.pestanas button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      tips.clear();
      pintarRanking();
      pintarDispersion();
      pintarDesglose();
    }),
  );
  $<HTMLSelectElement>('#sel-modelo').addEventListener('change', (e) =>
    seleccionar((e.target as HTMLSelectElement).value, false),
  );
  document.querySelectorAll<HTMLButtonElement>('th button').forEach((b) =>
    b.addEventListener('click', () => {
      const col = b.dataset.col as string;
      estado.orden = estado.orden.col === col ? { col, asc: !estado.orden.asc } : { col, asc: ['nombre', 'cuantizacion', 'equipo'].includes(col) };
      pintarTabla();
    }),
  );
  const cuerpo = $('#cuerpo-tabla');
  cuerpo.addEventListener('click', (e) => {
    const tr = (e.target as Element).closest('tr[data-id]');
    if (tr) seleccionar(tr.getAttribute('data-id') as string, true);
  });
  cuerpo.addEventListener('keydown', (e) => {
    const tr = (e.target as Element).closest('tr[data-id]');
    if (tr && e.key === 'Enter') seleccionar(tr.getAttribute('data-id') as string, true);
  });

  $('#boton-tema').addEventListener('click', () => {
    const raiz = document.documentElement;
    const oscuro =
      raiz.dataset.theme === 'dark' || (!raiz.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    raiz.dataset.theme = oscuro ? 'light' : 'dark';
    try {
      localStorage.setItem('tema', raiz.dataset.theme);
    } catch {
      /* sin almacenamiento */
    }
  });

  for (const id of ['#g-ranking', '#g-dispersion', '#g-desglose']) conectarTips($(id));

  let pendiente = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(pendiente);
    pendiente = requestAnimationFrame(() => {
      tips.clear();
      pintarRanking();
      pintarDispersion();
      pintarDesglose();
    });
  });
  ro.observe($('main'));

  pintarTodo();
}
