# Plataforma de Eventos Deportivos

API REST para una plataforma de eventos deportivos e inscripciones, desarrollada como proyecto del curso **Coderhouse Backend II**.

## Tematica elegida

Plataforma de **eventos deportivos** (partidos, torneos y carreras) e inscripciones. Los organizadores publican eventos con su disciplina, sede, fecha y cupo; en las proximas entregas los usuarios podran registrarse, iniciar sesion e inscribirse, con control de cupos y notificaciones.

El servidor Express esta organizado por capas, con los recursos `events` y `sessions`. Incluye **autenticacion completa centralizada con Passport.js**: la validacion de registro, login y usuario actual vive en **estrategias de Passport** (`register`, `login` y `current`). El registro es seguro (validaciones, normalizacion de email y hash de contrasena con bcrypt), el **login firma un JWT** que viaja en una **cookie HTTP Only**, y `GET /api/sessions/current` queda protegida por la estrategia JWT. El sistema queda **preparado para sumar providers externos (Google, GitHub, etc.) sin tocar `app.js`**: alcanza con agregar una estrategia mas en `config/passport.config.js`. Roles y logica de inscripciones se suman en las siguientes entregas.

## Tecnologias

- **Node.js** con modulos **ESM** (`import`/`export`)
- **Express 4** como framework HTTP
- **Mongoose 8** como ODM de MongoDB
- **Passport.js** (`passport-local` y `passport-jwt`) para centralizar las estrategias de autenticacion
- **bcrypt** para el hash de contrasenas
- **jsonwebtoken** para firmar y verificar los JWT
- **cookie-parser** para leer la cookie de autenticacion
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
| `JWT_SECRET`  | Secreto para firmar los JWT. Nunca se hardcodea en el codigo                 | `un_secreto_largo_y_aleatorio`   |
| `JWT_EXPIRES_IN` | Tiempo de expiracion del JWT (formato de `jsonwebtoken`)                 | `1h`                             |

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
│   ├── app.js                  # Configura Express, passport.initialize() y middlewares
│   ├── server.js               # Levanta el servidor y conecta la base (opcional)
│   ├── config/                 # Configuracion centralizada
│   │   ├── env.config.js       # Carga y expone las variables de entorno
│   │   ├── db.js               # Conexion a MongoDB y estado de conexion
│   │   └── passport.config.js  # Estrategias 'register', 'login' y 'current'
│   ├── routes/                 # Definicion de rutas
│   │   ├── index.router.js     # Agrupa las rutas bajo /api
│   │   ├── health.router.js
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/            # Traducen HTTP <-> servicios
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js # Setea/borra la cookie y firma el JWT
│   ├── services/               # Logica de negocio
│   │   ├── events.service.js
│   │   └── sessions.service.js # Registro y login: validaciones, hash y compare
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
│   │   ├── authenticate.js     # Envuelve passport.authenticate y setea req.user
│   │   ├── errorHandler.js     # Manejo de errores global
│   │   └── notFound.js         # Respuesta 404 en JSON
│   └── utils/                  # Utilidades reutilizables
│       ├── apiResponse.js      # Helpers de formato de respuesta
│       ├── asyncHandler.js     # Captura errores de handlers async
│       ├── jwt.js              # Firma y verificacion de JWT (jsonwebtoken)
│       └── hash.js             # Hash y verificacion de contrasenas (bcrypt)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

La arquitectura sigue el flujo por capas: **router → controller → service → repository → DAO → model**. La cadena completa esta implementada para `events` (lectura) y para el registro y login de `sessions`. La autenticacion esta **centralizada en `config/passport.config.js`** (estrategias `register`, `login` y `current`), que orquestan la logica de negocio del `sessions.service.js`; la firma del JWT vive en `utils/jwt.js`, el bcrypt en `utils/hash.js`, y el middleware `authenticate.js` solo delega en `passport.authenticate(...)`. Nada de esto vive en la ruta ni en `app.js` (que unicamente hace `passport.initialize()`).

## Rutas disponibles

Todas las rutas cuelgan del prefijo `/api`.

| Metodo | Ruta                     | Descripcion                                          | Auth        |
|--------|--------------------------|------------------------------------------------------|-------------|
| GET    | `/api/health`            | Verifica que el servidor este activo                 | Publica     |
| GET    | `/api/events`            | Lista de eventos (vacia por ahora)                   | Publica     |
| GET    | `/api/events/:eid`       | Detalle de un evento por id                          | Publica     |
| POST   | `/api/sessions/register` | Registro seguro de usuario                           | Publica     |
| POST   | `/api/sessions/login`    | Inicio de sesion: valida credenciales y setea cookie | Publica     |
| GET    | `/api/sessions/current`  | Devuelve el usuario autenticado (lee la cookie)      | **Protegida** |
| POST   | `/api/sessions/logout`   | Cierra sesion borrando la cookie                     | Publica     |

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

## Estrategias de Passport

