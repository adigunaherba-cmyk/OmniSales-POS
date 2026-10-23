import React from 'react';
import {
  ShoppingCart,
  LayoutDashboard,
  Package,
  FileSpreadsheet,
  Users,
  Receipt,
  Settings,
  AlertCircle,
  X,
  CreditCard,
  ShieldCheck,
  Trophy,
  ShoppingBag,
  Store,
  UserCheck,
} from 'lucide-react';
import { AppWorkspaceMode } from '../types.ts';

export type ActiveTab =
  | 'pos'
  | 'dashboard'
  | 'inventory'
  | 'reports'
  | 'sales'
  | 'customers'
  | 'transactions'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  workspaceMode: AppWorkspaceMode;
  onToggleWorkspaceMode: (mode: AppWorkspaceMode) => void;
  onOpenMarketplaceImport: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  lowStockCount: number;
  unpaidDebtCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  workspaceMode,
  onToggleWorkspaceMode,
  onOpenMarketplaceImport,
  isOpenMobile,
  onCloseMobile,
  lowStockCount,
  unpaidDebtCount,
}) => {
  // Navigation items adapted for workspace mode
  const navItems = [
    ...(workspaceMode === 'sales'
      ? [
          {
            id: 'dashboard' as ActiveTab,
            label: 'Ruang Kerja Sales',
            icon: LayoutDashboard,
            badge: 'Utama',
            badgeColor: 'bg-emerald-500 text-white',
          },
          {
            id: 'pos' as ActiveTab,
            label: 'Keranjang',
            icon: ShoppingCart,
            badge: null,
          },
          {
            id: 'transactions' as ActiveTab,
            label: 'Penjualan Online & Offline',
            icon: Receipt,
            badge: null,
          },
          {
            id: 'customers' as ActiveTab,
            label: 'Pelanggan & Kasbon',
            icon: Users,
            badge: unpaidDebtCount > 0 ? `${unpaidDebtCount} Kasbon` : null,
            badgeColor: 'bg-rose-500 text-white',
          },
          {
            id: 'sales' as ActiveTab,
            label: 'Ranking & Fee Sales',
            icon: Trophy,
            badge: null,
          },
        ]
      : [
          {
            id: 'pos' as ActiveTab,
            label: 'Keranjang',
            icon: ShoppingCart,
            badge: null,
          },
          {
            id: 'transactions' as ActiveTab,
            label: 'Penjualan Online & Offline',
            icon: Receipt,
            badge: null,
          },
          {
            id: 'dashboard' as ActiveTab,
            label: 'Dashboard Analitik',
            icon: LayoutDashboard,
            badge: null,
          },
          {
            id: 'inventory' as ActiveTab,
            label: 'Katalog & Mutasi Stok',
            icon: Package,
            badge: lowStockCount > 0 ? `${lowStockCount} Kritis` : null,
            badgeColor: 'bg-amber-500 text-white',
          },
          {
            id: 'reports' as ActiveTab,
            label: 'Rekap Laporan Keuangan',
            icon: FileSpreadsheet,
            badge: null,
          },
          {
            id: 'sales' as ActiveTab,
            label: 'Ranking & Tim Sales',
            icon: Trophy,
            badge: null,
          },
          {
            id: 'customers' as ActiveTab,
            label: 'Pelanggan & Kasbon',
            icon: Users,
            badge: unpaidDebtCount > 0 ? `${unpaidDebtCount} Kasbon` : null,
            badgeColor: 'bg-rose-500 text-white',
          },
          {
            id: 'settings' as ActiveTab,
            label: 'Pengaturan & Cloud',
            icon: Settings,
            badge: null,
          },
        ]),
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto">
          {/* Top Header - Unified for Desktop & Mobile */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 text-left">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase leading-tight truncate">
                  KelolaQU
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate">
                  Adiguna Herba
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup Menu"
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switch Card in Sidebar - Rata Kiri */}
          <div className="px-3 pt-3 pb-1 text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block px-1 mb-1.5 text-left">
              Ruang Kerja
            </span>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onToggleWorkspaceMode('sales')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-start gap-1.5 text-left cursor-pointer ${
                  workspaceMode === 'sales'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate text-left">Sales</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleWorkspaceMode('admin')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-start gap-1.5 text-left cursor-pointer ${
                  workspaceMode === 'admin'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate text-left">Kasir/Admin</span>
              </button>
            </div>
          </div>

          {/* Navigation Links - Rata Kiri */}
          <div className="px-3 pt-2 text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block px-1 mb-1.5 text-left">
              Menu Utama
            </span>
            <nav className="space-y-1 text-left">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-left transition cursor-pointer ${
                      isActive
                        ? workspaceMode === 'sales'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 font-bold'
                          : 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 text-left justify-start">
                      <Icon
                        className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />
                      <span className="truncate text-left">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 text-right ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Quick action for marketplace in admin mode */}
              {workspaceMode === 'admin' && (
                <div className="pt-2 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMarketplaceImport();
                      onCloseMobile();
                    }}
                    className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-left text-orange-600 dark:text-orange-400 bg-orange-50/70 dark:bg-orange-950/30 hover:bg-orange-100/70 border border-orange-200 dark:border-orange-800/40 transition cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-orange-500" />
                    <span className="text-left truncate">+ Import Marketplace</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* Bottom Status / Quick Info Widget - Rata Kiri */}
        <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:from-slate-800/60 dark:to-slate-800/20 border border-slate-200/80 dark:border-slate-700/60 shrink-0 text-left">
          <div className="flex items-center gap-2 mb-1.5 text-left">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-left">
              Sinkron 1 Akun Google
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2 text-left">
            Stok barang &amp; setoran sales di HP manapun otomatis terupdate real-time.
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-semibold pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-left">
            <span className="text-left">Server: Terhubung</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
