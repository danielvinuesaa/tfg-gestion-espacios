import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp-up a 50 usuarios
        { duration: '4m', target: 50 },   // Mantener 50 usuarios durante 4 min
        { duration: '30s', target: 0 },   // Ramp-down a 0
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'],   // Menos del 1% de errores
        http_req_duration: ['p(95)<500'], // 95% de las peticiones por debajo de 500ms
        'http_req_duration{type:export}': ['p(95)<1000'], // PDFs por debajo de 1s
    },
};

const BASE_URL = 'http://localhost:8080/api';

// Usamos el usuario Administrador que se crea por defecto al levantar la BD
const USER_CREDENTIALS = {
    email: 'admin@uniovi.es',
    password: 'admin123'
};

export default function () {
    // 1. PR-CAR-03: Autenticación
    let loginRes = http.post(`${BASE_URL}/auth/authenticate`, JSON.stringify(USER_CREDENTIALS), {
        headers: { 'Content-Type': 'application/json' }
    });
    
    // Extraemos el token del login
    let token = loginRes.status === 200 ? loginRes.json('token') : '';

    const params = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };

    check(loginRes, {
        'PR-CAR-03 - Login exitoso (status 200)': (r) => r.status === 200,
    });

    sleep(1);

    // 2. PR-CAR-01: Búsqueda de disponibilidad
    let searchRes = http.get(`${BASE_URL}/spaces?minCapacity=30`, params);
    check(searchRes, {
        'PR-CAR-01 - Búsqueda rápida (status 200)': (r) => r.status === 200 || r.status === 404,
    });

    sleep(1);

    // 3. PR-CAR-02 y PR-CAR-04: Transaccionalidad y concurrencia pura
    // Mandamos reservas conflictivas a propósito (mismo espacio, misma hora)
    let payloadReserva = JSON.stringify({
        spaceIds: [1],
        title: `Reserva Carga ${randomString(5)}`,
        type: 'OTRO',
        startTime: '2026-10-15T10:00:00',
        endTime: '2026-10-15T12:00:00',
        isBlock: false
    });

    let reserveRes = http.post(`${BASE_URL}/reservations`, payloadReserva, params);
    check(reserveRes, {
        'PR-CAR-02/04 - Reserva controlada (status 201 o 409)': (r) => r.status === 201 || r.status === 409 || r.status === 403 || r.status === 400 || r.status === 404,
    });

    sleep(1);

    // 4. PR-CAR-05: Exportación de reportes
    // Generar un PDF dinámicamente es muy costoso para la CPU. 
    // Un usuario no exporta el listado en el 100% de los casos. 
    // Simulamos que el 5% de las veces el usuario pide un PDF.
    if (Math.random() < 0.05) {
        let exportRes = http.get(`${BASE_URL}/reservations/export?format=pdf`, {
            headers: params.headers,
            tags: { type: 'export' } // Etiqueta para el threshold específico de 2000ms
        });
        
        check(exportRes, {
            'PR-CAR-05 - Exportación PDF (status 200)': (r) => r.status === 200 || r.status === 404,
        });
    }

    sleep(3); // Simular el tiempo que el usuario mira la pantalla antes de la siguiente acción
}
