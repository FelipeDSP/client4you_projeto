import { useState } from "react";
import { Lead } from "@/types";
import { Trash2, Star, Phone, Globe, MessageCircle, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LeadTableProps {
  leads: Lead[];
  onDelete: (id: string) => void;
  selectedLeads: string[];
  onSelectionChange: (ids: string[]) => void;
}

const ITEMS_PER_PAGE = 10;

export function LeadTable({ leads, onDelete, selectedLeads, onSelectionChange }: LeadTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(leads.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeads = leads.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(leads.map((l) => l.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedLeads, id]);
    } else {
      onSelectionChange(selectedLeads.filter((lid) => lid !== id));
    }
  };

  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;
  const isSomeSelected = selectedLeads.length > 0 && selectedLeads.length < leads.length;

  if (leads.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Nenhum lead encontrado. Faça uma busca para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                  className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Avaliação</TableHead>
              <TableHead>Site</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => handleSelectOne(lead.id, !!checked)}
                    aria-label={`Selecionar ${lead.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{lead.name}</span>
                    <span className="text-xs text-muted-foreground">{lead.address}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{lead.category}</Badge>
                </TableCell>
                <TableCell>
                  {lead.hasWhatsApp ? (
                    <a
                      href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </a>
                  ) : (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm hover:text-primary">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {lead.hasWhatsApp ? (
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Sim
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Não
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="h-3 w-3" />
                      {lead.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {lead.city}, {lead.state}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{lead.rating}</span>
                    <span className="text-xs text-muted-foreground">({lead.reviews})</span>
                  </div>
                </TableCell>
                <TableCell>
                  {lead.website ? (
                    <a
                      href={`https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      {lead.website}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, leads.length)} de {leads.length} leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
