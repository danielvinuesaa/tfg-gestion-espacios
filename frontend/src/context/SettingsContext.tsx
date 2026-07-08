import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Interfaz que define la configuración horaria de la aplicación.
 */
interface TimeSettings {
    /** Hora de inicio de las operaciones (formato 24h). */
    startHour: number;
    /** Hora de fin de las operaciones (formato 24h). */
    endHour: number;
    /** Intervalo de minutos utilizado para saltos de tiempo. */
    minuteStep: number;
}

/**
 * Interfaz para el contexto de configuración.
 */
interface SettingsContextType {
    /** Configuración horaria actual. */
    timeSettings: TimeSettings;
    /** Indica si los ajustes aún están en proceso de carga. */
    loading: boolean;
}

const DEFAULT_SETTINGS: TimeSettings = {
    startHour: 9,
    endHour: 21,
    minuteStep: 30,
};

const SettingsContext = createContext<SettingsContextType>({
    timeSettings: DEFAULT_SETTINGS,
    loading: true,
});

/**
 * Proveedor de contexto para la configuración global del sistema,
 * que obtiene los valores desde la API en la inicialización.
 * 
 * @param props - Propiedades del componente, incluyendo los elementos hijos.
 * @returns Proveedor del contexto de configuración.
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [timeSettings, setTimeSettings] = useState<TimeSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        fetch('/api/config/time')
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                if (active && data) setTimeSettings(data);
            })
            .catch(() => console.warn("Usando configuración horaria por defecto"))
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    return (
        <SettingsContext.Provider value={{ timeSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

/**
 * Hook personalizado para acceder de forma sencilla al contexto de configuración.
 * 
 * @returns El contexto de configuración con ajustes horarios y estado de carga.
 */
export const useSettings = () => useContext(SettingsContext);
