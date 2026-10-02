import React from "react";
import {
  Check,
  CircleAlert,
  ExternalLink,
  Globe2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import type { Draft } from "../../types/vendor";

type VendorEditFormProps = {
  draft: Draft;
  onDraftChange: (field: keyof Draft, value: string) => void;
  hasChanges: boolean;
  saving: boolean;
  refreshing: boolean;
  notice: string;
  error: string;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onRefresh: () => void;
};

export function VendorEditForm({
  draft,
  onDraftChange,
  hasChanges,
  saving,
  refreshing,
  notice,
  error,
  onSave,
  onRefresh,
}: VendorEditFormProps) {
  return (
    <form className="edit-form" onSubmit={onSave}>
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
        onChange={(event) => onDraftChange("name", event.target.value)}
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
            onDraftChange("website", event.target.value)
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
          onDraftChange("description", event.target.value)
        }
        rows={5}
        maxLength={12000}
      />
      <div className="form-actions">
        <button
          className="refresh-button"
          type="button"
          onClick={onRefresh}
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
  );
}
