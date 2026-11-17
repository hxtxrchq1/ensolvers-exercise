# Notes App

Aplicación SPA para crear y organizar notas, con frontend React, API REST NestJS y persistencia relacional en PostgreSQL mediante Prisma. La Fase 1 permite gestionar notas activas y archivadas. También están implementadas las funcionalidades opcionales de categorías: crear, asignar y quitar categorías, y filtrar notas activas.

## Funcionalidades

- Crear, editar y eliminar notas.
- Listar notas activas y archivadas; archivar y desarchivar notas.
- Crear categorías con nombre obligatorio y color opcional.
- Asociar y desvincular categorías de notas sin eliminar las entidades.
- Filtrar notas activas por categoría.
- Iniciar y cerrar sesión con el usuario único de demostración.

No hay registro público. Los dominios de producción acordados son `https://notes.chiqo.cc.cd` y `https://notesbackend.chiqo.cc.cd`; su operación y despliegue deben verificarse en Vercel antes de considerarlos disponibles.

## Arquitectura y tecnologías

El frontend y el backend son aplicaciones independientes, con su propio `package.json`, lockfile e instalación de dependencias. El frontend es una SPA (sin SSR); el backend expone una API REST organizada en controladores, servicios y repositorios Prisma.

| Herramienta                         | Versión requerida o fijada                        |
| ----------------------------------- | ------------------------------------------------- |
| Node.js                             | 22.12.0 o posterior                               |
| npm                                 | 10.0.0 o posterior                                |
| React / React DOM                   | 19.3.1                                            |
| Vite / plugin React                 | 8.3.8 / 6.3.0                                     |
| TypeScript                          | 5.9.3                                             |
| Tailwind CSS / plugin Vite          | 4.3.5 / 4.3.5                                     |
| React Router DOM                    | 7.18.5                                            |
| Axios                               | 1.21.1                                            |
| TanStack Query                      | 5.107.1                                           |
| React Hook Form / Zod / resolvers   | 7.92.0 / 4.6.7 / 7.0.6                            |
| NestJS common/core/platform-express | 12.5.1                                            |
| NestJS config / CLI                 | 12.1.1 / 12.0.13                                  |
| class-validator / class-transformer | 0.15.1 / 0.5.1                                    |
| Prisma ORM / Client                 | 6.12.0 / 6.12.0                                   |
| PostgreSQL                          | 16.16 (`postgres:16.16-alpine` en Docker Compose) |
| Docker Engine / Compose             | 24.0.0 / 2.20.0 como mínimo                       |
| ESLint / Prettier                   | 10.15.0 / 3.10.1                                  |

Las versiones de los paquetes están fijadas en los manifiestos y lockfiles de cada aplicación. Las versiones mínimas de Node.js y npm también están declaradas en ambos `package.json`.

## Requisitos previos

- Node.js y npm en las versiones indicadas arriba.
- Para Docker Compose: Docker Engine 24.0.0 o posterior y Docker Compose 2.20.0 o posterior.
- Para ejecutar `scripts/start.sh` desde Windows: Docker Desktop y Git Bash o WSL.
- Alternativamente, una instancia local de PostgreSQL 16.16 compatible.

## Configuración de entorno y base de datos

Hay tres archivos de ejemplo, sin configuraciones personales:

- `.env.example`: nombre de base, usuario, contraseña y puerto publicado para Docker Compose.
- `backend/.env.example`: `DATABASE_URL`, `DIRECT_URL`, `PORT`, `FRONTEND_ORIGIN` y las variables de autenticación.
- `frontend/.env.example`: `VITE_API_URL` (URL absoluta del API que termina en `/api`).

Crea los archivos `.env` copiando sus respectivos ejemplos solo si aún no existen. En PowerShell:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

En Bash:

```bash
for file in .env backend/.env frontend/.env; do
  if [ ! -f "$file" ]; then cp "$file.example" "$file"; fi
done
```

