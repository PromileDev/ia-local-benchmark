"""
Corrector automático del benchmark «Índice IA Local».

Uso:
    python corregir.py 3 respuesta3.py     # código de la prueba 3 (debe definir es_palindromo)
    python corregir.py 6 respuesta6.py     # código de la prueba 6 (debe definir compactar_rangos)
    python corregir.py 7 respuesta7.txt    # texto de la prueba 7
    python corregir.py 9 respuesta9.txt    # JSON de la prueba 9

Pega en el archivo SOLO la respuesta del modelo (sin el razonamiento).
Las pruebas 3 y 6 ejecutan el código que ha escrito el modelo: revísalo antes.
"""
import json
import re
import sys


def cargar_funcion(ruta, nombre):
    codigo = open(ruta, encoding="utf-8").read()
    codigo = re.sub(r"^```[a-zA-Z]*\s*|```\s*$", "", codigo.strip(), flags=re.M)
    ns = {}
    exec(compile(codigo, ruta, "exec"), ns)
    if nombre not in ns:
        raise SystemExit(f"El código no define la función {nombre}().")
    return ns[nombre]


def prueba3(ruta):
    f = cargar_funcion(ruta, "es_palindromo")
    casos = [("Dábale arroz a la zorra el abad", True), ("Anita lava la tina", True), ("Hola mundo", False),
             ("Sé verlas al revés", True), ("Luz azul", True), ("Yo hago yoga hoy", True),
             ("Amor a Roma", True), ("ÁNA", True), ("Programación", False), ("Ésa", False)]
    fallos = [(repr(t), f"esperado {e}, obtenido {f(t)}") for t, e in casos if f(t) != e]
    return informe(3, len(casos), fallos, 5 if not fallos else 0)


def prueba6(ruta):
    f = cargar_funcion(ruta, "compactar_rangos")
    casos = [([1, 2, 3, 5, 7, 8, 9, 10], "1-3,5,7-10"), ([], ""), ([7], "7"), ([5, 3, 4, 4], "3-5"),
             ([1, 2], "1-2"), ([-3, -2, -1, 1], "-3--1,1"), ([10, 1, 1, 1, 3, 2, 9, 8], "1-3,8-10"),
             ([-1, 0, 1], "-1-1"), ([0, 2, 4], "0,2,4"), ([100, -100], "-100,100"),
             (list(range(1000)), "0-999")]
    fallos = []
    for entrada, esperado in casos:
        copia = list(entrada)
        try:
            r = f(copia)
        except Exception as e:  # noqa: BLE001
            r = f"ERROR: {e!r}"
        if r != esperado:
            fallos.append((entrada if len(entrada) < 20 else "range(1000)", f"esperado {esperado!r}, obtenido {r!r}"))
    original = [3, 1, 2]
    f(original)
    if original != [3, 1, 2]:
        fallos.append(("[3, 1, 2]", "la función modifica la lista original"))
    total = len(casos) + 1
    pts = 15 if not fallos else 7 if len(fallos) == 1 else 0
    return informe(6, total, fallos, pts)


def prueba7(ruta):
    texto = open(ruta, encoding="utf-8").read().strip()
    frases = [s.strip() for s in re.split(r"(?<=[.!?])\s+", texto) if s.strip()]
    palabras = re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+", texto)
    reglas = {
        "1) Exactamente 3 frases": len(frases) == 3,
        "2) Cada frase empieza por R": all(re.sub(r"^[¡¿«\"'(\s]+", "", s)[:1].lower() == "r" for s in frases),
        "3) Entre 45 y 60 palabras": 45 <= len(palabras) <= 60,
        "4) «contenedor» exactamente 2 veces": len(re.findall(r"\bcontenedor\b", texto, flags=re.I)) == 2,
        "5) Ninguna coma": "," not in texto,
        "6) Termina con «!»": texto.endswith("!"),
        "7) No usa «vidrio»": not re.search(r"vidrio", texto, flags=re.I),
    }
    print(f"Frases: {len(frases)} · Palabras: {len(palabras)}")
    for r, ok in reglas.items():
        print(("  OK   " if ok else "  FALLA ") + r)
    cumplidas = sum(reglas.values())
    pts = 11 if cumplidas == 7 else 5 if cumplidas == 6 else 0
    print(f"\nPrueba 7: {cumplidas}/7 reglas → {pts} / 11 puntos")
    return pts


def norm(s):
    return re.sub(r"[\s.]", "", str(s)).lower()


def prueba9(ruta):
    bruto = open(ruta, encoding="utf-8").read().strip()
    bruto = re.sub(r"^```[a-zA-Z]*\s*|```\s*$", "", bruto, flags=re.M).strip()
    esperado = {
        "F-2026-0311": ("2026-10-02", "Talleres Pujol S.L.", 1245.60),
        "F-2026-0322": ("2026-10-15", "Construcciones Navarro e Hijos", 2890.25),
        "F-2026-0330": ("2026-10-21", "Talleres Pujol S.L.", 754.10),
    }
    fallos = []
    try:
        datos = json.loads(bruto)
    except json.JSONDecodeError as e:
        fallos.append(("JSON", f"no es JSON válido o hay texto fuera del JSON ({e.msg})"))
        return informe(9, 1, fallos, 0)
    if not isinstance(datos, list) or len(datos) != 3:
        fallos.append(("número de facturas", f"se esperaban 3, hay {len(datos) if isinstance(datos, list) else 'no es una lista'}"))
    else:
        for fac in datos:
            fid = fac.get("factura")
            if fid not in esperado:
                fallos.append((fid, "factura inesperada (¿incluye la anulada?)"))
                continue
            fecha, cliente, importe = esperado[fid]
            if fac.get("fecha") != fecha:
                fallos.append((fid, f"fecha {fac.get('fecha')!r}, debía ser {fecha}"))
            if norm(fac.get("cliente")) != norm(cliente):
                fallos.append((fid, f"cliente {fac.get('cliente')!r}"))
            imp = fac.get("importe")
            if not isinstance(imp, (int, float)) or abs(imp - importe) > 0.001:
                fallos.append((fid, f"importe {imp!r}, debía ser {importe}"))
    return informe(9, 1, fallos, 11 if not fallos else 0)


def informe(n, total, fallos, pts):
    maximo = {3: 5, 6: 15, 9: 11}[n]
    if fallos:
        print(f"Fallos ({len(fallos)}):")
        for caso, detalle in fallos:
            print(f"  · {caso}: {detalle}")
    else:
        print("Todo correcto.")
    print(f"\nPrueba {n}: {pts} / {maximo} puntos")
    return pts


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in {"3", "6", "7", "9"}:
        raise SystemExit(__doc__)
    {"3": prueba3, "6": prueba6, "7": prueba7, "9": prueba9}[sys.argv[1]](sys.argv[2])
