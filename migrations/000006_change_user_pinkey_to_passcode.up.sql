ALTER TABLE users
    DROP COLUMN IF EXISTS pinkey,
    ADD COLUMN IF NOT EXISTS passcode VARCHAR(255);