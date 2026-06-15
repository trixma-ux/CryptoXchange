export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "*",
  appName: "CryptoXchange",

  jwt: {
    secret: process.env.JWT_SECRET || "cryptoxchange_jwt_secret_dev_only_change_in_prod",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "cryptoxchange_refresh_secret_dev_only_change_in_prod",
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
