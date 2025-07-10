import userModel from "../models/user";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
}

/**
 * Email validation with proper format checking
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
};

/**
 * Username validation with format and uniqueness checking
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: false, error: "Username is required" };
  }

  // Username rules: 3-20 characters, alphanumeric and underscores only, no spaces
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return { 
      isValid: false, 
      error: "Username must be 3-20 characters long and contain only letters, numbers, and underscores" 
    };
  }

  // Check if starts with number
  if (/^[0-9]/.test(username)) {
    return { isValid: false, error: "Username cannot start with a number" };
  }

  return { isValid: true };
};

/**
 * Password validation with complexity requirements
 * BRD: 8-12 chars, upper/lower case, number, symbol
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 8 || password.length > 12) {
    return { isValid: false, error: "Password must be between 8-12 characters long" };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const missingRequirements = [];
  if (!hasUpperCase) missingRequirements.push("uppercase letter");
  if (!hasLowerCase) missingRequirements.push("lowercase letter");
  if (!hasNumber) missingRequirements.push("number");
  if (!hasSymbol) missingRequirements.push("special character");

  if (missingRequirements.length > 0) {
    return { 
      isValid: false, 
      error: `Password must contain: ${missingRequirements.join(", ")}` 
    };
  }

  return { isValid: true };
};

/**
 * Password strength meter
 */
export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { score: 0, feedback: ["Password is required"] };

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  else feedback.push("Use at least 8 characters");

  // Character variety
  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Add uppercase letters");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Add lowercase letters");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Add numbers");

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  else feedback.push("Add special characters");

  // Bonus for longer passwords
  if (password.length >= 10) score = Math.min(score + 1, 5);

  return { score: Math.min(score, 4), feedback };
};

/**
 * PIN code validation (6-digit as per BRD)
 */
export const validatePinCode = (pin: string): ValidationResult => {
  if (!pin) {
    return { isValid: false, error: "PIN code is required" };
  }

  if (!/^\d{6}$/.test(pin)) {
    return { isValid: false, error: "PIN code must be exactly 6 digits" };
  }

  // Check for common weak patterns
  const weakPatterns = [
    "123456", "654321", "111111", "222222", "333333", 
    "444444", "555555", "666666", "777777", "888888", "999999", "000000"
  ];

  if (weakPatterns.includes(pin)) {
    return { isValid: false, error: "PIN code is too common. Please choose a different combination" };
  }

  return { isValid: true };
};

/**
 * Age validation from birthday (must be 18+)
 */
export const validateAge = (birthday: string): ValidationResult => {
  if (!birthday) {
    return { isValid: false, error: "Date of birth is required" };
  }

  const birthDate = new Date(birthday);
  const today = new Date();
  
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: "Please enter a valid date" };
  }

  if (birthDate > today) {
    return { isValid: false, error: "Date of birth cannot be in the future" };
  }

  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    const actualAge = age - 1;
    if (actualAge < 18) {
      return { isValid: false, error: "You must be at least 18 years old to register" };
    }
  } else if (age < 18) {
    return { isValid: false, error: "You must be at least 18 years old to register" };
  }

  return { isValid: true };
};

/**
 * Phone number validation with country code
 */
export const validatePhoneNumber = (phone: string, countryCode?: string): ValidationResult => {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return { isValid: false, error: "Phone number must be between 10-15 digits" };
  }

  // Basic international format validation
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
    return { isValid: false, error: "Please enter a valid phone number" };
  }

  return { isValid: true };
};

/**
 * Full name validation
 */
export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName) {
    return { isValid: false, error: "Full name is required" };
  }

  if (fullName.trim().length < 2) {
    return { isValid: false, error: "Full name must be at least 2 characters long" };
  }

  // Only letters, spaces, apostrophes, and hyphens allowed
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(fullName)) {
    return { isValid: false, error: "Full name can only contain letters, spaces, apostrophes, and hyphens" };
  }

  return { isValid: true };
};

/**
 * National ID validation (basic format check)
 */
export const validateNationalId = (nationalId: string): ValidationResult => {
  if (!nationalId) {
    return { isValid: false, error: "National ID is required" };
  }

  // Basic validation - alphanumeric, 6-20 characters
  if (nationalId.length < 6 || nationalId.length > 20) {
    return { isValid: false, error: "National ID must be between 6-20 characters" };
  }

  return { isValid: true };
};

/**
 * Check email availability
 */
export const checkEmailAvailability = async (email: string): Promise<ValidationResult> => {
  try {
    const isAvailable = await userModel.checkEmailAvailability(email);
    if (!isAvailable) {
      return { isValid: false, error: "This email is already registered" };
    }
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Unable to check email availability" };
  }
};

/**
 * Check username availability
 */
export const checkUsernameAvailability = async (username: string): Promise<ValidationResult> => {
  try {
    const isAvailable = await userModel.checkUsernameAvailability(username);
    if (!isAvailable) {
      return { isValid: false, error: "This username is already taken" };
    }
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Unable to check username availability" };
  }
};

/**
 * Comprehensive user data validation for registration
 */
export const validateRegistrationStep = async (step: string, data: any): Promise<ValidationResult> => {
  switch (step) {
    case "email":
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) return emailValidation;
      return await checkEmailAvailability(data.email);

    case "personal":
      const nameValidation = validateFullName(data.fullname);
      if (!nameValidation.isValid) return nameValidation;

      if (data.username) {
        const usernameValidation = validateUsername(data.username);
        if (!usernameValidation.isValid) return usernameValidation;
        const usernameAvailability = await checkUsernameAvailability(data.username);
        if (!usernameAvailability.isValid) return usernameAvailability;
      }

      return { isValid: true };

    case "location":
      if (!data.country_of_birth) {
        return { isValid: false, error: "Country of birth is required" };
      }
      if (!data.nationality) {
        return { isValid: false, error: "Nationality is required" };
      }
      return { isValid: true };

    case "contact":
      const phoneValidation = validatePhoneNumber(data.mobile);
      if (!phoneValidation.isValid) return phoneValidation;

      const ageValidation = validateAge(data.birthday);
      if (!ageValidation.isValid) return ageValidation;

      return { isValid: true };

    case "security":
      const pinValidation = validatePinCode(data.passcode);
      if (!pinValidation.isValid) return pinValidation;

      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) return passwordValidation;

      if (data.password !== data.confirm_password) {
        return { isValid: false, error: "Passwords do not match" };
      }

      if (data.passcode !== data.confirm_passcode) {
        return { isValid: false, error: "PIN codes do not match" };
      }

      return { isValid: true };

    case "identity":
      if (!data.national_id) {
        return { isValid: false, error: "National ID is required" };
      }
      const nationalIdValidation = validateNationalId(data.national_id);
      if (!nationalIdValidation.isValid) return nationalIdValidation;

      return { isValid: true };

    case "employment":
      if (!data.statement) {
        return { isValid: false, error: "Employment status is required" };
      }
      const validStatements = ["student", "employed", "unemployed", "self_employed"];
      if (!validStatements.includes(data.statement)) {
        return { isValid: false, error: "Please select a valid employment status" };
      }
      return { isValid: true };

    case "terms":
      if (!data.terms_accepted) {
        return { isValid: false, error: "You must accept the terms and conditions to continue" };
      }
      return { isValid: true };

    default:
      return { isValid: false, error: "Invalid validation step" };
  }
}; 