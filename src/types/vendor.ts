export type Vendor = {
  id: string;
  name: string;
  website: string;
  description: string;
  sourceUrl: string;
  sourcePage: number;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string | null;
};

export type Draft = Pick<Vendor, "name" | "website" | "description">;

export type SeedVendor = Pick<
  Vendor,
  "name" | "website" | "description" | "sourceUrl"
> & { sourcePage: 1 | 2 };

export type PageFilter = "all" | "1" | "2";
