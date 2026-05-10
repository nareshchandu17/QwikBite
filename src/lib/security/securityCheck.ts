import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/db";

// Security check function to validate environment and configuration
export async function performSecurityCheck() {
  const issues: string[] = [];
  
  // Check JWT Secret
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback_secret_key_should_be_changed_in_production') {
    issues.push('❌ JWT_SECRET is not properly configured');
  } else if (process.env.JWT_SECRET.length < 32) {
    issues.push('⚠️ JWT_SECRET should be at least 32 characters long for security');
  }
  
  // Check MongoDB URI
  if (!process.env.MONGODB_URI) {
    issues.push('❌ MONGODB_URI is not configured');
  }
  
  // Check MongoDB DB
  if (!process.env.MONGODB_DB) {
    issues.push('❌ MONGODB_DB is not configured');
  }
  
  // Check Stripe keys
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    issues.push('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
  }
  
  if (!process.env.STRIPE_SECRET_KEY) {
    issues.push('❌ STRIPE_SECRET_KEY is not configured');
  }
  
  // Database connection test
  try {
    await connectDB();
    // Test query to ensure connection is working
    await User.findOne({});
  } catch (error) {
    issues.push('❌ Database connection failed: ' + (error as Error).message);
  }
  
  // Check for default/fallback values that should be changed
  const defaultValues = [
    'fallback_secret_key',
    'super_secret_key_that_should_be_changed_in_production',
    'your_stripe_publishable_key_here',
    'your_stripe_secret_key_here'
  ];
  
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string' && defaultValues.some(defaultVal => value.includes(defaultVal))) {
      issues.push(`⚠️ Environment variable ${key} contains default/fallback value that should be changed`);
    }
  }
  
  return {
    isSecure: issues.length === 0,
    issues
  };
}

// Function to validate user role
export function isValidRole(role: string): boolean {
  const validRoles = ['customer', 'admin'];
  return validRoles.includes(role);
}

// Function to sanitize user data before sending to client
export function sanitizeUser(user: unknown) {
  const { password: _password, __v: _v, ...sanitizedUser } = user.toObject ? user.toObject() : user;
  return sanitizedUser;
}
