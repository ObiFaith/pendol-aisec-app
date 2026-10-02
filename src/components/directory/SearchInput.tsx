import { Search, X } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label className="search-field">
      <Search size={17} aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Find a company..."
        aria-label="Search companies"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <X size={15} />
        </button>
      )}
      {!value && <kbd>/</kbd>}
    </label>
  );
}
