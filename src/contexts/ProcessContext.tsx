import { createContext, useContext, useState, ReactNode } from "react";

export interface Process {
  id: string;
  code: string;
  program: string;
  period: string;
  label: string;
}

interface ProcessContextType {
  processes: Process[];
  activeProcess: Process | null;
  setActiveProcess: (process: Process) => void;
}

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

// Mock processes for now
const mockProcesses: Process[] = [
  {
    id: "1",
    code: "PNAE-2025",
    program: "PNAE",
    period: "2025",
    label: "PNAE 2025",
  },
  {
    id: "2",
    code: "PNAE-2024",
    program: "PNAE",
    period: "2024",
    label: "PNAE 2024",
  },
  {
    id: "3",
    code: "PDDE-2025",
    program: "PDDE",
    period: "2025",
    label: "PDDE 2025",
  },
];

export const ProcessProvider = ({ children }: { children: ReactNode }) => {
  const [activeProcess, setActiveProcess] = useState<Process>(mockProcesses[0]);

  return (
    <ProcessContext.Provider
      value={{ processes: mockProcesses, activeProcess, setActiveProcess }}
    >
      {children}
    </ProcessContext.Provider>
  );
};

export const useProcess = () => {
  const context = useContext(ProcessContext);
  if (!context) throw new Error("useProcess must be used within ProcessProvider");
  return context;
};
