import ApiFeatures from "../utils/apiFeatures";

export type CreateUserReq = {
  fullname: string;
  email: string;
  profile_pic?: string;
  mobile: string;
  user_type?: string;
  birthday: string;
  passcode: string;
  password: string;
  confirm_passcode?: string;
};

export type CreateUserRes = {
  fullname: string;
  email: string;
  mobile: string;
  profile_pic?: string;
  user_type?: string;
  is_active?: boolean;
  birthday?: string;
};
export type User = {
  id?: string;
  googleId?: string;
  username?: string;
  mobile: string;
  fullname: string;
  email: string;
  password?: string;
  confirm_password?: string;
  national_id?: string;
  statement?: string;
  is_first_login?: boolean;
  profile_pic: string;
  selfie_pic?: string;
  user_type?: string;
  is_active?: boolean;
  birthday?: string;
  google_auth_enabled?: boolean;
  passcode: string;
  confirm_passcode?: string;
  last_login?: string;
  token?: string;
  country_of_birth?: string;
  nationality?: string;
  terms_accepted?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  login_attempts?: number;
  locked_until?: string;
  last_failed_login?: string;
};
import pool from "../config/db";

type UserModel = {
  findByGoogleId: (googleId: string) => Promise<User | null>;
  findById: (id: string | undefined) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  findByUsername: (username: string) => Promise<User | null>;
  checkEmailAvailability: (email: string) => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  updateLastLogin: (userId: string | undefined) => Promise<void>;
  updateFirstLoginStatus: (userId: string | undefined) => Promise<void>;
  updateEmailVerification: (userId: string, verified: boolean) => Promise<void>;
  updatePhoneVerification: (userId: string, verified: boolean) => Promise<void>;
  updateTermsAcceptance: (userId: string, accepted: boolean) => Promise<void>;
  createUserWithGoogle: (userData: User) => Promise<User>;
  createUserWithSignUp: (userData: User) => Promise<User>;
  createUserStepByStep: (userData: Partial<User>) => Promise<User>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<User>;
  getUsers: (queryParams: any) => Promise<User[]>;
  incrementLoginAttempts: (email: string) => Promise<void>;
  resetLoginAttempts: (email: string) => Promise<void>;
  lockAccount: (email: string, lockDuration: number) => Promise<void>;
  isAccountLocked: (email: string) => Promise<boolean>;
};
const userModel: UserModel = {
  findByGoogleId: async (googleId: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE google_id = $1 LIMIT 1",
        [googleId]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error finding user by Google ID:", error);
      throw error;
    }
  },

  findById: async (id: string | undefined) => {
    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE id = $1 LIMIT 1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  },

  findByEmail: async (email: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  },

  findByUsername: async (username: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1 LIMIT 1",
        [username]
      );
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw error;
    }
  },

  checkEmailAvailability: async (email: string) => {
    try {
      const result = await pool.query(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      return result.rows.length === 0; // true if available (no existing user)
    } catch (error) {
      console.error("Error checking email availability:", error);
      throw error;
    }
  },

  checkUsernameAvailability: async (username: string) => {
    try {
      const result = await pool.query(
        "SELECT id FROM users WHERE username = $1 LIMIT 1",
        [username]
      );
      return result.rows.length === 0; // true if available (no existing user)
    } catch (error) {
      console.error("Error checking username availability:", error);
      throw error;
    }
  },

  updateLastLogin: async (userId: string | undefined) => {
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

  updateFirstLoginStatus: async (userId: string | undefined) => {
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

  updateEmailVerification: async (userId: string, verified: boolean) => {
    try {
      await pool.query(
        "UPDATE users SET email_verified = $1 WHERE id = $2",
        [verified, userId]
      );
    } catch (error) {
      console.error("Error updating email verification:", error);
      throw error;
    }
  },

  updatePhoneVerification: async (userId: string, verified: boolean) => {
    try {
      await pool.query(
        "UPDATE users SET phone_verified = $1 WHERE id = $2",
        [verified, userId]
      );
    } catch (error) {
      console.error("Error updating phone verification:", error);
      throw error;
    }
  },

  updateTermsAcceptance: async (userId: string, accepted: boolean) => {
    try {
      await pool.query(
        "UPDATE users SET terms_accepted = $1 WHERE id = $2",
        [accepted, userId]
      );
    } catch (error) {
      console.error("Error updating terms acceptance:", error);
      throw error;
    }
  },

  createUserWithGoogle: async (userData: User) => {
    try {
      const result = await pool.query(
        `INSERT INTO users (
          google_id,
          fullname, 
          email, 
          birthday,
          passcode,
          profile_pic,
          user_type,
          is_active,
          google_auth_enabled,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8 , $9, CURRENT_TIMESTAMP) RETURNING *`,
        [
          userData.googleId,
          userData.fullname,
          userData.email,
          userData.birthday,
          userData.passcode,
          userData.profile_pic,
          userData.user_type,
          userData.is_active,
          userData.google_auth_enabled,
        ]
      );
      console.log(result.rows[0]);
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },
  createUserWithSignUp: async (userData: User) => {
    try {
      const result = await pool.query(
        `INSERT INTO users (
          fullname, 
          email, 
          mobile,
          birthday,
          password,
          passcode,
          user_type,
          is_active,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP) RETURNING *`,
        [
          userData.fullname,
          userData.email,
          userData.mobile,
          userData.birthday,
          userData.password,
          userData.passcode,
          userData.user_type,
          true,
        ]
      );
      console.log(result.rows[0]);
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  createUserStepByStep: async (userData: Partial<User>) => {
    try {
      const fields = Object.keys(userData).filter(key => userData[key as keyof User] !== undefined);
      const values = fields.map(key => userData[key as keyof User]);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const fieldNames = fields.join(', ');

      const result = await pool.query(
        `INSERT INTO users (${fieldNames}, created_at) VALUES (${placeholders}, CURRENT_TIMESTAMP) RETURNING *`,
        values
      );
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error creating user step by step:", error);
      throw error;
    }
  },

  updateUser: async (userId: string, userData: Partial<User>) => {
    try {
      const fields = Object.keys(userData).filter(key => userData[key as keyof User] !== undefined);
      const values = fields.map(key => userData[key as keyof User]);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

      const result = await pool.query(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [userId, ...values]
      );
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  getUsers: async (queryParams: any) => {
    try {
      const initialQuery = "SELECT * FROM users";
      const apiFeatures = new ApiFeatures(initialQuery, queryParams);

      const fieldsToSelect = queryParams.fields
        ? queryParams.fields.split(",")
        : ["id", "fullname", "email", "mobile", "user_type", "is_active"];

      const finalQuery = apiFeatures
        .selectFields(fieldsToSelect)
        .filter()
        .sort()
        .paginate()
        .getQuery();

      const result = await pool.query(finalQuery);
      console.log(result.rows);
      return result.rows;
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  },

  incrementLoginAttempts: async (email: string) => {
    try {
      await pool.query(
        `UPDATE users SET 
         login_attempts = COALESCE(login_attempts, 0) + 1,
         last_failed_login = CURRENT_TIMESTAMP 
         WHERE email = $1`,
        [email]
      );
    } catch (error) {
      console.error("Error incrementing login attempts:", error);
      throw error;
    }
  },

  resetLoginAttempts: async (email: string) => {
    try {
      await pool.query(
        `UPDATE users SET 
         login_attempts = 0,
         locked_until = NULL,
         last_failed_login = NULL 
         WHERE email = $1`,
        [email]
      );
    } catch (error) {
      console.error("Error resetting login attempts:", error);
      throw error;
    }
  },

  lockAccount: async (email: string, lockDurationMinutes: number) => {
    try {
      await pool.query(
        `UPDATE users SET 
         locked_until = CURRENT_TIMESTAMP + INTERVAL '${lockDurationMinutes} minutes'
         WHERE email = $1`,
        [email]
      );
    } catch (error) {
      console.error("Error locking account:", error);
      throw error;
    }
  },

  isAccountLocked: async (email: string) => {
    try {
      const result = await pool.query(
        `SELECT locked_until FROM users 
         WHERE email = $1 AND locked_until > CURRENT_TIMESTAMP`,
        [email]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking account lock status:", error);
      throw error;
    }
  },
};

export default userModel;
