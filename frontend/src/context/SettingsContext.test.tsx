import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsContext';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const TestComponent = () => {
    const { timeSettings, loading } = useSettings();
    if (loading) return <div>Cargando...</div>;
    return <div data-testid="settings">{timeSettings.startHour}-{timeSettings.endHour}</div>;
};

/**
 * Suite de pruebas unitarias para el contexto de configuración (SettingsContext).
 * Verifica que los ajustes de tiempo se carguen correctamente desde la API y
 * que se utilicen valores por defecto razonables en caso de fallo.
 */
describe('SettingsContext', () => {
    /**
     * Verifica que la configuración de tiempo se obtenga correctamente a través de la API
     * y se actualice en el componente consumidor.
     */
    it('debe cargar configuración de la API', async () => {
        server.use(
            http.get('/api/config/time', () => {
                return HttpResponse.json({ startHour: 8, endHour: 20, minuteStep: 15 });
            })
        );

        render(
            <SettingsProvider>
                <TestComponent />
            </SettingsProvider>
        );

        expect(screen.getByText('Cargando...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByTestId('settings')).toHaveTextContent('8-20');
        });
    });

    /**
     * Verifica que si la llamada a la API falla, el contexto proporcione
     * una configuración de tiempo por defecto para evitar errores en la aplicación.
     */
    it('debe usar valores por defecto si falla la API', async () => {
        server.use(
            http.get('/api/config/time', () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        render(
            <SettingsProvider>
                <TestComponent />
            </SettingsProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('settings')).toHaveTextContent('9-21');
        });
    });
});