Configura `DATABASE_URL` y `DIRECT_URL` en `backend/.env` para que apunten a la base que utilizarás. En local ambas pueden usar la misma conexión PostgreSQL. Para Docker Compose, configura el `.env` raíz y haz que ambas URL usen la base, las credenciales y el puerto publicado. `DIRECT_URL` en `.env.example` es un marcador seguro y se debe reemplazar localmente antes de ejecutar Prisma CLI; no guardes credenciales personales en el repositorio. Compose publica PostgreSQL en `POSTGRES_PORT` (5433 por defecto) y conserva los datos en el volumen `postgres_data`.

### Autenticación

El backend requiere estas variables en `backend/.env` y en cada entorno donde se despliegue:

| Variable          | Propósito                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Conexión runtime de Prisma Client. En Vercel/Supabase usa la URL del pooler Supavisor Transaction y limita el pool Prisma según la concurrencia serverless. |
| `DIRECT_URL`      | Conexión directa de PostgreSQL que Prisma CLI/Migrate usa para las migraciones; no uses aquí el pooler de transacciones.                                    |
| `JWT_SECRET`      | Secreto aleatorio de al menos 32 bytes para firmar las sesiones. Sustituye el valor de ejemplo antes de iniciar la aplicación.                              |
| `JWT_EXPIRES_IN`  | Vigencia del token, expresada como número y unidad `s`, `m`, `h` o `d` (por ejemplo, `1h`).                                                                 |
| `DEMO_USERNAME`   | Usuario único de demostración; valor predeterminado: `prueba`.                                                                                              |
| `DEMO_PASSWORD`   | Contraseña configurable para ese usuario; usa una contraseña distinta, aleatoria y fuerte para cada despliegue.                                               |
| `FRONTEND_ORIGIN` | Origen HTTP(S) exacto permitido por CORS y por la comprobación de `Origin`; sin ruta ni barra final.                                                        |
| `NODE_ENV`        | Usa `production` en producción para que la cookie de sesión se marque `Secure`.                                                                             |

El usuario se crea o actualiza de forma idempotente al iniciar el backend, después de aplicar la migración de autenticación. La contraseña se guarda únicamente como hash scrypt con sal aleatoria; nunca se persiste en texto plano. No existe registro público. Para producción, el usuario de demostración es `prueba` y su contraseña debe generarse y configurarse como secreto del entorno; no se publica en este README. Esta cuenta compartida es solo para demostración y no debe almacenar información personal. No reutilices el secreto de ejemplo: genera uno con `openssl rand -base64 48` y configúralo en `JWT_SECRET`.

Para la configuración local de ejemplo, las credenciales iniciales son usuario `prueba` y contraseña `Prueba123!`. Son solo para desarrollo local; configura una contraseña aleatoria diferente para cualquier despliegue.

Para Supabase, configura ambas conexiones como variables privadas en el backend: `DATABASE_URL` con la conexión Supavisor Transaction para el runtime y `DIRECT_URL` con conexión directa o Supavisor Session para Prisma CLI/migraciones. Copia las URL desde la opción **Connect** del Dashboard; no construyas el host manualmente. Codifica en URL cualquier carácter reservado de la contraseña. No expongas ninguna de estas variables en el frontend. El proyecto fija Prisma ORM y Prisma Client en 6.12.0, cuya configuración de datasource usa `url` y `directUrl`.

El login establece una cookie JWT `HttpOnly`, `SameSite=Strict`, limitada a `/api` y marcada `Secure` en producción. El cliente no guarda el token en `localStorage`; recupera la sesión consultando `/api/auth/me` al cargar la aplicación. El cierre de sesión elimina la cookie del navegador.

Para todo método que puede cambiar estado (incluidos login y logout), el guard exige que `Origin` coincida exactamente con `FRONTEND_ORIGIN`; si falta o difiere, responde `403`. Los métodos seguros no requieren `Origin`. CORS permite ese origen exacto con credenciales, los métodos `GET`, `HEAD`, `POST`, `PATCH` y `DELETE`, y el encabezado `Content-Type`; el middleware CORS de NestJS responde las solicitudes preflight `OPTIONS`.

