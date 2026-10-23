import React from 'react';
import {
  Store,
  Wifi,
  WifiOff,
  Bell,
  Sun,
  Moon,
  Menu,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  Users,
  ShoppingBag,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { AppNotification, BusinessSettings, AppWorkspaceMode, SalesPerson } from '../types.ts';

interface HeaderProps {
  business: BusinessSettings;
  workspaceMode: AppWorkspaceMode;
  salesPeople: SalesPerson[];
  selectedSalesPersonId: string;
  onSelectSalesPerson: (id: string) => void;
  onToggleWorkspaceMode: (mode: AppWorkspaceMode) => void;
  onOpenMarketplaceImport?: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  offlineCount: number;
  notifications: AppNotification[];
  darkMode: boolean;
  deviceName: string;
  onToggleDarkMode: () => void;
  onOpenNotifications: () => void;
  onOpenMobileMenu: () => void;
  onManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  business,
  workspaceMode,
  salesPeople,
  selectedSalesPersonId,
  onSelectSalesPerson,
  onToggleWorkspaceMode,
  onOpenMarketplaceImport,
  isOnline,
  isSyncing,
  offlineCount,
  notifications,
  darkMode,
  deviceName,
  onToggleDarkMode,
  onOpenNotifications,
  onOpenMobileMenu,
  onManualSync,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentSales = salesPeople.find((s) => s.id === selectedSalesPersonId) || salesPeople[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5">
        {/* Left: Mobile hamburger & Store Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Buka Menu Navigasi"
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-left">
                <span className="font-extrabold text-sm sm:text-base leading-tight text-slate-900 dark:text-white text-left">
                  {business.brandName || 'KelolaQU'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Adiguna Herba
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 text-left">
                <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                  <Smartphone className="w-3 h-3 text-blue-500" />
                  {deviceName}
                </span>
                <span>•</span>
                <span>1 Akun Cloud ({business.googleAccountEmail || 'adigunaherba@gmail.com'})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Workspace Mode Switcher (Mode Sales vs Mode Kasir/Admin) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => onToggleWorkspaceMode('sales')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              workspaceMode === 'sales'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ruang</span>
            <span>Sales</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleWorkspaceMode('admin')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              workspaceMode === 'admin'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Kasir &amp; Admin</span>
          </button>
        </div>

        {/* Mode-Specific Quick Selector & Right Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* In Sales Mode: Sales Room Dropdown */}
          {workspaceMode === 'sales' && salesPeople.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-1 rounded-xl text-xs">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">Ruang:</span>
              <select
                value={selectedSalesPersonId}
                onChange={(e) => onSelectSalesPerson(e.target.value)}
                className="bg-transparent font-bold text-emerald-900 dark:text-emerald-200 outline-none text-xs cursor-pointer"
              >
                {salesPeople.map((sp) => (
                  <option key={sp.id} value={sp.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {sp.name} ({sp.role.slice(0, 15)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Real-time sync & online status badge */}
          <div className="hidden xl:flex items-center">
            {isOnline ? (
              <button
                type="button"
                onClick={onManualSync}
                title="Sinkronisasi Data Real-Time Aktif (Klik untuk sinkron ulang)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition"
              >
                <Wifi className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse text-amber-500' : ''}`} />
                <span>{isSyncing ? 'Sinkron...' : 'Tersinkron'}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </span>
            )}
          </div>

          {/* Pending offline queue indicator */}
          {offlineCount > 0 && (
            <button
              type="button"
              onClick={onManualSync}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white animate-pulse"
              title={`${offlineCount} transaksi tersimpan lokal menunggu sinkron`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{offlineCount}</span>
            </button>
          )}

          {/* Refresh manual sync button */}
          <button
            type="button"
            onClick={onManualSync}
            aria-label="Sinkronkan data sekarang"
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Sinkronkan Data Manual"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Buka Notifikasi"
            className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
