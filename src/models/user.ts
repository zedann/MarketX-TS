export interface User {
  googleId: string;
  fullname: string;
  email: string;
  profilePic: string;
  userType: string;
  isActive: boolean;
}
import pool from "../config/db";

const userModel = {
  findByGoogleId: async (googleId: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE google_id = $1",
        [googleId]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error finding user by Google ID:", error);
      throw error;
    }
  },

  findById: async (id: string) => {
    try {
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);
      return result.rows[0];
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  },

  updateLastLogin: async (userId: string) => {
    try {
      await pool.query(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
        [userId]
      );
    } catch (error) {
      console.error("Error updating last login:", error);
      throw error;
    }
  },

  updateFirstLoginStatus: async (userId: string) => {
    try {
      await pool.query(
        "UPDATE users SET is_first_login = false WHERE id = $1",
        [userId]
      );
    } catch (error) {
      console.error("Error updating first login status:", error);
      throw error;
    }
  },

  createUser: async (userData: User) => {
    try {
      const result = await pool.query(
        `INSERT INTO users (
          google_id, 
          fullname, 
          email, 
          profile_pic,
          user_type,
          is_active,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING *`,
        [
          userData.googleId,
          userData.fullname,
          userData.email,
          userData.profilePic,
          userData.userType,
          userData.isActive,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },
};

export default userModel;
