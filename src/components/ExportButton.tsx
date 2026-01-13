import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { Lead } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  leads: Lead[];
  selectedLeads: string[];
}

export function ExportButton({ leads, selectedLeads }: ExportButtonProps) {
  const { toast } = useToast();

  const getLeadsToExport = () => {
    if (selectedLeads.length > 0) {
      return leads.filter((l) => selectedLeads.includes(l.id));
    }
    return leads;
  };

  const exportToExcel = () => {
    const leadsToExport = getLeadsToExport();
    
    if (leadsToExport.length === 0) {
      toast({
        title: "Nenhum lead para exportar",
        description: "Faça uma busca primeiro para ter leads para exportar.",
        variant: "destructive",
      });
      return;
    }

    const data = leadsToExport.map((lead) => ({
      Nome: lead.name,
      Categoria: lead.category,
      Telefone: lead.phone,
      WhatsApp: lead.whatsapp || "",
      Email: lead.email || "",
      Endereço: lead.address,
      Cidade: lead.city,
      Estado: lead.state,
      Avaliação: lead.rating,
      "Nº Avaliações": lead.reviews,
      Website: lead.website || "",
      "Data Extração": new Date(lead.extractedAt).toLocaleDateString("pt-BR"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    worksheet["!cols"] = colWidths;

    const fileName = `leads_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Exportação concluída!",
      description: `${leadsToExport.length} leads exportados para ${fileName}`,
    });
  };

  const exportToCSV = () => {
    const leadsToExport = getLeadsToExport();
    
    if (leadsToExport.length === 0) {
      toast({
        title: "Nenhum lead para exportar",
        description: "Faça uma busca primeiro para ter leads para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Nome", "Categoria", "Telefone", "WhatsApp", "Email", "Endereço", "Cidade", "Estado", "Avaliação", "Nº Avaliações", "Website"];
    const csvContent = [
      headers.join(","),
      ...leadsToExport.map((lead) =>
        [
          `"${lead.name}"`,
          `"${lead.category}"`,
          `"${lead.phone}"`,
          `"${lead.whatsapp || ""}"`,
          `"${lead.email || ""}"`,
          `"${lead.address}"`,
          `"${lead.city}"`,
          `"${lead.state}"`,
          lead.rating,
          lead.reviews,
          `"${lead.website || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Exportação concluída!",
      description: `${leadsToExport.length} leads exportados para CSV`,
    });
  };

  const count = selectedLeads.length > 0 ? selectedLeads.length : leads.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={leads.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar {count > 0 && `(${count})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar para Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar para CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
