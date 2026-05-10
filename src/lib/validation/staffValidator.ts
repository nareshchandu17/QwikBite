export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: unknown;
}

export interface StaffData {
  name: string;
  email: string;
  contact: string;
  role?: string;
  shift?: string;
  performance?: number;
  avatar?: string;
  status?: string;
}

export class StaffValidator {
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }
  
  static validateName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name || typeof name !== 'string') {
      errors.push('Name is required');
      return { isValid: false, errors };
    }
    
    const trimmedName = this.sanitizeString(name);
    if (trimmedName.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (trimmedName.length > 100) {
      errors.push('Name must be less than 100 characters');
    }
    
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: trimmedName
    };
  }
  
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
      return { isValid: false, errors };
    }
    
    const trimmedEmail = this.sanitizeString(email).toLowerCase();
    
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      errors.push('Please enter a valid email address');
    }
    
    if (trimmedEmail.length > 255) {
      errors.push('Email must be less than 255 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: trimmedEmail
    };
  }
  
  static validateContact(contact: string): ValidationResult {
    const errors: string[] = [];
    
    if (!contact || typeof contact !== 'string') {
      errors.push('Contact number is required');
      return { isValid: false, errors };
    }
    
    const trimmedContact = this.sanitizeString(contact);
    
    // Remove all non-numeric characters for validation
    const numericOnly = trimmedContact.replace(/\D/g, '');
    
    if (numericOnly.length < 10) {
      errors.push('Contact number must have at least 10 digits');
    }
    
    if (numericOnly.length > 15) {
      errors.push('Contact number must have less than 15 digits');
    }
    
    // Basic phone number validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(trimmedContact)) {
      errors.push('Please enter a valid phone number');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: trimmedContact
    };
  }
  
  static validateRole(role: string): ValidationResult {
    const errors: string[] = [];
    const validRoles = ['Manager', 'Chef', 'Cashier', 'Server', 'Cleaner'];
    
    if (!role || typeof role !== 'string') {
      errors.push('Role is required');
      return { isValid: false, errors };
    }
    
    const trimmedRole = this.sanitizeString(role);
    
    if (!validRoles.includes(trimmedRole)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: trimmedRole
    };
  }
  
  static validateShift(shift: string): ValidationResult {
    const errors: string[] = [];
    
    if (!shift || typeof shift !== 'string') {
      errors.push('Shift is required');
      return { isValid: false, errors };
    }
    
    const trimmedShift = this.sanitizeString(shift);
    
    if (trimmedShift.length < 5) {
      errors.push('Shift details must be at least 5 characters');
    }
    
    if (trimmedShift.length > 100) {
      errors.push('Shift details must be less than 100 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: trimmedShift
    };
  }
  
  static validateAvatar(avatar: string): ValidationResult {
    const errors: string[] = [];
    
    if (!avatar) {
      // Avatar is optional
      return { isValid: true, errors, sanitized: '' };
    }
    
    if (typeof avatar !== 'string') {
      errors.push('Avatar must be a valid URL string');
      return { isValid: false, errors };
    }
    
    const trimmedAvatar = this.sanitizeString(avatar);
    
    // Basic URL validation
    try {
      new URL(trimmedAvatar);
      if (!trimmedAvatar.startsWith('http://') && !trimmedAvatar.startsWith('https://')) {
        errors.push('Avatar URL must start with http:// or https://');
      }
    } catch {
      errors.push('Avatar must be a valid URL');
    }
    
    if (trimmedAvatar.length > 500) {
      errors.push('Avatar URL must be less than 500 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: trimmedAvatar
    };
  }
  
  static validatePerformance(performance: unknown): ValidationResult {
    const errors: string[] = [];
    
    if (performance === null || performance === undefined) {
      // Performance is optional, default to 0
      return { isValid: true, errors, sanitized: 0 };
    }
    
    const numPerformance = Number(performance);
    
    if (isNaN(numPerformance)) {
      errors.push('Performance must be a valid number');
      return { isValid: false, errors };
    }
    
    if (numPerformance < 0 || numPerformance > 100) {
      errors.push('Performance must be between 0 and 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: Math.round(numPerformance)
    };
  }
  
  static validateStatus(status: string): ValidationResult {
    const errors: string[] = [];
    const validStatuses = ['Active', 'Inactive', 'On Leave', 'Off Shift'];
    
    if (!status || typeof status !== 'string') {
      errors.push('Status is required');
      return { isValid: false, errors };
    }
    
    const trimmedStatus = this.sanitizeString(status);
    
    if (!validStatuses.includes(trimmedStatus)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: trimmedStatus
    };
  }
  
  static validateStaffData(data: unknown): ValidationResult {
    const allErrors: string[] = [];
    const sanitized: Record<string, unknown> = {};
    const input = data as StaffData;
    
    // Validate required fields
    const nameResult = this.validateName(input.name);
    if (!nameResult.isValid) {
      allErrors.push(...nameResult.errors);
    } else {
      sanitized.name = nameResult.sanitized;
    }
    
    const emailResult = this.validateEmail(input.email);
    if (!emailResult.isValid) {
      allErrors.push(...emailResult.errors);
    } else {
      sanitized.email = emailResult.sanitized;
    }
    
    const contactResult = this.validateContact(input.contact);
    if (!contactResult.isValid) {
      allErrors.push(...contactResult.errors);
    } else {
      sanitized.contact = contactResult.sanitized;
    }
    
    // Validate optional fields
    const roleResult = this.validateRole(input.role || 'Server');
    if (!roleResult.isValid) {
      allErrors.push(...roleResult.errors);
    } else {
      sanitized.role = roleResult.sanitized;
    }
    
    const shiftResult = this.validateShift(input.shift || '09:00 AM - 05:00 PM');
    if (!shiftResult.isValid) {
      allErrors.push(...shiftResult.errors);
    } else {
      sanitized.shift = shiftResult.sanitized;
    }
    
    const performanceResult = this.validatePerformance(input.performance);
    if (!performanceResult.isValid) {
      allErrors.push(...performanceResult.errors);
    } else {
      sanitized.performance = performanceResult.sanitized;
    }
    
    const avatarResult = this.validateAvatar(input.avatar || '');
    if (!avatarResult.isValid) {
      allErrors.push(...avatarResult.errors);
    } else {
      sanitized.avatar = avatarResult.sanitized;
    }
    
    const statusResult = this.validateStatus(input.status || 'Active');
    if (!statusResult.isValid) {
      allErrors.push(...statusResult.errors);
    } else {
      sanitized.status = statusResult.sanitized;
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      sanitized
    };
  }
}

export default StaffValidator;
