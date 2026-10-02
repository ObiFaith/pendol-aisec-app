export function formatDate(value: string | null): string {
  if (!value) return "Never refreshed";
  const date = new Date(
    value.includes("T") ? value : `${value.replace(" ", "T")}Z`,
  );
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function websiteLabel(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Website not provided";
  }
}
