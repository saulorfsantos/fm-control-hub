import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddSchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const formatCNPJ = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const AddSchoolModal = ({ open, onOpenChange, onSuccess }: AddSchoolModalProps) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    address: "",
    phone: "",
    email: "",
    principal_name: "",
    inep_code: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => {
    setForm({ name: "", cnpj: "", address: "", phone: "", email: "", principal_name: "", inep_code: "" });
  };

  const isValid =
    form.name.trim().length > 0 &&
    form.cnpj.replace(/\D/g, "").length === 14;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);

    const { error } = await supabase.from("schools").insert({
      name: form.name.trim(),
      cnpj: form.cnpj.replace(/\D/g, ""),
      address: form.address.trim(),
      phone: form.phone.replace(/\D/g, ""),
      email: form.email.trim(),
      principal_name: form.principal_name.trim(),
      inep_code: form.inep_code.trim(),
      type: "municipal",
    });

    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao cadastrar escola",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Escola cadastrada com sucesso!" });
    reset();
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Escola</DialogTitle>
          <DialogDescription>
            Preencha os dados da unidade escolar para cadastrá-la no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="school-name">Nome da Unidade *</Label>
            <Input
              id="school-name"
              placeholder="E.M. Exemplo da Silva"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="school-cnpj">CNPJ *</Label>
              <Input
                id="school-cnpj"
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={(e) => update("cnpj", formatCNPJ(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="school-inep">Código INEP</Label>
              <Input
                id="school-inep"
                placeholder="00000000"
                maxLength={8}
                value={form.inep_code}
                onChange={(e) => update("inep_code", e.target.value.replace(/\D/g, "").slice(0, 8))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="school-address">Endereço Completo</Label>
            <Input
              id="school-address"
              placeholder="Rua Exemplo, 123 – Bairro – Cidade/UF"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="school-phone">Telefone</Label>
              <Input
                id="school-phone"
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={(e) => update("phone", formatPhone(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="school-email">E-mail</Label>
              <Input
                id="school-email"
                type="email"
                placeholder="escola@exemplo.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="school-principal">Nome do Diretor</Label>
            <Input
              id="school-principal"
              placeholder="Nome completo do(a) diretor(a)"
              value={form.principal_name}
              onChange={(e) => update("principal_name", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isValid || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Escola
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSchoolModal;
