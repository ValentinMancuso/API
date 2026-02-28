# API

Challenge técnico desarrollado para el proceso de selección de **Backend Jr en Conexa**.

API REST con NestJS y TypeScript. Autenticación con JWT y manejo de roles (ADMIN / GUEST).

**Autor:** Valentín Mancuso Micka — [LinkedIn](https://www.linkedin.com/in/valentinmancusomicka/)

## Stack

- NestJS / TypeScript
- MongoDB Atlas + Mongoose
- JWT + Passport
- bcryptjs

## Instalación

```bash
git clone https://github.com/tu-usuario/api.git
cd api
npm install
```

Copiá `.env.example` a `.env` y completá con tus datos:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/dbname
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRATION=1d
```

## Correr en local

```bash
npm run start:dev
```

## Tests

```bash
npm test
```

## Deploy

La API está deployada en Render: (Falta realizar el Deploy)

> El tier gratuito de Render duerme el servicio tras un período de inactividad, por lo que la primera request puede tardar unos segundos.

---

## Endpoints

### Auth

**POST /auth/register**

Registra un usuario con rol GUEST.

```json
// Body
{ "email": "usuario@email.com", "password": "123456" }

// Response 201
{ "id": "...", "email": "usuario@email.com", "role": "GUEST" }
```

**POST /auth/login**

Devuelve un token JWT.

```json
// Body
{ "email": "usuario@email.com", "password": "123456" }

// Response 201
{ "access_token": "eyJhbGci..." }
```

---

### Users

**POST /users/seed**

Crea el primer usuario ADMIN. Solo funciona una vez; si ya existe un admin devuelve error.

```json
// Body
{ "email": "admin@email.com", "password": "admin123" }

// Response 201
{ "id": "...", "email": "admin@email.com", "role": "ADMIN" }
```

**POST /users** — `Requiere JWT (ADMIN)`

Crea un usuario con el rol que se indique.

```json
// Headers
Authorization: Bearer <token>

// Body
{ "email": "nuevo@email.com", "password": "123456", "role": "GUEST" }

// Response 201
{ "id": "...", "email": "nuevo@email.com", "role": "GUEST" }
```

**PATCH /users/:id** — `Requiere JWT (ADMIN)`

Actualiza uno o más campos de un usuario.

```json
// Headers
Authorization: Bearer <token>

// Body (todos los campos son opcionales)
{ "email": "editado@email.com" }

// Response 200
{ "id": "...", "email": "editado@email.com", "role": "GUEST" }
```

**GET /users** — `Requiere JWT`

Lista usuarios. Soporta paginación y búsqueda por email (case insensitive).

```
GET /users?page=1&limit=20
GET /users?page=1&limit=20&email=admin
```

```json
// Response 200
{
  "data": [
    {
      "_id": "...",
      "email": "admin@email.com",
      "role": "ADMIN",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```
