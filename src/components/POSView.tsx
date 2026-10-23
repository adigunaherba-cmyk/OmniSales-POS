import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  QrCode,
  CreditCard,
  Banknote,
  Send,
  FileText,
  AlertTriangle,
  User,
  Calendar,
  X,
  Upload,
  Copy,
  Check,
  UserCheck,
  Sparkles,
  DollarSign,
  Package,
  Clock,
  ShoppingCart,
  PanelRight,
  PanelBottom,
  Layers,
  Minimize2,
  ChevronRight,
} from 'lucide-react';
import {
  Product,
  CartItem,
  Customer,
  SalesPerson,
  BusinessSettings,
  PaymentMethod,
  PaymentStatus,
  DepositStatus,
  Transaction,
} from '../types.ts';
import {
  formatCurrency,
  calculateCartTotals,
  generateWhatsAppReceiptMessage,
} from '../utils/salesRules.ts';
import { exportSingleReceiptPDF } from '../utils/exportUtils.ts';

interface POSViewProps {
  products: Product[];
  customers: Customer[];
  salesPeople: SalesPerson[];
  business: BusinessSettings;
  deviceId: string;
  onCheckout: (tx: Partial<Transaction>) => Promise<Transaction | null>;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  customers,
  salesPeople,
  business,
  deviceId,
  onCheckout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  // Sales Person Selection
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState<string>(
    salesPeople[0]?.id || ''
  );

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [depositStatus, setDepositStatus] = useState<DepositStatus>('deposited');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [transferProof, setTransferProof] = useState<string>('');

