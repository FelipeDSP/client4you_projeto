import { useState, useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Lead } from "@/types";

export interface LeadFilters {
  search: string;
  category: string;
  city: string;
  hasWhatsApp: boolean | null;
  hasEmail: boolean | null;
}

interface LeadFiltersProps {
  leads: Lead[];
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
}

export const defaultFilters: LeadFilters = {
  search: "",
  category: "",
  city: "",
  hasWhatsApp: null,
  hasEmail: null,
};

export function LeadFiltersComponent({ leads, filters, onFiltersChange }: LeadFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Extract unique categories and cities
  const categories = useMemo(() => {
    const unique = [...new Set(leads.map((l) => l.category))];
    return unique.sort();
  }, [leads]);

  const cities = useMemo(() => {
    const unique = [...new Set(leads.map((l) => l.city))];
    return unique.sort();
  }, [leads]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.city) count++;
    if (filters.hasWhatsApp !== null) count++;
    if (filters.hasEmail !== null) count++;
    return count;
  }, [filters]);

  const handleReset = () => {
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search Input */}
      <Input
        placeholder="Buscar por nome..."
        value={filters.search}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        className="w-[200px]"
      />

      {/* Category Select */}
      <Select
        value={filters.category}
        onValueChange={(value) => onFiltersChange({ ...filters, category: value === "all" ? "" : value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value="all">Todas categorias</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City Select */}
      <Select
        value={filters.city}
        onValueChange={(value) => onFiltersChange({ ...filters, city: value === "all" ? "" : value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Cidade" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value="all">Todas cidades</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Advanced Filters Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Mais Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-popover" align="start">
          <div className="space-y-4">
            <h4 className="font-medium">Filtros Avançados</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWhatsApp"
                  checked={filters.hasWhatsApp === true}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ 
                      ...filters, 
                      hasWhatsApp: checked ? true : filters.hasWhatsApp === true ? null : null 
                    })
                  }
                />
                <Label htmlFor="hasWhatsApp" className="text-sm">
                  Com WhatsApp
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noWhatsApp"
                  checked={filters.hasWhatsApp === false}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ 
                      ...filters, 
                      hasWhatsApp: checked ? false : null 
                    })
                  }
                />
                <Label htmlFor="noWhatsApp" className="text-sm">
                  Sem WhatsApp
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEmail"
                  checked={filters.hasEmail === true}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ 
                      ...filters, 
                      hasEmail: checked ? true : null 
                    })
                  }
                />
                <Label htmlFor="hasEmail" className="text-sm">
                  Com Email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noEmail"
                  checked={filters.hasEmail === false}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ 
                      ...filters, 
                      hasEmail: checked ? false : null 
                    })
                  }
                />
                <Label htmlFor="noEmail" className="text-sm">
                  Sem Email
                </Label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-muted-foreground">
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}

export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  return leads.filter((lead) => {
    // Search filter
    if (filters.search && !lead.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Category filter
    if (filters.category && lead.category !== filters.category) {
      return false;
    }

    // City filter
    if (filters.city && lead.city !== filters.city) {
      return false;
    }

    // WhatsApp filter
    if (filters.hasWhatsApp === true && !lead.whatsapp) {
      return false;
    }
    if (filters.hasWhatsApp === false && lead.whatsapp) {
      return false;
    }

    // Email filter
    if (filters.hasEmail === true && !lead.email) {
      return false;
    }
    if (filters.hasEmail === false && lead.email) {
      return false;
    }

    return true;
  });
}
