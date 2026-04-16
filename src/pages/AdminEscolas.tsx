import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  School,
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SchoolStatus = "approved" | "pending" | "awaiting";

interface MockSchool {
  id: string;
  name: string;
  type: "Estadual" | "Municipal";
  regional: string;
  program: string;
  period: string;
  parcel: string;
  status: SchoolStatus;
  checklistDone: number;
  checklistTotal: number;
  balance: number;
}

const mockSchools: MockSchool[] = [
  { id: "1", name: "E.M. Monteiro Lobato", type: "Municipal", regional: "Regional Norte", program: "PNAE", period: "2025", parcel: "1ª Parcela", status: "approved", checklistDone: 7, checklistTotal: 7, balance: 12450.30 },
  { id: "2", name: "E.E. Castro Alves", type: "Estadual", regional: "Regional Sul", program: "PNAE", period: "2025", parcel: "1ª Parcela", status: "pending", checklistDone: 3, checklistTotal: 7, balance: 5820.00 },
  { id: "3", name: "E.M. Cecília Meireles", type: "Municipal", regional: "Regional Leste", program: "PDDE", period: "2025", parcel: "Parcela Única", status: "awaiting", checklistDone: 5, checklistTotal: 7, balance: 28100.75 },
  { id: "4", name: "E.E. Machado de Assis", type: "Estadual", regional: "Regional Norte", program: "PNAE", period: "2024", parcel: "2ª Parcela", status: "pending", checklistDone: 2, checklistTotal: 7, balance: -1340.00 },
  { id: "5", name: "E.M. Vinícius de Moraes", type: "Municipal", regional: "Regional Oeste", program: "PNAE", period: "2025", parcel: "1ª Parcela", status: "approved", checklistDone: 7, checklistTotal: 7, balance: 9870.50 },
  { id: "6", name: "E.E. Clarice Lispector", type: "Estadual", regional: "Regional Sul", program: "PDDE", period: "2025", parcel: "Parcela Única", status: "awaiting", checklistDone: 0, checklistTotal: 7, balance: 41200.00 },
];

const statusConfig: Record<SchoolStatus, { label: string; className: string }> = {
  approved: { label: "Aprovada", className: "bg-status-ok/15 text-status-ok border-0" },
  pending: { label: "Com pendências", className: "bg-destructive/15 text-destructive border-0" },
  awaiting: { label: "Aguardando protocolo", className: "bg-brand-orange/15 text-brand-orange border-0" },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminEscolas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regional, setRegional] = useState("all");
  const [program, setProgram] = useState("all");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    return mockSchools.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (regional !== "all" && s.regional !== regional) return false;
      if (program !== "all" && s.program !== program) return false;
      if (status !== "all" && s.status !== status) return false;
      if (year !== "all" && s.period !== year) return false;
      return true;
    });
  }, [search, regional, program, status, year]);

  const metrics = {
    total: mockSchools.length,
    approved: mockSchools.filter((s) => s.status === "approved").length,
    pending: mockSchools.filter((s) => s.status === "pending").length,
    awaiting: mockSchools.filter((s) => s.status === "awaiting").length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Escolas da Rede</h2>
        <p className="text-sm text-muted-foreground mt-1">Gerencie a prestação de contas de todas as unidades</p>
      </div>

      {/* Filters — sticky */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm -mx-6 px-6 py-3 border-b border-border">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar escola..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={regional} onValueChange={setRegional}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Regional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas regionais</SelectItem>
              <SelectItem value="Regional Norte">Regional Norte</SelectItem>
              <SelectItem value="Regional Sul">Regional Sul</SelectItem>
              <SelectItem value="Regional Leste">Regional Leste</SelectItem>
              <SelectItem value="Regional Oeste">Regional Oeste</SelectItem>
            </SelectContent>
          </Select>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Programa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PNAE">PNAE</SelectItem>
              <SelectItem value="PDDE">PDDE</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="approved">Aprovada</SelectItem>
              <SelectItem value="pending">Com pendências</SelectItem>
              <SelectItem value="awaiting">Aguardando protocolo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos anos</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Total ativas</p><p className="text-xl font-heading font-bold text-foreground">{metrics.total}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-status-ok/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-status-ok/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-status-ok" /></div>
            <div><p className="text-xs text-muted-foreground">Aprovadas</p><p className="text-xl font-heading font-bold text-status-ok">{metrics.approved}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-destructive/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-destructive" /></div>
            <div><p className="text-xs text-muted-foreground">Com pendências</p><p className="text-xl font-heading font-bold text-destructive">{metrics.pending}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-brand-orange/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center"><Clock className="w-4 h-4 text-brand-orange" /></div>
            <div><p className="text-xs text-muted-foreground">Aguardando</p><p className="text-xl font-heading font-bold text-brand-orange">{metrics.awaiting}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* School grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <School className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma escola encontrada com os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((school) => {
            const cfg = statusConfig[school.status];
            const progress = (school.checklistDone / school.checklistTotal) * 100;
            return (
              <Card
                key={school.id}
                className="shadow-none hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/admin/escola/${school.id}`)}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {school.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{school.type}</p>
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", cfg.className)}>{cfg.label}</Badge>
                  </div>

                  {/* Program */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] font-normal">{school.program}</Badge>
                    <span>{school.parcel}/{school.period}</span>
                    <span>•</span>
                    <span>{school.regional}</span>
                  </div>

                  {/* Checklist progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Checklist</span>
                      <span className="font-medium text-foreground">{school.checklistDone}/{school.checklistTotal}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Balance + arrow */}
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Saldo disponível</p>
                      <p className={cn("text-sm font-mono font-bold", school.balance >= 0 ? "text-status-ok" : "text-destructive")}>
                        {fmt(school.balance)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEscolas;
