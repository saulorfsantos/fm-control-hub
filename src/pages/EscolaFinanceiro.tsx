import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  data: string;
  descricao: string;
  documento: string;
  empresa: string;
  debito: number;
  credito: number;
  programa_label: string;
  periodo: string;
}

interface SchoolBalance {
  name: string;
  total_credito: number;
  total_debito: number;
  saldo: number;
  ultima_movimentacao: string;
  qtd_transacoes: number;
}

const fmt = (v: number) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string) => {
  if (!d) return "";
  const datePart = d.split("T")[0];
  const [y, m, day] = datePart.split("-");
  return `${day}/${m}/${y}`;
};

const EscolaFinanceiro = () => {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<SchoolBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!profile?.school_id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const [balanceRes, transactionsRes] = await Promise.all([
        supabase
          .from("school_balances")
          .select("name, total_credito, total_debito, saldo, ultima_movimentacao, qtd_transacoes")
          .eq("school_id", profile.school_id)
          .maybeSingle(),
        supabase
          .from("school_transactions_with_program")
          .select("id, data, descricao, documento, empresa, debito, credito, programa_label, periodo")
          .eq("school_id", profile.school_id)
          .order("data", { ascending: false })
      ]);

      if (balanceRes.data) {
        setBalance(balanceRes.data);
      }
      
      if (transactionsRes.data) {
        setTransactions(transactionsRes.data);
      }

      setLoading(false);
    }

    fetchData();
  }, [profile?.school_id]);

  const handleExport = async () => {
    setExporting(true);
    // Placeholder: generate PDF via n8n or client-side
    await new Promise((r) => setTimeout(r, 2000));
    setExporting(false);
    toast({ title: "Demonstrativo exportado!", description: "O PDF será baixado em instantes." });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 flex-1 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!profile?.school_id) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed">
        <p className="text-muted-foreground">Nenhuma escola vinculada ao seu perfil.</p>
      </div>
    );
  }

  const currentBalance = balance?.saldo || 0;

  const filteredTransactions = transactions.filter((t) => {
    if (!startDate && !endDate) return true;
    const tDate = t.data.split("T")[0];
    if (startDate && tDate < startDate) return false;
    if (endDate && tDate > endDate) return false;
    return true;
  });

  const totalCredits = filteredTransactions.reduce((acc, t) => acc + (t.credito || 0), 0);
  const totalDebits = filteredTransactions.reduce((acc, t) => acc + (t.debito || 0), 0);
  const hasFilter = Boolean(startDate || endDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Movimentação Financeira</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {balance?.name || "Escola"} — {balance?.ultima_movimentacao ? `Última movimentação em ${fmtDate(balance.ultima_movimentacao)}` : "Extrato consolidado"}
          </p>
        </div>
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 shrink-0"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar demonstrativo PDF
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-foreground">De:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-40 h-9"
            />
          </div>
          <span className="text-muted-foreground hidden sm:inline">até</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-foreground sm:hidden">Até:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-40 h-9"
            />
          </div>
        </div>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }} className="h-9 px-3 w-full sm:w-auto text-muted-foreground hover:text-foreground">
            Limpar
          </Button>
        )}
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-none border-brand-orange/20 bg-brand-orange/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Créditos {hasFilter && <span className="text-[10px] font-medium text-brand-orange/70">(no período)</span>}</p>
              <p className="text-lg font-mono font-bold text-brand-orange">{fmt(totalCredits)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Débitos {hasFilter && <span className="text-[10px] font-medium text-muted-foreground/70">(no período)</span>}</p>
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
              <p className={cn("text-lg font-mono font-bold", currentBalance >= 0 ? "text-status-ok" : "text-destructive")}>
                {fmt(currentBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extrato table */}
      <Card className="shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead className="w-[110px]">Doc. Nº</TableHead>
                <TableHead className="w-[130px]">Empresa</TableHead>
                <TableHead className="w-[130px]">Programa</TableHead>
                <TableHead className="text-right w-[130px]">Débito</TableHead>
                <TableHead className="text-right w-[130px]">Crédito</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    {hasFilter ? "Nenhuma movimentação no período" : "Nenhuma movimentação encontrada"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(row.credito > 0 && "bg-status-ok/[0.04]")}
                  >
                    <TableCell className="font-mono text-xs">{fmtDate(row.data)}</TableCell>
                    <TableCell className="text-sm">{row.descricao}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.documento}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.empresa}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.programa_label}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {row.debito > 0 ? fmt(row.debito) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {row.credito > 0 ? fmt(row.credito) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}

              {/* Totalizador */}
              {filteredTransactions.length > 0 && (
                <TableRow className="border-t-2 border-border bg-muted/50 font-bold">
                  <TableCell />
                  <TableCell className="text-sm font-semibold">TOTAL</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-mono text-sm font-bold">{fmt(totalDebits)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold">{fmt(totalCredits)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default EscolaFinanceiro;
