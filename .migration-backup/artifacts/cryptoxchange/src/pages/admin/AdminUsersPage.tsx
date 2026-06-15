import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { adminAPI } from '@/lib/api';
import { Users, Search, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Shield, LayoutDashboard, TrendingUp, UserCheck, DollarSign, LifeBuoy, LogOut, ArrowDownLeft } from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';
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
          <PremiumLogo size={30} textSize={15} />
          <div className="text-xs px-1.5 py-0.5 rounded font-bold ml-1" style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>ADMIN</div>
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

const KYC_MAP: Record<string, any> = {
  APPROVED: { icon: CheckCircle, color: '#10b981', label: 'Vérifié' },
  PENDING: { icon: Clock, color: '#f59e0b', label: 'En attente' },
  SUBMITTED: { icon: Clock, color: '#3b82f6', label: 'Soumis' },
  REJECTED: { icon: XCircle, color: '#ef4444', label: 'Rejeté' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  useEffect(() => {
    setLoading(true);
    adminAPI.getUsers({ page, limit, search: search || undefined }).then(r => {
      setUsers(r.data?.data?.users || []);
      setTotal(r.data?.data?.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, search]);

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await adminAPI.updateUserStatus(userId, status);
      setUsers(u => u.map(user => user.id === userId ? { ...user, status } : user));
      toast.success(`Statut mis à jour`);
    } catch { toast.error('Erreur'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout title="Gestion des Utilisateurs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Utilisateurs</h2>
          <p style={{ color: '#94a3b8' }}>{total} utilisateurs au total</p>
        </div>
      </div>

      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748b' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher par nom, email..." className="input-field pl-9 py-2 text-sm" />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>KYC</th>
                  <th>Rôle</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any, i) => {
                  const kyc = KYC_MAP[u.kycStatus] || KYC_MAP.PENDING;
                  return (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{u.firstName} {u.lastName}</div>
                            <div className="text-xs" style={{ color: '#94a3b8' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{u.email}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: `${kyc.color}20`, color: kyc.color }}>
                          {kyc.label}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: u.role === 'ADMIN' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)', color: u.role === 'ADMIN' ? '#fbbf24' : '#94a3b8' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => handleStatusChange(u.id, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            className="text-xs px-3 py-1 rounded-lg transition-colors"
                            style={{ background: u.status === 'ACTIVE' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: u.status === 'ACTIVE' ? '#ef4444' : '#10b981', border: 'none', cursor: 'pointer' }}>
                            {u.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm" style={{ color: '#94a3b8' }}>Page {page}/{totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-2 px-3" style={{ opacity: page === 1 ? 0.5 : 1 }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost py-2 px-3" style={{ opacity: page === totalPages ? 0.5 : 1 }}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
