# MarketX

Convert MarketX from js to ts

## Description

MarketX is a platform for buying, selling , recommending and reviewing stocks.

## Tech Stack

- Go for migrations
- JavaScript for the server
- PostgreSQL
- Docker
- Docker Compose
- Makefile
- pgx
- migrate

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
