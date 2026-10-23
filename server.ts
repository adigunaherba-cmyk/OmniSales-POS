import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

app.use(express.json({ limit: '20mb' }));

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data with Adiguna Herba context
const initialSeedData = {
  settings: {
    businessName: 'Adiguna Herba',
    brandName: 'KelolaQU',
    businessPhone: '081234567890',
    businessAddress: 'Jl. Pemuda No. 88, Sentra Herbal Indonesia',
    businessEmail: 'adigunaherba@gmail.com',
    googleAccountEmail: 'adigunaherba@gmail.com',
    currency: 'IDR',
    qrisImage: '',
    qrisNmid: 'ID1020030405060',
    bankName: 'BCA (Bank Central Asia)',
    bankAccountName: 'Adiguna Herba',
    bankAccountNumber: '8830129845',
    bigTransactionThreshold: 500000,
    enablePushAlerts: true,
    defaultSalesFeePercent: 10,
  },
  salesPeople: [
    {
      id: 'sales-1',
      name: 'Ahmad Fauzi',
      phone: '081298711223',
      role: 'Sales Lapangan / Kanvaser',
      defaultCommissionPercent: 10,
      active: true,
    },
    {
      id: 'sales-2',
      name: 'Siti Nurhaliza',
      phone: '085712399881',
      role: 'Sales Counter / Toko',
      defaultCommissionPercent: 8,
      active: true,
    },
    {
      id: 'sales-3',
      name: 'Budi Prasetyo',
      phone: '087811223344',
      role: 'Sales Distributor Luar Kota',
      defaultCommissionPercent: 12,
      active: true,
    },
  ],
  products: [
    {
      id: 'prod-1',
      code: 'HRB-001',
      name: 'Madu Murni Habbatussauda 500g',
      category: 'Madu & Alami',
      buyPrice: 55000,
      sellPrice: 85000,
      salesFeePerUnit: 10000, // Fee Sales per botol
      stock: 45,
      minStockAlert: 10,
      unit: 'Botol',
      barcode: '899123456001',
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-2',
      code: 'HRB-002',
      name: 'Minyak Zaitun Extra Virgin Tursina 250ml',
      category: 'Minyak Herbal',
      buyPrice: 40000,
      sellPrice: 65000,
      salesFeePerUnit: 8000,
      stock: 28,
      minStockAlert: 8,
      unit: 'Botol',
      barcode: '899123456002',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-3',
      code: 'HRB-003',
      name: 'Kapsul Propolis Brazil Extract Nano',
      category: 'Imunitas & Propolis',
      buyPrice: 85000,
      sellPrice: 145000,
      salesFeePerUnit: 20000,
      stock: 5, // Kritis
      minStockAlert: 12,
      unit: 'Kotak',
      barcode: '899123456003',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-4',
      code: 'HRB-004',
      name: 'Sari Kurma Angkak Plus Propolis 470g',
      category: 'Sari Kurma',
      buyPrice: 30000,
      sellPrice: 50000,
      salesFeePerUnit: 6000,
      stock: 35,
      minStockAlert: 10,
      unit: 'Botol',
      barcode: '899123456004',
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-5',
      code: 'HRB-005',
      name: 'Kapsul Habbatussauda Softgel 100s',
      category: 'Kapsul Herbal',
      buyPrice: 42000,
      sellPrice: 70000,
      salesFeePerUnit: 8000,
      stock: 4, // Kritis
      minStockAlert: 10,
      unit: 'Botol',
      barcode: '899123456005',
      imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=400&q=80',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-6',
      code: 'HRB-006',
      name: 'Teh Celup Daun Kelor Moringa 25s',
      category: 'Teh Herbal',
      buyPrice: 16000,
      sellPrice: 28000,
      salesFeePerUnit: 4000,
      stock: 40,
      minStockAlert: 15,
      unit: 'Kotak',
      barcode: '899123456006',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-7',
      code: 'HRB-007',
      name: 'Jahe Merah Instan Habba Super 330g',
      category: 'Minuman Herbal',
      buyPrice: 22000,
      sellPrice: 38000,
      salesFeePerUnit: 5000,
      stock: 25,
      minStockAlert: 8,
      unit: 'Pouch',
      barcode: '899123456007',
      imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80',
      updatedAt: new Date().toISOString(),
    },
  ],
  customers: [
    {
      id: 'cust-1',
      name: 'Klinik Sehat Alami Ibu Siti',
      phone: '081298765432',
      address: 'Komplek Permata Hijau B3/12, Jakarta',
      totalSpent: 850000,
      debtBalance: 0,
      lastOrderDate: new Date().toISOString(),
      notes: 'Langganan madu habbatussauda & zaitun',
    },
    {
      id: 'cust-2',
      name: 'Apotek Herbal Barokah',
      phone: '085712348899',
      address: 'Jl. Cempaka Putih Tengah No. 18',
      totalSpent: 1450000,
      debtBalance: 350000,
      lastOrderDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      notes: 'Jatuh tempo pembayaran setiap tanggal 25',
    },
    {
      id: 'cust-3',
      name: 'Pak H. Sulaiman',
      phone: '087890123456',
      address: 'Jl. Kebon Sirih No. 9',
      totalSpent: 620000,
      debtBalance: 120000,
      lastOrderDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      notes: 'Pembelian rutin Propolis',
    },
  ],
  transactions: [
    {
      id: 'tx-1001',
      invoiceNumber: 'INV-20261020-001',
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      salesPersonId: 'sales-1',
      salesPersonName: 'Ahmad Fauzi',
      salesFeeTotal: 28000,
      storeNetProfit: 47000,
      amountDueToStore: 207000,
      depositStatus: 'deposited',
      depositedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      items: [
        {
          productId: 'prod-1',
          code: 'HRB-001',
          name: 'Madu Murni Habbatussauda 500g',
          price: 85000,
          buyPrice: 55000,
          quantity: 2,
          unit: 'Botol',
          subtotal: 170000,
          salesFee: 20000,
        },
        {
          productId: 'prod-2',
          code: 'HRB-002',
          name: 'Minyak Zaitun Extra Virgin Tursina 250ml',
          price: 65000,
          buyPrice: 40000,
          quantity: 1,
          unit: 'Botol',
          subtotal: 65000,
          salesFee: 8000,
        },
      ],
      subtotal: 235000,
      discount: 0,
      tax: 0,
      total: 235000,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      cashPaid: 235000,
      changeDue: 0,
      customerId: 'cust-1',
      customerName: 'Klinik Sehat Alami Ibu Siti',
      customerPhone: '081298765432',
      dueDate: '',
      notes: 'Setoran tunai diserahkan ke kasir toko',
      significantAlertSent: false,
      deviceId: 'Device-Sales-Fauzi',
      accountEmail: 'adigunaherba@gmail.com',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'tx-1002',
      invoiceNumber: 'INV-20261021-002',
      date: new Date(Date.now() - 1 * 86400000).toISOString(),
      salesPersonId: 'sales-2',
      salesPersonName: 'Siti Nurhaliza',
      salesFeeTotal: 80000,
      storeNetProfit: 160000,
      amountDueToStore: 500000,
      depositStatus: 'pending', // Belum disetor
      items: [
        {
          productId: 'prod-3',
          code: 'HRB-003',
          name: 'Kapsul Propolis Brazil Extract Nano',
          price: 145000,
          buyPrice: 85000,
          quantity: 4,
          unit: 'Kotak',
          subtotal: 580000,
          salesFee: 80000,
        },
      ],
      subtotal: 580000,
      discount: 0,
      tax: 0,
      total: 580000,
      paymentMethod: 'transfer',
      paymentStatus: 'paid',
      cashPaid: 580000,
      changeDue: 0,
      customerId: 'cust-2',
      customerName: 'Apotek Herbal Barokah',
      customerPhone: '085712348899',
      dueDate: '',
      notes: 'Pembayaran transfer oleh customer, setoran sales menunggu verifikasi',
      significantAlertSent: true,
      deviceId: 'Device-HP-Siti',
      accountEmail: 'adigunaherba@gmail.com',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  stockMovements: [
    {
      id: 'sm-1',
      productId: 'prod-1',
      productName: 'Madu Murni Habbatussauda 500g',
      type: 'sale',
      quantity: 2,
      previousStock: 47,
      newStock: 45,
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      reason: 'Penjualan Sales Ahmad Fauzi INV-20261020-001',
      referenceId: 'tx-1001',
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      type: 'low_stock',
      title: 'Peringatan Stok Menipis',
      message: 'Kapsul Propolis Brazil Extract Nano tersisa 5 kotak (Batas minimal: 12).',
      date: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      targetId: 'prod-3',
    },
    {
      id: 'notif-2',
      type: 'deposit',
      title: 'Setoran Sales Menunggu',
      message: 'Sales Siti Nurhaliza memiliki setoran belum disetor sebesar Rp 500.000.',
      date: new Date().toISOString(),
      read: false,
      targetId: 'sales-2',
    },
  ],
  connectedDevices: [
    {
      id: 'dev-master',
      name: 'HP Kasir Toko Pusat',
      accountEmail: 'adigunaherba@gmail.com',
      salesPersonName: 'Kasir Pusat',
      lastActive: new Date().toISOString(),
      deviceType: 'Desktop',
      ip: '127.0.0.1',
    },
    {
      id: 'dev-sales-1',
      name: 'HP Sales Ahmad Fauzi',
      accountEmail: 'adigunaherba@gmail.com',
      salesPersonName: 'Ahmad Fauzi',
      lastActive: new Date().toISOString(),
      deviceType: 'Mobile (Android)',
      ip: '192.168.1.15',
    },
  ],
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSeedData, null, 2), 'utf-8');
      return initialSeedData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure all new arrays and fields exist
    if (!parsed.salesPeople) parsed.salesPeople = initialSeedData.salesPeople;
    if (!parsed.settings.brandName || parsed.settings.brandName === 'SalesQu') parsed.settings.brandName = 'KelolaQU';
    if (!parsed.settings.businessName || parsed.settings.businessName === 'Toko Berkah Jaya') {
      parsed.settings.businessName = 'Adiguna Herba';
    }
    if (!parsed.settings.googleAccountEmail) parsed.settings.googleAccountEmail = 'adigunaherba@gmail.com';
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, returning fallback seed', err);
    return initialSeedData;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json', err);
  }
}

