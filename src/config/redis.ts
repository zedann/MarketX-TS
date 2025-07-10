import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

(async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("✅ Connected to Redis");
    }
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
  }
})();

export default redisClient; 