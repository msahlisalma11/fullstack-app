# .env.example - Backend Environment Variables
# Copy this to .env and fill in your actual values

# ============================================================================
# APPLICATION
# ============================================================================
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug

# ============================================================================
# DATABASE - PostgreSQL
# ============================================================================
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=greenbite_tn

# ============================================================================
# AUTHENTICATION & SECURITY
# ============================================================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# ============================================================================
# STRIPE PAYMENT
# ============================================================================
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_API_VERSION=2023-08-16

# ============================================================================
# CLOUD STORAGE - Cloudinary
# ============================================================================
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=greenbite_preset

# ============================================================================
# EMAIL SERVICE - Nodemailer
# ============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@greenbite-tn.com
SMTP_FROM_NAME=GreenBite TN

# ============================================================================
# GOOGLE SERVICES
# ============================================================================
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# ============================================================================
# REDIS CACHE (Optional)
# ============================================================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# ============================================================================
# FRONTEND
# ============================================================================
FRONTEND_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:3000

# ============================================================================
# ADMIN
# ============================================================================
ADMIN_EMAIL=admin@greenbite-tn.com
ADMIN_PASSWORD=admin_secure_password_change_this

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_EMAIL_VERIFICATION=true
ENABLE_2FA=false
ENABLE_SOCIAL_LOGIN=true
MAX_FILE_SIZE=5242880

# ============================================================================
# RATE LIMITING
# ============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# MONITORING & ANALYTICS
# ============================================================================
SENTRY_DSN=
ENVIRONMENT=development

---

# .env.example - Frontend Environment Variables

REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_ENV=development

---

# Setup Instructions

## Prerequisites

1. Node.js 16+ and npm
2. PostgreSQL 12+
3. Redis (optional)
4. Docker & Docker Compose (for containerization)
5. Stripe account
6. Cloudinary account
7. Google Maps API key
8. SMTP email service (Gmail, SendGrid, etc.)

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/greenbite-tn.git
cd greenbite-tn
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
nano .env

# Create database
createdb greenbite_tn

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed

# Start development server
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your API URL and API keys
nano .env

# Start development server
npm start
```

The frontend will open at http://localhost:3000

## Docker Setup

### 1. Prerequisites
- Docker
- Docker Compose

### 2. Build and Run

```bash
# Clone repository
git clone https://github.com/yourusername/greenbite-tn.git
cd greenbite-tn

# Create .env file with configuration
cp .env.example .env
nano .env

# Build and start containers
docker-compose up --build

# Run migrations
docker-compose exec backend npm run migrate

# Seed initial data (optional)
docker-compose exec backend npm run seed
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

### 3. Useful Docker Commands

```bash
# Stop containers
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a specific service
docker-compose restart backend

# Run a command in container
docker-compose exec backend npm run migrate

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Production Deployment

### 1. Environment Setup

- Update .env with production values
- Use strong JWT_SECRET
- Configure proper database backups
- Setup SSL certificates for HTTPS
- Configure proper email service

### 2. Deployment Options

#### Option A: Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Configure environment variables
railway variables set NODE_ENV production
railway variables set JWT_SECRET your-production-secret

# Deploy
railway up
```

#### Option B: Vercel/Netlify (Frontend) + Railway/Heroku (Backend)

Frontend (Vercel):
```bash
npm install -g vercel
vercel
```

Backend (Railway):
- See Option A above

#### Option C: AWS EC2 with Docker

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-instance.com

# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose -y

# Clone repository
git clone https://github.com/yourusername/greenbite-tn.git
cd greenbite-tn

# Create .env with production values
nano .env

# Start services
sudo docker-compose up -d

# Setup reverse proxy with Nginx
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo systemctl restart nginx
```

### 3. Database Backups

```bash
# Automatic daily backup
0 2 * * * docker-compose exec db pg_dump -U postgres greenbite_tn > /backups/greenbite_$(date +\%Y\%m\%d).sql

# Restore from backup
docker-compose exec db psql -U postgres greenbite_tn < /backups/backup.sql
```

### 4. SSL/HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 5. Monitoring

```bash
# View container stats
docker stats

# Monitor logs
docker-compose logs --tail=100 -f

# Health checks
curl http://localhost:5000/health
```

## Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# E2E Testing (Cypress)
npm run test:e2e
```

## Troubleshooting

### Port Already in Use
```bash
# Linux/Mac
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -d greenbite_tn -c "SELECT 1"

# Reset migrations
npm run migrate:down
npm run migrate:up
```

### Docker Issues
```bash
# Rebuild containers
docker-compose build --no-cache

# Remove unused volumes
docker volume prune

# Clean slate
docker-compose down -v
docker-compose up --build
```

## Documentation Links

- [API Documentation](./API.md)
- [Database Schema](./database/schema.sql)
- [Architecture Guide](./ARCHITECTURE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/greenbite-tn/issues
- Email: support@greenbite-tn.com
- Slack: [Join our Slack](https://greenbite.slack.com)
