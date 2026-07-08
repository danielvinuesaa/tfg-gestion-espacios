import { useMemo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Define las propiedades necesarias para el componente WeeklyActivityChart.
 */
interface WeeklyActivityChartProps {
    /** Mapa que vincula los días de la semana con la cantidad de reservas realizadas. */
    data: Record<string, number>;
}

/**
 * Componente que representa gráficamente el volumen de actividad (reservas) 
 * a lo largo de los días de la semana mediante un gráfico de áreas.
 *
 * @param props - Propiedades que incluyen los datos semanales a graficar.
 * @returns Un elemento JSX que contiene el gráfico de área interactivo.
 */
const WeeklyActivityChart = ({ data }: WeeklyActivityChartProps) => {
    // Definimos el orden profesional de la semana (Lunes a Domingo)
    const dayOrder = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

    const weeklyData = useMemo(() => {
        if (!data) return [];
        
        // Transformamos y normalizamos a minúsculas para una comparación robusta
        return Object.entries(data)
            .map(([day, count]) => ({ 
                day: day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(), 
                originalDay: day.toLowerCase(),
                count 
            }))
            .sort((a, b) => dayOrder.indexOf(a.originalDay) - dayOrder.indexOf(b.originalDay));
    }, [data]);

    const hasData = weeklyData.length > 0;

    return (
        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>Volumen de Reservas Semanal</Typography>
            <Box sx={{ height: 300, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                        <AreaChart data={weeklyData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                                                                <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#6b7280', fontSize: 12}} 
                                        allowDecimals={false} 
                                        domain={[0, 'dataMax']} 
                                    />
                                                                <Tooltip 
                                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                                />                            <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" name="Reservas" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <Typography color="text.disabled" variant="body2">No hay actividad en estas fechas</Typography>
                )}
            </Box>
        </Paper>
    );
};

export default WeeklyActivityChart;