La autenticacion esta centralizada en [`src/config/passport.config.js`](src/config/passport.config.js).
`app.js` solo llama a `initializePassport()` y a `passport.initialize()`: no conoce
el detalle de ninguna estrategia. Cada ruta de `sessions` delega en su estrategia a
traves del middleware [`authenticate.js`](src/middlewares/authenticate.js), que
envuelve `passport.authenticate(...)`, evita usar sesiones (`session: false`) y deja
el usuario en `req.user`.

| Estrategia | Tipo             | Que hace                                                                                     |
|------------|------------------|----------------------------------------------------------------------------------------------|
| `register` | `passport-local` | Valida datos, normaliza el email, controla unicidad, hashea con bcrypt y asigna `role: user`. |
| `login`    | `passport-local` | Valida credenciales y compara la contrasena con bcrypt. **No** genera el JWT.                 |
| `current`  | `passport-jwt`   | Extrae el JWT de la cookie `currentUser`, lo verifica y deja el payload en `req.user`.        |

- El **JWT lo firma el controller** (`sessions.controller.js`), no la estrategia: Passport
  solo autentica; la emision del token y el seteo de la cookie son responsabilidad del controller.
- La estrategia `register` orquesta la logica del `sessions.service.js`; el `role` **nunca**
  se toma del body, asi no puede escalarse desde el registro.
- **Preparado para providers externos:** sumar Google, GitHub u otro proveedor solo requiere
  agregar un `passport.use('google', ...)` en `passport.config.js`, **sin tocar `app.js`** ni
  las rutas existentes.

## Autenticacion: login, current y logout

El flujo de sesion usa un **JWT** firmado con `JWT_SECRET` que viaja en una cookie
**HTTP Only** llamada `currentUser`. El payload del token contiene solo lo minimo
(`id`, `email`, `role`) y **nunca** incluye la contrasena.

La cookie se setea con: `httpOnly: true`, `sameSite: 'lax'`, `maxAge: 3600000` (1 h)
y `secure: true` **solo en produccion** (`NODE_ENV=production`).

### `POST /api/sessions/login`

Valida las credenciales, compara la contrasena con bcrypt y, si son correctas,
firma el JWT y lo guarda en la cookie. Ante cualquier fallo responde **siempre** el
mismo `401` generico, sin distinguir si el email no existe o la contrasena es
incorrecta (para no filtrar que emails estan registrados).

**Request:**

```json
{ "email": "ana@mail.com", "password": "Secreta123" }
```

**Respuesta `200`** (ademas setea la cookie `currentUser` HTTP Only):

```json
{ "status": "success", "message": "Login correcto" }
```

**Respuesta `401`** (credenciales invalidas — mensaje generico):

```json
{ "status": "error", "message": "Credenciales invalidas" }
```

### `GET /api/sessions/current`

Ruta **protegida** por la estrategia `current` de Passport. La estrategia lee la
cookie `currentUser`, verifica el JWT y deja el payload en `req.user`. Devuelve
los datos basicos del usuario, sin la contrasena.

**Request:** no lleva body; el navegador envia la cookie `currentUser` automaticamente.

**Respuesta `200`:**

```json
{ "status": "success", "payload": { "id": "665f2a...", "email": "ana@mail.com", "role": "user" } }
```

**Respuesta `401`** (sin cookie, o token invalido/manipulado/expirado):

```json
{ "status": "error", "message": "No autenticado" }
```

### `POST /api/sessions/logout`

Borra la cookie `currentUser` y confirma el cierre de sesion.

**Request:** no lleva body.

**Respuesta `200`** (borra la cookie):

```json
{ "status": "success", "message": "Sesion cerrada" }
```

### Como probarlo (flujo completo)

Con `curl`, guardando las cookies en un archivo (`-c` las guarda, `-b` las envia):

```bash
# 1. Login: guarda la cookie currentUser en cookies.txt
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{ "email": "ana@mail.com", "password": "Secreta123" }'

# 2. Current: envia la cookie y devuelve el usuario autenticado (200)
curl http://localhost:8080/api/sessions/current -b cookies.txt

# 3. Logout: borra la cookie
curl -X POST http://localhost:8080/api/sessions/logout -b cookies.txt -c cookies.txt

# 4. Current sin cookie valida: 401 "No autenticado"
curl http://localhost:8080/api/sessions/current
```

En Postman/Thunder Client alcanza con hacer el login (la cookie queda guardada en
el cliente) y luego llamar a `current` y `logout`; el cliente reenvia la cookie solo.

### Casos cubiertos

- Registro exitoso → login → `current` (200) → logout → `current` (401).
- Login con email inexistente → `401` generico.
- Login con contrasena incorrecta → `401` generico (mismo mensaje).
- `current` sin cookie → `401`.
- `current` con token manipulado o expirado → `401`.
- El payload del JWT no incluye la contrasena y ninguna respuesta la expone.

## Proximas entregas

- Estrategias de autenticacion con **providers externos** (Google / GitHub), sobre la base ya preparada en `passport.config.js`
- **Roles** y autorizacion (usuario / organizador / administrador)
- Gestion completa de eventos e **inscripciones** con control de cupos
- Notificaciones
