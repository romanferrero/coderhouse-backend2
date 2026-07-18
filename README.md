# Plataforma de Eventos Deportivos

API REST para una plataforma de eventos deportivos e inscripciones, desarrollada como proyecto del curso **Coderhouse Backend II**.

## Tematica elegida

Plataforma de **eventos deportivos** (partidos, torneos y carreras) e inscripciones. Los organizadores publican eventos con su disciplina, sede, fecha y cupo; en las proximas entregas los usuarios podran registrarse, iniciar sesion e inscribirse, con control de cupos y notificaciones.

Esta pre-entrega deja armada la **base arquitectonica**: un servidor Express organizado por capas, con la estructura inicial de los recursos `events` y `sessions`. Todavia no incluye autenticacion, roles ni logica de inscripciones (se suman en las siguientes entregas).

## Tecnologias

- **Node.js** con modulos **ESM** (`import`/`export`)
- **Express 4** como framework HTTP
- **Mongoose 8** como ODM de MongoDB
- **dotenv** para variables de entorno
- **nodemon** (desarrollo)

## Instalacion

```bash
git clone <url-del-repositorio>
cd coderhouse-backend2
npm install
```

## Configuracion de variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

```bash
cp .env.example .env
```

| Variable      | Descripcion                                                                 | Ejemplo                          |
|---------------|-----------------------------------------------------------------------------|----------------------------------|
| `PORT`        | Puerto en el que escucha el servidor                                        | `8080`                           |
| `NODE_ENV`    | Entorno de ejecucion (`development` / `production`)                          | `development`                    |
| `MONGO_URL`   | Cadena de conexion a MongoDB. Si se deja vacia, el servidor levanta igual   | `mongodb+srv://...`              |
| `JWT_SECRET`  | Secreto para firmar los JWT (se usa a partir de la proxima entrega)         | `un_secreto_largo_y_aleatorio`   |

> El archivo `.env` esta excluido por `.gitignore` y **no** debe subirse al repositorio.

## Como ejecutar

```bash
# Produccion
npm start

# Desarrollo (recarga automatica con nodemon)
npm run dev
```

El servidor arranca aunque `MONGO_URL` este vacia o la conexion falle: en ese caso lo avisa por consola y los endpoints siguen respondiendo (por ejemplo `GET /api/events` devuelve una lista vacia). Al iniciar deberia verse:

```
Servidor escuchando en puerto 8080 [development]
```

## Estructura de carpetas

```
coderhouse-backend2/
├── src/
│   ├── app.js                  # Configura Express y middlewares (no levanta el server)
│   ├── server.js               # Levanta el servidor y conecta la base (opcional)
│   ├── config/                 # Configuracion centralizada
│   │   ├── env.config.js       # Carga y expone las variables de entorno
│   │   └── db.js               # Conexion a MongoDB y estado de conexion
│   ├── routes/                 # Definicion de rutas
│   │   ├── index.router.js     # Agrupa las rutas bajo /api
│   │   ├── health.router.js
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/            # Traducen HTTP <-> servicios
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js
│   ├── services/               # Logica de negocio
│   │   └── events.service.js
│   ├── repositories/           # Intermedian entre servicios y DAO
│   │   └── events.repository.js
│   ├── dao/                    # Acceso a datos
│   │   └── mongo/
│   │       └── event.dao.js
│   ├── models/                 # Esquemas de Mongoose
│   │   ├── User.js             # Campos base para autenticacion y roles
│   │   └── Event.js            # Campos base del evento deportivo
│   ├── middlewares/            # Middlewares transversales
│   │   ├── errorHandler.js     # Manejo de errores global
│   │   └── notFound.js         # Respuesta 404 en JSON
│   └── utils/                  # Utilidades reutilizables
│       ├── apiResponse.js      # Helpers de formato de respuesta
│       └── asyncHandler.js     # Captura errores de handlers async
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

La arquitectura sigue el flujo por capas: **router → controller → service → repository → DAO → model**. La cadena completa esta implementada para el recurso `events`; `sessions` deja preparados router y controller para la autenticacion.

## Rutas disponibles

Todas las rutas cuelgan del prefijo `/api`.

| Metodo | Ruta                     | Descripcion                                    | Estado                       |
|--------|--------------------------|------------------------------------------------|------------------------------|
| GET    | `/api/health`            | Verifica que el servidor este activo           | Implementada                 |
| GET    | `/api/events`            | Lista de eventos (vacia por ahora)             | Implementada                 |
| GET    | `/api/events/:eid`       | Detalle de un evento por id                    | Implementada                 |
| POST   | `/api/sessions/register` | Registro de usuario                            | Stub (proxima entrega)       |
| POST   | `/api/sessions/login`    | Inicio de sesion                               | Stub (proxima entrega)       |
| GET    | `/api/sessions/current`  | Usuario autenticado actual                     | Stub (proxima entrega)       |
| POST   | `/api/sessions/logout`   | Cierre de sesion                               | Stub (proxima entrega)       |

### Ejemplos de respuesta

`GET /api/health` → `200`

```json
{ "status": "ok", "message": "Servidor activo", "db": "desconectada" }
```

`GET /api/events` → `200`

```json
{ "status": "success", "payload": [] }
```

Las rutas de `sessions` responden `501` mientras no esten implementadas:

```json
{ "status": "error", "message": "No implementado. Se completa en la proxima entrega." }
```

## Proximas entregas

- Registro y login de usuarios con **JWT** y **cookies**
- Estrategias de **Passport** (local y JWT) y endpoint `current`
- **Roles** y autorizacion (usuario / administrador)
- Gestion completa de eventos e **inscripciones** con control de cupos
- Notificaciones
