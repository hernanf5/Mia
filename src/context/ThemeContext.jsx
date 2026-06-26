import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabaseClient'

const THEMES = {
  aurora: {
    blob1: 'radial-gradient(circle,rgba(16,185,129,0.42),transparent 66%)',
    blob2: 'radial-gradient(circle,rgba(34,211,238,0.34),transparent 66%)',
    blob3: 'radial-gradient(circle,rgba(45,212,191,0.20),transparent 70%)',
    bg: '#05100d',
    accent: '#2ee6a8',
  },
  obsidian: {
    blob1: 'radial-gradient(circle,rgba(45,212,191,0.20),transparent 64%)',
    blob2: 'radial-gradient(circle,rgba(99,102,241,0.16),transparent 66%)',
    blob3: 'radial-gradient(circle,rgba(45,212,191,0.10),transparent 70%)',
    bg: '#0a0b0e',
    accent: '#22d3ee',
  },
  nebula: {
    blob1: 'radial-gradient(circle,rgba(168,85,247,0.36),transparent 66%)',
    blob2: 'radial-gradient(circle,rgba(59,130,246,0.34),transparent 66%)',
    blob3: 'radial-gradient(circle,rgba(45,212,191,0.18),transparent 70%)',
    bg: '#0a0816',
    accent: '#a855f7',
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { user } = useAuth()
  const [theme, setThemeState] = useState('aurora')
  const [loadingTheme, setLoadingTheme] = useState(true)

  useEffect(() => {
    if (!user) { setLoadingTheme(false); return }
    supabase
      .from('user_preferences')
      .select('theme')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.theme && THEMES[data.theme]) {
          setThemeState(data.theme)
        }
        setLoadingTheme(false)
      })
  }, [user])

  async function setTheme(newTheme) {
    setThemeState(newTheme)
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: 'user_id' })
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, themeConfig: THEMES[theme], setTheme, loadingTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
