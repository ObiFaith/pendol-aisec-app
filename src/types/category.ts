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
