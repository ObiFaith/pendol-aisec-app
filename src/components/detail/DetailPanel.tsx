import React from "react";
import type { Draft, Vendor } from "../../types/vendor";
import { EmptyDetail } from "./EmptyDetail";
import { DetailTopline } from "./DetailTopline";
import { CompanyTitleRow } from "./CompanyTitleRow";
import { MetadataStrip } from "./MetadataStrip";
import { VendorEditForm } from "./VendorEditForm";
import { DetailFooter } from "./DetailFooter";

type DetailPanelProps = {
  vendor: Vendor | null;
  draft: Draft | null;
  onDraftChange: (field: keyof Draft, value: string) => void;
  hasChanges: boolean;
  saving: boolean;
  refreshing: boolean;
  notice: string;
  error: string;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onRefresh: () => void;
};

export function DetailPanel({
  vendor,
  draft,
  onDraftChange,
  hasChanges,
  saving,
  refreshing,
  notice,
  error,
  onSave,
  onRefresh,
}: DetailPanelProps) {
  return (
    <section className="detail-panel" aria-label="Company details">
      {vendor && draft ? (
        <>
          <DetailTopline id={vendor.id} />
          <CompanyTitleRow name={vendor.name} sourceUrl={vendor.sourceUrl} />
          <MetadataStrip
            sourcePage={vendor.sourcePage}
            refreshedAt={vendor.refreshedAt}
          />
          <VendorEditForm
            draft={draft}
            onDraftChange={onDraftChange}
            hasChanges={hasChanges}
            saving={saving}
            refreshing={refreshing}
            notice={notice}
            error={error}
            onSave={onSave}
            onRefresh={onRefresh}
          />
          <DetailFooter
            updatedAt={vendor.updatedAt}
            sourceUrl={vendor.sourceUrl}
          />
        </>
      ) : (
        <EmptyDetail />
      )}
    </section>
  );
}
