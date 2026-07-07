export interface NavItem {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
}

export interface StatItem {
  value: number;
  suffix?: string;
  label: string;
}

export interface ProductCard {
  id: string;
  title: string;
  category: string;
  image: string;
  href: string;
}

export interface LocationPin {
  id: string;
  country: string;
  flag: string;
  x: number;
  y: number;
}

export interface NewsItem {
  id: string;
  title: string;
  image: string;
  href: string;
}
