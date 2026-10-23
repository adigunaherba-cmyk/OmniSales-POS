import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  MapPin,
  Clock,
  Send,
  Calendar,
  CreditCard,
  CheckCircle,
  FileText,
  X,
  Edit2,
  ExternalLink,
  UserCheck,
  Package,
  AlertCircle,
  Receipt,
  BadgeCheck,
} from 'lucide-react';
import { Customer, Transaction, BusinessSettings, SalesPerson } from '../types.ts';
import {
  formatCurrency,
  generateWhatsAppReminderMessage,
  checkOverdueStatus,
} from '../utils/salesRules.ts';

interface CustomersViewProps {
  customers: Customer[];
  transactions: Transaction[];
  salesPeople: SalesPerson[];
  business: BusinessSettings;
  onSaveCustomer: (customer: Partial<Customer>) => Promise<void>;
  onMarkInvoicePaid: (txId: string) => Promise<void>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  transactions,
  salesPeople,
  business,
  onSaveCustomer,
  onMarkInvoicePaid,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string>('all'); // 'all' or salesPersonId
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Edit modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered customer list by Sheet (Sales person), search, and debt status
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Sheet filter: all vs per sales
      if (activeSheet !== 'all' && c.salesPersonId !== activeSheet) {
        return false;
      }

      const term = searchTerm.toLowerCase();
      const matchSearch =
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        (c.address || '').toLowerCase().includes(term) ||
        (c.salesPersonName || '').toLowerCase().includes(term);

