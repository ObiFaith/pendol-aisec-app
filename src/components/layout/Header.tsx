import { ShieldCheck } from "lucide-react";

export function Header() {
  return (
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
  );
}
