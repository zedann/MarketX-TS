# MarketX

Convert MarketX from js to ts

## Description

MarketX is a platform for buying, selling , recommending and reviewing stocks.

## Tech Stack

- Go for migrations
- Typescript for the server
- PostgreSQL
- Docker
- Docker Compose
- Makefile
- pgx
- migrate

## Setup Instructions

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/zedann/MarketX-TS
   cd MarketX-TS
   ```

2. **Create a `.env` File**:
   Copy the sample environment file:

   ```bash
   cp .env.example .env
   ```

3. **Update Environment Variables**:
   Open the `.env` file and update the values with your local configuration:

   ```plaintext
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=marketx
   DB_HOST=postgres
   DB_PORT=543
   SESSION_SECRET=marketxsessionsecretasf
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES_IN=90
   JWT_SECRET=01101101 01100001 01110010 01101011 01100101 01110100 01111000
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   ```

4. **Run the Application**:
   Use Docker Compose to build and run the application:

   ```bash
   docker-compose up --build
   ```

5. **Access the Application**:
   The backend will be available at `http://localhost:8000`.

6. **Everytime to get latest version of the project**:

   1-

   ```bash
   git pull origin main
   ```

   2-

   ```plaintext
   check for .env.example
   ```

   2-

   ```bash
   docker-compose up --build
   ```

# END POINTS

- ## /api/v1/auth/google [ok]
  > sign up | sign in with google auth
- ## /api/v1/auth/profile [ok]
  > get user profile information
- ## /api/v1/auth/logout [ok]
  > logout with google auth
- ## /api/v1/auth/verify-otp [ok]
  > verify OTP for authentication
- ## /api/v1/auth/signin
  > login with username and password
- ## /api/v1/auth/signup
  > register a new user
- ## /api/v1/stocks
  > get a list of stocks
- ## /api/v1/stocks/:id
  > get details of a specific stock
- ## /api/v1/stocks/:id/recommend
  > recommend a stock
- ## /api/v1/stocks/:id/review
  > review a stock
- ## /api/v1/users [ok]
  > get a list of users or create a new user
- ## /api/v1/users/upload-id [ok]
  > upload user ID image
- ## /api/v1/users/update_first_login_state/:userId [ok]
  > update the first login status of a user
- ## /api/v1/users/:id [ok]
  > get details of a specific user
- ## /api/v1/users/:id/stocks
  > get stocks owned by a specific user
