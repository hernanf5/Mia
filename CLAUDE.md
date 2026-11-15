# Mia — Contexto del proyecto

Expense tracker personal. App mobile-first, deployada en Vercel.

## Stack

- **React 19** + Vite 5
- **React Router v7** — SPA, rutas manejadas client-side (vercel.json con rewrite)
- **Supabase** — auth + base de datos (PostgreSQL con RLS)
- **Recharts** — dependencia instalada pero sin uso desde el rediseño v2 (Dashboard usa barras HTML)
- **CSS custom properties** — sistema de tokens en `src/index.css` (sin framework CSS)

## Comandos

```bash
npm run dev      # dev server
npm run build    # build producción
npm run preview  # preview del build
```

## Estructura

```
src/
  pages/        Dashboard, Transactions, Fijos, Informe, Categories, Login
  components/   Layout, BottomNav, Sidebar, TransactionModal, ProfileModal,
                CategoryModal, SubcategoryModal, ConfirmModal, ProtectedRoute,
                Skeleton (Skeleton, DashboardSkeleton, InformeSkeleton), navIcons
  hooks/        useDashboard, useTransactions, useCategories
  context/      AuthContext (useAuth → user, signIn, signUp, signOut)
                ThemeContext (useTheme → theme, setTheme, loadingTheme; THEMES)
                DataContext (useData, useMonthTransactions, useMonthsTransactions)
  lib/          supabaseClient.js, fmt.js (fmtARS), metrics.js (computeMetrics),
                transactionStore.js (caché), categoryTypes.js (tipo por nombre de categoría)
docs/
  rediseno-v2.md  spec del rediseño (fuente de verdad visual)
api/
  advice.js     consejos financieros con Groq
  whatsapp.js   webhook Twilio para registrar gastos por WhatsApp
```

## Temas y tokens CSS (src/index.css)

Spec completa: `docs/rediseno-v2.md`. 4 temas vía `data-theme` en `<html>`: **bosque** (default), grafito, tinta, porcelana (claro).
`ThemeContext` solo setea `document.documentElement.dataset.theme` y persiste en `user_preferences.theme`
(+ copia en `localStorage['mia-theme']` que `index.html` aplica antes del primer paint). Valores viejos se migran:
`aurora→bosque`, `obsidian→grafito`, `nebula→tinta`, desconocido→`bosque`.

```
--bg  --s1(=--surface)  --s2  --s3      fondo y superficies
--bd  --bd2                             bordes sutil / visible
--tx  --tx2  --tx3                      texto primario / secundario / solo deshabilitado
--gr  --grd  --grb                      acento (ingresos, positivo, acción primaria) + tint 13% / borde 28%
--on-accent                             texto/ícono sobre --gr
--am  --amd                             fijos + tint
--pu  --pud                             variables + tint
--re  --red                             negativo / peor + tint
--nav-bg  --shadow  --overlay           navbar, sombra elevada, fondo de modales
```

- Los valores por tema están en la tabla de la spec §2; los tints se derivan con `color-mix()`.
- `[data-theme="x"]` funciona en cualquier elemento (los swatches del ProfileModal lo usan para previsualizar).

## Layout

- Shell mobile: `max-width: 430px`, centrado, `BottomNav` = navbar flotante (grid de 5: Inicio · Movimientos · **+** · Fijos · Informe). El **+** abre `TransactionModal`
- Categorías y Perfil no están en la nav mobile: el avatar del header del Dashboard abre `ProfileModal` (Categorías, Tema, WhatsApp, Cerrar sesión). `ProfileModal` maneja signOut y navegación por su cuenta
- Desktop (≥768px): `Sidebar` con botón "Nuevo movimiento" + links (incluye Categorías) + avatar → `ProfileModal`. La navbar inferior se oculta
- `.screen` tiene `padding-bottom: 112px` en mobile para no quedar tapado por la nav; layouts sin `.screen` usan `<div className="nav-spacer" />`
- Íconos de navegación compartidos en `components/navIcons.jsx`
- Rutas protegidas via `ProtectedRoute` (redirige a `/login` si no hay sesión)
- `Layout` renderiza: `<Outlet />` + `<BottomNav />`
- `StatusBar` eliminada (era decorativa, elementos de mockup mobile)
- Fondo plano `var(--bg)` (sin blobs animados)
- `.shell { position: relative }` — base para posicionamiento interno

