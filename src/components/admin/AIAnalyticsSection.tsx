import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, TrendingUp, Users, Search, RefreshCw, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  user_message: string;
  ai_response: string;
  user_id: string | null;
  user_session: string;
  created_at: string;
}

interface ThemeGroup {
  theme: string;
  keywords: string[];
  count: number;
  conversations: Conversation[];
}

const THEME_RULES: { theme: string; keywords: string[] }[] = [
  { theme: 'Prix & Marchés', keywords: ['prix', 'marché', 'coût', 'cher', 'combien', 'tarif', 'fc', 'franc'] },
  { theme: 'Événements', keywords: ['événement', 'fête', 'concert', 'spectacle', 'festival', 'date', 'quand'] },
  { theme: 'Services administratifs', keywords: ['passeport', 'carte', 'identité', 'visa', 'document', 'mairie', 'préfecture', 'administration'] },
  { theme: 'Transport', keywords: ['bateau', 'avion', 'vol', 'billet', 'transport', 'kwassa', 'taxi'] },
  { theme: 'Tourisme', keywords: ['hôtel', 'plage', 'tourisme', 'visite', 'séjour', 'hébergement', 'restaurant'] },
  { theme: 'Santé', keywords: ['hôpital', 'médecin', 'santé', 'pharmacie', 'maladie', 'clinique'] },
  { theme: 'Éducation', keywords: ['école', 'université', 'formation', 'cours', 'étude', 'bac', 'inscription'] },
  { theme: 'Emploi', keywords: ['emploi', 'travail', 'recrutement', 'offre', 'stage', 'salaire', 'embauche'] },
  { theme: 'Gastronomie', keywords: ['recette', 'plat', 'cuisine', 'manger', 'nourriture', 'langouste', 'mabawa'] },
  { theme: 'Plateforme UJAMAA', keywords: ['ujamaa', 'site', 'plateforme', 'compte', 'inscription', 'connexion', 'profil'] },
];

function classifyMessage(message: string): string {
  const lower = message.toLowerCase();
  for (const rule of THEME_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.theme;
    }
  }
  return 'Autre';
}

export default function AIAnalyticsSection() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('30');
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(period));

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching AI conversations:', error);
      toast.error('Erreur lors du chargement des conversations IA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [period]);

  const themeGroups = useMemo<ThemeGroup[]>(() => {
    const groups: Record<string, ThemeGroup> = {};

    const filtered = searchQuery
      ? conversations.filter(c => c.user_message.toLowerCase().includes(searchQuery.toLowerCase()))
      : conversations;

    for (const conv of filtered) {
      const theme = classifyMessage(conv.user_message);
      if (!groups[theme]) {
        const rule = THEME_RULES.find(r => r.theme === theme);
        groups[theme] = { theme, keywords: rule?.keywords || [], count: 0, conversations: [] };
      }
      groups[theme].count++;
      groups[theme].conversations.push(conv);
    }

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [conversations, searchQuery]);

  const uniqueSessions = useMemo(() => {
    const sessions = new Set(conversations.map(c => c.user_session));
    return sessions.size;
  }, [conversations]);

  const authenticatedCount = useMemo(() => {
    return conversations.filter(c => c.user_id).length;
  }, [conversations]);

  const topQuestions = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const c of conversations) {
      const normalized = c.user_message.toLowerCase().trim();
      if (normalized.length < 5) continue;
      freq[normalized] = (freq[normalized] || 0) + 1;
    }
    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [conversations]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Analyse des requêtes IA
          </h2>
          <p className="text-slate-500 mt-1">
            Questions fréquentes groupées par thème pour améliorer la plateforme
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">3 derniers mois</SelectItem>
              <SelectItem value="365">12 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchConversations}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Total requêtes</span>
          </div>
          <p className="text-3xl font-bold text-blue-900">{conversations.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Thèmes détectés</span>
          </div>
          <p className="text-3xl font-bold text-purple-900">{themeGroups.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Sessions uniques</span>
          </div>
          <p className="text-3xl font-bold text-green-900">{uniqueSessions}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Utilisateurs connectés</span>
          </div>
          <p className="text-3xl font-bold text-amber-900">{authenticatedCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher dans les requêtes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Theme groups */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-800">Requêtes par thème</h3>
        {themeGroups.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Aucune conversation trouvée pour cette période.</p>
        ) : (
          themeGroups.map((group) => {
            const isExpanded = expandedTheme === group.theme;
            const percentage = conversations.length > 0 ? Math.round((group.count / conversations.length) * 100) : 0;

            return (
              <div key={group.theme} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedTheme(isExpanded ? null : group.theme)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {group.count}
                    </Badge>
                    <span className="font-medium text-slate-900">{group.theme}</span>
                    <div className="hidden sm:flex items-center gap-1">
                      {group.keywords.slice(0, 4).map(kw => (
                        <Badge key={kw} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-200 rounded-full h-2 hidden sm:block">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-10 text-right">{percentage}%</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 max-h-80 overflow-y-auto">
                    {group.conversations.slice(0, 20).map((conv) => (
                      <div key={conv.id} className="p-3 border-b border-slate-100 last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-slate-800 font-medium">
                            💬 {conv.user_message}
                          </p>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(conv.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          🤖 {conv.ai_response.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {conv.user_id ? 'Connecté' : 'Visiteur'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {group.conversations.length > 20 && (
                      <p className="text-center text-xs text-slate-400 py-2">
                        +{group.conversations.length - 20} autres requêtes
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Top questions */}
      {topQuestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800">🔥 Questions les plus posées</h3>
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {topQuestions.map(([question, count], i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <p className="text-sm text-slate-800 capitalize">{question}</p>
                <Badge>{count}×</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
