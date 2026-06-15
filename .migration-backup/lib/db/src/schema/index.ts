import { pgTable, text, varchar, decimal, boolean, timestamp, integer, pgEnum, uuid, jsonb } from "drizzle-orm/pg-core";

// ===== ENUMS =====
export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN", "SUPER_ADMIN"]);
export const userStatusEnum = pgEnum("user_status", ["PENDING", "ACTIVE", "SUSPENDED", "BANNED"]);
export const kycStatusEnum = pgEnum("kyc_status", ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"]);
export const txTypeEnum = pgEnum("tx_type", ["DEPOSIT_CRYPTO", "DEPOSIT_FIAT", "WITHDRAWAL_CRYPTO", "WITHDRAWAL_FIAT", "TRADE_BUY", "TRADE_SELL", "SWAP", "FEE"]);
export const txStatusEnum = pgEnum("tx_status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "REQUIRES_APPROVAL"]);
export const kycDocTypeEnum = pgEnum("kyc_doc_type", ["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE", "PROOF_OF_ADDRESS"]);
export const kycDocStatusEnum = pgEnum("kyc_doc_status", ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["OPEN", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]);

// ===== USERS =====
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  phone: varchar("phone", { length: 30 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("USER").notNull(),
  status: userStatusEnum("status").default("ACTIVE").notNull(),
  kycStatus: kycStatusEnum("kyc_status").default("PENDING").notNull(),
  emailVerified: boolean("email_verified").default(true).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  loginAttempts: integer("login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;

// ===== REFRESH TOKENS =====
export const refreshTokensTable = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== WALLETS =====
export const walletsTable = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  currency: varchar("currency", { length: 20 }).notNull(),
  network: varchar("network", { length: 30 }).notNull(),
  address: text("address").notNull(),
  balance: decimal("balance", { precision: 28, scale: 8 }).default("0").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Wallet = typeof walletsTable.$inferSelect;

// ===== TRANSACTIONS =====
export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: txTypeEnum("type").notNull(),
  status: txStatusEnum("status").default("PENDING").notNull(),
  currency: varchar("currency", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 28, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 28, scale: 8 }).default("0").notNull(),
  netAmount: decimal("net_amount", { precision: 28, scale: 8 }).notNull(),
  fiatCurrency: varchar("fiat_currency", { length: 10 }),
  fiatAmount: decimal("fiat_amount", { precision: 20, scale: 2 }),
  exchangeRate: decimal("exchange_rate", { precision: 20, scale: 8 }),
  txHash: text("tx_hash"),
  network: varchar("network", { length: 30 }),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  description: text("description"),
  metadata: jsonb("metadata"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Transaction = typeof transactionsTable.$inferSelect;

// ===== KYC DOCUMENTS =====
export const kycDocumentsTable = pgTable("kyc_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  documentType: kycDocTypeEnum("document_type").notNull(),
  documentUrl: text("document_url").notNull(),
  status: kycDocStatusEnum("status").default("SUBMITTED").notNull(),
  adminNotes: text("admin_notes"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type KycDocument = typeof kycDocumentsTable.$inferSelect;

// ===== NOTIFICATIONS =====
export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("INFO").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== SUPPORT TICKETS =====
export const supportTicketsTable = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).default("Autre").notNull(),
  priority: ticketPriorityEnum("priority").default("MEDIUM").notNull(),
  status: ticketStatusEnum("status").default("OPEN").notNull(),
  message: text("message").notNull(),
  assignedTo: uuid("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== SUPPORT MESSAGES =====
export const supportMessagesTable = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull().references(() => supportTicketsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => usersTable.id),
  message: text("message").notNull(),
  isStaff: boolean("is_staff").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== FEES =====
export const feesTable = pgTable("fees", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull().unique(),
  value: decimal("value", { precision: 10, scale: 4 }).notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
