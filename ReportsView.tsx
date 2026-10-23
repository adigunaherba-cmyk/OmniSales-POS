import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  Search,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import { Transaction, Product, BusinessSettings, ReportPeriod } from '../types.ts';
import {
  formatCurrency,
  filterTransactionsByPeriod,
  calculateFinancialSummary,
} from '../utils/salesRules.ts';
import { exportPeriodicAuditReportPDF, exportTransactionsToExcel } from '../utils/exportUtils.ts';

interface ReportsViewProps {
  transactions: Transaction[];
  products: Product[];
  business: BusinessSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  products,
  business,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [depositFilter, setDepositFilter] = useState<string>('all');

  const periodLabels: Record<ReportPeriod, string> = {
    daily: 'Harian (Hari Ini)',
    weekly: 'Mingguan (7 Hari Terakhir)',
    monthly: 'Bulanan (Bulan Berjalan)',
    quarterly: 'Triwulan (Kuartal 3 Bulan)',
    semester: '6 Bulan (Semester)',
    yearly: 'Tahunan (1 Tahun Penuh)',
    custom: 'Rentang Tanggal Kustom',
  };

  const periodTransactions = useMemo(() => {
    return filterTransactionsByPeriod(
      transactions,
      selectedPeriod,
      customStart,
      customEnd
    );
  }, [transactions, selectedPeriod, customStart, customEnd]);

  const summary = useMemo(() => {
    return calculateFinancialSummary(periodTransactions, products);
  }, [periodTransactions, products]);

  const displayTransactions = useMemo(() => {
    return periodTransactions.filter((tx) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        tx.invoiceNumber.toLowerCase().includes(term) ||
        (tx.customerName || '').toLowerCase().includes(term) ||
        (tx.salesPersonName || '').toLowerCase().includes(term) ||
        (tx.customerPhone || '').toLowerCase().includes(term);

      let matchPayment = true;
      if (paymentFilter === 'cash') matchPayment = tx.paymentMethod === 'cash';
      if (paymentFilter === 'qris') matchPayment = tx.paymentMethod === 'qris';
      if (paymentFilter === 'transfer') matchPayment = tx.paymentMethod === 'transfer';
      if (paymentFilter === 'unpaid') matchPayment = tx.paymentStatus !== 'paid';

      let matchDeposit = true;
      if (depositFilter === 'deposited') matchDeposit = tx.depositStatus === 'deposited';
      if (depositFilter === 'pending') matchDeposit = tx.depositStatus === 'pending';

      return matchSearch && matchPayment && matchDeposit;
    });
  }, [periodTransactions, searchTerm, paymentFilter, depositFilter]);

  const handleExportPDF = () => {
    const label =
      selectedPeriod === 'custom'
        ? `${customStart || 'Awal'} s.d ${customEnd || 'Akhir'}`
        : periodLabels[selectedPeriod];
    exportPeriodicAuditReportPDF(business, periodTransactions, products, label);
  };

  const handleExportExcel = () => {
    const label =
      selectedPeriod === 'custom'
        ? `Laporan_${customStart}_sd_${customEnd}.xlsx`
        : `Laporan_Penjualan_${selectedPeriod}.xlsx`;
    exportTransactionsToExcel(periodTransactions, label);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Page Header & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Rekapan Laporan Penjualan &amp; Audit Keuangan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {business.businessName} ({business.brandName}) • Rekapan Harian, Mingguan, Bulanan, Triwulan, 6 Bulan (Semester), dan Tahunan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Ekspor PDF (Audit)</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Period Selection Tabs - 6 Bulan (Semester) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Pilih Periode Waktu Rekapan:
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-left">
          {(
            [
              'daily',
              'weekly',
              'monthly',
              'quarterly',
              'semester',
              'yearly',
              'custom',
            ] as ReportPeriod[]
          ).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                selectedPeriod === p
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {selectedPeriod === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 font-semibold">Dari:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <span className="text-slate-500 font-semibold">Sampai:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
        )}
      </div>

      {/* Financial Audit Cards including Fee Sales & Store Profit */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Omset
          </span>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(summary.totalRevenue)}
          </div>
          <span className="text-[11px] text-slate-400">
            {summary.totalTransactions} Transaksi
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Fee Sales Diambil
          </span>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(summary.totalSalesFee)}
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold">
            Hak komisi sales
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Laba Bersih Toko
          </span>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(summary.totalStoreProfit)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            Setelah HPP &amp; Fee
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sudah Disetor
          </span>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(summary.totalDeposited)}
          </div>
          <span className="text-[11px] text-slate-400">Kas masuk toko</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sisa Belum Disetor
          </span>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(summary.totalPendingDeposit)}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">
            Perlu disetor sales
          </span>
        </div>
      </div>

      {/* Audit Transaction Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari invoice, pelanggan, atau sales..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={depositFilter}
              onChange={(e) => setDepositFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Status Setoran</option>
              <option value="deposited">Sudah Disetor</option>
              <option value="pending">Belum Disetor</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Metode</option>
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice &amp; Tanggal</th>
                <th className="py-3 px-4">Sales Petugas</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Total Omset</th>
                <th className="py-3 px-4">Fee Sales</th>
                <th className="py-3 px-4">Laba Toko</th>
                <th className="py-3 px-4">Uang Disetor</th>
                <th className="py-3 px-4">Status Setoran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi dalam periode ini.
                  </td>
                </tr>
              ) : (
                displayTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {tx.invoiceNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tx.date || tx.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {tx.salesPersonName || 'Kasir Toko'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {tx.customerName || 'Pelanggan Umum'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-blue-600 dark:text-blue-400">
                      {formatCurrency(tx.total)}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(tx.salesFeeTotal)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(tx.storeNetProfit)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {formatCurrency(tx.amountDueToStore)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.depositStatus === 'deposited'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                        }`}
                      >
                        {tx.depositStatus === 'deposited' ? 'Sudah Disetor' : 'Belum Disetor'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
