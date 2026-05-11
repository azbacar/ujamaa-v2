import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, MapPin, Coins, FileText, Search, Building2, Clock, Users, Gavel, Hash, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSpace from '@/components/AdSpace';
import TenderSubmissionForm from '@/components/TenderSubmissionForm';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { usePageSEO } from '@/hooks/usePageSEO';
import { authPath } from '@/lib/authRedirect';

interface Tender {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  reference_number: string | null;
  procurement_type: string | null;
  contracting_authority: string | null;
  budget_estimate: number | null;
  currency: string | null;
  deadline_at: string | null;
  opening_at: string | null;
  opening_location: string | null;
  submission_location: string | null;
  island: string | null;
  lots_count: number | null;
  guarantee_amount: number | null;
}

const PROCUREMENT_LABELS: Record<string, string> = {
  aoo: 'Appel d\'offres ouvert',
  aor: 'Appel d\'offres restreint',
  ami: 'Manifestation d\'intérêt',
  consultation: 'Consultation restreinte',
  gre_a_gre: 'Gré à gré',
};

const TendersPage = () => {
  const { } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAnnonceur } = useRole();
  usePageSEO({ title: 'Appels d\'Offres OHADA — Comores', description: 'Marchés publics et privés conformes OHADA aux Comores. Soumissionnez en ligne avec accusé de réception immédiat.', canonicalPath: '/appels-offres', keywords: 'appels offres Comores, marchés publics, OHADA, RCCM, NIF, AOO, soumissions' });
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('id, title, description, category, created_at, reference_number, procurement_type, contracting_authority, budget_estimate, currency, deadline_at, opening_at, opening_location, submission_location, island, lots_count, guarantee_amount')
          .eq('type', 'tender')
          .eq('status', 'published')
          .order('deadline_at', { ascending: true, nullsFirst: false });

        if (error) throw error;
        const list = (data as Tender[]) || [];
        setTenders(list);

        // Fetch submission counts in parallel via RPC
        const counts: Record<string, number> = {};
        await Promise.all(list.map(async t => {
          const { data: c } = await supabase.rpc('get_tender_submission_count', { _tender_id: t.id });
          counts[t.id] = (c as number) || 0;
        }));
        setSubmissionCounts(counts);
      } catch (error) {
        console.error('Erreur appels d\'offres:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, []);

  const filtered = tenders.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase())
      || (t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      || (t.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      || (t.contracting_authority?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchIsland = selectedIsland === 'all' || t.island === selectedIsland;
    const matchType = selectedType === 'all' || t.procurement_type === selectedType;
    return matchSearch && matchIsland && matchType;
  });

  const getDeadlineInfo = (deadline: string | null) => {
    if (!deadline) return { label: 'Date limite non précisée', color: 'bg-muted text-muted-foreground', urgent: false, expired: false };
    const d = new Date(deadline);
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: 'Clôturé', color: 'bg-red-100 text-red-700 border-red-200', urgent: false, expired: true };
    if (days === 0) return { label: 'Dernier jour !', color: 'bg-red-100 text-red-700 border-red-200', urgent: true, expired: false };
    if (days <= 7) return { label: `J-${days} (urgent)`, color: 'bg-orange-100 text-orange-700 border-orange-200', urgent: true, expired: false };
    if (days <= 30) return { label: `J-${days}`, color: 'bg-amber-100 text-amber-700 border-amber-200', urgent: false, expired: false };
    return { label: `J-${days}`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', urgent: false, expired: false };
  };

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (!amount) return null;
    return `${amount.toLocaleString('fr-FR')} ${currency || 'KMF'}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center justify-center gap-2">
            <Gavel className="w-8 h-8 text-primary" /> Appels d'Offres
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Marchés publics et privés conformes au droit OHADA — Soumissions en ligne avec accusé de réception immédiat
          </p>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Référence, titre, autorité contractante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedIsland} onValueChange={setSelectedIsland}>
              <SelectTrigger><SelectValue placeholder="Île" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les îles</SelectItem>
                <SelectItem value="grande-comore">Grande Comore</SelectItem>
                <SelectItem value="anjouan">Anjouan</SelectItem>
                <SelectItem value="moheli">Mohéli</SelectItem>
                <SelectItem value="mayotte">Mayotte</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger><SelectValue placeholder="Procédure" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes procédures</SelectItem>
                {Object.entries(PROCUREMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="flex justify-center"><AdSpace size="banner" position="header" /></div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-3">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun appel d'offres trouvé.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(tender => {
              const deadline = getDeadlineInfo(tender.deadline_at);
              const count = submissionCounts[tender.id] ?? 0;
              return (
                <Card key={tender.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {tender.reference_number && (
                          <Badge variant="outline" className="mb-2 font-mono text-xs">
                            <Hash className="w-3 h-3 mr-1" /> {tender.reference_number}
                          </Badge>
                        )}
                        <CardTitle className="text-xl break-words">{tender.title}</CardTitle>
                        {tender.contracting_authority && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> {tender.contracting_authority}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                        <Badge className={deadline.color}>
                          <Clock className="w-3 h-3 mr-1" /> {deadline.label}
                        </Badge>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          <Users className="w-3 h-3 mr-1" /> {count} offre{count > 1 ? 's' : ''} reçue{count > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground line-clamp-2">{tender.description || 'Aucune description disponible'}</p>

                    {/* OHADA metadata grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/40 p-3 rounded-lg">
                      {tender.procurement_type && (
                        <div>
                          <div className="text-muted-foreground">Procédure</div>
                          <div className="font-medium">{PROCUREMENT_LABELS[tender.procurement_type] || tender.procurement_type}</div>
                        </div>
                      )}
                      {tender.budget_estimate && (
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3" /> Budget estimé</div>
                          <div className="font-medium">{formatAmount(tender.budget_estimate, tender.currency)}</div>
                        </div>
                      )}
                      {tender.lots_count && tender.lots_count > 0 && (
                        <div>
                          <div className="text-muted-foreground">Lots</div>
                          <div className="font-medium">{tender.lots_count}</div>
                        </div>
                      )}
                      {tender.guarantee_amount && (
                        <div>
                          <div className="text-muted-foreground">Garantie</div>
                          <div className="font-medium">{formatAmount(tender.guarantee_amount, tender.currency)}</div>
                        </div>
                      )}
                      {tender.island && (
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Île</div>
                          <div className="font-medium capitalize">{tender.island.replace('-', ' ')}</div>
                        </div>
                      )}
                      {tender.deadline_at && (
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Date limite</div>
                          <div className="font-medium">{new Date(tender.deadline_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                        </div>
                      )}
                      {tender.opening_at && (
                        <div>
                          <div className="text-muted-foreground">Ouverture des plis</div>
                          <div className="font-medium">{new Date(tender.opening_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                        </div>
                      )}
                      {tender.submission_location && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground">Lieu de dépôt</div>
                          <div className="font-medium">{tender.submission_location}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/appels-offres/${tender.id}`)}>
                        <FileText className="w-4 h-4 mr-1" /> Détails
                      </Button>
                      <Button
                        size="sm"
                        disabled={deadline.expired}
                        className="bg-gradient-to-r from-emerald-500 to-ocean-500"
                        onClick={() => { setSelectedTender(tender); setIsSubmissionOpen(true); }}
                      >
                        {deadline.expired ? (
                          <><AlertTriangle className="w-4 h-4 mr-1" /> Clôturé</>
                        ) : (
                          'Soumettre une offre'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA publication */}
        <div className="max-w-lg mx-auto pt-4">
          {showUpgrade && (!user || !isAnnonceur()) ? (
            <UpgradePrompt action="publier un appel d'offres" />
          ) : (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-6 text-center space-y-3">
                <h3 className="text-lg font-bold">📋 Vous lancez un appel d'offres ?</h3>
                <p className="text-sm text-muted-foreground">
                  Publiez gratuitement sur Ujamaan et recevez les meilleures offres conformes OHADA.
                </p>
                <Button onClick={() => {
                  if (!user) { navigate(authPath()); return; }
                  if (!isAnnonceur()) { setShowUpgrade(true); return; }
                  navigate('/annonceur?tab=create');
                }}>
                  ✨ Publier un appel d'offres
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-center"><AdSpace size="banner" position="footer" lazy /></div>
      </main>

      <Dialog open={isSubmissionOpen} onOpenChange={setIsSubmissionOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedTender && (
            <TenderSubmissionForm
              tenderId={selectedTender.id}
              tenderTitle={selectedTender.title}
              onClose={() => { setIsSubmissionOpen(false); setSelectedTender(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TendersPage;
