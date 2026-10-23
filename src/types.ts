export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';
export type DepositStatus = 'deposited' | 'pending';
export type SalesChannel = 'offline_store' | 'sales_field' | 'shopee' | 'tokopedia_tiktok' | 'lazada';

export interface SalesPerson {
  id: string;
  name: string;
  phone: string;
  role: string;
  defaultCommissionPercent: number;
  totalSales: number;
  totalCommission: number;
  totalStoreProfit: number;
  unpaidDeposit: number;
  active: boolean;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  salesFeeType?: 'nominal' | 'percent'; // Mode komisi Rp atau %
  salesFeePercent?: number; // Persentase komisi jika mode %
  salesFeePerUnit: number; // Fee komisi sales yang diambil per unit (dalam Rp)
  defaultDiscount: number; // Potongan / diskon per produk
  usePpn: boolean; // PPN versi centang
  ppnPercent: number; // PPN resmi pemerintah (11%)
  stock: number;
  minStockAlert: number;
  unit: string;
  barcode: string;
  imageUrl?: string; // Cover photo via upload or camera
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  salesFee: number;
  subtotal: number;
}

export interface TransactionItem {
  productId: string;
  code: string;
  name: string;
  price: number;
  buyPrice: number;
  quantity: number;
  unit: string;
  discount: number;
  salesFee: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  channel: SalesChannel; // 'offline_store' | 'sales_field' | 'shopee' | 'tokopedia_tiktok' | 'lazada'
  marketplaceOrderNo?: string; // Nomor pesanan marketplace
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  
  // Sales Person & Fee & Profit Breakdown
  salesPersonId?: string;
  salesPersonName?: string;
  salesFeeTotal: number; // Fee yang diambil sales
  storeNetProfit: number; // Laba bersih yang diterima toko (Total - HPP - Fee Sales)
  amountDueToStore: number; // Uang yang harus disetor sales ke toko
  depositStatus: DepositStatus; // 'deposited' (sudah disetor) | 'pending' (belum disetor)
  depositedAt?: string;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cashPaid?: number;
  changeDue?: number;
  
  // Kasbon / Tanggungan tracking
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  isKasbon?: boolean;
  dueDate?: string; // YYYY-MM-DD
  settledAt?: string; // Tanggal pelunasan kasbon
  
  notes?: string;
  significantAlertSent?: boolean;
  deviceId?: string;
  accountEmail?: string;
  syncStatus?: 'synced' | 'pending';
  qrisProofUrl?: string;
  transferProofUrl?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  salesPersonId?: string; // Diinput dari room sales mana
  salesPersonName?: string;
  totalSpent: number;
  debtBalance: number; // Saldo kasbon/tanggungan
  lastOrderDate: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'adjustment' | 'return';
  channel?: SalesChannel;
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  reason: string;
  referenceId?: string;
}

export interface AppNotification {
  id: string;
  type: 'low_stock' | 'due_date' | 'big_transaction' | 'sync' | 'deposit';
  title: string;
  message: string;
  date: string;
  read: boolean;
  targetId?: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  accountEmail: string;
  salesPersonName?: string;
  mode: 'sales' | 'admin';
  lastActive: string;
  deviceType: string;
  ip?: string;
}

export interface BusinessSettings {
  businessName: string;
  brandName: string;
  businessPhone: string;
  businessAddress: string;
  businessEmail: string;
  googleAccountEmail: string;
  currency: string;
  governmentPpnPercent: number; // PPN Resmi Pemerintah (11%)
  qrisImage: string;
  qrisNmid: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bigTransactionThreshold: number;
  enablePushAlerts: boolean;
  defaultSalesFeePercent: number;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'yearly' | 'custom';
export type AppWorkspaceMode = 'sales' | 'admin';
