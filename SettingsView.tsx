import React, { useState } from 'react';
import {
  Settings,
  Store,
  QrCode,
  CreditCard,
  Bell,
  Smartphone,
  Upload,
  Check,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Moon,
  Sun,
  HardDrive,
  Mail,
  Percent,
} from 'lucide-react';
import { BusinessSettings, ConnectedDevice } from '../types.ts';
import { getDeviceId, getDeviceName, setDeviceName } from '../utils/syncEngine.ts';
import { formatCurrency } from '../utils/salesRules.ts';

interface SettingsViewProps {
  business: BusinessSettings;
  connectedDevices: ConnectedDevice[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSaveSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  onForceSync: () => void;
  onClearOfflineData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  business,
  connectedDevices,
  darkMode,
  onToggleDarkMode,
  onSaveSettings,
  onForceSync,
  onClearOfflineData,
}) => {
  const [formData, setFormData] = useState<BusinessSettings>({ ...business });
  const [localDeviceName, setLocalDeviceName] = useState(getDeviceName());
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleQRISUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, qrisImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setDeviceName(localDeviceName);
    await onSaveSettings(formData);
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Pengaturan {formData.brandName || 'SalesQu'} - {formData.businessName || 'Adiguna Herba'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola profil usaha, akun Google sinkronisasi multidevice, fee komisi sales, barcode QRIS, dan rekening transfer.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Tersimpan!</span>
            </>
          ) : (
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Google Account Multi-device Sync Isolation */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Mail className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Akun Google Terpusat (Sinkronisasi Antar Device)
              </h3>
              <p className="text-xs text-slate-400">
                Semua perangkat yang login dengan akun ini akan tersambung secara otomatis dan langsung update real-time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Akun Google Master (Adiguna Herba):
              </label>
              <input
                type="email"
                required
                value={formData.googleAccountEmail}
                onChange={(e) => setFormData({ ...formData, googleAccountEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-slate-900 dark:text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Jika HP sales login menggunakan akun lain, data toko ini tidak akan masuk (terisolasi aman).
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Komisi Default Sales (%):
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.defaultSalesFeePercent || 10}
                onChange={(e) => setFormData({ ...formData, defaultSalesFeePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Persentase fee default jika produk tidak memiliki nominal fee khusus per unit.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Business Profile */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Identitas Toko Herbal &amp; Brand
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Aplikasi / Web:
              </label>
              <input
                type="text"
                required
                value={formData.brandName || 'SalesQu'}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Usaha / Toko:
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Telepon / WhatsApp Toko:
              </label>
              <input
                type="tel"
                required
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Usaha:
              </label>
              <input
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Toko (Dicetak pada Struk &amp; Laporan PDF):
              </label>
              <input
                type="text"
                required
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ambang Batas Transaksi Besar (Notifikasi Admin):
              </label>
              <input
                type="number"
                min="50000"
                step="50000"
                value={formData.bigTransactionThreshold}
                onChange={(e) => setFormData({ ...formData, bigTransactionThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Payment Configuration (QRIS & Transfer) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Metode Pembayaran (QRIS Barcode &amp; Bank Transfer)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <label className="block font-bold text-slate-900 dark:text-white mb-1">
                  Upload Barcode / Gambar QRIS Toko:
                </label>
                <div className="flex justify-center mb-3">
                  {formData.qrisImage ? (
                    <img
                      src={formData.qrisImage}
                      alt="Preview QRIS"
                      className="w-40 h-40 object-contain rounded-xl border bg-white p-2 shadow-xs"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center p-3 text-center bg-white dark:bg-slate-900">
                      <QrCode className="w-10 h-10 text-slate-400 mb-1" />
                      <span className="text-[11px] text-slate-400">Belum ada barcode diunggah</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl cursor-pointer hover:bg-blue-50 text-blue-600 dark:text-blue-400 font-semibold transition">
                  <Upload className="w-4 h-4" />
                  <span>{formData.qrisImage ? 'Ganti Barcode QRIS' : 'Pilih Gambar Barcode QRIS'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRISUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <label className="block font-bold text-slate-900 dark:text-white">
                Informasi Rekening Bank Toko:
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Bank:
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="BCA / Mandiri / BRI"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nomor Rekening:
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  placeholder="8830129845"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Atas Nama Rekening:
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankAccountName}
                  onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                  placeholder="Adiguna Herba"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Display & Cache */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Tema Tampilan: {darkMode ? 'Mode Gelap (Dark)' : 'Mode Terang (Light)'}
              </h4>
              <p className="text-xs text-slate-400">
                Kenyamanan mata saat mengoperasikan aplikasi di siang maupun malam hari.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleDarkMode}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition"
          >
            Ganti ke {darkMode ? 'Mode Terang' : 'Mode Gelap'}
          </button>
        </div>
      </form>
    </div>
  );
};
