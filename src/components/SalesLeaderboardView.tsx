import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  TrendingUp,
  DollarSign,
  Send,
  CheckCircle2,
  Clock,
  Plus,
  UserCheck,
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { SalesPerson, Transaction, BusinessSettings } from '../types.ts';
import {
  formatCurrency,
  calculateSalesLeaderboard,
  generateWhatsAppSalesDepositRecap,
  SalesLeaderboardEntry,
} from '../utils/salesRules.ts';

interface SalesLeaderboardViewProps {
  salesPeople: SalesPerson[];
  transactions: Transaction[];
  business: BusinessSettings;
  onSaveSalesPerson: (sales: Partial<SalesPerson>) => Promise<void>;
  onSettleSalesDeposit: (txId: string) => Promise<void>;
}

export const SalesLeaderboardView: React.FC<SalesLeaderboardViewProps> = ({
  salesPeople,
  transactions,
  business,
  onSaveSalesPerson,
  onSettleSalesDeposit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSalesName, setNewSalesName] = useState('');
  const [newSalesPhone, setNewSalesPhone] = useState('');
  const [newSalesRole, setNewSalesRole] = useState('Sales Lapangan');
  const [newSalesCommission, setNewSalesCommission] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leaderboard ranking
  const leaderboard = useMemo(() => {
    return calculateSalesLeaderboard(transactions, salesPeople);
  }, [transactions, salesPeople]);

  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaderboard, searchTerm]);

  // Overall sales team financial summary
  const teamTotals = useMemo(() => {
    return leaderboard.reduce(
      (acc, s) => {
        acc.totalOmset += s.totalOmset;
        acc.totalSalesFee += s.totalSalesFee;
        acc.totalStoreProfit += s.totalStoreProfit;
        acc.totalPendingDeposit += s.totalPendingDeposit;
        acc.totalDeposited += s.totalDeposited;
        return acc;
      },
      {
        totalOmset: 0,
        totalSalesFee: 0,
        totalStoreProfit: 0,
        totalPendingDeposit: 0,
        totalDeposited: 0,
      }
    );
  }, [leaderboard]);

  const handleCreateSales = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalesName.trim()) return;

    setIsSubmitting(true);
    await onSaveSalesPerson({
      name: newSalesName.trim(),
      phone: newSalesPhone.trim(),
      role: newSalesRole,
      defaultCommissionPercent: Number(newSalesCommission) || 10,
    });
    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setNewSalesName('');
    setNewSalesPhone('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard Kinerja Sales</span>
            </span>
            <span className="text-xs text-slate-400">
              {business.businessName} ({business.brandName})
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Rekapan &amp; Peringkat Sales
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pantau perolehan fee komisi sales, laba bersih toko, dan verifikasi uang setoran sales.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Sales Petugas</span>
        </button>
      </div>

      {/* Aggregate Financial Cards for Sales & Store */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Omset Tim Sales
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(teamTotals.totalOmset)}
          </div>
          <span className="text-[11px] text-slate-400">Semua transaksi sales</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Fee Sales Diambil
          </span>
          <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(teamTotals.totalSalesFee)}
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold">
            Hak komisi para sales
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Laba Diterima Toko
          </span>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(teamTotals.totalStoreProfit)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            Bersih setelah HPP &amp; Fee
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sisa Setoran Belum Masuk
          </span>
          <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(teamTotals.totalPendingDeposit)}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">
            Uang di tangan sales
          </span>
        </div>
      </div>

      {/* Top 3 Sales Podium */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((sales, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={sales.salesPersonId}
                className={`relative p-5 rounded-3xl border flex flex-col justify-between transition ${
                  isFirst
                    ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 dark:border-amber-700/60 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center ${
                        isFirst
                          ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/40'
                          : idx === 1
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white'
                          : 'bg-amber-700/70 text-white'
                      }`}
                    >
                      #{sales.rank}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {sales.transactionCount} Pesanan
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {sales.name}
                  </h3>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {formatCurrency(sales.totalOmset)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Fee Sales:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(sales.totalSalesFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Laba Toko:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(sales.totalStoreProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Belum Disetor:</span>
                    <span
                      className={`font-black ${
                        sales.totalPendingDeposit > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600'
                      }`}
                    >
                      {sales.totalPendingDeposit > 0
                        ? formatCurrency(sales.totalPendingDeposit)
                        : 'Lunas Disetor'}
                    </span>
                  </div>

                  {sales.phone && (
                    <a
                      href={`https://wa.me/${sales.phone.replace(/[^0-9]/g, '')}?text=${generateWhatsAppSalesDepositRecap(business, sales)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Rekap WA ke Sales</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama sales..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Peringkat</th>
                <th className="py-3 px-4">Nama Sales</th>
                <th className="py-3 px-4">Total Omset</th>
                <th className="py-3 px-4">Fee Sales Diambil</th>
                <th className="py-3 px-4">Laba Toko</th>
                <th className="py-3 px-4">Total Setoran</th>
                <th className="py-3 px-4">Status Setoran</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada data sales tercatat.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((sales) => (
                  <tr
                    key={sales.salesPersonId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4 font-black text-sm">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${
                          sales.rank === 1
                            ? 'bg-amber-500 text-white'
                            : sales.rank === 2
                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white'
                            : sales.rank === 3
                            ? 'bg-amber-700/60 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {sales.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {sales.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sales.phone || '-'} • {sales.transactionCount} Transaksi
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-blue-600 dark:text-blue-400">
                      {formatCurrency(sales.totalOmset)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(sales.totalSalesFee)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(sales.totalStoreProfit)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {formatCurrency(sales.totalAmountDue)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sales.totalPendingDeposit === 0
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60'
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60'
                        }`}
                      >
                        {sales.depositStatusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {sales.phone && (
                          <a
                            href={`https://wa.me/${sales.phone.replace(/[^0-9]/g, '')}?text=${generateWhatsAppSalesDepositRecap(business, sales)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                            title="Kirim Rekapan via WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Sales Petugas Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              Tambah Sales Petugas Baru
            </h3>

            <form onSubmit={handleCreateSales} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Sales:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi"
                  value={newSalesName}
                  onChange={(e) => setNewSalesName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor HP / WhatsApp:
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={newSalesPhone}
                  onChange={(e) => setNewSalesPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peran / Wilayah:
                </label>
                <select
                  value={newSalesRole}
                  onChange={(e) => setNewSalesRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Sales Lapangan / Kanvaser">Sales Lapangan / Kanvaser</option>
                  <option value="Sales Counter / Toko">Sales Counter / Toko</option>
                  <option value="Sales Distributor Luar Kota">Sales Distributor Luar Kota</option>
                  <option value="Agen Herbal Mandiri">Agen Herbal Mandiri</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Komisi Default (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={newSalesCommission}
                  onChange={(e) => setNewSalesCommission(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Sales'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
