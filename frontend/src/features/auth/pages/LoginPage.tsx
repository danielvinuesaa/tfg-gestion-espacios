import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Paper,
    CircularProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import { useState } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useLogin } from '../hooks/useLogin';

/**
 * Representa la página principal de acceso a la plataforma.
 * 
 * Centraliza la interfaz de usuario para la autenticación delegando la lógica
 * de negocio al hook `useLogin`. Esta vista implementa un diseño robusto e
 * incluye mejoras en la experiencia de usuario tales como indicadores visuales 
 * de carga, posibilidad de conmutar la visibilidad de la contraseña y un 
 * manejo de errores estandarizado.
 * 
 * @returns Elemento React que renderiza la interfaz de inicio de sesión.
 */
const LoginPage = () => {
    const { 
        email, setEmail, password, setPassword, 
        loading, error, handleSubmit 
    } = useLogin();

    const [showPassword, setShowPassword] = useState(false);

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '90vh', display: 'flex', alignItems: 'center' }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                }}
            >
                <Paper 
                    elevation={6} 
                    sx={{ 
                        p: 4, 
                        width: '100%', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        borderRadius: 4
                    }}
                >
                    <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1.5, borderRadius: '50%', mb: 2 }}>
                        <LockOutlinedIcon />
                    </Box>

                    <Typography component="h1" variant="h4" fontWeight="800" gutterBottom>
                        Bienvenido
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Introduce tus credenciales para acceder
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Correo Electrónico"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            variant="outlined"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            variant="outlined"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ 
                                mt: 4, 
                                mb: 2, 
                                py: 1.5, 
                                borderRadius: 2,
                                fontWeight: 'bold',
                                fontSize: '1rem'
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
                        </Button>
                    </Box>
                </Paper>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
                    © {new Date().getFullYear()} Universidad de Oviedo - Gestión de Espacios
                </Typography>
            </Box>
        </Container>
    );
};

export default LoginPage;
