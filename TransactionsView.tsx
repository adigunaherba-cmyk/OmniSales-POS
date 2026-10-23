import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Send,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Calendar,
  CheckCircle2,
  ShoppingBag,
  Store,
  UserCheck,
} from 'lucide-react';
import { Transaction, BusinessSettings, SalesPerson, SalesChannel } from '../types.ts';
import {
  formatCurrency,
  generateWhatsAppReceiptMessage,
  checkOverdueStatus,
} from '../utils/salesRules.ts';
import { exportSingleReceiptPDF } from '../utils/exportUtils.ts';

interface TransactionsViewProps {
  transactions: Transaction[];
  salesPeople?: SalesPerson[];
  business: BusinessSettings;
  onMarkInvoicePaid: (txId: string) => Promise<void>;
  onToggleDepositStatus: (txId: string, status: 'deposited' | 'pending') => Promise<void>;
  onOpenMarketplaceImport?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  salesPeople = [],
  business,
  onMarkInvoicePaid,
  onToggleDepositStatus,
  onOpenMarketplaceImport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [channelCategory, setChannelCategory] = useState<'all' | 'offline' | 'online'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'deposited' | 'pending'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Extract all unique sales names from transactions if not passed
  const allSalesList = useMemo(() => {
    if (salesPeople && salesPeople.length > 0) return salesPeople;
    const names = Array.from(new Set(transactions.map((t) => t.salesPersonName).filter(Boolean))) as string[];
    return names.map((name, idx) => ({
      id: `sp-${idx}`,
      name,
      phone: '',
      role: 'Sales',
      defaultCommissionPercent: 10,
      totalSales: 0,
      totalCommission: 0,
      totalStoreProfit: 0,
      unpaidDeposit: 0,
      active: true,
    }));
  }, [salesPeople, transactions]);

