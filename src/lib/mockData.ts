import { Lead, SearchHistory } from "@/types";

export const mockLeads: Lead[] = [
  {
    id: "1",
    name: "Pizzaria Bella Italia",
    phone: "(11) 3456-7890",
    whatsapp: "(11) 99876-5432",
    address: "Rua Augusta, 1234",
    city: "São Paulo",
    state: "SP",
    rating: 4.5,
    reviews: 234,
    category: "Pizzaria",
    website: "www.bellaitalia.com.br",
    extractedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Restaurante Sabor Mineiro",
    phone: "(11) 2345-6789",
    whatsapp: "(11) 98765-4321",
    address: "Av. Paulista, 567",
    city: "São Paulo",
    state: "SP",
    rating: 4.8,
    reviews: 456,
    category: "Restaurante",
    website: "www.sabormineiro.com.br",
    extractedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Hamburgueria The Burger",
    phone: "(11) 4567-8901",
    whatsapp: null,
    address: "Rua Oscar Freire, 890",
    city: "São Paulo",
    state: "SP",
    rating: 4.2,
    reviews: 189,
    category: "Hamburgueria",
    website: null,
    extractedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Sushi Yamamoto",
    phone: "(11) 5678-9012",
    whatsapp: "(11) 97654-3210",
    address: "Rua Liberdade, 321",
    city: "São Paulo",
    state: "SP",
    rating: 4.9,
    reviews: 567,
    category: "Japonês",
    website: "www.sushiyamamoto.com.br",
    extractedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Padaria Pão Quente",
    phone: "(11) 6789-0123",
    whatsapp: "(11) 96543-2109",
    address: "Av. Brasil, 1500",
    city: "São Paulo",
    state: "SP",
    rating: 4.3,
    reviews: 312,
    category: "Padaria",
    website: null,
    extractedAt: new Date().toISOString(),
  },
];

export const mockSearchHistory: SearchHistory[] = [
  {
    id: "1",
    query: "Pizzarias",
    location: "São Paulo, SP",
    resultsCount: 45,
    searchedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    query: "Restaurantes",
    location: "São Paulo, SP",
    resultsCount: 120,
    searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export function generateMockLeads(query: string, location: string, count: number = 20): Lead[] {
  const categories = ["Restaurante", "Pizzaria", "Hamburgueria", "Padaria", "Cafeteria", "Bar", "Lanchonete"];
  const streets = ["Rua Augusta", "Av. Paulista", "Rua Oscar Freire", "Av. Brasil", "Rua da Consolação"];
  const names = [
    "Sabor & Arte", "Delícias do Chef", "Cantinho Gourmet", "Tempero da Casa", 
    "Paladar Especial", "Recanto do Sabor", "Casa do Pão", "Café & Cia"
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `generated-${Date.now()}-${i}`,
    name: `${names[Math.floor(Math.random() * names.length)]} ${i + 1}`,
    phone: `(11) ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    whatsapp: Math.random() > 0.3 ? `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : null,
    address: `${streets[Math.floor(Math.random() * streets.length)]}, ${Math.floor(100 + Math.random() * 2000)}`,
    city: location.split(",")[0] || "São Paulo",
    state: location.split(",")[1]?.trim() || "SP",
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    reviews: Math.floor(50 + Math.random() * 500),
    category: query || categories[Math.floor(Math.random() * categories.length)],
    website: Math.random() > 0.4 ? `www.${names[Math.floor(Math.random() * names.length)].toLowerCase().replace(/\s/g, "")}.com.br` : null,
    extractedAt: new Date().toISOString(),
  }));
}