`FRONTEND_URL` todavía se acepta como alias de compatibilidad para instalaciones locales existentes; la configuración nueva debe usar `FRONTEND_ORIGIN`.

Para iniciar solo PostgreSQL con Docker Compose:

```bash
docker compose up -d --wait database
```

## Instalación, migraciones y ejecución manual

Instala las dependencias de cada aplicación por separado desde la raíz:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Prisma Client utiliza `DATABASE_URL` al ejecutarse. En Prisma ORM 6.12, `directUrl = env("DIRECT_URL")` hace que Prisma CLI/Migrate use la conexión directa, mientras `url = env("DATABASE_URL")` permanece como URL principal del cliente. El script existente `npm run prisma:migrate` ejecuta `prisma migrate deploy`; configúralo con `DIRECT_URL` apuntando a la conexión directa. En local, configura ambas variables para la misma base. No sustituyas las migraciones versionadas con `prisma db push`.

En otra terminal, inicia el frontend:

```bash
cd frontend
npm ci
npm run dev
```

La configuración local de `frontend/.env` usa `VITE_API_URL=http://localhost:3000/api`. Esta variable se incorpora al bundle durante el build: en Vercel configura `VITE_API_URL` como `https://notesbackend.chiqo.cc.cd/api` para los entornos que correspondan. Solo debe contener una URL pública del API, nunca secretos. El cliente Axios valida que el origen sea HTTP(S), que el path sea exactamente `/api` (admite una barra final) y conserva `withCredentials`; los servicios añaden rutas como `/auth/login` o `/notes`, evitando duplicar el prefijo.

`prisma:migrate` aplica las migraciones versionadas. Para crear una nueva migración durante el desarrollo, usa `npm run prisma:migrate:dev` desde `backend`. El puerto local del backend se configura mediante `PORT` y el origen CORS mediante `FRONTEND_ORIGIN`; Vite usa el puerto 5173. En PowerShell, utiliza `npm.cmd` en lugar de `npm`.

En un clon nuevo, la copia de `backend/.env.example` proporciona los valores de demostración y un marcador para `JWT_SECRET`; sustituye ese marcador por un secreto aleatorio antes de arrancar la API. Si ya existe `backend/.env`, incorpora manualmente las cuatro variables de autenticación sin reemplazar las demás configuraciones.

## Preparación del backend para Vercel

El backend está preparado para la detección nativa de NestJS de Vercel. La guía oficial reconoce `backend/src/main.ts` como punto de entrada y ejecuta la aplicación NestJS como una única Vercel Function. No hace falta un adaptador Express adicional, otro servidor, `vercel.json` ni un directorio estático de salida. El bootstrap actual conserva `npm run start:dev` localmente y usa el `app.listen` que espera la integración de NestJS de Vercel.

Para crear el proyecto Vercel desde este repositorio independiente:

1. Selecciona `backend` como **Root Directory** del proyecto.
2. Usa el runtime Node.js 22.x, compatible con el mínimo de `backend/package.json`.
3. Build Command: `npm run build`. Este script ejecuta `prisma generate && nest build`.
4. No configures un Output Directory estático: Vercel genera la Function desde el entrypoint de NestJS.
5. Configura las variables de entorno de producción de la tabla anterior en el proyecto Vercel. No copies valores locales ni uses una base local. `PORT` es para desarrollo local; Vercel administra el puerto HTTP de la Function.
6. Asigna en Vercel el dominio objetivo `notesbackend.chiqo.cc.cd` y configura `FRONTEND_ORIGIN` con el origen real del frontend. El dominio se administra en Vercel, no se fija en el código. La API conserva el prefijo `/api` (por ejemplo, sus rutas comienzan con `/api/auth`, `/api/notes` y `/api/categories`).

