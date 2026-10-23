import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  CreditCard,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Send,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  DollarSign,
  UserCheck,
  ShoppingBag,
  Store,
  ChevronDown,
  Plus,
  BadgeCheck,
  Percent,
} from 'lucide-react';
import {
  Transaction,
  Product,
  Customer,
  SalesPerson,
  BusinessSettings,
  ReportPeriod,
  AppWorkspaceMode,
  PaymentMethod,
} from '../types.ts';
import {
  formatCurrency,
  filterTransactionsByPeriod,
  calculateFinancialSummary,
  calculateSalesLeaderboard,
  generateWhatsAppReminderMessage,
  checkOverdueStatus,
  CURRENT_GOVERNMENT_PPN_PERCENT,
  calculateChannelBreakdown,
} from '../utils/salesRules.ts';

interface DashboardViewProps {
  transactions: Transaction[];
  products: Product[];
  customers: Customer[];
  salesPeople: SalesPerson[];
  business: BusinessSettings;
  workspaceMode: AppWorkspaceMode;
  selectedSalesPersonId: string;
  onSelectSalesPerson: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
  onQuickRestock: (product: Product) => void;
  onQuickSalesOrder?: (orderData: any) => Promise<void>;
  onMarkInvoicePaid?: (txId: string) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  products,
  customers,
  salesPeople,
  business,
  workspaceMode,
  selectedSalesPersonId,
  onSelectSalesPerson,
  onNavigateToTab,
  onQuickRestock,
  onQuickSalesOrder,
  onMarkInvoicePaid,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('daily');

  // Active sales person for Mode Sales
  const activeSales = useMemo(() => {
    return salesPeople.find((s) => s.id === selectedSalesPersonId) || salesPeople[0];
  }, [salesPeople, selectedSalesPersonId]);

  // Filtered transactions for selected period
  const periodTransactions = useMemo(() => {
    return filterTransactionsByPeriod(transactions, selectedPeriod);
  }, [transactions, selectedPeriod]);

  // Financial summary for entire store
  const storeSummary = useMemo(() => {
    return calculateFinancialSummary(periodTransactions, products);
  }, [periodTransactions, products]);

  // Channel breakdown (Offline vs Shopee vs Tokopedia/TikTok vs Lazada)
  const channelBreakdown = useMemo(() => {
    return calculateChannelBreakdown(periodTransactions);
  }, [periodTransactions]);

