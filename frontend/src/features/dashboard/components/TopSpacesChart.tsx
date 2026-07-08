import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';

/**
 * Propiedades del componente TopSpacesChart.
 */
interface TopSpacesChartProps {
    data: Record<string, number>;
}

/**
 * Componente gráfico que muestra un ranking con los cinco espacios o aulas más reservadas.
 * Recibe los datos y los representa visualmente mediante un gráfico de barras horizontales empleando la biblioteca Recharts.
 *
 * @param props - Propiedades del componente.
 * @param props.data - Diccionario donde cada clave es el nombre de un espacio y su valor es el número de reservas.
 * @returns Elemento de React con el gráfico de los espacios más solicitados.
 */
const TopSpacesChart = ({ data }: TopSpacesChartProps) => {
    const theme = useTheme();

    // Transformar y ordenar los datos (Top 5)
    const chartData = Object.entries(data)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    if (chartData.length === 0) {
        return (
            <Paper sx={{ p: 3, borderRadius: 4, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No hay datos suficientes para mostrar el ranking</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, borderRadius: 4, height: 400 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top 5 Aulas más reservadas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Basado en el número de reservas confirmadas en el periodo.
            </Typography>
            
            <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: 600, fill: '#5f6368' }}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar 
                            dataKey="count" 
                            radius={[0, 4, 4, 0]} 
                            barSize={32}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? theme.palette.primary.main : theme.palette.primary.light} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default TopSpacesChart;