      const matchDebt = filterDebtOnly ? c.debtBalance > 0 : true;
      return matchSearch && matchDebt;
    });
  }, [customers, activeSheet, searchTerm, filterDebtOnly]);

  // Total debt count & amount across current sheet
  const sheetStats = useMemo(() => {
    const relevantCustomers =
      activeSheet === 'all'
        ? customers
        : customers.filter((c) => c.salesPersonId === activeSheet);

    const totalCust = relevantCustomers.length;
    const debtCustCount = relevantCustomers.filter((c) => c.debtBalance > 0).length;
    const totalDebtAmount = relevantCustomers.reduce((sum, c) => sum + (c.debtBalance || 0), 0);
    const totalSpentAmount = relevantCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    return { totalCust, debtCustCount, totalDebtAmount, totalSpentAmount };
  }, [customers, activeSheet]);

  // Customer transactions history
  const activeCustomerTransactions = useMemo(() => {
    if (!selectedCustomer) return [];
    return transactions.filter(
      (tx) =>
        tx.customerId === selectedCustomer.id ||
        (tx.customerPhone && tx.customerPhone === selectedCustomer.phone)
    );
  }, [selectedCustomer, transactions]);

  // For each customer, find latest transaction for quick kasbon/product reference
  const getCustomerLatestTx = (cust: Customer): Transaction | undefined => {
    return transactions.find(
      (t) => t.customerId === cust.id || (t.customerPhone && t.customerPhone === cust.phone)
    );
  };

  const handleOpenEdit = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer({ ...c });
    setIsCustomerModalOpen(true);
  };

  const handleOpenAddCustomer = () => {
    const sp = salesPeople.find((s) => s.id === activeSheet) || salesPeople[0];
    setEditingCustomer({
      id: `cust-${Date.now()}`,
      name: '',
      phone: '',
      address: '',
      salesPersonId: sp?.id || '',
      salesPersonName: sp?.name || 'Kasir Toko',
      totalSpent: 0,
      debtBalance: 0,
      lastOrderDate: new Date().toISOString(),
      notes: '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name || !editingCustomer.phone) return;

    setIsSubmitting(true);
    await onSaveCustomer(editingCustomer);
    setIsSubmitting(false);
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Header with Add Customer button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Data Pelanggan &amp; Pemantau Kasbon / Tanggungan
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Setiap pelanggan tersambung otomatis dengan nama PIC/Sales/Kasir penanggung jawab. Pantau saldo piutang, produk yang diambil, dan jatuh tempo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddCustomer}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>+ Tambah Pelanggan</span>
          </button>

          {/* Quick Summary Pill */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2.5 px-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Total Piutang Berjalan</span>
              <strong className="text-rose-600 dark:text-rose-400 font-black text-sm">
                {formatCurrency(sheetStats.totalDebtAmount)}
              </strong>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Pelanggan Kasbon</span>
              <strong className="text-slate-900 dark:text-white font-bold text-sm">
                {sheetStats.debtCustCount} dari {sheetStats.totalCust}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sheets per Sales Person and "Semua Pelanggan" */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-left">
        <button
          type="button"
          onClick={() => setActiveSheet('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap text-left transition flex items-center gap-2 cursor-pointer ${
            activeSheet === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="text-left">Semua Pelanggan ({customers.length})</span>
        </button>

        {salesPeople.map((sp) => {
          const count = customers.filter((c) => c.salesPersonId === sp.id).length;
          const debtCount = customers.filter((c) => c.salesPersonId === sp.id && c.debtBalance > 0).length;
          const isSelected = activeSheet === sp.id;
          return (
            <button
              key={sp.id}
              type="button"
              onClick={() => setActiveSheet(sp.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap text-left transition flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="text-left">Sheet {sp.name} ({count})</span>
              {debtCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                }`}>
                  {debtCount} Kasbon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Debt Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pelanggan, nomor WhatsApp, alamat, atau sales..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterDebtOnly(!filterDebtOnly)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterDebtOnly
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Hanya yang Memiliki Kasbon / Hutang ({sheetStats.debtCustCount})</span>
        </button>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tidak ada data pelanggan di sheet ini.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Pelanggan baru otomatis tersimpan saat sales menginput pesanan di Ruang Kerja Sales masing-masing.
            </p>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const hasDebt = cust.debtBalance > 0;
            const latestTx = getCustomerLatestTx(cust);
            const overdue = latestTx?.dueDate
              ? checkOverdueStatus(latestTx.dueDate, latestTx.paymentStatus)
              : null;

            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition cursor-pointer flex flex-col justify-between shadow-xs ${
                  hasDebt
                    ? 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {cust.name}
                        </h3>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>PIC: {cust.salesPersonName || 'Kasir Toko'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-mono">{cust.phone}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(cust, e)}
                      title="Edit Alamat & Catatan"
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                    <span>{cust.address || 'Alamat belum dicatat'}</span>
                  </div>

                  {/* Kasbon Details Box */}
                  <div className={`p-3 rounded-2xl mb-3 text-xs ${
                    hasDebt
                      ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50'
                      : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-500">Status Kasbon / Pembayaran:</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        hasDebt ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {hasDebt ? 'Belum Lunas' : 'Lunas (Tidak Ada Hutang)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 text-[11px]">Metode Pembayaran:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                        {latestTx?.paymentMethod || 'Tunai (Cash)'}
                      </span>
                    </div>

                    {latestTx?.items && latestTx.items.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Produk Herbal Terakhir Diambil:</span>
                        <div className="flex flex-wrap gap-1">
                          {latestTx.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300"
                            >
                              {it.quantity}x {it.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {latestTx?.dueDate && hasDebt && (
                      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        <span>Jatuh Tempo:</span>
                        <span>{latestTx.dueDate} ({overdue?.label})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Saldo Tanggungan:</span>
                    <span
                      className={`font-black text-sm ${
                        hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {hasDebt ? formatCurrency(cust.debtBalance) : 'Rp 0 (Lunas)'}
                    </span>
                  </div>

                  {hasDebt && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {latestTx && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkInvoicePaid(latestTx.id);
                          }}
                          className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                        >
                          <BadgeCheck className="w-3.5 h-3.5" />
                          <span>Tandai Lunas</span>
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=${generateWhatsAppReminderMessage(business, cust)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CUSTOMER DETAIL & TRANSACTION HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Rincian Profil &amp; Riwayat Belanja
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedCustomer.name} • {selectedCustomer.phone} {selectedCustomer.salesPersonName ? `• Sales: ${selectedCustomer.salesPersonName}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 mb-5 text-xs">
              <div>
                <span className="text-slate-400 font-semibold">Total Belanja:</span>
                <p className="font-black text-sm text-slate-900 dark:text-white">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Sisa Tagihan / Kasbon:</span>
                <p className={`font-black text-sm ${selectedCustomer.debtBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(selectedCustomer.debtBalance)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Terakhir Belanja:</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedCustomer.lastOrderDate ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>

            {/* Transaction History Table */}
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Daftar Pesanan &amp; Kasbon Produk Herbal ({activeCustomerTransactions.length})
            </h4>

            <div className="space-y-2 mb-5">
              {activeCustomerTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Belum ada transaksi tercatat untuk pelanggan ini.
                </p>
              ) : (
                activeCustomerTransactions.map((tx) => {
                  const overdue = checkOverdueStatus(tx.dueDate, tx.paymentStatus);
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {tx.invoiceNumber}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(tx.date || tx.createdAt).toLocaleDateString('id-ID')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                            {tx.paymentMethod}
                          </span>
                        </div>

                        {/* Items taken */}
                        <div className="mt-1 space-y-0.5">
                          {tx.items?.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-300">
                              • <span className="font-bold">{it.quantity}x</span> {it.name} ({formatCurrency(it.price)})
                            </div>
                          ))}
                        </div>

                        {tx.dueDate && tx.paymentStatus !== 'paid' && (
                          <div className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Jatuh Tempo: {tx.dueDate} ({overdue.label})</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {formatCurrency(tx.total)}
                          </span>
                          <div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                tx.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {tx.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                            </span>
                          </div>
                        </div>

                        {tx.paymentStatus !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => onMarkInvoicePaid(tx.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                          >
                            Tandai Lunas
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {isCustomerModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Data Pelanggan
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pelanggan:
                </label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp:
                </label>
                <input
                  type="tel"
                  required
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap:
                </label>
                <textarea
                  rows={2}
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Petugas PIC / Sales / Kasir Penanggung Jawab:</span>
                </label>
                <select
                  value={editingCustomer.salesPersonId || ''}
                  onChange={(e) => {
                    const sp = salesPeople.find((s) => s.id === e.target.value);
                    setEditingCustomer({
                      ...editingCustomer,
                      salesPersonId: e.target.value,
                      salesPersonName: sp?.name || 'Kasir Toko',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs"
                >
                  <option value="">Kasir Toko Pusat</option>
                  {salesPeople.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
