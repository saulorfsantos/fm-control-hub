import { useProcess } from "@/contexts/ProcessContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProcessSelector = () => {
  const { processes, activeProcess, setActiveProcess } = useProcess();

  const handleChange = (value: string) => {
    const proc = processes.find((p) => p.id === value);
    if (proc) setActiveProcess(proc);
  };

  return (
    <Select value={activeProcess?.id} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px] h-9 border-primary/40 text-sm font-medium bg-card">
        <SelectValue placeholder="Selecione o processo" />
      </SelectTrigger>
      <SelectContent>
        {processes.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProcessSelector;
