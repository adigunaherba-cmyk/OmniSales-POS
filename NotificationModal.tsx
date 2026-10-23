import React from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  PlusCircle,
  Send,
} from 'lucide-react';
import { AppNotification, Product, Customer, BusinessSettings } from '../types.ts';
import { generateWhatsAppReminderMessage } from '../utils/salesRules.ts';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  products: Product[];
  customers: Customer[];
  business: BusinessSettings;
  onMarkAllRead: () => void;
  onQuickRestock: (product: Product) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  products,
  customers,
  business,
  onMarkAllRead,
  onQuickRestock,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Pusat Notifikasi &amp; Peringatan
              </h3>
              <p className="text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi telah dibaca'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Tandai Dibaca
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="font-medium">Tidak ada notifikasi saat ini.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const prod = notif.type === 'low_stock' ? products.find((p) => p.id === notif.targetId) : null;
              const cust = notif.type === 'due_date' ? customers.find((c) => c.id === notif.targetId) : null;

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    notif.read
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-80'
                      : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {notif.type === 'low_stock' && (
                        <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === 'big_transaction' && (
                        <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      )}
                      {notif.type === 'due_date' && (
                        <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(notif.date).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action shortcut */}
                      {prod && (
                        <button
                          type="button"
                          onClick={() => {
                            onQuickRestock(prod);
                            onClose();
                          }}
                          className="mt-2 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Restock {prod.name}</span>
                        </button>
                      )}

                      {cust && (
                        <a
                          href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=${generateWhatsAppReminderMessage(business, cust)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim Pengingat WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
