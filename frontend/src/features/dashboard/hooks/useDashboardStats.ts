import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../shared/utils/api';
import { useSettings } from '../../../context/SettingsContext';
import { subDays, format } from 'date-fns';

/**
 * Representa la estructura de los datos estadísticos que provee la API para el Panel de Control.
 */

export interface StatsData {
    systemTotals: {
        totalSpaces: number;
        totalUsers: number;
        totalReservationsHistorical: number;
    };
    periodActivity: {
        reservationsCount: number;
        activeUsersCount: number;
        occupancyRatio: number;
        reservationsGrowth: number;
        usersGrowth: number;
        reservationsBySpace: Record<string, number>;
        reservationsByStatus: Record<string, number>;
        occupancyByType: Record<string, Record<string, number>>;
        weeklyActivity: Record<string, number>;
    };
    recentActivity: Array<{
        id: string;
        action: string;
        performedBy: string;
        timestamp: string;
        details: string;
    }>;
    upcomingEvents: Array<{
        id: number;
        title: string;
        startTime: string;
        endTime: string;
        status: string;
        spaces: Array<{ name: string }>;
        subject?: { name: string };
    }>;
}

/**
 * Define un rango de fechas utilizando cadenas en formato ISO (YYYY-MM-DD).
 */
interface DateRange {
    start: string;
    end: string;
}

/**
 * Hook de negocio para la obtención y manejo de las estadísticas globales del panel.
 * Utiliza TanStack Query para el almacenamiento en caché y la revalidación de datos, 
 * considerando el rango de fechas configurado.
 *
 * @returns Objeto con el estado de la consulta, los datos de estadísticas y los controles de filtrado.
 */
export const useDashboardStats = () => {
    const { request } = useApi();
    const { timeSettings } = useSettings();
    const { startHour, endHour } = timeSettings;

    const [dateRange, setDateRange] = useState<DateRange>({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    // Memorizamos el rango de tiempo formateado para evitar re-calculos y queries innecesarias
    const queryRange = useMemo(() => {
        const startISO = `${dateRange.start}T${startHour.toString().padStart(2, '0')}:00:00`;
        const endISO = `${dateRange.end}T${endHour.toString().padStart(2, '0')}:00:00`;
        return { startISO, endISO };
    }, [dateRange, startHour, endHour]);

    const { 
        data: stats = null, 
        isLoading: loading, 
        isFetching: refreshing, 
        error, 
        refetch 
    } = useQuery<StatsData>({
        queryKey: ['/api/stats', queryRange],
        queryFn: () => request(`/api/stats?startDate=${queryRange.startISO}&endDate=${queryRange.endISO}`),
        staleTime: 60 * 1000, // Los datos se consideran frescos durante 1 minuto
    });

    return {
        stats,
        loading,
        refreshing,
        error: error ? (error as any).message : null,
        dateRange,
        setDateRange,
        refresh: refetch
    };
};
