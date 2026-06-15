import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { adminAPI } from '@/lib/api';
import { Users, CheckCircle, XCircle, Clock, Shield, LayoutDashboard, TrendingUp, UserCheck, DollarSign, LifeBuoy, LogOut, ArrowDownLeft, Eye, Loader2 } from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function AdminKycPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('SUBMITTED');
  const [selected, setSelected] = useState<any>(null);
  const [processing, setProcessing] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminAPI.getKycRequests({ status: filter }).then(r => setRequests(r.data?.data?.documents || [])).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  const handleApprove = async (doc: any) => {
    setProcessing(doc.id);
    try {
      await adminAPI.reviewKyc(doc.id, { status: 'APPROVED' });
      setRequests(r => r.filter(d => d.id !== doc.id));
      setSelected(null);
      toast.success('Document approuvé !');
    } catch { toast.error('Erreur'); } finally { setProcessing(''); }
  };

  const handleReject = async () => {
    if (!selected || !rejectionReason) return;
    setProcessing(selected.id);
    try {
      await adminAPI.reviewKyc(selected.id, { status: 'REJECTED', rejectionReason });
      setRequests(r => r.filter(d => d.id !== selected.id));
      setSelected(null); setShowRejectModal(false); setRejectionReason('');
      toast.success('Document rejeté');
    } catch { toast.error('Erreur'); } finally { setProcessing(''); }
  };

  return (
    <AdminLayout title="Vérification KYC">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Demandes KYC</h2>
          <p style={{ color: '#94a3b8' }}>{requests.length} demande(s) {filter.toLowerCase()}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: filter === s ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${filter === s ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: filter === s ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
            {s === 'SUBMITTED' ? 'À vérifier' : s === 'APPROVED' ? 'Approuvés' : s === 'REJECTED' ? 'Rejetés' : 'En attente'}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {loading ? (
            Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)
          ) : requests.length ? (
            requests.map((doc: any) => (
              <div key={doc.id} onClick={() => setSelected(doc)}
                className="glass-card-hover p-5 cursor-pointer" style={{ border: selected?.id === doc.id ? '1px solid rgba(245,158,11,0.4)' : undefined }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                      {doc.user?.firstName?.[0]}{doc.user?.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{doc.user?.firstName} {doc.user?.lastName}</div>
                      <div className="text-xs" style={{ color: '#94a3b8' }}>{doc.documentType} · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  <Eye className="w-4 h-4" style={{ color: '#94a3b8' }} />
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-12 text-center" style={{ color: '#94a3b8' }}>
              <UserCheck className="w-12 h-12 mx-auto mb-3" style={{ color: '#334155' }} />
              Aucune demande {filter.toLowerCase()}
            </div>
          )}
        </div>

        {/* Detail */}
        {selected ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Document de {selected.user?.firstName} {selected.user?.lastName}</h3>
            <div className="space-y-3 mb-6">
              {[
                ['Type de document', selected.documentType],
                ['Email', selected.user?.email],
                ['Soumis le', new Date(selected.createdAt).toLocaleString('fr-FR')],
                ['Statut actuel', selected.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 text-sm" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#94a3b8' }}>{label}</span>
                  <span className="font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
            {selected.documentUrl && (
              <div className="mb-6">
                <div className="text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Document joint</div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-xs font-mono" style={{ color: '#94a3b8' }}>{selected.documentUrl}</div>
                </div>
              </div>
            )}
            {filter === 'SUBMITTED' && (
              <div className="flex gap-3">
                <button onClick={() => handleApprove(selected)} disabled={processing === selected.id}
                  className="btn-primary flex-1" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {processing === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approuver
                </button>
                <button onClick={() => setShowRejectModal(true)} className="btn-danger flex-1">
                  <XCircle className="w-4 h-4" /> Rejeter
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="glass-card flex items-center justify-center" style={{ color: '#334155' }}>
            <div className="text-center">
              <UserCheck className="w-16 h-16 mx-auto mb-3" />
              <p>Sélectionnez un document</p>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-bold text-white">Motif de rejet</h3>
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3} placeholder="Expliquez le motif du rejet..." className="input-field resize-none" />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowRejectModal(false)} className="btn-ghost">Annuler</button>
                <button onClick={handleReject} disabled={!rejectionReason} className="btn-danger">Confirmer le rejet</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
