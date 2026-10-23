import { Transaction, Product, Customer, StockMovement, AppNotification, BusinessSettings } from '../types.ts';

const STORAGE_KEYS = {
  PRODUCTS: 'omnisales_products',
  TRANSACTIONS: 'omnisales_transactions',
  CUSTOMERS: 'omnisales_customers',
  SETTINGS: 'omnisales_settings',
  NOTIFICATIONS: 'omnisales_notifications',
  OFFLINE_QUEUE: 'omnisales_offline_tx_queue',
  DEVICE_ID: 'omnisales_device_id',
  DEVICE_NAME: 'omnisales_device_name',
  THEME: 'omnisales_theme',
};

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!id) {
    id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }
  return id;
}

export function getDeviceName(): string {
  return localStorage.getItem(STORAGE_KEYS.DEVICE_NAME) || 'Kasir ' + getDeviceId().slice(-4).toUpperCase();
}

export function setDeviceName(name: string) {
  localStorage.setItem(STORAGE_KEYS.DEVICE_NAME, name);
}

export function getOfflineQueue(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: Transaction[]) {
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

export function getCachedData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setCachedData<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

export class SyncEngine {
  private eventSource: EventSource | null = null;
  private onDataUpdatedCallback?: () => void;
  private onNotificationCallback?: (notif: AppNotification) => void;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor(
    onDataUpdated?: () => void,
    onNotification?: (notif: AppNotification) => void
  ) {
    this.onDataUpdatedCallback = onDataUpdated;
    this.onNotificationCallback = onNotification;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      this.initSSE();
      this.syncPendingOffline();
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.initSSE();
      this.syncPendingOffline();
    } else {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    }
    if (this.onDataUpdatedCallback) this.onDataUpdatedCallback();
  }

  public initSSE() {
    if (typeof window === 'undefined' || !this.isOnline) return;

    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NOTIFICATION' && this.onNotificationCallback) {
            this.onNotificationCallback(payload.payload);
          }
          // On any data change broadcast, trigger full refresh
          if (
            [
              'TRANSACTION_CREATED',
              'TRANSACTION_UPDATED',
              'STOCK_UPDATED',
              'PRODUCT_SAVED',
              'PRODUCT_DELETED',
              'CUSTOMER_SAVED',
              'SETTINGS_UPDATED',
              'SYNC_COMPLETED',
            ].includes(payload.type)
          ) {
            if (this.onDataUpdatedCallback) {
              this.onDataUpdatedCallback();
            }
          }
        } catch {
          // parse error
        }
      };

      this.eventSource.onerror = () => {
        // SSE reconnect handles itself, or will reconnect on network status
      };
    } catch (e) {
      console.warn('SSE could not initialize', e);
    }
  }

  public async syncPendingOffline(): Promise<number> {
    const queue = getOfflineQueue();
    if (queue.length === 0 || !this.isOnline) return 0;

    try {
      const response = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offlineTransactions: queue,
          deviceId: getDeviceId(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        saveOfflineQueue([]); // Clear queue upon successful sync
        if (this.onDataUpdatedCallback) this.onDataUpdatedCallback();
        return result.addedCount || queue.length;
      }
    } catch (err) {
      console.warn('Could not sync offline queue', err);
    }
    return 0;
  }

  public close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
