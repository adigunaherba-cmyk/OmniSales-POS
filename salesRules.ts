import {
  Transaction,
  Product,
  ReportPeriod,
  BusinessSettings,
  PaymentStatus,
  Customer,
  SalesPerson,
  SalesChannel,
} from '../types.ts';

export const CURRENT_GOVERNMENT_PPN_PERCENT = 11; // PPN resmi pemerintah saat ini 11%

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function calculateCartTotals(
  items: {
    price: number;
    buyPrice?: number;
    quantity: number;
    discount?: number;
    salesFeePerUnit?: number;
    usePpn?: boolean;
    ppnPercent?: number;
  }[],
  globalDiscountPercent: number = 0,
  applyGlobalPpn: boolean = false,
  globalPpnPercent: number = CURRENT_GOVERNMENT_PPN_PERCENT,
  salesCommissionPercent: number = 0
) {
  let itemSubtotal = 0;
  let totalHpp = 0;
  let baseSalesFee = 0;
  let calculatedTax = 0;

  items.forEach((item) => {
    const itemDiscount = item.discount || 0;
    const itemTotal = item.price * item.quantity - itemDiscount;
    itemSubtotal += Math.max(0, itemTotal);
    totalHpp += (item.buyPrice || 0) * item.quantity;

    if (item.salesFeePerUnit) {
      baseSalesFee += item.salesFeePerUnit * item.quantity;
    }

    // PPN versi centang per item
    if (item.usePpn) {
      const taxRate = item.ppnPercent || globalPpnPercent;
      calculatedTax += Math.round((Math.max(0, itemTotal) * taxRate) / 100);
    }
  });

  const globalDiscount = Math.round(
    (itemSubtotal * Math.min(100, Math.max(0, globalDiscountPercent))) / 100
  );
  const taxableAmount = Math.max(0, itemSubtotal - globalDiscount);

  // If global PPN toggle is checked
  if (applyGlobalPpn && calculatedTax === 0) {
    calculatedTax = Math.round((taxableAmount * globalPpnPercent) / 100);
  }

  const total = taxableAmount + calculatedTax;

  let finalSalesFee = baseSalesFee;
  if (finalSalesFee === 0 && salesCommissionPercent > 0) {
    finalSalesFee = Math.round((itemSubtotal * salesCommissionPercent) / 100);
  }

  const storeNetProfit = Math.max(0, total - totalHpp - finalSalesFee);
  const amountDueToStore = Math.max(0, total - finalSalesFee);

  return {
    itemSubtotal,
    globalDiscount,
    tax: calculatedTax,
    total,
    totalHpp,
    salesFeeTotal: finalSalesFee,
    storeNetProfit,
    amountDueToStore,
  };
}

export function isLowStock(stock: number, minStockAlert: number): boolean {
  return stock <= minStockAlert;
}

export function isSignificantTransaction(total: number, threshold: number = 500000): boolean {
  return total >= threshold;
}

