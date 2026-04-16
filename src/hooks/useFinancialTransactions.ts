import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface FinancialTransaction {
  id: string;
  process_id: string;
  data: string;
  descricao: string;
  documento: string | null;
  empresa: string | null;
  debito: number;
  credito: number;
}

export const useFinancialTransactions = (processId: string | null | undefined) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!processId) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("process_id", processId)
      .order("data", { ascending: true });
    if (error) {
      setError(error.message);
      setTransactions([]);
    } else {
      setTransactions((data || []) as FinancialTransaction[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [processId]);

  return { transactions, loading, error, refetch: fetch };
};