  // Critical stock items
  const criticalProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert);
  }, [products]);

  // Overdue debt customers
  const debtCustomers = useMemo(() => {
    return customers.filter((c) => c.debtBalance > 0);
  }, [customers]);

  // Sales Leaderboard for ranking
  const salesLeaderboard = useMemo(() => {
    return calculateSalesLeaderboard(periodTransactions, salesPeople);
  }, [periodTransactions, salesPeople]);

  // Mode Sales: Specific stats for the active sales room
  const salesRoomStats = useMemo(() => {
    if (!activeSales) {
      return { totalRevenue: 0, totalFee: 0, deposited: 0, pending: 0, customersCount: 0, myTransactions: [] };
    }
    const myTxs = transactions.filter(
      (t) => t.salesPersonId === activeSales.id || t.salesPersonName === activeSales.name
    );
    const totalRevenue = myTxs.reduce((sum, t) => sum + t.total, 0);
    const totalFee = myTxs.reduce((sum, t) => sum + (t.salesFeeTotal || 0), 0);
    const deposited = myTxs
      .filter((t) => t.depositStatus === 'deposited')
      .reduce((sum, t) => sum + (t.amountDueToStore || t.total), 0);
    const pending = myTxs
      .filter((t) => t.depositStatus === 'pending')
      .reduce((sum, t) => sum + (t.amountDueToStore || t.total), 0);

    const myCustomers = customers.filter((c) => c.salesPersonId === activeSales.id);

    return { totalRevenue, totalFee, deposited, pending, customersCount: myCustomers.length, myTransactions: myTxs, myCustomers };
  }, [transactions, activeSales, customers]);

  // Quick Order & Customer Input Tool State (Mode Sales Room)
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustAddress, setQuickCustAddress] = useState('');
  const [quickProductId, setQuickProductId] = useState(products[0]?.id || '');
  const [quickQty, setQuickQty] = useState(1);
  const [quickDiscount, setQuickDiscount] = useState(0);
  const [quickUsePpn, setQuickUsePpn] = useState(false);
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<PaymentMethod>('cash');
  const [quickIsKasbon, setQuickIsKasbon] = useState(false);
  const [quickDueDate, setQuickDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks
    return d.toISOString().slice(0, 10);
  });
  const [isSubmittingQuickOrder, setIsSubmittingQuickOrder] = useState(false);
  const [quickOrderNotice, setQuickOrderNotice] = useState<string | null>(null);
  const [quickFeeMode, setQuickFeeMode] = useState<'nominal' | 'percent'>('nominal');

  const selectedProduct = products.find((p) => p.id === quickProductId) || products[0];

  const quickCalculations = useMemo(() => {
    if (!selectedProduct) return { subtotal: 0, ppnAmount: 0, total: 0, fee: 0, feePerUnit: 0 };
    const basePrice = selectedProduct.sellPrice;
    const sub = Math.max(0, basePrice * quickQty - quickDiscount);
    const ppnAmount = quickUsePpn ? Math.round(sub * (CURRENT_GOVERNMENT_PPN_PERCENT / 100)) : 0;
    const total = sub + ppnAmount;
    let feePerUnit = selectedProduct.salesFeePerUnit || 0;
    if (quickFeeMode === 'percent') {
      const pct =
        selectedProduct.salesFeePercent ||
        (basePrice > 0 ? Math.round((feePerUnit / basePrice) * 100) : 10);
      feePerUnit = Math.round((basePrice * pct) / 100);
    }
    const fee = feePerUnit * quickQty;
    return { subtotal: sub, ppnAmount, total, fee, feePerUnit };
  }, [selectedProduct, quickQty, quickDiscount, quickUsePpn, quickFeeMode]);

  const handleProcessQuickOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quickCustName.trim() || !quickCustPhone.trim()) return;

    setIsSubmittingQuickOrder(true);
    try {
      const orderPayload = {
        salesPersonId: activeSales?.id,
        salesPersonName: activeSales?.name,
        customerName: quickCustName.trim(),
        customerPhone: quickCustPhone.trim(),
        customerAddress: quickCustAddress.trim(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productCode: selectedProduct.code,
        quantity: quickQty,
        price: selectedProduct.sellPrice,
        buyPrice: selectedProduct.buyPrice,
        discount: quickDiscount,
        usePpn: quickUsePpn,
        tax: quickCalculations.ppnAmount,
        total: quickCalculations.total,
        salesFeeTotal: quickCalculations.fee,
        paymentMethod: quickPaymentMethod,
        isKasbon: quickIsKasbon,
        paymentStatus: quickIsKasbon ? 'unpaid' : 'paid',
        dueDate: quickIsKasbon ? quickDueDate : undefined,
      };

      if (onQuickSalesOrder) {
        await onQuickSalesOrder(orderPayload);
      }

      setQuickOrderNotice(`Sukses! Pesanan atas nama ${quickCustName} berhasil diproses. Stok barang ${selectedProduct.name} otomatis berkurang & data masuk ke sheet sales.`);
      setQuickCustName('');
      setQuickCustPhone('');
      setQuickCustAddress('');
      setQuickQty(1);
      setQuickDiscount(0);
      setQuickIsKasbon(false);

      setTimeout(() => setQuickOrderNotice(null), 4000);
    } finally {
      setIsSubmittingQuickOrder(false);
    }
  };

  const periodLabels: Record<ReportPeriod, string> = {
    daily: 'Hari Ini (Harian)',
    weekly: '7 Hari Terakhir (Mingguan)',
    monthly: 'Bulan Ini (Bulanan)',
    quarterly: 'Triwulan (3 Bulan)',
    semester: '6 Bulan (Semester)',
    yearly: 'Tahun Ini (Tahunan)',
    custom: 'Kustom',
  };

  // ==========================================
  // RENDER WORKSPACE: MODE SALES (RUANG SALES)
  // ==========================================
  if (workspaceMode === 'sales') {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
        {/* Sales Room Selector Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 sm:p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Ruang Kerja Sales Personal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                {activeSales ? activeSales.name : 'Pilih Sales'}
              </h2>
              <p className="text-xs text-emerald-100 mt-1">
                {activeSales?.role || 'Sales Lapangan / Kanvaser'} • No. Kontak: {activeSales?.phone || '-'}
              </p>
            </div>

            {/* Sales Selector Dropdown */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
              <span className="text-xs font-semibold text-emerald-100">Buka Ruang Sales:</span>
              <select
                value={selectedSalesPersonId}
                onChange={(e) => onSelectSalesPerson(e.target.value)}
                className="bg-white text-slate-900 font-bold text-xs px-3 py-2 rounded-xl border-none outline-none shadow-xs cursor-pointer"
              >
                {salesPeople.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name} ({sp.role.slice(0, 18)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sales Performance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Total Omset Penjualan</span>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(salesRoomStats.totalRevenue)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              {salesRoomStats.myTransactions.length} transaksi penjualan
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs">
            <span className="text-xs font-bold text-indigo-500">Fee Komisi Diambil</span>
            <div className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(salesRoomStats.totalFee)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Hak komisi per produk terjual
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Setoran ke Toko</span>
            <div className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {formatCurrency(salesRoomStats.deposited)}
            </div>
            {salesRoomStats.pending > 0 ? (
              <span className="text-[11px] font-bold text-amber-500 mt-1 block">
                ⏳ Tertahan: {formatCurrency(salesRoomStats.pending)}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-600 mt-1 block">
                ✓ Seluruh setoran lunas
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Pelanggan Binaan</span>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {salesRoomStats.customersCount} Orang
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('customers')}
              className="text-[11px] text-blue-600 hover:underline font-semibold mt-1 block"
            >
              Lihat Sheet Pelanggan &rarr;
            </button>
          </div>
        </div>

        {/* Direct Order & Customer Input Tool */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <PlusCircle className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Input Cepat Pesanan &amp; Pelanggan Ruang Sales
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sekali input langsung menyambung: otomatis memotong stok barang, mencatat profil pelanggan di sheet sales ini, dan menghitung komisi.
              </p>
            </div>
          </div>

          {quickOrderNotice && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{quickOrderNotice}</span>
            </div>
          )}

          <form onSubmit={handleProcessQuickOrder} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pelanggan / Toko Pembeli:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Haji Samsul"
                  value={quickCustName}
                  onChange={(e) => setQuickCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp Pelanggan:
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={quickCustPhone}
                  onChange={(e) => setQuickCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Pelanggan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kios Herbal Blok B"
                  value={quickCustAddress}
                  onChange={(e) => setQuickCustAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Product selection and pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Produk Herbal Adiguna:
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    Tersedia: {selectedProduct?.stock} {selectedProduct?.unit}
                  </span>
                </div>
                <select
                  value={quickProductId}
                  onChange={(e) => setQuickProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatCurrency(p.sellPrice)} (Fee Sales: {formatCurrency(p.salesFeePerUnit || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah (Qty):
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.stock || 999}
                  value={quickQty}
                  onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Potongan / Diskon (Rp):
                </label>
                <input
                  type="number"
                  min="0"
                  value={quickDiscount}
                  onChange={(e) => setQuickDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* PPN Checkbox toggle */}
              <div className="sm:col-span-3 flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="quickPpn"
                  checked={quickUsePpn}
                  onChange={(e) => setQuickUsePpn(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="quickPpn" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  PPN Pemerintah ({CURRENT_GOVERNMENT_PPN_PERCENT}%)
                </label>
              </div>
            </div>

            {/* Payment Method & Kasbon Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'qris', 'transfer'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setQuickPaymentMethod(m)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold uppercase transition ${
                        quickPaymentMethod === m
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="quickKasbon"
                      checked={quickIsKasbon}
                      onChange={(e) => setQuickIsKasbon(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                    />
                    <label htmlFor="quickKasbon" className="text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer">
                      Kasbon / Tanggungan (Belum Bayar)
                    </label>
                  </div>

                  {quickIsKasbon && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Jatuh Tempo:</span>
                      <input
                        type="date"
                        value={quickDueDate}
                        onChange={(e) => setQuickDueDate(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Total breakdown and submit button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Tagihan:</span>
                  <strong className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {formatCurrency(quickCalculations.total)}
                  </strong>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-indigo-500 font-semibold block text-[11px]">Fee Komisi:</span>
                    <div className="inline-flex rounded-md p-0.5 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800">
                      <button
                        type="button"
                        onClick={() => setQuickFeeMode('nominal')}
                        className={`px-1 rounded text-[9px] font-bold cursor-pointer transition ${
                          quickFeeMode === 'nominal' ? 'bg-indigo-600 text-white' : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        Rp
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickFeeMode('percent')}
                        className={`px-1 rounded text-[9px] font-bold cursor-pointer transition ${
                          quickFeeMode === 'percent' ? 'bg-indigo-600 text-white' : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <strong className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    +{formatCurrency(quickCalculations.fee)}
                    {quickFeeMode === 'percent' && selectedProduct?.sellPrice
                      ? ` (${Math.round((quickCalculations.feePerUnit / selectedProduct.sellPrice) * 100)}%)`
                      : ''}
                  </strong>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingQuickOrder}
                className="py-2.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingQuickOrder ? 'Memproses Pesanan...' : 'Simpan & Proses Pesanan Sales'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sales Customers Table in this Room */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Daftar Pelanggan Ruang Kerja {activeSales?.name}
              </h3>
              <p className="text-xs text-slate-400">
                Data pelanggan yang dibina dan diinput langsung oleh sales ini.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('customers')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Buka Manajemen Piutang &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Pelanggan</th>
                  <th className="py-2.5 px-3">Kontak WhatsApp</th>
                  <th className="py-2.5 px-3">Total Belanja</th>
                  <th className="py-2.5 px-3">Status Kasbon</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(salesRoomStats.myCustomers || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada pelanggan terdaftar di ruang sales ini. Input pesanan pertama pada form di atas.
                    </td>
                  </tr>
                ) : (
                  (salesRoomStats.myCustomers || []).map((c) => {
                    const hasDebt = c.debtBalance > 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {c.phone}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(c.totalSpent)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            hasDebt ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {hasDebt ? `Kasbon: ${formatCurrency(c.debtBalance)}` : 'Lunas'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <a
                            href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(c.name)},%20dari%20Adiguna%20Herba.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                          >
                            <Send className="w-3 h-3" />
                            <span>Chat WA</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Embedded Sales Ranking directly on dashboard without title header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {salesLeaderboard.slice(0, 3).map((item, idx) => {
              const medals = ['🥇 Juara 1', '🥈 Juara 2', '🥉 Juara 3'];
              const isCurrent = item.salesPersonId === selectedSalesPersonId;
              return (
                <div
                  key={item.salesPersonId}
                  className={`p-4 rounded-2xl border transition ${
                    isCurrent
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {medals[idx]}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-600 text-white">
                        Ruang Anda
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.name}
                  </h4>
                  <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatCurrency(item.totalOmset)}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                    Fee: {formatCurrency(item.totalSalesFee)} • {item.transactionCount} Transaksi
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================================================
  // RENDER WORKSPACE: MODE KASIR & ADMIN TOKO
  // ================================================
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-left">
        <div className="text-left">
          <div className="flex items-center gap-2 text-left">
            <span className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Store className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white text-left">
              Dashboard Kasir &amp; Admin Adiguna Herba
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-left">
            Monitoring performa toko offline, penjualan online marketplace (Shopee, Tokopedia/TikTok, Lazada), inventaris, dan piutang.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="daily">Hari Ini</option>
            <option value="weekly">7 Hari (Mingguan)</option>
            <option value="monthly">Bulan Ini</option>
            <option value="quarterly">Triwulan (3 Bulan)</option>
            <option value="semester">6 Bulan (Semester)</option>
            <option value="yearly">Tahun Ini</option>
          </select>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Omset */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Total Omset Penjualan</span>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(storeSummary.totalRevenue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {periodTransactions.length} total transaksi
          </span>
        </div>

        {/* Laba Bersih Toko */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Laba Bersih Toko</span>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(storeSummary.totalStoreProfit)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Setelah HPP &amp; Fee Komisi Sales
          </span>
        </div>

        {/* Nilai Stok Herbal */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Nilai Aset Stok Herbal</span>
          <div className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(products.reduce((acc, p) => acc + p.stock * p.buyPrice, 0))}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {products.reduce((acc, p) => acc + p.stock, 0)} botol / unit barang
          </span>
        </div>

        {/* Kasbon / Tanggungan Pelanggan */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Total Kasbon Pelanggan</span>
          <div className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(customers.reduce((acc, c) => acc + (c.debtBalance || 0), 0))}
          </div>
          <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
            {debtCustomers.length} pelanggan memiliki tanggungan
          </span>
        </div>
      </div>

      {/* Online vs Offline Sales Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Breakdown by Channel Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Performa Penjualan Online vs Offline
              </h3>
              <p className="text-xs text-slate-400">
                Porsi pendapatan per saluran transaksi Adiguna Herba
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {periodLabels[selectedPeriod]}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Toko Offline (Kasir POS)', amount: channelBreakdown.offline.revenue, color: 'bg-slate-600' },
              { label: 'Shopee Official Store', amount: channelBreakdown.shopee.revenue, color: 'bg-orange-500' },
              { label: 'Tokopedia & TikTok Shop', amount: channelBreakdown.tokopediaTiktok.revenue, color: 'bg-emerald-600' },
              { label: 'Lazada Flagship', amount: channelBreakdown.lazada.revenue, color: 'bg-blue-600' },
              { label: 'Sales Lapangan / Kanvas', amount: channelBreakdown.salesField.revenue, color: 'bg-indigo-600' },
            ].map((ch, idx) => {
              const totalRev = storeSummary.totalRevenue || 1;
              const pct = Math.round((ch.amount / totalRev) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{ch.label}</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {formatCurrency(ch.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${ch.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Offline: <strong>{formatCurrency(channelBreakdown.totalOfflineRevenue)}</strong></span>
            <span className="text-slate-500">Total Online Marketplace: <strong className="text-orange-600">{formatCurrency(channelBreakdown.totalOnlineRevenue)}</strong></span>
          </div>
        </div>

        {/* Laba Rugi Terperinci Summary */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
              Rincian Laba / Rugi Toko
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Kalkulasi laba bersih sesungguhnya ({periodLabels[selectedPeriod]})
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Total Omset Bruto:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(storeSummary.totalRevenue)}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                <span className="text-slate-600 dark:text-slate-400">HPP (Modal Beli Produk):</span>
                <span className="font-bold text-rose-600">-{formatCurrency(storeSummary.totalCost)}</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Total Fee Komisi Sales:</span>
                <span className="font-bold text-indigo-600">-{formatCurrency(storeSummary.totalSalesFee)}</span>
              </div>

              <div className="flex justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 font-black text-sm">
                <span className="text-emerald-800 dark:text-emerald-300">Laba Bersih Toko Adiguna:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">+{formatCurrency(storeSummary.totalStoreProfit)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('reports')}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition text-center"
          >
            Lihat Laporan Penjualan Lengkap &rarr;
          </button>
        </div>
      </div>

      {/* Pemantau Kasbon Customer dengan Status, Tanggal Beli & Jatuh Tempo, dan Produk yang Diambil */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Clock className="w-5 h-5" />
              </span>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Pemantau Kasbon &amp; Jatuh Tempo Customer
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Status pembayaran, metode bayar, tanggal beli, jatuh tempo, dan rincian produk herbal yang diambil.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('customers')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Buka Sheet Pelanggan &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Nama Customer</th>
                <th className="py-2.5 px-3">Petugas / Sales</th>
                <th className="py-2.5 px-3">Produk yang Diambil</th>
                <th className="py-2.5 px-3">Tanggal Beli &amp; Jatuh Tempo</th>
                <th className="py-2.5 px-3">Saldo Kasbon</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {debtCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada pelanggan yang memiliki tunggakan atau kasbon berjalan. Semua pembayaran lunas!
                  </td>
                </tr>
              ) : (
                debtCustomers.map((c) => {
                  const custTx = transactions.find(
                    (t) => (t.customerId === c.id || t.customerPhone === c.phone) && t.paymentStatus !== 'paid'
                  );
                  const overdue = custTx?.dueDate ? checkOverdueStatus(custTx.dueDate, custTx.paymentStatus) : null;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
                        <span className="font-mono text-[11px] text-slate-400">{c.phone}</span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {c.salesPersonName || custTx?.salesPersonName || 'Kasir Toko'}
                      </td>

                      <td className="py-3 px-3">
                        {custTx?.items ? (
                          <div className="space-y-0.5">
                            {custTx.items.map((it, idx) => (
                              <span key={idx} className="block text-[11px] text-slate-600 dark:text-slate-300">
                                {it.quantity}x {it.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pesanan sebelumnya</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-500">
                          Beli: {custTx ? new Date(custTx.date || custTx.createdAt).toLocaleDateString('id-ID') : '-'}
                        </div>
                        {custTx?.dueDate && (
                          <div className="text-[11px] font-bold text-rose-500">
                            Jatuh Tempo: {custTx.dueDate} ({overdue?.label})
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-black text-rose-600 dark:text-rose-400 font-mono">
                          {formatCurrency(c.debtBalance)}
                        </span>
                        <div className="text-[10px] text-slate-400 uppercase">
                          Metode: {custTx?.paymentMethod || 'Tunai'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {custTx && onMarkInvoicePaid && (
                            <button
                              type="button"
                              onClick={() => onMarkInvoicePaid(custTx.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                            >
                              Tandai Lunas
                            </button>
                          )}
                          <a
                            href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${generateWhatsAppReminderMessage(business, c)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-[10px]"
                          >
                            WA
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Stock Alerts */}
      {criticalProducts.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                Peringatan Stok Menipis ({criticalProducts.length} Produk Perlu Restock)
              </h4>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {criticalProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="text-slate-900 dark:text-white block">{p.name}</strong>
                  <span className="text-[11px] text-amber-600 font-bold">
                    Tersisa: {p.stock} {p.unit} (Min: {p.minStockAlert})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onQuickRestock(p)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