// Real-Time Server-Sent Events (SSE) subscribers
const sseClients: { id: string; res: Response; accountEmail?: string }[] = [];

function broadcastSSE(eventType: string, payload: any, targetEmail: string = 'adigunaherba@gmail.com') {
  const data = JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() });
  sseClients.forEach((client) => {
    // Only broadcast to devices logged in with the same Google Account!
    if (!client.accountEmail || client.accountEmail === targetEmail) {
      try {
        client.res.write(`data: ${data}\n\n`);
      } catch {
        // client closed
      }
    }
  });
}

// SSE stream endpoint
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const accountEmail = (req.query.email as string) || 'adigunaherba@gmail.com';
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  sseClients.push({ id: clientId, res, accountEmail });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, accountEmail })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString(), sseConnections: sseClients.length });
});

// Google Account multi-device login & device registration
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, deviceName, deviceType, salesPersonName } = req.body;
  const db = readDb();
  const currentEmail = email || db.settings.googleAccountEmail || 'adigunaherba@gmail.com';
  const deviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

  const existingDeviceIdx = db.connectedDevices.findIndex((d: any) => d.name === deviceName);
  if (existingDeviceIdx !== -1) {
    db.connectedDevices[existingDeviceIdx].lastActive = new Date().toISOString();
    db.connectedDevices[existingDeviceIdx].accountEmail = currentEmail;
    if (salesPersonName) db.connectedDevices[existingDeviceIdx].salesPersonName = salesPersonName;
  } else {
    db.connectedDevices.push({
      id: deviceId,
      name: deviceName || 'Perangkat Sales / Kasir',
      accountEmail: currentEmail,
      salesPersonName: salesPersonName || 'Sales Petugas',
      lastActive: new Date().toISOString(),
      deviceType: deviceType || 'Mobile/Desktop',
      ip: req.ip || '127.0.0.1',
    });
  }
  writeDb(db);
  broadcastSSE('DEVICE_CONNECTED', { deviceName, deviceId, currentEmail }, currentEmail);

  res.json({
    success: true,
    token: `token_${Date.now()}`,
    user: {
      id: 'usr-1',
      name: 'Pemilik Adiguna Herba',
      role: 'admin',
      email: currentEmail,
      businessName: db.settings.businessName,
      brandName: db.settings.brandName || 'SalesQu',
    },
    deviceId,
  });
});

