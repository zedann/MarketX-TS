ALTER TABLE users
    DROP COLUMN IF EXISTS passcode,
    ADD COLUMN IF NOT EXISTS pinkey VARCHAR(255);