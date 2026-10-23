import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  History,
  FileSpreadsheet,
  CheckCircle2,
  X,
  PlusCircle,
  BarChart2,
  Camera,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Product, StockMovement } from '../types.ts';
import { formatCurrency, CURRENT_GOVERNMENT_PPN_PERCENT } from '../utils/salesRules.ts';
import { exportStockToExcel } from '../utils/exportUtils.ts';
import { CameraCaptureModal } from './CameraCaptureModal.tsx';

interface InventoryViewProps {
  products: Product[];
  stockMovements: StockMovement[];
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onRestockProduct: (id: string, qty: number, notes?: string) => Promise<void>;
  quickRestockProduct: Product | null;
  onClearQuickRestock: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  stockMovements,
  onSaveProduct,
  onDeleteProduct,
  onRestockProduct,
  quickRestockProduct,
  onClearQuickRestock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [stockFilter, setStockFilter] = useState<'all' | 'critical' | 'safe'>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'audit'>('inventory');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Restock Modal
  const [restockTarget, setRestockTarget] = useState<Product | null>(quickRestockProduct);
  const [restockQty, setRestockQty] = useState<string>('10');
  const [restockNotes, setRestockNotes] = useState<string>('Pengisian stok berkala');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (quickRestockProduct) {
      setRestockTarget(quickRestockProduct);
      setRestockQty('10');
    }
  }, [quickRestockProduct]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['Semua', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term);

      let matchStock = true;
      if (stockFilter === 'critical') matchStock = p.stock <= p.minStockAlert;
      if (stockFilter === 'safe') matchStock = p.stock > p.minStockAlert;

      return matchCat && matchSearch && matchStock;
    });
  }, [products, selectedCategory, searchTerm, stockFilter]);

  const valuation = useMemo(() => {
    const totalAssetValue = products.reduce((sum, p) => sum + p.stock * p.buyPrice, 0);
    const potentialRevenue = products.reduce((sum, p) => sum + p.stock * p.sellPrice, 0);
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
    return { totalAssetValue, potentialRevenue, totalItems };
  }, [products]);

  const handleOpenAdd = () => {
    setEditingProduct({
      code: `HRB-${String(products.length + 1).padStart(3, '0')}`,
      name: '',
      category: 'Herbal Alami',
      buyPrice: 0,
      sellPrice: 0,
      salesFeePerUnit: 5000,
      defaultDiscount: 0,
      usePpn: false,
      ppnPercent: CURRENT_GOVERNMENT_PPN_PERCENT,
      stock: 0,
      minStockAlert: 5,
      unit: 'Botol',
      imageUrl: '',
      barcode: `899${Date.now().toString().slice(-9)}`,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setIsProductModalOpen(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    setIsSubmitting(true);
    await onSaveProduct(editingProduct);
    setIsSubmitting(false);
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleExecuteRestock = async () => {
    if (!restockTarget || Number(restockQty) <= 0) return;
    setIsSubmitting(true);
    await onRestockProduct(restockTarget.id, Number(restockQty), restockNotes);
    setIsSubmitting(false);
    setRestockTarget(null);
    onClearQuickRestock();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Header & Valuation Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Inventaris &amp; Stok Herbal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Katalog produk herbal Adiguna Herba, foto sampul (kamera/upload), fee sales, dan audit pergerakan stok.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span className="text-left">Daftar Stok Herbal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span className="text-left">Audit Mutasi</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => exportStockToExcel(products)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Herbal</span>
          </button>
        </div>
      </div>

      {/* Valuation Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase">
            Total Unit Produk Herbal
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {valuation.totalItems} <span className="text-xs font-normal text-slate-500">unit ({products.length} SKU)</span>
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase">
            Nilai Aset Modal (HPP)
          </span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(valuation.totalAssetValue)}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase">
            Potensi Pendapatan Penjualan
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(valuation.potentialRevenue)}
          </div>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari produk herbal, kode SKU, atau barcode..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Kategori: {c}
                </option>
              ))}
            </select>

            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  stockFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('critical')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  stockFilter === 'critical'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Menipis
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('safe')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  stockFilter === 'safe'
                    ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Aman
              </button>
            </div>
          </div>

          {/* Product Inventory Table with Cover Thumbnails */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Sampul &amp; Nama Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Harga Beli</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4">Fee Sales</th>
                    <th className="py-3 px-4">Sisa Stok</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Tidak ada barang ditemukan sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLow = p.stock <= p.minStockAlert;
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {p.name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  {p.code} • Barcode: {p.barcode || '-'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {p.category}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {formatCurrency(p.buyPrice)}
                          </td>
                          <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(p.sellPrice)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                            +{formatCurrency(p.salesFeePerUnit || 0)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-black text-sm ${
                                isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {p.stock}
                            </span>{' '}
                            <span className="text-[11px] text-slate-400">{p.unit}</span>
                          </td>
                          <td className="py-3 px-4">
                            {p.stock === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-600">
                                Habis
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                Menipis (Min: {p.minStockAlert})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                                Aman
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setRestockTarget(p)}
                                title="Pengisian Stok Cepat"
                                className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 flex items-center gap-1"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Restock</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(p)}
                                title="Edit Produk"
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus produk "${p.name}"?`)) {
                                    onDeleteProduct(p.id);
                                  }
                                }}
                                title="Hapus Produk"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </>
      ) : (
        /* AUDIT MUTASI STOK */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden p-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
            Riwayat Audit Mutasi Stok Barang Herbal
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Catatan mutasi penjualan oleh sales, penambahan restock suplier, dan penyesuaian inventaris.
          </p>

          <div className="space-y-2">
            {stockMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Belum ada rekapan audit pergerakan stok.
              </p>
            ) : (
              stockMovements.map((sm) => (
                <div
                  key={sm.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        sm.type === 'sale'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                          : sm.type === 'restock'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600'
                      }`}
                    >
                      {sm.type === 'sale' ? 'Keluar (Jual)' : sm.type === 'restock' ? 'Masuk (Restock)' : 'Penyesuaian'}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {sm.productName}
                      </span>
                      <p className="text-[11px] text-slate-400">{sm.reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold">
                        {sm.type === 'sale' ? `-${sm.quantity}` : `+${sm.quantity}`}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {sm.previousStock} &rarr; {sm.newStock}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 text-right whitespace-nowrap">
                      {new Date(sm.date).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Produk Herbal with Camera / File Upload */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingProduct.id ? 'Edit Informasi Produk Herbal' : 'Tambah Produk Herbal Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-3.5 text-xs">
              {/* Cover Photo Upload Button & Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {editingProduct.imageUrl ? (
                      <img
                        src={editingProduct.imageUrl}
                        alt="Sampul"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Foto Sampul Produk</h4>
                    <p className="text-[11px] text-slate-400">
                      Upload dari file/drive atau potret langsung via kamera
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>{editingProduct.imageUrl ? 'Ganti Foto' : 'Ambil / Upload Foto'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode SKU:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.code || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Barcode (Opsional):
                  </label>
                  <input
                    type="text"
                    value={editingProduct.barcode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Produk Herbal:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Madu Murni Habbatussauda 500g"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Madu, Minyak, Kapsul..."
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satuan Unit:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Botol, Kotak, Pouch..."
                    value={editingProduct.unit || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Beli (Modal):
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.buyPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, buyPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Jual:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.sellPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellPrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs">
                      Fee Komisi:
                    </label>
                    <div className="inline-flex rounded-lg p-0.5 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800">
                      <button
                        type="button"
                        onClick={() => {
                          const sell = editingProduct.sellPrice || 0;
                          const currentNominal = editingProduct.salesFeePerUnit || 0;
                          const pct = sell > 0 ? Math.round((currentNominal / sell) * 100) : 0;
                          setEditingProduct({
                            ...editingProduct,
                            salesFeeType: 'nominal',
                            salesFeePercent: pct,
                          });
                        }}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold cursor-pointer transition ${
                          (editingProduct.salesFeeType || 'nominal') === 'nominal'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                        }`}
                      >
                        Rp
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sell = editingProduct.sellPrice || 0;
                          const currentNominal = editingProduct.salesFeePerUnit || 0;
                          const pct =
                            editingProduct.salesFeePercent ||
                            (sell > 0 ? Math.round((currentNominal / sell) * 100) : 10);
                          const nominal = Math.round((sell * pct) / 100);
                          setEditingProduct({
                            ...editingProduct,
                            salesFeeType: 'percent',
                            salesFeePercent: pct,
                            salesFeePerUnit: nominal,
                          });
                        }}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold cursor-pointer transition ${
                          editingProduct.salesFeeType === 'percent'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>

                  {(editingProduct.salesFeeType || 'nominal') === 'nominal' ? (
                    <div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-400">Rp</span>
                        <input
                          type="number"
                          min="0"
                          value={editingProduct.salesFeePerUnit || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const sell = editingProduct.sellPrice || 0;
                            const pct = sell > 0 ? Math.round((val / sell) * 100) : 0;
                            setEditingProduct({
                              ...editingProduct,
                              salesFeePerUnit: val,
                              salesFeePercent: pct,
                              salesFeeType: 'nominal',
                            });
                          }}
                          className="w-full pl-8 pr-2 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 font-bold text-indigo-600 dark:text-indigo-400 text-xs"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        ≈ {editingProduct.sellPrice && editingProduct.sellPrice > 0 ? (((editingProduct.salesFeePerUnit || 0) / editingProduct.sellPrice) * 100).toFixed(1) : 0}% dari harga
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={
                            editingProduct.salesFeePercent !== undefined
                              ? editingProduct.salesFeePercent
                              : editingProduct.sellPrice && editingProduct.sellPrice > 0
                              ? Math.round(((editingProduct.salesFeePerUnit || 0) / editingProduct.sellPrice) * 100)
                              : 10
                          }
                          onChange={(e) => {
                            const pct = Math.max(0, Math.min(100, Number(e.target.value)));
                            const sell = editingProduct.sellPrice || 0;
                            const nominal = Math.round((sell * pct) / 100);
                            setEditingProduct({
                              ...editingProduct,
                              salesFeePercent: pct,
                              salesFeePerUnit: nominal,
                              salesFeeType: 'percent',
                            });
                          }}
                          className="w-full pl-2 pr-6 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 font-bold text-indigo-600 dark:text-indigo-400 text-xs"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-400">%</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        = Rp {(editingProduct.salesFeePerUnit || 0).toLocaleString('id-ID')} / unit
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Stok Sekarang:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Peringatan Minimum:
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingProduct.minStockAlert || 5}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStockAlert: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Potongan / Diskon Default (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.defaultDiscount || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, defaultDiscount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="productPpn"
                    checked={editingProduct.usePpn || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, usePpn: e.target.checked, ppnPercent: CURRENT_GOVERNMENT_PPN_PERCENT })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="productPpn" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Kenakan PPN Resmi ({CURRENT_GOVERNMENT_PPN_PERCENT}%)
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Produk Herbal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture / Upload Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        currentImage={editingProduct?.imageUrl}
        onImageSelected={(url) => {
          if (editingProduct) {
            setEditingProduct({ ...editingProduct, imageUrl: url });
          }
        }}
      />

      {/* MODAL: Quick Restock */}
      {restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Pengisian Ulang Stok Herbal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {restockTarget.name} (Stok: <span className="font-bold text-blue-600">{restockTarget.stock} {restockTarget.unit}</span>)
            </p>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Tambahan Stok ({restockTarget.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full text-base font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Restock:
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRestockTarget(null);
                  onClearQuickRestock();
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting || Number(restockQty) <= 0}
                onClick={handleExecuteRestock}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-md shadow-emerald-500/20"
              >
                {isSubmitting ? 'Memproses...' : 'Tambah Stok'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
