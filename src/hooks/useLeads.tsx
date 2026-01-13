import { useState, useEffect } from "react";
import { Lead, SearchHistory } from "@/types";
import { mockLeads, mockSearchHistory, generateMockLeads } from "@/lib/mockData";

const LEADS_STORAGE_KEY = "leadextractor_leads";
const HISTORY_STORAGE_KEY = "leadextractor_history";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Load from localStorage or use mock data
    const storedLeads = localStorage.getItem(LEADS_STORAGE_KEY);
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

    setLeads(storedLeads ? JSON.parse(storedLeads) : mockLeads);
    setSearchHistory(storedHistory ? JSON.parse(storedHistory) : mockSearchHistory);
  }, []);

  const saveLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(newLeads));
  };

  const saveHistory = (newHistory: SearchHistory[]) => {
    setSearchHistory(newHistory);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
  };

  const searchLeads = async (query: string, location: string): Promise<Lead[]> => {
    setIsSearching(true);
    
    // Simulate API delay (1-3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    const count = Math.floor(10 + Math.random() * 30);
    const newLeads = generateMockLeads(query, location, count);

    // Add to history
    const historyEntry: SearchHistory = {
      id: `history-${Date.now()}`,
      query,
      location,
      resultsCount: count,
      searchedAt: new Date().toISOString(),
    };

    const updatedHistory = [historyEntry, ...searchHistory].slice(0, 50);
    saveHistory(updatedHistory);

    // Merge with existing leads (avoid duplicates by name)
    const existingNames = new Set(leads.map((l) => l.name));
    const uniqueNewLeads = newLeads.filter((l) => !existingNames.has(l.name));
    const updatedLeads = [...uniqueNewLeads, ...leads];
    saveLeads(updatedLeads);

    setIsSearching(false);
    return newLeads;
  };

  const deleteLead = (id: string) => {
    const updatedLeads = leads.filter((l) => l.id !== id);
    saveLeads(updatedLeads);
  };

  const clearAllLeads = () => {
    saveLeads([]);
  };

  return {
    leads,
    searchHistory,
    isSearching,
    searchLeads,
    deleteLead,
    clearAllLeads,
  };
}
