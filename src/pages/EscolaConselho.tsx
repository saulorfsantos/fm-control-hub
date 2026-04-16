import ConselhoTab from "@/components/ConselhoTab";

const EscolaConselho = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Dados do Conselho</h2>
        <p className="text-sm text-muted-foreground">Informações e membros do conselho escolar</p>
      </div>
      <ConselhoTab isAdmin={false} />
    </div>
  );
};

export default EscolaConselho;
