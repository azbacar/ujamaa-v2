import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FreelancerClient {
  id: string;
  freelancer_id: string;
  linked_user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface FreelancerInvoice {
  id: string;
  freelancer_id: string;
  client_id: string | null;
  linked_user_id: string | null;
  invoice_number: string;
  type: string;
  status: string;
  items: any[];
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  currency: string;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: { name: string } | null;
}

export interface FreelancerTransaction {
  id: string;
  freelancer_id: string;
  invoice_id: string | null;
  type: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  transaction_date: string;
  payment_method: string | null;
  reference: string | null;
  created_at: string;
}

export function useFreelanceCRM(freelancerId: string | undefined) {
  const [clients, setClients] = useState<FreelancerClient[]>([]);
  const [invoices, setInvoices] = useState<FreelancerInvoice[]>([]);
  const [transactions, setTransactions] = useState<FreelancerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!freelancerId) { setLoading(false); return; }
    setLoading(true);
    const [c, i, t] = await Promise.all([
      supabase.from('freelancer_clients').select('*').eq('freelancer_id', freelancerId).order('created_at', { ascending: false }),
      supabase.from('freelancer_invoices').select('*, client:freelancer_clients(name)').eq('freelancer_id', freelancerId).order('created_at', { ascending: false }),
      supabase.from('freelancer_transactions').select('*').eq('freelancer_id', freelancerId).order('transaction_date', { ascending: false }),
    ]);
    setClients((c.data || []) as FreelancerClient[]);
    setInvoices((i.data || []) as FreelancerInvoice[]);
    setTransactions((t.data || []) as FreelancerTransaction[]);
    setLoading(false);
  }, [freelancerId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addClient = async (client: Partial<FreelancerClient>) => {
    if (!freelancerId) return;
    const { error } = await supabase.from('freelancer_clients').insert({ ...client, freelancer_id: freelancerId } as any);
    if (error) throw error;
    await fetchAll();
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from('freelancer_clients').delete().eq('id', id);
    if (error) throw error;
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addInvoice = async (invoice: Partial<FreelancerInvoice>) => {
    if (!freelancerId) return;
    const { error } = await supabase.from('freelancer_invoices').insert({ ...invoice, freelancer_id: freelancerId } as any);
    if (error) throw error;
    await fetchAll();
  };

  const updateInvoice = async (id: string, updates: Partial<FreelancerInvoice>) => {
    const { error } = await supabase.from('freelancer_invoices').update(updates as any).eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from('freelancer_invoices').delete().eq('id', id);
    if (error) throw error;
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const addTransaction = async (tx: Partial<FreelancerTransaction>) => {
    if (!freelancerId) return;
    const { error } = await supabase.from('freelancer_transactions').insert({ ...tx, freelancer_id: freelancerId } as any);
    if (error) throw error;
    await fetchAll();
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('freelancer_transactions').delete().eq('id', id);
    if (error) throw error;
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const unpaidTotal = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.total), 0);

  return {
    clients, invoices, transactions, loading,
    addClient, deleteClient,
    addInvoice, updateInvoice, deleteInvoice,
    addTransaction, deleteTransaction,
    totalIncome, totalExpense, balance, unpaidTotal,
    refresh: fetchAll,
  };
}
