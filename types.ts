export const PAGES = [1, 2] as const;
export type SourcePage = (typeof PAGES)[number];

export type Vendor = {
  id: string;
  name: string;
  website: string;
  description: string;
  sourceUrl: string;
  sourcePage: SourcePage;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string | null;
};

export type Draft = Pick<Vendor, "name" | "website" | "description">;

export type SeedVendor = Omit<
  Vendor,
  "createdAt" | "updatedAt" | "refreshedAt"
>;

export type PageFilter = "all" | "1" | "2";

export type CategoryListing = {
  name: string;
  description: string;
  toolUrl: string;
};

export type CategoryPage = {
  sourceUrl: string;
  retrievedAt: string;
  note: string;
  listings: CategoryListing[];
};
