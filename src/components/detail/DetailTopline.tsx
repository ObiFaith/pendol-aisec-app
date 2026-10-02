type DetailToplineProps = {
  id: string;
};

export function DetailTopline({ id }: DetailToplineProps) {
  return (
    <div className="detail-topline">
      <div>
        <span className="section-index">02</span>
        <span className="detail-label">COMPANY RECORD</span>
      </div>
      <span className="record-id">REF / {id.toUpperCase()}</span>
    </div>
  );
}
