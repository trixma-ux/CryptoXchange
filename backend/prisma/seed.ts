import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed de la base de données...');

  // 1. Configuration des frais par défaut (si n'existent pas)
  const feeConfigs = [
    { type: 'DEPOSIT', percentage: 1.5, minAmount: 100 },
    { type: 'WITHDRAWAL', percentage: 2.0, minAmount: 500 },
    { type: 'SWAP', percentage: 0.5, minAmount: 10 },
    { type: 'TRADE_BUY', percentage: 1.0, minAmount: 1000 },
    { type: 'TRADE_SELL', percentage: 1.0, minAmount: 1000 }
  ];

  for (const fee of feeConfigs) {
    await prisma.feeConfig.upsert({
      where: { type: fee.type },
      update: {},
      create: fee,
    });
  }
  console.log('✅ Configuration des frais initialisée.');

  // 2. Création de l'utilisateur Admin
  const adminEmail = 'admin@cryptoxchange.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@12345', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'superadmin',
        firstName: 'Super',
        lastName: 'Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'VERIFIED',
        kycStatus: 'APPROVED',
        emailVerified: true
      }
    });
    console.log('✅ Utilisateur administrateur créé (admin@cryptoxchange.com / Admin@12345)');
  } else {
    console.log('✅ Utilisateur administrateur existe déjà.');
  }

  // 3. Création d'un utilisateur Test
  const testEmail = 'test@user.com';
  const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('User@12345', 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        passwordHash,
        role: 'USER',
        status: 'VERIFIED',
        kycStatus: 'APPROVED',
        emailVerified: true
      }
    });

    // Create default wallets for test user
    const cryptos = ['BTC', 'ETH', 'USDT_TRC20', 'BNB', 'SOL'];
    for (const currency of cryptos) {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          currency,
          network: currency === 'USDT_TRC20' ? 'TRON' : (currency === 'BNB' ? 'BSC' : currency),
          address: `mock_address_${currency}_${user.id.substring(0,8)}`,
          balance: currency === 'USDT_TRC20' ? 1000 : (currency === 'BTC' ? 0.05 : 0),
          isActive: true
        }
      });
    }
    console.log('✅ Utilisateur de test créé (test@user.com / User@12345) avec des portefeuilles.');
  } else {
    console.log('✅ Utilisateur de test existe déjà.');
  }

  console.log('🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
