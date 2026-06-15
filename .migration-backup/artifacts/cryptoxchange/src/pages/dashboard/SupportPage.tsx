import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supportAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Send, ChevronRight, MessageSquare, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Dépôt', 'Retrait', 'Achat/Vente', 'Swap', 'KYC', 'Sécurité', 'Autre'];
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Haute', URGENT: 'Urgente' };
const STATUS_STYLES: Record<string, any> = {
  OPEN: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Ouvert' },
  PENDING: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'En attente' },
  CLOSED: { bg: 'rgba(100,116,139,0.15)', color: '#64748b', label: 'Fermé' },
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'Autre', message: '', priority: 'MEDIUM' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supportAPI.getTickets().then(r => setTickets(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTicket.subject || !newTicket.message) { toast.error('Remplissez tous les champs'); return; }
    setCreating(true);
    try {
      const r = await supportAPI.createTicket(newTicket);
      setTickets(t => [r.data?.data, ...t]);
      setShowNew(false);
      setNewTicket({ subject: '', category: 'Autre', message: '', priority: 'MEDIUM' });
      toast.success('Ticket créé !');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally { setCreating(false); }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await supportAPI.reply(selectedTicket.id, reply);
      setReply('');
      toast.success('Message envoyé !');
    } catch (e: any) {
      toast.error('Erreur lors de l\'envoi');
    } finally { setSending(false); }
  };

  return (
    <DashboardLayout title="Support">
      <div className="flex gap-6">
        {/* Ticket List */}
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Mes Tickets</h2>
            <button onClick={() => setShowNew(true)} className="btn-primary py-2 px-4 text-sm">
              <Plus className="w-4 h-4" /> Nouveau
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)
            ) : tickets.length ? (
              tickets.map(ticket => {
                const st = STATUS_STYLES[ticket.status] || STATUS_STYLES.OPEN;
                return (
                  <div key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                    className="glass-card-hover p-4 cursor-pointer" style={{ border: selectedTicket?.id === ticket.id ? '1px solid rgba(245,158,11,0.4)' : undefined }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-white text-sm truncate">{ticket.subject}</div>
                      <span className="badge shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{ticket.category} · {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                );
              })
            ) : (
              <div className="glass-card p-8 text-center" style={{ color: '#94a3b8' }}>
                <MessageSquare className="w-10 h-10 mx-auto mb-2" style={{ color: '#334155' }} />
                Aucun ticket
              </div>
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        {selectedTicket ? (
          <div className="flex-1 glass-card p-6 flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedTicket.subject}</h3>
                <div className="text-sm" style={{ color: '#94a3b8' }}>{selectedTicket.category} · Priorité {PRIORITY_LABELS[selectedTicket.priority]}</div>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              {selectedTicket.messages?.map((msg: any, i: number) => (
                <div key={i} className={`flex ${msg.isStaff ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-xs p-3 rounded-2xl text-sm" style={{ backgroundColor: msg.isStaff ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: 'white', borderRadius: msg.isStaff ? '4px 16px 16px 16px' : '16px 4px 16px 16px' }}>
                    {msg.message}
                    <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              )) || <p style={{ color: '#94a3b8' }}>{selectedTicket.message}</p>}
            </div>
            <div className="flex gap-3">
              <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                placeholder="Tapez votre message..." className="input-field flex-1" />
              <button onClick={handleReply} disabled={!reply.trim() || sending} className="btn-primary py-3 px-4">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 glass-card flex items-center justify-center" style={{ color: '#334155' }}>
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4" />
              <p>Sélectionnez un ticket ou créez-en un nouveau</p>
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Nouveau ticket</h3>
                <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X className="w-5 h-5" /></button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Sujet</label>
                <input value={newTicket.subject} onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))} placeholder="Décrivez brièvement le problème" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Catégorie</label>
                  <select value={newTicket.category} onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))} className="input-field" style={{ background: '#1e293b' }}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Priorité</label>
                  <select value={newTicket.priority} onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value }))} className="input-field" style={{ background: '#1e293b' }}>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Message</label>
                <textarea value={newTicket.message} onChange={e => setNewTicket(p => ({ ...p, message: e.target.value }))} rows={4} placeholder="Décrivez votre problème en détail..." className="input-field resize-none" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowNew(false)} className="btn-ghost">Annuler</button>
                <button onClick={handleCreate} disabled={creating} className="btn-primary">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : 'Créer le ticket'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
