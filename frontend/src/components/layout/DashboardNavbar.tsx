'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Menu, X, ShieldAlert, User } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function DashboardNavbar() {
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-dark-950/80 backdrop-blur-xl border-b border-white/5 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center md:hidden">
        <button onClick={() => setMobileMenuOpen(true)} className="text-dark-300 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="hidden md:block">
        {user?.kycStatus !== 'APPROVED' && (
          <Link href="/dashboard/profile" className="badge-warning px-3 py-1.5 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline">Votre compte n'est pas vérifié. Complétez votre KYC.</span>
            <span className="sm:hidden">KYC Requis</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-dark-300 hover:text-white hover:bg-white/5 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full"></span>
          </button>

          {/* Notifications Dropdown (Simple version) */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-card p-4 z-50 animate-fade-in">
              <h3 className="font-bold text-white mb-3">Notifications</h3>
              <div className="space-y-3">
                <div className="p-3 bg-dark-800 rounded-lg text-sm">
                  <div className="font-semibold text-brand-400">Bienvenue !</div>
                  <div className="text-dark-300">Votre compte a été créé avec succès.</div>
                </div>
              </div>
              <Link href="/dashboard/notifications" className="block text-center text-sm text-brand-400 mt-3 hover:text-brand-300">
                Voir toutes
              </Link>
            </div>
          )}
        </div>

        <Link href="/dashboard/profile" className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
          <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center overflow-hidden border border-white/10">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-dark-400" />
            )}
          </div>
          <div className="hidden sm:block text-sm">
            <div className="font-medium text-white">{user?.firstName} {user?.lastName}</div>
            <div className="text-xs text-dark-400">{user?.kycStatus === 'APPROVED' ? 'Vérifié' : 'Non vérifié'}</div>
          </div>
        </Link>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-dark-950 z-50 md:hidden flex flex-col animate-fade-in">
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
            <span className="text-xl font-black gradient-text">CryptoXchange</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-dark-300 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-lg font-medium">Dashboard</Link>
            <Link href="/dashboard/wallets" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-lg font-medium">Portefeuilles</Link>
            <Link href="/dashboard/buy-sell" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-lg font-medium">Acheter/Vendre</Link>
            <Link href="/dashboard/profile" onClick={() => setMobileMenuOpen(false)} className="block py-3 text-lg font-medium">Profil</Link>
          </div>
        </div>
      )}
    </header>
  );
}
