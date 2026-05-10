export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters.' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  
  return { valid: true };
};

export const validateRegNo = (regNo: string): boolean => {
  // Simple validation - not empty and at least 3 characters
  return regNo.length >= 3;
};

export const validateName = (name: string): boolean => {
  // Simple validation - not empty and at least 2 characters
  return name.length >= 2;
};