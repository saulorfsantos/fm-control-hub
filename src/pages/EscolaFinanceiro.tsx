import { useState, useEffect } from "react";
import { useProcess } from "@/contexts/ProcessContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const EscolaFinanceiro = () => {
  const { activeProcess } = useProcess();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // --- Placeholder: Supabase Realtime subscription ---
  // useEffect(() => {
  //   const channel = supabase
  //     .channel('transactions-updates')
  //     .on(
  //       'postgres_changes',
  //       { event: 'INSERT', schema: 'public', table: 'transactions', filter: `process_id=eq.${activeProcess?.id}` },
  //       (payload) => {
  //         setTransactions(prev => [...prev, payload.new as Transaction]);
  //       }
  //     )
  //     .subscribe();
  //   return () => { supabase.removeChannel(channel); };
  // }, [activeProcess?.id]);

  // Compute running balance
  const rows = transactions.map((tx, i) => {
    const prevBalance = transactions.slice(0, i).reduce((acc, t) => acc + t.credit - t.debit, 0);
    const balance = prevBalance + tx.credit - tx.debit;
    return { ...tx, balance };
  });

  const totalCredits = transactions.reduce((s, t) => s + t.credit, 0);
  const totalDebits = transactions.reduce((s, t) => s + t.debit, 0);
  const currentBalance = totalCredits - totalDebits;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Movimentação Financeira</h2>
          <p className="text-sm text-muted-foreground mt-1">{activeProcess?.label} — Extrato consolidado</p>
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

      {/* Summary chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-none border-brand-orange/20 bg-brand-orange/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Créditos</p>
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
                <TableHead className="text-right w-[130px]">Débito</TableHead>
                <TableHead className="text-right w-[130px]">Crédito</TableHead>
                <TableHead className="text-right w-[140px]">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(row.credit > 0 && "bg-status-ok/[0.04]")}
                >
                  <TableCell className="font-mono text-xs">{fmtDate(row.date)}</TableCell>
                  <TableCell className="text-sm">{row.description}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{row.docNumber}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {row.debit > 0 ? fmt(row.debit) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {row.credit > 0 ? fmt(row.credit) : "—"}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-sm font-medium", row.balance >= 0 ? "text-status-ok" : "text-destructive")}>
                    {fmt(row.balance)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Totalizador */}
              <TableRow className="border-t-2 border-border bg-muted/50 font-bold">
                <TableCell />
                <TableCell className="text-sm font-semibold">TOTAL</TableCell>
                <TableCell />
                <TableCell className="text-right font-mono text-sm font-bold">{fmt(totalDebits)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-bold">{fmt(totalCredits)}</TableCell>
                <TableCell className={cn("text-right font-mono text-sm font-bold", currentBalance >= 0 ? "text-status-ok" : "text-destructive")}>
                  {fmt(currentBalance)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default EscolaFinanceiro;
