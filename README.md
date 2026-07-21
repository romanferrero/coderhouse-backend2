# Plataforma de Eventos Deportivos

API REST para una plataforma de eventos deportivos e inscripciones, desarrollada como proyecto del curso **Coderhouse Backend II**.

## Tematica elegida

Plataforma de **eventos deportivos** (partidos, torneos y carreras) e inscripciones. Los organizadores publican eventos con su disciplina, sede, fecha y cupo; en las proximas entregas los usuarios podran registrarse, iniciar sesion e inscribirse, con control de cupos y notificaciones.

El servidor Express esta organizado por capas, con los recursos `events` y `sessions`. Ya incluye el **registro seguro de usuarios** (`POST /api/sessions/register`) con validaciones, normalizacion de email y hash de contrasena con bcrypt. Login, JWT, roles y logica de inscripciones se suman en las siguientes entregas.

## Tecnologias

- **Node.js** con modulos **ESM** (`import`/`export`)
- **Express 4** como framework HTTP
- **Mongoose 8** como ODM de MongoDB
- **bcrypt** para el hash de contrasenas
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
│   │   ├── events.service.js
│   │   └── sessions.service.js # Registro: validaciones, normalizacion y hash
│   ├── repositories/           # Intermedian entre servicios y DAO
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── dao/                    # Acceso a datos
│   │   └── mongo/
│   │       ├── event.dao.js
│   │       └── user.dao.js
│   ├── models/                 # Esquemas de Mongoose
│   │   ├── User.js             # first_name, last_name, email, password, role
│   │   └── Event.js            # Campos base del evento deportivo
│   ├── middlewares/            # Middlewares transversales
│   │   ├── errorHandler.js     # Manejo de errores global
│   │   └── notFound.js         # Respuesta 404 en JSON
│   └── utils/                  # Utilidades reutilizables
│       ├── apiResponse.js      # Helpers de formato de respuesta
│       ├── asyncHandler.js     # Captura errores de handlers async
│       └── hash.js             # Hash y verificacion de contrasenas (bcrypt)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

La arquitectura sigue el flujo por capas: **router → controller → service → repository → DAO → model**. La cadena completa esta implementada para `events` (lectura) y para el registro de `sessions`.

## Rutas disponibles

Todas las rutas cuelgan del prefijo `/api`.

| Metodo | Ruta                     | Descripcion                                    | Estado                       |
|--------|--------------------------|------------------------------------------------|------------------------------|
| GET    | `/api/health`            | Verifica que el servidor este activo           | Implementada                 |
| GET    | `/api/events`            | Lista de eventos (vacia por ahora)             | Implementada                 |
| GET    | `/api/events/:eid`       | Detalle de un evento por id                    | Implementada                 |
| POST   | `/api/sessions/register` | Registro seguro de usuario                     | Implementada                 |
| POST   | `/api/sessions/login`    | Inicio de sesion                               | Stub (proxima entrega)       |
| GET    | `/api/sessions/current`  | Usuario autenticado actual                     | Stub (proxima entrega)       |
| POST   | `/api/sessions/logout`   | Cierre de sesion                               | Stub (proxima entrega)       |

## Registro de usuarios: `POST /api/sessions/register`

Crea un usuario nuevo de forma segura. Requiere conexion a MongoDB.

### Campos que espera (en el body, JSON)

| Campo        | Tipo   | Requerido | Reglas                                             |
|--------------|--------|-----------|----------------------------------------------------|
| `first_name` | string | Si        | No vacio                                           |
| `last_name`  | string | Si        | No vacio                                           |
| `email`      | string | Si        | Formato valido; se normaliza (trim + lowercase); unico |
| `password`   | string | Si        | Minimo 8 caracteres                                |

> El campo `role` **no** se acepta desde el body: todo registro publico se crea con `role: "user"`. Los valores posibles del modelo son `user`, `organizer` y `admin`.

La contrasena se hashea con **bcrypt** antes de guardarse y **nunca** se devuelve en la respuesta (ni en texto plano ni hasheada).

### Como probarlo

Con el servidor levantado (`npm run dev`) y `MONGO_URL` configurada, por ejemplo con `curl`:

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{ "first_name": "Ana", "last_name": "Perez", "email": "Ana@Mail.com ", "password": "Secreta123" }'
```

Tambien podes usar Postman o Thunder Client apuntando a `POST http://localhost:8080/api/sessions/register` con el mismo body en formato JSON.

**Respuesta `201` (email normalizado, sin `password`):**

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "first_name": "Ana",
    "last_name": "Perez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

**Respuesta `400` (campos faltantes o email/password invalidos):**

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
```

**Respuesta `409` (email ya registrado):**

```json
{ "status": "error", "message": "El email ya esta registrado" }
```

### Casos cubiertos

- Registro exitoso con email normalizado.
- Campos obligatorios faltantes → `400`.
- Email con formato invalido → `400`.
- Contrasena menor a 8 caracteres → `400`.
- Email ya registrado → `409`.
- La contrasena se guarda hasheada (no en texto plano) y no se devuelve en la respuesta.

### Ejemplos de respuesta

`GET /api/health` → `200`

```json
{ "status": "ok", "message": "Servidor activo", "db": "desconectada" }
```

`GET /api/events` → `200`

```json
{ "status": "success", "payload": [] }
```

Las rutas de `sessions` aun no implementadas (`login`, `current`, `logout`) responden `501`:

```json
{ "status": "error", "message": "No implementado. Se completa en la proxima entrega." }
```

## Proximas entregas

- Login de usuarios con **JWT** y **cookies**
- Estrategias de **Passport** (local y JWT) y endpoint `current`
- **Roles** y autorizacion (usuario / administrador)
- Gestion completa de eventos e **inscripciones** con control de cupos
- Notificaciones