## Convenciones de código

- **Estilos**: inline JS objects (`const s = { ... }`) en cada componente, sin clases CSS salvo globales
- **Tokens en inline styles**: usar `'var(--token)'` como string
- **onFocus/onBlur** con CSS vars: usar `e.target.style.setProperty('border-color', 'var(--gr)')` — NO `style.borderColor =` (no acepta custom properties)
- **Formateo de moneda**: importar `fmtARS` de `src/lib/fmt.js` — NO definir localmente
- **Modales / overlays**: `zIndex: 200` para overlay, `zIndex: 100` es BottomNav
- **TransactionModal** (spec §6): bottom sheet en mobile / modal centrado en desktop con las clases `.sheet-overlay` `.sheet` `.sheet-handle` (index.css). Tipo Variable/Fijo/Ingreso filtra las categorías (chips) que vienen de `useData().categories`; al editar se preselecciona por `transaction.category.type`. Signo, `is_checked` y mutaciones sin cambios
- **FABs**: usar `className="fab-r"` + omitir `right` y `bottom` del inline style (la clase los ubica por encima de la nav flotante y maneja desktop)
- **Ningún color hardcodeado** en componentes: todo sale de tokens. Alpha de un token: `color-mix(in srgb, var(--re) 25%, transparent)`. Excepción: `category.color` (dato del usuario, hex)
- **Colores por tipo**: fijos = `--am`, variables = `--pu`, ingresos/positivo = `--gr`, negativo/peor = `--re`
- **Botón primario sobre acento**: siempre `color: 'var(--on-accent)'` (nunca `#000`/`#fff`: porcelana usa texto blanco)
- **Cards**: `.card` / `.tx-r` → `var(--surface)` + borde `var(--bd)` + radio 20, sin `backdrop-filter` (solo la nav puede usar blur)
- **Radios**: cards 20 · inputs/botones 14 · chips 22 (pill) · bottom sheet 28 arriba
- **Touch targets ≥ 44px** (botones de mes, cerrar, chips, links tipo "Ver todos")
- **Tipografía**: Plus Jakarta Sans (UI) + JetBrains Mono (`className="mono"`) para montos; montos grandes siempre en mono
- **Diferencias vs mes anterior**: el color indica **mejor/peor**, no el signo (gasto que sube = `--re`, ingreso que sube = `--gr`, sin cambio = `--tx2`)
- **Variación %**: si el valor previo es 0 no hay % → mostrar "nuevo" (o "igual" si ambos son 0); si es negativo dividir por `Math.abs(prev)`
- **Skeletons**: `<Skeleton w h r />` + clase `.skel` (shimmer, sin animación con `prefers-reduced-motion`). Mostrar solo cuando `loading === true` (primera carga del mes), contenedor con `aria-busy="true"`
- **Labels de formularios**: siempre con `htmlFor` + `id` en el input correspondiente

## Lógica de negocio crítica

### Gastos fijos (tipo `fixed`)
- `is_checked = false` → pendiente, NO se descuenta del saldo disponible
- `is_checked = true` → pagado, SÍ se descuenta
- `available = totalIncome - totalFixedPaid - totalVariable`
- "En qué se fue" y la barra segmentada solo incluyen fijos **pagados**

### Cálculos en useDashboard
- `computeMetrics()` devuelve: `totalIncome`, `totalFixedPaid`, `totalFixedPending`, `totalVariable`, `available`, `byCategory`
- **`totalFixed` NO existe en metrics** — usar siempre `totalFixedPaid`. `metrics?.totalFixed` da `undefined → 0`
- `byCategory` solo incluye: variables (todas) + fijos con `is_checked === true`

