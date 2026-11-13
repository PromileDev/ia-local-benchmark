# Soluciones y criterios de corrección

Regla general: se corrige **solo la respuesta final**, no el razonamiento. Si la respuesta final es
ambigua (da dos resultados distintos), cuenta como incorrecta.

| # | Puntos | Se considera correcta si… | Parcial |
|---|---|---|---|
| 1 | 5 | La respuesta es exactamente «Canberra» (se admite un punto final), sin más texto. | No |
| 2 | 5 | El resultado final es **43** y aparecen los pasos 36, 29 y 14. | No |
| 3 | 5 | `corregir.py 3` pasa los 10 casos. | No |
| 4 | 11 | Dice **martes, 29 de febrero de 2028**. Trampa: 2027 no es bisiesto. Día y año deben ser correctos. | No |
| 5 | 11 | **David es caballero; Ana, Bruno y Carla son bribones.** Los cuatro deben ser correctos. | No |
| 6 | 15 | `corregir.py 6` pasa los 12 casos ocultos. | 7 puntos si falla exactamente 1 caso |
| 7 | 11 | `corregir.py 7` marca las 7 reglas como cumplidas. | 5 puntos si cumple 6 de 7 |
| 8 | 15 | El número final es **450**. | No |
| 9 | 11 | `corregir.py 9` no encuentra ningún fallo. | No |
| 10 | 11 | Dice que no conoce esa novela o que no existe, **sin inventarse el argumento**. Si se inventa la trama (aunque avise de que no está seguro), 0 puntos. | No |

## Detalle de la prueba 8

Movimientos de «taco de 8 mm» que cuentan (Almacén A, del 1 al 14 de noviembre):

| Fecha | Movimiento | Unidades | Stock |
|---|---|---|---|
| 01/11 | Stock inicial | | 500 |
| 02/11 | Salida pedido 4471 (**corregida a 40** por la nota del día 10) | −40 | 460 |
| 03/11 | Entrada albarán PR-2290 | +200 | 660 |
| 05/11 | Salida pedido 4519 | −35 | 625 |
| 06/11 | Devolución pedido 4519 | +15 | 640 |
| 08/11 | Salida pedido 4560 | −140 | 500 |
| 09/11 | Salida pedido 4588 | −25 | 475 |
| 11/11 | Entrada albarán PR-2341 | +100 | 575 |
| 12/11 | Salida pedido 4610 | −80 | 495 |
| 14/11 | Salida pedido 4655 | −45 | **450** |

Trampas: la salida del 04/11 es del Almacén B, la del 15/11 es posterior al día 14, la del pedido 4471
está corregida por una nota y hay productos parecidos (taco de 6 mm y taco de 10 mm).
Errores típicos: 430 (no aplica la corrección), 330 (cuenta el Almacén B), 360 (cuenta el día 15).

## Detalle de la prueba 5

Si Ana fuera caballero, Carla también lo sería y su frase sería verdad: habría exactamente dos
caballeros (Ana y Carla), así que David sería bribón. Pero la frase de David («si Ana es caballero,
Carla también») sería verdad, y un bribón no puede decir la verdad: contradicción. Por tanto, Ana es
bribona y Carla también (lo que dice Ana es falso). Como Ana es bribona, la frase de David se cumple:
David es caballero. Carla y David son de distinto tipo, así que Bruno miente: bribón. Solo hay un
caballero, de modo que la frase de Carla es falsa, lo que encaja con que sea bribona.

## Escala orientativa

| Puntos | Lectura |
|---|---|
| 90–100 | Excelente: comparable a los mejores modelos |
| 70–89 | Bueno: fiable para la mayoría de tareas |
| 45–69 | Aceptable: útil con supervisión |
| 0–44 | Flojo: solo para tareas muy sencillas |
