# API

API REST con NestJS y TypeScript. Autenticación con JWT y manejo de roles (ADMIN / GUEST).

**Autor:** Valentín Mancuso Micka — [LinkedIn](https://www.linkedin.com/in/valentinmancusomicka/)

## Stack

- NestJS / TypeScript
- MongoDB Atlas + Mongoose
- JWT + Passport
- bcryptjs

## Instalación

```bash
git clone https://github.com/ValentinMancuso/API.git
cd API
npm install
```

Copiá `.env.example` a `.env` y completá con tus datos:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your_secret_key
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

La API está deployada en Render: https://api-483o.onrender.com

> El tier gratuito de Render duerme el servicio tras un período de inactividad, por lo que la primera request puede tardar unos segundos.

---

## Endpoints

### Auth

#### `POST` https://api-483o.onrender.com/auth/register

Registra un usuario con rol GUEST. No requiere autenticación.

```json
{
  "email": "usuario@email.com",
  "password": "123456"
}
```

Response `201`:

```json
{
  "id": "...",
  "email": "usuario@email.com",
  "role": "GUEST"
}
```

#### `POST` https://api-483o.onrender.com/auth/login

Autentica un usuario y devuelve un token JWT. No requiere autenticación.

```json
{
  "email": "usuario@email.com",
  "password": "123456"
}
```

Response `201`:

```json
{
  "access_token": "eyJhbGci..."
}
```

---

### Users

#### `POST` https://api-483o.onrender.com/users/seed

Crea el primer usuario ADMIN. Solo funciona una vez; si ya existe un admin devuelve `409`.

```json
{
  "email": "admin@email.com",
  "password": "admin123"
}
```

Response `201`:

```json
{
  "id": "...",
  "email": "admin@email.com",
  "role": "ADMIN"
}
```

#### `POST` https://api-483o.onrender.com/users

Crea un usuario. Requiere JWT con rol ADMIN.

Header: `Authorization: Bearer <token>`

```json
{
  "email": "nuevo@email.com",
  "password": "123456",
  "role": "GUEST"
}
```

Response `201`:

```json
{
  "id": "...",
  "email": "nuevo@email.com",
  "role": "GUEST"
}
```

#### `PATCH` https://api-483o.onrender.com/users/:id

Actualiza uno o más campos de un usuario. Requiere JWT con rol ADMIN.

Header: `Authorization: Bearer <token>`

```json
{
  "email": "editado@email.com"
}
```

Response `200`:

```json
{
  "id": "...",
  "email": "editado@email.com",
  "role": "GUEST"
}
```

#### `GET` https://api-483o.onrender.com/users

Lista usuarios con paginación y búsqueda por email (case insensitive). Requiere JWT (cualquier rol).

Header: `Authorization: Bearer <token>`

Ejemplos:

```
https://api-483o.onrender.com/users?page=1&limit=20
https://api-483o.onrender.com/users?page=1&limit=20&email=admin
```

Response `200`:

```json
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
