import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { adminAPI } from '@/lib/api';
import { Users, Shield, Bitcoin, LayoutDashboard, TrendingUp, UserCheck, DollarSign, LifeBuoy, LogOut, ArrowDownLeft, Loader2, Save } from 'lucide-react';
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

const DEFAULT_FEES = [
  { type: 'BUY', label: 'Achat de crypto', value: '1.5', currency: '%' },
  { type: 'SELL', label: 'Vente de crypto', value: '1.5', currency: '%' },
  { type: 'SWAP', label: 'Échange crypto-crypto', value: '0.5', currency: '%' },
  { type: 'WITHDRAWAL_CRYPTO', label: 'Retrait crypto', value: '0.1', currency: '%' },
  { type: 'WITHDRAWAL_MOBILE', label: 'Retrait Mobile Money', value: '1.0', currency: '%' },
  { type: 'DEPOSIT_MOBILE', label: 'Dépôt Mobile Money', value: '0.0', currency: '%' },
  { type: 'MIN_DEPOSIT', label: 'Dépôt minimum', value: '1000', currency: 'FCFA' },
  { type: 'MIN_WITHDRAWAL', label: 'Retrait minimum', value: '1000', currency: 'FCFA' },
];

export default function AdminFeesPage() {
  const [fees, setFees] = useState(DEFAULT_FEES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    adminAPI.getFees().then(r => {
      const data = r.data?.data;
      if (data?.length) {
        setFees(DEFAULT_FEES.map(f => ({ ...f, value: String(data.find((d: any) => d.type === f.type)?.value ?? f.value) })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (fee: any) => {
    setSaving(fee.type);
    try {
      await adminAPI.updateFee({ type: fee.type, value: Number(fee.value) });
      toast.success(`Commission "${fee.label}" mise à jour !`);
    } catch (e: any) {
      toast.error('Erreur lors de la mise à jour');
    } finally { setSaving(''); }
  };

  const updateFee = (type: string, value: string) => {
    setFees(f => f.map(fee => fee.type === type ? { ...fee, value } : fee));
  };

  return (
    <AdminLayout title="Commissions & Frais">
      <div className="max-w-3xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Gestion des Commissions</h2>
          <p style={{ color: '#94a3b8' }}>Configurez les frais de transaction de la plateforme</p>
        </div>

        <div className="glass-card p-4 mb-6" style={{ backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-sm" style={{ color: '#fbbf24' }}>
            ⚠️ Les modifications de frais prennent effet immédiatement pour toutes les nouvelles transactions.
          </p>
        </div>

        <div className="space-y-3">
          {fees.map((fee) => (
            <div key={fee.type} className="glass-card p-5 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-semibold text-white">{fee.label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{fee.type}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="number"
                    value={fee.value}
                    onChange={e => updateFee(fee.type, e.target.value)}
                    className="input-field w-28 pr-16 text-right font-mono"
                    step="0.1"
                    min="0"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#94a3b8' }}>
                    {fee.currency}
                  </div>
                </div>
                <button onClick={() => handleSave(fee)} disabled={saving === fee.type} className="btn-primary py-2.5 px-4 text-sm">
                  {saving === fee.type ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Sauver
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
