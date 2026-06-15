'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Copy, Wallet, ArrowRightLeft, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { walletsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatCrypto } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function WalletsPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const res = await walletsAPI.getPortfolio();
      const data = res.data.data;
      setPortfolio(data);
      if (data.portfolioItems?.length > 0) {
        setSelectedWallet(data.portfolioItems[0]);
      }
    } catch (error) {
      toast.error('Erreur de chargement des portefeuilles');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Adresse copiée !');
  };

  if (loading) {
    return <div className="flex justify-center p-10"><div className="spinner w-8 h-8"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="section-title">Mes Portefeuilles</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Wallet List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-6">
            <h2 className="text-dark-400 font-medium mb-1">Valeur Totale</h2>
            <div className="text-3xl font-black text-white gradient-text">
              {formatCurrency(portfolio?.totalFCFA || 0, 'XOF')}
            </div>
            <div className="text-sm text-dark-400 mt-1">
              ≈ {formatCurrency(portfolio?.totalUSD || 0, 'USD')}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/5 font-semibold">Vos Actifs</div>
            <div className="max-h-[500px] overflow-y-auto p-2">
              {portfolio?.portfolioItems?.map((item: any) => (
                <button
                  key={item.currency}
                  onClick={() => setSelectedWallet(item)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                    selectedWallet?.currency === item.currency ? 'bg-brand-500/10 border border-brand-500/30' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center font-bold text-sm">
                      {item.currency.substring(0, 3)}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{item.currency}</div>
                      <div className="text-xs text-dark-400">{item.network}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white text-sm">{item.balance}</div>
                    <div className="text-xs text-dark-400">{formatCurrency(item.valueFCFA, 'XOF')}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Wallet Details */}
        <div className="lg:col-span-2">
          {selectedWallet ? (
            <motion.div
              key={selectedWallet.currency}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 md:p-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center text-xl font-black shadow-inner-brand">
                    {selectedWallet.currency.substring(0, 3)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedWallet.currency}</h2>
                    <div className="text-dark-400">Réseau: <span className="text-white">{selectedWallet.network}</span></div>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-3xl font-black text-white">{selectedWallet.balance}</div>
                  <div className="text-dark-400 font-medium">≈ {formatCurrency(selectedWallet.valueFCFA, 'XOF')}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                <button className="glass-card-hover p-4 flex flex-col items-center justify-center gap-2 group">
                  <div className="w-10 h-10 rounded-full bg-success/20 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Recevoir</span>
                </button>
                <button className="glass-card-hover p-4 flex flex-col items-center justify-center gap-2 group">
                  <div className="w-10 h-10 rounded-full bg-danger/20 text-danger flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Envoyer</span>
                </button>
                <button className="glass-card-hover p-4 flex flex-col items-center justify-center gap-2 group">
                  <div className="w-10 h-10 rounded-full bg-info/20 text-info flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Échanger</span>
                </button>
              </div>

              {/* Deposit Address */}
              <div className="bg-dark-900 rounded-xl p-6 border border-white/5">
                <h3 className="font-semibold text-white mb-4">Adresse de réception</h3>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={selectedWallet.address} size={120} level="M" />
                  </div>
                  <div className="flex-1 w-full">
                    <p className="text-sm text-warning mb-2">
                      Envoyez uniquement du {selectedWallet.currency} sur le réseau {selectedWallet.network} à cette adresse.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-dark-950 p-3 rounded-lg font-mono text-xs md:text-sm text-dark-300 break-all border border-white/5">
                        {selectedWallet.address}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(selectedWallet.address)}
                        className="btn-secondary px-3 py-3 rounded-lg"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card h-full min-h-[400px] flex items-center justify-center text-dark-400">
              Sélectionnez un portefeuille
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