  const channelBadges: Record<SalesChannel, { name: string; bg: string; text: string }> = {
    offline_store: { name: 'Kasir Toko (Offline)', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
    sales_field: { name: 'Sales Lapangan (Offline)', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-600 dark:text-indigo-400' },
    shopee: { name: 'Shopee (Online)', bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-600 dark:text-orange-400' },
    tokopedia_tiktok: { name: 'Tokopedia/TikTok (Online)', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400' },
    lazada: { name: 'Lazada (Online)', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-600 dark:text-blue-400' },
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const ch = tx.channel || 'offline_store';
      const isOnline = ['shopee', 'tokopedia_tiktok', 'lazada'].includes(ch);

      if (channelCategory === 'offline' && isOnline) return false;
      if (channelCategory === 'online' && !isOnline) return false;

      const term = searchTerm.toLowerCase();
      const matchSearch =
        tx.invoiceNumber.toLowerCase().includes(term) ||
        (tx.customerName || '').toLowerCase().includes(term) ||
        (tx.salesPersonName || '').toLowerCase().includes(term) ||
        (tx.marketplaceOrderNo || '').toLowerCase().includes(term) ||
        (tx.customerPhone || '').toLowerCase().includes(term);

      let matchStatus = true;
      if (statusFilter === 'paid') matchStatus = tx.paymentStatus === 'paid';
      if (statusFilter === 'unpaid') matchStatus = tx.paymentStatus !== 'paid';

      let matchDeposit = true;
      if (depositFilter === 'deposited') matchDeposit = tx.depositStatus === 'deposited';
      if (depositFilter === 'pending') matchDeposit = tx.depositStatus === 'pending';

      let matchMethod = true;
      if (methodFilter !== 'all') matchMethod = tx.paymentMethod === methodFilter;

      let matchSales = true;
      if (salesFilter !== 'all') {
        matchSales = tx.salesPersonId === salesFilter || tx.salesPersonName === salesFilter;
      }

      let matchChannel = true;
      if (channelFilter !== 'all') {
        matchChannel = (tx.channel || 'offline_store') === channelFilter;
      }

      return matchSearch && matchStatus && matchDeposit && matchMethod && matchSales && matchChannel;
    });
  }, [transactions, searchTerm, channelCategory, statusFilter, depositFilter, methodFilter, salesFilter, channelFilter]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Receipt className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Penjualan Online &amp; Offline
              </h2>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Semua data transaksi terintegrasi satu pintu (Toko, Kanvaser &amp; Marketplace)
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Pantau dan kelola seluruh penjualan dari kasir toko fisik, sales kanvaser lapangan, serta pesanan marketplace online (Shopee, Tokopedia, TikTok, Lazada) lengkap dengan nama PIC/Kasir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Receipt className="w-4 h-4 text-blue-500" />
            <span>Total {filteredTransactions.length} dari {transactions.length} Transaksi</span>
          </div>
        </div>
      </div>

      {/* Unified Online vs Offline Filter Pills */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-x-auto text-left">
        <button
          type="button"
          onClick={() => setChannelCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 text-left cursor-pointer whitespace-nowrap ${
            channelCategory === 'all'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 shrink-0" />
          <span className="text-left">Semua Penjualan ({transactions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setChannelCategory('offline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 text-left cursor-pointer whitespace-nowrap ${
            channelCategory === 'offline'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
          <span className="text-left">🏪 Penjualan Offline (Toko &amp; Sales Lapangan)</span>
        </button>

        <button
          type="button"
          onClick={() => setChannelCategory('online')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 text-left cursor-pointer whitespace-nowrap ${
            channelCategory === 'online'
              ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-orange-500" />
          <span className="text-left">🌐 Penjualan Online (Shopee, Tokopedia, TikTok, Lazada)</span>
        </button>
      </div>

      {/* Filter and Search Bar with Dropdown Per-Sales */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari no invoice, nama pelanggan, no pesanan marketplace, atau sales..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown Filter Per-Sales */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Sales:</span>
            <select
              value={salesFilter}
              onChange={(e) => setSalesFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="all">Semua Sales</option>
              {allSalesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Filter Per Saluran Channel */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Saluran:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Saluran (Toko &amp; Online)</option>
              <option value="offline_store">Toko Offline Kasir</option>
              <option value="sales_field">Sales Lapangan</option>
              <option value="shopee">Shopee</option>
              <option value="tokopedia_tiktok">Tokopedia / TikTok Shop</option>
              <option value="lazada">Lazada</option>
            </select>
          </div>

          {/* Deposit Filter */}
          <select
            value={depositFilter}
            onChange={(e) => setDepositFilter(e.target.value as any)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="all">Semua Setoran</option>
            <option value="deposited">Sudah Disetor</option>
            <option value="pending">Belum Disetor (Tertahan)</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="paid">Lunas</option>
            <option value="unpaid">Belum Lunas (Kasbon/Piutang)</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="all">Semua Metode</option>
            <option value="cash">Tunai (Cash)</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer Bank</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice / Saluran</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">PIC / Sales / Kasir</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Total &amp; Fee Sales</th>
                <th className="py-3 px-4">Setoran ke Toko</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const channel = tx.channel || 'offline_store';
                  const chBadge = channelBadges[channel] || channelBadges.offline_store;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {tx.invoiceNumber}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${chBadge.bg} ${chBadge.text}`}>
                            {chBadge.name}
                          </span>
                          {tx.marketplaceOrderNo && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{tx.marketplaceOrderNo}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(tx.date || tx.createdAt).toLocaleDateString('id-ID')}
                        <div className="text-[10px] text-slate-400">
                          {new Date(tx.date || tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{tx.salesPersonName || 'Kasir Toko'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {tx.customerName || 'Pelanggan Umum'}
                        </span>
                        {tx.paymentStatus !== 'paid' && (
                          <div className="text-[10px] font-bold text-rose-500">
                            Kasbon (Belum Lunas)
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(tx.total)}
                        </div>
                        {tx.salesFeeTotal > 0 && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            Fee Sales: +{formatCurrency(tx.salesFeeTotal)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(tx.amountDueToStore || tx.total)}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onToggleDepositStatus(
                              tx.id,
                              tx.depositStatus === 'deposited' ? 'pending' : 'deposited'
                            )
                          }
                          className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            tx.depositStatus === 'deposited'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-200'
                          }`}
                        >
                          {tx.depositStatus === 'deposited' ? '✓ Sudah Disetor' : '⏳ Belum Disetor (Klik Konfirmasi)'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => exportSingleReceiptPDF(business, tx)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                            title="Cetak Struk PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
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

      {/* DETAIL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Rincian Transaksi {selectedTx.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(selectedTx.date || selectedTx.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Saluran Transaksi:</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {selectedTx.channel?.replace('_', ' ') || 'Toko Offline'}
                  </span>
                </div>
                {selectedTx.marketplaceOrderNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. Pesanan Marketplace:</span>
                    <span className="font-mono font-bold text-blue-600">
                      #{selectedTx.marketplaceOrderNo}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Sales Petugas:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedTx.salesPersonName || 'Kasir'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pelanggan:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedTx.customerName || 'Umum'} {selectedTx.customerPhone ? `(${selectedTx.customerPhone})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Metode Bayar:</span>
                  <span className="font-bold uppercase text-slate-900 dark:text-white">
                    {selectedTx.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Daftar Produk Herbal:
                </h4>
                <div className="space-y-1.5">
                  {selectedTx.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{it.name}</span>
                        <div className="text-[11px] text-slate-400">
                          {it.quantity} {it.unit || 'unit'} x {formatCurrency(it.price)}
                          {it.salesFee > 0 && ` • Fee Sales: ${formatCurrency(it.salesFee * it.quantity)}`}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(it.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Transaksi:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {formatCurrency(selectedTx.total)}
                  </span>
                </div>
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                  <span>Fee Komisi Sales:</span>
                  <span className="font-bold">+{formatCurrency(selectedTx.salesFeeTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Laba Bersih Toko Adiguna:</span>
                  <span className="font-bold">+{formatCurrency(selectedTx.storeNetProfit)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Uang Disetor ke Toko:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatCurrency(selectedTx.amountDueToStore || selectedTx.total)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => exportSingleReceiptPDF(business, selectedTx)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Struk PDF</span>
                </button>
                <a
                  href={`https://wa.me/${(selectedTx.customerPhone || '').replace(/[^0-9]/g, '')}?text=${generateWhatsAppReceiptMessage(business, selectedTx)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Struk WA</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
