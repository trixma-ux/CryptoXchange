'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, CreditCard, ChevronRight, TrendingUp, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';
import { walletsAPI, transactionsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils'; // We'll create this util

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portRes, txRes] = await Promise.all([
          walletsAPI.getPortfolio(),
          transactionsAPI.getAll({ limit: 5 })
        ]);
        setPortfolio(portRes.data.data);
        setTransactions(txRes.data.data.transactions);
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="spinner w-10 h-10 border-4"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="section-title">Vue d'ensemble</h1>

      {/* ===== Top Stats ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-500/20 rounded-full blur-2xl"></div>
          <div className="text-dark-400 font-medium mb-1 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Solde Total Estimé
          </div>
          <div className="text-3xl font-black text-white">
            {formatCurrency(portfolio?.totalFCFA || 0, 'XOF')}
          </div>
          <div className="text-sm text-dark-400 mt-2">
            ≈ ${(portfolio?.totalUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col justify-center">
          <div className="text-dark-400 font-medium mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Actions Rapides
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/deposit" className="btn-secondary py-2 text-sm">Déposer</Link>
            <Link href="/dashboard/withdraw" className="btn-secondary py-2 text-sm">Retirer</Link>
            <Link href="/dashboard/buy-sell" className="btn-primary py-2 text-sm col-span-2">Acheter des Cryptos</Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="text-dark-400 font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Vos Actifs
          </div>
          <div className="space-y-3">
            {portfolio?.portfolioItems?.slice(0, 3).map((item: any) => (
              <div key={item.currency} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center font-bold text-xs">
                    {item.currency.substring(0, 3)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.currency}</div>
                    <div className="text-xs text-dark-400">{item.balance}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{formatCurrency(item.valueFCFA, 'XOF')}</div>
                </div>
              </div>
            ))}
            {portfolio?.portfolioItems?.length === 0 && (
              <div className="text-center text-dark-400 text-sm py-4">Aucun actif</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ===== Recent Transactions ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Transactions Récentes</h2>
          <Link href="/dashboard/transactions" className="text-sm text-brand-400 hover:text-brand-300 flex items-center">
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type.includes('DEPOSIT') || tx.type.includes('BUY') ? 'bg-success/20 text-success' : 
                        tx.type.includes('WITHDRAWAL') || tx.type.includes('SELL') ? 'bg-danger/20 text-danger' : 
                        'bg-info/20 text-info'
                      }`}>
                        {tx.type.includes('DEPOSIT') || tx.type.includes('BUY') ? <ArrowDownRight className="w-4 h-4" /> : 
                         tx.type.includes('WITHDRAWAL') || tx.type.includes('SELL') ? <ArrowUpRight className="w-4 h-4" /> : 
                         <Repeat className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {tx.type === 'DEPOSIT_FIAT' ? 'Dépôt Mobile Money' :
                           tx.type === 'WITHDRAWAL_FIAT' ? 'Retrait Mobile Money' :
                           tx.type === 'DEPOSIT_CRYPTO' ? 'Dépôt Crypto' :
                           tx.type === 'WITHDRAWAL_CRYPTO' ? 'Retrait Crypto' :
                           tx.type === 'TRADE_BUY' ? 'Achat' :
                           tx.type === 'TRADE_SELL' ? 'Vente' : 'Swap'}
                        </div>
                        <div className="text-xs text-dark-400">{tx.currency}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-medium">
                    {tx.fiatAmount ? formatCurrency(parseFloat(tx.fiatAmount), tx.fiatCurrency || 'XOF') : `${tx.amount} ${tx.currency}`}
                  </td>
                  <td>
                    <span className={`badge ${
                      tx.status === 'COMPLETED' ? 'badge-success' :
                      tx.status === 'PENDING' || tx.status === 'PROCESSING' || tx.status === 'REQUIRES_APPROVAL' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {tx.status === 'COMPLETED' ? 'Terminé' :
                       tx.status === 'PENDING' || tx.status === 'PROCESSING' ? 'En cours' :
                       tx.status === 'REQUIRES_APPROVAL' ? 'En attente validation' :
                       'Échoué'}
                    </span>
                  </td>
                  <td className="text-dark-300">
                    {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-dark-400">Aucune transaction récente</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
