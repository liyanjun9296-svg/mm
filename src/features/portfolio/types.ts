export type WorkCategory = "video" | "photo" | "article";

export type FeaturedLayout = "large" | "compact";

export type WorkItem = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: WorkCategory;
  subcategory?: string;
  duration?: string;
  coverImage: string;
  mediaUrl: string;
  role: string;
  year: string;
  platform: string;
  externalUrl?: string;
  detailImages?: string[];
  featured?: boolean;
  featuredLayout?: FeaturedLayout;
};

