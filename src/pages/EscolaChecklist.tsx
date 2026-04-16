import { useState, useEffect } from "react";
import { useProcess } from "@/contexts/ProcessContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  Upload,
  Eye,
  Loader2,
  Sparkles,
  FileText,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  number: number;
  name: string;
  type: "generated" | "manual";
  status: "pending" | "done" | "na";
  fileUrl?: string;
}

const mockItems: ChecklistItem[] = [
  { id: "1", number: 1, name: "Ofício de encaminhamento da Prestação de Contas", type: "generated", status: "done", fileUrl: "#" },
  { id: "2", number: 2, name: "Demonstrativo Sintético Anual da Execução Físico-Financeira", type: "generated", status: "pending" },
  { id: "3", number: 3, name: "Relação de Pagamentos Efetuados", type: "generated", status: "pending" },
  { id: "4", number: 4, name: "Extrato bancário da conta específica do PNAE", type: "manual", status: "done", fileUrl: "#" },
  { id: "5", number: 5, name: "Notas Fiscais e Recibos de Pagamento", type: "manual", status: "pending" },
  { id: "6", number: 6, name: "Termo de Recebimento de Gêneros Alimentícios", type: "manual", status: "pending" },
  { id: "7", number: 7, name: "Parecer do Conselho de Alimentação Escolar (CAE)", type: "generated", status: "na" },
];

const EscolaChecklist = () => {
  const { activeProcess } = useProcess();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setItems(mockItems);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // --- Placeholder: Supabase Realtime subscription ---
  // When connected to a real backend, uncomment below to listen for
  // status changes pushed by n8n after document generation.
  //
  // useEffect(() => {
  //   const channel = supabase
  //     .channel('checklist-updates')
  //     .on(
  //       'postgres_changes',
  //       { event: 'UPDATE', schema: 'public', table: 'checklist_items', filter: `process_id=eq.${activeProcess?.id}` },
  //       (payload) => {
  //         setItems(prev => prev.map(item =>
  //           item.id === payload.new.id ? { ...item, status: payload.new.status, fileUrl: payload.new.file_url } : item
  //         ));
  //       }
  //     )
  //     .subscribe();
  //   return () => { supabase.removeChannel(channel); };
  // }, [activeProcess?.id]);

  const doneCount = items.filter((i) => i.status === "done").length;
  const actionableCount = items.filter((i) => i.status !== "na").length;
  const progress = actionableCount > 0 ? (doneCount / actionableCount) * 100 : 0;

  const handleGerarDocumentos = async () => {
    setGenerating(true);
    try {
      // Placeholder: POST to n8n webhook
      // await fetch('https://n8n.example.com/webhook/gerar-documentos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ processId: activeProcess?.id }),
      // });

      // Simulate generation delay
      await new Promise((r) => setTimeout(r, 3000));

      setItems((prev) =>
        prev.map((item) =>
          item.type === "generated" && item.status === "pending"
            ? { ...item, status: "done", fileUrl: "#" }
            : item
        )
      );
      toast({ title: "Documentos gerados com sucesso!", description: "Todos os documentos automáticos foram atualizados." });
    } catch {
      toast({ title: "Erro ao gerar documentos", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (itemId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploadingId(itemId);
      try {
        // Placeholder: Supabase Storage upload
        // const { data, error } = await supabase.storage
        //   .from('checklist-files')
        //   .upload(`${activeProcess?.id}/${itemId}/${file.name}`, file, { upsert: true });
        // if (error) throw error;

        // Simulate upload
        await new Promise((r) => setTimeout(r, 1500));

        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: "done", fileUrl: "#" } : item
          )
        );
        toast({ title: "Arquivo anexado!", description: file.name });
      } catch {
        toast({ title: "Erro no upload", variant: "destructive" });
      } finally {
        setUploadingId(null);
      }
    };
    input.click();
  };

  const statusBadge = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-brand-orange/15 text-brand-orange border-0 font-medium text-xs">Pendente</Badge>;
      case "done":
        return <Badge className="bg-status-ok/15 text-status-ok border-0 font-medium text-xs">Concluído</Badge>;
      case "na":
        return <Badge variant="secondary" className="font-medium text-xs">N/A</Badge>;
    }
  };

  const typeBadge = (type: ChecklistItem["type"]) => {
    if (type === "generated") {
      return <Badge className="bg-primary/10 text-primary border-0 font-normal text-xs">Gerado pelo sistema</Badge>;
    }
    return <Badge variant="secondary" className="font-normal text-xs">Upload manual</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-xl bg-muted animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Checklist Documental</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {activeProcess?.label} — {doneCount} de {actionableCount} documentos concluídos
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <Progress value={progress} className="flex-1 h-3" />
        <span className="text-sm font-mono font-medium text-foreground whitespace-nowrap">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Geração em massa */}
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
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando documentos…
              </>
            ) : (
              "Gerar documentos do processo"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="shadow-none">
            <CardContent className="flex items-center gap-3 p-4">
              {/* Number badge */}
              <span className="w-7 h-7 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {item.number}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {typeBadge(item.type)}
                  {statusBadge(item.status)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {item.status === "pending" && item.type === "manual" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-brand-orange text-brand-orange hover:bg-brand-orange/10"
                    onClick={() => handleUpload(item.id)}
                    disabled={uploadingId === item.id}
                  >
                    {uploadingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline ml-1">Anexar</span>
                  </Button>
                )}

                {item.status === "pending" && item.type === "generated" && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Aguardando geração</span>
                  </span>
                )}

                {item.status === "done" && (
                  <>
                    <Check className="w-5 h-5 text-status-ok" />
                    <Button variant="ghost" size="sm" className="text-primary text-xs">
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                  </>
                )}

                {item.status === "na" && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EscolaChecklist;
