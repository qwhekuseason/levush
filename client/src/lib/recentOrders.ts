/**
 * Orders placed on this device, so the tracking page can offer one-tap lookup
 * without putting the phone number in a URL.
 */
export interface RecentOrder {
  id: string;
  phone: string;
  total: number;
  at: number;
}

const KEY = 'levush.recentOrders.v1';
const MAX = 5;

export function getRecentOrders(): RecentOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentOrder[]) : [];
  } catch {
    return [];
  }
}

export function rememberOrder(o: RecentOrder): void {
  try {
    const rest = getRecentOrders().filter((r) => r.id !== o.id);
    localStorage.setItem(KEY, JSON.stringify([o, ...rest].slice(0, MAX)));
  } catch {
    /* storage unavailable — tracking still works by typing details */
  }
}
