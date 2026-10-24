"use client";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  emptySnapshot,
  parseSection,
  restoreSnapshot,
  planImports,
  type Section,
  type Snapshot,
  type CompanionError,
} from "@/lib/companion/model";
import { saveCompanion, refreshCompanion } from "@/lib/actions/companion";
const EVENT = "rafeeq-device-change";
const EMPTY = JSON.stringify(emptySnapshot());
export function useDeviceValue(key: string, initial: string, session = false) {
  const subscribe = useCallback((notify: () => void) => {
    const listener = () => notify();
    window.addEventListener("storage", listener);
    window.addEventListener(EVENT, listener);
    return () => {
      window.removeEventListener("storage", listener);
      window.removeEventListener(EVENT, listener);
    };
  }, []);
  const read = useCallback(() => {
    try {
      return (
        (session ? window.sessionStorage : window.localStorage).getItem(key) ??
        initial
      );
    } catch {
      return initial;
    }
  }, [key, initial, session]);
  const server = useCallback(() => initial, [initial]);
  const value = useSyncExternalStore(subscribe, read, server);
  const write = useCallback(
    (next: string) => {
      try {
        (session ? window.sessionStorage : window.localStorage).setItem(
          key,
          next,
        );
        window.dispatchEvent(new Event(EVENT));
        return true;
      } catch {
        return false;
      }
    },
    [key, session],
  );
  return [value, write, read] as const;
}
export function useCompanion(
  initial: Snapshot,
  mode: "cloud" | "device",
  userId: string | null,
) {
  const [cloud, setCloud] = useState(initial);
  const [raw, write, read] = useDeviceValue(
    `rafeeq.companion.v1.${userId ?? "guest"}`,
    EMPTY,
  );
  const [guestRaw] = useDeviceValue("rafeeq.companion.v1.guest", EMPTY);
  const guest = useMemo(() => {
    try {
      return restoreSnapshot(JSON.parse(guestRaw));
    } catch {
      return null;
    }
  }, [guestRaw]);
  const device = useMemo(() => {
    try {
      return restoreSnapshot(JSON.parse(raw));
    } catch {
      return null;
    }
  }, [raw]);
  const snapshot = mode === "cloud" ? cloud : (device ?? emptySnapshot());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CompanionError | null>(null);
  const [saved, setSaved] = useState(false);
  async function reload() {
    if (mode !== "cloud") return;
    setBusy(true);
    try {
      const result = await refreshCompanion();
      if (result.snapshot) {
        setCloud(result.snapshot);
        setError(null);
      } else setError(result.error);
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }
  async function save(section: Section, payload: unknown) {
    if (busy) return false;
    setError(null);
    setSaved(false);
    const parsed = parseSection(section, payload);
    if (!parsed) {
      setError("invalid");
      return false;
    }
    if (mode === "device") {
      let current: Snapshot | null;
      try {
        current = restoreSnapshot(JSON.parse(read()));
      } catch {
        current = null;
      }
      if (!current) {
        setError("failed");
        return false;
      }
      if (current.versions[section] !== snapshot.versions[section]) {
        setError("conflict");
        return false;
      }
      Object.assign(current.data, { [section]: parsed.payload });
      current.versions[section] += 1;
      if (!write(JSON.stringify(current))) {
        setError("failed");
        return false;
      }
      setSaved(true);
      return true;
    }
    setBusy(true);
    try {
      const result = await saveCompanion(
        section,
        parsed.payload,
        snapshot.versions[section],
      );
      if (result.error) {
        setError(result.error);
        if (result.error === "conflict") {
          const fresh = await refreshCompanion();
          if (fresh.snapshot) setCloud(fresh.snapshot);
        }
        return false;
      }
      setCloud((previous) => ({
        data: { ...previous.data, [section]: result.payload },
        versions: { ...previous.versions, [section]: result.version },
      }));
      setSaved(true);
      return true;
    } catch {
      setError("failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const imports = userId
    ? planImports(snapshot, mode === "cloud" ? device : null, guest)
    : [];
  const canImport = imports.length > 0;
  async function importGuest() {
    if (!canImport || busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      if (mode === "device") {
        const current = restoreSnapshot(JSON.parse(read()));
        if (!current) {
          setError("failed");
          return;
        }
        for (const { section, payload } of imports)
          if (current.versions[section] === 0) {
            Object.assign(current.data, { [section]: payload });
            current.versions[section] = 1;
          }
        if (!write(JSON.stringify(current))) {
          setError("failed");
          return;
        }
      } else {
        for (const { section, payload } of imports) {
          const result = await saveCompanion(section, payload, 0);
          if (result.error) {
            setError(result.error);
            if (result.error === "conflict") {
              const fresh = await refreshCompanion();
              if (fresh.snapshot) setCloud(fresh.snapshot);
            }
            return;
          }
          setCloud((previous) => ({
            data: { ...previous.data, [section]: result.payload },
            versions: { ...previous.versions, [section]: result.version },
          }));
        }
      }
      setSaved(true);
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }
  return {
    snapshot,
    busy,
    error,
    saved,
    save,
    reload,
    canImport,
    importGuest,
    clearStatus: () => {
      setError(null);
      setSaved(false);
    },
  };
}
