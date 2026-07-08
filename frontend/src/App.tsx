import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SnackbarProvider } from './context/SnackbarContext';
import { RequireAuth } from './features/auth/components/RequireAuth';
import SpaceList from './features/spaces/components/SpaceList';
import ReservationList from './features/reservations/components/ReservationList';
import UserList from './features/identity/users/components/UserList';
import RoleList from './features/identity/roles/components/RoleList';
import CalendarView from './features/calendar/pages/CalendarView';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import AvailabilitySearchPage from './features/spaces/pages/AvailabilitySearchPage';
import NotificationCenter from './features/notifications/pages/NotificationCenter';
import ReportsPage from './features/analytics/reports/pages/ReportsPage';
import AuditLogPage from './features/dashboard/pages/AuditLogPage';
import LoginPage from './features/auth/pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import Layout from './layouts/Layout';

import { theme } from './theme/theme';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale/es';
import { SettingsProvider } from './context/SettingsContext';

/**
 * Componente principal de la aplicación.
 * Configura los proveedores de contexto (tema, localización, notificaciones, autenticación)
 * y define el enrutamiento principal de la aplicación.
 * 
 * @returns {JSX.Element} El árbol de componentes principal de la aplicación.
 */
function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <SettingsProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider>
            <AuthProvider>
              <NotificationProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Redirección por defecto */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  {/* Dashboard: Acceso General */}
                  <Route path="/dashboard" element={
                    <RequireAuth>
                      <Layout><DashboardPage /></Layout>
                    </RequireAuth>
                  } />

                  {/* Calendario: Requiere permiso de visualización global */}
                  <Route path="/calendar" element={
                    <RequireAuth permission="VER_TODAS_RESERVAS">
                      <Layout><CalendarView /></Layout>
                    </RequireAuth>
                  } />

                  {/* Notificaciones: Acceso General */}
                  <Route path="/notificaciones" element={
                    <RequireAuth>
                      <Layout><NotificationCenter /></Layout>
                    </RequireAuth>
                  } />

                  {/* Gestión de Reservas: Acceso General */}
                  <Route path="/reservations" element={
                    <RequireAuth>
                      <Layout><ReservationList /></Layout>
                    </RequireAuth>
                  } />

                  {/* Buscador Inteligente: Requiere permiso de solicitar */}
                  <Route path="/search-availability" element={
                    <RequireAuth permission="SOLICITAR_RESERVA">
                      <Layout><AvailabilitySearchPage /></Layout>
                    </RequireAuth>
                  } />

                  {/* Informes: Requiere permiso específico */}
                  <Route path="/reports" element={
                    <RequireAuth permission="GENERAR_INFORMES">
                      <Layout><ReportsPage /></Layout>
                    </RequireAuth>
                  } />

                  {/* Espacios: Requiere permiso de lectura */}
                  <Route path="/spaces" element={
                    <RequireAuth permission="LEER_ESPACIOS">
                      <Layout><SpaceList /></Layout>
                    </RequireAuth>
                  } />

                  {/* Usuarios: Requiere permiso de gestión */}
                  <Route path="/users" element={
                    <RequireAuth permission="GESTIONAR_USUARIOS">
                      <Layout><UserList /></Layout>
                    </RequireAuth>
                  } />

                  {/* Roles: Requiere permiso de gestión */}
                  <Route path="/roles" element={
                    <RequireAuth permission="GESTIONAR_ROLES">
                      <Layout><RoleList /></Layout>
                    </RequireAuth>
                  } />

                  {/* Auditoría: Solo para usuarios con rol de ADMIN */}
                  <Route path="/audit-logs" element={
                    <RequireAuth allowedRoles={['ADMIN']}>
                      <Layout><AuditLogPage /></Layout>
                    </RequireAuth>
                  } />

                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                </Routes>
              </NotificationProvider>
            </AuthProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </SettingsProvider>
    </LocalizationProvider>
  )
}

export default App
