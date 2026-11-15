import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabaseClient'

// Los colores viven en src/index.css ([data-theme="..."]); acá solo se elige cuál aplicar.
// eslint-disable-next-line react-refresh/only-export-components
export const THEMES = [
  { id: 'bosque',    label: 'Bosque' },
  { id: 'grafito',   label: 'Grafito' },
  { id: 'tinta',     label: 'Tinta' },
  { id: 'porcelana', label: 'Porcelana' },
]

const DEFAULT_THEME = 'bosque'
const THEME_IDS     = THEMES.map(t => t.id)
const LEGACY_THEMES = { aurora: 'bosque', obsidian: 'grafito', nebula: 'tinta' }
const STORAGE_KEY   = 'mia-theme'

function normalizeTheme(value) {
  if (THEME_IDS.includes(value)) return value
  return LEGACY_THEMES[value] ?? DEFAULT_THEME
}

// Copia local solo para evitar el flash del tema default antes de leer Supabase
function readLocalTheme() {
  try { return normalizeTheme(localStorage.getItem(STORAGE_KEY)) } catch { return DEFAULT_THEME }
}
function writeLocalTheme(theme) {
  try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* sin storage: no pasa nada */ }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { user } = useAuth()
  const [theme, setThemeState] = useState(readLocalTheme)
  // id del usuario cuyas preferencias ya se leyeron (loading = todavía no)
  const [loadedFor, setLoadedFor] = useState(null)
  const loadingTheme = user ? loadedFor !== user.id : false

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeLocalTheme(theme)
  }, [theme])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase
      .from('user_preferences')
      .select('theme')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data?.theme) {
          const next = normalizeTheme(data.theme)
          setThemeState(next)
          // Migrar valores viejos (aurora/obsidian/nebula/desconocido) en la DB
          if (next !== data.theme) {
            supabase
              .from('user_preferences')
              .upsert({ user_id: user.id, theme: next }, { onConflict: 'user_id' })
              .then(({ error }) => { if (error) console.error('theme migration', error) })
          }
        }
        setLoadedFor(user.id)
      })
    return () => { cancelled = true }
  }, [user])

  async function setTheme(newTheme) {
    const next = normalizeTheme(newTheme)
    setThemeState(next)
    if (user) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, theme: next }, { onConflict: 'user_id' })
      if (error) console.error('save theme', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loadingTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
