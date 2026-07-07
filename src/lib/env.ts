import logger from './logger';

/**
 * Environment Configuration Validator
 * Ensures all required variables are present before the app proceeds
 */

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
];

const OPTIONAL_ENV_VARS = [
  'GEMINI_API_KEY',
  'NODE_ENV',
];

export function getRequiredEnvVar(key: string, options?: { allowEmptyInDevelopment?: boolean; requiredInProduction?: boolean }) {
  const value = process.env[key];
  const isProduction = process.env.NODE_ENV === 'production';
  const required = options?.requiredInProduction ?? true;
  const allowEmptyInDevelopment = options?.allowEmptyInDevelopment ?? false;

  if (!value) {
    if (isProduction && required) {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    if (!isProduction && !allowEmptyInDevelopment) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return value || '';
}

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const errorMsg = `❌ Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);

    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
  } else {
    logger.info('✅ Environment variables validated');
  }

  // Log status of optional vars
  const missingOptional = OPTIONAL_ENV_VARS.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    logger.warn(`⚠️ Missing optional environment variables: ${missingOptional.join(', ')}`);
  }
}

// Auto-run on import to ensure early detection
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}
