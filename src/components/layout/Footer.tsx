import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
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
  );
}
