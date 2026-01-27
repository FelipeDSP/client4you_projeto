import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  MapPin, 
  Star, 
  Globe,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { Lead } from "@/types";

interface LeadTableProps {
  leads: Lead[];
  onDelete?: (id: string) => void;
  selectedLeads?: string[];
  onSelectionChange?: (ids: string[]) => void;
  isLoading?: boolean;
}

// Função auxiliar para deixar a URL bonita (apenas o domínio)
const formatWebsite = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch (e) {
    return "Link";
  }
};

export function LeadTable({ 
  leads, 
  onDelete, 
  selectedLeads = [], 
  onSelectionChange,
  isLoading 
}: LeadTableProps) {
  
  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedLeads.length === leads.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(leads.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedLeads.includes(id)) {
      onSelectionChange(selectedLeads.filter((leadId) => leadId !== id));
    } else {
      onSelectionChange([...selectedLeads, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2 w-full">
            <div className="h-10 bg-gray-100 rounded w-full"></div>
            <div className="h-10 bg-gray-100 rounded w-full"></div>
            <div className="h-10 bg-gray-100 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Nenhum lead para exibir.
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader className="bg-gray-50 text-xs uppercase tracking-wider">
          <TableRow>
            <TableHead className="w-[40px] pl-4">
              <Checkbox 
                checked={leads.length > 0 && selectedLeads.length === leads.length}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="min-w-[200px] font-semibold text-gray-600">Empresa</TableHead>
            <TableHead className="min-w-[130px] font-semibold text-gray-600">Telefone</TableHead>
            <TableHead className="w-[100px] text-center font-semibold text-gray-600">Whats</TableHead>
            <TableHead className="min-w-[140px] font-semibold text-gray-600">Site</TableHead>
            <TableHead className="min-w-[180px] font-semibold text-gray-600">Endereço</TableHead>
            <TableHead className="w-[80px] text-center font-semibold text-gray-600">Nota</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-gray-50/80 group h-12 text-sm border-b border-gray-100">
              {/* Checkbox */}
              <TableCell className="pl-4">
                <Checkbox 
                  checked={selectedLeads.includes(lead.id)}
                  onCheckedChange={() => toggleSelectOne(lead.id)}
                />
              </TableCell>

              {/* Nome */}
              <TableCell className="py-2 font-medium text-gray-900">
                <div className="truncate max-w-[200px]" title={lead.name}>
                  {lead.name}
                </div>
              </TableCell>

              {/* Telefone (Monoespaçado para leitura fácil) */}
              <TableCell className="py-2">
                {lead.phone ? (
                  <span className="font-mono text-gray-600 tracking-tight whitespace-nowrap">
                    {lead.phone}
                  </span>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </TableCell>

              {/* WhatsApp (Badge Compacto) */}
              <TableCell className="py-2 text-center">
                {lead.hasWhatsApp ? (
                  <div className="flex justify-center">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600" title="Possui WhatsApp">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </TableCell>

              {/* Site (Domínio Limpo) */}
              <TableCell className="py-2">
                {lead.website ? (
                  <a 
                    href={lead.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors group/link max-w-[140px]"
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0 opacity-70 group-hover/link:opacity-100" />
                    <span className="truncate hover:underline decoration-blue-600/30">
                      {formatWebsite(lead.website)}
                    </span>
                  </a>
                ) : (
                  <span className="text-gray-300 text-xs pl-2">Sem site</span>
                )}
              </TableCell>

              {/* Endereço (Truncado) */}
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5 text-gray-500 max-w-[180px]" title={lead.address}>
                  <MapPin className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  <span className="truncate text-xs">
                    {lead.address || "N/A"}
                  </span>
                </div>
              </TableCell>

              {/* Nota */}
              <TableCell className="text-center py-2">
                {lead.rating ? (
                  <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-100/50">
                    <span className="font-bold text-xs">{lead.rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </TableCell>

              {/* Ações */}
              <TableCell className="text-right py-2 pr-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => onDelete && onDelete(lead.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}