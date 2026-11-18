# NoteApp

NoteApp es una aplicación de página única para escribir y organizar notas. La interfaz permite crear, editar, archivar y eliminar notas; agruparlas con categorías de color; y filtrarlas por categoría. El proyecto está dividido en dos aplicaciones independientes: un frontend React y una API REST NestJS. Los datos se guardan en PostgreSQL mediante Prisma.

## Aplicación

- **Frontend:** [notes.chiqo.cc.cd](https://notes.chiqo.cc.cd)
- **API REST:** [notesbackend.chiqo.cc.cd](https://notesbackend.chiqo.cc.cd)
- **Usuario de demostración:** `prueba`
- **Contraseña:** `prueba123!@@@`

## Funcionalidades

### Fase 1: notas

- Crear notas con título y contenido.
- Editar y eliminar notas.
- Consultar por separado las notas activas y las archivadas.
- Archivar y desarchivar notas.

### Fase 2: categorías

- Crear categorías con nombre y color opcional.
- Asignar y quitar categorías de una nota.
- Filtrar las notas activas por categoría.
- Mostrar en cada tarjeta el color de la categoría asignada que tenga color.

## Organización del proyecto

```text
backend/
  prisma/                 Esquema y migraciones de PostgreSQL
  src/
    auth/                  Inicio de sesión, sesión y protección de rutas
    categories/            Gestión de categorías
    config/                Validación de configuración
    database/              Conexión de Prisma
    notes/                 Gestión de notas y asignaciones
  test/                    Pruebas unitarias y de integración
frontend/
  src/
    components/            Elementos de interfaz reutilizables
    contexts/              Estado de autenticación
    hooks/                 Consultas y mutaciones de datos
    pages/                 Inicio de sesión y vistas de notas
    routes/                Rutas de la aplicación
    services/              Comunicación HTTP con la API
    types/                 Tipos compartidos del frontend
scripts/start.sh           Inicio local de la aplicación
docker-compose.yml         PostgreSQL para desarrollo local
```

El frontend es una SPA independiente; se comunica con el backend mediante HTTP y no usa renderizado del lado del servidor. En React, las páginas y componentes presentan las notas y categorías; los hooks administran las consultas y actualizaciones, y los servicios encapsulan las llamadas a la API.

El backend sigue una arquitectura por capas:

| Capa          | Responsabilidad                                                                |
| ------------- | ------------------------------------------------------------------------------ |
| Controladores | Reciben las solicitudes HTTP, validan sus parámetros y exponen las rutas REST. |
| Servicios     | Aplican las reglas de notas, categorías y autenticación.                       |
| Repositorios  | Consultan y modifican los datos mediante Prisma.                               |
| Base de datos | PostgreSQL conserva notas, categorías, usuarios y sus relaciones.              |

## Modelo de datos

- **Note:** título, contenido, estado de archivo y fechas de creación y edición.
- **Category:** nombre único y color opcional. Una categoría puede asociarse a varias notas y una nota puede tener varias categorías.
- **User:** nombre de usuario y hash de contraseña con sal. La aplicación crea o actualiza la cuenta de demostración al iniciar.

Las migraciones de Prisma versionan los cambios del esquema. El backend usa PostgreSQL tanto en desarrollo como en producción; no depende de almacenamiento en memoria.

## Tecnologías y versiones

| Tecnología                 | Versión                     |
| -------------------------- | --------------------------- |
| Node.js                    | 22.12.0 o posterior         |
| npm                        | 10.0.0 o posterior          |
| React / React DOM          | 19.3.1                      |
| Vite / plugin React        | 8.3.8 / 6.3.0               |
| TypeScript                 | 5.9.3                       |
| Tailwind CSS               | 4.3.5                       |
| React Router DOM           | 7.18.5                      |
| TanStack Query             | 5.107.1                     |
| Axios                      | 1.21.1                      |
| React Hook Form / Zod      | 7.92.0 / 4.6.7              |
| NestJS                     | 12.5.1                      |
| Prisma ORM / Prisma Client | 6.12.0                      |
| PostgreSQL                 | 16.16                       |
| Docker Engine / Compose    | 24.0.0 / 2.20.0 o posterior |
| ESLint / Prettier          | 10.15.0 / 3.10.1            |

Las versiones de paquetes están fijadas en los manifiestos y lockfiles de `frontend` y `backend`.

## Ejecución local

Se necesita Node.js, npm y Docker con Docker Compose. Desde la raíz del repositorio, prepara los archivos de entorno a partir de sus ejemplos:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

En `backend/.env`, configura `DATABASE_URL` y `DIRECT_URL` para la base local de Compose. Con los valores de `.env.example`, ambas URL usan:

```text
postgresql://notes_app:notes_app_local@localhost:5433/notes_app?schema=public
```

Define también `JWT_SECRET` con un valor de al menos 32 bytes. El frontend local usa `VITE_API_URL=http://localhost:3000/api` y `FRONTEND_ORIGIN=http://localhost:5173`.

Para instalar dependencias, generar Prisma Client, iniciar PostgreSQL, aplicar las migraciones y levantar ambos servicios:

```bash
./scripts/start.sh
```

El script crea los archivos de entorno que falten, instala dependencias cuando no están disponibles, prepara Prisma, espera a que PostgreSQL esté listo, aplica las migraciones e inicia el backend y el frontend. `Ctrl+C` detiene ambos servicios.

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000/api
- **PostgreSQL:** localhost:5433

También se puede instalar e iniciar cada aplicación por separado:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

En otra terminal:

```bash
cd frontend
npm ci
npm run dev
```

## Configuración

El backend lee las variables desde `backend/.env`:

| Variable                          | Uso                                                           |
| --------------------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`                    | Conexión de Prisma Client a PostgreSQL.                       |
| `DIRECT_URL`                      | Conexión que Prisma CLI usa para migraciones.                 |
| `PORT`                            | Puerto local de la API; por defecto, `3000`.                  |
| `FRONTEND_ORIGIN`                 | Origen permitido para CORS y solicitudes que modifican datos. |
| `JWT_SECRET`                      | Secreto usado para firmar las sesiones.                       |
| `JWT_EXPIRES_IN`                  | Vigencia de la sesión, por ejemplo `1h`.                      |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | Credenciales de la cuenta de demostración.                    |
| `NODE_ENV`                        | En producción activa la cookie segura.                        |

El frontend usa `VITE_API_URL`, que debe terminar en `/api`. Las variables `VITE_` son configuración pública de la aplicación web.

## Inicio de sesión

La API valida las credenciales y establece una cookie JWT `HttpOnly`, `SameSite=Strict`, limitada a `/api` y segura en producción. El frontend consulta `/api/auth/me` para recuperar la sesión y no guarda el token en `localStorage`. El cierre de sesión elimina la cookie.

## API REST

Todas las rutas usan el prefijo `/api`.

| Método   | Ruta                                    | Función                                                 |
| -------- | --------------------------------------- | ------------------------------------------------------- |
| `POST`   | `/api/auth/login`                       | Iniciar sesión.                                         |
| `GET`    | `/api/auth/me`                          | Consultar la sesión actual.                             |
| `POST`   | `/api/auth/logout`                      | Cerrar sesión.                                          |
| `GET`    | `/api/notes`                            | Listar notas activas; acepta `categoryId` para filtrar. |
| `GET`    | `/api/notes/archived`                   | Listar notas archivadas.                                |
| `GET`    | `/api/notes/:id`                        | Consultar una nota.                                     |
| `POST`   | `/api/notes`                            | Crear una nota.                                         |
| `PATCH`  | `/api/notes/:id`                        | Editar una nota.                                        |
| `DELETE` | `/api/notes/:id`                        | Eliminar una nota.                                      |
| `PATCH`  | `/api/notes/:id/archive`                | Archivar una nota.                                      |
| `PATCH`  | `/api/notes/:id/unarchive`              | Desarchivar una nota.                                   |
| `GET`    | `/api/categories`                       | Listar categorías.                                      |
| `POST`   | `/api/categories`                       | Crear una categoría.                                    |
| `POST`   | `/api/notes/:id/categories/:categoryId` | Asignar una categoría.                                  |
| `DELETE` | `/api/notes/:id/categories/:categoryId` | Quitar una categoría.                                   |

Las rutas de notas, categorías y sesión requieren autenticación. La API valida UUID y cuerpos de solicitud; responde con `401` para sesiones o credenciales no válidas y `409` si el nombre de categoría ya existe.

## Pruebas y calidad

Desde la carpeta correspondiente:

| Comando | Frontend               | Backend                |
| ------- | ---------------------- | ---------------------- |
| Pruebas | `npm test`             | `npm run test:unit`    |
| Build   | `npm run build`        | `npm run build`        |
| Lint    | `npm run lint`         | `npm run lint`         |
| Formato | `npm run format:check` | `npm run format:check` |

Las pruebas de integración del backend se ejecutan con `npm run test:integration` y usan una base PostgreSQL local aislada llamada `notes_app_test`.
