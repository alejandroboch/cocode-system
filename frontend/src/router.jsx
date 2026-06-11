import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import InicioPage from './pages/InicioPage'
import CasasPage from './pages/CasasPage'
import TelefonosCasasPage from './pages/TelefonosCasasPage'
import PlacasCasasPage from './pages/PlacasCasasPage'
import ServiciosPage from './pages/ServiciosPage'
import TarifasPage from './pages/TarifasPage'
import UsuariosPage from './pages/UsuariosPage'
import DeudasPage from './pages/DeudasPage'
import PagosPage from './pages/PagosPage'
import RecibosPage from './pages/RecibosPage'
import ReportesPage from './pages/ReportesPage'
import BitacoraPage from './pages/BitacoraPage'
import MiCuentaPage from './pages/MiCuentaPage'
import OlvideContrasenaPage from './pages/OlvideContrasenaPage'
import RestablecerContrasenaPage from './pages/RestablecerContrasenaPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/olvide-contrasena',
    element: <OlvideContrasenaPage />,
  },
  {
    path: '/restablecer-contrasena',
    element: <RestablecerContrasenaPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <InicioPage /> },
      { path: 'casas', element: <CasasPage /> },
      { path: 'casas/telefonos', element: <TelefonosCasasPage /> },
      { path: 'casas/placas', element: <PlacasCasasPage /> },
      { path: 'servicios', element: <ServiciosPage /> },
      { path: 'tarifas-especiales', element: <TarifasPage /> },
      { path: 'deudas', element: <DeudasPage /> },
      { path: 'pagos', element: <PagosPage /> },
      { path: 'recibos', element: <RecibosPage /> },
      { path: 'reportes', element: <ReportesPage /> },
      { path: 'mi-cuenta', element: <MiCuentaPage /> },
      {
        path: 'usuarios',
        element: (
          <AdminRoute>
            <UsuariosPage />
          </AdminRoute>
        ),
      },
      {
        path: 'bitacora',
        element: (
          <AdminRoute>
            <BitacoraPage />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
