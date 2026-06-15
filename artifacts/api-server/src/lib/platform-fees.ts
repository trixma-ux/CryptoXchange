import { db, usersTable, walletsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger.js";

export const PLATFORM_FEES = {
  deposit: 1.0,
  withdrawal: 0.5,
  trading: 0.2,
  swap: 0.2,
};

export async function creditPlatformFee(params: {
  feeAmountFcfa: number;
  sourceType: "DEPOSIT" | "WITHDRAWAL" | "TRADE_BUY" | "TRADE_SELL" | "SWAP";
  description: string;
}): Promise<void> {
  try {
    const { feeAmountFcfa, sourceType, description } = params;
    if (feeAmountFcfa <= 0) return;

    const feeAmountUSD = feeAmountFcfa / 605;

    const owners = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "SUPER_ADMIN"))
      .limit(1);

    if (owners.length === 0) {
      const admins = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.role, "ADMIN"))
        .limit(1);
      if (admins.length === 0) return;
      owners.push(admins[0]);
    }

    const ownerId = owners[0].id;

    let ownerWallet = await db.select()
      .from(walletsTable)
      .where(and(eq(walletsTable.userId, ownerId), eq(walletsTable.currency, "USDT_TRC20")))
      .limit(1);

    if (ownerWallet.length === 0) {
      ownerWallet = await db.select()
        .from(walletsTable)
        .where(eq(walletsTable.userId, ownerId))
        .limit(1);
    }

    if (ownerWallet.length > 0) {
      const newBalance = parseFloat(ownerWallet[0].balance.toString()) + feeAmountUSD;
      await db.update(walletsTable)
        .set({ balance: newBalance.toFixed(8), updatedAt: new Date() })
        .where(eq(walletsTable.id, ownerWallet[0].id));
    }

    await db.insert(transactionsTable).values({
      userId: ownerId,
      type: "FEE",
      status: "COMPLETED",
      currency: "USDT_TRC20",
      amount: feeAmountUSD.toFixed(8),
      fee: "0",
      netAmount: feeAmountUSD.toFixed(8),
      fiatCurrency: "XOF",
      fiatAmount: feeAmountFcfa.toFixed(2),
      exchangeRate: "605",
      description: `[Commission] ${description}`,
      metadata: { sourceType, feeAmountFcfa },
    });

  } catch (err) {
    logger.error({ err }, "Erreur lors du crédit des frais plateforme");
  }
}