La instancia NestJS y su `PrismaService` singleton se inicializan durante el arranque en frío de cada instancia de Function y pueden reutilizarse en invocaciones atendidas por esa instancia. La Function no debe asumir estado local persistente. Cada instancia Prisma puede mantener su propio pool de conexiones: dimensiona el límite según la concurrencia y el proveedor, y considera un pooler PostgreSQL administrado para evitar agotar conexiones. En Supabase, `DATABASE_URL` del runtime usa Supavisor Transaction y `DIRECT_URL` se reserva para ejecutar migraciones fuera del arranque de Vercel. La conexión de producción y las migraciones remotas aún requieren validación antes del despliegue.

La cookie actual usa `SameSite=Strict`. Si el frontend queda en un sitio distinto del backend, el navegador puede no enviarla aunque CORS esté configurado. Antes de desplegar ambos, usa un mismo sitio con subdominios propios o un proxy del mismo origen; si la arquitectura requiere cookies cross-site, habrá que evaluar `SameSite=None; Secure` junto con protección CSRF explícita.

La documentación oficial consultada indica que NestJS se ejecuta en una única Function Node.js con Fluid compute. Se aplican los límites de Functions de Vercel, incluidos tamaño del paquete, memoria y duración de ejecución. Esto documenta la configuración prevista; el despliegue debe confirmarse en Vercel.

