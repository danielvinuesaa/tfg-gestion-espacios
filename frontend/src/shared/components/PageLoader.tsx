import { Box, CircularProgress, Typography, Fade } from '@mui/material';

/**
 * Interfaz para las propiedades del componente indicador de carga a nivel de página.
 */
interface PageLoaderProps {
    /** El mensaje informativo que acompaña al indicador visual de carga. */
    message?: string;
    /** La altura mínima que abarcará el contenedor para centrar verticalmente el indicador. */
    minHeight?: string | number;
}

/**
 * Componente visual estandarizado empleado como pantalla o sección de transición de carga.
 * Proporciona un `CircularProgress` centrado y adaptado cromáticamente al tema principal
 * de la aplicación para mitigar la percepción de espera del usuario final.
 * 
 * @param props - Las propiedades de configuración, como el texto o la altura del contenedor.
 * @returns Un bloque de React con transición de aparición progresiva para notificar un estado de carga.
 */
const PageLoader = ({ 
    message = 'Cargando información...', 
    minHeight = '60vh' 
}: PageLoaderProps) => (
    <Fade in timeout={500}>
        <Box 
            display="flex" 
            flexDirection="column"
            justifyContent="center" 
            alignItems="center" 
            minHeight={minHeight}
            width="100%"
        >
            <CircularProgress 
                size={60} 
                thickness={4} 
                sx={{ mb: 3, color: 'primary.main' }} 
            />
            <Typography 
                variant="h6" 
                color="text.secondary"
                fontWeight="500"
            >
                {message}
            </Typography>
        </Box>
    </Fade>
);

export default PageLoader;
