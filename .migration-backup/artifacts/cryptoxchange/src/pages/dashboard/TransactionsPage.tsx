import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, Download, ArrowDownLeft, ArrowUpRight, Repeat, ShoppingCart } from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  DEPOSIT: { icon: ArrowDownLeft, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  WITHDRAWAL: { icon: ArrowUpRight, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  SWAP: { icon: Repeat, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  BUY: { icon: ShoppingCart, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  SELL: { icon: ArrowUpRight, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
};

const TYPE_LABELS: Record<string, string> = { DEPOSIT: 'Dépôt', WITHDRAWAL: 'Retrait', SWAP: 'Échange', BUY: 'Achat', SELL: 'Vente' };
const STATUS_STYLES: Record<string, any> = {
  COMPLETED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Complété' },
  PENDING: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'En attente' },
  FAILED: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Échoué' },
  PROCESSING: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'En cours' },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    const params: any = { page, limit };
    if (typeFilter !== 'ALL') params.type = typeFilter;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    transactionsAPI.getAll(params).then(r => {
      setTransactions(r.data?.data?.transactions || []);
      setTotal(r.data?.data?.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, typeFilter, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout title="Historique des Transactions">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Historique des Transactions</h2>
          <p style={{ color: '#94a3b8' }}>{total} transaction(s) au total</p>
        </div>
        <button className="btn-secondary text-sm py-2 px-4">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748b' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field pl-9 py-2 text-sm" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field py-2 text-sm w-auto" style={{ background: '#1e293b' }}>
          <option value="ALL">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2 text-sm w-auto" style={{ background: '#1e293b' }}>
          <option value="ALL">Tous les statuts</option>
          {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : transactions.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Crypto</th>
                    <th>Montant</th>
                    <th>Valeur FCFA</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any, i: number) => {
                    const typeInfo = TYPE_ICONS[tx.type] || TYPE_ICONS.DEPOSIT;
                    const statusInfo = STATUS_STYLES[tx.status] || STATUS_STYLES.PENDING;
                    return (
                      <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: typeInfo.bg }}>
                              <typeInfo.icon className="w-4 h-4" style={{ color: typeInfo.color }} />
                            </div>
                            <span className="font-medium" style={{ color: typeInfo.color }}>{TYPE_LABELS[tx.type] || tx.type}</span>
                          </div>
                        </td>
                        <td><span className="font-bold font-mono text-white">{tx.currency}</span></td>
                        <td><span className="font-mono" style={{ color: tx.type === 'DEPOSIT' || tx.type === 'BUY' ? '#10b981' : '#ef4444' }}>
                          {tx.type === 'DEPOSIT' || tx.type === 'BUY' ? '+' : '-'}{tx.amount}
                        </span></td>
                        <td><span className="font-mono text-white">{formatCurrency(tx.amountXOF || 0)}</span></td>
                        <td>
                          <span className="badge" style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ color: '#94a3b8' }}>{new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <button className="text-xs px-3 py-1 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
                            Détails
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm" style={{ color: '#94a3b8' }}>Page {page} sur {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-2 px-3 text-sm" style={{ opacity: page === 1 ? 0.5 : 1 }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost py-2 px-3 text-sm" style={{ opacity: page === totalPages ? 0.5 : 1 }}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-16 text-center">
            <Repeat className="w-16 h-16 mx-auto mb-4" style={{ color: '#334155' }} />
            <h3 className="text-xl font-bold text-white mb-2">Aucune transaction</h3>
            <p style={{ color: '#94a3b8' }}>Vos transactions apparaîtront ici.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
