import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'

// Lazy-loaded pages
const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Proveedores = lazy(() => import('@/pages/Proveedores'))
const Catalogos = lazy(() => import('@/pages/Catalogos'))
const Productos = lazy(() => import('@/pages/Productos'))
const Servicios = lazy(() => import('@/pages/Servicios'))
const Clientes = lazy(() => import('@/pages/Clientes'))
const Cotizaciones = lazy(() => import('@/pages/Cotizaciones'))
const Configuracion = lazy(() => import('@/pages/Configuracion'))
const NuevaCotizacion = lazy(() => import('@/pages/NuevaCotizacion'))
const Colecciones = lazy(() => import('@/pages/Colecciones'))
const Categorias = lazy(() => import('@/pages/Categorias'))
const Usuarios = lazy(() => import('@/pages/Usuarios'))

function PageLoader() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/proveedores" element={<Proveedores />} />
                <Route path="/catalogos" element={<Catalogos />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/servicios" element={<Servicios />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/cotizaciones" element={<Cotizaciones />} />
                <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
                <Route path="/colecciones" element={<Colecciones />} />
                <Route path="/categorias" element={<Categorias />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/configuracion" element={<Configuracion />} />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}
