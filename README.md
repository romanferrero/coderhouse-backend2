# Plataforma de Eventos Deportivos

API REST para una plataforma de eventos deportivos e inscripciones, desarrollada como proyecto del curso **Coderhouse Backend II**.

## Tematica elegida

Plataforma de **eventos deportivos** (partidos, torneos y carreras) e inscripciones. Los organizadores publican eventos con su categoria, ubicacion, fecha, cupo y precio, y los usuarios se inscriben con control de cupos, cancelaciones y notificacion por email.

El servidor Express esta organizado por capas, con los recursos `events`, `sessions` y `users`. Incluye **autenticacion completa centralizada con Passport.js**: la validacion de registro, login y usuario actual vive en **estrategias de Passport** (`register`, `login` y `current`). El registro es seguro (validaciones, normalizacion de email y hash de contrasena con bcrypt), el **login firma un JWT** que viaja en una **cookie HTTP Only**, y `GET /api/sessions/current` queda protegida por la estrategia JWT. El sistema queda **preparado para sumar providers externos (Google, GitHub, etc.) sin tocar `app.js`**: alcanza con agregar una estrategia mas en `config/passport.config.js`.

Sobre esa base suma un **sistema de autorizacion por roles** (`user`, `organizer`, `admin`) con una **matriz de permisos** clara, un **middleware de autorizacion reutilizable** y rutas sensibles protegidas segun el rol. La API distingue correctamente entre **401** (sin sesion) y **403** (con sesion pero sin permiso), e incorpora una **validacion de propiedad de recursos**: un organizer solo puede modificar o cancelar los eventos que creo; el admin, cualquiera.

Encima de eso vive la **entidad central del dominio: los eventos**, con su **CRUD completo** (crear, listar, consultar, actualizar y cancelar), el **ciclo de vida por estados** (`draft` → `published` → `finished`, con `cancelled` como estado terminal) y las **reglas de negocio** del dominio validadas **en la capa de services**: nada de fechas pasadas, capacidad mayor a 0, precio no negativo, estados validos y transiciones coherentes. El listado publico soporta **filtros, paginacion y ordenamiento**, y **cancelar nunca borra**: es un cambio de estado.

Por ultimo suma el **flujo completo de inscripciones**: la entidad **`Ticket`**, que relaciona usuario y evento **solo por referencias**, con su propio ciclo de estados (`pending` / `confirmed` / `cancelled`), **codigo de reserva unico** y **control de cupos** calculado sobre los tickets activos (los `cancelled` **no** ocupan lugar, asi cancelar libera el cupo automaticamente). Valida estado y fecha del evento, cantidad solicitada e **inscripciones duplicadas** —con un **indice unico parcial** como red de seguridad ante requests simultaneas—, permite **cancelar sin borrar** (guarda `cancelledAt` y conserva el historial) y envia un **email de confirmacion con Nodemailer**, con las credenciales siempre en variables de entorno.

## Tecnologias

- **Node.js** con modulos **ESM** (`import`/`export`)
- **Express 4** como framework HTTP
- **Mongoose 8** como ODM de MongoDB
- **Passport.js** (`passport-local` y `passport-jwt`) para centralizar las estrategias de autenticacion
- **bcrypt** para el hash de contrasenas
- **jsonwebtoken** para firmar y verificar los JWT
- **cookie-parser** para leer la cookie de autenticacion
- **Nodemailer** para el envio de emails de confirmacion de inscripcion
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
| `MAIL_HOST`   | Host del servidor SMTP que envia los emails                                  | `smtp.gmail.com`                 |
| `MAIL_PORT`   | Puerto SMTP. `465` usa TLS directo; `587` sube a TLS con STARTTLS            | `587`                            |
| `MAIL_USER`   | Usuario / casilla desde la que se envia                                      | `tu_cuenta@gmail.com`            |
| `MAIL_PASS`   | Contrasena de aplicacion del SMTP. **Nunca** se hardcodea en el codigo       | `abcd efgh ijkl mnop`            |
| `MAIL_FROM`   | Remitente que ve el destinatario. Si se deja vacio, se usa `MAIL_USER`       | `Eventos <tu_cuenta@gmail.com>`  |

> El archivo `.env` esta excluido por `.gitignore` y **no** debe subirse al repositorio.

