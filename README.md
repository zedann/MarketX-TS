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

- ## /auth/google [ok]
  > sign up | sign in with google auth
- ## /auth/google/callback [ok]
  > callback for google auth
- ## /auth/profile [ok]
  > get user profile information
- ## /auth/logout [ok]
  > logout with google auth
- ## /auth/verify-otp [ok]
  > verify OTP for authentication
- ## /auth/login
  > login with username and password
- ## /auth/register
  > register a new user
- ## /stocks
  > get a list of stocks
- ## /stocks/:id
  > get details of a specific stock
- ## /stocks/:id/recommend
  > recommend a stock
- ## /stocks/:id/review
  > review a stock
- ## /users [ok]
  > get a list of users or create a new user
- ## /users/upload-id [ok]
  > upload user ID image
- ## /users/update_first_login_state/:userId [ok]
  > update the first login status of a user
- ## /users/:id [ok]
  > get details of a specific user
- ## /users/:id/stocks
  > get stocks owned by a specific user
