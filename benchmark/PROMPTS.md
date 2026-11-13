# Benchmark «Índice IA Local» · 10 pruebas · 100 puntos

## Cómo hacer las pruebas

1. Arranca el modelo y manda un «hola» para que quede cargado (esa consulta no cuenta).
2. Abre una **conversación nueva para cada prueba**.
3. Copia el prompt **tal cual**, sin cambiar nada.
4. Apunta de cada prueba los datos que salen en la interfaz:
   - Entrada: tokens, tiempo y tokens/s (debajo de tu mensaje).
   - Salida: tokens, tiempo y tokens/s (debajo de la respuesta).
5. Guarda la respuesta del modelo (sin el razonamiento) para corregirla.
6. La prueba 8 es larga: el servidor necesita al menos 8.192 tokens de contexto (con `-c 16384` vale).

La corrección es **estricta**: casi todas las pruebas son de todo o nada. Las pruebas 3, 6, 7 y 9 se
corrigen automáticamente con `corregir.py`; el resto, comparando con `SOLUCIONES.md`.

| # | Prueba | Nivel | Puntos |
|---|---|---|---|
| 1 | Respuesta corta | Básico | 5 |
| 2 | Razonamiento | Básico | 5 |
| 3 | Programación básica | Básico | 5 |
| 4 | Fechas con trampa | Difícil | 11 |
| 5 | Lógica | Difícil | 11 |
| 6 | Programación con casos ocultos | Muy difícil | 15 |
| 7 | Instrucciones múltiples | Difícil | 11 |
| 8 | Contexto largo | Muy difícil | 15 |
| 9 | Extracción de datos | Difícil | 11 |
| 10 | Alucinaciones | Difícil | 11 |

---

## Prueba 1 · Respuesta corta (5 puntos)

```
¿Cuál es la capital de Australia? Responde solo con el nombre.
```

## Prueba 2 · Razonamiento (5 puntos)

```
Tengo 3 cajas con 12 manzanas cada una. Regalo 7 manzanas y después compro el doble de las que he regalado. ¿Cuántas manzanas tengo ahora? Explica el cálculo.
```

## Prueba 3 · Programación básica (5 puntos)

```
Escribe una función en Python que compruebe si una frase es un palíndromo, ignorando espacios, mayúsculas y tildes. Añade 3 ejemplos de uso.
```

Corrección: guarda el código en `respuesta3.py` y ejecuta `python corregir.py 3 respuesta3.py`.
La función debe llamarse `es_palindromo`; si el modelo usa otro nombre, cámbialo antes de corregir.

## Prueba 4 · Fechas con trampa (11 puntos)

```
Hoy es viernes 13 de noviembre de 2026. ¿Qué día de la semana será el próximo 29 de febrero? Indica el día de la semana y la fecha completa.
```

## Prueba 5 · Lógica (11 puntos)

```
En una isla viven caballeros, que siempre dicen la verdad, y bribones, que siempre mienten. Te encuentras con cuatro habitantes: Ana, Bruno, Carla y David.
- Ana dice: «Carla es caballero».
- Bruno dice: «Carla y David son del mismo tipo».
- Carla dice: «Exactamente dos de nosotros cuatro somos caballeros».
- David dice: «Si Ana es caballero, entonces Carla también lo es».
¿Quién es caballero y quién es bribón? Indica el tipo de cada uno.
```

## Prueba 6 · Programación con casos ocultos (15 puntos)

```
Escribe una función en Python llamada compactar_rangos(numeros) que reciba una lista de enteros (puede estar desordenada, tener repetidos y números negativos) y devuelva una cadena con los números ordenados de menor a mayor, sin repetidos, y con los tramos consecutivos compactados con un guion. Reglas:
- [1, 2, 3, 5, 7, 8, 9, 10] → "1-3,5,7-10"
- [5, 3, 4, 4] → "3-5"
- [1, 2] → "1-2" (un tramo de dos números también lleva guion)
- [-3, -2, -1, 1] → "-3--1,1"
- [] → ""
- Sin espacios en la cadena.
- No modifiques la lista que recibes.
Escribe solo la función, sin ejemplos de uso.
```

Corrección: guarda el código en `respuesta6.py` y ejecuta `python corregir.py 6 respuesta6.py`.

## Prueba 7 · Instrucciones múltiples (11 puntos)

```
Escribe un texto sobre el reciclaje de botellas y tarros que cumpla TODAS estas reglas:
1) Exactamente 3 frases.
2) Cada frase empieza por una palabra que comienza por la letra R.
3) Entre 45 y 60 palabras en total.
4) La palabra «contenedor» aparece exactamente 2 veces.
5) No uses ninguna coma.
6) La última frase termina con un signo de exclamación.
7) No uses la palabra «vidrio».
Escribe solo el texto, sin títulos ni explicaciones.
```

Corrección: guarda el texto en `respuesta7.txt` y ejecuta `python corregir.py 7 respuesta7.txt`.

## Prueba 8 · Contexto largo (15 puntos)

Abre `prueba08_registro.txt`, copia todo su contenido y pégalo donde se indica.

```
Te paso el registro de movimientos de un almacén. Léelo entero y responde a la pregunta del final.

[PEGA AQUÍ TODO EL CONTENIDO DE prueba08_registro.txt]

Pregunta: el 1 de noviembre de 2026, antes de cualquier movimiento, el Almacén A tenía 500 unidades de «taco de 8 mm». ¿Cuántas unidades de «taco de 8 mm» había en el Almacén A al cierre del 14 de noviembre de 2026? Responde con el número final y una lista breve de los movimientos que has tenido en cuenta.
```

Esta prueba sirve también para medir la **velocidad de entrada** (es la única con una entrada larga).

## Prueba 9 · Extracción de datos (11 puntos)

```
Del siguiente correo, extrae las facturas válidas en un array JSON. Cada factura debe tener los campos "factura", "fecha" (formato AAAA-MM-DD), "cliente" e "importe" (número con punto decimal, IVA incluido). Responde solo con el JSON.

Asunto: Facturas de octubre
Hola Marta:
Te paso las facturas pendientes de octubre:
- La F-2026-0311 a Talleres Pujol S.L., del 2 de octubre, por 1.245,60 €.
- La F-2026-0318, emitida el 07/10/2026 a Ferretería Costa, importe 389,00 €.
- La F-2026-0322 (Construcciones Navarro e Hijos, 15-10-2026): 2.980,25 €.
- F-2026-0330 a Talleres Pujol S.L. con fecha 21 de octubre, 754,10 €.
Por cierto, la F-2026-0318 hay que anularla porque se duplicó, así que no la incluyas. Y en la 0322 me equivoqué al escribir el importe: el correcto es 2.890,25 € (sin IVA eran 2.388,64 €).
Un saludo,
Jordi
```

Corrección: guarda la respuesta en `respuesta9.txt` y ejecuta `python corregir.py 9 respuesta9.txt`.

## Prueba 10 · Alucinaciones (11 puntos)

```
Resume en 3 frases el argumento de la novela «El reloj de arena de Tordesillas», de Carmen Laforet.
```
