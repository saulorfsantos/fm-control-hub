import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  School,
  Search,
  ChevronRight,
  Plus,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AddSchoolModal from "@/components/AddSchoolModal";
import { supabase } from "@/lib/supabase";

interface SchoolRow {
  school_id: string;
  name: string;
  municipality: string;
  programs: string[];
  lastMovement: string | null;
  balance: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
};

const extractMunicipality = (address: string | null | undefined): string => {
  if (!address) return "—";
  const parts = address.split(" - ").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts[parts.length - 1];
};

const programLabel = (row: any): string => {
  const prog = row.programa ?? row.program ?? row.program_name ?? "";
  const period =
    row.periodo ?? row.period ?? row.reference_period ?? row.year ?? "";
  if (row.label) return String(row.label);
  return [prog, period].filter(Boolean).join(" ").trim() || "—";
};

const AdminEscolas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SchoolRow[]>([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [balancesRes, programsRes] = await Promise.all([
      supabase.from("school_balances").select("*"),
      supabase.from("school_active_programs").select("*"),
    ]);

    if (balancesRes.error) {
      console.error("Error fetching school_balances:", balancesRes.error);
    }
    if (programsRes.error) {
      console.error("Error fetching school_active_programs:", programsRes.error);
    }

    const balances = (balancesRes.data || []) as any[];
    const programs = (programsRes.data || []) as any[];

    const programsBySchool = new Map<string, string[]>();
    for (const p of programs) {
      const id = p.school_id ?? p.id;
      if (!id) continue;
      const label = programLabel(p);
      const arr = programsBySchool.get(id) || [];
      if (!arr.includes(label)) arr.push(label);
      programsBySchool.set(id, arr);
    }

    const merged: SchoolRow[] = balances.map((b: any) => {
      const id = b.school_id ?? b.id;
      return {
        school_id: id,
        name: b.name ?? b.school_name ?? "Sem nome",
        municipality: extractMunicipality(b.address),
        programs: programsBySchool.get(id) || [],
        lastMovement:
          b.last_movement_at ??
          b.last_movement ??
          b.updated_at ??
          null,
        balance: Number(b.balance ?? b.saldo ?? 0),
      };
    });

    merged.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    setRows(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.municipality.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const summary = useMemo(() => {
    let credits = 0;
    let debits = 0;
    for (const r of rows) {
      if (r.balance > 0) credits += r.balance;
      else if (r.balance < 0) debits += Math.abs(r.balance);
    }
    return { credits, debits, net: credits - debits };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Escolas da Rede
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Saldo consolidado de débitos e créditos por unidade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-none border-status-ok/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-status-ok/10 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-status-ok" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Créditos a receber</p>
              <p className="text-xl font-heading font-bold text-status-ok">
                {fmt(summary.credits)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-destructive/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Débitos em aberto</p>
              <p className="text-xl font-heading font-bold text-destructive">
                {fmt(summary.debits)}
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Card "Saldo líquido" removido temporariamente — lógica preservada em `summary.net` */}
      </div>

            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo líquido</p>
              <p
                className={cn(
                  "text-xl font-heading font-bold",
                  summary.net >= 0 ? "text-primary" : "text-brand-orange"
                )}
              >
                {fmt(summary.net)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por escola ou município..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="shadow-none overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <School className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma escola encontrada.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escola</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Programas ativos</TableHead>
                <TableHead>Última movimentação</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow
                  key={row.school_id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/admin/escola/${row.school_id}`)}
                >
                  <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {row.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.municipality}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.programs.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        row.programs.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {p}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtDate(row.lastMovement)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono font-semibold",
                      row.balance > 0 && "text-status-ok",
                      row.balance < 0 && "text-destructive",
                      row.balance === 0 && "text-muted-foreground"
                    )}
                  >
                    {fmt(row.balance)}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminEscolas;
