import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  isLowStock,
  isSignificantTransaction,
  checkOverdueStatus,
  filterTransactionsByPeriod,
  calculateFinancialSummary,
  calculateSalesLeaderboard,
  formatCurrency,
} from './salesRules.ts';
import { Transaction, Product, SalesPerson } from '../types.ts';

test('calculateCartTotals computes sales fee, store net profit, and amount due to store accurately', () => {
  const items = [
    { price: 100000, buyPrice: 60000, quantity: 2, discount: 0, salesFeePerUnit: 10000 },
    { price: 50000, buyPrice: 30000, quantity: 1, discount: 0, salesFeePerUnit: 5000 },
  ];
  // Subtotal = (100000*2) + 50000 = 250000
  // Total HPP = (60000*2) + 30000 = 150000
  // Total Sales Fee = (10000*2) + 5000 = 25000
  // Store Net Profit = 250000 - 150000 - 25000 = 75000
  // Amount Due to Store = 250000 - 25000 = 225000
  const result = calculateCartTotals(items, 0, false, 11);
  assert.equal(result.total, 250000);
  assert.equal(result.totalHpp, 150000);
  assert.equal(result.salesFeeTotal, 25000);
  assert.equal(result.storeNetProfit, 75000);
  assert.equal(result.amountDueToStore, 225000);
});

test('filterTransactionsByPeriod handles semester (6 bulan) accurately', () => {
  const refDate = new Date('2026-10-22T12:00:00Z'); // October = Semester 2 (Jul - Des)

  const sampleTxs: Transaction[] = [
    {
      id: 'tx-1',
      invoiceNumber: 'INV-1',
      date: '2026-10-22T08:00:00Z', // Oct = Semester 2
      channel: 'sales_field',
      items: [],
      subtotal: 100000,
      discount: 0,
      tax: 0,
      total: 100000,
      salesFeeTotal: 10000,
      storeNetProfit: 40000,
      amountDueToStore: 90000,
      depositStatus: 'deposited',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: '2026-10-22T08:00:00Z',
    },
    {
      id: 'tx-2',
      invoiceNumber: 'INV-2',
      date: '2026-08-15T08:00:00Z', // Aug = Semester 2
      channel: 'offline_store',
      items: [],
      subtotal: 200000,
      discount: 0,
      tax: 0,
      total: 200000,
      salesFeeTotal: 20000,
      storeNetProfit: 80000,
      amountDueToStore: 180000,
      depositStatus: 'pending',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: '2026-08-15T08:00:00Z',
    },
    {
      id: 'tx-3',
      invoiceNumber: 'INV-3',
      date: '2026-03-10T08:00:00Z', // March = Semester 1 (Jan - Jun)
      channel: 'shopee',
      items: [],
      subtotal: 300000,
      discount: 0,
      tax: 0,
      total: 300000,
      salesFeeTotal: 30000,
      storeNetProfit: 120000,
      amountDueToStore: 270000,
      depositStatus: 'deposited',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: '2026-03-10T08:00:00Z',
    },
  ];

  const semesterTxs = filterTransactionsByPeriod(sampleTxs, 'semester', undefined, undefined, refDate);
  assert.equal(semesterTxs.length, 2);
  assert.equal(semesterTxs[0].id, 'tx-1');
  assert.equal(semesterTxs[1].id, 'tx-2');
});

test('calculateSalesLeaderboard ranks sales and aggregates deposits', () => {
  const salesPeople: SalesPerson[] = [
    {
      id: 'sales-1',
      name: 'Budi Santoso',
      phone: '08123456789',
      role: 'Sales Lapangan',
      defaultCommissionPercent: 10,
      totalSales: 0,
      totalCommission: 0,
      totalStoreProfit: 0,
      unpaidDeposit: 0,
      active: true,
    },
    {
      id: 'sales-2',
      name: 'Dewi Lestari',
      phone: '08571234889',
      role: 'Sales Counter',
      defaultCommissionPercent: 8,
      totalSales: 0,
      totalCommission: 0,
      totalStoreProfit: 0,
      unpaidDeposit: 0,
      active: true,
    },
  ];

  const txs: Transaction[] = [
    {
      id: 'tx-a',
      invoiceNumber: 'INV-A',
      date: '2026-10-22',
      channel: 'sales_field',
      salesPersonId: 'sales-1',
      salesPersonName: 'Budi Santoso',
      items: [],
      subtotal: 500000,
      discount: 0,
      tax: 0,
      total: 500000,
      salesFeeTotal: 50000,
      storeNetProfit: 200000,
      amountDueToStore: 450000,
      depositStatus: 'deposited',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: '2026-10-22',
    },
    {
      id: 'tx-b',
      invoiceNumber: 'INV-B',
      date: '2026-10-22',
      channel: 'sales_field',
      salesPersonId: 'sales-2',
      salesPersonName: 'Dewi Lestari',
      items: [],
      subtotal: 800000,
      discount: 0,
      tax: 0,
      total: 800000,
      salesFeeTotal: 80000,
      storeNetProfit: 350000,
      amountDueToStore: 720000,
      depositStatus: 'pending',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: '2026-10-22',
    },
  ];

  const leaderboard = calculateSalesLeaderboard(txs, salesPeople);
  assert.equal(leaderboard.length, 2);
  assert.equal(leaderboard[0].name, 'Dewi Lestari');
  assert.equal(leaderboard[0].totalOmset, 800000);
  assert.equal(leaderboard[0].totalSalesFee, 80000);
  assert.equal(leaderboard[0].totalPendingDeposit, 720000);

  assert.equal(leaderboard[1].name, 'Budi Santoso');
  assert.equal(leaderboard[1].totalOmset, 500000);
  assert.equal(leaderboard[1].totalDeposited, 450000);
});
