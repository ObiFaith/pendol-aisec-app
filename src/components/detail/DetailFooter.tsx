import { ArrowUpRight } from "lucide-react";
import { formatDate } from "../../utils/formatters";

type DetailFooterProps = {
  updatedAt: string;
  sourceUrl: string;
};

export function DetailFooter({ updatedAt, sourceUrl }: DetailFooterProps) {
  return (
    <footer className="detail-footer">
      <span>
        RECORD UPDATED {formatDate(updatedAt).toUpperCase()}
      </span>
      <span>
        DATA SOURCE{" "}
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          CYBERSECTOOLS <ArrowUpRight size={11} />
        </a>
      </span>
    </footer>
  );
}
