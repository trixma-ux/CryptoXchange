'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Users, ArrowLeftRight, FileCheck, DollarSign } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getDashboard();
        setStats(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-20"><div className="spinner"></div></div>;
  }

  const statCards = [
    { title: 'Utilisateurs Totaux', value: stats?.users?.total || 0, icon: Users, color: 'text-brand-500' },
    { title: 'Volume Transactions', value: `$${(stats?.transactions?.volumeUSD || 0).toLocaleString()}`, icon: DollarSign, color: 'text-success' },
    { title: 'KYC en attente', value: stats?.kyc?.pending || 0, icon: FileCheck, color: 'text-warning' },
    { title: 'Transactions', value: stats?.transactions?.count || 0, icon: ArrowLeftRight, color: 'text-info' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Tableau de bord Administrateur</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-dark-900 p-6 rounded-xl border border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="text-dark-400 font-medium">{card.title}</div>
              <div className={`w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-dark-900 rounded-xl border border-white/5 p-6">
          <h2 className="font-bold text-lg mb-4">Derniers utilisateurs inscrits</h2>
          {/* To be implemented in a complete version */}
          <div className="text-dark-400 text-sm py-8 text-center">Module en cours de développement</div>
        </div>
        <div className="bg-dark-900 rounded-xl border border-white/5 p-6">
          <h2 className="font-bold text-lg mb-4">Dernières demandes de retrait</h2>
          {/* To be implemented in a complete version */}
          <div className="text-dark-400 text-sm py-8 text-center">Module en cours de développement</div>
        </div>
      </div>
    </div>
  );
}
