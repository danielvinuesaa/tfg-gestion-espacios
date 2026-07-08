import { Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
    'APROBADA': '#10b981',   // Esmeralda
    'SOLICITADA': '#f29900', // Ámbar
    'BLOQUEO': '#6366f1',    // Índigo
    'RECHAZADA': '#ef4444',  // Rojo
};

/**
 * Representa las propiedades para el componente StatusDistributionChart.
 */
interface StatusDistributionChartProps {
    /** Diccionario que mapea el nombre de cada estado con su cantidad respectiva. */
    data: Record<string, number>;
}

/**
 * Componente visual que renderiza un gráfico circular (pie chart) para ilustrar
 * la distribución porcentual de las solicitudes según su estado actual.
 *
 * @param props - Las propiedades que incluyen los datos de distribución.
 * @returns Un elemento JSX con el gráfico circular correspondiente o un indicador de falta de datos.
 */
const StatusDistributionChart = ({ data }: StatusDistributionChartProps) => {
    const statusData = Object.entries(data || {}).map(([name, value]) => ({ name, value }));
    const hasData = statusData.length > 0;

    return (
        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', height: 450, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight="bold" mb={1}>Distribución de Solicitudes</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Resumen por estado actual</Typography>
            <Box sx={{ height: 300, width: '100%', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend 
                                layout="vertical" 
                                align="right" 
                                verticalAlign="middle" 
                                iconType="circle"
                                formatter={(value) => <span style={{ color: '#4b5563', fontSize: '14px', fontWeight: 500 }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <Typography color="text.disabled" variant="body2">No hay actividad en estas fechas</Typography>
                )}
            </Box>
        </Paper>
    );
};

export default StatusDistributionChart;