// Get all sync data
app.get('/api/data', (req: Request, res: Response) => {
  const requestedEmail = (req.query.email as string) || 'adigunaherba@gmail.com';
  const db = readDb();

  // If another account asks for data and it's not the configured account, isolate
  if (requestedEmail !== db.settings.googleAccountEmail) {
    res.json({
      success: true,
      data: {
        settings: { ...db.settings, googleAccountEmail: requestedEmail, businessName: `Akun Baru (${requestedEmail})` },
        salesPeople: [],
        products: [],
        customers: [],
        transactions: [],
        stockMovements: [],
        notifications: [],
        connectedDevices: [],
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: db,
    timestamp: new Date().toISOString(),
  });
});

// Update settings
app.post('/api/settings', (req: Request, res: Response) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);
  broadcastSSE('SETTINGS_UPDATED', db.settings, db.settings.googleAccountEmail);
  res.json({ success: true, settings: db.settings });
});

// Sales Person CRUD
app.post('/api/sales', (req: Request, res: Response) => {
  const db = readDb();
  const salesData = req.body;
  if (!db.salesPeople) db.salesPeople = [];

  let savedSales;
  if (salesData.id) {
    const idx = db.salesPeople.findIndex((s: any) => s.id === salesData.id);
    if (idx !== -1) {
      db.salesPeople[idx] = { ...db.salesPeople[idx], ...salesData };
      savedSales = db.salesPeople[idx];
    }
  } else {
    savedSales = {
      ...salesData,
      id: `sales-${Date.now()}`,
      active: true,
    };
    db.salesPeople.push(savedSales);
  }

  writeDb(db);
  broadcastSSE('SALES_UPDATED', { salesPerson: savedSales, salesPeople: db.salesPeople });
  res.json({ success: true, salesPerson: savedSales, salesPeople: db.salesPeople });
});