Referencias: [NestJS en Vercel](https://vercel.com/docs/frameworks/backend/nestjs), [Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js), [configuración de monorepos y Root Directory](https://vercel.com/docs/monorepos), [límites de Functions](https://vercel.com/docs/functions/limitations) y [conexiones Prisma ORM 6](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections).

## Preparación del frontend para Vercel

Para crear un proyecto Vercel independiente desde este repositorio:

1. Selecciona `frontend` como **Root Directory**.
2. Framework Preset: **Vite**.
3. Install Command: `npm ci` (el lockfile está incluido).
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Configura la variable pública de build `VITE_API_URL` con la URL del backend terminada en `/api`.
7. Asigna al proyecto el dominio previsto `https://notes.chiqo.cc.cd`; configura el backend con `FRONTEND_ORIGIN=https://notes.chiqo.cc.cd`.

El archivo `frontend/vercel.json` reescribe únicamente las rutas React actuales `/login` y `/archived` a `index.html`, para que funcionen al abrirlas o recargarlas directamente. No captura `/api` ni rutas de assets. La raíz `/` ya sirve el documento de entrada. Si se agregan rutas públicas nuevas, deben agregarse explícitamente a esas reglas.

Ambos dominios previstos (`notes.chiqo.cc.cd` y `notesbackend.chiqo.cc.cd`) son subdominios del mismo dominio registrable. La configuración actual usa cookie `HttpOnly`, `SameSite=Strict`, `Secure` en producción, Axios `withCredentials` y CORS con origen exacto. Al ser subdominios bajo el mismo sitio HTTPS, la cookie puede ser same-site aunque la petición sea cross-origin; CORS y las credenciales siguen siendo necesarios. El funcionamiento de cookies y sesión debe confirmarse en navegador después del despliegue real.

Los dominios acordados son `https://notes.chiqo.cc.cd` y `https://notesbackend.chiqo.cc.cd`. Confirma en Vercel el estado de los proyectos, DNS y certificados HTTPS antes de considerar operativos estos enlaces.

Referencias: [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite), [rewrites de Vercel](https://vercel.com/docs/routing/rewrites) y [monorepos/Root Directory](https://vercel.com/docs/monorepos).

## Inicio con el script

Desde la raíz, en Linux/macOS o en Git Bash/WSL:

```bash
./scripts/start.sh
```

También se puede ejecutar con `bash scripts/start.sh`. El script verifica versiones y configuración, crea archivos `.env` solo cuando faltan, instala dependencias si no están disponibles, genera Prisma Client, inicia PostgreSQL y espera su healthcheck, aplica migraciones existentes e inicia ambos servicios. `Ctrl+C` detiene los procesos de frontend y backend.

- Frontend: http://localhost:5173
- API: http://localhost:3000/api (o el puerto `PORT` configurado)
- PostgreSQL: `localhost:5433` por defecto (o el valor de `POSTGRES_PORT`)

## Comandos de calidad y pruebas

Ejecuta cada comando desde la carpeta de la aplicación correspondiente:

| Tarea             | Frontend               | Backend                |
| ----------------- | ---------------------- | ---------------------- |
| Desarrollo        | `npm run dev`          | `npm run start:dev`    |
| Build             | `npm run build`        | `npm run build`        |
| ESLint            | `npm run lint`         | `npm run lint`         |
| Verificar formato | `npm run format:check` | `npm run format:check` |
| Aplicar formato   | `npm run format`       | `npm run format`       |

`npm run format` modifica archivos para formatearlos. Las pruebas frontend de configuración de URL se ejecutan con `npm test` desde `frontend`. Las pruebas unitarias del backend se ejecutan con `npm run test:unit` y las de integración con `npm run test:integration`. Las pruebas de integración requieren una base PostgreSQL local aislada llamada `notes_app_test`; no uses la base de desarrollo. Configura `DATABASE_URL_TEST` con la URL de esa base y asígnala también a `DATABASE_URL` al aplicar sus migraciones. Por ejemplo, en PowerShell:

```powershell
$env:DATABASE_URL_TEST = "postgresql://<usuario>:<contraseña>@localhost:5432/notes_app_test?schema=public"
$env:DATABASE_URL = $env:DATABASE_URL_TEST
npm.cmd --prefix backend run prisma:migrate
npm.cmd --prefix backend run test:integration
```

La configuración de prueba solo acepta una URL local cuyo nombre sea exactamente `notes_app_test`; las pruebas crean y limpian sus propios registros.

## API REST

Todos los endpoints usan el prefijo `/api`.

| Método   | Endpoint                                | Descripción                                                                          |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET`    | `/api/notes`                            | Listar notas activas. Acepta el parámetro opcional `categoryId` (UUID) para filtrar. |
| `GET`    | `/api/notes/archived`                   | Listar notas archivadas.                                                             |
| `GET`    | `/api/notes/:id`                        | Consultar una nota por UUID.                                                         |
| `POST`   | `/api/notes`                            | Crear nota; requiere `title` y `content`.                                            |
| `PATCH`  | `/api/notes/:id`                        | Editar `title` y/o `content`.                                                        |
| `DELETE` | `/api/notes/:id`                        | Eliminar una nota.                                                                   |
| `PATCH`  | `/api/notes/:id/archive`                | Archivar una nota activa.                                                            |
| `PATCH`  | `/api/notes/:id/unarchive`              | Desarchivar una nota archivada.                                                      |
| `GET`    | `/api/categories`                       | Listar categorías.                                                                   |
| `POST`   | `/api/categories`                       | Crear categoría; requiere un nombre no vacío y acepta `color` como texto opcional.   |
| `POST`   | `/api/notes/:id/categories/:categoryId` | Asociar categoría a nota; responde `204`.                                            |
| `DELETE` | `/api/notes/:id/categories/:categoryId` | Quitar asociación; responde `204`.                                                   |
| `POST`   | `/api/auth/login`                       | Validar credenciales y establecer la cookie de sesión.                               |
| `GET`    | `/api/auth/me`                          | Consultar la sesión autenticada actual.                                              |
| `POST`   | `/api/auth/logout`                      | Eliminar la cookie de sesión; responde `204`.                                        |

Las rutas de notas y categorías, además de `/api/auth/me` y `/api/auth/logout`, requieren sesión. El login permanece público. La API valida UUIDs y cuerpos de solicitud. Credenciales incorrectas o ausencia de una sesión válida responden `401`; los nombres de categoría duplicados responden `409`; los errores de validación y recursos inexistentes usan respuestas HTTP de error.

### Contrato y categorías en notas archivadas

Los listados de notas incluyen las categorías asociadas. La vista de notas archivadas muestra sus categorías y permite quitar una asociación; las categorías no se eliminan. Los controles de asignación y el filtro por categoría se ofrecen en notas activas. El endpoint de filtro por `categoryId` solo lista notas activas.