export function checkOverdueStatus(
  dueDateStr?: string,
  status?: PaymentStatus,
  refDate: Date = new Date()
): { isOverdue: boolean; daysDiff: number; label: string; badgeColor: string } {
  if (status === 'paid' || !dueDateStr) {
    return { isOverdue: false, daysDiff: 0, label: 'Lunas', badgeColor: 'green' };
  }

  const targetDate = new Date(dueDateStr);
  const current = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const due = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffTime = due.getTime() - current.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    return {
      isOverdue: true,
      daysDiff,
      label: `Jatuh tempo (${Math.abs(daysDiff)} hari lewat)`,
      badgeColor: 'red',
    };
  } else if (daysDiff === 0) {
    return {
      isOverdue: false,
      daysDiff,
      label: 'Jatuh tempo Hari Ini',
      badgeColor: 'amber',
    };
  } else if (daysDiff <= 3) {
    return {
      isOverdue: false,
      daysDiff,
      label: `${daysDiff} hari lagi`,
      badgeColor: 'orange',
    };
  } else {
    return {
      isOverdue: false,
      daysDiff,
      label: `${daysDiff} hari lagi`,
      badgeColor: 'blue',
    };
  }
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: ReportPeriod,
  customStartDate?: string,
  customEndDate?: string,
  refDate: Date = new Date()
): Transaction[] {
  const now = new Date(refDate);

  return transactions.filter((tx) => {
    const txDate = new Date(tx.date || tx.createdAt);

    switch (period) {
      case 'daily': {
        return (
          txDate.getDate() === now.getDate() &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      case 'weekly': {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= oneWeekAgo && txDate <= now;
      }
      case 'monthly': {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      case 'quarterly': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const txQuarter = Math.floor(txDate.getMonth() / 3);
        return txDate.getFullYear() === now.getFullYear() && txQuarter === currentQuarter;
      }
      case 'semester': {
        const currentSemester = Math.floor(now.getMonth() / 6);
        const txSemester = Math.floor(txDate.getMonth() / 6);
        return txDate.getFullYear() === now.getFullYear() && txSemester === currentSemester;
      }
      case 'yearly': {
        return txDate.getFullYear() === now.getFullYear();
      }
      case 'custom': {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate) : new Date(0);
        const end = customEndDate ? new Date(customEndDate) : new Date(9999, 11, 31);
        end.setHours(23, 59, 59, 999);
        return txDate >= start && txDate <= end;
      }
      default:
        return true;
    }
  });
}

export function calculateFinancialSummary(
  transactions: Transaction[],
  products: Product[] = []
) {
  const productBuyPriceMap = new Map<string, number>();
  products.forEach((p) => {
    productBuyPriceMap.set(p.id, p.buyPrice || 0);
  });

  let totalRevenue = 0;
  let totalCost = 0;
  let totalSalesFee = 0;
  let totalStoreProfit = 0;
  let totalItemsSold = 0;
  let totalUnpaidDebt = 0;
  let totalDeposited = 0;
  let totalPendingDeposit = 0;

  transactions.forEach((tx) => {
    totalRevenue += tx.total || 0;
    totalSalesFee += tx.salesFeeTotal || 0;

    let txHpp = 0;
    tx.items?.forEach((item) => {
      totalItemsSold += item.quantity || 0;
      const buyPrice = item.buyPrice || productBuyPriceMap.get(item.productId) || 0;
      txHpp += buyPrice * (item.quantity || 0);
    });
    totalCost += txHpp;

    const netProfit =
      tx.storeNetProfit !== undefined
        ? tx.storeNetProfit
        : Math.max(0, tx.total - txHpp - (tx.salesFeeTotal || 0));
    totalStoreProfit += netProfit;

    if (tx.paymentStatus !== 'paid' || tx.isKasbon) {
      const unpaid = Math.max(0, tx.total - (tx.cashPaid || 0));
      totalUnpaidDebt += unpaid;
    }

    if (tx.depositStatus === 'deposited') {
      totalDeposited += tx.amountDueToStore || (tx.total - (tx.salesFeeTotal || 0));
    } else {
      totalPendingDeposit += tx.amountDueToStore || (tx.total - (tx.salesFeeTotal || 0));
    }
  });

  const grossProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? (totalStoreProfit / totalRevenue) * 100 : 0;
  const averageOrderValue = transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0;

  return {
    totalTransactions: transactions.length,
    totalRevenue,
    totalCost,
    grossProfit,
    totalSalesFee,
    totalStoreProfit,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    totalItemsSold,
    totalUnpaidDebt,
    totalDeposited,
    totalPendingDeposit,
    averageOrderValue,
  };
}

export interface ChannelBreakdown {
  channel: SalesChannel;
  label: string;
  revenue: number;
  ordersCount: number;
  itemsSold: number;
  cost: number;
  profit: number;
}

export function calculateChannelBreakdown(transactions: Transaction[], products: Product[] = []): {
  offline: ChannelBreakdown;
  salesField: ChannelBreakdown;
  shopee: ChannelBreakdown;
  tokopediaTiktok: ChannelBreakdown;
  lazada: ChannelBreakdown;
  totalOnlineRevenue: number;
  totalOfflineRevenue: number;
  totalOnlineOrders: number;
  totalOfflineOrders: number;
} {
  const productCostMap = new Map<string, number>();
  products.forEach((p) => productCostMap.set(p.id, p.buyPrice || 0));

  const createEmpty = (channel: SalesChannel, label: string): ChannelBreakdown => ({
    channel,
    label,
    revenue: 0,
    ordersCount: 0,
    itemsSold: 0,
    cost: 0,
    profit: 0,
  });

  const offline = createEmpty('offline_store', 'Toko Offline (Kasir)');
  const salesField = createEmpty('sales_field', 'Sales Lapangan / Kanvaser');
  const shopee = createEmpty('shopee', 'Shopee Online');
  const tokopediaTiktok = createEmpty('tokopedia_tiktok', 'Tokopedia & TikTok Shop');
  const lazada = createEmpty('lazada', 'Lazada Online');

  transactions.forEach((tx) => {
    let target = offline;
    if (tx.channel === 'sales_field') target = salesField;
    else if (tx.channel === 'shopee') target = shopee;
    else if (tx.channel === 'tokopedia_tiktok') target = tokopediaTiktok;
    else if (tx.channel === 'lazada') target = lazada;

    target.revenue += tx.total || 0;
    target.ordersCount += 1;

    let txCost = 0;
    tx.items?.forEach((it) => {
      target.itemsSold += it.quantity || 0;
      const unitCost = it.buyPrice || productCostMap.get(it.productId) || 0;
      txCost += unitCost * (it.quantity || 0);
    });
    target.cost += txCost;
    target.profit += Math.max(0, (tx.total || 0) - txCost - (tx.salesFeeTotal || 0));
  });

  const totalOnlineRevenue = shopee.revenue + tokopediaTiktok.revenue + lazada.revenue;
  const totalOfflineRevenue = offline.revenue + salesField.revenue;
  const totalOnlineOrders = shopee.ordersCount + tokopediaTiktok.ordersCount + lazada.ordersCount;
  const totalOfflineOrders = offline.ordersCount + salesField.ordersCount;

  return {
    offline,
    salesField,
    shopee,
    tokopediaTiktok,
    lazada,
    totalOnlineRevenue,
    totalOfflineRevenue,
    totalOnlineOrders,
    totalOfflineOrders,
  };
}

export interface SalesLeaderboardEntry {
  rank: number;
  salesPersonId: string;
  name: string;
  phone: string;
  transactionCount: number;
  totalOmset: number;
  totalSalesFee: number;
  totalStoreProfit: number;
  totalAmountDue: number;
  totalDeposited: number;
  totalPendingDeposit: number;
  depositStatusLabel: string;
  depositBadgeColor: string;
}

export function calculateSalesLeaderboard(
  transactions: Transaction[],
  knownSalesPeople: SalesPerson[] = []
): SalesLeaderboardEntry[] {
  const map = new Map<
    string,
    {
      salesPersonId: string;
      name: string;
      phone: string;
      transactionCount: number;
      totalOmset: number;
      totalSalesFee: number;
      totalStoreProfit: number;
      totalAmountDue: number;
      totalDeposited: number;
      totalPendingDeposit: number;
    }
  >();

  knownSalesPeople.forEach((sp) => {
    map.set(sp.id, {
      salesPersonId: sp.id,
      name: sp.name,
      phone: sp.phone,
      transactionCount: 0,
      totalOmset: 0,
      totalSalesFee: 0,
      totalStoreProfit: 0,
      totalAmountDue: 0,
      totalDeposited: 0,
      totalPendingDeposit: 0,
    });
  });

  transactions.forEach((tx) => {
    // Only count transactions handled by sales or offline staff
    if (tx.channel === 'shopee' || tx.channel === 'tokopedia_tiktok' || tx.channel === 'lazada') {
      return;
    }

    const id = tx.salesPersonId || 'sales-general';
    const name = tx.salesPersonName || 'Kasir / Sales Toko';

    let entry = map.get(id);
    if (!entry) {
      entry = {
        salesPersonId: id,
        name,
        phone: '',
        transactionCount: 0,
        totalOmset: 0,
        totalSalesFee: 0,
        totalStoreProfit: 0,
        totalAmountDue: 0,
        totalDeposited: 0,
        totalPendingDeposit: 0,
      };
      map.set(id, entry);
    }

    entry.transactionCount += 1;
    entry.totalOmset += tx.total || 0;
    entry.totalSalesFee += tx.salesFeeTotal || 0;
    entry.totalStoreProfit += tx.storeNetProfit || 0;

    const amountDue = tx.amountDueToStore || Math.max(0, (tx.total || 0) - (tx.salesFeeTotal || 0));
    entry.totalAmountDue += amountDue;

    if (tx.depositStatus === 'deposited') {
      entry.totalDeposited += amountDue;
    } else {
      entry.totalPendingDeposit += amountDue;
    }
  });

  const sorted = Array.from(map.values()).sort((a, b) => b.totalOmset - a.totalOmset);

  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    depositStatusLabel:
      item.totalPendingDeposit === 0
        ? 'Semua Disetor'
        : `Belum Disetor ${formatCurrency(item.totalPendingDeposit)}`,
    depositBadgeColor: item.totalPendingDeposit === 0 ? 'green' : 'amber',
  }));
}

