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
  mobile: string;
  fullname: string;
  email: string;
  password?: string;
  confirm_password?: string;
  national_id?: string;
  statement?: string;
  is_first_login?: boolean;
  profile_pic: string;
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
};
import pool from "../config/db";

type UserModel = {
  findByGoogleId: (googleId: string) => Promise<User | null>;
  findById: (id: string | undefined) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  updateLastLogin: (userId: string | undefined) => Promise<void>;
  updateFirstLoginStatus: (userId: string | undefined) => Promise<void>;
  createUserWithGoogle: (userData: User) => Promise<User>;
  createUserWithSignUp: (userData: User) => Promise<User>;
  getUsers: (queryParams: any) => Promise<User[]>;
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
        "SELECT fullname, mobile, email , password, birthday, national_id, user_type, is_active, statement, is_first_login, profile_pic, passcode FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error finding user by email:", error);
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
};

export default userModel;
