'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Wallet, ArrowLeftRight, Repeat, 
  Download, Upload, History, UserCircle, 
  LifeBuoy, Settings, Bitcoin, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { href: '/dashboard/wallets', label: 'Portefeuilles', icon: Wallet },
  { href: '/dashboard/buy-sell', label: 'Acheter / Vendre', icon: ArrowLeftRight },
  { href: '/dashboard/swap', label: 'Échanger (Swap)', icon: Repeat },
  { href: '/dashboard/deposit', label: 'Dépôt', icon: Download },
  { href: '/dashboard/withdraw', label: 'Retrait', icon: Upload },
  { href: '/dashboard/transactions', label: 'Historique', icon: History },
];

const SECONDARY_NAV = [
  { href: '/dashboard/profile', label: 'Profil & Sécurité', icon: UserCircle },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, refreshToken, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
      logout();
      window.location.href = '/auth/login';
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
      logout();
      window.location.href = '/auth/login';
    }
  };

  return (
    <aside className="fixed hidden md:flex flex-col w-64 h-screen bg-dark-900 border-r border-white/5 z-40">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
            <Bitcoin className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-black gradient-text">CryptoXchange</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8">
        <div>
          <div className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 px-2">Menu Principal</div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 px-2">Paramètres</div>
          <div className="space-y-1">
            {SECONDARY_NAV.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
              <Link href="/admin/dashboard" className="nav-link text-warning hover:text-warning/80 hover:bg-warning/10">
                <Settings className="w-5 h-5" />
                Panel Admin
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-danger font-medium transition-colors hover:bg-danger/10"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
