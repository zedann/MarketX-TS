-- Remove indexes
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_terms_accepted;
DROP INDEX IF EXISTS idx_users_email_verified;

-- Revert passcode to 4 digits
ALTER TABLE users ALTER COLUMN passcode TYPE VARCHAR(4);

-- Remove added columns
ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users DROP COLUMN IF EXISTS selfie_pic;
ALTER TABLE users DROP COLUMN IF EXISTS terms_accepted;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified; 