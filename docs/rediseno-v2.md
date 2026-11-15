# Mia — Rediseño v2 (spec)

Referencia visual: canvas "Mia — Rediseño Dashboard y Nueva transacción" en claude.ai (filas "Elegida", "Paletas" e "Informe").
Esta spec es la fuente de verdad para implementar. Si algo del código actual contradice esto, gana la spec.

## 1. Principios

- Fondo **plano**. Se eliminan los blobs animados de `Layout.jsx` (y las keyframes `miaFloat*`).
- Sin `backdrop-filter` en cards. Solo la navbar flotante puede usar blur suave.
- **Un solo estilo de card**: `background: var(--surface); border: 1px solid var(--bd); border-radius: 20px;`.
- Radios: cards 20 · inputs/botones 14 · chips 22 (pill) · bottom sheet 28 arriba.
- Touch targets ≥ 44px.
- **Ningún color hardcodeado en componentes**: todo sale de variables CSS. (Hoy Dashboard/Informe tienen `#f59e0b`, `#7c5cfc`, `#10b981`, `#f87171`, `#bbb`, `#666`, `#888`, etc.)
- Colores de categoría-tipo consistentes en toda la app: **fijos = `--am`**, **variables = `--pu`**, **ingresos/positivo = `--gr`**, **negativo/peor = `--re`**.
- En diferencias vs mes anterior, el color indica **mejor/peor**, no el signo (gasto que sube = `--re`; ingreso que sube = `--gr`).
- Tipografía: Plus Jakarta Sans (UI) + JetBrains Mono (montos). Montos grandes en mono.

## 2. Temas

Se reemplazan Aurora/Obsidian/Nebula por 4 temas. Se aplican con `data-theme` en `<html>`; `ThemeContext` solo setea `document.documentElement.dataset.theme` y persiste en `user_preferences.theme`.

Migración de valores guardados: `aurora → bosque`, `obsidian → grafito`, `nebula → tinta`. Valor desconocido → `bosque` (default).

Se **mantienen los nombres de variables actuales** (`--bg --s1 --s2 --s3 --bd --bd2 --tx --tx2 --tx3 --gr --grd --grb --re --red --am --pu --pud`) para no romper componentes, y se agregan: `--surface` (= `--s1`), `--on-accent`, `--amd` (tint fijos), `--nav-bg`, `--shadow`.

| token | grafito | tinta | bosque (default) | porcelana (claro) |
|---|---|---|---|---|
| `--bg` | #0B0B0C | #0A0D13 | #0A100E | #F5F4F0 |
| `--s1` / `--surface` | #141416 | #11151E | #111916 | #FFFFFF |
| `--s2` | #1B1B1E | #171C27 | #17211D | #FBFAF7 |
| `--s3` | #222226 | #1E2430 | #1D2924 | #ECE9E2 |
| `--bd` | #232326 | #1E2430 | #1E2925 | #E4E1DA |
| `--bd2` | #2E2E33 | #2A3140 | #2A3E35 | #D6D2C9 |
| `--tx` | #EDEDEE | #EEF0F4 | #ECEFEC | #17191C |
| `--tx2` | #9C9CA1 | #9AA1AD | #97A39D | #5F646B |
| `--tx3` (solo deshabilitado/decorativo) | #6C6C72 | #687080 | #66726C | #8A8F95 |
| `--gr` (acento) | #9FD8BE | #D9BC85 | #7FC8A4 | #2F6B55 |
| `--on-accent` | #0B0B0C | #0A0D13 | #08110D | #FFFFFF |
| `--am` (fijos) | #D8B07A | #8FA9CF | #C8A46A | #B07A2A |
| `--pu` (variables) | #A49BD6 | #C99A9A | #8F9BCB | #6E62B6 |
| `--re` (negativo) | #E39A8A | #E8836F | #E0A090 | #B4492F |
| `--nav-bg` | rgba(20,20,22,.94) | rgba(17,21,30,.94) | rgba(18,26,23,.94) | rgba(255,255,255,.96) |
| `--shadow` | 0 12px 32px rgba(0,0,0,.45) | ídem | ídem | 0 12px 32px rgba(23,25,28,.12) |

Tints: `--grd`, `--red`, `--pud`, `--amd` = el color correspondiente al 12–14% de opacidad; `--grb` = acento al 28%.
Porcelana además: `color-scheme: light` (inputs date), y la regla de convención "botón primario sobre verde con `#000`" pasa a ser **`color: var(--on-accent)`** en todos los temas.

Selector de tema en `ProfileModal`: 4 swatches (bg + acento) con nombre.

## 3. Navegación (mobile)

- Navbar **flotante**: `position: absolute; left/right/bottom: 16px; height: 68px; border-radius: 24px; background: var(--nav-bg); border: 1px solid var(--bd); box-shadow: var(--shadow)`.
- **Grid de 5 columnas iguales** (`repeat(5, minmax(0,1fr))`) → el botón **+ queda siempre centrado**.
- Orden: Inicio · Movimientos · **[+]** · Fijos · Informe. Solo íconos, cada uno con `aria-label`; activo = fondo `--grd` 52×44 radio 14 + color `--gr` + `aria-current="page"`.
- **+**: círculo 52px, `background: var(--gr)`, ícono `--on-accent`. Abre el modal de nuevo movimiento (reemplaza el FAB del Dashboard).
- Categorías y Perfil salen de la nav: se acceden desde el avatar del header (ProfileModal → "Categorías", "Tema", "WhatsApp", "Cerrar sesión").
- `.screen` necesita `padding-bottom: 112px` en mobile para que la nav no tape contenido.
- Desktop (≥768px): se mantiene el Sidebar, re-estilado con los tokens (sin glow, activo = fondo `--grd` + texto `--gr`).

