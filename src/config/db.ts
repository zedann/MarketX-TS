import { Pool } from "pg";
import { config } from "dotenv";
config();

const pool: Pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(<string>process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "marketx",
});

pool.on("connect", () => {
  console.log("connected to the db");
});

pool.on("error", (err) => {
  console.error("Error: ", err);
});

export default pool;
