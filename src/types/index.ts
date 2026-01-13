export interface Lead {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string;
  rating: number;
  reviews: number;
  category: string;
  website: string | null;
  extractedAt: string;
}

export interface SearchHistory {
  id: string;
  query: string;
  location: string;
  resultsCount: number;
  searchedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
}
