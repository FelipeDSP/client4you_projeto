import { useState, useMemo } from "react";
import { Filter, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  hasWhatsApp: null,
  hasEmail: null,
};

export function LeadFiltersComponent({ leads, filters, onFiltersChange }: LeadFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-[250px] pl-9"
        />
      </div>

      {/* Contact Filters Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtrar Contatos
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 bg-popover" align="start">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasWhatsApp"
                checked={filters.hasWhatsApp === true}
                onCheckedChange={(checked) => 
                  onFiltersChange({ 
                    ...filters, 
                    hasWhatsApp: checked ? true : null 
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

            <div className="border-t pt-3">
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
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {(filters.search || activeFiltersCount > 0) && (
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