### Página Transactions
- Fijos con `is_checked === false` se filtran **antes** del typeFilter — no aparecen en ninguna vista
- Un gasto fijo solo es "gasto" cuando está checkeado; hasta entonces es compromiso pendiente (ver página Fijos)

### Dashboard (spec §4)
- `useDashboard` devuelve `{ metrics, transactions, loading }` del mes (sin historial; la comparación vive en Informe)
- Card principal: `available` mono 42px (`--gr` si ≥ 0, `--re` si < 0) · `de $X de ingresos` · barra segmentada fijos/variables/libre · grilla Fijos $ · Variables $ · Libre %. Sin chips
- Aviso de fijos pendientes solo si `totalFixedPending > 0` → link a `/fijos`
- "En qué se fue": `byCategory` con barra relativa a la mayor. El tipo (fijo/variable) se deriva de `transactions` porque `byCategory` no lo trae
- Últimos 4 movimientos excluyen fijos sin pagar (mismo criterio que Transactions)
- `loading === true` → `DashboardSkeleton` (`components/Skeleton.jsx`, `.skel` en index.css)
- `fmtARS` **no** aplica `Math.abs`: un negativo se muestra con `-`. Para montos de transacciones usar `fmtARS(Math.abs(amount))` y poner el signo a mano

### Informe (spec §7)
- Orden: **¿Cómo me fue?** ("Te sobró/faltó en {mes}" + frase vs mes anterior + % gastado) · **tabla vs {mes anterior}** (Ingresos/Fijos/Variables, columna Diferencia) · **Qué cambió por categoría** (top 5 de `byCategory` con barra por tipo y variación % vs el `byCategory` del mes anterior) · **Consejo IA**
- Sin datos del mes anterior (0 transacciones): no se compara ("Sin datos de {mes}", diferencias "—", categorías "nuevo")
- Consejo IA: estado por mes (`adviceByMonth[YYYY-M]`), así no se muestra el consejo de otro mes ni una respuesta tardía pisa la actual. Estados idle / loading (skeleton) / error / done. Lista numerada 01-02-03
- `api/advice.js` recibe `{ metrics, prevMetrics, month, year }` — no cambiar el contrato sin tocar el endpoint
- `typeByCategoryName(transactions)` (lib/categoryTypes) da el tipo de cada categoría de `byCategory` (lo usan Dashboard e Informe)

### DataContext — caché de transacciones
- Caché por mes (`YYYY-MM`) en `src/lib/transactionStore.js` (JS plano, sin React); `DataContext` lo instancia y re-renderiza vía `version`. **Toda mutación de transacciones pasa por el contexto**: `createTransaction`, `createTransactions`, `updateTransaction(prevTx, updates)`, `deleteTransaction(tx)`, `toggleChecked(tx)` — NO usar `useTransactions` directo desde páginas/componentes
- Cada mutación actualiza el caché de forma inmutable con el registro que devuelve Supabase, usando el mes de **`tx.date`** (no el mes que se está viendo)
- Lectura: `useMonthTransactions(year, month)` / `useMonthsTransactions([{year, month}])` — se re-sincronizan solos tras cada mutación; no hace falta invalidar ni recargar a mano
- Generación por mes + dedup de requests en vuelo: un fetch que arrancó antes de una mutación no pisa el caché
- El caché se limpia al cambiar de usuario y al volver a la pestaña tras 30s oculta (trae gastos cargados por WhatsApp)
- Fecha por defecto del modal: local, no `toISOString()` (UTC daba el día siguiente después de las 21hs)

## Supabase — Tablas principales

- `categories` — `id, user_id, name, type (income|fixed|variable), color, icon`
- `subcategories` — `id, user_id, category_id, name`
- `transactions` — `id, user_id, amount (negativo=gasto), description, date, category_id, subcategory_id, observations, is_checked`
- `whatsapp_users` — `phone (PK, con prefijo whatsapp:), user_id`
- `pending_transactions` — `id, user_phone, amount (positivo), description, type, category_id, message_sid (UNIQUE), created_at, user_id`

