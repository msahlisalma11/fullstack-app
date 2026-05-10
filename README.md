# GreenBite TN - Food Waste Reduction Platform

<div align="center">

![GreenBite Logo](./docs/images/logo.png)

**Reduce waste. Save money. Support local businesses. 🌱💚**

A modern platform connecting consumers with merchants' unsold inventory at discounted prices. Supporting sustainable consumption in Tunisia.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![PostgreSQL Version](https://img.shields.io/badge/PostgreSQL-12%2B-336791)](https://www.postgresql.org/)

[Features](#features) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🎯 Overview

GreenBite TN is a sustainability-focused marketplace that helps:

- **Consumers** discover discounted food baskets from local merchants before closing time
- **Merchants** reduce unsold inventory and waste while generating extra revenue
- **Communities** reduce food waste and support local businesses

### 📊 Impact Metrics

- **15%** reduction in food waste for participating merchants
- **40-70%** discounts on food baskets
- **1000+** consumers served (target)
- **500+** merchants onboarded (target)
- **50 tons** of food waste prevented (annual target)

---

## ✨ Features

### 🛒 Consumer Features

- **Smart Discovery**: Browse & search food baskets near you
- **Real-time Availability**: View live inventory with countdown timers
- **Secure Reservations**: Reserve baskets with QR code pickup verification
- **Flexible Payment**: Support for cards, e-wallet, and SMS+ payment
- **Order History**: Track all past and current reservations
- **Reviews & Ratings**: Transparent reviews from real customers
- **Notifications**: Real-time alerts for new baskets and updates
- **Preferences**: Set dietary restrictions and favorite categories
- **Favorites**: Save baskets for later

### 🏪 Merchant Features

- **Easy Management**: Add and manage food baskets from dashboard
- **Analytics Dashboard**: Track sales, waste reduction, and revenue
- **Order Management**: Real-time order notifications and QR verification
- **Performance Metrics**: Monitor impact and customer satisfaction
- **Earnings Tracking**: View sales and commission breakdowns
- **Customer Feedback**: Access reviews and ratings
- **Inventory Control**: Set quantities and pickup windows

### 👨‍💼 Admin Features

- **User Management**: Manage users, merchants, and admin accounts
- **Content Moderation**: Review and approve merchant listings
- **Transaction Monitoring**: Oversee payments and disputes
- **Analytics**: Platform-wide statistics and insights
- **Fraud Detection**: Monitor suspicious activities
- **Report Management**: Handle user reports and complaints

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn
- Git

### Installation (5 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/greenbite-tn.git
cd greenbite-tn

# Setup backend
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run migrate
npm run dev

# In another terminal, setup frontend
cd frontend
cp .env.example .env
npm install
npm start
```

Visit http://localhost:3000 in your browser!

### Docker Setup (Even Faster)

```bash
docker-compose up --build
```

That's it! Access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

---

## 📚 Documentation

### Core Documentation
- [Setup Guide](./SETUP_GUIDE.md) - Detailed installation instructions
- [API Documentation](./API.md) - Complete API reference
- [Database Schema](./database/schema.sql) - Database structure
- [Architecture Guide](./ARCHITECTURE.md) - System design and patterns

### Developer Guides
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute
- [Code Style Guide](./CODE_STYLE.md) - Coding standards
- [Testing Guide](./TESTING.md) - Writing and running tests
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

### Features
- [Consumer Guide](./docs/CONSUMER_GUIDE.md)
- [Merchant Guide](./docs/MERCHANT_GUIDE.md)
- [Admin Guide](./docs/ADMIN_GUIDE.md)

---

## 🏗️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - API client
- **Socket.io** - Real-time updates
- **Stripe.js** - Payment processing
- **Leaflet** - Maps

### Backend
- **Node.js + Express** - Server framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Stripe API** - Payment processing
- **Socket.io** - Real-time communication
- **Multer** - File uploads
- **Nodemailer** - Email service
- **Pino** - Logging

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD

---

## 📂 Project Structure

```
greenbite-tn/
├── frontend/                 # React application
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   └── package.json
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Custom middleware
│   │   └── server.ts
│   └── package.json
├── database/
│   ├── schema.sql           # Database schema
│   └── seeds.sql            # Sample data
├── docs/                    # Documentation
├── docker-compose.yml       # Docker configuration
└── README.md               # This file
```

---

## 🔑 Key API Endpoints

### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login
POST   /api/auth/logout            # Logout
POST   /api/auth/refresh           # Refresh token
```

### Baskets
```
GET    /api/baskets                # List all baskets
GET    /api/baskets/:id            # Get basket details
GET    /api/baskets/nearby         # Get nearby baskets
POST   /api/baskets                # Create basket (merchant)
PUT    /api/baskets/:id            # Update basket
DELETE /api/baskets/:id            # Delete basket
```

### Reservations
```
POST   /api/reservations           # Create reservation
GET    /api/reservations           # Get user reservations
PUT    /api/reservations/:id       # Update reservation
POST   /api/reservations/:id/cancel # Cancel reservation
GET    /api/reservations/:id/qr    # Get QR code
```

### Payments
```
POST   /api/payments/create-intent # Create payment intent
POST   /api/payments/confirm       # Confirm payment
GET    /api/payments/history       # Payment history
```

See [API Documentation](./API.md) for complete reference.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

---

## 🚢 Deployment

### One-Click Deployment Options

#### Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app?referralCode=YOUR_CODE)

#### Vercel (Frontend)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fgreenbite-tn)

See [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

---

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please read [Contributing Guidelines](./CONTRIBUTING.md) first.

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
# Run tests and linting
npm test
npm run lint

# Commit with clear messages
git commit -m 'feat: add new feature'

# Push and create PR
git push origin feature/your-feature
```

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

## 👥 Community

- **GitHub Discussions**: [Ask questions](https://github.com/yourusername/greenbite-tn/discussions)
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/greenbite-tn/issues)
- **Email**: contact@greenbite-tn.com
- **Twitter**: [@GreenBiteTN](https://twitter.com/greenbitetn)

---

## 🎓 Learning Resources

### For Contributors
- [Node.js & Express Tutorial](https://nodejs.org/en/docs/)
- [React Documentation](https://react.dev)
- [PostgreSQL Guide](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### For Deployment
- [Docker Tutorial](https://docs.docker.com/)
- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)

---

## 🙏 Acknowledgments

- Built with ❤️ for Tunisia
- Inspired by Too Good To Go and local sustainability initiatives
- Special thanks to all [contributors](./CONTRIBUTORS.md)

---

## 📊 Project Status

- **Current Version**: 1.0.0
- **Status**: Active Development
- **Last Updated**: 2024

### Roadmap

- ✅ MVP (Baskets, Reservations, Payments)
- 🔄 Enhanced Analytics & Reporting
- 🔄 Mobile Apps (iOS/Android)
- 📅 AI-powered Recommendations
- 📅 Subscription Plans
- 📅 Merchant Network Expansion
- 📅 Corporate Partnerships

See [Roadmap](./ROADMAP.md) for details.

---

<div align="center">

**Making food waste a thing of the past. One basket at a time. 🌍**

[⬆ Back to Top](#greenbite-tn---food-waste-reduction-platform)

</div>
