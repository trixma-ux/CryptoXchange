'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { kycAPI, authAPI, usersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, Camera, Upload, CheckCircle, ShieldAlert, Lock, User } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    fetchProfile();
    fetchKycStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await usersAPI.getProfile();
      setProfileData({
        firstName: res.data.data.firstName || '',
        lastName: res.data.data.lastName || '',
        phone: res.data.data.phone || '',
      });
    } catch (e) {
      //
    }
  };

  const fetchKycStatus = async () => {
    try {
      const res = await kycAPI.getStatus();
      setKycStatus(res.data.data.kycStatus);
    } catch (e) {
      //
    }
  };

  const handleKycUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);

    setUploading(true);
    try {
      await kycAPI.uploadDocument(formData);
      toast.success('Document soumis avec succès !');
      fetchKycStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await usersAPI.updateProfile(profileData);
      updateUser(res.data.data);
      toast.success('Profil mis à jour');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de mise à jour');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="section-title">Profil & Sécurité</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KYC Section */}
        <div className="glass-card p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-brand-500" /> Vérification (KYC)</h2>
            <span className={`badge ${
              kycStatus === 'APPROVED' ? 'badge-success' :
              kycStatus === 'PENDING' ? 'badge-warning' :
              kycStatus === 'REJECTED' ? 'badge-danger' : 'badge-gray'
            }`}>
              {kycStatus === 'APPROVED' ? 'Vérifié' :
               kycStatus === 'PENDING' ? 'En attente' :
               kycStatus === 'REJECTED' ? 'Rejeté' : 'Non soumis'}
            </span>
          </div>

          <p className="text-dark-300 text-sm mb-6">
             La vérification d'identité est obligatoire pour trader et effectuer des retraits selon les lois anti-blanchiment d'argent.
          </p>

          {kycStatus === 'APPROVED' ? (
            <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center text-success flex flex-col items-center flex-1 justify-center">
              <CheckCircle className="w-12 h-12 mb-3" />
              <div className="font-bold text-lg">Identité vérifiée</div>
              <p className="text-sm mt-2">Votre compte n'a aucune limite. Vous pouvez utiliser toutes les fonctionnalités de la plateforme.</p>
            </div>
          ) : kycStatus === 'PENDING' ? (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-6 text-center text-warning flex flex-col items-center flex-1 justify-center">
              <div className="spinner border-warning mb-3"></div>
              <div className="font-bold text-lg">Documents en cours d'examen</div>
              <p className="text-sm mt-2 text-warning/80">Veuillez patienter pendant que notre équipe vérifie vos documents (généralement moins de 24h).</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              <div className="border border-white/10 rounded-xl p-4 hover:border-brand-500/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-dark-300" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold mb-1">Pièce d'identité officielle</div>
                    <p className="text-xs text-dark-400 mb-3">Passeport, CNI ou Permis de conduire (recto-verso).</p>
                    <label className="btn-secondary w-full py-2 text-sm cursor-pointer relative overflow-hidden flex justify-center">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,.pdf" onChange={(e) => handleKycUpload(e, 'NATIONAL_ID')} disabled={uploading} />
                      <Upload className="w-4 h-4 mr-2" /> Uploader le document
                    </label>
                  </div>
                </div>
              </div>

              <div className="border border-white/10 rounded-xl p-4 hover:border-brand-500/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-dark-300" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold mb-1">Selfie avec le document</div>
                    <p className="text-xs text-dark-400 mb-3">Prenez un selfie en tenant votre document près du visage.</p>
                    <label className="btn-secondary w-full py-2 text-sm cursor-pointer relative overflow-hidden flex justify-center">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleKycUpload(e, 'SELFIE')} disabled={uploading} />
                      <Camera className="w-4 h-4 mr-2" /> Prendre un selfie
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="space-y-6">
          <div className="glass-card p-6">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="w-5 h-5 text-brand-500" /> Informations Personnelles</h2>
             <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Prénom</label>
                    <input type="text" value={profileData.firstName} onChange={e => setProfileData({...profileData, firstName: e.target.value})} className="input-field py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark-300 mb-1">Nom</label>
                    <input type="text" value={profileData.lastName} onChange={e => setProfileData({...profileData, lastName: e.target.value})} className="input-field py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Téléphone</label>
                  <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="input-field py-2" />
                </div>
                <button type="submit" className="btn-primary py-2 px-6 w-full mt-2 text-sm">Sauvegarder les modifications</button>
             </form>
          </div>

          {/* Security */}
          <div className="glass-card p-6">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-brand-500" /> Sécurité</h2>
             <div className="space-y-4">
               <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-dark-900">
                 <div>
                   <div className="font-bold">Authentification à deux facteurs (2FA)</div>
                   <div className="text-sm text-dark-400">Ajoute une couche de sécurité supplémentaire.</div>
                 </div>
                 <button className="btn-secondary px-4 py-2 text-sm">
                   {user?.twoFactorEnabled ? 'Désactiver' : 'Activer'}
                 </button>
               </div>
               
               <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-dark-900">
                 <div>
                   <div className="font-bold">Changer de mot de passe</div>
                   <div className="text-sm text-dark-400">Mettez à jour votre mot de passe régulièrement.</div>
                 </div>
                 <button className="btn-secondary px-4 py-2 text-sm">Modifier</button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
