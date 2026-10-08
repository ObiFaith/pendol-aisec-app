import { useEffect, useMemo, useState } from "react";
import type { Draft, PageFilter, Vendor } from "../types/vendor";
import {
  fetchVendors,
  refreshVendor,
  updateVendor,
} from "../services/vendorService";

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pageFilter, setPageFilter] = useState<PageFilter>("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const records = await fetchVendors(search, {
          signal: controller.signal,
        });

        setVendors(records);
        setSelectedId((current) =>
          current && records.some((vendor) => vendor.id === current)
            ? current
            : (records[0]?.id ?? null),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setError(
          error instanceof Error ? error.message : "Could not load vendors.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const selected = vendors.find((vendor) => vendor.id === selectedId) ?? null;

  const filteredVendors = useMemo(
    () =>
      pageFilter === "all"
        ? vendors
        : vendors.filter((vendor) => String(vendor.sourcePage) === pageFilter),
    [vendors, pageFilter],
  );

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      name: selected.name,
      website: selected.website,
      description: selected.description,
    });
    setNotice("");
  }, [selected?.id, selected?.updatedAt]);

  const hasChanges = Boolean(
    draft &&
    selected &&
    (draft.name !== selected.name ||
      draft.website !== selected.website ||
      draft.description !== selected.description),
  );

  async function handleSaveVendor(event?: React.FormEvent<HTMLFormElement>) {
    if (event) {
      event.preventDefault();
    }
    if (!selected || !draft) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateVendor(selected.id, draft);
      setVendors((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice("Changes saved");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save vendor.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRefreshVendor() {
    if (!selected) return;
    setRefreshing(true);
    setError("");
    setNotice("");
    try {
      const updated = await refreshVendor(selected.id);
      setVendors((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice("Updated from CybersecTools");
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh from source.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  function changeDraft(field: keyof Draft, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  return {
    vendors,
    filteredVendors,
    selected,
    selectedId,
    setSelectedId,
    search,
    setSearch,
    pageFilter,
    setPageFilter,
    draft,
    changeDraft,
    hasChanges,
    loading,
    saving,
    refreshing,
    error,
    notice,
    saveVendor: handleSaveVendor,
    refreshVendor: handleRefreshVendor,
  };
}
