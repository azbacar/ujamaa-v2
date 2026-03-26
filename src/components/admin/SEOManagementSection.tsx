import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Globe, Image, Share2, Save, Eye, CheckCircle, AlertTriangle, Info, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface SEOSettings {
  id: string;
  site_name: string | null;
  site_favicon_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_card: string | null;
  twitter_site: string | null;
  seo_keywords: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  ga_tracking_id: string | null;
}

export default function SEOManagementSection() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SEOSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('id, site_name, site_favicon_url, og_title, og_description, og_image_url, twitter_card, twitter_site, seo_keywords, hero_title, hero_subtitle')
        .single();
      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading SEO settings:', error);
      toast.error('Erreur lors du chargement des paramètres SEO');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('site_settings')
        .update({
          site_favicon_url: settings.site_favicon_url,
          og_title: settings.og_title,
          og_description: settings.og_description,
          og_image_url: settings.og_image_url,
          twitter_card: settings.twitter_card,
          twitter_site: settings.twitter_site,
          seo_keywords: settings.seo_keywords,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);
      if (error) throw error;
      toast.success('Paramètres SEO sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SEOSettings, value: string) => {
    setSettings(prev => prev ? { ...prev, [field]: value || null } : null);
  };

  const getSEOScore = () => {
    if (!settings) return 0;
    let score = 0;
    if (settings.og_title) score += 20;
    if (settings.og_description) score += 20;
    if (settings.og_image_url) score += 20;
    if (settings.site_favicon_url) score += 15;
    if (settings.twitter_site) score += 10;
    if (settings.seo_keywords) score += 15;
    return score;
  };

  const score = getSEOScore();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-600" />
            Gestion SEO
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Optimisez la visibilité de votre site sur les moteurs de recherche et réseaux sociaux
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      {/* SEO Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
                  className={score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'}
                  strokeDasharray={`${score * 2.51} 251`} strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{score}%</span>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-lg">
                Score SEO : {score >= 80 ? 'Excellent' : score >= 50 ? 'Moyen' : 'À améliorer'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {score < 100 && 'Complétez les champs manquants pour améliorer votre référencement.'}
                {score === 100 && 'Toutes les informations SEO sont renseignées. 🎉'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {!settings?.og_title && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Titre OG manquant</Badge>}
                {!settings?.og_description && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Description OG manquante</Badge>}
                {!settings?.og_image_url && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Image OG manquante</Badge>}
                {!settings?.site_favicon_url && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Favicon manquant</Badge>}
                {!settings?.seo_keywords && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Mots-clés manquants</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border">
          <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Globe className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Share2 className="h-4 w-4" />
            Réseaux sociaux
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Eye className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
        </TabsList>

        {/* General SEO */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Métadonnées générales
              </CardTitle>
              <CardDescription>Ces informations apparaissent dans les résultats de recherche Google, Bing, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Titre du site (balise title)</Label>
                <Input
                  id="seo-title"
                  value={settings?.og_title || ''}
                  onChange={(e) => updateField('og_title', e.target.value)}
                  placeholder="Ujamaan - Centre d'Information des Comores"
                  maxLength={60}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-slate-500">Recommandé : moins de 60 caractères</p>
                  <span className={`text-xs font-medium ${(settings?.og_title?.length || 0) > 60 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {settings?.og_title?.length || 0}/60
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta description</Label>
                <Textarea
                  id="seo-description"
                  value={settings?.og_description || ''}
                  onChange={(e) => updateField('og_description', e.target.value)}
                  placeholder="Plateforme centrale pour tous les prix, événements, services et informations officielles des îles Comores et Mayotte"
                  rows={3}
                  maxLength={160}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-slate-500">Recommandé : entre 120 et 160 caractères</p>
                  <span className={`text-xs font-medium ${(settings?.og_description?.length || 0) > 160 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {settings?.og_description?.length || 0}/160
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-keywords">Mots-clés (séparés par des virgules)</Label>
                <Textarea
                  id="seo-keywords"
                  value={settings?.seo_keywords || ''}
                  onChange={(e) => updateField('seo_keywords', e.target.value)}
                  placeholder="comores, mayotte, prix marchés, événements, services publics, informations"
                  rows={2}
                />
                <p className="text-xs text-slate-500">Aide les moteurs de recherche à comprendre le contenu du site</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon-url">URL du Favicon</Label>
                <div className="flex gap-3 items-start">
                  {settings?.site_favicon_url && (
                    <div className="w-10 h-10 border rounded-lg flex items-center justify-center bg-slate-50 flex-shrink-0">
                      <img src={settings.site_favicon_url} alt="Favicon" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <Input
                    id="favicon-url"
                    value={settings?.site_favicon_url || ''}
                    onChange={(e) => updateField('site_favicon_url', e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-slate-500">Format recommandé : ICO ou PNG 32×32px. Affiché dans l'onglet du navigateur.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media / OG */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                Open Graph (Facebook, WhatsApp, LinkedIn…)
              </CardTitle>
              <CardDescription>Contrôlez l'apparence quand votre site est partagé sur les réseaux sociaux</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="og-image">Image de partage (og:image)</Label>
                <Input
                  id="og-image"
                  value={settings?.og_image_url || ''}
                  onChange={(e) => updateField('og_image_url', e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-slate-500">
                  Dimensions recommandées : 1200×630px. Cette image apparaît quand le lien est partagé sur Facebook, WhatsApp, LinkedIn, etc.
                </p>
                {settings?.og_image_url && (
                  <div className="mt-2 border rounded-lg overflow-hidden max-w-md">
                    <img
                      src={settings.og_image_url}
                      alt="Aperçu OG"
                      className="w-full h-auto object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-blue-400">𝕏</span>
                Twitter / X
              </CardTitle>
              <CardDescription>Paramètres spécifiques pour Twitter/X</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="twitter-card">Type de carte Twitter</Label>
                <Select
                  value={settings?.twitter_card || 'summary_large_image'}
                  onValueChange={(value) => updateField('twitter_card', value)}
                >
                  <SelectTrigger id="twitter-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Résumé (petite image)</SelectItem>
                    <SelectItem value="summary_large_image">Résumé avec grande image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter-site">Compte Twitter (@handle)</Label>
                <Input
                  id="twitter-site"
                  value={settings?.twitter_site || ''}
                  onChange={(e) => updateField('twitter_site', e.target.value)}
                  placeholder="@ujamaan"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Aperçu des résultats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Preview */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Résultat Google
                </h4>
                <div className="border rounded-lg p-4 bg-white max-w-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {settings?.site_favicon_url && (
                      <img src={settings.site_favicon_url} alt="" className="w-4 h-4 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <span className="text-xs text-slate-500">ujamaan.com</span>
                  </div>
                  <h3 className="text-lg text-blue-700 hover:underline cursor-pointer font-medium leading-tight">
                    {settings?.og_title || settings?.site_name || 'Ujamaan - Centre d\'Information des Comores'}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                    {settings?.og_description || 'Plateforme centrale pour tous les prix, événements, services et informations officielles des îles Comores'}
                  </p>
                </div>
              </div>

              {/* Social Preview */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Aperçu réseau social (Facebook / WhatsApp)
                </h4>
                <div className="border rounded-lg overflow-hidden max-w-md bg-slate-50">
                  <div className="aspect-[1200/630] bg-slate-200 flex items-center justify-center overflow-hidden">
                    {settings?.og_image_url ? (
                      <img src={settings.og_image_url} alt="OG Preview" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                    ) : (
                      <div className="text-center text-slate-400 p-4">
                        <Image className="h-10 w-10 mx-auto mb-2" />
                        <p className="text-sm">Aucune image OG configurée</p>
                        <p className="text-xs mt-1">Dimensions recommandées : 1200×630px</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">ujamaan.com</p>
                    <h4 className="font-semibold text-sm mt-0.5 line-clamp-1">
                      {settings?.og_title || settings?.site_name || 'Ujamaan'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {settings?.og_description || 'Description non renseignée'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Twitter Preview */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span>𝕏</span> Aperçu Twitter/X
                </h4>
                <div className="border rounded-2xl overflow-hidden max-w-md">
                  {settings?.twitter_card === 'summary_large_image' && settings?.og_image_url && (
                    <div className="aspect-[2/1] bg-slate-200 overflow-hidden">
                      <img src={settings.og_image_url} alt="Twitter Preview" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                    </div>
                  )}
                  <div className="p-3 flex gap-3">
                    {settings?.twitter_card === 'summary' && settings?.og_image_url && (
                      <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={settings.og_image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-1">
                        {settings?.og_title || settings?.site_name || 'Ujamaan'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {settings?.og_description || 'Description non renseignée'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">ujamaan.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
