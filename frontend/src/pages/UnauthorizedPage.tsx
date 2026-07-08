import { Container, Box, Typography, Button, Paper } from '@mui/material';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import { useNavigate } from 'react-router-dom';

/**
 * Componente de página principal para notificar al usuario sobre restricciones de acceso.
 * Se despliega cuando se intenta navegar a una ruta protegida sin poseer los privilegios, 
 * roles o permisos necesarios en el contexto de seguridad actual.
 * 
 * @returns Elemento JSX que renderiza la vista de error 403 (Acceso Denegado).
 */
const UnauthorizedPage = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Box 
                sx={{ 
                    mt: 10, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 6, 
                        borderRadius: 4, 
                        border: '1px solid #eee',
                        bgcolor: '#fcfcfc'
                    }}
                >
                    <LockPersonIcon sx={{ fontSize: 80, color: 'error.light', mb: 2 }} />
                    
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Acceso Denegado
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Lo sentimos, no tienes los permisos necesarios para acceder a esta sección de la plataforma. Si crees que esto es un error, contacta con el administrador del centro.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button 
                            variant="outlined" 
                            onClick={() => navigate(-1)}
                        >
                            Volver Atrás
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={() => navigate('/')}
                        >
                            Ir al Inicio
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default UnauthorizedPage;
