# Production Deployment Guide (Продакшн хэрэгжүүлэх заавар)

## 📋 Бэлтгэл (Preparation)

### 1. Environment Variables (Орчны хувьсагчид)

#### Backend `.env` файл:
```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true&connection_limit=1"

# Server
PORT=4000
NODE_ENV=production
FRONTEND_URL="https://your-frontend-domain.com"

# Clerk Authentication
CLERK_SECRET_KEY="sk_live_..."

# Cloudinary (Image Upload)
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
# Эсвэл
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

#### Frontend `.env.local` файл:
```env
# API URL
NEXT_PUBLIC_API_URL="https://your-backend-domain.com"

# Clerk (Frontend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
```

---

## 🗄️ Database Setup (Өгөгдлийн сангийн тохируулга)

### 1. Production Database үүсгэх
- Supabase, AWS RDS, эсвэл өөр PostgreSQL service ашиглах
- Database connection string-ийг авах

### 2. Prisma Migrations ажиллуулах
```bash
cd backend

# Prisma Client үүсгэх
npm run prisma:generate

# Production database-д migration ажиллуулах
npx prisma migrate deploy

# Эсвэл migration файлууд байхгүй бол:
npx prisma migrate dev --name init
```

### 3. Database schema шалгах
```bash
npx prisma studio
# Browser дээр database-ийг шалгах
```

---

## 🔨 Build Process (Build хийх)

### Backend Build:
```bash
cd backend

# Dependencies суулгах
npm install --production

# Prisma Client үүсгэх
npm run prisma:generate

# TypeScript compile хийх
npm run build

# Build амжилттай болсон эсэхийг шалгах
ls -la dist/
```

### Frontend Build:
```bash
cd frontend

# Dependencies суулгах
npm install

# Production build хийх
npm run build

# Build амжилттай болсон эсэхийг шалгах
ls -la .next/
```

---

## 🚀 Deployment Options (Хэрэгжүүлэх сонголтууд)

### Option 1: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend (Vercel):
1. Vercel дээр project үүсгэх
2. GitHub repository холбох
3. Environment variables оруулах:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Deploy хийх

#### Backend (Railway/Render):
1. Railway эсвэл Render дээр project үүсгэх
2. GitHub repository холбох
3. Environment variables оруулах
4. Build command: `npm run build`
5. Start command: `npm start`
6. Deploy хийх

---

### Option 2: Docker Deployment

#### Backend Dockerfile:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Dependencies суулгах
COPY backend/package*.json ./
RUN npm ci --only=production

# Prisma files хуулах
COPY backend/prisma ./prisma
COPY backend/tsconfig.json ./

# Prisma Client үүсгэх
RUN npx prisma generate

# Source code хуулах
COPY backend/src ./src

# Build хийх
RUN npm run build

# Production ажиллуулах
CMD ["npm", "start"]
```

#### Frontend Dockerfile:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies суулгах
COPY frontend/package*.json ./
RUN npm ci

# Source code хуулах
COPY frontend ./

# Build хийх
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - FRONTEND_URL=${FRONTEND_URL}
      - CLOUDINARY_URL=${CLOUDINARY_URL}
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    depends_on:
      - backend
    restart: unless-stopped
```

---

### Option 3: Manual Server Deployment

#### Server дээр:
```bash
# 1. Project хуулах
git clone [your-repo-url]
cd agent

# 2. Backend setup
cd backend
npm install --production
npm run prisma:generate
npm run build

# 3. Frontend setup
cd ../frontend
npm install
npm run build

# 4. PM2 ашиглан ажиллуулах (optional)
npm install -g pm2

# Backend
cd ../backend
pm2 start dist/index.js --name "agent-backend"

# Frontend
cd ../frontend
pm2 start npm --name "agent-frontend" -- start
```

---

## ✅ Pre-Deployment Checklist (Хэрэгжүүлэхээс өмнөх шалгалт)

- [ ] Бүх environment variables зөв тохируулагдсан
- [ ] Database connection ажиллаж байна
- [ ] Prisma migrations амжилттай ажилласан
- [ ] Clerk authentication keys зөв тохируулагдсан
- [ ] Cloudinary keys зөв тохируулагдсан
- [ ] Backend build амжилттай
- [ ] Frontend build амжилттай
- [ ] CORS settings зөв (FRONTEND_URL)
- [ ] API URL зөв (NEXT_PUBLIC_API_URL)
- [ ] SSL/HTTPS тохируулагдсан
- [ ] Error logging тохируулагдсан

---

## 🔍 Post-Deployment Testing (Хэрэгжүүлсний дараа шалгалт)

### 1. Health Check:
```bash
# Backend
curl https://your-backend-domain.com/health

# Frontend
curl https://your-frontend-domain.com
```

### 2. Authentication Test:
- [ ] User бүртгэл хийх
- [ ] Login хийх
- [ ] Protected routes хамгаалагдсан эсэх

### 3. API Test:
- [ ] Profile үүсгэх/засах
- [ ] Order үүсгэх
- [ ] Image upload ажиллаж байна

### 4. Database Test:
- [ ] Data хадгалагдаж байна
- [ ] Relations зөв ажиллаж байна

---

## 🐛 Troubleshooting (Асуудлыг шийдвэрлэх)

### Backend алдаа:
```bash
# Logs шалгах
pm2 logs agent-backend

# Эсвэл
docker logs [container-name]
```

### Frontend алдаа:
```bash
# Build log шалгах
npm run build

# .next directory-г устгаад дахин build хийх
rm -rf .next
npm run build
```

### Database connection алдаа:
- DATABASE_URL зөв эсэхийг шалгах
- Database firewall settings шалгах
- Connection pool settings шалгах

---

## 📊 Monitoring (Хяналт)

### Recommended Tools:
- **Vercel Analytics** (Frontend)
- **Sentry** (Error tracking)
- **LogRocket** (User session replay)
- **PostgreSQL monitoring** (Database)

---

## 🔄 Updates (Шинэчлэл)

### Database migration:
```bash
cd backend
npx prisma migrate deploy
```

### Code update:
```bash
git pull
# Backend
cd backend && npm install && npm run build && pm2 restart agent-backend
# Frontend
cd frontend && npm install && npm run build && pm2 restart agent-frontend
```

---

## 📝 Notes (Тэмдэглэл)

- Production дээр `NODE_ENV=production` тохируулах
- Sensitive data-г `.env` файлд хадгалах, git-д оруулахгүй
- Database backup тогтмол хийх
- SSL certificate тохируулах
- Rate limiting тохируулах (optional)

---

## 🆘 Support (Тусламж)

Асуудал гарвал:
1. Logs шалгах
2. Environment variables шалгах
3. Database connection шалгах
4. Build process дахин хийх

