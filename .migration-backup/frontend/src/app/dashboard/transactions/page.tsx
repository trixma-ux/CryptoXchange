'use client';

import { useState, useEffect } from 'react';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency, formatCrypto } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Repeat, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  const fetchTransactions = async (pageToFetch: number) => {
    setLoading(true);
    try {
      const res = await transactionsAPI.getAll({ page: pageToFetch, limit: 15 });
      setTransactions(res.data.data.transactions);
      setTotalPages(res.data.data.totalPages);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const getTxIcon = (type: string) => {
    if (type.includes('DEPOSIT') || type.includes('BUY')) return <ArrowDownRight className="w-4 h-4" />;
    if (type.includes('WITHDRAWAL') || type.includes('SELL')) return <ArrowUpRight className="w-4 h-4" />;
    return <Repeat className="w-4 h-4" />;
  };

  const getTxColor = (type: string) => {
    if (type.includes('DEPOSIT') || type.includes('BUY')) return 'bg-success/20 text-success';
    if (type.includes('WITHDRAWAL') || type.includes('SELL')) return 'bg-danger/20 text-danger';
    return 'bg-info/20 text-info';
  };

  const getTxLabel = (type: string) => {
    const labels: any = {
      DEPOSIT_FIAT: 'Dépôt Mobile Money',
      WITHDRAWAL_FIAT: 'Retrait Mobile Money',
      DEPOSIT_CRYPTO: 'Dépôt Crypto',
      WITHDRAWAL_CRYPTO: 'Retrait Crypto',
      TRADE_BUY: 'Achat Crypto',
      TRADE_SELL: 'Vente Crypto',
      SWAP: 'Échange (Swap)',
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="section-title mb-0">Historique des Transactions</h1>
        <div className="flex gap-2">
          <button className="btn-secondary px-4 py-2"><Filter className="w-4 h-4" /> Filtrer</button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input type="text" placeholder="Rechercher..." className="input-field pl-9 py-2" />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><div className="spinner"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Montant Net</th>
                  <th>Frais</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTxColor(tx.type)}`}>
                          {getTxIcon(tx.type)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{getTxLabel(tx.type)}</div>
                          <div className="text-xs text-dark-400">{tx.currency} {tx.fiatCurrency ? `/ ${tx.fiatCurrency}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-white">
                        {tx.fiatAmount ? formatCurrency(parseFloat(tx.fiatAmount), tx.fiatCurrency) : formatCrypto(tx.netAmount, tx.currency)}
                      </div>
                      {!tx.fiatAmount && tx.exchangeRate && (
                         <div className="text-xs text-dark-400">≈ {formatCurrency(tx.netAmount * tx.exchangeRate * 605, 'XOF')}</div>
                      )}
                    </td>
                    <td>
                      <span className="text-dark-300 text-sm">
                         {tx.fiatAmount ? formatCurrency(parseFloat(tx.fee) * (tx.fiatCurrency === 'XOF' ? 605 : 1), tx.fiatCurrency) : formatCrypto(tx.fee, tx.currency)}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm text-dark-200">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-dark-400">
                        {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        tx.status === 'COMPLETED' ? 'badge-success' :
                        tx.status === 'PENDING' || tx.status === 'PROCESSING' || tx.status === 'REQUIRES_APPROVAL' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {tx.status === 'COMPLETED' ? 'Terminé' :
                         tx.status === 'PENDING' || tx.status === 'PROCESSING' ? 'En cours' :
                         tx.status === 'REQUIRES_APPROVAL' ? 'Attente validation' : 'Échoué'}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-dark-400">Aucune transaction trouvée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex justify-center gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="btn-secondary px-4 py-2 disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="flex items-center px-4 text-sm font-medium text-dark-300">Page {page} sur {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary px-4 py-2 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
