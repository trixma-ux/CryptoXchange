import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import Sidebar from './Sidebar';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface Props { children: ReactNode; title?: string; }

export default function DashboardLayout({ children, title }: Props) {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080d1a' }}>
      <Sidebar />
      <div className="md:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6" style={{ backgroundColor: 'rgba(8,13,26,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-4">
            <button className="md:hidden" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <Menu className="w-6 h-6" />
            </button>
            {title && <h1 className="text-lg font-bold text-white hidden md:block">{title}</h1>}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
            </button>
            <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-3 p-2 rounded-xl cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
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
        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
