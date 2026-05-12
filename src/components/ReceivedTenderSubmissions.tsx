import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FileText, Download, Building2, User as UserIcon, Phone, Mail, MapPin, Coins, Clock, Inbox } from 'lucide-react';

interface TenderRow {
  id: string;
  title: string;
  reference_number: string | null;
  deadline_at: string | null;
  status: string;
}

interface Submission {
  id: string;
  tender_id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  city: string | null;
  island: string | null;
  registration_number: string | null;
  proposed_amount: number | null;
  currency: string;
  delivery_time: string | null;
  cover_letter: string;
  technical_approach: string | null;
  team_description: string | null;
  documents: string[] | null;
  status: string;
  created_at: string;
}

export default function ReceivedTenderSubmissions() {
  const { user } = useAuth();
  const [tenders, setTenders] = useState<TenderRow[]>([]);
  const [submissionsByTender, setSubmissionsByTender] = useState<Record<string, Submission[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: ts, error: tErr } = await supabase
        .from('content_items')
        .select('id, title, reference_number, deadline_at, status')
        .eq('type', 'tender')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      if (tErr) throw tErr;
      const tenderList = (ts as TenderRow[]) || [];
      setTenders(tenderList);

      if (tenderList.length === 0) {
        setSubmissionsByTender({});
        return;
      }

      const { data: subs, error: sErr } = await supabase
        .from('tender_submissions')
        .select('*')
        .in('tender_id', tenderList.map(t => t.id))
        .order('created_at', { ascending: false });
      if (sErr) throw sErr;

      const grouped: Record<string, Submission[]> = {};
      (subs as Submission[] || []).forEach(s => {
        grouped[s.tender_id] = grouped[s.tender_id] || [];
        grouped[s.tender_id].push(s);
      });
      setSubmissionsByTender(grouped);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const downloadDoc = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('tender-documents').createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (e: any) {
      toast.error('Impossible de télécharger ce document');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('tender_submissions')
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq('id', id);
    if (error) {
      toast.error('Erreur mise à jour');
      return;
    }
    toast.success('Statut mis à jour');
    load();
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Chargement...</CardContent></Card>;
  }

  if (tenders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Vous n'avez encore publié aucun appel d'offres.</p>
        </CardContent>
      </Card>
    );
  }

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      submitted: { label: 'Soumise', cls: 'bg-blue-100 text-blue-700' },
      under_review: { label: 'En analyse', cls: 'bg-amber-100 text-amber-700' },
      shortlisted: { label: 'Pré-sélectionnée', cls: 'bg-emerald-100 text-emerald-700' },
      accepted: { label: 'Retenue', cls: 'bg-green-200 text-green-800' },
      rejected: { label: 'Rejetée', cls: 'bg-red-100 text-red-700' },
      withdrawn: { label: 'Retirée', cls: 'bg-muted text-muted-foreground' },
    };
    const m = map[s] || { label: s, cls: 'bg-muted text-muted-foreground' };
    return <Badge className={m.cls}>{m.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {tenders.map(t => {
        const subs = submissionsByTender[t.id] || [];
        return (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">{t.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                    {t.reference_number && <span className="font-mono">Réf : {t.reference_number}</span>}
                    {t.deadline_at && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Limite : {new Date(t.deadline_at).toLocaleString('fr-FR')}</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary">{subs.length} offre{subs.length > 1 ? 's' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {subs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune offre reçue pour le moment.</p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {subs.map(s => (
                    <AccordionItem key={s.id} value={s.id}>
                      <AccordionTrigger>
                        <div className="flex flex-1 items-center justify-between gap-2 pr-2 text-left">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{s.company_name || s.contact_name || 'Soumissionnaire'}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(s.created_at).toLocaleString('fr-FR')}
                              {s.proposed_amount ? ` • ${s.proposed_amount.toLocaleString('fr-FR')} ${s.currency}` : ''}
                            </div>
                          </div>
                          {statusBadge(s.status)}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {s.company_name && <div className="flex gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {s.company_name}</div>}
                          {s.contact_name && <div className="flex gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> {s.contact_name}</div>}
                          {s.contact_phone && <div className="flex gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {s.contact_phone}</div>}
                          {s.contact_email && <div className="flex gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {s.contact_email}</div>}
                          {(s.city || s.island) && <div className="flex gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {[s.city, s.island].filter(Boolean).join(', ')}</div>}
                          {s.registration_number && <div className="flex gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> RCCM/NIF : {s.registration_number}</div>}
                          {s.proposed_amount && <div className="flex gap-2"><Coins className="h-4 w-4 text-muted-foreground" /> {s.proposed_amount.toLocaleString('fr-FR')} {s.currency}</div>}
                          {s.delivery_time && <div className="flex gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Délai : {s.delivery_time}</div>}
                        </div>

                        {s.cover_letter && (
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Lettre de motivation</div>
                            <p className="whitespace-pre-line">{s.cover_letter}</p>
                          </div>
                        )}
                        {s.technical_approach && (
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Approche technique</div>
                            <p className="whitespace-pre-line">{s.technical_approach}</p>
                          </div>
                        )}
                        {s.team_description && (
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Équipe</div>
                            <p className="whitespace-pre-line">{s.team_description}</p>
                          </div>
                        )}

                        {s.documents && s.documents.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Documents</div>
                            <div className="flex flex-wrap gap-2">
                              {s.documents.map((d, idx) => (
                                <Button key={idx} variant="outline" size="sm" onClick={() => downloadDoc(d)}>
                                  <Download className="h-3 w-3 mr-1" /> Doc {idx + 1}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, 'under_review')}>En analyse</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, 'shortlisted')}>Pré-sélectionner</Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(s.id, 'accepted')}>Retenir</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(s.id, 'rejected')}>Rejeter</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
