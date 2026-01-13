import { useState } from "react";
import * as XLSX from "xlsx";
import { Header } from "@/components/Header";
import { useLeads } from "@/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, MapPin, Calendar, Hash, Trash2, Eye, Phone, Mail, MessageCircle, Star, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SearchHistory, Lead } from "@/types";

export default function History() {
  const { searchHistory, getLeadsBySearchId, deleteSearchHistory, clearAllHistory } = useLeads();
  const { toast } = useToast();
  const [selectedSearch, setSelectedSearch] = useState<SearchHistory | null>(null);
  const [searchLeads, setSearchLeads] = useState<Lead[]>([]);

  const handleViewSearch = (search: SearchHistory) => {
    const leads = getLeadsBySearchId(search.id);
    setSearchLeads(leads);
    setSelectedSearch(search);
  };

  const handleDeleteSearch = (searchId: string) => {
    deleteSearchHistory(searchId);
    toast({
      title: "Pesquisa removida",
      description: "A pesquisa e seus leads foram removidos do histórico.",
    });
  };

  const handleClearAll = () => {
    clearAllHistory();
    toast({
      title: "Histórico limpo",
      description: "Todo o histórico foi removido com sucesso.",
    });
  };

  const handleDownloadLeads = (search: SearchHistory) => {
    const leads = getLeadsBySearchId(search.id);
    
    if (leads.length === 0) {
      toast({
        title: "Nenhum lead disponível",
        description: "Os leads desta pesquisa não estão mais disponíveis.",
        variant: "destructive",
      });
      return;
    }

    const data = leads.map((lead) => ({
      Nome: lead.name,
      Categoria: lead.category,
      Telefone: lead.phone,
      WhatsApp: lead.whatsapp || "",
      "Tem WhatsApp": lead.whatsapp ? "Sim" : "Não",
      Email: lead.email || "",
      "Tem Email": lead.email ? "Sim" : "Não",
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

    // Create filename from search query and location
    const sanitizedQuery = search.query.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const sanitizedLocation = search.location.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const fileName = `leads_${sanitizedQuery}_${sanitizedLocation}_${new Date(search.searchedAt).toISOString().split("T")[0]}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Download concluído!",
      description: `${leads.length} leads exportados para ${fileName}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Histórico de Buscas</h1>
            <p className="text-muted-foreground">Veja todas as buscas realizadas</p>
          </div>

          {searchHistory.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Histórico
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar todo o histórico?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá remover todas as {searchHistory.length} pesquisas e seus leads associados. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>
                    Sim, limpar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {searchHistory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma busca realizada ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchHistory.map((search) => (
              <Card key={search.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-4 w-4 text-primary" />
                      {search.query}
                    </CardTitle>
                    <Badge variant="secondary">
                      <Hash className="h-3 w-3 mr-1" />
                      {search.resultsCount}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {search.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(search.searchedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewSearch(search)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Leads
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownloadLeads(search)}
                      title="Baixar Excel"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover pesquisa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá remover a pesquisa "{search.query}" e todos os {search.resultsCount} leads associados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSearch(search.id)}>
                            Sim, remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal to view search leads */}
        <Dialog open={!!selectedSearch} onOpenChange={(open) => !open && setSelectedSearch(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    {selectedSearch?.query}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedSearch?.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {searchLeads.length} leads
                    </span>
                  </DialogDescription>
                </div>
                {searchLeads.length > 0 && selectedSearch && (
                  <Button 
                    size="sm" 
                    onClick={() => handleDownloadLeads(selectedSearch)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Excel
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto">
              {searchLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2" />
                  <p>Os leads desta pesquisa não estão mais disponíveis.</p>
                  <p className="text-sm">Eles podem ter sido removidos ou limpos.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Avaliação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{lead.name}</span>
                            <span className="text-xs text-muted-foreground">{lead.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm hover:text-primary">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </a>
                        </TableCell>
                        <TableCell>
                          {lead.whatsapp ? (
                            <a
                              href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                            >
                              <MessageCircle className="h-3 w-3" />
                              {lead.whatsapp}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{lead.rating}</span>
                            <span className="text-xs text-muted-foreground">({lead.reviews})</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
