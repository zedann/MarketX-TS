export enum UserQueries {
  findByGoogleId = `SELECT fullname , mobile , email , birthday , national_id , user_type , is_active , statement , is_first_login , profile_pic , passcode FROM users WHERE google_id = $1
`,
  findById = `SELECT fullname , mobile , email , birthday , national_id , user_type , is_active , statement , is_first_login , profile_pic , passcode  FROM users WHERE id = $1 LIMIT=1
`,
  findByEmail = `SELECT fullname , mobile , email , birthday , national_id , user_type , is_active , statement , is_first_login , profile_pic , passcode FROM users WHERE email = $1
`,
  findByMobile = `SELECT fullname , mobile , email , birthday , national_id , user_type , is_active , statement , is_first_login , profile_pic , passcode FROM users WHERE mobile = $1
`,
  createUser = `INSERT INTO users (mobile, fullname, email, national_id, statement, is_first_login, profile_pic, user_type, is_active, birthday, google_auth_enabled, passcode, confirm_passcode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
`,
  updateLastLogin = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1
`,
  updateFirstLoginStatus = `UPDATE users SET is_first_login = false WHERE id = $1 LIMIT=1
`,
  updateUserIsActive = `UPDATE users SET is_active = $1 WHERE id = $2
`,
  updateUserStatement = `UPDATE users SET statement = $1 WHERE id = $2
`,
  updateUserPasscode = `UPDATE users SET passcode = $1 WHERE id = $2
`,
  updateUserType = `UPDATE users SET user_type = $1 WHERE id = $2
`,
  updateUserGoogleAuthEnabled = `UPDATE users SET google_auth_enabled = $1 WHERE id = $2
`,
  updateUserEmail = `UPDATE users SET email = $1 WHERE id = $2
`,
  updateUserMobile = `UPDATE users SET mobile = $1 WHERE id = $2
`,
  updateUserProfilePic = `UPDATE users SET profile_pic = $1 WHERE id = $2
`,
  updateUserNationalId = `UPDATE users SET national_id = $1 WHERE id = $2
`,
  updateUserBirthday = `UPDATE users SET birthday = $1 WHERE id = $2
`,
  updateUserFullname = `UPDATE users SET fullname = $1 WHERE id = $2
`,
}
