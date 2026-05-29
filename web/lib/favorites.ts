// Избранное — клиентское хранилище (localStorage), без регистрации (ТЗ §4.7).
// Храним снимок карточки, чтобы /favorites рендерился без обращения к серверу.
// Подписка реализована через внешний стор + useSyncExternalStore.
import { useSyncExternalStore } from "react";

export interface FavItem {
  id: number;
  slug: string;
  name: string;
  priceFrom: number | null;
  image: string | null;
  factory: string | null;
}

const KEY = "romashka:favorites";
const EMPTY: FavItem[] = [];

let snapshot: FavItem[] | null = null;
const listeners = new Set<() => void>();

function read(): FavItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavItem[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  snapshot = read();
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent) {
  if (e.key === KEY) emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): FavItem[] {
  if (snapshot === null) snapshot = read();
  return snapshot;
}

export function useFavorites(): FavItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function useIsFavorite(id: number): boolean {
  return useFavorites().some((f) => f.id === id);
}

function write(list: FavItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  emit();
}

/** Переключает избранное, возвращает новое состояние (true = в избранном). */
export function toggleFavorite(item: FavItem): boolean {
  const list = read();
  const exists = list.some((f) => f.id === item.id);
  write(exists ? list.filter((f) => f.id !== item.id) : [...list, item]);
  return !exists;
}

export function removeFavorite(id: number) {
  write(read().filter((f) => f.id !== id));
}
