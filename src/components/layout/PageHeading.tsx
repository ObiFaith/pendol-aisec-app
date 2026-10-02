type PageHeadingProps = {
  totalCount: number;
};

export function PageHeading({ totalCount }: PageHeadingProps) {
  return (
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
        <span>{totalCount.toString().padStart(2, "0")}</span>
        <small>
          COMPANIES
          <br />
          IN REGISTER
        </small>
      </div>
    </section>
  );
}
