import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { POSView } from './components/POSView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { SalesLeaderboardView } from './components/SalesLeaderboardView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { TransactionsView } from './components/TransactionsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { NotificationModal } from './components/NotificationModal.tsx';
import { MarketplaceImportModal } from './components/MarketplaceImportModal.tsx';
import {
  Product,
  Transaction,
  Customer,
  SalesPerson,
  StockMovement,
  AppNotification,
  BusinessSettings,
  ConnectedDevice,
  AppWorkspaceMode,
} from './types.ts';

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Adiguna Herba',
  brandName: 'KelolaQU',
  businessPhone: '081234567890',
  businessAddress: 'Jl. Pemuda No. 88, Sentra Herbal Indonesia',
  businessEmail: 'adigunaherba@gmail.com',
  googleAccountEmail: 'adigunaherba@gmail.com',
  currency: 'IDR',
  governmentPpnPercent: 11,
  qrisImage: '',
  qrisNmid: 'ID1020030405060',
  bankName: 'BCA (Bank Central Asia)',
  bankAccountName: 'Adiguna Herba',
  bankAccountNumber: '8830129845',
  bigTransactionThreshold: 500000,
  enablePushAlerts: true,
  defaultSalesFeePercent: 10,
};

// Helper internal pengganti database server luar
const getLocalData = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
};

const setLocalData = <T,>(key: string, data: T) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Data Dummy Awal agar aplikasi kasir tidak kosong saat pertama dibuka
const DUMMY_PRODUCTS: Product[] = [
  { id: 'p-1', name: 'Madu Maag Akut 250gr', sku: 'MD-001', price: 65000, stock: 45, category: 'Madu', minStock: 5 },
  { id: 'p-2', name: 'Kapsul Ekstrak Kulit Manggis', sku: 'KP-002', price: 45000, stock: 30, category: 'Kapsul', minStock: 10 },
  { id: 'p-3', name: 'Teh Celup Daun Kelor Organik', sku: 'TH-003', price: 25000, stock: 4, category: 'Teh Herbal', minStock: 5 }
];

const DUMMY_SALES: SalesPerson[] = [
  { id: 'sales-1', name: 'Ahmad POS Kasir', email: 'ahmad@kelolaqu.com', phone: '0811', status: 'active', totalSales: 0 },
  { id: 'sales-2', name: 'Siti Admin Toko', email: 'siti@kelolaqu.com', phone: '0822', status: 'active', totalSales: 0 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [workspaceMode, setWorkspaceMode] = useState<AppWorkspaceMode>(() => 
    getLocalData<AppWorkspaceMode>('salesqu_workspace_mode', 'sales')
  );

  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState<string>('sales-1');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMarketplaceImportOpen, setIsMarketplaceImportOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => getLocalData<boolean>('salesqu_theme_bool', false));

  // State Manajemen Data (Otomatis Tersambung ke Browser Komputer Anda)
  const [products, setProducts] = useState<Product[]>(() => getLocalData('omnisales_products', DUMMY_PRODUCTS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLocalData('omnisales_transactions', []));
  const [customers, setCustomers] = useState<Customer[]>(() => getLocalData('omnisales_customers', []));
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>(() => getLocalData('omnisales_sales_people', DUMMY_SALES));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => getLocalData('omnisales_stock_movements', []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getLocalData('omnisales_notifications', []));
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => getLocalData('omnisales_settings', DEFAULT_SETTINGS));
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);

  // Efek Sinkronisasi Tema Kegelapan (Dark Mode)
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('salesqu_theme', 'dark');
      setLocalData('salesqu_theme_bool', true);
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('salesqu_theme', 'light');
      setLocalData('salesqu_theme_bool', false);
    }
  }, [darkMode]);

  const handleToggleWorkspaceMode = (mode: AppWorkspaceMode) => {
    setWorkspaceMode(mode);
    localStorage.setItem('salesqu_workspace_mode', mode);
  };

  // Fungsi Pemicu Update Data Lokal Otomatis
  const handleUpdateProducts = (newData: Product[]) => { setProducts(newData); setLocalData('omnisales_products', newData); };
  const handleUpdateTransactions = (newData: Transaction[]) => { setTransactions(newData); setLocalData('omnisales_transactions', newData); };
  const handleUpdateCustomers = (newData: Customer[]) => { setCustomers(newData); setLocalData('omnisales_customers', newData); };
  const handleUpdateSalesPeople = (newData: SalesPerson[]) => { setSalesPeople(newData); setLocalData('omnisales_sales_people', newData); };
  const handleUpdateStockMovements = (newData: StockMovement[]) => { setStockMovements(newData); setLocalData('omnisales_stock_movements', newData); };
  const handleUpdateSettings = (newData: BusinessSettings) => { setBusinessSettings(newData); setLocalData('omnisales_settings', newData); };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workspaceMode={workspaceMode}
        setWorkspaceMode={handleToggleWorkspaceMode}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        settings={businessSettings}
        lowStockCount={products.filter((p) => p.stock <= p.minStock).length}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          workspaceMode={workspaceMode}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          setIsNotificationsOpen={setIsNotificationsOpen}
          notificationCount={notifications.filter((n) => !n.isRead).length}
          isOnline={true}
          isSyncing={isSyncing}
          onSyncTrigger={() => {}}
          settings={businessSettings}
          salesPeople={salesPeople}
          selectedSalesPersonId={selectedSalesPersonId}
          setSelectedSalesPersonId={setSelectedSalesPersonId}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              transactions={transactions}
              customers={customers}
              salesPeople={salesPeople}
              settings={businessSettings}
              setActiveTab={setActiveTab}
              setQuickRestockProduct={setQuickRestockProduct}
            />
          )}
          {activeTab === 'pos' && (
            <POSView
              products={products}
              setProducts={handleUpdateProducts}
              transactions={transactions}
              setTransactions={handleUpdateTransactions}
              customers={customers}
              setCustomers={handleUpdateCustomers}
              salesPeople={salesPeople}
              selectedSalesPersonId={selectedSalesPersonId}
              settings={businessSettings}
              stockMovements={stockMovements}
              setStockMovements={handleUpdateStockMovements}
            />
          )}
          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              setProducts={handleUpdateProducts}
              stockMovements={stockMovements}
              setStockMovements={handleUpdateStockMovements}
              quickRestockProduct={quickRestockProduct}
              setQuickRestockProduct={setQuickRestockProduct}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              setTransactions={handleUpdateTransactions}
              products={products}
              setProducts={handleUpdateProducts}
              settings={businessSettings}
            />
          )}
          {activeTab === 'customers' && (
            <CustomersView customers={customers} setCustomers={handleUpdateCustomers} />
          )}
          {activeTab === 'leaderboard' && (
            <SalesLeaderboardView
              salesPeople={salesPeople}
              setSalesPeople={handleUpdateSalesPeople}
              transactions={transactions}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              products={products}
              stockMovements={stockMovements}
              settings={businessSettings}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView
              settings={businessSettings}
              setSettings={handleUpdateSettings}
              connectedDevices={connectedDevices}
