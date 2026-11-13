# Genera el registro de almacén de la prueba 8 y calcula la respuesta correcta.
# No hace falta ejecutarlo: el resultado ya está en prueba08_registro.txt y en SOLUCIONES.md.
import random

random.seed(20261113)
OBJ = "taco de 8 mm"
STOCK_INICIAL = 500

# Movimientos clave del producto objetivo: (dia, hora, tipo, almacen, unidades, ref)
clave = [
    (2, "08:41", "SALIDA", "A", 60, "pedido 4471"),
    (3, "11:05", "ENTRADA", "A", 200, "albarán PR-2290"),
    (4, "16:30", "SALIDA", "B", 120, "pedido 4502"),        # otro almacén: no cuenta
    (5, "09:12", "SALIDA", "A", 35, "pedido 4519"),
    (6, "13:47", "DEVOLUCIÓN", "A", 15, "devolución pedido 4519"),
    (8, "10:02", "SALIDA", "A", 140, "pedido 4560"),
    (9, "17:20", "SALIDA", "A", 25, "pedido 4588"),
    (11, "08:15", "ENTRADA", "A", 100, "albarán PR-2341"),
    (12, "12:33", "SALIDA", "A", 80, "pedido 4610"),
    (14, "18:55", "SALIDA", "A", 45, "pedido 4655"),
    (15, "07:58", "SALIDA", "A", 90, "pedido 4671"),         # después del día 14: no cuenta
]
# Nota de corrección: el pedido 4471 (día 2) fue de 40, no de 60.
CORRECCION = {"pedido 4471": 40}

distractores = ["taco de 6 mm", "tornillo M6", "tuerca M6", "arandela M6", "brida 200 mm", "taco de 10 mm"]
operarios = ["Marta", "Jordi", "Laia", "Sergi", "Núria", "Pau"]

lineas = []
for (d, h, t, a, u, ref) in clave:
    lineas.append((d, h, t, a, OBJ, u, ref))
for d in range(1, 21):
    for _ in range(random.randint(5, 8)):
        prod = random.choice(distractores)
        t = random.choices(["SALIDA", "ENTRADA", "DEVOLUCIÓN"], [6, 3, 1])[0]
        u = random.choice([10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200])
        a = random.choices(["A", "B"], [3, 1])[0]
        h = f"{random.randint(7, 19):02d}:{random.randint(0, 59):02d}"
        ref = (f"pedido {random.randint(4400, 4700)}" if t == "SALIDA" else
               f"albarán PR-{random.randint(2200, 2400)}" if t == "ENTRADA" else
               f"devolución pedido {random.randint(4400, 4700)}")
        lineas.append((d, h, t, a, prod, u, ref))
lineas.sort(key=lambda x: (x[0], x[1]))

out = ["REGISTRO DE MOVIMIENTOS · FERRETERÍA INDUSTRIAL VALLÈS · NOVIEMBRE 2026",
       "Formato: fecha hora | tipo | almacén | producto | unidades | referencia | operario", ""]
nota_puesta = False
for (d, h, t, a, p, u, ref) in lineas:
    out.append(f"{d:02d}/11/2026 {h} | {t} | Almacén {a} | {p} | {u} uds | {ref} | {random.choice(operarios)}")
    if d == 10 and not nota_puesta and h > "12:00":
        out.append("NOTA 10/11/2026 12:40: el pedido 4471 del día 2 se registró mal. La salida real de taco de 8 mm "
                   "fue de 40 uds, no de 60. No se modifica la línea original; aplicar esta corrección al calcular el stock.")
        nota_puesta = True
open("prueba08_registro.txt", "w", encoding="utf-8").write("\n".join(out) + "\n")

stock = STOCK_INICIAL
for (d, h, t, a, u, ref) in clave:
    if a != "A" or d > 14:
        continue
    u = CORRECCION.get(ref, u)
    stock += -u if t == "SALIDA" else u
print("líneas:", len(out), "· respuesta prueba 8 (stock almacén A al cierre del 14):", stock)
