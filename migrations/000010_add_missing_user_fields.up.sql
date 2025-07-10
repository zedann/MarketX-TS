-- Add missing fields for comprehensive user onboarding
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selfie_pic VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Update passcode to 6 digits as per BRD requirements
ALTER TABLE users ALTER COLUMN passcode TYPE VARCHAR(6);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted ON users(terms_accepted);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified); 