// Product CRUD & Restock
app.post('/api/products', (req: Request, res: Response) => {
  const db = readDb();
  const productData = req.body;
  let updatedProduct;

  if (productData.id) {
    const idx = db.products.findIndex((p: any) => p.id === productData.id);
    if (idx !== -1) {
      const prevStock = db.products[idx].stock;
      db.products[idx] = {
        ...db.products[idx],
        ...productData,
        updatedAt: new Date().toISOString(),
      };
      updatedProduct = db.products[idx];

      if (prevStock !== updatedProduct.stock) {
        db.stockMovements.unshift({
          id: `sm-${Date.now()}`,
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          type: updatedProduct.stock > prevStock ? 'restock' : 'adjustment',
          quantity: Math.abs(updatedProduct.stock - prevStock),
          previousStock: prevStock,
          newStock: updatedProduct.stock,
          date: new Date().toISOString(),
          reason: 'Penyesuaian stok manual',
        });
      }
    }
  } else {
    updatedProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      code: productData.code || `HRB-${String(db.products.length + 1).padStart(3, '0')}`,
      stock: Number(productData.stock) || 0,
      buyPrice: Number(productData.buyPrice) || 0,
      sellPrice: Number(productData.sellPrice) || 0,
      salesFeePerUnit: Number(productData.salesFeePerUnit) || 0,
      minStockAlert: Number(productData.minStockAlert) || 5,
      imageUrl: productData.imageUrl || '',
      updatedAt: new Date().toISOString(),
    };
    db.products.push(updatedProduct);

    db.stockMovements.unshift({
      id: `sm-${Date.now()}`,
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      type: 'restock',
      quantity: updatedProduct.stock,
      previousStock: 0,
      newStock: updatedProduct.stock,
      date: new Date().toISOString(),
      reason: 'Stok awal produk baru',
    });
  }

  // Check low stock
  if (updatedProduct && updatedProduct.stock <= updatedProduct.minStockAlert) {
    const notif = {
      id: `notif-${Date.now()}`,
      type: 'low_stock',
      title: 'Peringatan Stok Menipis',
      message: `${updatedProduct.name} tersisa ${updatedProduct.stock} ${updatedProduct.unit} (Minimal: ${updatedProduct.minStockAlert}). Segera restock!`,
      date: new Date().toISOString(),
      read: false,
      targetId: updatedProduct.id,
    };
    db.notifications.unshift(notif);
    broadcastSSE('NOTIFICATION', notif);
  }

  writeDb(db);
  broadcastSSE('PRODUCT_SAVED', { product: updatedProduct, products: db.products });
  res.json({ success: true, product: updatedProduct });
});

