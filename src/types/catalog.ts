export type StockStatus = "in_stock" | "limited" | "out_of_stock";

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
  active: boolean;
  order: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  images: string[];
  active: boolean;
  featured: boolean;
  stockStatus: StockStatus;
};

export type BannerDestination = {
  type: "category" | "product" | "collection" | "campaign";
  id: string;
};

export type Banner = {
  id: string;
  title: string;
  image: string;
  destination: BannerDestination;
  active: boolean;
  order: number;
};
