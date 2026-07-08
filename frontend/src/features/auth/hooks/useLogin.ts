import { useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../shared/utils/api';

/**
 * Hook personalizado especializado en la lógica de negocio para la autenticación de usuarios.
 * 
 * Este hook encapsula y gestiona:
 * 1. El estado del formulario de inicio de sesión (credenciales).
 * 2. La comunicación con los servicios del backend mediante el adaptador de API estandarizado.
 * 3. La transición y manejo de los estados de carga, así como las posibles excepciones o errores derivados de la autenticación.
 * 
 * @returns Objeto que contiene las propiedades reactivas del estado y los métodos necesarios para la interacción con la interfaz.
 */
export const useLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { login } = useAuth();
    const { request } = useApi();
    const navigate = useNavigate();

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await request('/api/auth/authenticate', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (data && data.token) {
                login(data.token);
                navigate('/');
            } else {
                throw new Error('No se recibió el token de acceso');
            }
        } catch (err: any) {
            console.error("Login failure:", err);
            setError(err.message || 'Credenciales inválidas o error de conexión');
        } finally {
            setLoading(false);
        }
    }, [email, password, login, navigate, request]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        loading,
        error,
        handleSubmit
    };
};
