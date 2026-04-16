import { useState, useEffect } from "react";
import { useProcess } from "@/contexts/ProcessContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  DollarSign,
  TrendingDown,
  Wallet,
  ClipboardList,
} from "lucide-react";

// Mock data
const mockMetrics = {
  received: 48750.0,
  spent: 31420.65,
  balance: 17329.35,
};

const mockChecklist = { done: 7, total: 12 };

const mockTransactions = [
  { data: "10/04/2025", descricao: "Repasse FNDE — Parcela 2/2025", debito: 0, credito: 12500.0 },
  { data: "08/04/2025", descricao: "NF 4521 — Distribuidora Alimentos Ltda", debito: 4230.5, credito: 0 },
  { data: "02/04/2025", descricao: "NF 4498 — Hortifruti Regional ME", debito: 1890.0, credito: 0 },
  { data: "28/03/2025", descricao: "NF 4475 — Laticínios Serra Verde", debito: 2150.15, credito: 0 },
  { data: "15/03/2025", descricao: "Repasse FNDE — Parcela 1/2025", debito: 0, credito: 12500.0 },
];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const EscolaDashboard = () => {
  const { activeProcess } = useProcess();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <DashboardSkeleton />;

  const balancePositive = mockMetrics.balance >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Olá, Conselho Escolar
          </h2>
          <p className="text-sm text-muted-foreground">
            E.M. Monteiro Lobato — Gestão de Prestação de Contas
          </p>
        </div>
        <Badge className="w-fit bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          {activeProcess?.label}
        </Badge>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Valor Recebido"
          value={fmt(mockMetrics.received)}
          icon={<ArrowDownLeft className="w-4 h-4 text-status-ok" />}
          iconBg="bg-status-ok/10"
        />
        <MetricCard
          title="Total Gasto"
          value={fmt(mockMetrics.spent)}
          icon={<ArrowUpRight className="w-4 h-4 text-status-error" />}
          iconBg="bg-status-error/10"
        />
        <MetricCard
          title="Saldo Disponível"
          value={fmt(mockMetrics.balance)}
          valueClass={balancePositive ? "text-status-ok" : "text-status-error"}
          icon={<Wallet className="w-4 h-4 text-primary" />}
          iconBg="bg-primary/10"
        />
      </div>

      {/* Checklist Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Progresso do Checklist</CardTitle>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              Ver checklist completo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress
            value={(mockChecklist.done / mockChecklist.total) * 100}
            className="h-3 bg-secondary"
          />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{mockChecklist.done}</span> de{" "}
            <span className="font-medium text-foreground">{mockChecklist.total}</span> documentos
            concluídos
          </p>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
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
              {mockTransactions.map((tx, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">
                    {tx.data}
                  </TableCell>
                  <TableCell className="text-sm">{tx.descricao}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        tx.credito > 0
                          ? "text-status-ok border-status-ok/30 bg-status-ok/5"
                          : "text-status-error border-status-error/30 bg-status-error/5"
                      }
                    >
                      {tx.credito > 0 ? "Crédito" : "Débito"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm font-medium ${
                      tx.credito > 0 ? "text-status-ok" : "text-foreground"
                    }`}
                  >
                    {tx.credito > 0 ? "+" : "−"} {fmt(tx.credito > 0 ? tx.credito : tx.debito)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  icon,
  iconBg,
  valueClass = "text-foreground",
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  valueClass?: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-mono font-bold tracking-tight ${valueClass}`}>
        {value}
      </p>
    </CardContent>
  </Card>
);

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardContent className="pt-6 space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  </div>
);

export default EscolaDashboard;
