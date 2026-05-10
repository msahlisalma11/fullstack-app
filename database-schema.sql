-- GreenBite TN Database Schema
-- PostgreSQL 12+

-- ============================================================================
-- ENUMS & TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('consumer', 'merchant', 'admin');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'collected', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'edinar', 'wallet');
CREATE TYPE merchant_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  role user_role DEFAULT 'consumer',
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_location ON users USING GIST(ll_to_earth(latitude, longitude));

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  allergies TEXT[],
  dietary_preferences TEXT[],
  preferred_categories TEXT[],
  max_search_radius_km DECIMAL(5, 2) DEFAULT 5,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'fr',
  theme VARCHAR(10) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MERCHANTS TABLE
-- ============================================================================

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) NOT NULL, -- bakery, restaurant, grocery, etc.
  business_logo_url TEXT,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  phone VARCHAR(20) NOT NULL,
  opening_hours JSONB, -- {"monday": {"open": "08:00", "close": "18:00"}, ...}
  status merchant_status DEFAULT 'pending',
  verification_document_url TEXT,
  total_baskets_sold INTEGER DEFAULT 0,
  total_waste_reduced_kg DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  bank_account_verified BOOLEAN DEFAULT FALSE,
  stripe_account_id VARCHAR(255),
  commission_rate DECIMAL(5, 2) DEFAULT 5, -- percentage
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_location ON merchants USING GIST(ll_to_earth(latitude, longitude));

-- ============================================================================
-- BASKETS/PRODUCTS TABLE
-- ============================================================================

CREATE TABLE baskets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- bakery, salad, fruits, etc.
  name VARCHAR(255) NOT NULL,
  description TEXT,
  original_price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER GENERATED ALWAYS AS (
    ROUND(((original_price - discount_price) / original_price) * 100)
  ) STORED,
  total_quantity INTEGER NOT NULL,
  stock_available INTEGER NOT NULL,
  composition TEXT[], -- array of ingredients
  allergens TEXT[],
  dietary_info TEXT[], -- vegan, vegetarian, gluten-free, etc.
  images TEXT[], -- array of image URLs
  pickup_start_time TIME NOT NULL,
  pickup_end_time TIME NOT NULL,
  pickup_date DATE DEFAULT CURRENT_DATE,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_reserved INTEGER DEFAULT 0,
  total_collected INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_baskets_merchant_id ON baskets(merchant_id);
CREATE INDEX idx_baskets_category ON baskets(category);
CREATE INDEX idx_baskets_active ON baskets(is_active);
CREATE INDEX idx_baskets_expires_at ON baskets(expires_at);

-- ============================================================================
-- RESERVATIONS TABLE
-- ============================================================================

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  basket_id UUID NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  original_total_price DECIMAL(10, 2) NOT NULL,
  discount_total_price DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  status reservation_status DEFAULT 'pending',
  pickup_code VARCHAR(10) UNIQUE,
  qr_code_data TEXT,
  reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pickup_date DATE NOT NULL,
  pickup_time_start TIME NOT NULL,
  pickup_time_end TIME NOT NULL,
  collected_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  refund_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_basket_id ON reservations(basket_id);
CREATE INDEX idx_reservations_merchant_id ON reservations(merchant_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_pickup_code ON reservations(pickup_code);
CREATE INDEX idx_reservations_pickup_date ON reservations(pickup_date);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TND',
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  card_last_four VARCHAR(4),
  card_brand VARCHAR(20),
  transaction_date TIMESTAMP,
  receipt_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- ============================================================================
-- REVIEWS & RATINGS TABLE
-- ============================================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  basket_id UUID NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  review_images TEXT[],
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_basket_id ON reviews(basket_id);
CREATE INDEX idx_reviews_merchant_id ON reviews(merchant_id);

-- ============================================================================
-- FAVORITES/WISHLIST TABLE
-- ============================================================================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  basket_id UUID NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, basket_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- new_basket, reservation_confirmed, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50), -- basket, reservation, etc.
  related_entity_id UUID,
  data JSONB, -- additional context data
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- TRANSACTIONS TABLE (for merchant earnings)
-- ============================================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL, -- sale, refund, withdrawal
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TND',
  status VARCHAR(50) DEFAULT 'completed',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- ANALYTICS/STATISTICS TABLE
-- ============================================================================

CREATE TABLE daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL,
  total_baskets_available INTEGER DEFAULT 0,
  total_baskets_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  total_waste_reduced_kg DECIMAL(10, 2) DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(merchant_id, analytics_date)
);

-- ============================================================================
-- MODERATION REPORTS TABLE
-- ============================================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- inappropriate_content, fraud, etc.
  entity_type VARCHAR(50) NOT NULL, -- user, basket, review, etc.
  entity_id UUID NOT NULL,
  description TEXT NOT NULL,
  evidence_images TEXT[],
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewing, resolved
  admin_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_entity ON reports(entity_type, entity_id);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baskets_updated_at BEFORE UPDATE ON baskets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (optional - for development)
-- ============================================================================

-- INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
-- VALUES 
--   ('consumer@example.com', '$2b$10$...', 'Ahmed', 'Ben Ali', '+21620123456', 'consumer'),
--   ('merchant@example.com', '$2b$10$...', 'Fatima', 'Trabelsi', '+21620654321', 'merchant');

-- INSERT INTO merchants (user_id, business_name, business_type, ...)
-- VALUES (...);

-- ============================================================================
-- PERFORMANCE VIEWS
-- ============================================================================

CREATE VIEW merchant_stats AS
SELECT 
  m.id,
  m.business_name,
  COUNT(DISTINCT b.id) as total_baskets,
  COUNT(DISTINCT r.id) as total_reservations,
  COALESCE(SUM(r.discount_total_price), 0) as total_sales,
  COALESCE(SUM(r.discount_total_price * 0.05), 0) as total_commission,
  ROUND(AVG(rev.rating), 2) as average_rating,
  COUNT(DISTINCT rev.id) as total_reviews
FROM merchants m
LEFT JOIN baskets b ON m.id = b.merchant_id
LEFT JOIN reservations r ON m.id = r.merchant_id AND r.status = 'collected'
LEFT JOIN reviews rev ON m.id = rev.merchant_id
GROUP BY m.id, m.business_name;

CREATE VIEW basket_popularity AS
SELECT 
  b.id,
  b.name,
  COUNT(r.id) as reservation_count,
  COUNT(DISTINCT r.user_id) as unique_customers,
  ROUND(AVG(rev.rating), 2) as average_rating,
  COUNT(DISTINCT rev.id) as review_count
FROM baskets b
LEFT JOIN reservations r ON b.id = r.basket_id
LEFT JOIN reviews rev ON b.id = rev.basket_id
GROUP BY b.id, b.name;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_reservations_user_status ON reservations(user_id, status);
CREATE INDEX idx_baskets_merchant_active ON baskets(merchant_id, is_active);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Full text search indexes (if needed later)
-- CREATE INDEX idx_baskets_search ON baskets USING GIN(to_tsvector('french', name || ' ' || description));
