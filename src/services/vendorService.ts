import type { Draft, Vendor } from "../types/vendor";

export async function fetchVendors(
  query: string = "",
  options?: { signal?: AbortSignal },
): Promise<Vendor[]> {
  const response = await fetch(`/api/vendors?q=${encodeURIComponent(query)}`, {
    signal: options?.signal,
  });
  if (!response.ok) {
    throw new Error("Could not load the vendor register.");
  }
  return response.json() as Promise<Vendor[]>;
}

export async function updateVendor(id: string, draft: Draft): Promise<Vendor> {
  const response = await fetch(`/api/vendors/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  const result = (await response.json()) as Vendor | { error: string };
  if (!response.ok) {
    throw new Error(
      "error" in result ? result.error : "Could not save vendor.",
    );
  }
  return result as Vendor;
}

export async function refreshVendor(id: string): Promise<Vendor> {
  const response = await fetch(
    `/api/vendors/${encodeURIComponent(id)}/refresh`,
    {
      method: "POST",
    },
  );
  const result = (await response.json()) as Vendor | { error: string };
  if (!response.ok) {
    throw new Error(
      "error" in result ? result.error : "Could not refresh from source.",
    );
  }
  return result as Vendor;
}
