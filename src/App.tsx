import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Globe2,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

type Vendor = {
  id: string;
  name: string;
  website: string;
  description: string;
  sourceUrl: string;
  sourcePage: number;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string | null;
};

type Draft = Pick<Vendor, "name" | "website" | "description">;
type PageFilter = "all" | "1" | "2";

async function requestVendors(query: string): Promise<Vendor[]> {
  const response = await fetch(`/api/vendors?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Could not load the vendor register.");
  return response.json() as Promise<Vendor[]>;
}

function formatDate(value: string | null): string {
  if (!value) return "Never refreshed";
  const date = new Date(
    value.includes("T") ? value : `${value.replace(" ", "T")}Z`,
  );
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function websiteLabel(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Website not provided";
  }
}

function App() {
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
    let active = true;
    setLoading(true);
    requestVendors(search)
      .then((records) => {
        if (!active) return;
        setVendors(records);
        setSelectedId((current) =>
          current && records.some((item) => item.id === current)
            ? current
            : (records[0]?.id ?? null),
        );
        setError("");
      })
      .catch((requestError: unknown) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load vendors.",
          );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
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

  async function saveVendor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !draft) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/vendors/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as Vendor | { error: string };
      if (!response.ok)
        throw new Error(
          "error" in result ? result.error : "Could not save vendor.",
        );
      const updated = result as Vendor;
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

  async function refreshVendor() {
    if (!selected) return;
    setRefreshing(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/vendors/${selected.id}/refresh`, {
        method: "POST",
      });
      const result = (await response.json()) as Vendor | { error: string };
      if (!response.ok)
        throw new Error(
          "error" in result ? result.error : "Could not refresh from source.",
        );
      const updated = result as Vendor;
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

  return (
    <main className="app-shell">
      <header className="masthead">
        <a
          className="brand"
          href="#"
          aria-label="AI Security Vendor Register home"
        >
          <span className="brand-mark">
            <ShieldCheck size={19} strokeWidth={1.8} />
          </span>
          <span>
            Fieldnotes<span className="brand-divider">/</span>
            <b>AI SECURITY</b>
          </span>
        </a>
        <div className="masthead-meta">
          <span className="live-indicator" /> LOCAL REGISTER{" "}
          <span className="meta-divider">·</span> CYBERSECTOOLS
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">
            VENDOR DIRECTORY <span>—</span> 2026
          </p>
          <h1>
            AI security <em>landscape</em>
          </h1>
          <p className="lede">
            A working register of companies found across the first two
            CybersecTools category pages.
          </p>
        </div>
        <div className="record-total">
          <span>{vendors.length.toString().padStart(2, "0")}</span>
          <small>
            COMPANIES
            <br />
            IN REGISTER
          </small>
        </div>
      </section>

      <section className="workspace" aria-label="Vendor workspace">
        <aside className="directory-panel">
          <div className="directory-heading">
            <div>
              <span className="section-index">01</span>
              <h2>Companies</h2>
            </div>
            <button
              className="icon-button filter-icon"
              type="button"
              aria-label="Filter companies"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a company..."
              aria-label="Search companies"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
            {!search && <kbd>/</kbd>}
          </label>
          <div className="list-toolbar">
            <div
              className="page-tabs"
              role="group"
              aria-label="Filter by source page"
            >
              {(["all", "1", "2"] as PageFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={pageFilter === filter ? "active" : ""}
                  onClick={() => setPageFilter(filter)}
                >
                  {filter === "all" ? "All" : `Page ${filter}`}
                </button>
              ))}
            </div>
            <span className="result-count">
              {filteredVendors.length} RESULTS <ArrowDownUp size={11} />
            </span>
          </div>
          <div className="company-list" role="listbox" aria-label="Companies">
            {loading && (
              <div className="list-message">
                <LoaderCircle className="spin" size={18} /> Loading register
              </div>
            )}
            {!loading && filteredVendors.length === 0 && (
              <div className="list-message">
                No companies match this search.
              </div>
            )}
            {!loading &&
              filteredVendors.map((vendor, index) => (
                <button
                  key={vendor.id}
                  role="option"
                  aria-selected={vendor.id === selectedId}
                  className={`vendor-row ${vendor.id === selectedId ? "selected" : ""}`}
                  type="button"
                  onClick={() => setSelectedId(vendor.id)}
                >
                  <span className="row-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="vendor-row-copy">
                    <strong>{vendor.name}</strong>
                    <small>{websiteLabel(vendor.website)}</small>
                  </span>
                  <ChevronRight className="row-chevron" size={16} />
                </button>
              ))}
          </div>
          <div className="directory-foot">
            <span>Sorted alphabetically</span>
            <span>Pages 01–02</span>
          </div>
        </aside>

        <section className="detail-panel" aria-label="Company details">
          {selected && draft ? (
            <>
              <div className="detail-topline">
                <div>
                  <span className="section-index">02</span>
                  <span className="detail-label">COMPANY RECORD</span>
                </div>
                <span className="record-id">
                  REF / {selected.id.toUpperCase()}
                </span>
              </div>
              <div className="company-title-row">
                <div className="company-monogram">
                  {selected.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="company-title">
                  <p>AI SECURITY COMPANY</p>
                  <h2>{selected.name}</h2>
                </div>
                <a
                  className="source-link"
                  href={selected.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open source listing"
                >
                  <ArrowUpRight size={18} />
                </a>
              </div>
              <div className="metadata-strip">
                <span>
                  <i className="metadata-dot" /> SOURCE PAGE{" "}
                  {String(selected.sourcePage).padStart(2, "0")}
                </span>
                <span>
                  <RefreshCw size={12} />{" "}
                  {selected.refreshedAt
                    ? `REFRESHED ${formatDate(selected.refreshedAt).toUpperCase()}`
                    : "NOT YET REFRESHED"}
                </span>
              </div>

              <form className="edit-form" onSubmit={saveVendor}>
                <div className="form-heading">
                  <div>
                    <span className="section-index">03</span>
                    <h3>Company information</h3>
                  </div>
                  <span className="editable-note">EDITABLE RECORD</span>
                </div>
                <label className="field-label" htmlFor="vendor-name">
                  Company name
                </label>
                <input
                  id="vendor-name"
                  className="text-input name-input"
                  value={draft.name}
                  onChange={(event) => changeDraft("name", event.target.value)}
                  required
                  maxLength={160}
                />
                <label
                  className="field-label website-label"
                  htmlFor="vendor-website"
                >
                  Company website
                </label>
                <div className="website-field">
                  <Globe2 size={17} />
                  <input
                    id="vendor-website"
                    type="url"
                    value={draft.website}
                    onChange={(event) =>
                      changeDraft("website", event.target.value)
                    }
                    placeholder="https://example.com"
                  />
                  <a
                    href={draft.website || undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open company website"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
                <label
                  className="field-label description-label"
                  htmlFor="vendor-description"
                >
                  Description <span>{draft.description.length} / 12000</span>
                </label>
                <textarea
                  id="vendor-description"
                  value={draft.description}
                  onChange={(event) =>
                    changeDraft("description", event.target.value)
                  }
                  rows={5}
                  maxLength={12000}
                />
                <div className="form-actions">
                  <button
                    className="refresh-button"
                    type="button"
                    onClick={refreshVendor}
                    disabled={refreshing || saving}
                  >
                    {refreshing ? (
                      <LoaderCircle className="spin" size={15} />
                    ) : (
                      <RefreshCw size={15} />
                    )}
                    {refreshing ? "Refreshing" : "Refresh from source"}
                  </button>
                  <div className="save-actions">
                    {notice && (
                      <span className="notice">
                        <Check size={14} /> {notice}
                      </span>
                    )}
                    <button
                      className="save-button"
                      type="submit"
                      disabled={!hasChanges || saving || refreshing}
                    >
                      {saving ? (
                        <LoaderCircle className="spin" size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                      {saving ? "Saving" : "Save changes"}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="error-message" role="alert">
                    <CircleAlert size={15} />
                    {error}
                  </div>
                )}
              </form>

              <footer className="detail-footer">
                <span>
                  RECORD UPDATED {formatDate(selected.updatedAt).toUpperCase()}
                </span>
                <span>
                  DATA SOURCE{" "}
                  <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                    CYBERSECTOOLS <ArrowUpRight size={11} />
                  </a>
                </span>
              </footer>
            </>
          ) : (
            <div className="empty-detail">
              <ShieldCheck size={28} />
              <p>Select a company from the register</p>
            </div>
          )}
        </section>
      </section>

      <footer className="page-footer">
        <span>
          FIELDNOTES <span>·</span> AI SECURITY
        </span>
        <span>
          Source data from{" "}
          <a
            href="https://cybersectools.com/categories/ai-security"
            target="_blank"
            rel="noreferrer"
          >
            CybersecTools <ArrowUpRight size={11} />
          </a>
        </span>
      </footer>
    </main>
  );
}

export default App;
