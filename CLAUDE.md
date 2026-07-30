# Mia — Contexto del proyecto

Expense tracker personal. App mobile-first, deployada en Vercel.

## Stack

- **React 19** + Vite 5
- **React Router v7** — SPA, rutas manejadas client-side (vercel.json con rewrite)
- **Supabase** — auth + base de datos (PostgreSQL con RLS)
- **Recharts** — gráficos (donut, bar chart)
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
  pages/        Dashboard, Transactions, Fijos, Categories, Login
  components/   Layout, BottomNav, TransactionModal, CategoryModal,
                SubcategoryModal, ConfirmModal, ProtectedRoute
  hooks/        useDashboard, useTransactions, useCategories
  context/      AuthContext (useAuth → user, signIn, signUp, signOut)
  lib/          supabaseClient.js, fmt.js (fmtARS)
api/
  advice.js     consejos financieros con Groq
  whatsapp.js   webhook Twilio para registrar gastos por WhatsApp
```

## Tokens CSS (src/index.css :root)

```
--bg   #0d0d0d   fondo base
--s1   #151515   surface 1 (cards, modales)
--s2   #1c1c1c   surface 2 (inputs, botones secundarios)
--s3   #222      surface 3
--bd   #242424   borde sutil
--bd2  #2c2c2c   borde visible
--tx   #efefef   texto primario
--tx2  #7a7a7a   texto secundario
--tx3  #3c3c3c   texto terciario / deshabilitado
--gr   #10b981   acento verde (primary action)
--grd  rgba(16,185,129,.12)   verde tint
--grb  rgba(16,185,129,.22)   verde borde
--re   #f43f5e   rojo / error
--red  rgba(244,63,94,.11)    rojo tint
--am   #f59e0b   amber (gastos fijos)
--pu   #7c5cfc   purple (subcategorías, tipo fijo badge)
--pud  rgba(124,92,252,.12)   purple tint
```

## Layout

- Shell mobile: `max-width: 430px`, centrado, `BottomNav` fijo abajo
- Rutas protegidas via `ProtectedRoute` (redirige a `/login` si no hay sesión)
- `Layout` renderiza: `<Outlet />` + `<BottomNav />`
- `StatusBar` eliminada (era decorativa, elementos de mockup mobile)
- `.shell { position: relative }` — base para posicionamiento interno

## Convenciones de código

- **Estilos**: inline JS objects (`const s = { ... }`) en cada componente, sin clases CSS salvo globales
- **Tokens en inline styles**: usar `'var(--token)'` como string
- **onFocus/onBlur** con CSS vars: usar `e.target.style.setProperty('border-color', 'var(--gr)')` — NO `style.borderColor =` (no acepta custom properties)
- **Formateo de moneda**: importar `fmtARS` de `src/lib/fmt.js` — NO definir localmente
- **Modales / overlays**: `zIndex: 200` para overlay, `zIndex: 100` es BottomNav
- **FABs**: usar `className="fab-r"` + omitir `right` del inline style (clase CSS maneja responsive)
- **Botón primario sobre verde**: siempre `color: '#000'` (no `#fff`, falla contraste WCAG)
- **Labels de formularios**: siempre con `htmlFor` + `id` en el input correspondiente

## Lógica de negocio crítica

### Gastos fijos (tipo `fixed`)
- `is_checked = false` → pendiente, NO se descuenta del saldo disponible
- `is_checked = true` → pagado, SÍ se descuenta
- `available = totalIncome - totalFixedPaid - totalVariable`
- El donut chart y la barra de progreso solo incluyen fijos **pagados**

### Cálculos en useDashboard
- `computeMetrics()` devuelve: `totalIncome`, `totalFixedPaid`, `totalFixedPending`, `totalVariable`, `available`, `byCategory`
- **`totalFixed` NO existe en metrics** — usar siempre `totalFixedPaid`. `metrics?.totalFixed` da `undefined → 0`
- `byCategory` solo incluye: variables (todas) + fijos con `is_checked === true`
- History del bar chart usa `totalFixedPaid` (no `totalFixed`)

### Página Transactions
- Fijos con `is_checked === false` se filtran **antes** del typeFilter — no aparecen en ninguna vista
- Un gasto fijo solo es "gasto" cuando está checkeado; hasta entonces es compromiso pendiente (ver página Fijos)

### Dashboard — card principal
- Número grande: `available` (verde si ≥ 0, rojo si < 0)
- Subtítulo: `de $X de ingresos` en `var(--tx2)`
- `fmtARS` usa `Math.abs` — el color comunica el signo, no el número

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

- **404 en Vercel al refrescar**: resuelto con `vercel.json` (rewrite `"/(.*)" → "/"`)
- **Modal tapado por BottomNav**: overlay necesita `zIndex: 200` (nav es 100)
- **Categoría no guarda**: `handleSaveCategory` no chequeaba error de Supabase — ahora retorna `{ error }` y el modal muestra el mensaje
- **FAB fuera del shell en desktop**: clase `.fab-r` con media query `calc((100vw - 430px) / 2 + 18px)`
- **Dashboard mostraba fijos = 0**: `metrics?.totalFixed` no existe en computeMetrics — siempre usar `metrics?.totalFixedPaid`
- **Bar chart fijos vacío**: `dataKey="totalFixed"` en history que expone `totalFixedPaid` — corregido
