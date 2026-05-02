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
- `byCategory` solo incluye: variables (todas) + fijos con `is_checked === true`
- History del bar chart usa `totalFixedPaid` (no `totalFixed`)

## Supabase — Tablas principales

- `categories` — `id, user_id, name, type (income|fixed|variable), color, icon`
- `subcategories` — `id, user_id, category_id, name`
- `transactions` — `id, user_id, amount (negativo=gasto), description, date, category_id, subcategory_id, observations, is_checked`

**RLS**: todas las tablas tienen `auth.uid() = user_id`. Si un INSERT falla silenciosamente, verificar políticas en Supabase Dashboard.

## Bugs resueltos (referencia)

- **404 en Vercel al refrescar**: resuelto con `vercel.json` (rewrite `"/(.*)" → "/"`)
- **Modal tapado por BottomNav**: overlay necesita `zIndex: 200` (nav es 100)
- **Categoría no guarda**: `handleSaveCategory` no chequeaba error de Supabase — ahora retorna `{ error }` y el modal muestra el mensaje
- **FAB fuera del shell en desktop**: clase `.fab-r` con media query `calc((100vw - 430px) / 2 + 18px)`
