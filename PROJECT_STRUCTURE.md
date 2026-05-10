# GreenBite TN - Full Stack Application

## Project Overview
A Tunisian platform for reducing food waste by connecting consumers with merchants' unsold inventory at discounted prices.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Authentication**: JWT + bcrypt
- **Payment**: Stripe API
- **Real-time**: Socket.io
- **Hosting**: Docker + Railway/Vercel

## Project Structure

```
greenbite-tn/
├── frontend/                    # React application
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── hooks/              # Custom hooks
│   │   ├── contexts/           # Context API
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utility functions
│   │   └── App.tsx
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                     # Node.js/Express API
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Database models
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Custom middleware
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utilities
│   │   ├── config/             # Configuration
│   │   └── server.ts
│   ├── migrations/             # Database migrations
│   ├── package.json
│   └── .env.example
│
├── database/
│   └── schema.sql              # Database schema
│
├── docker-compose.yml
└── README.md
```

## Key Features

### Consumer Features
- Browse discounted food baskets
- Search & filter by price, distance, ratings
- Reserve baskets with QR code pickup
- Secure payment with Stripe
- Order history & tracking
- User reviews & ratings
- Notification system
- Profile management

### Merchant Features
- Dashboard with sales analytics
- Add/manage food baskets
- Real-time order management
- QR code generation for pickups
- Performance metrics (waste reduction, sales)
- Inventory management
- Customer feedback

### Admin Features
- User & merchant management
- Content moderation
- Transaction monitoring
- Fraud detection
- System analytics
- Report generation

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup
- [ ] Database design
- [ ] Authentication system
- [ ] Core API structure

### Phase 2: Core Features (Week 3-4)
- [ ] Product listing & search
- [ ] Reservation system
- [ ] Payment integration
- [ ] Order management

### Phase 3: Advanced Features (Week 5-6)
- [ ] Real-time notifications
- [ ] Analytics dashboard
- [ ] Rating system
- [ ] Admin panel

### Phase 4: Polish & Deploy (Week 7-8)
- [ ] Testing & optimization
- [ ] UI refinement
- [ ] Documentation
- [ ] Deployment

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/verify` - Verify token

### Products (Baskets)
- `GET /api/baskets` - List all baskets
- `GET /api/baskets/:id` - Get basket details
- `POST /api/baskets` - Create basket (merchant)
- `PUT /api/baskets/:id` - Update basket
- `DELETE /api/baskets/:id` - Delete basket

### Reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - Get user reservations
- `PUT /api/reservations/:id` - Update reservation status
- `GET /api/reservations/:id/qr` - Get QR code

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:id` - Payment details

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/reservations` - User reservations
- `GET /api/users/favorites` - Saved baskets

### Merchants
- `GET /api/merchants/dashboard` - Merchant analytics
- `GET /api/merchants/orders` - Merchant orders
- `POST /api/merchants/baskets` - Create basket
- `GET /api/merchants/stats` - Performance metrics

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/merchants` - List merchants
- `GET /api/admin/reports` - Moderation reports
- `POST /api/admin/actions` - Moderation actions

## Database Schema Overview

### Users Table
```sql
id, email, password_hash, first_name, last_name, phone, 
avatar_url, location, role (consumer/merchant/admin), 
created_at, updated_at, is_active
```

### Baskets Table
```sql
id, merchant_id, category, name, description, 
original_price, discount_price, quantity, stock_available,
pickup_start_time, pickup_end_time, allergens, 
images, rating, reviews_count, created_at, updated_at
```

### Reservations Table
```sql
id, user_id, basket_id, merchant_id, quantity, 
total_price, status (pending/confirmed/collected/cancelled),
pickup_code, reservation_date, pickup_date, created_at, updated_at
```

### Payments Table
```sql
id, reservation_id, user_id, amount, currency, 
payment_method, stripe_payment_intent_id, status,
transaction_date, receipt_url, created_at
```

### Reviews Table
```sql
id, user_id, basket_id, merchant_id, rating, 
comment, images, created_at, updated_at
```

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_key
```

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/greenbite
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
GOOGLE_MAPS_API_KEY=your_maps_key
SMTP_EMAIL=your_email
SMTP_PASSWORD=your_password
```

## Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Docker (optional)
- Stripe account
- Google Maps API key

### Installation
1. Clone repository
2. `npm install` in both frontend and backend
3. Set up environment variables
4. Run database migrations
5. Start development servers

### Running the Application
```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm start

# Database
docker-compose up db
```

## Next Steps
Ready to start building? I'll create:
1. Backend API setup (Express + PostgreSQL)
2. Frontend React components
3. Database schema with migrations
4. Authentication system
5. Core business logic

Which would you like me to focus on first?
