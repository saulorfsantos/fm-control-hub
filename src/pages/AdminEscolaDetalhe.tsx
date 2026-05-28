import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SchoolData {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
}

interface Process {
  id: string;
  programa: string | null;
  periodo: string | null;
  reference_period: string | null;
}

interface TxRow {
  id: string;
  data: string;
  descricao: string | null;
  documento: string | null;
  empresa: string | null;
  debito: number | string;
  credito: number | string;
  programa_label?: string | null;
  process_id?: string;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const [y, m, day] = d.split("T")[0].split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

const processLabel = (p: Process) =>
  [p.programa, p.periodo || p.reference_period].filter(Boolean).join(" ") ||
  "Processo";

type Mode = "credit" | "debit";

const AdminEscolaDetalhe = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("credit");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    process_id: "",
    data: "",
    descricao: "",
    documento: "",
    empresa: "",
    valor: "",
  });

  const fetchAll = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    const [schoolRes, procRes, txRes] = await Promise.all([
      supabase.from("schools").select("id, name, cnpj, address").eq("id", schoolId).single(),
      supabase
        .from("accountability_processes")
        .select("id, programa, periodo, reference_period")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false }),
      supabase
        .from("school_transactions_with_program")
        .select("*")
        .eq("school_id", schoolId)
        .order("data", { ascending: true }),
    ]);

    if (schoolRes.error) console.error(schoolRes.error);
    if (procRes.error) console.error(procRes.error);
    if (txRes.error) console.error(txRes.error);

    setSchool(schoolRes.data as SchoolData | null);
    setProcesses((procRes.data || []) as Process[]);
    setTransactions((txRes.data || []) as TxRow[]);
    setLoading(false);
  }, [schoolId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const rows = useMemo(() => {
    let running = 0;
    return transactions.map((t) => {
      running += Number(t.credito || 0) - Number(t.debito || 0);
      return { ...t, balance: running };
    });
  }, [transactions]);

  const totals = useMemo(() => {
    let credits = 0;
    let debits = 0;
    for (const t of transactions) {
      credits += Number(t.credito || 0);
      debits += Number(t.debito || 0);
    }
    return { credits, debits, balance: credits - debits };
  }, [transactions]);

  const openModal = (m: Mode) => {
    setMode(m);
    setForm({
      process_id: processes[0]?.id || "",
      data: new Date().toISOString().slice(0, 10),
      descricao: "",
      documento: "",
      empresa: "",
      valor: "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.process_id || !form.data || !form.valor) {
      toast({ title: "Preencha processo, data e valor", variant: "destructive" });
      return;
    }
    const valor = parseFloat(form.valor.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (!valor || valor <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("financial_transactions").insert({
      process_id: form.process_id,
      data: form.data,
      descricao: form.descricao || (mode === "credit" ? "Crédito manual" : "Débito manual"),
      documento: form.documento || null,
      empresa: form.empresa || null,
      debito: mode === "debit" ? valor : 0,
      credito: mode === "credit" ? valor : 0,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao lançar", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: mode === "credit" ? "Crédito lançado!" : "Débito lançado!",
      description: fmt(valor),
    });
    setModalOpen(false);
    fetchAll();
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

  const balancePositive = totals.balance >= 0;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="cursor-pointer" onClick={() => navigate("/admin/escolas")}>
              Escolas da Rede
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{school.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-heading font-bold text-foreground">{school.name}</h2>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-muted-foreground">
            {school.cnpj && <span>CNPJ: {school.cnpj}</span>}
            {school.address && <span>• {school.address}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => openModal("debit")}>
            <ArrowUpRight className="w-4 h-4" />
            Lançar Débito
          </Button>
          <Button size="sm" onClick={() => openModal("credit")}>
            <ArrowDownLeft className="w-4 h-4" />
            Lançar Crédito
          </Button>
        </div>
      </div>

      {/* Balance card */}
      <Card className="shadow-none">
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              balancePositive ? "bg-primary/10" : "bg-destructive/10"
            )}
          >
            <Wallet className={cn("w-6 h-6", balancePositive ? "text-primary" : "text-destructive")} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Saldo atual</p>
            <p
              className={cn(
                "text-2xl font-heading font-bold",
                balancePositive ? "text-status-ok" : "text-destructive"
              )}
            >
              {fmt(totals.balance)}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Créditos</p>
              <p className="text-sm font-mono font-semibold text-status-ok">{fmt(totals.credits)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Débitos</p>
              <p className="text-sm font-mono font-semibold text-destructive">{fmt(totals.debits)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extrato */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            Extrato de movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Nenhuma movimentação registrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Débito</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const deb = Number(r.debito || 0);
                  const cre = Number(r.credito || 0);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm whitespace-nowrap">{fmtDate(r.data)}</TableCell>
                      <TableCell className="text-sm">{r.descricao || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.documento || "—"}</TableCell>
                      <TableCell>
                        {r.programa_label ? (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {r.programa_label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.empresa || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">
                        {deb > 0 ? fmt(deb) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-status-ok">
                        {cre > 0 ? fmt(cre) : "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-sm font-semibold",
                          r.balance >= 0 ? "text-foreground" : "text-destructive"
                        )}
                      >
                        {fmt(r.balance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal lançar crédito/débito */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "credit" ? "Lançar Crédito" : "Lançar Débito"}</DialogTitle>
            <DialogDescription>
              Selecione o processo ao qual a movimentação pertence.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Processo *</Label>
              <Select
                value={form.process_id}
                onValueChange={(v) => setForm((f) => ({ ...f, process_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o processo" />
                </SelectTrigger>
                <SelectContent>
                  {processes.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Nenhum processo ativo
                    </div>
                  ) : (
                    processes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {processLabel(p)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor *</Label>
                <Input
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Repasse FNDE — Parcela 1/2026"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Documento</Label>
                <Input
                  placeholder="NF-1234"
                  value={form.documento}
                  onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Input
                  placeholder="Fornecedor"
                  value={form.empresa}
                  onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.process_id}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEscolaDetalhe;
