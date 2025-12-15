# Backend API

Express backend with Prisma ORM and Supabase PostgreSQL database.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase connection:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > Database
   - Copy the connection string
   - Update `.env` file with your `DATABASE_URL`:
     ```
     DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
     ```

3. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```
   This will create the `users` and `profiles` tables in your Supabase database.

4. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

## Development

```bash
npm run dev
```

The server will run on `http://localhost:4000`

## API Endpoints

### Public Endpoints

- `GET /health` - Health check
- `POST /auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "role": "user" // optional: "user" | "agent" | "admin"
  }
  ```

### Protected Endpoints (require `x-user-id` and `x-role` headers)

- `GET /me` - Get current user info with profile
- `GET /profile` - Get user profile
- `PUT /profile` - Update or create user profile
  ```json
  {
    "name": "John Doe",
    "phone": "99112233",
    "email": "john@example.com"
  }
  ```
- `GET /user` - User/Agent/Admin accessible
- `GET /agent` - Agent/Admin accessible
- `GET /admin` - Admin only

## Prisma Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Environment Variables

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `PORT` - Server port (default: 4000)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

