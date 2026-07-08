import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import PageLoader from '../../../shared/components/PageLoader';

/**
 * Interfaz que define las propiedades para el componente protector de rutas.
 */
interface RequireAuthProps {
    /** El elemento o árbol de componentes encapsulado a renderizar si se cumple la autorización. */
    children: JSX.Element;
    /** Identificador del permiso específico que el usuario debe poseer (opcional). */
    permission?: string;
    /** Arreglo de identificadores de roles permitidos para acceder a la ruta (opcional). */
    allowedRoles?: string[];
}

/**
 * Componente de barrera (Guard) destinado a proteger el acceso a rutas privadas dentro de la aplicación.
 * Intercepta la navegación para comprobar el estado de la sesión, los roles asignados y los permisos otorgados.
 * Despliega un indicador de carga mientras verifica la sesión, o redirige a las vistas pertinentes 
 * (inicio de sesión o acceso denegado) en caso de fallar la validación.
 * 
 * @param props - Propiedades que incluyen las restricciones de acceso y los componentes hijos.
 * @returns Los componentes hijos si la validación es exitosa, un indicador de carga o una redirección.
 */
export const RequireAuth = ({ children, permission, allowedRoles }: RequireAuthProps) => {
    const { isAuthenticated, user, hasPermission } = useAuth();
    const location = useLocation();

    // Cargador inicial de la aplicación (Verificando sesión o cargando perfil)
    if ((isAuthenticated && !user)) {
        return <PageLoader message="Verificando sesión segura..." minHeight="100vh" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si se requiere un permiso específico y el usuario no lo tiene
    if (permission && !hasPermission(permission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Si se requieren roles específicos y el rol del usuario no está incluido
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};
