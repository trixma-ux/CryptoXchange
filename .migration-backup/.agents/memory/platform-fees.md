---
name: Platform fee/commission system
description: How the platform owner earns commissions on every transaction
---

## Fee rates (PLATFORM_FEES in platform-fees.ts)
- Deposit (Mobile Money / bank transfer): 1%
- Withdrawal: 0.5%
- Trade buy/sell: 0.2%
- Swap: 0.2% (not yet wired to creditPlatformFee — only deposit/withdrawal/trade done)

## Mechanism
`creditPlatformFee({ feeAmountFcfa, sourceType, description })` in `artifacts/api-server/src/lib/platform-fees.ts`:
1. Finds first SUPER_ADMIN user (falls back to first ADMIN)
2. Credits their USDT_TRC20 wallet (falls back to first wallet found)
3. Inserts a PLATFORM_FEE transaction for audit trail

**Why:** User (initiateur/founder) wants revenue credited automatically to their account on every user transaction. No separate revenue table — uses existing transactions + wallet tables.

**How to apply:** Call `creditPlatformFee()` after any successful financial operation. Fee is calculated before crediting so the user's net amount is reduced accordingly.

**Owner identification:** First SUPER_ADMIN in DB. To set up: register first user, then manually set role='SUPER_ADMIN' in DB, or add a seed script.
