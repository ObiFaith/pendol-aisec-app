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

export type VendorSourceRecord = {
  name: string;
  website: string;
  description: string;
};

export type FetchPageResponse = Pick<Response, "ok" | "status" | "text">;
export type FetchPage = (sourceUrl: URL) => Promise<FetchPageResponse>;

export type VendorStore = Pick<
  VendorRepository,
  "getVendor" | "listVendors" | "updateVendor" | "refreshVendor"
>;

export type VendorRepository = {
  listVendors: (search?: string) => Promise<Vendor[]>;
  getVendor: (id: string) => Promise<Vendor | undefined>;
  updateVendor: (id: string, draft: Draft) => Promise<void>;
  refreshVendor: (id: string, draft: Draft) => Promise<void>;
  insertVendorIfNotExists: (vendor: SeedVendor) => Promise<void>;
  insertVendorsIfNotExist: (items: SeedVendor[]) => Promise<void>;
};
