ALTER TABLE users
RENAME COLUMN google_auth IF EXISTS TO google_auth_enabled;