# Sistema de Reserva de Espacios

Este repositorio contiene el código fuente completo del Trabajo Fin de Grado "Sistema de Reserva de Espacios".

## Estructura del Proyecto

- `/backend`: Servidor desarrollado con Spring Boot 3 y Java 21.
- `/frontend`: Aplicación cliente desarrollada con React, TypeScript y Vite.
- `docker-compose.yml`: Archivo de orquestación para levantar la infraestructura en desarrollo.

## Requisitos Previos

- **Java 21**
- **Node.js** (v18 o superior)
- **Docker y Docker Compose** (opcional, para la base de datos y/o despliegue completo)
- **PostgreSQL 15** (si no se usa Docker)

## Instrucciones de Ejecución (Modo Desarrollo)

1. **Base de Datos**: 
   Asegúrate de tener PostgreSQL ejecutándose, o levanta la base de datos mediante Docker:
   ```bash
   docker-compose up -d db
   ```

2. **Backend**:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   
Una vez que ambos servicios estén funcionando correctamente, abre tu navegador web y accede a **`http://localhost:5173`** para ver e interactuar con la aplicación.


