export interface CreateUserReq {
  fullname: string;
  email: string;
  profile_pic: string;
  user_type: string;
  is_active: boolean;
  birthday: string;
  passcode: string;
}
export interface CreateUserRes {
  fullname: string;
  email: string;
  profile_pic: string;
  user_type: string;
  is_active: boolean;
  birthday: string;
}
export interface User {
  googleId: string;
  fullname: string;
  email: string;
  profile_pic: string;
  user_type: string;
  is_active: boolean;
  birthday: string;
  google_auth_enabled: boolean;
  passcode: string;
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
      const result = await pool.query(
        "SELECT * FROM users WHERE id = $1 LIMIT=1",
        [id]
      );
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
        "UPDATE users SET is_first_login = false WHERE id = $1 LIMIT=1",
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
          birthday,
          pinkey,
          profile_pic,
          user_type,
          is_active,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6,$7,$8, CURRENT_TIMESTAMP) RETURNING *`,
        [
          userData.googleId,
          userData.fullname,
          userData.email,
          userData.birthday,
          userData.passcode,
          userData.profile_pic,
          userData.user_type,
          userData.is_active,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },
  getUsers: async () => {
    try {
      const result = await pool.query("SELECT * FROM users");
      console.log(result.rows);
      return result.rows;
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  },
};

export default userModel;
