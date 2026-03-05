PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS car_brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS car_models (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  name TEXT NOT NULL,
  group_label TEXT,
  FOREIGN KEY (brand_id) REFERENCES car_brands(id) ON DELETE RESTRICT,
  UNIQUE (brand_id, name)
);

CREATE INDEX IF NOT EXISTS idx_car_models_brand_id
ON car_models (brand_id);

CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  seller_type TEXT NOT NULL CHECK (seller_type IN ('OWNER', 'DEALER')),
  pin_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_sellers_seller_type
ON sellers (seller_type);

CREATE TABLE IF NOT EXISTS seller_access_invites (
  id TEXT PRIMARY KEY,
  seller_id TEXT,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_seller_access_invites_seller_id
ON seller_access_invites (seller_id);

CREATE INDEX IF NOT EXISTS idx_seller_access_invites_phone
ON seller_access_invites (phone);

CREATE INDEX IF NOT EXISTS idx_seller_access_invites_expires_at
ON seller_access_invites (expires_at);

CREATE TABLE IF NOT EXISTS seller_access_attempts (
  phone TEXT PRIMARY KEY,
  seller_id TEXT,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_seller_access_attempts_seller_id
ON seller_access_attempts (seller_id);

CREATE INDEX IF NOT EXISTS idx_seller_access_attempts_locked_until
ON seller_access_attempts (locked_until);

CREATE TABLE IF NOT EXISTS seller_access_sessions (
  id TEXT PRIMARY KEY,
  seller_id TEXT,
  phone TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL UNIQUE,
  access_expires_at TEXT NOT NULL,
  refresh_expires_at TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_seller_id
ON seller_access_sessions (seller_id);

CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_phone
ON seller_access_sessions (phone);

CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_access_token
ON seller_access_sessions (access_token);

CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_refresh_token
ON seller_access_sessions (refresh_token);

CREATE INDEX IF NOT EXISTS idx_seller_access_sessions_refresh_expires_at
ON seller_access_sessions (refresh_expires_at);

CREATE TABLE IF NOT EXISTS car_listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  is_featured TEXT NOT NULL DEFAULT 'NO' CHECK (is_featured IN ('YES', 'NO')),
  featured_position INTEGER CHECK (featured_position BETWEEN 1 AND 5 OR featured_position IS NULL),
  featured_request_status TEXT NOT NULL DEFAULT 'NONE' CHECK (
    featured_request_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')
  ),
  body_type TEXT NOT NULL CHECK (
    body_type IN (
      'SEDAN',
      'COUPE',
      'SUV',
      'HATCHBACK',
      'CONVERTIBLE',
      'CABRIOLET',
      'CROSSOVER',
      'WAGON',
      'ESTATE',
      'PICKUP',
      'VAN',
      'MINIVAN',
      'ROADSTER'
    )
  ),
  year INTEGER NOT NULL,
  price_value NUMERIC NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('NEW', 'USED')),
  fuel_type TEXT NOT NULL CHECK (
    fuel_type IN (
      'PETROL',
      'DIESEL',
      'HYBRID',
      'PLUG_IN_HYBRID',
      'ELECTRIC',
      'REEV',
      'GAS'
    )
  ),
  transmission TEXT NOT NULL CHECK (transmission IN ('MANUAL', 'AUTOMATIC')),
  mileage INTEGER NOT NULL,
  rim_size_inches INTEGER NOT NULL,
  color TEXT NOT NULL,
  is_negotiable TEXT NOT NULL CHECK (is_negotiable IN ('YES', 'NO')),
  accident_history TEXT NOT NULL CHECK (accident_history IN ('YES', 'NO')),
  description TEXT NOT NULL,
  posted_at TEXT NOT NULL,
  gallery_image_urls TEXT NOT NULL,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES car_models(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_car_listings_seller_id
ON car_listings (seller_id);

CREATE INDEX IF NOT EXISTS idx_car_listings_seller_posted_id
ON car_listings (seller_id, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_listings_status
ON car_listings (status);

CREATE INDEX IF NOT EXISTS idx_car_listings_status_posted_id
ON car_listings (status, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_listings_is_featured
ON car_listings (is_featured);

CREATE INDEX IF NOT EXISTS idx_car_listings_featured_position
ON car_listings (featured_position);

CREATE INDEX IF NOT EXISTS idx_car_listings_status_featured_slot_posted
ON car_listings (status, is_featured, featured_position, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_listings_featured_request_status
ON car_listings (featured_request_status);

CREATE INDEX IF NOT EXISTS idx_car_listings_status_feature_request_posted
ON car_listings (status, featured_request_status, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_listings_model_id
ON car_listings (model_id);

CREATE INDEX IF NOT EXISTS idx_car_listings_status_model_posted
ON car_listings (status, model_id, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_listings_posted_at
ON car_listings (posted_at);

CREATE INDEX IF NOT EXISTS idx_car_listings_price_value
ON car_listings (price_value);

CREATE INDEX IF NOT EXISTS idx_car_listings_status_price_posted
ON car_listings (status, price_value, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_listings_year
ON car_listings (year);

CREATE INDEX IF NOT EXISTS idx_car_listings_status_year_posted
ON car_listings (status, year, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_listings_mileage
ON car_listings (mileage);

CREATE INDEX IF NOT EXISTS idx_car_listings_status_mileage_posted
ON car_listings (status, mileage, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_listings_status_condition_transmission_fuel_posted
ON car_listings (status, condition, transmission, fuel_type, posted_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS car_updates (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('VISIBLE', 'HIDDEN')),
  is_featured TEXT NOT NULL DEFAULT 'NO' CHECK (is_featured IN ('YES', 'NO')),
  featured_position INTEGER CHECK (featured_position BETWEEN 1 AND 5 OR featured_position IS NULL),
  featured_request_status TEXT NOT NULL DEFAULT 'NONE' CHECK (
    featured_request_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')
  ),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  body_type TEXT NOT NULL CHECK (
    body_type IN (
      'SEDAN',
      'COUPE',
      'SUV',
      'HATCHBACK',
      'CONVERTIBLE',
      'CABRIOLET',
      'CROSSOVER',
      'WAGON',
      'ESTATE',
      'PICKUP',
      'VAN',
      'MINIVAN',
      'ROADSTER'
    )
  ),
  year INTEGER NOT NULL,
  description TEXT NOT NULL,
  posted_at TEXT NOT NULL,
  gallery_image_urls TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_car_updates_posted_at
ON car_updates (posted_at);

CREATE INDEX IF NOT EXISTS idx_car_updates_status
ON car_updates (status);

CREATE INDEX IF NOT EXISTS idx_car_updates_status_posted_id
ON car_updates (status, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_updates_is_featured
ON car_updates (is_featured);

CREATE INDEX IF NOT EXISTS idx_car_updates_featured_position
ON car_updates (featured_position);

CREATE INDEX IF NOT EXISTS idx_car_updates_status_featured_slot_posted
ON car_updates (status, is_featured, featured_position, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_updates_featured_request_status
ON car_updates (featured_request_status);

CREATE INDEX IF NOT EXISTS idx_car_updates_status_feature_request_posted
ON car_updates (status, featured_request_status, posted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_car_updates_year
ON car_updates (year);

CREATE TABLE IF NOT EXISTS room_events (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL,
  event_type TEXT NOT NULL,
  room_status TEXT,
  game_type TEXT,
  player_count INTEGER NOT NULL,
  connected_count INTEGER NOT NULL,
  host_id TEXT,
  player_id TEXT,
  player_name TEXT,
  reason TEXT,
  details_json TEXT,
  players_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_room_events_room_code
ON room_events (room_code);

CREATE INDEX IF NOT EXISTS idx_room_events_event_type
ON room_events (event_type);

CREATE INDEX IF NOT EXISTS idx_room_events_created_at
ON room_events (created_at DESC);
