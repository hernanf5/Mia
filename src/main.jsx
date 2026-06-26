import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { DataProvider } from './context/DataContext'

import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Fijos from './pages/Fijos'
import Informe from './pages/Informe'
import Categories from './pages/Categories'
import Login from './pages/Login'
import './index.css'

function ThemeGate({ children }) {
  const { loadingTheme } = useTheme()
  if (loadingTheme) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#05100d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #2ee6a8', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }
  return children
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ThemeGate>
          <DataProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="fijos" element={<Fijos />} />
                  <Route path="informe" element={<Informe />} />
                  <Route path="categories" element={<Categories />} />
                </Route>
              </Route>
            </Routes>
          </DataProvider>
          </ThemeGate>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
