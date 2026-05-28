export type WorkCategory = "video" | "photo";

export type VideoSubcategory = "产品" | "AI" | "校园";

export type WorkItem = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: WorkCategory;
  subcategory?: VideoSubcategory;
  duration?: string;
  coverImage: string;
  mediaUrl: string;
  role: string;
  year: string;
  platform: string;
  externalUrl?: string;
};

