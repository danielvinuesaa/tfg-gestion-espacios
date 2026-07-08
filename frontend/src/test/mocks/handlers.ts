import { http, HttpResponse } from 'msw';

/**
 * Colección global de manejadores (handlers) para la interceptación de solicitudes HTTP 
 * utilizando `Mock Service Worker` (MSW). 
 * Provee respuestas predefinidas que emulan el comportamiento del servidor backend, 
 * facilitando la ejecución de pruebas de integración y el desarrollo de la interfaz 
 * sin depender de una base de datos real.
 */
export const handlers = [
  // Configuración global
  http.get('/api/config/time', () => {
    return HttpResponse.json({
      startHour: 8,
      endHour: 21,
      minuteStep: 30
    });
  }),

  // Reservations
  http.get('/api/reservations', () => {
    return HttpResponse.json({
      content: [
        { 
          id: 1, title: 'Reserva Test 1', startTime: '2026-05-25T10:00:00', endTime: '2026-05-25T12:00:00', 
          createdAt: '2026-05-20T09:00:00',
          type: 'CLASE', status: 'SOLICITADA', 
          user: { id: 2, name: 'Profe', email: 'profe@uniovi.es' },
          spaces: [{ id: 1, name: 'Aula 101', type: 'AULA' }] 
        },
        { 
          id: 2, title: 'Reserva Aprobada', startTime: '2026-05-26T10:00:00', endTime: '2026-05-26T12:00:00', 
          createdAt: '2026-05-21T09:00:00',
          type: 'EXAMEN', status: 'APROBADA', 
          user: { id: 1, name: 'Admin', email: 'admin@uniovi.es' },
          spaces: [{ id: 1, name: 'Aula 101', type: 'AULA' }] 
        }
      ],
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0
    });
  }),

  http.get('/api/reservations/:id', () => {
    return HttpResponse.json({
      id: 1, title: 'Reserva Test 1', startTime: '2026-05-25T10:00:00', endTime: '2026-05-25T12:00:00', 
      createdAt: '2026-05-20T09:00:00',
      type: 'CLASE', status: 'SOLICITADA', 
      user: { id: 2, name: 'Profe', email: 'profe@uniovi.es' },
      spaces: [{ id: 1, name: 'Aula 101' }] 
    });
  }),

  http.post('/api/reservations', () => {
    return HttpResponse.json({ id: 3, title: 'Nueva Reserva' }, { status: 201 });
  }),

  http.put('/api/reservations/:id', () => {
    return HttpResponse.json({ id: 1, title: 'Reserva Actualizada' });
  }),

  http.delete('/api/reservations/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('/api/reservations/:id/status', () => {
    return HttpResponse.json({ id: 1, status: 'APROBADA' });
  }),

  http.patch('/api/reservations/:id/status', () => {
    return HttpResponse.json({ id: 1, status: 'RECHAZADA' });
  }),

  http.post('/api/reservations/check-conflicts', () => {
    return HttpResponse.json([
      { id: 2, title: 'Reserva Aprobada', startTime: '2026-05-26T10:00:00', endTime: '2026-05-26T12:00:00' }
    ]);
  }),

  // Spaces
  http.get('/api/spaces', () => {
    return HttpResponse.json({
      content: [
        { id: 1, name: 'Aula 101', type: 'AULA', totalCapacity: 50, computerCount: 20, status: 'DISPONIBLE' },
        { id: 2, name: 'Laboratorio 2.1', type: 'LABORATORIO', totalCapacity: 30, computerCount: 30, status: 'DISPONIBLE' },
      ],
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0
    });
  }),

  http.post('/api/spaces', () => {
    return HttpResponse.json({ id: 99, name: 'Nuevo Espacio' }, { status: 201 });
  }),

  http.get('/api/spaces/:id/conflicts', ({ params }) => {
    const id = params.id;
    if (id === '1') {
      return HttpResponse.json({
        hasConflicts: true,
        conflictCount: 2,
        details: [
          { reservationId: 1, title: 'Reserva Test 1', startTime: '2026-05-25T10:00:00', endTime: '2026-05-25T12:00:00', userName: 'Profe', type: 'CLASE', onlySpace: true },
          { reservationId: 2, title: 'Bloqueo 1', status: 'BLOQUEO', startTime: '2026-05-26T10:00:00', endTime: '2026-05-26T12:00:00', userName: 'Admin', onlySpace: false }
        ]
      });
    }
    return HttpResponse.json({
      hasConflicts: false,
      conflictCount: 0,
      details: []
    });
  }),

  http.delete('/api/spaces/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/spaces/search-available', async ({ request }) => {
    const body = await request.json() as any;
    
    // Si es búsqueda flexible
    if (body.flexible) {
      return HttpResponse.json([
        {
          date: '2027-05-25',
          totalCount: 1,
          timeSlots: [
            {
              startTime: '2027-05-25T10:00:00',
              endTime: '2027-05-25T11:00:00',
              label: '10:00 - 11:00',
              count: 1,
              proposals: [
                {
                  spaces: [{ id: 1, name: 'Aula 101', type: 'AULA', totalCapacity: 50 }],
                  totalCapacity: 50,
                  effectiveCapacity: 50,
                  overCapacity: 0,
                  efficiencyScore: 100,
                  recommendationReason: 'Óptima capacidad individual',
                  suggestedStartTime: '2027-05-25T10:00:00',
                  suggestedEndTime: '2027-05-25T11:00:00'
                }
              ]
            }
          ]
        }
      ]);
    }
    
    // Si es búsqueda estática
    return HttpResponse.json([
      {
        spaces: [{ id: 1, name: 'Aula 101', type: 'AULA', totalCapacity: 50 }],
        totalCapacity: 50,
        effectiveCapacity: 50,
        overCapacity: 0,
        efficiencyScore: 100,
        recommendationReason: 'Asignación directa individual'
      }
    ]);
  }),

  http.get('/api/spaces/types', () => {
    return HttpResponse.json(['AULA', 'LABORATORIO', 'DESPACHO']);
  }),

  http.post('/api/spaces/import/validate', () => {
    return HttpResponse.json({
      valid: true,
      newCount: 5,
      conflicts: [
        { 
          name: 'Aula 101', type: 'AULA', capacity: 60, status: 'DISPONIBLE', 
          currentType: 'AULA', currentCapacity: 50, currentStatus: 'DISPONIBLE',
          hasReservations: false, canOverwrite: true 
        }
      ]
    });
  }),

  http.post('/api/spaces/import', () => {
    return HttpResponse.json({ successCount: 6, failureCount: 0 });
  }),

  http.post('/api/spaces/search-available', async ({ request }) => {
    const body = await request.json() as any;
    
    if (!body.flexible) {
      // Modo Fijo
      return HttpResponse.json([
        {
          spaces: [{ id: 1, name: 'Aula 101', type: 'AULA', totalCapacity: 60 }],
          totalCapacity: 60,
          effectiveCapacity: 60,
          overCapacity: 0,
          efficiencyScore: 100,
          recommendationReason: 'Asignación directa óptima'
        }
      ]);
    } else {
      // Modo Flexible
      return HttpResponse.json([
        {
          date: body.rangeStart,
          totalCount: 1,
          timeSlots: [
            {
              startTime: `${body.rangeStart}T09:00:00`,
              endTime: `${body.rangeStart}T10:00:00`,
              label: '09:00 - 10:00',
              count: 1,
              proposals: [
                {
                  spaces: [{ id: 1, name: 'Aula 101', type: 'AULA', totalCapacity: 60 }],
                  totalCapacity: 60,
                  effectiveCapacity: 60,
                  efficiencyScore: 100,
                  recommendationReason: 'Propuesta flexible'
                }
              ]
            }
          ]
        }
      ]);
    }
  }),

  // Notifications
  http.get('/api/notifications/unread-count', () => {
    return HttpResponse.json({ count: 2 });
  }),

  http.get('/api/notifications', () => {
    return HttpResponse.json({
      content: [
        { 
          id: 1, content: 'Tu reserva ha sido aprobada', type: 'RESERVA_APROBADA', 
          read: false, createdAt: '2026-05-23T10:00:00', link: '/reservations' 
        },
        { 
          id: 2, content: 'Nueva solicitud de reserva en Aula 101', type: 'RESERVA_CREADA', 
          read: false, createdAt: '2026-05-24T09:00:00', link: '/reservations/1' 
        },
        { 
          id: 3, content: 'Mantenimiento del sistema programado', type: 'SISTEMA', 
          read: true, createdAt: '2026-05-20T12:00:00' 
        }
      ],
      totalElements: 3,
      totalPages: 1,
      size: 10,
      number: 0
    });
  }),

  http.put('/api/notifications/mark-all-read', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('/api/notifications/clear-all', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('/api/notifications/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/notifications/preferences', () => {
    return HttpResponse.json({
      emailOnCreated: true,
      emailOnApproved: true,
      emailOnRejected: true,
      internalOnCreated: true,
      internalOnApproved: true,
      internalOnRejected: true,
      emailOnSystem: false,
      internalOnSystem: true
    });
  }),

  http.put('/api/notifications/preferences', () => {
    return HttpResponse.json({ success: true });
  }),

  // Analytics - Reports
  http.post('/api/reports/validate-availability', () => {
    return HttpResponse.json([1, 2]); // IDs válidos
  }),

  http.post('/api/reports/validate-subjects-availability', () => {
    return HttpResponse.json([101]); // ID asignatura válida
  }),

  http.post('/api/reports/generate/:type', () => {
    return new HttpResponse(new Blob(['pdf-content'], { type: 'application/pdf' }));
  }),

  // Analytics - Audit
  http.get('/api/audit-logs', () => {
    return HttpResponse.json({
      content: [
        { id: 1, action: 'CREATE_SPACE', entityName: 'Space', entityId: 1, details: 'Aula 101', performedBy: 'admin@es', timestamp: '2026-05-24T10:00:00' },
        { id: 2, action: 'LOGIN', entityName: 'User', entityId: 1, details: 'Logged in', performedBy: 'admin@es', timestamp: '2026-05-24T09:00:00' }
      ],
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0
    });
  }),

  // Dashboard Stats
  http.get('/api/stats', () => {
    return HttpResponse.json({
      systemTotals: {
        totalSpaces: 10,
        totalUsers: 50,
        totalReservationsHistorical: 100
      },
      periodActivity: {
        reservationsCount: 20,
        activeUsersCount: 15,
        occupancyRatio: 45.5,
        reservationsGrowth: 12.5,
        usersGrowth: 5.0,
        reservationsBySpace: { 'Aula 101': 10, 'Lab 1': 5 },
        reservationsByStatus: { 'APROBADA': 15, 'RECHAZADA': 5 },
        occupancyByType: { 'AULA': { 'Ocupado': 30, 'Libre': 70 } },
        weeklyActivity: { 'Lun': 5, 'Mar': 8, 'Mie': 3 }
      },
      recentActivity: [
        { id: '1', action: 'CREATE_RESERVATION', performedBy: 'profe@es', timestamp: '2026-05-25T10:00:00', details: 'Nueva reserva' }
      ]
    });
  }),

  // Users
  http.get('/api/users/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'admin@uniovi.es',
      name: 'Admin User',
      role: 'ADMIN',
      permissions: ['VER_ESPACIOS', 'CREAR_ESPACIOS', 'EDITAR_ESPACIOS', 'BORRAR_ESPACIOS', 'GESTIONAR_ROLES', 'GESTIONAR_USUARIOS', 'SOLICITAR_RESERVA', 'APROBAR_RESERVA', 'CANCELAR_RESERVA', 'GENERAR_INFORMES'],
      managedSubjectIds: []
    });
  }),
