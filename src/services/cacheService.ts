import redisClient from "../config/redis";

class CacheService {
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      console.error(`Redis GET error for key ${key}:`, err);
      return null;
    }
  }

  static async set(key: string, data: any, ttlSeconds = 3600): Promise<void> {
    try {
      await redisClient.set(key, JSON.stringify(data), { EX: ttlSeconds });
    } catch (err) {
      console.error(`Redis SET error for key ${key}:`, err);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error(`Redis DEL error for key ${key}:`, err);
    }
  }
}

export default CacheService; 