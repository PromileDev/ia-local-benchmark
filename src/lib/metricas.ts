// Tipos y cálculo de métricas. Se usa tanto al compilar (Astro) como en el navegador.

export interface Medida {
  tokens: number;
  segundos: number;
  tps: number;
  tpsCalculada?: boolean;
}

export interface ResultadoPrueba {
  puntos: number;
  entrada: Medida | null;
  salida: Medida | null;
  nota?: string;
}

export interface Modelo {
  id: string;
  nombre: string;
  familia: string;
  cuantizacion: string;
  tamanoGB: number;
  parametros: string;
  arquitectura: string;
  razonamiento: boolean;
  licencia: string;
  equipo: string;
  motor: string;
  fecha: string;
  pruebas: Record<string, ResultadoPrueba | null>;
}

export interface Prueba {
  id: string;
  nombre: string;
  categoria: string;
  nivel: 'Básico' | 'Difícil' | 'Muy difícil';
  puntos: number;
  prompt: string;
  correccion: string;
}

export interface Resumen {
  modelo: Modelo;
  indice: number;            // puntos obtenidos
  pendientes: number;        // puntos de las pruebas que faltan por hacer
  completadas: number;
  total: number;
  provisional: boolean;
  velSalida: number | null;  // mediana de tokens/s de salida
  velEntrada: number | null; // tokens/s de entrada (prueba 8 si existe)
  velEntradaFuente: 'larga' | 'cortas' | null;
  tokensSalida: number;
  tiempoTotal: number;       // segundos (entrada + salida) de las pruebas hechas
  conVelocidad: number;      // pruebas hechas con datos de velocidad
}

// Orden fijo de colores por familia (nunca se reasigna al filtrar).
export const FAMILIAS = ['Qwen', 'Gemma', 'Llama', 'Mistral', 'gpt-oss', 'Phi', 'DeepSeek', 'Granite'];

export function slotFamilia(familia: string): number {
  const i = FAMILIAS.findIndex((f) => f.toLowerCase() === familia.toLowerCase());
  return i === -1 ? 0 : i + 1; // 0 = «Otros» (gris)
}

export function mediana(valores: number[]): number | null {
  if (!valores.length) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export function resumir(modelo: Modelo, pruebas: Prueba[]): Resumen {
  let indice = 0, pendientes = 0, completadas = 0, tokensSalida = 0, tiempoTotal = 0, conVelocidad = 0;
  const tpsSalida: number[] = [];
  const tpsEntrada: number[] = [];
  let entradaLarga: number | null = null;

  for (const p of pruebas) {
    const r = modelo.pruebas[p.id];
    if (!r) {
      pendientes += p.puntos;
      continue;
    }
    completadas++;
    indice += r.puntos;
    if (r.salida || r.entrada) conVelocidad++;
    if (r.salida) {
      tpsSalida.push(r.salida.tps);
      tokensSalida += r.salida.tokens;
      tiempoTotal += r.salida.segundos;
    }
    if (r.entrada) {
      tpsEntrada.push(r.entrada.tps);
      tiempoTotal += r.entrada.segundos;
      if (p.id === '8') entradaLarga = r.entrada.tps;
    }
  }

  const velEntrada = entradaLarga ?? mediana(tpsEntrada);
  return {
    modelo,
    indice,
    pendientes,
    completadas,
    total: pruebas.length,
    provisional: completadas < pruebas.length,
    velSalida: mediana(tpsSalida),
    velEntrada,
    velEntradaFuente: entradaLarga !== null ? 'larga' : velEntrada !== null ? 'cortas' : null,
    tokensSalida,
    tiempoTotal,
    conVelocidad,
  };
}

const nf1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

export const fmt = {
  tps: (v: number | null) => (v === null ? '—' : `${nf1.format(v)} t/s`),
  num: (v: number) => nf0.format(v),
  dec: (v: number) => nf1.format(v),
  tiempo: (s: number) => {
    if (s < 60) return `${nf1.format(s)} s`;
    const m = Math.floor(s / 60);
    const r = Math.round(s - m * 60);
    return `${m} min ${r} s`;
  },
  fecha: (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
};