// Users
http.get('/api/users', ({ request }) => {
  const url = new URL(request.url);
  const nameQuery = url.searchParams.get('name');

  let content = [
    { id: 1, name: 'Admin User', email: 'admin@uniovi.es', role: { id: 1, name: 'ADMIN' }, status: 'ACTIVO' },
    { id: 2, name: 'Profesor Test', email: 'profe@uniovi.es', role: { id: 2, name: 'PROFESOR' }, status: 'ACTIVO' },
  ];

  if (nameQuery) {
    content = content.filter(u => u.name.toLowerCase().includes(nameQuery.toLowerCase()) || u.email.toLowerCase().includes(nameQuery.toLowerCase()));
  }

  return HttpResponse.json({
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 10,
    number: 0
  });
}),

http.post('/api/users', () => {
  return HttpResponse.json({ id: 3, name: 'New User' }, { status: 201 });
}),

http.put('/api/users/:id', ({ params }) => {
  return HttpResponse.json({ id: params.id, name: 'Updated User' });
}),

http.get('/api/users/:id/conflicts', () => {
  return HttpResponse.json({
    hasConflicts: true,
    conflictCount: 5,
    details: []
  });
}),

http.delete('/api/users/:id', () => {
  return new HttpResponse(null, { status: 204 });
}),

  // Roles
  http.get('/api/roles', () => {
    return HttpResponse.json([
      { 
        id: 1, name: 'ADMIN', description: 'Administrador total', status: 'ACTIVO', 
        permissions: [{ id: 1, name: 'ALL', label: 'Todo' }], 
        subjectIds: [], userCount: 1 
      },
      { 
        id: 2, name: 'PROFESOR', description: 'Docente', status: 'ACTIVO', 
        permissions: [{ id: 2, name: 'LEER_ESPACIOS', label: 'Leer Espacios' }], 
        subjectIds: [101], userCount: 50 
      }
    ]);
  }),

  http.get('/api/roles/permissions', () => {
    return HttpResponse.json([
      { id: 1, name: 'LEER_ESPACIOS', label: 'Leer Espacios', description: 'Permite ver el catálogo' },
      { id: 2, name: 'SOLICITAR_RESERVA', label: 'Solicitar Reserva', description: 'Permite solicitar' }
    ]);
  }),

  http.get('/api/roles/subjects', () => {
    return HttpResponse.json([
      { id: 101, code: 'GSI01', name: 'Diseño de Software' },
      { id: 102, code: 'GSI02', name: 'Arquitectura' }
    ]);
  }),

  http.get('/api/subjects', () => {
    return HttpResponse.json([
      { id: 101, code: 'GSI01', name: 'Diseño de Software' },
      { id: 102, code: 'GSI02', name: 'Arquitectura' }
    ]);
  }),

  http.post('/api/roles', () => {
    return HttpResponse.json({ id: 3, name: 'NUEVO_ROL' }, { status: 201 });
  }),

  http.get('/api/roles/:id/usage', ({ params }) => {
    const id = params.id;
    // Simulamos que el rol 2 (PROFESOR) tiene conflictos (usuarios vinculados)
    if (id === '2') {
      return HttpResponse.json({
        hasConflicts: true,
        conflictCount: 50,
        itemsWithConflicts: [] // No necesitamos el detalle para este test
      });
    }
    return HttpResponse.json({
      hasConflicts: false,
      conflictCount: 0,
      itemsWithConflicts: []
    });
  }),

  http.delete('/api/roles/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Ejemplo de handler para auth
  http.post('/api/auth/authenticate', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token'
    });
  }),
];
