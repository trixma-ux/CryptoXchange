import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  appName: process.env.APP_NAME || 'CryptoXchange',

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@cryptoxchange.com',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },

  totp: {
    issuer: process.env.TOTP_ISSUER || 'CryptoXchange',
  },

  coingecko: {
    apiKey: process.env.COINGECKO_API_KEY || '',
    baseUrl: 'https://api.coingecko.com/api/v3',
  },

  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    loginAttemptsMax: parseInt(process.env.LOGIN_ATTEMPTS_MAX || '5', 10),
    loginLockoutDuration: parseInt(process.env.LOGIN_LOCKOUT_DURATION || '1800000', 10),
  },

  fees: {
    trading: parseFloat(process.env.DEFAULT_TRADING_FEE || '0.1'),
    withdrawal: parseFloat(process.env.DEFAULT_WITHDRAWAL_FEE || '0.5'),
    swap: parseFloat(process.env.DEFAULT_SWAP_FEE || '0.2'),
    deposit: parseFloat(process.env.DEFAULT_DEPOSIT_FEE || '0'),
  },

  fiat: {
    defaultCurrency: process.env.DEFAULT_FIAT_CURRENCY || 'XOF',
    defaultSymbol: process.env.DEFAULT_FIAT_SYMBOL || 'FCFA',
  },

  mobileMoney: {
    orange: {
      clientId: process.env.ORANGE_MONEY_CLIENT_ID || '',
      clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET || '',
      baseUrl: process.env.ORANGE_MONEY_BASE_URL || '',
    },
    mtn: {
      apiKey: process.env.MTN_MOMO_API_KEY || '',
      subscriptionKey: process.env.MTN_MOMO_SUBSCRIPTION_KEY || '',
      baseUrl: process.env.MTN_MOMO_BASE_URL || '',
    },
    wave: {
      apiKey: process.env.WAVE_API_KEY || '',
      baseUrl: process.env.WAVE_BASE_URL || '',
    },
  },
};
