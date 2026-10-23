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
  SalesChannel,
} from './types.ts';
import {
  SyncEngine,
  getDeviceId,
  getDeviceName,
  getOfflineQueue,
  saveOfflineQueue,
  getCachedData,
  setCachedData,
} from './utils/syncEngine.ts';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [workspaceMode, setWorkspaceMode] = useState<AppWorkspaceMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salesqu_workspace_mode');
      if (saved === 'sales' || saved === 'admin') return saved;
    }
    return 'sales'; // Default to Mode Sales as requested
  });

  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState<string>('sales-1');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMarketplaceImportOpen, setIsMarketplaceImportOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salesqu_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Data states with cached fallbacks
  const [products, setProducts] = useState<Product[]>(() =>
    getCachedData<Product[]>('omnisales_products', [])
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    getCachedData<Transaction[]>('omnisales_transactions', [])
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    getCachedData<Customer[]>('omnisales_customers', [])
  );
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>(() =>
    getCachedData<SalesPerson[]>('omnisales_sales_people', [])
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    getCachedData<StockMovement[]>('omnisales_stock_movements', [])
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getCachedData<AppNotification[]>('omnisales_notifications', [])
  );
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() =>
    getCachedData<BusinessSettings>('omnisales_settings', DEFAULT_SETTINGS)
  );
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<Transaction[]>(() => getOfflineQueue());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);
  const [syncEngine, setSyncEngine] = useState<SyncEngine | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('salesqu_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('salesqu_theme', 'light');
    }
  }, [darkMode]);

  // Persist workspace mode
  const handleToggleWorkspaceMode = (mode: AppWorkspaceMode) => {
    setWorkspaceMode(mode);
    localStorage.setItem('salesqu_workspace_mode', mode);
  };

  // Fetch central database
  const fetchCentralData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const currentGoogleEmail = businessSettings.googleAccountEmail || 'adigunaherba@gmail.com';
      const res = await fetch(`/api/data?email=${encodeURIComponent(currentGoogleEmail)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const {
            products: p,
            transactions: t,
            customers: c,
            salesPeople: sp,
            stockMovements: sm,
            notifications: n,
            settings: s,
            connectedDevices: cd,
          } = json.data;

          if (p) {
            setProducts(p);
            setCachedData('omnisales_products', p);
          }
          if (t) {
            setTransactions(t);
            setCachedData('omnisales_transactions', t);
          }
          if (c) {
            setCustomers(c);
            setCachedData('omnisales_customers', c);
          }
          if (sp) {
            setSalesPeople(sp);
            setCachedData('omnisales_sales_people', sp);
            if (sp.length > 0 && !sp.some((item: any) => item.id === selectedSalesPersonId)) {
              setSelectedSalesPersonId(sp[0].id);
            }
          }
          if (sm) {
            setStockMovements(sm);
            setCachedData('omnisales_stock_movements', sm);
          }
          if (n) {
            setNotifications(n);
            setCachedData('omnisales_notifications', n);
          }
          if (s) {
            setBusinessSettings(s);
            setCachedData('omnisales_settings', s);
          }
          if (cd) {
            setConnectedDevices(cd);
          }
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsSyncing(false);
    }
  }, [businessSettings.googleAccountEmail, selectedSalesPersonId]);

  // Initialize Sync Engine & Heartbeat
  useEffect(() => {
    const engine = new SyncEngine(
      () => {
        fetchCentralData();
        setOfflineQueue(getOfflineQueue());
      },
      (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(newNotif.title, { body: newNotif.message });
        }
      }
    );
    setSyncEngine(engine);

    fetchCentralData();

    // Login heartbeat with Google Account
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: businessSettings.googleAccountEmail || 'adigunaherba@gmail.com',
        deviceName: getDeviceName(),
        deviceType: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile (HP Sales)' : 'Desktop/Tablet',
      }),
    }).catch(() => {});

    const heartbeatInterval = setInterval(() => {
      fetch('/api/device/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          deviceName: getDeviceName(),
          accountEmail: businessSettings.googleAccountEmail || 'adigunaherba@gmail.com',
          deviceType: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Desktop',
        }),
      }).catch(() => {});
    }, 60000);

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        engine.syncPendingOffline().then(() => {
          setOfflineQueue(getOfflineQueue());
          fetchCentralData();
        });
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      clearInterval(heartbeatInterval);
      engine.close();
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [fetchCentralData, businessSettings.googleAccountEmail]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (syncEngine) {
      await syncEngine.syncPendingOffline();
    }
    setOfflineQueue(getOfflineQueue());
    await fetchCentralData();
    setIsSyncing(false);
  };

  // Standard POS Checkout
  const handleCheckout = async (txData: Partial<Transaction>): Promise<Transaction | null> => {
    const newTxId = `tx-${Date.now()}`;
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(transactions.length + 1).padStart(3, '0')}`;

    const completeTx: Transaction = {
      ...txData,
      id: newTxId,
      invoiceNumber,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      items: txData.items || [],
      subtotal: txData.subtotal || 0,
      discount: txData.discount || 0,
      tax: txData.tax || 0,
      total: txData.total || 0,
      channel: txData.channel || 'offline_store',
      salesPersonId: txData.salesPersonId,
      salesPersonName: txData.salesPersonName,
      salesFeeTotal: txData.salesFeeTotal || 0,
      storeNetProfit: txData.storeNetProfit || 0,
      amountDueToStore: txData.amountDueToStore || 0,
      depositStatus: txData.depositStatus || 'deposited',
      paymentMethod: txData.paymentMethod || 'cash',
      paymentStatus: txData.paymentStatus || 'paid',
      cashPaid: txData.cashPaid,
      changeDue: txData.changeDue,
      customerId: txData.customerId,
      customerName: txData.customerName,
      customerPhone: txData.customerPhone,
      dueDate: txData.dueDate,
      notes: txData.notes,
      deviceId: getDeviceId(),
      accountEmail: businessSettings.googleAccountEmail || 'adigunaherba@gmail.com',
    };

    // Optimistically deduct stock in local UI
    setProducts((prev) =>
      prev.map((p) => {
        const item = completeTx.items.find((it) => it.productId === p.id);
        if (item) {
          const newStock = Math.max(0, p.stock - item.quantity);
          return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    setTransactions((prev) => [completeTx, ...prev]);

    // Automatically link or create customer in local state tagged with PIC
    if (completeTx.customerName) {
      setCustomers((prev) => {
        const existing = prev.find(
          (c) =>
            (completeTx.customerPhone && c.phone === completeTx.customerPhone) ||
            c.name.toLowerCase() === completeTx.customerName!.toLowerCase()
        );
        const unpaid =
          completeTx.paymentStatus !== 'paid' || completeTx.isKasbon
            ? Math.max(0, completeTx.total - (completeTx.cashPaid || 0)) || completeTx.total
            : 0;

        if (existing) {
          return prev.map((c) =>
            c.id === existing.id
              ? {
                  ...c,
                  totalSpent: (c.totalSpent || 0) + completeTx.total,
                  debtBalance: (c.debtBalance || 0) + unpaid,
                  lastOrderDate: completeTx.date,
                  salesPersonId: completeTx.salesPersonId || c.salesPersonId,
                  salesPersonName: completeTx.salesPersonName || c.salesPersonName || 'Kasir Toko',
                }
              : c
          );
        } else {
          const newCust: Customer = {
            id: completeTx.customerId || `cust-${Date.now()}`,
            name: completeTx.customerName!,
            phone: completeTx.customerPhone || '-',
            address: '',
            salesPersonId: completeTx.salesPersonId || 'sales-1',
            salesPersonName: completeTx.salesPersonName || 'Kasir Toko',
            totalSpent: completeTx.total,
            debtBalance: unpaid,
            lastOrderDate: completeTx.date,
            notes: `Otomatis tersimpan dari transaksi ${invoiceNumber}`,
          };
          return [newCust, ...prev];
        }
      });
    }

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completeTx),
        });
        if (res.ok) {
          const json = await res.json();
          fetchCentralData();
          return json.transaction || completeTx;
        }
      } catch {
        // queue fallback
      }
    }

    const currentQueue = getOfflineQueue();
    currentQueue.push(completeTx);
    saveOfflineQueue(currentQueue);
    setOfflineQueue(currentQueue);

    return completeTx;
  };

  // Quick Sales Order from Mode Sales Room (Directly integrates customer, stock, and fees)
  const handleQuickSalesOrder = async (orderData: any) => {
    const activeSp = salesPeople.find((s) => s.id === orderData.salesPersonId) || salesPeople[0];
    const customerPhone = orderData.customerPhone;
    const customerName = orderData.customerName;

    // 1. Check or create customer tagged to this sales room
    let existingCust = customers.find((c) => c.phone === customerPhone || c.name.toLowerCase() === customerName.toLowerCase());
    let customerId = existingCust?.id;

    if (!existingCust) {
      const newCust: Partial<Customer> = {
        name: customerName,
        phone: customerPhone,
        address: orderData.customerAddress || '',
        salesPersonId: activeSp?.id,
        salesPersonName: activeSp?.name,
        totalSpent: orderData.total,
        debtBalance: orderData.isKasbon ? orderData.total : 0,
        lastOrderDate: new Date().toISOString(),
      };

      try {
        const cRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCust),
        });
        if (cRes.ok) {
          const cJson = await cRes.json();
          customerId = cJson.customer.id;
        }
      } catch {
        customerId = `cust-${Date.now()}`;
      }
    }

    // 2. Build Transaction Items
    const txItem = {
      productId: orderData.productId,
      code: orderData.productCode,
      name: orderData.productName,
      price: orderData.price,
      buyPrice: orderData.buyPrice,
      quantity: orderData.quantity,
      unit: 'Botol',
      discount: orderData.discount || 0,
      salesFee: orderData.salesFeeTotal / orderData.quantity,
      subtotal: orderData.total,
    };

    const storeNetProfit = Math.max(
      0,
      orderData.total - orderData.buyPrice * orderData.quantity - orderData.salesFeeTotal
    );

    const txPayload: Partial<Transaction> = {
      channel: 'sales_field',
      items: [txItem],
      subtotal: orderData.total - orderData.tax,
      discount: orderData.discount,
      tax: orderData.tax,
      total: orderData.total,
      salesPersonId: activeSp?.id,
      salesPersonName: activeSp?.name,
      salesFeeTotal: orderData.salesFeeTotal,
      storeNetProfit,
      amountDueToStore: orderData.total - orderData.salesFeeTotal,
      depositStatus: 'pending', // Sales setoran status default to pending until verified
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      customerId,
      customerName,
      customerPhone,
      isKasbon: orderData.isKasbon,
      dueDate: orderData.dueDate,
      notes: `Order Ruang Sales ${activeSp?.name}`,
    };

    await handleCheckout(txPayload);
    await fetchCentralData();
  };

  // Import Marketplace Orders (Shopee, Tokopedia/TikTok, Lazada)
  const handleImportMarketplaceOrders = async (
    channel: SalesChannel,
    orders: Array<{
      orderNumber: string;
      customerName: string;
      items: Array<{ productId: string; quantity: number; price: number }>;
      total: number;
    }>
  ) => {
    try {
      const res = await fetch('/api/marketplace/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, orders }),
      });
      if (res.ok) {
        await fetchCentralData();
      }
    } catch (err) {
      console.error('Marketplace import failed', err);
    }
  };

  const handleMarkInvoicePaid = async (txId: string) => {
    try {
      const res = await fetch(`/api/transactions/${txId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid' }),
      });
      if (res.ok) {
        fetchCentralData();
      }
    } catch {
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, paymentStatus: 'paid' } : t))
      );
    }
  };

  const handleToggleDepositStatus = async (txId: string, status: 'deposited' | 'pending') => {
    try {
      const res = await fetch(`/api/transactions/${txId}/deposit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositStatus: status }),
      });
      if (res.ok) {
        fetchCentralData();
      }
    } catch {
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, depositStatus: status } : t))
      );
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        fetchCentralData();
      }
    } catch {
      setProducts((prev) => {
        if (productData.id) {
          return prev.map((p) => (p.id === productData.id ? ({ ...p, ...productData } as Product) : p));
        }
        return [
          ...prev,
          {
            ...productData,
            id: `prod-${Date.now()}`,
            code: productData.code || `HRB-${prev.length + 1}`,
            stock: productData.stock || 0,
            buyPrice: productData.buyPrice || 0,
            sellPrice: productData.sellPrice || 0,
            salesFeePerUnit: productData.salesFeePerUnit || 0,
            defaultDiscount: productData.defaultDiscount || 0,
            usePpn: productData.usePpn || false,
            ppnPercent: 11,
            minStockAlert: productData.minStockAlert || 5,
            unit: productData.unit || 'Botol',
            category: productData.category || 'Herbal Alami',
            barcode: productData.barcode || '',
            name: productData.name || '',
            imageUrl: productData.imageUrl || '',
            updatedAt: new Date().toISOString(),
          },
        ];
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCentralData();
      }
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleRestockProduct = async (id: string, qty: number, notes?: string) => {
    try {
      const res = await fetch(`/api/products/${id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, notes }),
      });
      if (res.ok) {
        fetchCentralData();
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: p.stock + qty } : p))
      );
    }
  };

  const handleSaveSalesPerson = async (salesData: Partial<SalesPerson>) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salesData),
      });
      if (res.ok) {
        fetchCentralData();
      }
    } catch {
      setSalesPeople((prev) => {
        if (salesData.id) {
          return prev.map((s) => (s.id === salesData.id ? ({ ...s, ...salesData } as SalesPerson) : s));
        }
        return [
          ...prev,
          {
            ...salesData,
            id: `sales-${Date.now()}`,
            name: salesData.name || '',
            phone: salesData.phone || '',
            role: salesData.role || 'Sales Lapangan',
            defaultCommissionPercent: salesData.defaultCommissionPercent || 10,
            totalSales: 0,
            totalCommission: 0,
            totalStoreProfit: 0,
            unpaidDeposit: 0,
            active: true,
          },
        ];
      });
    }
  };

  const handleSaveCustomer = async (custData: Partial<Customer>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custData),
      });
      if (res.ok) {
        fetchCentralData();
      }
    } catch {
      setCustomers((prev) => {
        if (custData.id) {
          return prev.map((c) => (c.id === custData.id ? ({ ...c, ...custData } as Customer) : c));
        }
        return [
          ...prev,
          {
            ...custData,
            id: `cust-${Date.now()}`,
            name: custData.name || '',
            phone: custData.phone || '',
            address: custData.address || '',
            salesPersonId: custData.salesPersonId || selectedSalesPersonId,
            salesPersonName: custData.salesPersonName || salesPeople.find(s => s.id === selectedSalesPersonId)?.name,
            totalSpent: custData.totalSpent || 0,
            debtBalance: custData.debtBalance || 0,
            lastOrderDate: new Date().toISOString(),
          },
        ];
      });
    }
  };

  const handleSaveSettings = async (settingsData: Partial<BusinessSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      if (res.ok) {
        const json = await res.json();
        setBusinessSettings(json.settings);
      }
    } catch {
      setBusinessSettings((prev) => ({ ...prev, ...settingsData }));
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStockAlert).length,
    [products]
  );
  const unpaidDebtCount = useMemo(
    () => customers.filter((c) => c.debtBalance > 0).length,
    [customers]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        workspaceMode={workspaceMode}
        onToggleWorkspaceMode={handleToggleWorkspaceMode}
        onOpenMarketplaceImport={() => setIsMarketplaceImportOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        lowStockCount={lowStockCount}
        unpaidDebtCount={unpaidDebtCount}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          business={businessSettings}
          workspaceMode={workspaceMode}
          salesPeople={salesPeople}
          selectedSalesPersonId={selectedSalesPersonId}
          onSelectSalesPerson={setSelectedSalesPersonId}
          onToggleWorkspaceMode={handleToggleWorkspaceMode}
          onOpenMarketplaceImport={() => setIsMarketplaceImportOpen(true)}
          isOnline={isOnline}
          isSyncing={isSyncing}
          offlineCount={offlineQueue.length}
          notifications={notifications}
          darkMode={darkMode}
          deviceName={getDeviceName()}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onManualSync={handleManualSync}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'pos' && (
            <POSView
              products={products}
              customers={customers}
              salesPeople={salesPeople}
              business={businessSettings}
              deviceId={getDeviceId()}
              onCheckout={handleCheckout}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              products={products}
              customers={customers}
              salesPeople={salesPeople}
              business={businessSettings}
              workspaceMode={workspaceMode}
              selectedSalesPersonId={selectedSalesPersonId}
              onSelectSalesPerson={setSelectedSalesPersonId}
              onNavigateToTab={setActiveTab}
              onQuickRestock={(prod) => {
                setQuickRestockProduct(prod);
                setActiveTab('inventory');
              }}
              onQuickSalesOrder={handleQuickSalesOrder}
              onMarkInvoicePaid={handleMarkInvoicePaid}
            />
          )}

          {activeTab === 'sales' && (
            <SalesLeaderboardView
              salesPeople={salesPeople}
              transactions={transactions}
              business={businessSettings}
              onSaveSalesPerson={handleSaveSalesPerson}
              onSettleSalesDeposit={(txId) => handleToggleDepositStatus(txId, 'deposited')}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              stockMovements={stockMovements}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onRestockProduct={handleRestockProduct}
              quickRestockProduct={quickRestockProduct}
              onClearQuickRestock={() => setQuickRestockProduct(null)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              products={products}
              business={businessSettings}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              transactions={transactions}
              salesPeople={salesPeople}
              business={businessSettings}
              onSaveCustomer={handleSaveCustomer}
              onMarkInvoicePaid={handleMarkInvoicePaid}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              salesPeople={salesPeople}
              business={businessSettings}
              onMarkInvoicePaid={handleMarkInvoicePaid}
              onToggleDepositStatus={handleToggleDepositStatus}
              onOpenMarketplaceImport={() => setIsMarketplaceImportOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              business={businessSettings}
              connectedDevices={connectedDevices}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              onSaveSettings={handleSaveSettings}
              onForceSync={handleManualSync}
              onClearOfflineData={() => {
                saveOfflineQueue([]);
                setOfflineQueue([]);
              }}
            />
          )}
        </main>
      </div>

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        products={products}
        customers={customers}
        business={businessSettings}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onQuickRestock={(prod) => {
          setQuickRestockProduct(prod);
          setActiveTab('inventory');
        }}
      />

      <MarketplaceImportModal
        isOpen={isMarketplaceImportOpen}
        onClose={() => setIsMarketplaceImportOpen(false)}
        products={products}
        onImportOrders={handleImportMarketplaceOrders}
      />
    </div>
  );
}