// Delete product
app.delete('/api/products/:id', (req: Request, res: Response) => {
  const db = readDb();
  const id = req.params.id;
  db.products = db.products.filter((p: any) => p.id !== id);
  writeDb(db);
  broadcastSSE('PRODUCT_DELETED', { id, products: db.products });
  res.json({ success: true });
});

// Restock product directly
app.post('/api/products/:id/restock', (req: Request, res: Response) => {
  const db = readDb();
  const id = req.params.id;
  const { quantity, notes } = req.body;
  const qty = Number(quantity);

  const product = db.products.find((p: any) => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Produk tidak ditemukan' });
    return;
  }

  const prevStock = product.stock;
  product.stock += qty;
  product.updatedAt = new Date().toISOString();

  const movement = {
    id: `sm-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    type: 'restock',
    quantity: qty,
    previousStock: prevStock,
    newStock: product.stock,
    date: new Date().toISOString(),
    reason: notes || 'Pengisian ulang stok (Restock)',
  };
  db.stockMovements.unshift(movement);

  writeDb(db);
  broadcastSSE('STOCK_UPDATED', { product, movement, products: db.products });
  res.json({ success: true, product, movement });
});

// Create Transaction
app.post('/api/transactions', (req: Request, res: Response) => {
  const db = readDb();
  const tx = req.body;

  if (!tx.items || tx.items.length === 0) {
    res.status(400).json({ error: 'Keranjang belanja kosong' });
    return;
  }

  const invoiceNumber =
    tx.invoiceNumber ||
    `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(db.transactions.length + 1).padStart(3, '0')}`;

  const newTransaction = {
    ...tx,
    id: tx.id || `tx-${Date.now()}`,
    invoiceNumber,
    createdAt: tx.createdAt || new Date().toISOString(),
    date: tx.date || new Date().toISOString(),
    accountEmail: tx.accountEmail || db.settings.googleAccountEmail || 'adigunaherba@gmail.com',
  };

  // Deduct stock and record stock movements
  newTransaction.items.forEach((item: any) => {
    const product = db.products.find((p: any) => p.id === item.productId);
    if (product) {
      const prevStock = product.stock;
      product.stock = Math.max(0, product.stock - item.quantity);
      product.updatedAt = new Date().toISOString();

      db.stockMovements.unshift({
        id: `sm-${Date.now()}-${item.productId}`,
        productId: product.id,
        productName: product.name,
        type: 'sale',
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: product.stock,
        date: newTransaction.date,
        reason: `Penjualan ${newTransaction.salesPersonName || 'Kasir'} (${invoiceNumber})`,
        referenceId: newTransaction.id,
      });

      if (product.stock <= product.minStockAlert) {
        const notif = {
          id: `notif-${Date.now()}-${product.id}`,
          type: 'low_stock',
          title: 'Stok Kritis Menipis!',
          message: `${product.name} sekarang tersisa ${product.stock} ${product.unit}. Segera buat pesanan ulang.`,
          date: new Date().toISOString(),
          read: false,
          targetId: product.id,
        };
        db.notifications.unshift(notif);
        broadcastSSE('NOTIFICATION', notif);
      }
    }
  });

  // Customer linking & debt update with PIC / Sales / Kasir
  let matchedCustomer: any = null;
  if (newTransaction.customerId) {
    matchedCustomer = db.customers.find((c: any) => c.id === newTransaction.customerId);
  } else if (newTransaction.customerPhone || newTransaction.customerName) {
    matchedCustomer = db.customers.find(
      (c: any) =>
        (newTransaction.customerPhone && c.phone === newTransaction.customerPhone) ||
        (newTransaction.customerName && c.name.toLowerCase() === newTransaction.customerName.toLowerCase())
    );
  }

  const defaultPicName = newTransaction.salesPersonName || 'Kasir Toko';
  const defaultPicId = newTransaction.salesPersonId || '';

  if (matchedCustomer) {
    matchedCustomer.totalSpent = (matchedCustomer.totalSpent || 0) + newTransaction.total;
    matchedCustomer.lastOrderDate = newTransaction.date;
    if (!matchedCustomer.salesPersonName || matchedCustomer.salesPersonName === 'Umum') {
      matchedCustomer.salesPersonName = defaultPicName;
      matchedCustomer.salesPersonId = defaultPicId;
    }
    if (newTransaction.paymentStatus !== 'paid' || newTransaction.isKasbon) {
      const unpaidAmount = Math.max(0, newTransaction.total - (newTransaction.cashPaid || 0));
      matchedCustomer.debtBalance = (matchedCustomer.debtBalance || 0) + (unpaidAmount > 0 ? unpaidAmount : newTransaction.total);
    }
    newTransaction.customerId = matchedCustomer.id;
    newTransaction.customerName = matchedCustomer.name;
    newTransaction.customerPhone = matchedCustomer.phone;
  } else if (newTransaction.customerName) {
    const newCust = {
      id: `cust-${Date.now()}`,
      name: newTransaction.customerName,
      phone: newTransaction.customerPhone || '-',
      address: '',
      salesPersonId: defaultPicId,
      salesPersonName: defaultPicName,
      totalSpent: newTransaction.total,
      debtBalance:
        newTransaction.paymentStatus !== 'paid' || newTransaction.isKasbon
          ? Math.max(0, newTransaction.total - (newTransaction.cashPaid || 0)) || newTransaction.total
          : 0,
      lastOrderDate: newTransaction.date,
      notes: `Otomatis tersimpan dari transaksi ${invoiceNumber}`,
    };
    db.customers.push(newCust);
    newTransaction.customerId = newCust.id;
  }
  broadcastSSE('CUSTOMERS_UPDATED', { customers: db.customers });

  // Significant Transaction alert
  const threshold = db.settings.bigTransactionThreshold || 500000;
  if (newTransaction.total >= threshold) {
    const notif = {
      id: `notif-${Date.now()}-big`,
      type: 'big_transaction',
      title: 'Transaksi Signifikan Masuk!',
      message: `Transaksi senilai Rp ${newTransaction.total.toLocaleString('id-ID')} masuk (${invoiceNumber}) oleh sales ${newTransaction.salesPersonName || 'Umum'}.`,
      date: new Date().toISOString(),
      read: false,
      targetId: newTransaction.id,
    };
    db.notifications.unshift(notif);
    newTransaction.significantAlertSent = true;
    broadcastSSE('NOTIFICATION', notif);
  }

  db.transactions.unshift(newTransaction);
  writeDb(db);

  // Broadcast to all other devices in real time!
  broadcastSSE(
    'TRANSACTION_CREATED',
    {
      transaction: newTransaction,
      products: db.products,
      customers: db.customers,
      notifications: db.notifications,
    },
    newTransaction.accountEmail
  );

  res.json({ success: true, transaction: newTransaction });
});

// Update deposit status (Setoran Sales ke Toko: Sudah Disetor vs Belum Disetor)
app.patch('/api/transactions/:id/deposit', (req: Request, res: Response) => {
  const db = readDb();
  const id = req.params.id;
  const { depositStatus } = req.body;

  const tx = db.transactions.find((t: any) => t.id === id);
  if (!tx) {
    res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    return;
  }

  tx.depositStatus = depositStatus || 'deposited';
  if (tx.depositStatus === 'deposited') {
    tx.depositedAt = new Date().toISOString();
  }

  writeDb(db);
  broadcastSSE('DEPOSIT_UPDATED', { transaction: tx }, db.settings.googleAccountEmail);
  res.json({ success: true, transaction: tx });
});

// Update payment status (e.g. debt repayment)
app.patch('/api/transactions/:id/payment', (req: Request, res: Response) => {
  const db = readDb();
  const id = req.params.id;
  const { paymentStatus, cashPaid } = req.body;

  const tx = db.transactions.find((t: any) => t.id === id);
  if (!tx) {
    res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    return;
  }

  const prevStatus = tx.paymentStatus;
  tx.paymentStatus = paymentStatus || 'paid';
  if (cashPaid !== undefined) tx.cashPaid = Number(cashPaid);

  if (prevStatus !== 'paid' && tx.paymentStatus === 'paid' && tx.customerId) {
    const cust = db.customers.find((c: any) => c.id === tx.customerId);
    if (cust) {
      cust.debtBalance = Math.max(0, cust.debtBalance - (tx.total - (tx.cashPaid || 0)));
    }
  }

  writeDb(db);
  broadcastSSE('TRANSACTION_UPDATED', { transaction: tx, customers: db.customers });
  res.json({ success: true, transaction: tx });
});

// Customer CRUD
app.post('/api/customers', (req: Request, res: Response) => {
  const db = readDb();
  const custData = req.body;
  let savedCust;

  if (custData.id) {
    const idx = db.customers.findIndex((c: any) => c.id === custData.id);
    if (idx !== -1) {
      db.customers[idx] = { ...db.customers[idx], ...custData };
      savedCust = db.customers[idx];
    }
  } else {
    savedCust = {
      ...custData,
      id: `cust-${Date.now()}`,
      totalSpent: Number(custData.totalSpent) || 0,
      debtBalance: Number(custData.debtBalance) || 0,
      lastOrderDate: new Date().toISOString(),
    };
    db.customers.push(savedCust);
  }

  writeDb(db);
  broadcastSSE('CUSTOMER_SAVED', { customer: savedCust, customers: db.customers });
  res.json({ success: true, customer: savedCust });
});

// Mark notifications as read
app.post('/api/notifications/read', (req: Request, res: Response) => {
  const db = readDb();
  const { id } = req.body;
  if (id) {
    const notif = db.notifications.find((n: any) => n.id === id);
    if (notif) notif.read = true;
  } else {
    db.notifications.forEach((n: any) => (n.read = true));
  }
  writeDb(db);
  res.json({ success: true, notifications: db.notifications });
});

// Marketplace Batch Import (Shopee, Tokopedia/TikTok, Lazada)
app.post('/api/marketplace/import', (req: Request, res: Response) => {
  const db = readDb();
  const { channel, orders = [] } = req.body;
  const channelName =
    channel === 'shopee'
      ? 'Shopee'
      : channel === 'tokopedia_tiktok'
      ? 'Tokopedia / TikTok Shop'
      : channel === 'lazada'
      ? 'Lazada'
      : 'Marketplace';

  const createdTransactions: any[] = [];

  orders.forEach((order: any, idx: number) => {
    const txItems: any[] = [];
    let subtotal = 0;
    let totalHpp = 0;

    order.items?.forEach((it: any) => {
      const prod = db.products.find((p: any) => p.id === it.productId);
      if (prod) {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price) || prod.sellPrice;
        const buyPrice = prod.buyPrice || 0;
        const itemSubtotal = qty * price;

        subtotal += itemSubtotal;
        totalHpp += qty * buyPrice;

        // Deduct inventory
        const prevStock = prod.stock;
        prod.stock = Math.max(0, prod.stock - qty);
        prod.updatedAt = new Date().toISOString();

        txItems.push({
          productId: prod.id,
          code: prod.code,
          name: prod.name,
          price,
          buyPrice,
          quantity: qty,
          unit: prod.unit || 'Pcs',
          discount: 0,
          salesFee: 0,
          subtotal: itemSubtotal,
        });

        // Add stock movement
        db.stockMovements.unshift({
          id: `sm-mp-${Date.now()}-${idx}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          type: 'sale',
          channel,
          quantity: qty,
          previousStock: prevStock,
          newStock: prod.stock,
          date: new Date().toISOString(),
          reason: `Penjualan ${channelName} #${order.orderNumber}`,
          referenceId: order.orderNumber,
        });

        // Check low stock alert
        if (prod.stock <= prod.minStockAlert) {
          const notif = {
            id: `notif-${Date.now()}-${prod.id}`,
            type: 'low_stock',
            title: 'Stok Menipis Karena Penjualan Marketplace',
            message: `${prod.name} tersisa ${prod.stock} ${prod.unit} setelah transaksi dari ${channelName}.`,
            date: new Date().toISOString(),
            read: false,
            targetId: prod.id,
          };
          db.notifications.unshift(notif);
          broadcastSSE('NOTIFICATION', notif);
        }
      }
    });

    const storeNetProfit = Math.max(0, subtotal - totalHpp);

    const newTx = {
      id: `tx-mp-${Date.now()}-${idx}`,
      invoiceNumber: `INV-MP-${Date.now().toString().slice(-6)}-${idx + 1}`,
      date: new Date().toISOString(),
      channel,
      marketplaceOrderNo: order.orderNumber,
      items: txItems,
      subtotal,
      discount: 0,
      tax: 0,
      total: order.total || subtotal,
      salesPersonName: `Admin Online (${channelName})`,
      salesFeeTotal: 0,
      storeNetProfit,
      amountDueToStore: order.total || subtotal,
      depositStatus: 'deposited',
      paymentMethod: 'transfer',
      paymentStatus: 'paid',
      customerName: order.customerName || `Pembeli ${channelName}`,
      notes: `Order marketplace ${channelName} #${order.orderNumber}`,
      createdAt: new Date().toISOString(),
      accountEmail: db.settings.googleAccountEmail || 'adigunaherba@gmail.com',
    };

    db.transactions.unshift(newTx);
    createdTransactions.push(newTx);
  });

  writeDb(db);
  broadcastSSE(
    'MARKETPLACE_IMPORT_COMPLETED',
    {
      transactions: createdTransactions,
      products: db.products,
      stockMovements: db.stockMovements,
    },
    db.settings.googleAccountEmail
  );

  res.json({ success: true, count: createdTransactions.length, transactions: createdTransactions });
});

