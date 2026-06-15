import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Shield, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Bitcoin, LayoutDashboard, FileText, UserCheck, Settings, LifeBuoy, LogOut } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/transactions', label: 'Transactions', icon: TrendingUp },
  { href: '/admin/kyc', label: 'KYC', icon: UserCheck },
  { href: '/admin/fees', label: 'Commissions', icon: DollarSign },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
];

function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [pathname] = useLocation();
  const { logout, user } = useAuthStore();
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080d1a' }}>
      <aside className="fixed hidden md:flex flex-col w-64 h-screen z-40" style={{ backgroundColor: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="h-16 flex items-center px-6 gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Bitcoin className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="font-black text-white text-sm">CryptoXchange</div>
            <div className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>ADMIN</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link ${pathname === href ? 'active' : ''}`}>
              <Icon className="w-5 h-5" /> {label}
            </Link>
          ))}
          <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Link href="/dashboard" className="nav-link">
              <ArrowDownLeft className="w-5 h-5" /> Retour utilisateur
            </Link>
          </div>
        </div>
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => { logout(); window.location.href = '/auth/login'; }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium"
            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}>
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6" style={{ backgroundColor: 'rgba(8,13,26,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
          <h1 className="text-lg font-bold text-white">{title}</h1>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Shield className="w-4 h-4" style={{ color: '#fbbf24' }} />
            <span className="text-sm font-semibold" style={{ color: '#fbbf24' }}>{user?.firstName} — Admin</span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(r => setStats(r.data?.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: 'Utilisateurs total', value: stats?.totalUsers, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', sub: `+${stats?.newUsersToday || 0} aujourd'hui` },
    { label: 'Volume 24h', value: formatCurrency(stats?.volume24h || 0), icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.15)', sub: `+${(stats?.volumeChange || 0).toFixed(1)}%` },
    { label: 'Revenus totaux', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', sub: 'Commissions collectées' },
    { label: 'KYC en attente', value: stats?.pendingKyc, icon: UserCheck, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', sub: 'À traiter' },
  ];

  return (
    <AdminLayout title="Dashboard Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Tableau de bord Administration</h2>
        <p style={{ color: '#94a3b8' }}>Vue d'ensemble de la plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium" style={{ color: '#94a3b8' }}>{card.label}</div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {loading ? <div className="skeleton h-8 w-24 rounded" /> : (card.value ?? '—')}
            </div>
            <div className="text-xs" style={{ color: '#64748b' }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Dernières transactions</h3>
            <Link href="/admin/transactions" className="text-sm" style={{ color: '#fbbf24', textDecoration: 'none' }}>Tout voir →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : stats?.recentTransactions?.length ? (
            <div className="space-y-3">
              {stats.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tx.type === 'DEPOSIT' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                      {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4" style={{ color: '#10b981' }} /> : <ArrowUpRight className="w-4 h-4" style={{ color: '#ef4444' }} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{tx.user?.firstName} {tx.user?.lastName}</div>
                      <div className="text-xs" style={{ color: '#94a3b8' }}>{tx.type} · {tx.amount} {tx.currency}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{formatCurrency(tx.amountXOF || 0)}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: tx.status === 'COMPLETED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: tx.status === 'COMPLETED' ? '#10b981' : '#f59e0b' }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8" style={{ color: '#94a3b8' }}>Aucune transaction récente</div>}
        </div>

        {/* Pending Actions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Actions en attente</h3>
          <div className="space-y-3">
            {[
              { label: 'KYC à vérifier', count: stats?.pendingKyc || 0, href: '/admin/kyc', color: '#8b5cf6', icon: UserCheck },
              { label: 'Retraits à traiter', count: stats?.pendingWithdrawals || 0, href: '/admin/transactions', color: '#f59e0b', icon: ArrowUpRight },
              { label: 'Tickets ouverts', count: stats?.openTickets || 0, href: '/admin/support', color: '#3b82f6', icon: LifeBuoy },
            ].map(({ label, count, href, color, icon: Icon }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)'}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="font-medium text-white">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black" style={{ color }}>{loading ? '—' : count}</span>
                    <ArrowUpRight className="w-4 h-4" style={{ color: '#94a3b8' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
