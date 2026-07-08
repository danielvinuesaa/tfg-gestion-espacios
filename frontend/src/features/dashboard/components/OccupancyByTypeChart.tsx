import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
    'APROBADA': '#10b981',   // Esmeralda
    'SOLICITADA': '#f29900', // Ámbar
    'BLOQUEO': '#6366f1',    // Índigo
    'RECHAZADA': '#ef4444',  // Rojo
};

/**
 * Representa las propiedades requeridas por el componente OccupancyByTypeChart.
 */
interface OccupancyByTypeChartProps {
    /** Mapa de datos que asocia cada tipo de espacio con sus respectivos conteos por estado. */
    data: Record<string, Record<string, number>>;
}

/**
 * Componente visual que renderiza un gráfico de barras apiladas para mostrar la ocupación 
 * de los espacios clasificada por tipo y estado.
 *
 * @param props - Propiedades del componente.
 * @returns Un elemento JSX que contiene el gráfico de ocupación o un mensaje en caso de no haber datos.
 */
const OccupancyByTypeChart = ({ data }: OccupancyByTypeChartProps) => {
    const typeData = Object.entries(data || {}).map(([type, statusMap]) => ({
        name: type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' '),
        ...statusMap
    }));

    const hasData = typeData.length > 0;

    return (
        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', height: 450 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>Ocupación por Tipo de Espacio</Typography>
            <Box sx={{ height: 350, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                        <BarChart data={typeData} layout="vertical" margin={{ left: 40, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                            <XAxis 
                                type="number" 
                                axisLine={false} 
                                tickLine={false} 
                                allowDecimals={false} 
                                domain={[0, 'dataMax']} 
                            />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontWeight: 500}} width={100} />
                            <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="APROBADA" name="Aprobadas" stackId="a" fill={STATUS_COLORS['APROBADA']} radius={[0, 0, 0, 0]} barSize={32} />
                            <Bar dataKey="SOLICITADA" name="Pendientes" stackId="a" fill={STATUS_COLORS['SOLICITADA']} radius={[0, 4, 4, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <Typography color="text.disabled" variant="body2">No hay actividad en estas fechas</Typography>
                )}
            </Box>
        </Paper>
    );
};

export default OccupancyByTypeChart;