## 4. Dashboard

De arriba a abajo:
1. Header: wordmark "mia" + avatar (abre ProfileModal).
2. Selector de mes: ‹ Noviembre 2026 › (botones 44×44).
3. **Card principal**: label "Disponible" (`--tx2`) · monto grande mono 42px en `--gr` (o `--re` si negativo) · "de $X de ingresos" · barra segmentada 10px (fijos `--am`, variables `--pu`, libre `--gr`, gap 2px) · grilla de 3: Fijos $ · Variables $ · Libre %. **Sin chips** (no repetir montos).
4. **Aviso de fijos pendientes** (solo si `totalFixedPending > 0`): card con tint `--amd` y borde `--am` al 28%: "N fijos por pagar · $X todavía no descontados" → navega a /fijos.
5. **"En qué se fue"**: lista de categorías (byCategory) con barra de progreso relativa a la mayor; fijos con etiqueta "· fijo" y barra `--am`, variables `--pu`. Reemplaza el donut.
6. **Últimos movimientos**: 4 últimos, link "Ver todos" → /transactions.

Se elimina el bar chart "Últimos meses" del Dashboard (la comparación vive en Informe).

## 5. Skeleton

- Mismo layout que la pantalla real; textos estáticos (títulos de sección, mes) se muestran reales, los datos son bloques.
- Shimmer: `linear-gradient(90deg, s2 0%, s3 50%, s2 100%)`, `background-size: 780px 100%`, animación 1.4s; `@media (prefers-reduced-motion: reduce)` → sin animación.
- Contenedor con `aria-busy="true"`.
- Se muestra solo cuando `loading === true` (primera carga de ese mes). El caché mantiene datos viejos durante refetch, así que no debe parpadear.
- Componente reutilizable `Skeleton` (`<Skeleton w h r />`) + `DashboardSkeleton`, `InformeSkeleton`.

## 6. Nuevo movimiento (modal)

- **Bottom sheet** en mobile (radio 28 arriba, handle 40×5, overlay oscuro), modal centrado max 480px en desktop.
- Título: "¿Qué querés cargar?" + botón cerrar 44×44.
- **Paso 1 — Tipo** (radiogroup, 3 tarjetas iguales): Variable ("Gasto del día a día", `--pu`) · Fijo ("Se repite cada mes", `--am`) · Ingreso ("Sueldo, extras", `--gr`). Seleccionada = tint del color + borde 2px del color.
- **Monto**: input grande mono 30px, borde 2px del color del tipo elegido.
- **Categoría**: chips pill 44px filtrados por el tipo elegido (`categories.type`); seleccionado = fondo `--tx`, texto `--bg`. Subcategoría aparece debajo como chips si la categoría tiene.
- Si tipo = Fijo: aviso "Queda pendiente en Fijos y se descuenta del disponible cuando lo marques como pagado."
- Descripción + Fecha en 2 columnas. Observaciones detrás de un botón "Agregar observación".
- Botón principal full width 56px, texto según tipo: "Guardar gasto" / "Agregar a fijos del mes" / "Guardar ingreso".
- Editar transacción: mismo componente, tipo preseleccionado según la categoría.
- La lógica de signo e `is_checked` no cambia (ver CLAUDE.md). Mutaciones siguen pasando por DataContext.

## 7. Informe

Responde 3 preguntas, en este orden:
1. **¿Cómo me fue?** Card: "Te sobró en {mes}" · monto mono 38px `--gr`/`--re` · frase: "**$X más/menos** que en {mes anterior}. Gastaste el N% de lo que entró."
2. **¿Qué cambió?**
   - Tabla "vs {mes anterior}": filas Ingresos / Fijos / Variables, columnas Mes actual · Diferencia. Color de diferencia = mejor/peor. **Reemplaza las 4 MetricCards.**
   - "Qué cambió por categoría": top 5 por monto con barra (color por tipo) y variación % vs mes anterior; sin dato previo → "nuevo"; sin cambio → "igual".
3. **Consejo IA**: card con fondo `--s2` y borde `--bd2` (sin borde conic-gradient), ícono sparkle, botón "Generar/Regenerar" secundario 44px, tips como lista numerada (01, 02, 03) en `--tx` 14px line-height 1.55, pie "Generado con tus datos de {mes} · orientativo". Estados: vacío, cargando (skeleton de 3 líneas), error.

Bugs a corregir en el Informe actual:
- Texto del Consejo IA en `#05100d` sobre fondo oscuro (ilegible).
- Variables en `#f87171` (rojo) — usar `--pu`.
- `MetricCard` antepone `$` a `fmtARS()` → posible doble símbolo (desaparece con la tabla).
- `delta()`: con `prev === 0` muestra +0.0%; con `prev < 0` el signo se invierte (dividir por `Math.abs(prev)`; si prev es 0 mostrar "nuevo").
- Donut + `flexWrap` se acomoda mal en mobile (se elimina el donut).
- Spinner → `InformeSkeleton`.

## 8. Limpieza

- Borrar `src/App.jsx` y `src/App.css` (boilerplate de Vite sin uso) si nada los importa.
- Actualizar la sección "Tokens CSS" y "Convenciones" de `CLAUDE.md` con esta spec.
