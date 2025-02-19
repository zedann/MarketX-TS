CREATE TYPE user_type AS ENUM ('admin', 'user', 'superadmin');
CREATE TYPE statement_type AS ENUM ('student', 'employed', 'unemployed', 'self_employed');

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    google_id VARCHAR(255),
    fullname VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    email VARCHAR(255) NOT NULL UNIQUE,
    birthday DATE,
    national_id VARCHAR(50) UNIQUE,
    national_id_front_pic VARCHAR(255),
    national_id_back_pic VARCHAR(255),
    user_type user_type DEFAULT 'user',
    statement statement_type,
    is_active BOOLEAN DEFAULT true,
    is_first_login BOOLEAN DEFAULT true,
    profile_pic VARCHAR(255),
    pinkey VARCHAR(6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);
