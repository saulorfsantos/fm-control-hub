import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, UserPlus, Pencil, Check, X, Users, Shield, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Member {
  id: string;
  name: string;
  role: string;
  cpf: string;
  whatsapp: string;
}

interface ConselhoData {
  councilName: string;
  cnpj: string;
  members: Member[];
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const mockConselho: ConselhoData = {
  councilName: "Conselho Escolar da E.M. Monteiro Lobato",
  cnpj: "12.345.678/0001-90",
  members: [
    { id: "1", name: "Maria Aparecida dos Santos", role: "Presidente", cpf: "***.***.123-45", whatsapp: "(85) 99812-3456" },
    { id: "2", name: "José Carlos Oliveira", role: "Tesoureiro", cpf: "***.***.234-56", whatsapp: "(85) 98765-4321" },
    { id: "3", name: "Ana Paula Ferreira Lima", role: "Secretária", cpf: "***.***.345-67", whatsapp: "(85) 99634-7890" },
    { id: "4", name: "Francisco Almeida Souza", role: "Membro", cpf: "***.***.456-78", whatsapp: "(85) 98456-1234" },
    { id: "5", name: "Cláudia Regina Martins", role: "Membro", cpf: "***.***.567-89", whatsapp: "(85) 99901-5678" },
  ],
};


const roleBadge = (role: string) => {
  const isLeader = ["Presidente", "Tesoureiro"].includes(role);
  return (
    <span className={cn("text-xs font-medium", isLeader ? "text-primary" : "text-muted-foreground")}>
      {role}
    </span>
  );
};

interface ConselhoTabProps {
  isAdmin?: boolean;
}

const ConselhoTab = ({ isAdmin = false }: ConselhoTabProps) => {
  const [conselho, setConselho] = useState<ConselhoData>(mockConselho);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(conselho.councilName);
  const [editCnpj, setEditCnpj] = useState(conselho.cnpj);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");

  const activeMembers = conselho.members;
  const hasMinMembers = activeMembers.length >= 3;

  const handleSaveGeneral = () => {
    setConselho((prev) => ({ ...prev, councilName: editName, cnpj: editCnpj }));
    setEditing(false);
    toast({ title: "Dados do conselho atualizados!" });
  };

  const handleAddMember = () => {
    if (!newName || !newRole || !newCpf) return;
    const member: Member = {
      id: String(Date.now()),
      name: newName,
      role: newRole,
      cpf: newCpf,
      whatsapp: newWhatsapp,
    };
    setConselho((prev) => ({ ...prev, members: [...prev.members, member] }));
    setAddModalOpen(false);
    setNewName(""); setNewRole(""); setNewCpf(""); setNewWhatsapp("");
    toast({ title: "Membro adicionado com sucesso!" });
  };

  const handleDeleteMember = (id: string) => {
    setConselho((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
    toast({ title: "Membro removido.", variant: "destructive" });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {!hasMinMembers && (
        <Alert className="border-brand-orange/50 bg-brand-orange/5">
          <AlertTriangle className="h-4 w-4 text-brand-orange" />
          <AlertTitle className="text-brand-orange font-semibold">Atenção</AlertTitle>
          <AlertDescription className="text-sm">
            A Declaração do Conselho exige no mínimo 3 membros ativos. Atualmente há apenas{" "}
            <strong>{activeMembers.length}</strong> membro(s) ativo(s).
          </AlertDescription>
        </Alert>
      )}

      {/* Part A: General Data */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Dados Gerais do Conselho</CardTitle>
            </div>
            {isAdmin && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Button>
            )}
            {isAdmin && editing && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditName(conselho.councilName); setEditCnpj(conselho.cnpj); }}>
                  <X className="w-3.5 h-3.5" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveGeneral}>
                  <Check className="w-3.5 h-3.5" /> Salvar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome do Conselho</label>
              {editing ? (
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              ) : (
                <p className="text-sm font-medium text-foreground">{conselho.councilName}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">CNPJ da Escola</label>
              {editing ? (
                <Input value={editCnpj} onChange={(e) => setEditCnpj(e.target.value)} />
              ) : (
                <p className="text-sm font-mono font-medium text-foreground">{conselho.cnpj}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Part B: Members */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Membros do Conselho</CardTitle>
              <Badge variant="secondary" className="text-xs">{conselho.members.length} membros</Badge>
            </div>
            {isAdmin && (
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddModalOpen(true)}>
                <UserPlus className="w-3.5 h-3.5" /> Adicionar membro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[120px]">Cargo</TableHead>
                  <TableHead className="w-[140px]">CPF</TableHead>
                  <TableHead className="w-[150px]">WhatsApp</TableHead>
                  {isAdmin && <TableHead className="w-[60px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {conselho.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="text-sm font-medium">{member.name}</TableCell>
                    <TableCell>{roleBadge(member.role)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{member.cpf}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.whatsapp || "—"}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-status-error hover:text-status-error hover:bg-status-error/10"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {!isAdmin && (
        <p className="text-xs text-muted-foreground text-center">
          Para alterar os dados do conselho, entre em contato com a administração Forte Mais.
        </p>
      )}

      {/* Add Member Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Conselho</DialogTitle>
            <DialogDescription>Preencha os dados do novo membro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome completo</label>
              <Input placeholder="Nome do membro" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cargo</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presidente">Presidente</SelectItem>
                  <SelectItem value="Vice-Presidente">Vice-Presidente</SelectItem>
                  <SelectItem value="Tesoureiro">Tesoureiro</SelectItem>
                  <SelectItem value="Secretária">Secretária</SelectItem>
                  <SelectItem value="Membro">Membro</SelectItem>
                  <SelectItem value="Suplente">Suplente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CPF</label>
              <Input placeholder="000.000.000-00" value={newCpf} onChange={(e) => setNewCpf(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">WhatsApp</label>
              <Input
                placeholder="(00) 00000-0000"
                value={newWhatsapp}
                onChange={(e) => setNewWhatsapp(formatPhone(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddMember} disabled={!newName || !newRole || !newCpf}>
              Adicionar membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConselhoTab;
