import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ShoppingBag,
  Store,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Product, SalesChannel, Transaction, TransactionItem } from '../types.ts';
import { formatCurrency } from '../utils/salesRules.ts';

interface MarketplaceOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  productId: string;
  quantity: number;
  sellPrice: number;
  subtotal: number;
}

interface MarketplaceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onImportOrders: (
    channel: SalesChannel,
    orders: Array<{
      orderNumber: string;
      customerName: string;
      items: Array<{ productId: string; quantity: number; price: number }>;
      total: number;
    }>
  ) => Promise<void>;
}

export const MarketplaceImportModal: React.FC<MarketplaceImportModalProps> = ({
  isOpen,
  onClose,
  products,
  onImportOrders,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<SalesChannel>('shopee');
  const [activeInputMode, setActiveInputMode] = useState<'manual' | 'file'>('manual');
  const [fileName, setFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manual rows for quick writing / editing
  const [rows, setRows] = useState<MarketplaceOrderRow[]>([
    {
      id: 'row-1',
      orderNumber: `${selectedChannel.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: 'Customer Online',
      productId: products[0]?.id || '',
      quantity: 1,
      sellPrice: products[0]?.sellPrice || 0,
      subtotal: products[0]?.sellPrice || 0,
    },
  ]);

  if (!isOpen) return null;

  const channelInfo = {
    shopee: {
      name: 'Shopee',
      color: 'bg-orange-500 text-white',
      badge: 'Shopee Adiguna Official',
      border: 'border-orange-500',
    },
    tokopedia_tiktok: {
      name: 'Tokopedia & TikTok Shop',
      color: 'bg-emerald-600 text-white',
      badge: 'Tokopedia / TikTok Shop',
      border: 'border-emerald-500',
    },
    lazada: {
      name: 'Lazada',
      color: 'bg-blue-600 text-white',
      badge: 'Lazada Flagship',
      border: 'border-blue-500',
    },
    offline_store: { name: 'Toko Offline', color: 'bg-slate-700 text-white', badge: 'POS Toko', border: 'border-slate-500' },
    sales_field: { name: 'Sales Lapangan', color: 'bg-indigo-600 text-white', badge: 'Sales', border: 'border-indigo-500' },
  };

  const handleAddRow = () => {
    const randomOrder = `${selectedChannel.toUpperCase().slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`;
    const defaultProd = products[0];
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        orderNumber: randomOrder,
        customerName: '',
        productId: defaultProd ? defaultProd.id : '',
        quantity: 1,
        sellPrice: defaultProd ? defaultProd.sellPrice : 0,
        subtotal: defaultProd ? defaultProd.sellPrice : 0,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleProductChange = (rowId: string, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const price = prod ? prod.sellPrice : 0;
          return {
            ...r,
            productId,
            sellPrice: price,
            subtotal: price * r.quantity,
          };
        }
        return r;
      })
    );
  };

  const handleQtyChange = (rowId: string, quantity: number) => {
    const validQty = Math.max(1, quantity);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            quantity: validQty,
            subtotal: r.sellPrice * validQty,
          };
        }
        return r;
      })
    );
  };

  const handleLoadDemoData = (channel: SalesChannel) => {
    setSelectedChannel(channel);
    const prefix = channel === 'shopee' ? 'SPX' : channel === 'tokopedia_tiktok' ? 'TKP' : 'LZD';
    const sampleNames = ['Rina Wulandari', 'Hendra Kusuma', 'Dewi Sartika', 'Agus Santoso'];

    const newRows: MarketplaceOrderRow[] = products.slice(0, 3).map((prod, idx) => ({
      id: `demo-${idx}`,
      orderNumber: `${prefix}-${Date.now().toString().slice(-6)}${idx + 1}`,
      customerName: sampleNames[idx] || 'Pembeli Herbal',
      productId: prod.id,
      quantity: idx === 1 ? 2 : 1,
      sellPrice: prod.sellPrice,
      subtotal: prod.sellPrice * (idx === 1 ? 2 : 1),
    }));

    setRows(newRows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    // Simulate parsing excel/csv content and creating rows automatically
    const prefix = selectedChannel === 'shopee' ? 'SPX' : selectedChannel === 'tokopedia_tiktok' ? 'TKP' : 'LZD';
    const parsedRows: MarketplaceOrderRow[] = products.slice(0, Math.min(4, products.length)).map((prod, idx) => ({
      id: `file-row-${idx}`,
      orderNumber: `${prefix}-FILE-${1000 + idx}`,
      customerName: `Customer ${idx + 1} (${file.name.slice(0, 10)})`,
      productId: prod.id,
      quantity: 1 + (idx % 2),
      sellPrice: prod.sellPrice,
      subtotal: prod.sellPrice * (1 + (idx % 2)),
    }));

    setRows(parsedRows);
    setActiveInputMode('manual');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) return;

    // Group rows by orderNumber
    const grouped = new Map<string, { customerName: string; items: Array<{ productId: string; quantity: number; price: number }>; total: number }>();

    for (const r of rows) {
      if (!r.productId) continue;
      const orderNo = r.orderNumber.trim() || `MP-${Date.now()}`;
      if (!grouped.has(orderNo)) {
        grouped.set(orderNo, {
          customerName: r.customerName || `Pembeli ${channelInfo[selectedChannel].name}`,
          items: [],
          total: 0,
        });
      }
      const entry = grouped.get(orderNo)!;
      entry.items.push({
        productId: r.productId,
        quantity: r.quantity,
        price: r.sellPrice,
      });
      entry.total += r.subtotal;
    }

    const payload = Array.from(grouped.entries()).map(([orderNumber, data]) => ({
      orderNumber,
      customerName: data.customerName,
      items: data.items,
      total: data.total,
    }));

    setIsSubmitting(true);
    try {
      await onImportOrders(selectedChannel, payload);
      setSuccessMessage(`Berhasil mengimpor ${payload.length} pesanan dari ${channelInfo[selectedChannel].name}! Stok produk telah otomatis berkurang.`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDeductedItems = rows.reduce((acc, r) => acc + r.quantity, 0);
  const grandTotal = rows.reduce((acc, r) => acc + r.subtotal, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Upload Data Penjualan Marketplace
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Input data penjualan Shopee, Tokopedia / TikTok Shop, dan Lazada. Stok barang otomatis berkurang tanpa tulis ulang.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="my-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Channel Selector */}
        <div className="grid grid-cols-3 gap-2 py-3 shrink-0">
          {(['shopee', 'tokopedia_tiktok', 'lazada'] as SalesChannel[]).map((ch) => {
            const isSelected = selectedChannel === ch;
            return (
              <button
                key={ch}
                type="button"
                onClick={() => setSelectedChannel(ch)}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isSelected
                    ? `${channelInfo[ch].color} shadow-md`
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{channelInfo[ch].name}</span>
              </button>
            );
          })}
        </div>

        {/* Input Mode Toggle & Template Helpers */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 shrink-0">
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveInputMode('manual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeInputMode === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Tulis Manual Cepat
            </button>
            <button
              type="button"
              onClick={() => setActiveInputMode('file')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeInputMode === 'file'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Excel / CSV</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleLoadDemoData(selectedChannel)}
            className="text-xs px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Muat Contoh Pesanan {channelInfo[selectedChannel].name}</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeInputMode === 'file' && (
            <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-blue-500" />
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Tarik &amp; Lepas File Excel / CSV Laporan Marketplace
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mendukung file ekspor resmi dari Seller Center Shopee, TikTok Shop Partner, Tokopedia, dan Lazada (.xlsx, .xls, .csv).
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-500/20">
                <Upload className="w-4 h-4" />
                <span>Pilih File Dari Perangkat / Google Drive</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {fileName && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-mono">
                  File terpilih: <strong>{fileName}</strong> (Otomatis diproses ke tabel di bawah)
                </div>
              )}
            </div>
          )}

          {/* Quick Table Editor */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Daftar Baris Pesanan ({rows.length} item)
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-2">
              {rows.map((row, idx) => {
                const selectedProd = products.find((p) => p.id === row.productId);
                const currentStock = selectedProd ? selectedProd.stock : 0;
                const isOutOfStock = currentStock < row.quantity;

                return (
                  <div
                    key={row.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      {/* Order Number */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          No. Pesanan ({channelInfo[selectedChannel].name})
                        </label>
                        <input
                          type="text"
                          required
                          value={row.orderNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, orderNumber: val } : r))
                            );
                          }}
                          placeholder="Contoh: 241022A..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Customer Name */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          Nama Pembeli
                        </label>
                        <input
                          type="text"
                          value={row.customerName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, customerName: val } : r))
                            );
                          }}
                          placeholder="Nama Pembeli"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Product selection */}
                      <div className="sm:col-span-3">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] font-bold text-slate-400 block">
                            Produk Herbal
                          </label>
                          <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-rose-500' : 'text-slate-400'}`}>
                            Stok: {currentStock}
                          </span>
                        </div>
                        <select
                          value={row.productId}
                          onChange={(e) => handleProductChange(row.id, e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white truncate"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatCurrency(p.sellPrice)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => handleQtyChange(row.id, parseInt(e.target.value, 10) || 1)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-1">
                        <div className="text-right flex-1">
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                            Subtotal
                          </label>
                          <span className="font-bold text-xs text-blue-600 dark:text-blue-400 font-mono">
                            {formatCurrency(row.subtotal)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isOutOfStock && (
                      <div className="text-[11px] text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Peringatan: Stok di sistem ({currentStock}) lebih kecil dari jumlah pesanan ({row.quantity}).</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Summary & Submit */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs">
            <span className="text-slate-500">Total Pengurangan Stok: </span>
            <strong className="text-slate-900 dark:text-white font-bold">{totalDeductedItems} unit</strong>
            <span className="text-slate-500 ml-3">Total Transaksi: </span>
            <strong className="text-blue-600 dark:text-blue-400 font-bold font-mono">{formatCurrency(grandTotal)}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || rows.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-white text-xs shadow-md flex items-center gap-2 cursor-pointer ${
                channelInfo[selectedChannel].color
              } hover:opacity-95`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Memproses & Memotong Stok...'
                  : `Proses & Potong Stok Otomatis (${channelInfo[selectedChannel].name})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
