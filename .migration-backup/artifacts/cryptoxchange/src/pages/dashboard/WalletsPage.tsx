import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { walletsAPI } from '@/lib/api';
import { formatCurrency, formatCrypto } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, QrCode, Send, Download } from 'lucide-react';
import { Link } from 'wouter';

const CRYPTO_COLORS: Record<string, string> = { BTC: '#f7931a', ETH: '#627eea', USDT: '#26a17b', BNB: '#f3ba2f', SOL: '#9945ff', LTC: '#bfbbbb', XRP: '#00aae4', ADA: '#0033ad', DOGE: '#c2a633' };
const CRYPTO_NAMES: Record<string, string> = { BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether', BNB: 'BNB', SOL: 'Solana', LTC: 'Litecoin', XRP: 'Ripple', ADA: 'Cardano', DOGE: 'Dogecoin' };

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    walletsAPI.getPortfolio().then(res => {
      setWallets(res.data?.data?.wallets || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Portefeuilles">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Mes Portefeuilles</h2>
        <p style={{ color: '#94a3b8' }}>Gérez toutes vos cryptomonnaies</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : wallets.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet: any, i: number) => (
            <motion.div key={wallet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card-hover p-6 cursor-pointer" onClick={() => setSelectedWallet(selectedWallet?.id === wallet.id ? null : wallet)}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-black" style={{ backgroundColor: CRYPTO_COLORS[wallet.currency] || '#f59e0b' }}>
                    {wallet.currency[0]}
                  </div>
                  <div>
                    <div className="font-bold text-white">{wallet.currency}</div>
                    <div className="text-xs" style={{ color: '#94a3b8' }}>{CRYPTO_NAMES[wallet.currency] || wallet.currency}</div>
                  </div>
                </div>
                <div className="text-sm px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Actif</div>
              </div>
              <div className="mb-4">
                <div className="text-2xl font-black text-white font-mono">{formatCrypto(wallet.balance || 0, wallet.currency)}</div>
                <div className="text-sm mt-1" style={{ color: '#94a3b8' }}>{formatCurrency(wallet.valueXOF || 0)}</div>
                <div className="text-xs" style={{ color: '#64748b' }}>≈ ${(wallet.valueUSD || 0).toFixed(2)}</div>
              </div>
              {selectedWallet?.id === wallet.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-xs font-mono mb-3 p-2 rounded-lg break-all" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                    {wallet.address || 'Adresse non disponible'}
                  </div>
                  <div className="flex gap-2">
                    <Link href="/dashboard/deposit" className="btn-secondary flex-1 text-sm py-2 justify-center" style={{ display: 'flex' }}>
                      <Download className="w-4 h-4" /> Déposer
                    </Link>
                    <Link href="/dashboard/withdraw" className="btn-secondary flex-1 text-sm py-2 justify-center" style={{ display: 'flex' }}>
                      <Send className="w-4 h-4" /> Retirer
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4" style={{ color: '#334155' }} />
          <h3 className="text-xl font-bold text-white mb-2">Aucun portefeuille</h3>
          <p style={{ color: '#94a3b8' }}>Vos portefeuilles apparaîtront ici.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