export function generateWhatsAppReceiptMessage(
  business: BusinessSettings,
  tx: Transaction
): string {
  const itemsText = tx.items
    .map(
      (it, idx) =>
        `${idx + 1}. *${it.name}*\n   ${it.quantity} ${it.unit} x ${formatCurrency(it.price)} = ${formatCurrency(it.subtotal)}`
    )
    .join('\n');

  const statusText =
    tx.paymentStatus === 'paid'
      ? '✅ *LUNAS*'
      : `⚠️ *KASBON / BELUM LUNAS* (Jatuh tempo: ${tx.dueDate || '-'})`;

  const paymentMethodLabel =
    tx.paymentMethod === 'cash'
      ? 'Tunai (Cash)'
      : tx.paymentMethod === 'qris'
      ? 'QRIS Digital'
      : 'Transfer Bank';

  let changeInfo = '';
  if (tx.paymentMethod === 'cash' && tx.cashPaid) {
    changeInfo = `\nUang Diterima: ${formatCurrency(tx.cashPaid)}\nKembalian: ${formatCurrency(tx.changeDue || 0)}`;
  }

  const salesInfo = tx.salesPersonName ? `\nSales Petugas : *${tx.salesPersonName}*` : '';

  return encodeURIComponent(
    `*STRUK RESMI ${business.brandName || 'SalesQu'}*\n` +
      `🏪 *${business.businessName}*\n` +
      `📍 ${business.businessAddress}\n` +
      `📞 ${business.businessPhone}\n` +
      `--------------------------------\n` +
      `No. Invoice : *${tx.invoiceNumber}*\n` +
      `Waktu : ${new Date(tx.date || tx.createdAt).toLocaleString('id-ID')}\n` +
      `Pelanggan : ${tx.customerName || 'Pelanggan Umum'}${salesInfo}\n` +
      `Metode Bayar: ${paymentMethodLabel}\n` +
      `Status : ${statusText}\n` +
      `--------------------------------\n` +
      `*RINCIAN PRODUK HERBAL:*\n` +
      `${itemsText}\n` +
      `--------------------------------\n` +
      (tx.discount > 0 ? `Diskon : -${formatCurrency(tx.discount)}\n` : '') +
      (tx.tax > 0 ? `PPN (11%) : +${formatCurrency(tx.tax)}\n` : '') +
      `*TOTAL TAGIHAN : ${formatCurrency(tx.total)}*` +
      `${changeInfo}\n\n` +
      `Terima kasih telah berbelanja di *${business.businessName}*! Semoga sehat berkah selalu.`
  );
}