  // Post Checkout Success Modal
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['Semua', ...Array.from(cats)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Selected Sales Person Object
  const currentSales = useMemo(() => {
    return salesPeople.find((s) => s.id === selectedSalesPersonId) || salesPeople[0];
  }, [salesPeople, selectedSalesPersonId]);

  // Commission mode per cart item (nominal Rp vs percent %)
  const [itemFeeModes, setItemFeeModes] = useState<Record<string, 'nominal' | 'percent'>>({});

  // Flexible cart position & visibility: 'side' | 'bottom' | 'floating'
  const [cartPosition, setCartPosition] = useState<'side' | 'bottom' | 'floating'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kelolaqu_cart_pos');
      if (saved === 'side' || saved === 'bottom' || saved === 'floating') return saved;
    }
    return 'side';
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) return false;
      const saved = localStorage.getItem('kelolaqu_cart_open');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [cartToast, setCartToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  const handleSetCartPosition = (pos: 'side' | 'bottom' | 'floating') => {
    setCartPosition(pos);
    setIsCartOpen(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kelolaqu_cart_pos', pos);
      localStorage.setItem('kelolaqu_cart_open', 'true');
    }
  };

  const handleToggleCartOpen = (openState?: boolean) => {
    setIsCartOpen((prev) => {
      const next = openState !== undefined ? openState : !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kelolaqu_cart_open', String(next));
      }
      return next;
    });
  };

  const getItemFeeMode = (productId: string, defaultType?: 'nominal' | 'percent') => {
    return itemFeeModes[productId] || defaultType || 'nominal';
  };

  const toggleItemFeeMode = (productId: string, targetMode: 'nominal' | 'percent') => {
    setItemFeeModes((prev) => ({ ...prev, [productId]: targetMode }));
    setCart((prev) =>
      prev.map((it) => {
        if (it.product.id === productId) {
          const sellPrice = it.product.sellPrice || 0;
          let feePerUnit = it.product.salesFeePerUnit || 0;
          if (targetMode === 'percent') {
            const pct =
              it.product.salesFeePercent ||
              (sellPrice > 0 ? Math.round((feePerUnit / sellPrice) * 100) : 10);
            feePerUnit = Math.round((sellPrice * pct) / 100);
          }
          return {
            ...it,
            salesFee: feePerUnit * it.quantity,
          };
        }
        return it;
      })
    );
  };

  // Cart calculations with sales fee and store profit
  const totals = useMemo(() => {
    const rawItems = cart.map((it) => {
      const feePerUnit = it.quantity > 0 ? it.salesFee / it.quantity : it.product.salesFeePerUnit || 0;
      return {
        price: it.product.sellPrice,
        buyPrice: it.product.buyPrice,
        quantity: it.quantity,
        discount: it.discount,
        salesFeePerUnit: feePerUnit,
      };
    });
    return calculateCartTotals(
      rawItems,
      globalDiscountPercent,
      taxPercent > 0,
      taxPercent || 11,
      currentSales?.defaultCommissionPercent || 10
    );
  }, [cart, globalDiscountPercent, taxPercent, currentSales]);

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const mode = getItemFeeMode(product.id, product.salesFeeType);
    let feePerUnit = product.salesFeePerUnit || 0;
    if (mode === 'percent') {
      const pct =
        product.salesFeePercent ||
        (product.sellPrice > 0 ? Math.round((feePerUnit / product.sellPrice) * 100) : 10);
      feePerUnit = Math.round((product.sellPrice * pct) / 100);
    }

    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        const newQty = existing.quantity + 1;
        const itemFee = feePerUnit * newQty;
        return prev.map((it) =>
          it.product.id === product.id
            ? {
                ...it,
                quantity: newQty,
                salesFee: itemFee,
                subtotal: newQty * it.product.sellPrice - (it.discount || 0),
              }
            : it
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          discount: 0,
          salesFee: feePerUnit,
          subtotal: product.sellPrice,
        },
      ];
    });

    if (!isCartOpen) {
      setCartToast({
        message: `${product.name} (+1) masuk ke keranjang`,
        visible: true,
      });
      setTimeout(() => {
        setCartToast((prev) => ({ ...prev, visible: false }));
      }, 2000);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.product.id === productId) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > it.product.stock) return it;
            const feePerUnit = it.quantity > 0 ? it.salesFee / it.quantity : it.product.salesFeePerUnit || 0;
            const itemFee = feePerUnit * newQty;
            return {
              ...it,
              quantity: newQty,
              salesFee: itemFee,
              subtotal: newQty * it.product.sellPrice - (it.discount || 0),
            };
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId('');
    setCustomCustomerName('');
    setCustomCustomerPhone('');
  };

  const cashNum = Number(cashReceived) || 0;
  const changeDue = Math.max(0, cashNum - totals.total);

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashReceived(String(totals.total));
    setPaymentStatus('paid');
    setDepositStatus('deposited');
    setIsPaymentModalOpen(true);
  };

  const handleCopyBankAccount = () => {
    navigator.clipboard.writeText(business.bankAccountNumber);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleTransferProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecuteCheckout = async () => {
    if (isSubmitting || cart.length === 0) return;
    setIsSubmitting(true);

    const activeCust = customers.find((c) => c.id === selectedCustomerId);
    const finalCustomerName = activeCust ? activeCust.name : customCustomerName.trim() || 'Pelanggan Umum';
    const finalCustomerPhone = activeCust ? activeCust.phone : customCustomerPhone.trim() || '';

    const transactionPayload: Partial<Transaction> = {
      items: cart.map((it) => ({
        productId: it.product.id,
        code: it.product.code,
        name: it.product.name,
        price: it.product.sellPrice,
        buyPrice: it.product.buyPrice,
        quantity: it.quantity,
        unit: it.product.unit,
        discount: it.discount || 0,
        subtotal: it.subtotal,
        salesFee: it.salesFee,
      })),
      subtotal: totals.itemSubtotal,
      discount: totals.globalDiscount,
      tax: totals.tax,
      total: totals.total,
      
      // Sales Person & Profit details
      salesPersonId: currentSales?.id,
      salesPersonName: currentSales?.name || 'Kasir',
      salesFeeTotal: totals.salesFeeTotal,
      storeNetProfit: totals.storeNetProfit,
      amountDueToStore: totals.amountDueToStore,
      depositStatus,
      depositedAt: depositStatus === 'deposited' ? new Date().toISOString() : undefined,

      paymentMethod,
      paymentStatus,
      cashPaid: paymentMethod === 'cash' ? cashNum : paymentStatus === 'paid' ? totals.total : 0,
      changeDue: paymentMethod === 'cash' ? changeDue : 0,
      customerId: selectedCustomerId || undefined,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      dueDate: paymentStatus !== 'paid' ? dueDate : '',
      notes,
      transferProofUrl: transferProof || undefined,
      deviceId,
    };

    const savedTx = await onCheckout(transactionPayload);
    setIsSubmitting(false);

    if (savedTx) {
      setIsPaymentModalOpen(false);
      setCompletedTx(savedTx);
      clearCart();
    }
  };

  // Render Cart Inner Content
  const renderCartContent = (variant: 'vertical' | 'horizontal' = 'vertical') => {
    const isHorizontal = variant === 'horizontal';

    return (
      <div className={`flex flex-col justify-between h-full ${isHorizontal ? 'w-full' : ''}`}>
        {/* Cart Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  Keranjang ({cart.reduce((s, it) => s + it.quantity, 0)})
                </h2>
                {cart.length > 0 && (
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 sm:hidden">
                    {formatCurrency(totals.total)}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                PIC: <strong className="text-slate-700 dark:text-slate-200">{currentSales?.name || 'Kasir'}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Position Picker inside Cart Header (for desktop) */}
            <div className="hidden md:flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
              <button
                type="button"
                onClick={() => handleSetCartPosition('side')}
                className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                  cartPosition === 'side'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Pindah ke Samping Kanan"
              >
                Samping
              </button>
              <button
                type="button"
                onClick={() => handleSetCartPosition('bottom')}
                className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                  cartPosition === 'bottom'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Pindah ke Bawah (Katalog melebar di atas)"
              >
                Bawah
              </button>
              <button
                type="button"
                onClick={() => handleSetCartPosition('floating')}
                className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                  cartPosition === 'floating'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Pindah ke Melayang / Drawer"
              >
                Melayang
              </button>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Kosongkan keranjang"
              >
                Kosongkan
              </button>
            )}

            {/* Minimize / Hide Cart Button */}
            <button
              type="button"
              onClick={() => handleToggleCartOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Sembunyikan keranjang agar katalog produk lebih luas dan tidak tertutupi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div
          className={`${
            isHorizontal
              ? 'p-3 overflow-y-auto max-h-48 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5'
              : 'flex-1 overflow-y-auto p-3.5 space-y-2.5'
          }`}
        >
          {cart.length === 0 ? (
            <div className={`flex flex-col items-center justify-center text-slate-400 ${isHorizontal ? 'col-span-full py-4' : 'h-48'}`}>
              <span className="text-3xl mb-1">🌿</span>
              <p className="text-sm font-medium">Keranjang masih kosong</p>
              <p className="text-xs text-slate-400 text-center">
                Pilih produk herbal di katalog untuk mulai transaksi
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {item.product.name}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 mt-0.5">
                    <span>{formatCurrency(item.product.sellPrice)} / {item.product.unit}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Komisi:</span>
                      <div className="inline-flex rounded-md p-0.5 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800">
                        <button
                          type="button"
                          onClick={() => toggleItemFeeMode(item.product.id, 'nominal')}
                          title="Hitung komisi dalam Rupiah (Rp)"
                          className={`px-1 rounded text-[9px] font-bold transition cursor-pointer ${
                            getItemFeeMode(item.product.id, item.product.salesFeeType) === 'nominal'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                          }`}
                        >
                          Rp
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleItemFeeMode(item.product.id, 'percent')}
                          title="Hitung komisi dalam Persen (%)"
                          className={`px-1 rounded text-[9px] font-bold transition cursor-pointer ${
                            getItemFeeMode(item.product.id, item.product.salesFeeType) === 'percent'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                          }`}
                        >
                          %
                        </button>
                      </div>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        +{formatCurrency(item.salesFee)}
                        {getItemFeeMode(item.product.id, item.product.salesFeeType) === 'percent' && item.product.sellPrice > 0
                          ? ` (${Math.round((item.salesFee / (item.product.sellPrice * item.quantity)) * 100)}%)`
                          : ''}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="w-7 h-7 ml-1 text-rose-500 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                    title="Hapus dari keranjang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Summary & Checkout Button */}
        <div className={`p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 ${isHorizontal ? 'flex flex-col md:flex-row items-center justify-between gap-4' : 'space-y-2'}`}>
          {/* Discount & Tax Row */}
          <div className={`flex items-center gap-2 text-xs ${isHorizontal ? 'w-full md:w-auto' : ''}`}>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Diskon %:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={globalDiscountPercent || ''}
                onChange={(e) => setGlobalDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                placeholder="0"
                className="w-14 px-2 py-0.5 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">PPN %:</span>
              <input
                type="number"
                min="0"
                max="20"
                value={taxPercent || ''}
                onChange={(e) => setTaxPercent(Math.max(0, Math.min(20, Number(e.target.value))))}
                placeholder="0"
                className="w-14 px-2 py-0.5 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xs"
              />
            </div>
          </div>

          <div className={`${isHorizontal ? 'flex items-center gap-4 text-xs' : 'space-y-1 text-xs text-slate-600 dark:text-slate-400'}`}>
            {!isHorizontal && (
              <div className="flex justify-between">
                <span>Subtotal Penjualan</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatCurrency(totals.itemSubtotal)}
                </span>
              </div>
            )}
            
            {/* Sales Fee */}
            <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40 px-2 py-1 rounded-md gap-2">
              <span>Fee Sales:</span>
              <span>+{formatCurrency(totals.salesFeeTotal)}</span>
            </div>

            {/* Store Profit */}
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/60 dark:bg-emerald-950/40 px-2 py-1 rounded-md gap-2">
              <span>Laba Toko:</span>
              <span>+{formatCurrency(totals.storeNetProfit)}</span>
            </div>

            {/* Total */}
            <div className={`${isHorizontal ? 'text-sm' : 'flex justify-between text-base pt-1 border-t border-slate-200 dark:border-slate-800'} font-black text-slate-900 dark:text-white`}>
              {!isHorizontal && <span>Total Tagihan</span>}
              <span className="text-blue-600 dark:text-blue-400">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleOpenPayment}
            className={`${isHorizontal ? 'w-full md:w-auto px-6' : 'w-full'} py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2`}
          >
            <Banknote className="w-4 h-4" />
            <span>Pilih Pembayaran ({formatCurrency(totals.total)})</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-62px)] overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
      {/* Main Catalog and Optional Side Cart Dock */}
      <div className={`flex flex-1 overflow-hidden min-h-0 ${cartPosition === 'side' && isCartOpen ? 'flex-row' : 'flex-col'}`}>
        
        {/* Product Catalog & Search */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 md:p-6 overflow-hidden min-w-0">
          {/* Top Controls: Search Bar, Cart Toggle, and Position Switcher */}
          <div className="space-y-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari produk herbal (Madu, Habbatussauda, Propolis, SKU)..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs text-xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* Cart Toggle Button */}
              <button
                type="button"
                onClick={() => handleToggleCartOpen()}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                  isCartOpen
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isCartOpen ? 'Sembunyikan keranjang agar katalog produk lebih luas' : 'Buka keranjang'}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Keranjang ({cart.reduce((s, it) => s + it.quantity, 0)})</span>
                {cart.length > 0 && (
                  <span className="hidden sm:inline font-mono font-medium text-[11px] opacity-90">
                    • {formatCurrency(totals.total)}
                  </span>
                )}
              </button>

              {/* Position Switcher for Desktop */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shrink-0">
                <span className="text-[10px] text-slate-400 font-semibold px-1">Posisi:</span>
                <button
                  type="button"
                  onClick={() => handleSetCartPosition('side')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    cartPosition === 'side'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Posisi Samping Kanan"
                >
                  <PanelRight className="w-3.5 h-3.5" />
                  <span>Samping</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetCartPosition('bottom')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    cartPosition === 'bottom'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Posisi Dock Bawah (Katalog melebar di atas)"
                >
                  <PanelBottom className="w-3.5 h-3.5" />
                  <span>Bawah</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetCartPosition('floating')}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    cartPosition === 'floating'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Posisi Melayang / Drawer (Katalog tidak tertutup saat belanja)"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Melayang</span>
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-left">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-left transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid - Wide and dynamic without being blocked */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Tidak ada produk herbal yang cocok.</p>
              </div>
            ) : (
              <div
                className={`grid gap-3 ${
                  cartPosition === 'side' && isCartOpen
                    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                }`}
              >
                {filteredProducts.map((product) => {
                  const inCart = cart.find((it) => it.product.id === product.id);
                  const isOutOfStock = product.stock <= 0;
                  const isLow = product.stock <= product.minStockAlert && !isOutOfStock;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(product)}
                      className={`relative rounded-2xl text-left flex flex-col justify-between transition border overflow-hidden ${
                        isOutOfStock
                          ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer'
                      }`}
                    >
                      {/* Cover Photo */}
                      <div className="relative w-full h-28 sm:h-32 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                            <Package className="w-8 h-8 mb-1" />
                            <span className="text-[10px]">Foto Sampul</span>
                          </div>
                        )}

                        {/* In-cart badge */}
                        {inCart && (
                          <span className="absolute top-2 right-2 bg-blue-600 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                            {inCart.quantity}
                          </span>
                        )}

                        {/* Fee Sales Badge */}
                        {product.salesFeePerUnit ? (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
                            Fee: +{formatCurrency(product.salesFeePerUnit)}
                          </span>
                        ) : null}
                      </div>

                      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between text-left">
                        <div className="text-left">
                          <div className="flex items-center justify-between mb-1 text-left">
                            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider text-left">
                              {product.code}
                            </span>
                            {isOutOfStock ? (
                              <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-sm">
                                Habis
                              </span>
                            ) : isLow ? (
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Sisa {product.stock}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
                                Stok: {product.stock}
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 mb-1 text-left">
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
                            {product.category} • {product.unit}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-left">
                          <span className="font-black text-xs sm:text-sm text-blue-600 dark:text-blue-400 text-left">
                            {formatCurrency(product.sellPrice)}
                          </span>
                          <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CART VARIANT 1: Side Dock (Desktop Only) */}
        {cartPosition === 'side' && isCartOpen && (
          <aside className="hidden lg:flex w-96 xl:w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col justify-between h-full z-10 transition-all shadow-md">
            {renderCartContent('vertical')}
          </aside>
        )}
      </div>

      {/* CART VARIANT 2: Bottom Dock (Desktop Only) */}
      {cartPosition === 'bottom' && isCartOpen && (
        <div className="hidden lg:block w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl z-20 transition-all">
          {renderCartContent('horizontal')}
        </div>
      )}

      {/* CART VARIANT 3: Slide-over Drawer / Modal (Floating Mode on Desktop, OR ANY Mobile Device) */}
      {isCartOpen && (cartPosition === 'floating' || typeof window !== 'undefined') && (
        <div
          className={`${cartPosition === 'floating' ? 'flex' : 'lg:hidden flex'} fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs justify-end animate-in fade-in duration-150`}
          onClick={() => handleToggleCartOpen(false)}
        >
          <div
            className="w-full sm:w-[450px] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 border-l border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {renderCartContent('vertical')}
          </div>
        </div>
      )}

      {/* FLOATING ACTION PILL: Appears when cart is closed, or in floating mode */}
      {(!isCartOpen || cartPosition === 'floating') && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => handleToggleCartOpen(true)}
            className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-5 rounded-2xl shadow-xl shadow-emerald-600/35 border border-emerald-400/40 cursor-pointer transition transform hover:scale-105 active:scale-95"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cart.reduce((s, it) => s + it.quantity, 0) > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {cart.reduce((s, it) => s + it.quantity, 0)}
                </span>
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-black">
                Keranjang ({cart.reduce((s, it) => s + it.quantity, 0)})
              </div>
              <div className="text-[11px] opacity-90">{formatCurrency(totals.total)}</div>
            </div>
            <span className="ml-1 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
              Buka <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      )}

      {/* MINI TOAST NOTIFICATION when adding items while cart is hidden */}
      {cartToast.visible && (
        <div className="fixed bottom-20 right-5 sm:right-6 z-40 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{cartToast.message}</span>
        </div>
      )}

      {/* MODAL: Payment Process */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Proses Pembayaran &amp; Setoran
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 mb-4 text-center">
              <span className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">
                Total Tagihan Belanja Pelanggan
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
                {formatCurrency(totals.total)}
              </div>
            </div>

            {/* Fee Sales and Store Deposit Breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">PIC / Petugas Penanggung Jawab:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentSales?.name || 'Kasir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Fee Komisi Sales:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totals.salesFeeTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Laba Diterima Toko:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.storeNetProfit)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">Uang Yang Harus Disetor ke Toko:</span>
                <span className="font-black text-blue-600 dark:text-blue-400">{formatCurrency(totals.amountDueToStore)}</span>
              </div>
            </div>

            {/* PIC / Sales / Kasir Selector */}
            <div className="mb-4 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Petugas PIC / Sales / Kasir Penanggung Jawab:</span>
              </label>
              <select
                value={selectedSalesPersonId}
                onChange={(e) => setSelectedSalesPersonId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              >
                {salesPeople.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role} - Komisi {s.defaultCommissionPercent}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Data (Auto-linked to PIC on input) */}
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Data Pelanggan (Otomatis Terhubung Sekali Input):</span>
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                  Tersambung ke PIC
                </span>
              </div>
              <div className="space-y-2">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCustomerId(id);
                    if (id) {
                      const c = customers.find((cust) => cust.id === id);
                      if (c) {
                        setCustomCustomerName(c.name);
                        setCustomCustomerPhone(c.phone);
                      }
                    }
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Dari Pelanggan Terdaftar atau Ketik Baru --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - PIC: {c.salesPersonName || 'Kasir'} {c.debtBalance > 0 ? `[Hutang: ${formatCurrency(c.debtBalance)}]` : ''}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Pelanggan / Toko..."
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="No. WhatsApp (08xxx)..."
                    value={customCustomerPhone}
                    onChange={(e) => setCustomCustomerPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Pilih Metode Pembayaran Pelanggan:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'cash'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs">Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'qris'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs">QRIS Digital</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'transfer'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Transfer Bank</span>
                </button>
              </div>
            </div>

            {/* Cash details */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Uang Tunai Diterima (Rp):
                  </label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full text-lg font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Kembalian:</span>
                  <span
                    className={`font-bold ${
                      cashNum < totals.total ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {cashNum < totals.total
                      ? `Kurang ${formatCurrency(totals.total - cashNum)}`
                      : formatCurrency(changeDue)}
                  </span>
                </div>
              </div>
            )}

            {/* Setoran Status Toggle: Sudah Disetor vs Belum Disetor */}
            <div className="mb-4 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-950/30">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Status Uang Setoran Sales ke Toko ({formatCurrency(totals.amountDueToStore)}):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDepositStatus('deposited')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    depositStatus === 'deposited'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Sudah Disetor ke Toko</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepositStatus('pending')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    depositStatus === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Belum Disetor (Di Sales)</span>
                </button>
              </div>
            </div>

            {/* Payment Status: Paid vs Unpaid */}
            <div className="mb-4 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Status Pembayaran Pelanggan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('paid')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Sudah Lunas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus('unpaid')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    paymentStatus === 'unpaid'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Belum Bayar (Piutang)</span>
                </button>
              </div>

              {paymentStatus === 'unpaid' && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                    Tenggat Waktu Jatuh Tempo:
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Confirm Payment Button */}
            <button
              type="button"
              disabled={isSubmitting || (paymentMethod === 'cash' && cashNum < totals.total && paymentStatus === 'paid')}
              onClick={handleExecuteCheckout}
              className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Menyimpan Transaksi...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Selesaikan &amp; Cetak Struk</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Post-Transaction Success & Receipt Sharing */}
      {completedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Transaksi Berhasil Dicatat!
            </h3>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
              {completedTx.invoiceNumber}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white my-2">
              {formatCurrency(completedTx.total)}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-left text-xs space-y-1 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Sales:</span>
                <span className="font-semibold">{completedTx.salesPersonName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-600 font-semibold">Fee Sales:</span>
                <span className="font-bold text-indigo-600">{formatCurrency(completedTx.salesFeeTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600 font-semibold">Laba Toko:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(completedTx.storeNetProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Setoran:</span>
                <span className={`font-bold ${completedTx.depositStatus === 'deposited' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {completedTx.depositStatus === 'deposited' ? 'Sudah Disetor' : 'Belum Disetor'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`https://wa.me/${(completedTx.customerPhone || '').replace(/[^0-9]/g, '')}?text=${generateWhatsAppReceiptMessage(business, completedTx)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Struk via WhatsApp Pelanggan</span>
              </a>

              <button
                type="button"
                onClick={() => exportSingleReceiptPDF(business, completedTx)}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh / Cetak Struk PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setCompletedTx(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 pt-2"
              >
                Transaksi Baru &gt;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
