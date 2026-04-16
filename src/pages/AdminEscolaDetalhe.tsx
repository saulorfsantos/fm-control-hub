import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConselhoTab from "@/components/ConselhoTab";
import { useProcess } from "@/contexts/ProcessContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  ClipboardList,
  DollarSign,
  Check,
  Upload,
  Eye,
  Loader2,
  Sparkles,
  Clock,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Pencil,
  Ban,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SchoolData {
  name: string;
  type: string;
  regional: string;
  jurisdiction: string;
  status: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  diretor?: string;
  codigo_inep?: string;
}

// ——— Dashboard mocks ———
const mockMetrics = { received: 48750.0, spent: 31420.65, balance: 17329.35 };
const mockChecklistProgress = { done: 7, total: 12 };
const mockRecentTx = [
  { date: "10/04/2025", description: "Repasse FNDE — Parcela 2/2025", type: "credit" as const, value: 12500.0 },
  { date: "08/04/2025", description: "NF 4521 — Distribuidora Alimentos Ltda", type: "debit" as const, value: 4230.5 },
  { date: "02/04/2025", description: "NF 4498 — Hortifruti Regional ME", type: "debit" as const, value: 1890.0 },
  { date: "28/03/2025", description: "NF 4475 — Laticínios Serra Verde", type: "debit" as const, value: 2150.15 },
  { date: "15/03/2025", description: "Repasse FNDE — Parcela 1/2025", type: "credit" as const, value: 12500.0 },
];

// ——— Checklist mocks ———
interface ChecklistItem {
  id: string;
  number: number;
  name: string;
  type: "generated" | "manual";
  status: "pending" | "done" | "na";
  fileUrl?: string;
}

const mockChecklistItems: ChecklistItem[] = [
  { id: "1", number: 1, name: "Ofício de encaminhamento da Prestação de Contas", type: "generated", status: "done", fileUrl: "#" },
  { id: "2", number: 2, name: "Demonstrativo Sintético Anual da Execução Físico-Financeira", type: "generated", status: "pending" },
  { id: "3", number: 3, name: "Relação de Pagamentos Efetuados", type: "generated", status: "pending" },
  { id: "4", number: 4, name: "Extrato bancário da conta específica do PNAE", type: "manual", status: "done", fileUrl: "#" },
  { id: "5", number: 5, name: "Notas Fiscais e Recibos de Pagamento", type: "manual", status: "pending" },
  { id: "6", number: 6, name: "Termo de Recebimento de Gêneros Alimentícios", type: "manual", status: "pending" },
  { id: "7", number: 7, name: "Parecer do Conselho de Alimentação Escolar (CAE)", type: "generated", status: "na" },
];

// ——— Financeiro mocks ———
interface Transaction {
  id: string;
  date: string;
  description: string;
  docNumber: string;
  debit: number;
  credit: number;
}

