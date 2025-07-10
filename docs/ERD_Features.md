# MarketX – Core Entity-Relationship Overview

Below is a concise reference of the **key tables / entities** that power the main MarketX features (registration, security, investments, wallet, stocks, AI).  Use this as a quick lookup for primary keys, foreign-keys, and how modules link together.

```mermaid
erDiagram
    users ||--o{ risk_assessments : "has"
    users ||--o{ user_portfolios : "owns"
    users ||--o{ wallets : "owns"
    users ||--o{ wallet_transactions : "triggers"
    users ||--o{ investment_transactions : "executes"
    users ||--o{ investment_recommendations : "receives"
    users ||--o{ security_events : "generates"

    risk_assessments ||--|{ investment_recommendations : "derived_for"

    user_portfolios ||--o{ user_fund_holdings : "contains"
    user_fund_holdings }o--|| investment_funds : "linked_to"
    investment_funds ||--o{ investment_transactions : "traded_in"

    wallets ||--o{ wallet_transactions : "records"

    stocks ||--o{ stock_price_history : "has_prices"

    investors {users} ||--o{ noah_sessions : "chats_with"
```

---

## Entity Key Fields

| Table | Primary Key | Important FKs / Unique Keys | Module |
|-------|-------------|------------------------------|--------|
| `users` | `id` (UUID) | `email`, `username` (unique) | Auth / Core |
| `risk_assessments` | `id` | `user_id` → users.id | Investment – Risk Engine |
| `investment_funds` | `id` | `symbol` (unique) | Investment – Funds Catalogue |
| `user_portfolios` | `id` | `user_id` | Portfolio Mgmt |
| `user_fund_holdings` | `id` | `portfolio_id`, `fund_id` (unique pair) | Portfolio Mgmt |
| `investment_transactions` | `id` | `user_id`, `portfolio_id`, `fund_id` | Trading Engine |
| `investment_recommendations` | `id` | `user_id`, `risk_assessment_id` | Recommendation Engine |
| `wallets` | `id` | `user_id` (unique) | Wallet |
| `wallet_transactions` | `id` | `user_id`, `reference_number` (unique) | Wallet / Payments |
| `stocks` | `id` | `symbol` (unique) | Stocks Module |
| `stock_price_history` | `id` | `stock_id`, (`stock_id`,`price_date` unique) | Stocks Module |
| `security_events` | `id` | `user_id` (nullable) | Security Monitoring |
| `noah_sessions` *(future)* | `id` | `user_id` | AI Assistant |

> **Note** – minor lookup / log tables (e.g., `fund_price_history`, enum tables) are omitted for clarity.

### Relationship Highlights

- **Risk ➜ Portfolio**: `risk_assessments.risk_category` feeds allocation logic when `user_portfolios` are created.
- **Portfolio ➜ Holdings ➜ Transactions**: `user_fund_holdings` acts as a running position; each `investment_transaction` mutates holdings and triggers allocation recalculation.
- **Wallet ➜ Transactions**: A 1-to-many link; Stripe PaymentIntent `id` is stored in `reference_number` until webhook confirmation.
- **Stocks**: `stocks` master table + `stock_price_history` used for discover page, charts, top-movers.
- **Noah AI**: real-time chat via Socket.IO (`noah_chat`, `noah_reply`) – planned `noah_sessions` table can archive chats per user. 