**RLS**: todas las tablas tienen `auth.uid() = user_id`. Si un INSERT falla silenciosamente, verificar políticas en Supabase Dashboard.

## Integración WhatsApp (api/whatsapp.js)

Webhook de Twilio para registrar gastos por mensaje. Reemplazó un flujo de n8n.

### Flujo
1. Mensaje entra → validar firma Twilio (HMAC-SHA1 con `TWILIO_AUTH_TOKEN`, 403 si inválida)
2. Buscar `From` en `whatsapp_users` — no registrado → mensaje de error
3. `SI` → confirmar pending más reciente: insert en `transactions` + delete pending
4. `NO` → borrar pendings del usuario
5. Otro texto → Groq (`openai/gpt-oss-20b`) interpreta contra las categorías del usuario → guarda en `pending_transactions` → responde resumen pidiendo SI/NO

### Convenciones del webhook
- **Respuestas siempre TwiML** (XML), nunca API REST de Twilio — no requiere auth adicional
- **Siempre responder 200** ante error interno — Twilio reintenta con otros códigos
- **Dedup**: check de `message_sid` antes de llamar a Groq + catch de `23505` en insert (reintentos de Twilio). Ambos responden TwiML vacío
- **Signo del monto**: pending guarda positivo; al confirmar, `income` → `+`, `fixed`/`variable` → `-`
- **`is_checked`**: fijo confirmado por WhatsApp entra como `true` (ya se pagó)
- Cliente Supabase propio con **service role key** (bypass RLS) — nunca usar el del frontend
- Escapar XML en mensajes (descripción puede traer `&`/`<`)

### Env vars (Vercel)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only
- `TWILIO_AUTH_TOKEN` — validación de firma
- `GROQ_API_KEY` — compartida con `api/advice.js`
- URL de Supabase: `SUPABASE_URL` con fallback a `VITE_SUPABASE_URL`

### Operativo
- Twilio **sandbox** (`+14155238886`): membresía vence cada 72hs — remandar `join <código>`
- Webhook configurado: `https://mia-expense-tracker.vercel.app/api/whatsapp` (POST)
- Vinculación de número: sección WhatsApp en `ProfileModal` (guarda `whatsapp:+549...`)
- `whatsapp_users` tiene RLS propia (select/insert/delete `auth.uid() = user_id`) para la UI

## Bugs resueltos (referencia)

- **Gasto nuevo no aparecía hasta re-loguear**: el Dashboard recargaba sin invalidar el caché y se invalidaba el mes visto en vez del mes de la fecha. Resuelto centralizando mutaciones en DataContext (ver arriba)
- **Informe — consejo IA ilegible**: texto en `#05100d` sobre fondo oscuro → `var(--tx)`
- **Informe — variables en rojo** (`#f87171`) → `--pu`; categorías fijo/variable con colores invertidos en Categories → corregido
- **Informe — `delta()`** daba +0.0% con prev 0 y signo invertido con prev < 0 → `pctChange()` (ver Convenciones)
- **Informe — `$` duplicado** en MetricCard (`$` + `fmtARS`) → las MetricCards se reemplazaron por la tabla

- **404 en Vercel al refrescar**: resuelto con `vercel.json` (rewrite `"/(.*)" → "/"`)
- **Modal tapado por BottomNav**: overlay necesita `zIndex: 200` (nav es 100)
- **Categoría no guarda**: `handleSaveCategory` no chequeaba error de Supabase — ahora retorna `{ error }` y el modal muestra el mensaje
- **FAB fuera del shell en desktop**: clase `.fab-r` con media query `calc((100vw - 430px) / 2 + 18px)`
- **Dashboard mostraba fijos = 0**: `metrics?.totalFixed` no existe en computeMetrics — siempre usar `metrics?.totalFixedPaid`
