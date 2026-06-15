import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { kycAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, Clock, XCircle, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const DOC_TYPES = [
  { id: 'ID_CARD', label: "Carte d'identité nationale" },
  { id: 'PASSPORT', label: 'Passeport' },
  { id: 'DRIVERS_LICENSE', label: 'Permis de conduire' },
  { id: 'SELFIE', label: 'Selfie avec document' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:   { label: 'Non soumis',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: AlertCircle },
  SUBMITTED: { label: 'En cours de vérification', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  APPROVED:  { label: 'Vérifié ✓',   color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  REJECTED:  { label: 'Rejeté',       color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
};

export default function KycPage() {
  const [docType, setDocType] = useState('ID_CARD');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: kycData, refetch } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycAPI.getStatus().then(r => r.data?.data),
  });

  const kycStatus: string = kycData?.kycStatus || 'PENDING';
  const cfg = STATUS_CONFIG[kycStatus] || STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;

  const handleUpload = async () => {
    if (!file) { toast.error('Sélectionnez un fichier'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('document', file);
      form.append('documentType', docType);
      await kycAPI.uploadDocument(form);
      toast.success('Document soumis avec succès ! Vérification en cours.');
      setFile(null);
      refetch();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'upload');
    } finally { setUploading(false); }
  };

  return (
    <DashboardLayout title="Vérification KYC">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: cfg.bg }}>
              <Shield className="w-6 h-6" style={{ color: cfg.color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Vérification d'identité</h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Requis pour toutes les transactions</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
            <StatusIcon className="w-5 h-5" style={{ color: cfg.color }} />
            <div>
              <div className="font-semibold" style={{ color: cfg.color }}>Statut : {cfg.label}</div>
              {kycStatus === 'SUBMITTED' && (
                <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Délai moyen : 24–48h ouvrées</div>
              )}
              {kycStatus === 'APPROVED' && (
                <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Votre identité est confirmée. Vous pouvez effectuer des transactions.</div>
              )}
            </div>
          </div>

          {kycStatus === 'APPROVED' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10b981' }} />
              <div className="text-xl font-bold text-white mb-2">KYC validé !</div>
              <div style={{ color: '#94a3b8' }}>Vous êtes autorisé à effectuer des achats, ventes et retraits.</div>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 rounded-xl text-sm space-y-2" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="font-semibold mb-2" style={{ color: '#a5b4fc' }}>📋 Documents acceptés</div>
                {DOC_TYPES.map(d => (
                  <div key={d.id} className="flex items-center gap-2" style={{ color: '#94a3b8' }}>
                    <FileText className="w-3 h-3" /> {d.label}
                  </div>
                ))}
              </div>

              {(kycStatus === 'PENDING' || kycStatus === 'REJECTED') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: '#cbd5e1' }}>Type de document</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DOC_TYPES.map(d => (
                        <button key={d.id} onClick={() => setDocType(d.id)}
                          className="py-2 px-3 rounded-xl text-sm font-medium text-left transition-all"
                          style={{ background: docType === d.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${docType === d.id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: docType === d.id ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Fichier (JPG, PNG ou PDF)</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl cursor-pointer transition-all"
                      style={{ background: file ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `2px dashed ${file ? '#10b981' : 'rgba(255,255,255,0.1)'}` }}>
                      <Upload className="w-6 h-6 mb-2" style={{ color: file ? '#10b981' : '#94a3b8' }} />
                      <span className="text-sm" style={{ color: file ? '#10b981' : '#94a3b8' }}>
                        {file ? file.name : 'Cliquez pour sélectionner'}
                      </span>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>

                  <button onClick={handleUpload} disabled={!file || uploading} className="btn-primary w-full py-4">
                    {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...</> : 'Soumettre le document'}
                  </button>
                </div>
              )}

              {kycStatus === 'SUBMITTED' && (
                <div className="text-center py-6" style={{ color: '#94a3b8' }}>
                  <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: '#f59e0b' }} />
                  <div className="font-semibold text-white mb-1">Document en cours de vérification</div>
                  <div className="text-sm">Vous recevrez une notification dès que votre identité sera confirmée.</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