// Batch sync endpoint for offline reconciliation
app.post('/api/sync/batch', (req: Request, res: Response) => {
  const db = readDb();
  const { offlineTransactions = [], deviceId = 'unknown' } = req.body;

  let addedCount = 0;
  offlineTransactions.forEach((tx: any) => {
    const exists = db.transactions.some(
      (t: any) => t.id === tx.id || t.invoiceNumber === tx.invoiceNumber
    );
    if (!exists) {
      tx.items?.forEach((item: any) => {
        const product = db.products.find((p: any) => p.id === item.productId);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
          product.updatedAt = new Date().toISOString();
        }
      });
      db.transactions.unshift(tx);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    writeDb(db);
    broadcastSSE('SYNC_COMPLETED', { addedCount, deviceId }, db.settings.googleAccountEmail);
  }

  res.json({ success: true, addedCount, serverState: db });
});

// Multi-device heartbeat
app.post('/api/device/heartbeat', (req: Request, res: Response) => {
  const db = readDb();
  const { deviceId, deviceName, deviceType, accountEmail, salesPersonName } = req.body;
  const existing = db.connectedDevices.find((d: any) => d.id === deviceId);
  if (existing) {
    existing.lastActive = new Date().toISOString();
    if (accountEmail) existing.accountEmail = accountEmail;
    if (salesPersonName) existing.salesPersonName = salesPersonName;
  } else if (deviceId) {
    db.connectedDevices.push({
      id: deviceId,
      name: deviceName || 'Perangkat Baru',
      accountEmail: accountEmail || db.settings.googleAccountEmail || 'adigunaherba@gmail.com',
      salesPersonName: salesPersonName || 'Sales Petugas',
      lastActive: new Date().toISOString(),
      deviceType: deviceType || 'Mobile/Web',
      ip: req.ip || '127.0.0.1',
    });
  }
  writeDb(db);
  res.json({ success: true, connectedDevices: db.connectedDevices });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SalesQu Adiguna Herba server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
