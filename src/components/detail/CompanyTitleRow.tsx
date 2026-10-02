import { ArrowUpRight } from "lucide-react";

type CompanyTitleRowProps = {
  name: string;
  sourceUrl: string;
};

export function CompanyTitleRow({ name, sourceUrl }: CompanyTitleRowProps) {
  return (
    <div className="company-title-row">
      <div className="company-monogram">
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className="company-title">
        <p>AI SECURITY COMPANY</p>
        <h2>{name}</h2>
      </div>
      <a
        className="source-link"
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        title="Open source listing"
      >
        <ArrowUpRight size={18} />
      </a>
    </div>
  );
}
