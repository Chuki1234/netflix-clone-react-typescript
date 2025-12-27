# Netflix Clone Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/netflix-clone
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

4. Make sure MongoDB is running:
   - If using local MongoDB: `mongod`
   - Or use MongoDB Atlas (cloud): Update MONGODB_URI in .env

5. Run the server:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ name, email, password }`
  - Returns: `{ _id, name, email, token }`

- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ _id, name, email, token }`

- `GET /api/auth/me` - Get current user (requires authentication)
  - Header: `Authorization: Bearer <token>`
  - Returns: `{ _id, name, email }`

