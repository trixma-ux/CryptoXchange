import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usersAPI, kycAPI, authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { User, Lock, Shield, Upload, CheckCircle, Clock, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const KYC_STATUS_MAP: Record<string, { icon: any; color: string; label: string; desc: string }> = {
  PENDING: { icon: Clock, color: '#f59e0b', label: 'En attente', desc: 'Vos documents n\'ont pas encore été soumis.' },
  SUBMITTED: { icon: Clock, color: '#3b82f6', label: 'En cours de vérification', desc: 'Vos documents sont en cours d\'examen par notre équipe.' },
  APPROVED: { icon: CheckCircle, color: '#10b981', label: 'Vérifié ✓', desc: 'Votre identité a été vérifiée avec succès.' },
  REJECTED: { icon: XCircle, color: '#ef4444', label: 'Rejeté', desc: 'Vos documents ont été rejetés. Veuillez les soumettre à nouveau.' },
};

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<'profile' | 'security' | 'kyc'>('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycType, setKycType] = useState('NATIONAL_ID');
  const [kycUploading, setKycUploading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const r = await usersAPI.updateProfile(profileForm);
      updateUser(r.data?.data);
      toast.success('Profil mis à jour !');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally { setLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      await usersAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Mot de passe changé !');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally { setLoading(false); }
  };

  const handleKycUpload = async () => {
    if (!kycFile) { toast.error('Sélectionnez un fichier'); return; }
    setKycUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', kycFile);
      fd.append('type', kycType);
      await kycAPI.uploadDocument(fd);
      toast.success('Document soumis avec succès !');
      setKycFile(null);
      updateUser({ kycStatus: 'SUBMITTED' });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors du téléversement');
    } finally { setKycUploading(false); }
  };

  const kycStatus = KYC_STATUS_MAP[user?.kycStatus || 'PENDING'];

  const TABS = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'kyc', label: 'Vérification KYC', icon: Shield },
  ];

  return (
    <DashboardLayout title="Profil & Sécurité">
      <div className="max-w-3xl mx-auto">
        {/* Avatar Header */}
        <div className="glass-card p-6 mb-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
            <div style={{ color: '#94a3b8' }}>@{user?.username}</div>
            <div className="mt-1">
              <span className="badge" style={{ backgroundColor: kycStatus?.bg || 'rgba(245,158,11,0.15)', color: kycStatus?.color || '#f59e0b' }}>
                {kycStatus?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card p-1 flex rounded-2xl mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as any)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: tab === id ? 'rgba(245,158,11,0.15)' : 'transparent', color: tab === id ? '#fbbf24' : '#94a3b8', border: `1px solid ${tab === id ? 'rgba(245,158,11,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-bold text-white">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Prénom</label>
                <input value={profileForm.firstName} onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Nom</label>
                <input value={profileForm.lastName} onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Nom d'utilisateur</label>
              <input value={profileForm.username} onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Email</label>
              <input value={user?.email || ''} disabled className="input-field" style={{ opacity: 0.6 }} />
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>L'email ne peut pas être modifié</p>
            </div>
            <button onClick={handleProfileSave} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</> : 'Sauvegarder'}
            </button>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-bold text-white">Changer le mot de passe</h3>
            {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>
                  {i === 0 ? 'Mot de passe actuel' : i === 1 ? 'Nouveau mot de passe' : 'Confirmer le nouveau mot de passe'}
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={passwordForm[field as keyof typeof passwordForm]}
                    onChange={e => setPasswordForm(p => ({ ...p, [field]: e.target.value }))} className="input-field pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
            <button onClick={handlePasswordChange} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Modification...</> : 'Changer le mot de passe'}
            </button>

            <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-lg font-bold text-white mb-4">Authentification 2 facteurs (2FA)</h3>
              <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="font-medium text-white">Google Authenticator</div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>{user?.twoFactorEnabled ? 'Activé ✓' : 'Non activé'}</div>
                </div>
                <button className="btn-secondary text-sm py-2 px-4">
                  {user?.twoFactorEnabled ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'kyc' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-bold text-white">Vérification d'identité (KYC)</h3>
            {/* Status Banner */}
            <div className="p-5 rounded-xl flex items-center gap-4" style={{ backgroundColor: `${kycStatus?.color}15`, border: `1px solid ${kycStatus?.color}30` }}>
              <kycStatus.icon className="w-8 h-8 shrink-0" style={{ color: kycStatus?.color }} />
              <div>
                <div className="font-bold text-white">{kycStatus?.label}</div>
                <div className="text-sm" style={{ color: '#94a3b8' }}>{kycStatus?.desc}</div>
              </div>
            </div>

            {user?.kycStatus !== 'APPROVED' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#cbd5e1' }}>Type de document</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'NATIONAL_ID', label: 'CNI' },
                      { id: 'PASSPORT', label: 'Passeport' },
                      { id: 'DRIVERS_LICENSE', label: 'Permis' },
                    ].map(({ id, label }) => (
                      <button key={id} onClick={() => setKycType(id)}
                        className="py-3 rounded-xl text-sm font-medium transition-all"
                        style={{ background: kycType === id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${kycType === id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: kycType === id ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Téléverser le document</label>
                  <div
                    className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                    style={{ borderColor: kycFile ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)', backgroundColor: kycFile ? 'rgba(245,158,11,0.05)' : 'transparent' }}
                    onClick={() => document.getElementById('kyc-file')?.click()}
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: kycFile ? '#fbbf24' : '#334155' }} />
                    {kycFile ? (
                      <div className="font-medium" style={{ color: '#fbbf24' }}>{kycFile.name}</div>
                    ) : (
                      <>
                        <div className="font-medium text-white mb-1">Glissez un fichier ou cliquez</div>
                        <div className="text-sm" style={{ color: '#94a3b8' }}>JPG, PNG ou PDF — Max 5 Mo</div>
                      </>
                    )}
                    <input id="kyc-file" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setKycFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </div>
                </div>
                <button onClick={handleKycUpload} disabled={!kycFile || kycUploading} className="btn-primary w-full py-4">
                  {kycUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</> : 'Soumettre le document'}
                </button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
