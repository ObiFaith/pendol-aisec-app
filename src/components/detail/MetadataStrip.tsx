import { RefreshCw } from "lucide-react";
import { formatDate } from "../../utils/formatters";

type MetadataStripProps = {
  sourcePage: number;
  refreshedAt: string | null;
};

export function MetadataStrip({ sourcePage, refreshedAt }: MetadataStripProps) {
  return (
    <div className="metadata-strip">
      <span>
        <i className="metadata-dot" /> SOURCE PAGE{" "}
        {String(sourcePage).padStart(2, "0")}
      </span>
      <span>
        <RefreshCw size={12} />{" "}
        {refreshedAt
          ? `REFRESHED ${formatDate(refreshedAt).toUpperCase()}`
          : "NOT YET REFRESHED"}
      </span>
    </div>
  );
}
