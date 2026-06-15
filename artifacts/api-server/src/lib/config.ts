const isProduction = process.env.NODE_ENV === "production";

const requireSecret = (name: string, fallback: string): string => {
  const val = process.env[name];
  if (!val) {
    if (isProduction) {
      throw new Error(`${name} environment variable is required in production`);
    }
    return fallback;
  }
  return val;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "*",
  appName: "CryptoXchange",

  jwt: {
    secret: requireSecret("JWT_SECRET", "dev_jwt_secret_change_in_production_not_safe"),
    refreshSecret: requireSecret("JWT_REFRESH_SECRET", "dev_refresh_secret_change_in_production_not_safe"),
    expiresIn: "15m",
    refreshExpiresIn: "7d",
  },

  totp: {
    issuer: "CryptoXchange",
  },

  security: {
    bcryptRounds: 12,
    loginAttemptsMax: 5,
    loginLockoutDuration: 30 * 60 * 1000,
  },

  fees: {
    trading: 0.1,
    withdrawal: 0.5,
    swap: 0.2,
    deposit: 0,
  },

  fiat: {
    defaultCurrency: "XOF",
    defaultSymbol: "FCFA",
  },

  uploadDir: "./uploads",
};
