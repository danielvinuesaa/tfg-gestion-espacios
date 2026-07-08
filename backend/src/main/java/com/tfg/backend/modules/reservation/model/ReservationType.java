package com.tfg.backend.modules.reservation.model;

/**
 * Enumera las clasificaciones categóricas de las actividades que pueden motivar o fundamentar
 * una solicitud de reserva dentro de las instalaciones gestionadas.
 */
public enum ReservationType {
    /** 
     * Representa actividades de docencia reglada o sesiones de clase ordinarias. 
     */
    CLASE,
    
    /** 
     * Representa las pruebas de evaluación continua o exámenes finales de las asignaturas. 
     */
    EXAMEN,
    
    /** 
     * Engloba eventos extraordinarios, seminarios, congresos o reuniones de tutoría. 
     */
    OTRO
}
