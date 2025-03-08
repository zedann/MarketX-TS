ALTER TABLE users
    DROP COLUMN pinkey,
    ADD COLUMN passcode VARCHAR(255);