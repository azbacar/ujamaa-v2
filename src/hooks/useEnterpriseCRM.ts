import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnterpriseClient {
  id: string;
  enterprise_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface EnterpriseInvoice {
  id: string;
  enterprise_id: string;
  client_id: string | null;
  invoice_number: string;
  type: 'invoice' | 'quote' | 'credit_note';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  client_name?: string;
}

export interface EnterpriseTransaction {
  id: string;
  enterprise_id: string;
  invoice_id: string | null;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  currency: string;
  transaction_date: string;
  payment_method: string | null;
  reference: string | null;
  created_at: string;
}

export function useEnterpriseCRM(enterpriseId: string | undefined) {
  const [clients, setClients] = useState<EnterpriseClient[]>([]);
  const [invoices, setInvoices] = useState<EnterpriseInvoice[]>([]);
  const [transactions, setTransactions] = useState<EnterpriseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!enterpriseId) { setLoading(false); return; }
    setLoading(true);
    const [cRes, iRes, tRes] = await Promise.all([
      supabase.from('enterprise_clients').select('*').eq('enterprise_id', enterpriseId).order('created_at', { ascending: false }),
      supabase.from('enterprise_invoices').select('*').eq('enterprise_id', enterpriseId).order('issue_date', { ascending: false }),
      supabase.from('enterprise_transactions').select('*').eq('enterprise_id', enterpriseId).order('transaction_date', { ascending: false }),
    ]);

    const clientsData = (cRes.data || []) as EnterpriseClient[];
    setClients(clientsData);

    const clientMap = new Map(clientsData.map(c => [c.id, c.name]));
    const invoicesData = (iRes.data || []).map((inv: any) => ({
      ...inv,
      items: inv.items || [],
      client_name: inv.client_id ? clientMap.get(inv.client_id) || 'Inconnu' : null,
    })) as EnterpriseInvoice[];
    setInvoices(invoicesData);

    setTransactions((tRes.data || []) as EnterpriseTransaction[]);
    setLoading(false);
  }, [enterpriseId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addClient = async (client: Partial<EnterpriseClient>) => {
    if (!enterpriseId) return;
    const { error } = await supabase.from('enterprise_clients').insert({ ...client, enterprise_id: enterpriseId } as any);
    if (error) throw error;
    await fetchAll();
  };

  const updateClient = async (id: string, updates: Partial<EnterpriseClient>) => {
    const { error } = await supabase.from('enterprise_clients').update(updates as any).eq('id', id);
    if (error) throw error;
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from('enterprise_clients').delete().eq('id', id);
    if (error) throw error;
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addInvoice = async (invoice: Partial<EnterpriseInvoice>) => {
    if (!enterpriseId) return;
    const { error } = await supabase.from('enterprise_invoices').insert({ ...invoice, enterprise_id: enterpriseId } as any);
    if (error) throw error;
    await fetchAll();
  };

  const updateInvoice = async (id: string, updates: Partial<EnterpriseInvoice>) => {
    const { error } = await supabase.from('enterprise_invoices').update(updates as any).eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from('enterprise_invoices').delete().eq('id', id);
    if (error) throw error;
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const addTransaction = async (tx: Partial<EnterpriseTransaction>) => {
    if (!enterpriseId) return;
    const { error } = await supabase.from('enterprise_transactions').insert({ ...tx, enterprise_id: enterpriseId } as any);
    if (error) throw error;
    await fetchAll();
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('enterprise_transactions').delete().eq('id', id);
    if (error) throw error;
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Accounting summary
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const unpaidInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const unpaidTotal = unpaidInvoices.reduce((s, i) => s + Number(i.total), 0);

  return {
    clients, invoices, transactions, loading,
    addClient, updateClient, deleteClient,
    addInvoice, updateInvoice, deleteInvoice,
    addTransaction, deleteTransaction,
    totalIncome, totalExpense, balance, unpaidTotal,
    refresh: fetchAll,
  };
}
