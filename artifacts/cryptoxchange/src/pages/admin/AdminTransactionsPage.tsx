import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Users, CheckCircle, XCircle, Shield, Bitcoin, LayoutDashboard, TrendingUp, UserCheck, DollarSign, LifeBuoy, LogOut, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [pathname] = useLocation();
  const { logout, user } = useAuthStore();
  const NAV = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/transactions', label: 'Transactions', icon: TrendingUp },
    { href: '/admin/kyc', label: 'KYC', icon: UserCheck },
    { href: '/admin/fees', label: 'Commissions', icon: DollarSign },
    { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  ];
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080d1a' }}>
      <aside className="fixed hidden md:flex flex-col w-64 h-screen z-40" style={{ backgroundColor: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="h-16 flex items-center px-6 gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><Bitcoin className="w-5 h-5 text-black" /></div>
          <div><div className="font-black text-white text-sm">CryptoXchange</div><div className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>ADMIN</div></div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link ${pathname === href ? 'active' : ''}`}><Icon className="w-5 h-5" /> {label}</Link>
          ))}
          <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Link href="/dashboard" className="nav-link"><ArrowDownLeft className="w-5 h-5" /> Retour utilisateur</Link>
          </div>
        </div>
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => { logout(); window.location.href = '/auth/login'; }} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6" style={{ backgroundColor: 'rgba(8,13,26,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
          <h1 className="text-lg font-bold text-white">{title}</h1>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Shield className="w-4 h-4" style={{ color: '#fbbf24' }} /><span className="text-sm font-semibold" style={{ color: '#fbbf24' }}>{user?.firstName} — Admin</span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, any> = {
  COMPLETED: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Complété' },
  PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'En attente' },
  REQUIRES_APPROVAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'À approuver' },
  PROCESSING: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'En cours' },
  FAILED: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Échoué' },
};

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT_FIAT: 'Dépôt',
  WITHDRAWAL_FIAT: 'Retrait',
  TRADE_BUY: 'Achat',
  TRADE_SELL: 'Vente',
  SWAP: 'Swap',
  FEE: 'Commission',
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [processing, setProcessing] = useState('');
  const limit = 15;

  useEffect(() => {
    setLoading(true);
    const params: any = { page, limit };
    if (typeFilter !== 'ALL') params.type = typeFilter;
    adminAPI.getTransactions(params).then(r => {
      setTransactions(r.data?.data?.transactions || []);
      setTotal(r.data?.data?.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, typeFilter]);

  const handleReviewWithdrawal = async (txId: string, action: 'approve' | 'reject') => {
    setProcessing(txId);
    try {
      await adminAPI.reviewWithdrawal(txId, { action });
      setTransactions(t => t.map(tx => tx.id === txId ? { ...tx, status: action === 'approve' ? 'COMPLETED' : 'FAILED' } : tx));
      toast.success(action === 'approve' ? 'Retrait approuvé !' : 'Retrait rejeté');
    } catch { toast.error('Erreur'); } finally { setProcessing(''); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout title="Transactions">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Transactions</h2>
          <p style={{ color: '#94a3b8' }}>{total} transaction(s)</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { val: 'ALL', label: 'Tout' },
          { val: 'DEPOSIT_FIAT', label: 'Dépôts' },
          { val: 'WITHDRAWAL_FIAT', label: 'Retraits' },
          { val: 'TRADE_BUY', label: 'Achats' },
          { val: 'TRADE_SELL', label: 'Ventes' },
          { val: 'SWAP', label: 'Swaps' },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => { setTypeFilter(val); setPage(1); }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: typeFilter === val ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${typeFilter === val ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: typeFilter === val ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>FCFA</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any, i) => {
                    const st = STATUS_STYLES[tx.status] || STATUS_STYLES.PENDING;
                    return (
                      <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                        <td>
                          <div className="font-medium text-white">{tx.user?.firstName} {tx.user?.lastName}</div>
                          <div className="text-xs" style={{ color: '#94a3b8' }}>{tx.user?.email}</div>
                        </td>
                        <td>
                          <span className="font-semibold" style={{ color: (tx.type === 'DEPOSIT_FIAT' || tx.type === 'TRADE_BUY') ? '#10b981' : '#ef4444' }}>
                            {TYPE_LABELS[tx.type] || tx.type}
                          </span>
                        </td>
                        <td className="font-mono text-white">{tx.amount} {tx.currency}</td>
                        <td className="font-mono text-white">{formatCurrency(parseFloat(tx.fiatAmount || '0'))}</td>
                        <td><span className="badge" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span></td>
                        <td style={{ color: '#94a3b8' }}>{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td>
                          {tx.type === 'WITHDRAWAL_FIAT' && tx.status === 'REQUIRES_APPROVAL' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleReviewWithdrawal(tx.id, 'approve')} disabled={processing === tx.id}
                                className="p-1.5 rounded-lg transition-colors" style={{ background: 'rgba(16,185,129,0.15)', border: 'none', cursor: 'pointer', color: '#10b981' }}>
                                {processing === tx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => handleReviewWithdrawal(tx.id, 'reject')} disabled={processing === tx.id}
                                className="p-1.5 rounded-lg transition-colors" style={{ background: 'rgba(239,68,68,0.15)', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm" style={{ color: '#94a3b8' }}>Page {page}/{totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-2 px-3" style={{ opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost py-2 px-3" style={{ opacity: page === totalPages ? 0.5 : 1 }}><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
