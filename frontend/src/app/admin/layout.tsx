'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { 
  LayoutDashboard, Users, FileCheck, ArrowLeftRight, 
  Settings, LogOut, ShieldAlert, ArrowLeft 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  const NAV_ITEMS = [
    { href: '/admin/dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/kyc', label: 'Vérifications KYC', icon: FileCheck },
    { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/admin/fees', label: 'Frais & Limites', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Admin Sidebar */}
      <aside className="fixed hidden md:flex flex-col w-64 h-screen bg-dark-900 border-r border-white/5 z-40">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <ShieldAlert className="w-6 h-6 text-warning mr-2" />
          <span className="text-lg font-black text-white">Admin Panel</span>
        </div>

        <div className="flex-1 py-6 px-4 flex flex-col gap-2">
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

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-brand-400 font-medium hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
            Retour au site
          </Link>
          <button 
            onClick={() => { logout(); router.push('/auth/login'); }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-danger font-medium hover:bg-danger/10"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 ml-0 md:ml-64">
        <header className="h-16 bg-dark-900 border-b border-white/5 px-6 flex items-center justify-between">
          <h2 className="font-bold text-white hidden md:block">Espace Administration</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-dark-400">Connecté en tant que:</span>{' '}
              <span className="text-warning font-bold">{user.email}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