> **Sobre las variables de email:** son **opcionales para levantar el proyecto**. Si faltan, la inscripcion se registra igual y el envio se saltea con un aviso por consola (`[mail] ... sin configurar`); un fallo de SMTP nunca tumba una inscripcion ya guardada. En Gmail **no** va la contrasena de la cuenta: hay que activar la verificacion en dos pasos y generar una **App Password**. Para probar sin una casilla real sirve [Ethereal](https://ethereal.email) (`smtp.ethereal.email`, puerto `587`), que captura el mail y lo muestra por web en vez de entregarlo.

## Como ejecutar

```bash
# Produccion
npm start

# Desarrollo (recarga automatica con nodemon)
npm run dev
```

El servidor arranca aunque `MONGO_URL` este vacia o la conexion falle: en ese caso lo avisa por consola y los endpoints siguen respondiendo (por ejemplo `GET /api/events` devuelve una pagina vacia). Al iniciar deberia verse:

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
│   │   ├── roles.js            # Constantes de roles (user/organizer/admin)
│   │   ├── eventStatus.js      # Constantes de estados de evento (draft/published/...)
│   │   ├── ticketStatus.js     # Estados de ticket + lista de estados que ocupan cupo
│   │   ├── mail.config.js      # Transporter de Nodemailer (credenciales desde env)
│   │   └── passport.config.js  # Estrategias 'register', 'login' y 'current'
│   ├── routes/                 # Definicion de rutas
│   │   ├── index.router.js     # Agrupa las rutas bajo /api
│   │   ├── health.router.js
│   │   ├── events.router.js    # GET publico; POST/PUT/PATCH/DELETE + rutas /:eid/tickets
│   │   ├── tickets.router.js   # /my-tickets y /:tid/cancel
│   │   ├── sessions.router.js
│   │   └── users.router.js     # GET /users protegida (solo admin)
│   ├── controllers/            # Traducen HTTP <-> servicios
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   ├── tickets.controller.js
│   │   ├── sessions.controller.js # Setea/borra la cookie y firma el JWT
│   │   └── users.controller.js
│   ├── services/               # Logica de negocio
│   │   ├── events.service.js   # Reglas de negocio, estados, filtros y propiedad
│   │   ├── tickets.service.js  # Cupos, duplicados, estados y propiedad del ticket
│   │   ├── mail.service.js     # Arma y envia el mail de confirmacion
│   │   ├── sessions.service.js # Registro y login: validaciones, hash y compare
│   │   └── users.service.js    # Listado de usuarios sin exponer el password
│   ├── repositories/           # Intermedian entre servicios y DAO
│   │   ├── events.repository.js
│   │   ├── tickets.repository.js
│   │   └── users.repository.js
│   ├── dao/                    # Acceso a datos
│   │   └── mongo/
│   │       ├── event.dao.js    # Query de filtros, paginacion, orden y populate
│   │       ├── ticket.dao.js   # Aggregate de cupos ocupados y populate
│   │       └── user.dao.js
│   ├── models/                 # Esquemas de Mongoose
│   │   ├── User.js             # first_name, last_name, email, password, role
│   │   ├── Event.js            # Campos del evento + organizer (referencia)
│   │   └── Ticket.js           # user + event (referencias), status, quantity, codigo
│   ├── middlewares/            # Middlewares transversales
│   │   ├── authenticate.js     # Auth: envuelve passport.authenticate, setea req.user, 401
│   │   ├── authorize.js        # Autorizacion por roles: recibe roles permitidos, 403
│   │   ├── errorHandler.js     # Manejo de errores global
│   │   └── notFound.js         # Respuesta 404 en JSON
│   └── utils/                  # Utilidades reutilizables
│       ├── apiResponse.js      # Helpers de formato de respuesta
│       ├── asyncHandler.js     # Captura errores de handlers async
│       ├── httpError.js        # Crea Error con status HTTP para el errorHandler
│       ├── jwt.js              # Firma y verificacion de JWT (jsonwebtoken)
│       ├── reservationCode.js  # Genera el codigo de reserva del ticket (crypto)
│       └── hash.js             # Hash y verificacion de contrasenas (bcrypt)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

La arquitectura sigue el flujo por capas: **router → controller → service → repository → DAO → model**. La cadena completa esta implementada para `events` (CRUD completo), para `tickets` (inscripciones) y para el registro y login de `sessions`. La division de responsabilidades es estricta:

- **router** → declara la ruta y encadena los middlewares (`authenticate`, `authorize`). No valida datos.
- **controller** → traduce HTTP ↔ service: lee `req.body`/`req.query`/`req.params`, arma la respuesta. **Cero reglas de negocio.**
- **service** → **todas** las reglas del dominio: campos obligatorios, fechas, capacidad, precio, estados validos, transiciones, **cupos, duplicados** y propiedad del recurso.
- **repository / DAO** → unico lugar que habla con Mongo: filtros, paginacion, orden, `populate` y el `aggregate` que suma los cupos ocupados.
 La autenticacion esta **centralizada en `config/passport.config.js`** (estrategias `register`, `login` y `current`), que orquestan la logica de negocio del `sessions.service.js`; la firma del JWT vive en `utils/jwt.js`, el bcrypt en `utils/hash.js`, y el middleware `authenticate.js` solo delega en `passport.authenticate(...)`. Nada de esto vive en la ruta ni en `app.js` (que unicamente hace `passport.initialize()`).

## Rutas disponibles

Todas las rutas cuelgan del prefijo `/api`.

| Metodo | Ruta                     | Descripcion                                          | Auth        |
|--------|--------------------------|------------------------------------------------------|-------------|
| GET    | `/api/health`            | Verifica que el servidor este activo                 | Publica     |
| GET    | `/api/events`            | Lista de eventos con filtros, paginacion y orden     | Publica     |
| GET    | `/api/events/:eid`       | Detalle de un evento por id                          | Publica     |
| POST   | `/api/events`            | Crea un evento                                       | **organizer / admin** |
| PUT    | `/api/events/:eid`       | Modifica un evento (dueño del evento o admin)        | **organizer / admin** |
| PATCH  | `/api/events/:eid/status`| Cambia el estado del evento (dueño del evento o admin) | **organizer / admin** |
| DELETE | `/api/events/:eid`       | Cancela un evento (atajo de `PATCH status=cancelled`)  | **organizer / admin** |
| POST   | `/api/events/:eid/tickets` | Inscribe al usuario autenticado al evento          | **Autenticada** |
| GET    | `/api/events/:eid/tickets` | Lista los inscriptos al evento (dueño o admin)     | **organizer / admin** |
| GET    | `/api/tickets/my-tickets`  | Inscripciones del usuario autenticado              | **Autenticada** |
| PATCH  | `/api/tickets/:tid/cancel` | Cancela una inscripcion (dueño del ticket o admin) | **Autenticada** |
| POST   | `/api/sessions/register` | Registro seguro de usuario                           | Publica     |
| POST   | `/api/sessions/login`    | Inicio de sesion: valida credenciales y setea cookie | Publica     |
| GET    | `/api/sessions/current`  | Devuelve el usuario autenticado (lee la cookie)      | **Autenticada** |
| POST   | `/api/sessions/logout`   | Cierra sesion borrando la cookie                     | Publica     |
| GET    | `/api/users`             | Lista todos los usuarios                             | **admin**   |

## Roles y autorizacion

La API define **tres roles**, que viven como constantes en [`src/config/roles.js`](src/config/roles.js) (nunca se escriben "a mano" en las rutas):

| Rol         | Para que sirve                                                        |
|-------------|----------------------------------------------------------------------|
| `user`      | Usuario comun. Es el rol **por defecto** de todo registro publico.   |
| `organizer` | Publica y gestiona **sus propios** eventos.                          |
| `admin`     | Gestiona **cualquier** evento y accede a rutas administrativas.      |

> El campo `role` **no** se acepta desde el body del registro: todo usuario publico se crea con `role: "user"`. Ascender a `organizer` o `admin` es una tarea administrativa (fuera del registro publico), asi el rol no puede escalarse desde afuera.

### Matriz de permisos

| Accion                                        | user | organizer | admin |
|-----------------------------------------------|:----:|:---------:|:-----:|
| Consultar el listado y el detalle de eventos  |  ✅  |    ✅     |  ✅   |
| Crear eventos                                 |  ❌  |    ✅     |  ✅   |
| Modificar eventos **propios**                 |  ❌  |    ✅     |  ✅   |
| Cambiar el estado de eventos **propios**      |  ❌  |    ✅     |  ✅   |
| Modificar / cambiar estado de **cualquier** evento |  ❌  |    ❌ |  ✅   |
| Inscribirse a un evento publicado             |  ✅  |    ✅     |  ✅   |
| Ver **sus propias** inscripciones             |  ✅  |    ✅     |  ✅   |
| Cancelar **sus propias** inscripciones        |  ✅  |    ✅     |  ✅   |
| Ver los inscriptos de eventos **propios**     |  ❌  |    ✅     |  ✅   |
| Ver los inscriptos / cancelar tickets de **cualquiera** |  ❌  | ❌  |  ✅   |
| Ver todos los usuarios                        |  ❌  |    ❌     |  ✅   |

### Los dos middlewares (separados y reutilizables)

La autorizacion se resuelve con **dos middlewares independientes de las rutas**, que se encadenan:

1. **Autenticacion** — [`src/middlewares/authenticate.js`](src/middlewares/authenticate.js): envuelve `passport.authenticate('current')`, lee el **JWT de la cookie**, lo valida y puebla `req.user`. Si no hay sesion valida responde **401**.
2. **Autorizacion** — [`src/middlewares/authorize.js`](src/middlewares/authorize.js): recibe **los roles permitidos como parametro** (`authorize(ROLES.ORGANIZER, ROLES.ADMIN)`), los compara contra `req.user.role` y, si no coincide, responde **403**. Es totalmente reutilizable: cada ruta decide que roles acepta.

En la ruta se ven siempre en ese orden (primero se sabe *quien sos*, despues *que podes hacer*):

```js
router.post('/',
    authenticate('current'),                 // 401 si no hay sesion
    authorize(ROLES.ORGANIZER, ROLES.ADMIN), // 403 si el rol no alcanza
    asyncHandler(createEvent)
);
```

### Propiedad de recursos (ownership)

El middleware `authorize` valida el **rol**, pero no alcanza para decir *"este organizer puede tocar este evento puntual"*. Esa regla mas fina vive en el **service** ([`events.service.js`](src/services/events.service.js)), que necesita leer el dato para decidir:

- **admin** → puede modificar/cancelar **cualquier** evento.
- **organizer** → solo si el `organizer` del evento coincide con su id.
- Si el evento **no existe** → **404**.
- Si existe pero **no le pertenece** → **403**.

Al crear un evento, el `organizer` se toma de `req.user.id` (nunca del body), asi el dueño queda fijado por la sesion. La misma regla la comparten `PUT /api/events/:eid` y `PATCH /api/events/:eid/status`.

Los **tickets** tienen su propia version de la misma idea, en [`tickets.service.js`](src/services/tickets.service.js):

- **`PATCH /api/tickets/:tid/cancel`** → solo el **dueño del ticket** o un **admin** (`404` si no existe, `403` si es ajeno).
- **`GET /api/events/:eid/tickets`** → reutiliza `eventsService.assertCanManage`, o sea la propiedad **del evento**: el organizer ve los inscriptos de los suyos, el admin los de cualquiera.
- **`GET /api/tickets/my-tickets`** → el id sale **de la sesion, nunca de la URL**, asi no hay forma de pedir los tickets de otro cambiando un parametro.

### 401 vs 403 (la diferencia clave)

La API **nunca** usa el mismo codigo para los dos casos, ni cae en un 500 generico:

| Situacion                                             | Codigo | Mensaje                                        |
|-------------------------------------------------------|:------:|------------------------------------------------|
| No hay cookie / token invalido o expirado             | `401`  | `No autenticado`                               |
| Hay sesion, pero el rol no tiene permiso              | `403`  | `No tenes permisos para realizar esta accion`  |
| Hay sesion y rol, pero el recurso no es suyo          | `403`  | `No podes gestionar un evento que no te pertenece` |
| El recurso no existe                                   | `404`  | `Evento no encontrado`                         |
| Faltan datos al crear/modificar                        | `400`  | `Faltan campos obligatorios: ...`              |
| Un dato es invalido (fecha, capacidad, precio, estado) | `400`  | `La fecha del evento no puede ser pasada`      |
| La accion choca con el estado actual del evento        | `409`  | `Un evento cancelado no puede modificarse`     |
| No quedan cupos para la cantidad pedida                | `409`  | `Cupos insuficientes: quedan 2 lugares y pediste 5` |
| Ya existe una inscripcion activa a ese evento          | `409`  | `Ya tenes una inscripcion activa para este evento` |
| La base no esta disponible al crear                    | `503`  | `Base de datos no disponible`                  |
| Cualquier falla no contemplada                         | `500`  | `Error interno del servidor`                   |

**403 — autenticado pero sin permiso** (ej: `user` haciendo `POST /api/events`):

```json
{ "status": "error", "message": "No tenes permisos para realizar esta accion" }
```

**401 — ruta privada sin cookie**:

```json
{ "status": "error", "message": "No autenticado" }
```

### Casos a probar

Con `curl` (`-c` guarda cookies, `-b` las envia). Se asume que ya existen usuarios con cada rol.

```bash
# --- login como user, organizer o admin guardando su cookie ---
curl -X POST http://localhost:8080/api/sessions/login -H "Content-Type: application/json" \
  -c user.txt -d '{ "email": "user@mail.com", "password": "Secreta123" }'

# 1. POST /api/events con rol user -> 403
curl -X POST http://localhost:8080/api/events -H "Content-Type: application/json" -b user.txt \
  -d '{ "title": "Maraton", "description": "10k", "category": "running", "location": "Parque", "date": "2027-10-01", "capacity": 100 }'

# 2. POST /api/events con rol organizer -> 201
curl -X POST http://localhost:8080/api/events -H "Content-Type: application/json" -b organizer.txt \
  -d '{ "title": "Maraton", "description": "10k", "category": "running", "location": "Parque", "date": "2027-10-01", "capacity": 100 }'

# 3. Ruta administrativa con rol organizer -> 403
curl http://localhost:8080/api/users -b organizer.txt

# 4. Ruta administrativa con rol admin -> 200
curl http://localhost:8080/api/users -b admin.txt

# 5. Cualquier ruta privada sin cookie -> 401
curl -X POST http://localhost:8080/api/events -H "Content-Type: application/json" \
  -d '{ "title": "x" }'

# 6. organizer modificando un evento ajeno -> 403
curl -X PUT http://localhost:8080/api/events/<id-de-evento-de-otro> -H "Content-Type: application/json" \
  -b organizer.txt -d '{ "title": "Editado" }'
```

> Para probar `organizer`/`admin` primero hay que asignarles ese rol (por ejemplo actualizando el campo `role` del usuario directamente en la base, ya que el registro publico siempre crea `user`).

## Gestion de eventos

Los eventos son la **entidad central** del dominio. El modelo vive en [`src/models/Event.js`](src/models/Event.js) y las reglas en [`src/services/events.service.js`](src/services/events.service.js).

### Modelo `Event`

| Campo         | Tipo       | Requerido | Reglas                                                              |
|---------------|------------|-----------|---------------------------------------------------------------------|
| `title`       | string     | Si        | No vacio                                                            |
| `description` | string     | Si        | No vacio                                                            |
| `category`    | string     | Si        | No vacio. Se normaliza a **minusculas** (ej: `running`, `workshop`) |
| `date`        | Date       | Si        | Fecha valida y **futura**                                           |
| `location`    | string     | Si        | No vacio                                                            |
| `capacity`    | number     | Si        | Entero **> 0**                                                      |
| `price`       | number     | No        | **>= 0**. Si no viene, queda en `0` (evento gratuito)               |
| `status`      | string     | No        | Uno de `draft` \| `published` \| `cancelled` \| `finished`. Por defecto `draft` |
| `organizer`   | ObjectId   | Si (auto) | **Referencia** (`ref: 'users'`) al usuario que lo creo              |

Ademas trae `createdAt` / `updatedAt` por `timestamps: true`.

> **`organizer` es una referencia, no un objeto embebido.** En la base se guarda solo el `ObjectId`; al leer, la API lo devuelve **poblado** con `first_name`, `last_name`, `email` y `role` (nunca el `password`). Al crear se toma **siempre** de `req.user.id`: si el body trae un `organizer`, se ignora. Tampoco se puede reasignar por `PUT` (responde `400`).

### Ciclo de vida del estado

```
draft ──> published ──> finished
  │            │            │
  └────────────┴────────────┴──> cancelled  (terminal)
```

- El evento **nace en `draft`**: publicarlo es una accion explicita.
- **`cancelled` es terminal**: de ahi no se vuelve ni se puede editar el evento.
- **Cancelar no borra**: no existe el borrado fisico en el DAO, cancelar es pasar el `status` a `cancelled`.

### Reglas de negocio (todas en la capa `services`)

| Regla                                                              | Codigo |
|--------------------------------------------------------------------|:------:|
| Faltan campos obligatorios                                         | `400`  |
| Fecha invalida, o **fecha pasada** al crear o al reprogramar        | `400`  |
| `capacity` no entero o **<= 0**                                     | `400`  |
| `price` no numerico o **< 0**                                       | `400`  |
| `status` fuera del enum                                             | `400`  |
| Al crear, `status` distinto de `draft` / `published`                | `400`  |
| `status` en el body del `PUT` (se cambia por `PATCH .../status`)    | `400`  |
| `organizer` en el body del `PUT` (no se reasigna)                   | `400`  |
| `PUT` sin ningun campo para actualizar                              | `400`  |
| Modificar un evento **cancelado**                                   | `409`  |
| Cambiarle el estado a un evento **cancelado**                       | `409`  |
| **Publicar** un evento ya **finalizado**                            | `409`  |
| **Publicar** un evento cuya fecha ya paso                           | `409`  |
| Cambiar un evento al estado que ya tiene                            | `409`  |
| El evento no existe (o el id no es un ObjectId valido)              | `404`  |

### `GET /api/events` — filtros, paginacion y ordenamiento

Ruta **publica**. Todos los parametros van en la query string y son opcionales.

| Parametro   | Descripcion                                                          | Ejemplo               |
|-------------|----------------------------------------------------------------------|-----------------------|
| `status`    | Filtra por estado exacto (valor del enum)                            | `status=published`    |
| `category`  | Filtra por categoria exacta (insensible a mayusculas)                | `category=workshop`   |
| `location`  | Coincidencia **parcial** e insensible a mayusculas                   | `location=palermo`    |
| `dateFrom`  | Eventos desde esta fecha (inclusive)                                 | `dateFrom=2027-01-01` |
| `dateTo`    | Eventos hasta esta fecha (inclusive)                                 | `dateTo=2027-12-31`   |
| `page`      | Numero de pagina, entero > 0. Por defecto `1`                        | `page=2`              |
| `limit`     | Items por pagina, entero > 0. Por defecto `10`, **maximo `100`**     | `limit=5`             |
| `sort`      | Campo de orden; con `-` adelante es descendente. Por defecto `date`  | `sort=-date`          |

- Campos ordenables: `date`, `price`, `capacity`, `title`, `createdAt`. Cualquier otro devuelve `400`.
- Un `page`/`limit` no numerico o `<= 0`, un `status` fuera del enum, una fecha invalida o un `dateFrom` posterior a `dateTo` devuelven **`400`** con el detalle.
- El `limit` tiene techo para que un `?limit=999999` no se traiga la coleccion entera.

**Ejemplo:** `GET /api/events?status=published&category=workshop&page=2&limit=5&sort=-date`

```json
{
  "status": "success",
  "data": [
    {
      "_id": "665f2a...",
      "title": "Workshop de arqueria",
      "description": "Iniciacion, con equipo incluido",
      "category": "workshop",
      "date": "2027-03-15T00:00:00.000Z",
      "location": "Club Belgrano",
      "capacity": 20,
      "price": 3500,
      "status": "published",
      "organizer": {
        "_id": "665f10...",
        "first_name": "Ana",
        "last_name": "Perez",
        "email": "ana@mail.com",
        "role": "organizer"
      },
      "createdAt": "2026-07-01T12:00:00.000Z",
      "updatedAt": "2026-07-01T12:00:00.000Z"
    }
  ],
  "page": 2,
  "limit": 5,
  "total": 12,
  "totalPages": 3
}
```

> El listado **nunca** devuelve todo junto: si no se manda `limit`, igual pagina de 10 en 10.

### `POST /api/events` — crear (organizer / admin)

```json
{
  "title": "Maraton de la ciudad",
  "description": "10k por el parque",
  "category": "running",
  "date": "2027-10-01T09:00:00.000Z",
  "location": "Parque Centenario",
  "capacity": 100,
  "price": 1500
}
```

Responde `201` con el evento creado (`status: "draft"` y el `organizer` poblado). El `organizer` sale de la sesion, no del body.

### `PUT /api/events/:eid` — modificar (dueño o admin)

Actualizacion **parcial**: se mandan solo los campos a cambiar, y cada uno se revalida con las mismas reglas del create. Los campos editables son `title`, `description`, `category`, `date`, `location`, `capacity` y `price`.

`status` y `organizer` **no** se tocan por aca (devuelve `400` y avisa por donde va cada cosa).

```bash
curl -X PUT http://localhost:8080/api/events/<eid> -H "Content-Type: application/json" \
  -b organizer.txt -d '{ "capacity": 250, "price": 2000 }'
```

### `PATCH /api/events/:eid/status` — cambiar estado (dueño o admin)

Unico camino para mover el `status`. El body lleva solo el estado destino:

```json
{ "status": "published" }
```

```bash
# publicar
curl -X PATCH http://localhost:8080/api/events/<eid>/status -H "Content-Type: application/json" \
  -b organizer.txt -d '{ "status": "published" }'

# cancelar
curl -X PATCH http://localhost:8080/api/events/<eid>/status -H "Content-Type: application/json" \
  -b organizer.txt -d '{ "status": "cancelled" }'
```

### `DELETE /api/events/:eid` — cancelar (dueño o admin)

Es un **atajo** de `PATCH .../status` con `cancelled`. **No borra nada de la base**: devuelve el evento con `status: "cancelled"`, que sigue siendo consultable por `GET`.

### Casos a probar (eventos)

```bash
# rol user creando un evento -> 403
curl -X POST http://localhost:8080/api/events -H "Content-Type: application/json" -b user.txt \
  -d '{ "title": "Maraton", "description": "10k", "category": "running", "location": "Parque", "date": "2027-10-01", "capacity": 100 }'

# fecha pasada -> 400
curl -X POST http://localhost:8080/api/events -H "Content-Type: application/json" -b organizer.txt \
  -d '{ "title": "Maraton", "description": "10k", "category": "running", "location": "Parque", "date": "2020-01-01", "capacity": 100 }'

# capacity 0 -> 400
curl -X POST http://localhost:8080/api/events -H "Content-Type: application/json" -b organizer.txt \
  -d '{ "title": "Maraton", "description": "10k", "category": "running", "location": "Parque", "date": "2027-10-01", "capacity": 0 }'

# organizer modificando su evento -> 200 / evento ajeno -> 403 / admin sobre cualquiera -> 200
curl -X PUT http://localhost:8080/api/events/<eid-propio>  -H "Content-Type: application/json" -b organizer.txt -d '{ "title": "Editado" }'
curl -X PUT http://localhost:8080/api/events/<eid-de-otro> -H "Content-Type: application/json" -b organizer.txt -d '{ "title": "Editado" }'
curl -X PUT http://localhost:8080/api/events/<eid-de-otro> -H "Content-Type: application/json" -b admin.txt     -d '{ "title": "Editado" }'

# cambiar el estado de un evento ya cancelado -> 409
curl -X PATCH http://localhost:8080/api/events/<eid-cancelado>/status -H "Content-Type: application/json" \
  -b organizer.txt -d '{ "status": "published" }'

# listado con filtros
curl "http://localhost:8080/api/events?status=published&category=workshop&page=2&limit=5"

# evento inexistente -> 404
curl http://localhost:8080/api/events/64f000000000000000000000
```

### Casos cubiertos

- Crear con rol `user` → `403`; con `organizer` o `admin` → `201`.
- `organizer` tomado de la sesion: el del body se ignora, y en la base queda como `ObjectId`.
- Fecha pasada, `capacity <= 0`, `price < 0` o campos faltantes → `400`.
- `organizer` modifica su evento → `200`; uno ajeno → `403`; el `admin`, cualquiera → `200`.
- Cancelar deja el evento con `status: cancelled` y **sigue en la base**.
- Modificar o cambiarle el estado a un evento cancelado → `409`.
- Publicar un evento finalizado o con fecha pasada → `409`.
- Listado con filtros combinados, paginacion y orden; la respuesta trae `data`, `page`, `limit`, `total` y `totalPages`.
- Evento inexistente, o id que no es un ObjectId valido → `404` (nunca un `500`).

## Inscripciones: tickets y control de cupos

Un **ticket** es la inscripcion de un usuario a un evento. El modelo vive en [`src/models/Ticket.js`](src/models/Ticket.js) y **todas** las reglas en [`src/services/tickets.service.js`](src/services/tickets.service.js) (nada de esto esta en el controller ni en la ruta).

### Modelo `Ticket`

| Campo             | Tipo       | Requerido | Reglas                                                                 |
|-------------------|------------|-----------|------------------------------------------------------------------------|
| `user`            | ObjectId   | Si (auto) | **Referencia** (`ref: 'users'`) al inscripto. Sale de la sesion         |
| `event`           | ObjectId   | Si        | **Referencia** (`ref: 'events'`) al evento. Sale de la URL              |
| `quantity`        | number     | No        | Entero **> 0**. Si no viene, `1`                                       |
| `status`          | string     | No        | Uno de `pending` \| `confirmed` \| `cancelled`. Por defecto `confirmed` |
| `reservationCode` | string     | Si (auto) | Codigo **unico** generado por el server (ej: `TCK-A3F9K2MZQ7`)          |
| `cancelledAt`     | Date       | No        | `null` mientras el ticket este activo; se sella al cancelar            |

Ademas trae `createdAt` / `updatedAt` por `timestamps: true`.

> **`user` y `event` son referencias, no objetos embebidos.** En la base se guardan **solo los `ObjectId`**: nunca se copia el usuario ni el evento dentro del ticket, asi un cambio de email o de fecha no deja copias viejas dando vueltas. Al leer se resuelven con `populate`, y siempre acotado a los campos necesarios (del evento: `title`, `date`, `location`; del usuario: `first_name`, `last_name`, `email` — **nunca** el `password`).

El `reservationCode` se genera con `crypto.randomBytes` en [`utils/reservationCode.js`](src/utils/reservationCode.js), no con `Math.random`: es el dato que identifica la inscripcion de cara al usuario, y con un generador predecible se podrian adivinar codigos ajenos. Usa un alfabeto sin caracteres ambiguos (sin `0`/`O` ni `1`/`I`) porque se dicta o se copia a mano en la puerta del evento.

### Estados del ticket

```
pending ──> confirmed
   │             │
   └─────────────┴──> cancelled  (terminal)
```

| Estado      | Que significa                                                        | ¿Ocupa cupo? |
|-------------|----------------------------------------------------------------------|:------------:|
| `confirmed` | Inscripcion confirmada. Es el estado con el que **nace** el ticket   |      Si      |
| `pending`   | Reserva a la espera de pago. Previsto para el flujo de pagos futuro  |      Si      |
| `cancelled` | Inscripcion dada de baja. Estado **terminal**, conserva el historial |    **No**    |

Los estados viven como constantes en [`src/config/ticketStatus.js`](src/config/ticketStatus.js), junto con `ACTIVE_TICKET_STATUS` (`pending` + `confirmed`), que es **la unica definicion de "ticket activo"** del proyecto: la comparten el calculo de cupos, el chequeo de duplicados y el indice de la base.

### Flujo de inscripcion

`POST /api/events/:eid/tickets` corre las validaciones **en este orden** (primero lo que no toca la base, despues lo que si, y recien al final se escribe):

1. **Sesion valida** → si no, `401` (lo corta el middleware `authenticate`, antes del service).
2. **El evento existe** → si no, `404` (reutiliza `eventsService.getEventById`).
3. **El evento acepta inscripciones** → `409` si esta `cancelled`, `finished`, todavia en `draft`, o si su fecha ya paso.
4. **`quantity` valida** → entero **> 0**, si no `400`.
5. **Sin inscripcion duplicada** → si el usuario ya tiene un ticket **activo** en ese evento, `409`.
6. **Hay cupo** → `409` si no quedan lugares o si pidio mas de los que quedan.
7. Se crea el ticket como `confirmed`, con su `reservationCode`.
8. Se envia el **email de confirmacion**.

El `user` del ticket sale **siempre** de `req.user.id`: si el body trae un `user`, se ignora (el payload se arma campo por campo, nunca con un spread del body).

### Regla de cupos

El cupo ocupado **no se guarda** en ningun contador que se pueda desincronizar: se **calcula** en cada inscripcion con un `aggregate` en [`ticket.dao.js`](src/dao/mongo/ticket.dao.js):

```js
// suma quantity de los tickets ACTIVOS del evento
{ $match: { event: eventId, status: { $in: ACTIVE_TICKET_STATUS } } },
{ $group: { _id: null, total: { $sum: '$quantity' } } }
```

- Se suma **`quantity`**, no la cantidad de documentos: un solo ticket puede reservar varios lugares.
- Los `cancelled` **quedan fuera del `$match`**. Por eso **cancelar libera el cupo automaticamente**: no hay que devolverle lugares al evento a mano.
- `lugares disponibles = event.capacity - ocupados`. Si `quantity > disponibles` → `409` con el detalle (`Cupos insuficientes: quedan 2 lugares y pediste 5`), asi el cliente puede reintentar con una cantidad que entre.

### Una inscripcion activa por usuario y evento

La regla adoptada es **un ticket activo por usuario y evento**: si alguien quiere mas lugares, cancela y se anota de nuevo con la cantidad correcta. Se aplica en **dos niveles**:

1. En el **service**, que busca una inscripcion activa antes de crear y responde `409`.
2. En la **base**, con un **indice unico parcial** sobre `(user, event)` limitado a los estados activos:

```js
ticketSchema.index(
    { user: 1, event: 1 },
    { unique: true, partialFilterExpression: { status: { $in: ACTIVE_TICKET_STATUS } } }
);
```

El indice no es redundante: entre el chequeo del service y el `insert` hay una ventana en la que **dos requests simultaneas pasan las dos la validacion**. El indice hace que la segunda falle en la base (`E11000`), y el DAO traduce ese error al **mismo `409`** que devuelve el chequeo previo — nunca un `500`. Es **parcial** a proposito: solo alcanza a los tickets activos, asi el que cancelo **puede volver a inscribirse** (su ticket cancelado queda fuera del indice).

### Cancelacion

`PATCH /api/tickets/:tid/cancel` **no borra el documento**: pasa el `status` a `cancelled` y sella `cancelledAt` con la fecha. El ticket sigue en la base y sigue apareciendo en `my-tickets` como parte del historial.

| Regla                                                       | Codigo |
|-------------------------------------------------------------|:------:|
| El ticket no existe (o el id no es un ObjectId valido)      | `404`  |
| El ticket es de otro usuario (y el que pide no es admin)    | `403`  |
| El ticket ya estaba cancelado (`cancelled` es terminal)     | `409`  |

Como el calculo de cupos ignora los `cancelled`, el lugar **queda disponible al instante**: no hay ningun paso extra ni contador que actualizar.

### Notificaciones por email (Nodemailer)

Al confirmarse una inscripcion se envia un mail al inscripto con el **codigo de reserva**, la **cantidad de lugares**, la **fecha** y el **lugar** del evento (en HTML y en texto plano). La responsabilidad esta partida en dos:

- [`config/mail.config.js`](src/config/mail.config.js) → arma el `transporter` de Nodemailer **una sola vez** y lo reusa (el pool de conexiones SMTP no se rearma en cada mail). Lee host, puerto, usuario y password **solo** de `env.config.js`: **no hay ni una credencial escrita en el codigo**.
- [`services/mail.service.js`](src/services/mail.service.js) → arma el contenido y envia. El `tickets.service` no sabe nada de SMTP ni de Nodemailer: solo pide "avisale a este mail".

Dos decisiones importantes:

- **Un fallo de email nunca tumba una inscripcion.** El envio va **despues** de persistir el ticket y esta envuelto en un `try/catch` que devuelve `false` y loguea: si el SMTP esta caido, la inscripcion ya esta guardada y la request responde `201` igual.
- **Sin credenciales configuradas, el envio se saltea** con un aviso por consola (`[mail] ... sin configurar`) en vez de romper. El proyecto arranca y se puede probar todo el flujo sin una casilla de correo.

### `POST /api/events/:eid/tickets` — inscribirse (autenticado)

Body opcional. Si no se manda nada, se reserva **un** lugar:

```json
{ "quantity": 2 }
```

Responde `201` con el ticket creado (`user` y `event` poblados, `status: "confirmed"`, `cancelledAt: null`):

```json
{
  "status": "success",
  "payload": {
    "_id": "665f3b...",
    "user": { "_id": "665f10...", "first_name": "Ana", "last_name": "Perez", "email": "ana@mail.com" },
    "event": { "_id": "665f2a...", "title": "Maraton de la ciudad", "date": "2027-10-01T09:00:00.000Z", "location": "Parque Centenario" },
    "quantity": 2,
    "status": "confirmed",
    "reservationCode": "TCK-A3F9K2MZQ7",
    "cancelledAt": null,
    "createdAt": "2026-07-30T12:00:00.000Z",
    "updatedAt": "2026-07-30T12:00:00.000Z"
  }
}
```

### `GET /api/tickets/my-tickets` — mis inscripciones (autenticado)

Devuelve **solo** los tickets del usuario de la sesion, ordenados del mas nuevo al mas viejo, con el evento poblado (`title`, `date`, `location`). Incluye los cancelados: son parte del historial. **No expone datos de otros usuarios.**

```json
{
  "status": "success",
  "payload": [
    {
      "_id": "665f3b...",
      "user": "665f10...",
      "event": { "_id": "665f2a...", "title": "Maraton de la ciudad", "date": "2027-10-01T09:00:00.000Z", "location": "Parque Centenario" },
      "quantity": 2,
      "status": "confirmed",
      "reservationCode": "TCK-A3F9K2MZQ7",
      "cancelledAt": null,
      "createdAt": "2026-07-30T12:00:00.000Z"
    }
  ]
}
```

### `GET /api/events/:eid/tickets` — inscriptos de un evento (dueño o admin)

Lista los tickets del evento con el usuario poblado (`first_name`, `last_name`, `email`). Un `user` comun recibe `403`, y un `organizer` que pide los inscriptos de un evento **ajeno** tambien.

### `PATCH /api/tickets/:tid/cancel` — cancelar (dueño o admin)

No lleva body. Devuelve el ticket ya cancelado:

```json
{
  "status": "success",
  "payload": { "_id": "665f3b...", "status": "cancelled", "cancelledAt": "2026-07-30T13:00:00.000Z", "quantity": 2, "reservationCode": "TCK-A3F9K2MZQ7" }
}
```

### Casos a probar (inscripciones)

Se asume un evento **publicado** con `capacity: 2` y las cookies de cada rol ya guardadas (ver la seccion de roles).

```bash
# 1. inscripcion exitosa -> 201 + email al inscripto
curl -X POST http://localhost:8080/api/events/<eid>/tickets -H "Content-Type: application/json" \
  -b user.txt -d '{ "quantity": 1 }'

# 2. sin sesion -> 401
curl -X POST http://localhost:8080/api/events/<eid>/tickets -H "Content-Type: application/json" \
  -d '{ "quantity": 1 }'

# 3. evento inexistente -> 404
curl -X POST http://localhost:8080/api/events/64f000000000000000000000/tickets -b user.txt

# 4. evento cancelado o finalizado -> 409
curl -X POST http://localhost:8080/api/events/<eid-cancelado>/tickets -b user.txt

# 5. cupo insuficiente -> 409 con el detalle de cuantos quedan
curl -X POST http://localhost:8080/api/events/<eid>/tickets -H "Content-Type: application/json" \
  -b user2.txt -d '{ "quantity": 50 }'

# 6. inscripcion duplicada activa -> 409
curl -X POST http://localhost:8080/api/events/<eid>/tickets -H "Content-Type: application/json" \
  -b user.txt -d '{ "quantity": 1 }'

# 7. mis tickets (solo los propios, con el evento poblado)
curl http://localhost:8080/api/tickets/my-tickets -b user.txt

# 8. cancelar un ticket ajeno como user -> 403
curl -X PATCH http://localhost:8080/api/tickets/<tid-de-otro>/cancel -b user2.txt

# 9. cancelar el propio -> 200 (y el cupo queda libre)
curl -X PATCH http://localhost:8080/api/tickets/<tid-propio>/cancel -b user.txt

# 10. el cupo liberado se puede volver a tomar -> 201
curl -X POST http://localhost:8080/api/events/<eid>/tickets -H "Content-Type: application/json" \
  -b user3.txt -d '{ "quantity": 1 }'

# 11. cancelar dos veces el mismo ticket -> 409
curl -X PATCH http://localhost:8080/api/tickets/<tid-propio>/cancel -b user.txt

# 12. inscriptos del evento como organizer dueño -> 200 / como user -> 403 / como otro organizer -> 403
curl http://localhost:8080/api/events/<eid>/tickets -b organizer.txt
curl http://localhost:8080/api/events/<eid>/tickets -b user.txt
curl http://localhost:8080/api/events/<eid>/tickets -b organizer2.txt
```

### Casos cubiertos

- Inscripcion exitosa → `201`, ticket `confirmed` con `reservationCode` y email de confirmacion enviado.
- Inscripcion sin sesion → `401`; a un evento inexistente o con id invalido → `404` (nunca `500`).
- Evento `cancelled`, `finished`, en `draft` o con fecha ya pasada → `409` con el motivo puntual.
- `quantity` no entera, `0` o negativa → `400`.
- Cupo insuficiente → `409` indicando cuantos lugares quedan; evento lleno → `409`.
- Inscripcion duplicada activa → `409`, incluso con **requests simultaneas** (lo frena el indice unico parcial).
- `my-tickets` devuelve solo los del usuario de la sesion, con el evento poblado y sin datos de terceros.
- `GET /api/events/:eid/tickets`: organizer dueño y admin → `200`; `user` comun → `403`; organizer ajeno → `403`.
- Cancelacion propia → `200` con `cancelledAt` seteado y el documento **todavia en la base**; ajena como `user` → `403`; como admin → `200`.
- Cancelar dos veces → `409`; cancelar un ticket inexistente → `404`.
- Tras cancelar, el cupo se libera y una nueva inscripcion por ese lugar entra sin problema.
- En la base, `user` y `event` quedan guardados como `ObjectId` (referencias), sin objetos embebidos.

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

`GET /api/events` sin eventos (o sin base de datos) → `200`

```json
{ "status": "success", "data": [], "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
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
- Flujo de **pago** de las inscripciones, aprovechando el estado `pending` que ya contempla el modelo `Ticket`
- Mas **notificaciones**: aviso de cancelacion y recordatorio previo al evento