const mockTransactions: Transaction[] = [
  { id: "1", date: "2025-02-10", description: "Repasse FNDE — Nota de Empenho nº 2025NE000412", docNumber: "NE-000412", debit: 0, credit: 37800.0 },
  { id: "2", date: "2025-02-28", description: "Rendimento de aplicação financeira", docNumber: "APL-0021", debit: 0, credit: 112.45 },
  { id: "3", date: "2025-03-05", description: "Pgto NF 1021 — Distribuidora Alimentos Sabor & Vida Ltda", docNumber: "NF-1021", debit: 8450.0, credit: 0 },
  { id: "4", date: "2025-03-12", description: "Pgto NF 1034 — Hortifruti Colheita Verde ME", docNumber: "NF-1034", debit: 5230.0, credit: 0 },
  { id: "5", date: "2025-03-20", description: "Pgto NF 1048 — Panificadora Pão Dourado Ltda", docNumber: "NF-1048", debit: 3180.0, credit: 0 },
  { id: "6", date: "2025-04-02", description: "Repasse FNDE — Nota de Empenho nº 2025NE000587", docNumber: "NE-000587", debit: 0, credit: 37800.0 },
  { id: "7", date: "2025-04-10", description: "Pgto NF 1102 — Frigorífico Boi Nobre S/A", docNumber: "NF-1102", debit: 12600.0, credit: 0 },
  { id: "8", date: "2025-04-18", description: "Pgto NF 1115 — Cooperativa Agrícola Raízes do Campo", docNumber: "NF-1115", debit: 6950.0, credit: 0 },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

const statusColor = (s: string) => {
  switch (s) {
    case "Aprovada": return "bg-status-ok/15 text-status-ok border-0";
    case "Pendente": return "bg-brand-orange/15 text-brand-orange border-0";
    case "Em análise": return "bg-primary/10 text-primary border-0";
    default: return "";
  }
};

const AdminEscolaDetalhe = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { activeProcess } = useProcess();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditValue, setCreditValue] = useState("");
  const [conselhoTabActive, setConselhoTabActive] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [creditDate, setCreditDate] = useState("");
  const [creditLoading, setCreditLoading] = useState(false);

  // Checklist state
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Financeiro state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exporting, setExporting] = useState(false);

  // Novo Processo state
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [processForm, setProcessForm] = useState({ programa: "", periodo: "", observacao: "" });
  const [processos, setProcessos] = useState<any[]>([]);

  const fetchProcessos = async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from("accountability_processes")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    if (data) setProcessos(data);
  };

  const handleCriarProcesso = async () => {
    if (!schoolId || !processForm.programa) return;
    setProcessLoading(true);
    const { error } = await supabase.from("accountability_processes").insert({
      school_id: schoolId,
      year: Number.parseInt(processForm.periodo, 10) || new Date().getFullYear(),
      reference_period: processForm.periodo || new Date().getFullYear().toString(),
      programa: processForm.programa,
      periodo: processForm.periodo,
      observacao: processForm.observacao,
      status: "Em análise",
    });
    setProcessLoading(false);
    if (error) {
      toast({ title: "Erro ao criar processo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Processo criado com sucesso!" });
      setProcessModalOpen(false);
      setProcessForm({ programa: "", periodo: "", observacao: "" });
      fetchProcessos();
    }
  };

  const fetchSchool = async () => {
    if (!schoolId) return;
    const { data } = await supabase.from("schools").select("*").eq("id", schoolId).single();
    if (data) {
      setSchool({
        name: data.name || "Sem nome",
        type: data.type || "Municipal",
        regional: data.regional || "—",
        jurisdiction: data.jurisdiction || "—",
        status: "Em análise",
        cnpj: data.cnpj,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
        diretor: data.diretor,
        codigo_inep: data.codigo_inep,
      });
    }
  };

  useEffect(() => {
    fetchSchool();
    fetchProcessos();
    const t = setTimeout(() => {
      setChecklistItems(mockChecklistItems);
      setTransactions(mockTransactions);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [schoolId]);

  // ——— Checklist helpers ———
  const doneCount = checklistItems.filter((i) => i.status === "done").length;
  const actionableCount = checklistItems.filter((i) => i.status !== "na").length;
  const progress = actionableCount > 0 ? (doneCount / actionableCount) * 100 : 0;

  const handleGerarDocumentos = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 3000));
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.type === "generated" && item.status === "pending"
          ? { ...item, status: "done", fileUrl: "#" }
          : item
      )
    );
    toast({ title: "Documentos gerados com sucesso!" });
    setGenerating(false);
  };

  const handleUpload = async (itemId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingId(itemId);
      await new Promise((r) => setTimeout(r, 1500));
      setChecklistItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: "done", fileUrl: "#" } : item))
      );
      toast({ title: "Arquivo anexado!", description: file.name });
      setUploadingId(null);
    };
    input.click();
  };

  const handleMarkNA = (itemId: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: "na" } : item))
    );
    toast({ title: "Item marcado como N/A" });
  };

  // ——— Financeiro helpers ———
  const rows = transactions.map((tx, i) => {
    const prevBalance = transactions.slice(0, i).reduce((acc, t) => acc + t.credit - t.debit, 0);
    return { ...tx, balance: prevBalance + tx.credit - tx.debit };
  });
  const totalCredits = transactions.reduce((s, t) => s + t.credit, 0);
  const totalDebits = transactions.reduce((s, t) => s + t.debit, 0);
  const currentBalance = totalCredits - totalDebits;

  const handleExport = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setExporting(false);
    toast({ title: "Demonstrativo exportado!" });
  };

  const handleLancarCredito = async () => {
    if (!creditValue || !creditDate) return;
    setCreditLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const newTx: Transaction = {
      id: String(transactions.length + 1),
      date: creditDate,
      description: "Ordem Bancária — Crédito lançado pelo Admin",
      docNumber: `OB-${String(transactions.length + 1).padStart(4, "0")}`,
      debit: 0,
      credit: parseFloat(creditValue.replace(/[^\d.,]/g, "").replace(",", ".")),
    };
    setTransactions((prev) => [...prev, newTx].sort((a, b) => a.date.localeCompare(b.date)));
    setCreditLoading(false);
    setCreditModalOpen(false);
    setCreditValue("");
    setCreditDate("");
    toast({ title: "Crédito lançado com sucesso!", description: fmt(newTx.credit) });
  };

  const balancePositive = mockMetrics.balance >= 0;

  const statusBadge = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "pending": return <Badge className="bg-brand-orange/15 text-brand-orange border-0 font-medium text-xs">Pendente</Badge>;
      case "done": return <Badge className="bg-status-ok/15 text-status-ok border-0 font-medium text-xs">Concluído</Badge>;
      case "na": return <Badge variant="secondary" className="font-medium text-xs">N/A</Badge>;
    }
  };

  const typeBadge = (type: ChecklistItem["type"]) => {
    if (type === "generated") return <Badge className="bg-primary/10 text-primary border-0 font-normal text-xs">Gerado pelo sistema</Badge>;
    return <Badge variant="secondary" className="font-normal text-xs">Upload manual</Badge>;
  };

  if (loading || !school) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="h-8 w-72 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="cursor-pointer" onClick={() => navigate("/admin/escolas")}>
              Escolas
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{school.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-heading font-bold text-foreground">{school.name}</h2>
            <Badge className={cn("text-xs", statusColor(school.status))}>{school.status}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className="text-xs font-normal">{school.regional}</Badge>
            <Badge variant="outline" className="text-xs font-normal">{school.jurisdiction}</Badge>
            <span className="text-xs text-muted-foreground">• {school.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm" onClick={() => setProcessModalOpen(true)}>
            <PlusCircle className="w-4 h-4" />
            Novo Processo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("conselho")}>
            <Pencil className="w-4 h-4" />
            Editar dados
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="conselho">Conselho</TabsTrigger>
        </TabsList>

        {/* ——— TAB: Visão Geral ——— */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Valor Recebido" value={fmt(mockMetrics.received)} icon={<ArrowDownLeft className="w-4 h-4 text-status-ok" />} iconBg="bg-status-ok/10" />
            <MetricCard title="Total Gasto" value={fmt(mockMetrics.spent)} icon={<ArrowUpRight className="w-4 h-4 text-status-error" />} iconBg="bg-status-error/10" />
            <MetricCard title="Saldo Disponível" value={fmt(mockMetrics.balance)} valueClass={balancePositive ? "text-status-ok" : "text-status-error"} icon={<Wallet className="w-4 h-4 text-primary" />} iconBg="bg-primary/10" />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">Progresso do Checklist</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={(mockChecklistProgress.done / mockChecklistProgress.total) * 100} className="h-3 bg-secondary" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{mockChecklistProgress.done}</span> de{" "}
                <span className="font-medium text-foreground">{mockChecklistProgress.total}</span> documentos concluídos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Movimentação Recente</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Histórico</TableHead>
                    <TableHead className="w-[90px]">Tipo</TableHead>
                    <TableHead className="text-right w-[130px]">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecentTx.map((tx, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{tx.date}</TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tx.type === "credit" ? "text-status-ok border-status-ok/30 bg-status-ok/5" : "text-status-error border-status-error/30 bg-status-error/5"}>
                          {tx.type === "credit" ? "Crédito" : "Débito"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm font-medium ${tx.type === "credit" ? "text-status-ok" : "text-foreground"}`}>
                        {tx.type === "credit" ? "+" : "−"} {fmt(tx.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Processos da Escola */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">Processos de Prestação de Contas</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={() => setProcessModalOpen(true)}>
                  <PlusCircle className="w-4 h-4" /> Novo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {processos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum processo cadastrado ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Programa</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium">{p.programa}</TableCell>
                        <TableCell className="text-sm">{p.periodo}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {p.status === "Pendente" ? "Pendente" : p.status === "Aprovado" ? "Aprovado" : p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— TAB: Checklist (Admin) ——— */}
        <TabsContent value="checklist" className="space-y-6 max-w-4xl">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1 h-3" />
            <span className="text-sm font-mono font-medium text-foreground whitespace-nowrap">{Math.round(progress)}%</span>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Gere todos os documentos automáticos de uma vez</p>
                  <p className="text-xs text-muted-foreground">Os documentos marcados como "Gerado pelo sistema" serão criados automaticamente.</p>
                </div>
              </div>
              <Button variant="brand" onClick={handleGerarDocumentos} disabled={generating} className="shrink-0">
                {generating ? (<><Loader2 className="w-4 h-4 animate-spin" />Gerando documentos…</>) : "Gerar documentos do processo"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {checklistItems.map((item) => (
              <Card key={item.id} className="shadow-none">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="w-7 h-7 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{item.number}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">{typeBadge(item.type)}{statusBadge(item.status)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "pending" && item.type === "manual" && (
                      <Button variant="outline" size="sm" className="border-brand-orange text-brand-orange hover:bg-brand-orange/10" onClick={() => handleUpload(item.id)} disabled={uploadingId === item.id}>
                        {uploadingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span className="hidden sm:inline ml-1">Anexar</span>
                      </Button>
                    )}
                    {item.status === "pending" && item.type === "generated" && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" /><span className="hidden sm:inline">Aguardando geração</span>
                      </span>
                    )}
                    {item.status === "done" && (
                      <>
                        <Check className="w-5 h-5 text-status-ok" />
                        <Button variant="ghost" size="sm" className="text-primary text-xs"><Eye className="w-4 h-4 mr-1" />Visualizar</Button>
                      </>
                    )}
                    {item.status === "na" && <span className="text-xs text-muted-foreground">—</span>}

                    {/* Admin superpower: Mark as N/A */}
                    {item.status !== "na" && (
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => handleMarkNA(item.id)} title="Marcar como Não Aplicável">
                        <Ban className="w-3.5 h-3.5 mr-1" />N/A
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ——— TAB: Financeiro (Admin) ——— */}
        <TabsContent value="financeiro" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar demonstrativo PDF
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setCreditModalOpen(true)}>
                <PlusCircle className="w-4 h-4" />
                Lançar Crédito (Ordem Bancária)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-none border-brand-orange/20 bg-brand-orange/5">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-brand-orange" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Créditos</p>
                  <p className="text-lg font-mono font-bold text-brand-orange">{fmt(totalCredits)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><TrendingDown className="w-5 h-5 text-muted-foreground" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Débitos</p>
                  <p className="text-lg font-mono font-bold text-muted-foreground">{fmt(totalDebits)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className={cn("shadow-none", currentBalance >= 0 ? "border-status-ok/20 bg-status-ok/5" : "border-destructive/20 bg-destructive/5")}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", currentBalance >= 0 ? "bg-status-ok/10" : "bg-destructive/10")}>
                  <Wallet className={cn("w-5 h-5", currentBalance >= 0 ? "text-status-ok" : "text-destructive")} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Atual</p>
                  <p className={cn("text-lg font-mono font-bold", currentBalance >= 0 ? "text-status-ok" : "text-destructive")}>{fmt(currentBalance)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Histórico</TableHead>
                    <TableHead className="w-[110px]">Doc. Nº</TableHead>
                    <TableHead className="text-right w-[130px]">Débito</TableHead>
                    <TableHead className="text-right w-[130px]">Crédito</TableHead>
                    <TableHead className="text-right w-[140px]">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className={cn(row.credit > 0 && "bg-status-ok/[0.04]")}>
                      <TableCell className="font-mono text-xs">{fmtDate(row.date)}</TableCell>
                      <TableCell className="text-sm">{row.description}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.docNumber}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{row.debit > 0 ? fmt(row.debit) : "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{row.credit > 0 ? fmt(row.credit) : "—"}</TableCell>
                      <TableCell className={cn("text-right font-mono text-sm font-medium", row.balance >= 0 ? "text-status-ok" : "text-destructive")}>{fmt(row.balance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-border bg-muted/50 font-bold">
                    <TableCell /><TableCell className="text-sm font-semibold">TOTAL</TableCell><TableCell />
                    <TableCell className="text-right font-mono text-sm font-bold">{fmt(totalDebits)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">{fmt(totalCredits)}</TableCell>
                    <TableCell className={cn("text-right font-mono text-sm font-bold", currentBalance >= 0 ? "text-status-ok" : "text-destructive")}>{fmt(currentBalance)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ——— TAB: Conselho (Admin) ——— */}
        <TabsContent value="conselho" className="space-y-6">
          <ConselhoTab isAdmin={true} />
        </TabsContent>
      </Tabs>

      {/* Modal: Lançar Crédito */}
      <Dialog open={creditModalOpen} onOpenChange={setCreditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lançar Crédito (Ordem Bancária)</DialogTitle>
            <DialogDescription>Informe o valor e a data do crédito para {school.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Valor (R$)</label>
              <Input placeholder="0,00" value={creditValue} onChange={(e) => setCreditValue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data</label>
              <Input type="date" value={creditDate} onChange={(e) => setCreditDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditModalOpen(false)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleLancarCredito} disabled={creditLoading || !creditValue || !creditDate}>
              {creditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirmar lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Processo */}
      <Dialog open={processModalOpen} onOpenChange={setProcessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Processo de Prestação de Contas</DialogTitle>
            <DialogDescription>Crie um novo processo para {school.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Programa *</label>
              <Select value={processForm.programa} onValueChange={(v) => setProcessForm((f) => ({ ...f, programa: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o programa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PNAE">PNAE</SelectItem>
                  <SelectItem value="PDDE">PDDE</SelectItem>
                  <SelectItem value="Merenda">Merenda</SelectItem>
                  <SelectItem value="Internet">Internet</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Período</label>
              <Input placeholder="Ex: 2025" value={processForm.periodo} onChange={(e) => setProcessForm((f) => ({ ...f, periodo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Observação</label>
              <Textarea placeholder="Observações sobre o processo..." value={processForm.observacao} onChange={(e) => setProcessForm((f) => ({ ...f, observacao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessModalOpen(false)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCriarProcesso} disabled={processLoading || !processForm.programa}>
              {processLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Criar Processo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MetricCard = ({ title, value, icon, iconBg, valueClass = "text-foreground" }: { title: string; value: string; icon: React.ReactNode; iconBg: string; valueClass?: string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-mono font-bold tracking-tight ${valueClass}`}>{value}</p>
    </CardContent>
  </Card>
);

export default AdminEscolaDetalhe;
