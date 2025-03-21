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

- ## /api/v1/auth/google [GET]

  > Sign up or sign in with Google authentication.

  ### Example Request

  ```http
  GET /api/v1/auth/google
  ```

  This will redirect the user to Google's authentication page.

- ## /api/v1/auth/profile [GET]

  > Get user profile information.

  ### Example Request

  ```http
  GET /api/v1/auth/profile
  ```

  ### Example Response

  ```json
  {
    "id": "123",
    "name": "Test User"
  }
  ```

- ## /api/v1/auth/logout [GET]

  > Logout with Google authentication.

  ### Example Request

  ```http
  GET /api/v1/auth/logout
  ```

  This will log the user out and redirect them to the frontend URL.

- ## /api/v1/auth/verify-otp [POST]

  > Verify OTP for authentication.

  ### Example Request

  ```http
  POST /api/v1/auth/verify-otp
  Content-Type: application/json

  {
    "idToken": "your-id-token"
  }
  ```

  ### Example Response

  ```json
  {
    "message": "OTP verified successfully",
    "user": {
      "uid": "user-uid"
    }
  }
  ```

- ## /api/v1/auth/signin [POST]

  > Login with username and password.

  ### Example Request

  ```http
  POST /api/v1/auth/signin
  Content-Type: application/json

  {
    "email": "user@example.com",
    "password": "userpassword"
  }
  ```

  ### Example Response

  ```json
  {
    "status": "success",
    "message": "Token Created",
    "payload": {
      "user": {
        "fullname": "John Doe",
        "email": "user@example.com",
        "mobile": "1234567890",
        "is_active": true
      },
      "token": "jwt-token"
    }
  }
  ```

- ## /api/v1/auth/signup [POST]

  > Register a new user.

  ### Example Request

  ```http
  POST /api/v1/auth/signup
  Content-Type: application/json

  {
    "fullname": "John Doe",
    "email": "user@example.com",
    "password": "userpassword",
    "confirm_password": "userpassword",
    "mobile": "1234567890",
    "birthday": "1990-01-01",
    "passcode": "1234",
    "confirm_passcode": "1234"
  }
  ```

  ### Example Response

  ```json
  {
    "status": "success",
    "message": "Token Created",
    "payload": {
      "user": {
        "fullname": "John Doe",
        "email": "user@example.com",
        "mobile": "1234567890",
        "is_active": true
      },
      "token": "jwt-token"
    }
  }
  ```

- ## /api/v1/stocks [GET]

  > Get a list of stocks.

  ### Example Request

  ```http
  GET /api/v1/stocks
  ```

  ### Example Response

  ```json
  [
    {
      "id": "stock1",
      "name": "Stock One",
      "price": 100
    },
    {
      "id": "stock2",
      "name": "Stock Two",
      "price": 200
    }
  ]
  ```

- ## /api/v1/stocks/:id [GET]

  > Get details of a specific stock.

  ### Example Request

  ```http
  GET /api/v1/stocks/stock1
  ```

  ### Example Response

  ```json
  {
    "id": "stock1",
    "name": "Stock One",
    "price": 100,
    "description": "Detailed description of Stock One"
  }
  ```

- ## /api/v1/stocks/:id/recommend [POST]

  > Recommend a stock.

  ### Example Request

  ```http
  POST /api/v1/stocks/stock1/recommend
  ```

  ### Example Response

  ```json
  {
    "status": "success",
    "message": "Stock recommended successfully"
  }
  ```

- ## /api/v1/stocks/:id/review [POST]

  > Review a stock.

  ### Example Request

  ```http
  POST /api/v1/stocks/stock1/review
  Content-Type: application/json

  {
    "review": "Great stock!",
    "rating": 5
  }
  ```

  ### Example Response

  ```json
  {
    "status": "success",
    "message": "Review submitted successfully"
  }
  ```

- ## /api/v1/users [GET, POST]

  > Get a list of users or create a new user.

  ### Query Parameters

  - **Filtering**: You can filter users by any field in the `users` table. For example, `?name=John&age=30`.
  - **Sorting**: Use the `sort` parameter to sort by fields. For example, `?sort=name,age` to sort by name and then age.
  - **Pagination**: Use `page` and `limit` to control pagination. For example, `?page=2&limit=10` to get the second page with 10 users per page.

  ### Example Request (GET)

  ```http
  GET /api/v1/users?name=John&age=30&sort=name,age&page=2&limit=10
  ```

  This request will return users named John who are 30 years old, sorted by name and age, and will return the second page of results with 10 users per page.

  ### Example Request (POST)

  ```http
  POST /api/v1/users
  Content-Type: application/json

  {
    "fullname": "Jane Doe",
    "email": "jane@example.com",
    "password": "janepassword",
    "confirm_password": "janepassword",
    "mobile": "0987654321",
    "birthday": "1992-02-02",
    "passcode": "5678",
    "confirm_passcode": "5678"
  }
  ```

  ### Example Response (POST)

  ```json
  {
    "status": "success",
    "message": "User created successfully",
    "payload": {
      "fullname": "Jane Doe",
      "email": "jane@example.com",
      "mobile": "0987654321",
      "is_active": true
    }
  }
  ```

- ## /api/v1/users/upload-id [POST]

  > Upload user ID image.

  ### Example Request

  ```http
  POST /api/v1/users/upload-id
  Content-Type: multipart/form-data

  (form-data with key "idImage" and the image file)
  ```

  ### Example Response

  ```json
  {
    "status": "success",
    "message": "ID extracted",
    "payload": {
      "nationalId": "12345678901234"
    }
  }
  ```

- ## /api/v1/users/update_first_login_state/:userId [PATCH]

  > Update the first login status of a user.

  ### Example Request

  ```http
  PATCH /api/v1/users/update_first_login_state/user1
  ```

  ### Example Response

  ```json
  {
    "status": "success",
    "message": "First login status updated"
  }
  ```

- ## /api/v1/users/:id [GET]

  > Get details of a specific user.

  ### Example Request

  ```http
  GET /api/v1/users/user1
  ```

  ### Example Response

  ```json
  {
    "id": "user1",
    "fullname": "John Doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "user_type": "user",
    "is_active": true
  }
  ```

- ## /api/v1/users/:id/stocks [GET]

  > Get stocks owned by a specific user.

  ### Example Request

  ```http
  GET /api/v1/users/user1/stocks
  ```

  ### Example Response

  ```json
  [
    {
      "id": "stock1",
      "name": "Stock One",
      "price": 100
    }
  ]
  ```
