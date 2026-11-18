export const SAVED_KEY = "dna-saved-studies-v1";
export type SavedSnapshot = Readonly<{ ids: readonly string[]; ready: boolean; temporary: boolean }>;
export const EMPTY_SAVED: SavedSnapshot = { ids: [], ready: false, temporary: false };
type SavedStorage = Pick<Storage, "getItem" | "setItem">;

export function parseSavedIds(raw: string | null): string[] {
  if (!raw || raw.length > 50000) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1 || !("ids" in data) || !Array.isArray(data.ids)) return [];
    return [...new Set(data.ids.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 120 && /^[a-zA-Z0-9_-]+$/.test(id)))].slice(0, 200);
  } catch { return []; }
}

/** Storage is injected so persistence failures and external changes can be tested. */
export function createSavedStore(storage: () => SavedStorage) {
  let snapshot = EMPTY_SAVED;
  const listeners = new Set<() => void>();
  function publish(ids: readonly string[], temporary: boolean) {
    if (snapshot.ready && snapshot.temporary === temporary && JSON.stringify(snapshot.ids) === JSON.stringify(ids)) return;
    snapshot = { ids, ready: true, temporary };
    listeners.forEach((listener) => listener());
  }
  function refresh() {
    if (snapshot.temporary) return;
    try { publish(parseSavedIds(storage().getItem(SAVED_KEY)), false); }
    catch { publish(snapshot.ids, true); }
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh,
    toggle(id: string) {
      if (parseSavedIds(JSON.stringify({ version: 1, ids: [id] })).length !== 1) return;
      refresh();
      const ids = snapshot.ids.includes(id) ? snapshot.ids.filter((saved) => saved !== id) : [...snapshot.ids, id].slice(-200);
      let temporary = snapshot.temporary;
      if (!temporary) {
        try { storage().setItem(SAVED_KEY, JSON.stringify({ version: 1, ids })); }
        catch { temporary = true; }
      }
      publish(ids, temporary);
    },
  };
}
