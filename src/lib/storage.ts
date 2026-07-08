/* Local persistence (auto-save on this device). LS is false when
 * localStorage is unavailable (private windows, blocked storage),
 * and every read/write silently no-ops in that case. */
export const LS = (() => {
  try {
    localStorage.setItem("__zk", "1");
    localStorage.removeItem("__zk");
    return true;
  } catch {
    return false;
  }
})();

export function loadLS<T>(key: string, fb: T): T {
  if (!LS) return fb;
  try {
    const v = localStorage.getItem(key);
    return v == null ? fb : JSON.parse(v);
  } catch {
    return fb;
  }
}

export function saveLS(key: string, val: unknown): void {
  if (!LS) return;
  try {
    if (val == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* storage full or blocked — losing auto-save is fine */
  }
}
