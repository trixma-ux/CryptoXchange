import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TrendingUp, TrendingDown, Wallet, ArrowDownLeft, ArrowUpRight, Repeat, ShoppingCart, Eye, EyeOff } from 'lucide-react';
import { walletsAPI, tradingAPI, transactionsAPI } from '@/lib/api';
import { formatCurrency, formatCrypto } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useAuthStore } from '@/lib/store';

const CRYPTO_COLORS: Record<string, string> = { BTC: '#f7931a', ETH: '#627eea', USDT: '#26a17b', BNB: '#f3ba2f', SOL: '#9945ff', LTC: '#bfbbbb' };

export default function DashboardHome() {
  const { user } = useAuthStore();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    Promise.all([
      walletsAPI.getPortfolio().catch(() => null),
      transactionsAPI.getAll({ page: 1, limit: 5 }).catch(() => null),
    ]).then(([portfolioRes, txRes]) => {
      setPortfolio(portfolioRes?.data?.data || null);
      setTransactions(txRes?.data?.data?.transactions || []);
    }).finally(() => setLoading(false));
  }, []);

  const QUICK_ACTIONS = [
    { href: '/dashboard/buy-sell', icon: ShoppingCart, label: 'Acheter', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { href: '/dashboard/buy-sell?mode=sell', icon: TrendingDown, label: 'Vendre', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    { href: '/dashboard/swap', icon: Repeat, label: 'Échanger', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { href: '/dashboard/deposit', icon: ArrowDownLeft, label: 'Déposer', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { href: '/dashboard/withdraw', icon: ArrowUpRight, label: 'Retirer', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  ];

  return (
    <DashboardLayout title="Tableau de bord">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Bonjour, {user?.firstName} 👋</h2>
        <p style={{ color: '#94a3b8' }}>Voici l'aperçu de votre portefeuille</p>
      </div>

      {/* Portfolio Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.05), transparent)' }} />
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1" style={{ color: '#94a3b8' }}>
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Valeur totale du portefeuille</span>
              <button onClick={() => setHideBalance(!hideBalance)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-4xl font-black text-white">
              {loading ? <div className="skeleton h-10 w-48" /> : hideBalance ? '••••••• FCFA' : formatCurrency(portfolio?.totalValueXOF || 0)}
            </div>
            <div className="text-sm mt-1 font-mono" style={{ color: '#64748b' }}>
              ≈ {hideBalance ? '•••' : `$${(portfolio?.totalValueUSD || 0).toFixed(2)}`}
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-bold" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <TrendingUp className="w-4 h-4" />
            +2.34%
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, color, bg }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl cursor-pointer transition-all"
                style={{ backgroundColor: bg, border: `1px solid ${color}30` }}>
                <Icon className="w-5 h-5" style={{ color }} />
                <span className="text-xs font-semibold" style={{ color }}>{label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Wallets */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Mes Portefeuilles</h3>
            <Link href="/dashboard/wallets" className="text-sm font-medium" style={{ color: '#fbbf24', textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)
            ) : portfolio?.wallets?.length ? (
              portfolio.wallets.slice(0, 5).map((wallet: any, i: number) => (
                <motion.div key={wallet.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card-hover p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-black" style={{ backgroundColor: CRYPTO_COLORS[wallet.currency] || '#f59e0b' }}>
                      {wallet.currency[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white">{wallet.currency}</div>
                      <div className="text-sm" style={{ color: '#94a3b8' }}>{formatCrypto(wallet.balance, wallet.currency)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{formatCurrency(wallet.valueXOF || 0)}</div>
                    <div className="text-sm" style={{ color: '#10b981' }}>≈ ${wallet.valueUSD?.toFixed(2)}</div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-8 text-center" style={{ color: '#94a3b8' }}>
                <Wallet className="w-12 h-12 mx-auto mb-3" style={{ color: '#334155' }} />
                <p>Aucun portefeuille. <Link href="/dashboard/wallets" style={{ color: '#fbbf24', textDecoration: 'none' }}>Créez-en un →</Link></p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Dernières transactions</h3>
            <Link href="/dashboard/transactions" className="text-sm font-medium" style={{ color: '#fbbf24', textDecoration: 'none' }}>Tout voir →</Link>
          </div>
          <div className="glass-card p-4 space-y-3">
            {loading ? (
              Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)
            ) : transactions.length ? (
              transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tx.type === 'DEPOSIT' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                      {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4" style={{ color: '#10b981' }} /> : <ArrowUpRight className="w-4 h-4" style={{ color: '#ef4444' }} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{tx.type}</div>
                      <div className="text-xs" style={{ color: '#94a3b8' }}>{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: tx.type === 'DEPOSIT' ? '#10b981' : '#ef4444' }}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount} {tx.currency}
                    </div>
                    <div className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: tx.status === 'COMPLETED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: tx.status === 'COMPLETED' ? '#10b981' : '#f59e0b' }}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8" style={{ color: '#94a3b8' }}>Aucune transaction</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
