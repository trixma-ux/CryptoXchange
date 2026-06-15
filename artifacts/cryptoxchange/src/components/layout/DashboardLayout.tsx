import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import Sidebar from './Sidebar';
import { Bell, Menu, LayoutDashboard, Wallet, ArrowLeftRight, History, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface Props { children: ReactNode; title?: string; }

const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/dashboard/wallets', label: 'Portefeuilles', icon: Wallet },
  { href: '/dashboard/buy-sell', label: 'Acheter', icon: ArrowLeftRight },
  { href: '/dashboard/transactions', label: 'Historique', icon: History },
  { href: '/dashboard/profile', label: 'Profil', icon: UserCircle },
];

export default function DashboardLayout({ children, title }: Props) {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pathname] = useLocation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080d1a' }}>
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6" style={{ backgroundColor: 'rgba(8,13,26,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            {title && <h1 className="text-base md:text-lg font-bold text-white">{title}</h1>}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
            </button>
            <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-2 md:gap-3 p-2 rounded-xl cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>
                    {user?.kycStatus === 'APPROVED' ? <span style={{ color: '#10b981' }}>✓ KYC Vérifié</span> : <span style={{ color: '#f59e0b' }}>◉ KYC en attente</span>}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content — add bottom padding on mobile for the bottom nav */}
        <main className="p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden" style={{ backgroundColor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-stretch">
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{ textDecoration: 'none', flex: 1 }}
              >
                <div className="flex flex-col items-center justify-center gap-1 py-3" style={{ color: isActive ? '#f59e0b' : '#64748b' }}>
                  <Icon style={{ width: 20, height: 20 }} />
                  <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#f59e0b', marginTop: -2 }} />}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
