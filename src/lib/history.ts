'use client';

import { generateId } from '@/lib/utils';
import type { QRCodeHistoryItem, QRCodeType, QRCodeOptions } from '@/types/qrcode';

export type { QRCodeHistoryItem };

const HISTORY_KEY = 'qr-code-generator-history';
const MAX_HISTORY = 50;

export function getHistory(): QRCodeHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export function addToHistory(
  type: QRCodeType,
  data: Record<string, string>,
  options: QRCodeOptions,
  label: string
): QRCodeHistoryItem {
  const item: QRCodeHistoryItem = {
    id: generateId(),
    type,
    data,
    options,
    timestamp: Date.now(),
    label,
  };

  const history = getHistory();
  const updated = [item, ...history].slice(0, MAX_HISTORY);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }
  
  return item;
}

export function removeFromHistory(id: string): void {
  const history = getHistory();
  const updated = history.filter((item) => item.id !== id);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }
}

export function clearHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(HISTORY_KEY);
  }
}