import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Transaction, Product, BusinessSettings, ReportPeriod } from '../types.ts';
import { formatCurrency, calculateFinancialSummary } from './salesRules.ts';

export function exportTransactionsToExcel(
  transactions: Transaction[],
  fileName: string = 'Laporan-Penjualan.xlsx'
) {
  const dataRows = transactions.map((tx, idx) => ({
    'No': idx + 1,
    'No Invoice': tx.invoiceNumber,
    'Tanggal': new Date(tx.date || tx.createdAt).toLocaleDateString('id-ID'),
    'Waktu': new Date(tx.date || tx.createdAt).toLocaleTimeString('id-ID'),
    'Pelanggan': tx.customerName || 'Umum',
    'No. Telp Pelanggan': tx.customerPhone || '-',
    'Jumlah Item': tx.items?.reduce((s, it) => s + it.quantity, 0) || 0,
    'Subtotal (Rp)': tx.subtotal,
    'Diskon (Rp)': tx.discount,
    'Pajak (Rp)': tx.tax,
    'Total (Rp)': tx.total,
    'Metode Bayar': tx.paymentMethod.toUpperCase(),
    'Status Pembayaran': tx.paymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas',
    'Jatuh Tempo': tx.dueDate || '-',
    'Perangkat': tx.deviceId || 'Utama',
    'Catatan': tx.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Penjualan');

  // Generate buffer and trigger download
  XLSX.writeFile(workbook, fileName);
}

export function exportStockToExcel(
  products: Product[],
  fileName: string = 'Laporan-Inventaris-Stok.xlsx'
) {
  const dataRows = products.map((p, idx) => ({
    'No': idx + 1,
    'Kode Produk': p.code,
    'Nama Barang': p.name,
    'Kategori': p.category,
    'Harga Beli (Rp)': p.buyPrice,
    'Harga Jual (Rp)': p.sellPrice,
    'Margin Keuntungan (Rp)': p.sellPrice - p.buyPrice,
    'Sisa Stok': p.stock,
    'Satuan': p.unit,
    'Batas Minimum Alert': p.minStockAlert,
    'Status Stok': p.stock <= p.minStockAlert ? 'Kritis / Menipis' : 'Aman',
    'Nilai Aset Stok (Rp)': p.stock * p.buyPrice,
    'Potensi Omset (Rp)': p.stock * p.sellPrice,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Barang');
  XLSX.writeFile(workbook, fileName);
}

export function exportPeriodicAuditReportPDF(
  business: BusinessSettings,
  transactions: Transaction[],
  products: Product[],
  periodLabel: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const summary = calculateFinancialSummary(transactions, products);

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(business.businessName.toUpperCase(), 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`${business.businessAddress} | Telp: ${business.businessPhone}`, 14, 26);
  doc.text(`Email: ${business.businessEmail}`, 14, 31);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 35, 196, 35);

  // Report Period Header
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`LAPORAN AUDIT PENJUALAN & KEUANGAN`, 14, 43);
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${periodLabel} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 49);

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 54, 182, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 54, 182, 32, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENDAPATAN (OMSET)', 20, 62);
  doc.text('TOTAL HPP (HARGA POKOK)', 80, 62);
  doc.text('LABA KOTOR (GROSS PROFIT)', 140, 62);

  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129); // green
  doc.text(formatCurrency(summary.totalRevenue), 20, 70);

  doc.setTextColor(239, 68, 68); // red
  doc.text(formatCurrency(summary.totalCost), 80, 70);

  doc.setTextColor(37, 99, 235); // blue
  doc.text(formatCurrency(summary.grossProfit), 140, 70);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total Transaksi: ${summary.totalTransactions}`, 20, 80);
  doc.text(`Barang Terjual: ${summary.totalItemsSold} item`, 80, 80);
  doc.text(`Piutang Belum Lunas: ${formatCurrency(summary.totalUnpaidDebt)}`, 140, 80);

  // Table header
  let y = 94;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('NO', 16, y + 5.5);
  doc.text('INVOICE', 26, y + 5.5);
  doc.text('TANGGAL', 60, y + 5.5);
  doc.text('PELANGGAN', 90, y + 5.5);
  doc.text('METODE', 130, y + 5.5);
  doc.text('STATUS', 152, y + 5.5);
  doc.text('TOTAL', 174, y + 5.5);

  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const displayList = transactions.slice(0, 30); // show up to first 30 in PDF
  displayList.forEach((tx, i) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    doc.text(String(i + 1), 16, y);
    doc.text(tx.invoiceNumber, 26, y);
    doc.text(new Date(tx.date || tx.createdAt).toLocaleDateString('id-ID'), 60, y);
    doc.text((tx.customerName || 'Umum').substring(0, 20), 90, y);
    doc.text(tx.paymentMethod.toUpperCase(), 130, y);
    doc.text(tx.paymentStatus === 'paid' ? 'Lunas' : 'Belum', 152, y);
    doc.text(formatCurrency(tx.total), 174, y);

    y += 6;
  });

  if (transactions.length > 30) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`* Menampilkan 30 dari total ${transactions.length} transaksi. Gunakan ekspor Excel untuk data lengkap.`, 14, y + 5);
  }

  // Footer / Signature block
  const footerY = Math.min(270, Math.max(y + 15, 240));
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Disetujui Oleh:`, 140, footerY);
  doc.text(`( ..................................... )`, 140, footerY + 22);
  doc.text(`Manajer Keuangan & Pemilik`, 140, footerY + 27);

  doc.save(`Laporan_Audit_${periodLabel.replace(/\s+/g, '_')}.pdf`);
}

export function exportSingleReceiptPDF(
  business: BusinessSettings,
  tx: Transaction
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200], // 80mm thermal receipt roll size
  });

  doc.setFontSize(12);
  doc.text(business.businessName, 40, 10, { align: 'center' });
  doc.setFontSize(7);
  doc.text(business.businessAddress, 40, 15, { align: 'center' });
  doc.text(`Telp: ${business.businessPhone}`, 40, 19, { align: 'center' });

  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, 23, 75, 23);

  doc.text(`No. Inv: ${tx.invoiceNumber}`, 6, 27);
  doc.text(`Waktu  : ${new Date(tx.date || tx.createdAt).toLocaleString('id-ID')}`, 6, 31);
  doc.text(`Kasir  : ${tx.deviceId || 'Kasir 1'}`, 6, 35);
  doc.text(`Klien  : ${tx.customerName || 'Umum'}`, 6, 39);

  doc.line(5, 42, 75, 42);

  let y = 46;
  tx.items.forEach((item) => {
    doc.setFontSize(7);
    doc.text(item.name.substring(0, 25), 6, y);
    doc.text(
      `${item.quantity} x ${formatCurrency(item.price)}`,
      6,
      y + 3.5
    );
    doc.text(formatCurrency(item.subtotal), 74, y + 3.5, { align: 'right' });
    y += 8;
  });

  doc.line(5, y, 75, y);
  y += 4;

  if (tx.discount > 0) {
    doc.text('Diskon:', 6, y);
    doc.text(`-${formatCurrency(tx.discount)}`, 74, y, { align: 'right' });
    y += 4;
  }

  doc.setFontSize(8);
  doc.text('TOTAL:', 6, y);
  doc.text(formatCurrency(tx.total), 74, y, { align: 'right' });
  y += 5;

  doc.setFontSize(7);
  doc.text(`Metode: ${tx.paymentMethod.toUpperCase()}`, 6, y);
  doc.text(`Status: ${tx.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}`, 74, y, {
    align: 'right',
  });
  y += 4;

  if (tx.paymentMethod === 'cash' && tx.cashPaid) {
    doc.text('Diterima:', 6, y);
    doc.text(formatCurrency(tx.cashPaid), 74, y, { align: 'right' });
    y += 4;
    doc.text('Kembali:', 6, y);
    doc.text(formatCurrency(tx.changeDue || 0), 74, y, { align: 'right' });
    y += 4;
  }

  doc.line(5, y, 75, y);
  y += 5;

  doc.setFontSize(7);
  doc.text('Terima Kasih Telah Berbelanja!', 40, y, { align: 'center' });
  doc.text('Barang yang dibeli tidak dapat ditukar', 40, y + 4, { align: 'center' });

  doc.save(`Struk_${tx.invoiceNumber}.pdf`);
}
