ALTER TABLE users
    DROP COLUMN passcode,
    ADD COLUMN pinkey VARCHAR(255);