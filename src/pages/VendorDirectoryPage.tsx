import { PageHeading } from "../components/layout/PageHeading";
import { DirectoryPanel } from "../components/directory/DirectoryPanel";
import { DetailPanel } from "../components/detail/DetailPanel";
import { useVendors } from "../hooks/useVendors";

export function VendorDirectoryPage() {
  const {
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
    saveVendor,
    refreshVendor,
  } = useVendors();

  return (
    <>
      <PageHeading totalCount={vendors.length} />
      <section className="workspace" aria-label="Vendor workspace">
        <DirectoryPanel
          vendors={filteredVendors}
          selectedId={selectedId}
          onSelectVendor={setSelectedId}
          search={search}
          onSearchChange={setSearch}
          pageFilter={pageFilter}
          onPageFilterChange={setPageFilter}
          loading={loading}
        />
        <DetailPanel
          vendor={selected}
          draft={draft}
          onDraftChange={changeDraft}
          hasChanges={hasChanges}
          saving={saving}
          refreshing={refreshing}
          notice={notice}
          error={error}
          onSave={saveVendor}
          onRefresh={refreshVendor}
        />
      </section>
    </>
  );
}