export function generateWhatsAppReminderMessage(
  business: BusinessSettings,
  customer: Customer,
  tx?: Transaction
): string {
  const invoiceInfo = tx ? `untuk tagihan *${tx.invoiceNumber}*` : '';
  const dueInfo = tx?.dueDate ? `dengan tenggat pembayaran: *${tx.dueDate}*` : '';
  const bankInfo = business.bankAccountNumber
    ? `\nPembayaran dapat ditransfer melalui:\n🏦 *${business.bankName}*\nNo. Rekening: *${business.bankAccountNumber}*\nAtas Nama: *${business.bankAccountName}*`
    : '';

  return encodeURIComponent(
    `Halo Yth. *${customer.name}*,\n\n` +
      `Semoga Bapak/Ibu dalam keadaan sehat walafiat. Kami dari *${business.businessName}* (${business.brandName || 'SalesQu'}) ingin menginformasikan pengingat kasbon/tanggungan ${invoiceInfo} sebesar *${formatCurrency(customer.debtBalance)}* ${dueInfo}.\n` +
      `${bankInfo}\n\n` +
      `Jika sudah melakukan pembayaran, mohon konfirmasi dengan membalas pesan ini atau mengirimkan bukti transfer.\n` +
      `Terima kasih banyak atas kerjasamanya! 🙏`
  );
}

export function generateWhatsAppSalesDepositRecap(
  business: BusinessSettings,
  sales: SalesLeaderboardEntry
): string {
  return encodeURIComponent(
    `*REKAPAN KINERJA & SETORAN SALES*\n` +
      `🏪 *${business.businessName}* (${business.brandName || 'SalesQu'})\n` +
      `👤 *Sales: ${sales.name}* (Peringkat #${sales.rank})\n` +
      `--------------------------------\n` +
      `Total Transaksi : ${sales.transactionCount} transaksi\n` +
      `Total Omset     : ${formatCurrency(sales.totalOmset)}\n` +
      `Fee Sales Diambil : *${formatCurrency(sales.totalSalesFee)}*\n` +
      `Laba Bersih Toko: *${formatCurrency(sales.totalStoreProfit)}*\n` +
      `--------------------------------\n` +
      `Total Yang Harus Disetor: ${formatCurrency(sales.totalAmountDue)}\n` +
      `Sudah Disetor   : ${formatCurrency(sales.totalDeposited)}\n` +
      `*SISA BELUM DISETOR: ${formatCurrency(sales.totalPendingDeposit)}*\n` +
      `--------------------------------\n` +
      `Mohon segera selesaikan setoran ke toko. Terima kasih atas kerja kerasnya! 🚀`
  );
}
