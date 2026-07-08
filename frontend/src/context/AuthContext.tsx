import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

/**
 * Representa el perfil del usuario autenticado en el sistema.
 */
interface UserProfile {
    /** Identificador único del usuario. */
    id: number;
    /** Correo electrónico del usuario. */
    email: string;
    /** Nombre completo del usuario. */
    name: string;
    /** Rol asignado en el sistema. */
    role: string;
    /** Lista de permisos específicos concedidos. */
    permissions: string[];
    /** Lista de identificadores de asignaturas que gestiona. */
    managedSubjectIds: number[];
}

/**
 * Interfaz que define el contrato del contexto de autenticación.
 */
interface AuthContextType {
    /** Token JWT actual, o null si no hay sesión. */
    token: string | null;
    /** Datos del usuario autenticado. */
    user: UserProfile | null;
    /** Indica si el usuario actual está autenticado. */
    isAuthenticated: boolean;
    /** Función para iniciar sesión con un nuevo token. */
    login: (token: string) => void;
    /** Función para cerrar sesión. */
    logout: () => void;
    /** Función para recargar los datos del usuario desde el servidor. */
    refreshUser: () => Promise<void>;
    /** Verifica si el usuario posee un permiso específico. */
    hasPermission: (permission: string) => boolean;
    /** Verifica si el usuario gestiona una asignatura específica. */
    managesSubject: (subjectId: number | null | undefined) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveedor de contexto para la autenticación de usuarios.
 * Gestiona el ciclo de vida de la sesión, el almacenamiento del token JWT,
 * y los controles de acceso basados en roles y permisos.
 * 
 * @param props - Propiedades del componente, incluyendo los elementos hijos.
 * @returns Proveedor del contexto de autenticación.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<UserProfile | null>(null);
    const isAuthenticated = !!token;

    const fetchUserProfile = useCallback(async (authToken: string) => {
        try {
            const response = await fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setToken(null);
                setUser(null);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            if (!user) {
                fetchUserProfile(token);
            }
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token, user, fetchUserProfile]);

    const refreshUser = useCallback(async () => {
        if (token) {
            await fetchUserProfile(token);
        }
    }, [token, fetchUserProfile]);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
    }, []);

    const login = useCallback((newToken: string) => {
        setToken(newToken);
    }, []);

    const hasPermission = useCallback((permission: string): boolean => {
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
    }, [user]);

    const managesSubject = useCallback((subjectId: number | null | undefined): boolean => {
        if (!user || !user.managedSubjectIds || subjectId === null || subjectId === undefined) return false;
        return user.managedSubjectIds.includes(subjectId);
    }, [user]);

    const value = useMemo(() => ({ 
        token, 
        user, 
        isAuthenticated, 
        login, 
        logout, 
        refreshUser,
        hasPermission, 
        managesSubject 
    }), [token, user, isAuthenticated, login, logout, refreshUser, hasPermission, managesSubject]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook personalizado para acceder al contexto de autenticación.
 * 
 * @returns El contexto de autenticación actual.
 * @throws Error si se usa fuera de un AuthProvider.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
