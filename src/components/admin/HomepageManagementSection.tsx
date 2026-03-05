import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Home, Edit3, Plus, Trash2, Eye, EyeOff, Settings, Image, Type, Link, BarChart3, Megaphone, Users, FileText, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { HeroPreview } from './HeroPreview';

interface HeroConfig {
  id: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  backgroundImage?: string;
  isActive: boolean;
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  itemCount: number;
  link?: string;
  featured: boolean;
  isActive: boolean;
  order: number;
}

interface HomepageStats {
  totalUsers: number;
  totalContent: number;
  todayViews: number;
  announcements: number;
}

// LayoutManager sub-component for the "Mise en Page" tab
const LayoutManager = () => {
  const [sections, setSections] = useState<{ id: string; section_key: string; title: string; is_visible: boolean; sort_order: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast: toastFn } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true });
      if (data) setSections(data);
    };
    fetch();
  }, []);

  const toggleVisibility = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, is_visible: !s.is_visible } : s));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSections.length) return;
    const tmpOrder = newSections[index].sort_order;
    newSections[index].sort_order = newSections[swapIndex].sort_order;
    newSections[swapIndex].sort_order = tmpOrder;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    setSections(newSections);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const s of sections) {
        await supabase.from('homepage_sections').update({ is_visible: s.is_visible, sort_order: s.sort_order }).eq('id', s.id);
      }
      toastFn({ title: 'Mise en page sauvegardée', description: 'Les modifications sont appliquées.' });
    } catch {
      toastFn({ title: 'Erreur', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de la Mise en Page</CardTitle>
        <CardDescription>Réordonnez et activez/désactivez les sections de la page d'accueil</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sections.map((section, index) => (
          <div key={section.id} className={`flex items-center justify-between p-3 rounded-lg border ${section.is_visible ? 'bg-white' : 'bg-muted/50 opacity-60'}`}>
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{section.title || section.section_key}</span>
              <Badge variant={section.is_visible ? 'default' : 'outline'} className="text-xs">
                {section.is_visible ? 'Visible' : 'Masqué'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSection(index, 'up')} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleVisibility(section.id)}>
                {section.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
          {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
      </CardContent>
    </Card>
  );
};

export const HomepageManagementSection = () => {
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string>('');
  const [heroConfig, setHeroConfig] = useState<HeroConfig>({
    id: '1',
    title: 'UJAMAA Plateforme Unifiée',
    subtitle: 'Votre portail d\'information centralisé pour les Comores - Prix, marchés, services publics et bien plus',
    primaryButtonText: '🚀 Voir Plus',
    primaryButtonLink: '/prix',
    secondaryButtonText: '🤖 Assistant IA UJAMAA',
    isActive: true
  });

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettingsId(data.id);
        setHeroConfig({
          id: data.id,
          title: data.hero_title || heroConfig.title,
          subtitle: data.hero_subtitle || heroConfig.subtitle,
          primaryButtonText: heroConfig.primaryButtonText,
          primaryButtonLink: heroConfig.primaryButtonLink,
          secondaryButtonText: heroConfig.secondaryButtonText,
          backgroundImage: data.hero_image_url || undefined,
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('homepage_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) {
      setCategories(data.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        icon: c.icon,
        itemCount: 0,
        link: c.link || undefined,
        featured: c.featured,
        isActive: c.is_active,
        order: c.sort_order
      })));
    }
  };

  const [stats, setStats] = useState<HomepageStats>({
    totalUsers: 0,
    totalContent: 0,
    todayViews: 0,
    announcements: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch real stats from Supabase
      const [usersCount, contentCount, announcementsCount, analyticsData] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('content_items').select('*', { count: 'exact', head: true }),
        supabase.from('global_announcements').select('*', { count: 'exact', head: true }),
        supabase.from('site_analytics')
          .select('*')
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalContent: contentCount.count || 0,
        todayViews: analyticsData.data?.length || 0,
        announcements: announcementsCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isHeroDialogOpen, setIsHeroDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveHero = async () => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          hero_title: heroConfig.title,
          hero_subtitle: heroConfig.subtitle,
          hero_image_url: heroConfig.backgroundImage || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingsId);

      if (error) throw error;
      toast({
        title: "Héro mis à jour",
        description: "Les modifications de la section héro ont été sauvegardées.",
      });
      setIsHeroDialogOpen(false);
    } catch (error) {
      console.error('Error saving hero config:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive"
      });
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    try {
      const payload = {
        title: editingCategory.title,
        description: editingCategory.description,
        icon: editingCategory.icon,
        link: editingCategory.link || null,
        featured: editingCategory.featured,
        is_active: editingCategory.isActive,
        sort_order: editingCategory.order,
        updated_at: new Date().toISOString()
      };
      // Check if it's a new category (temp id) or existing
      const existing = categories.find(c => c.id === editingCategory.id);
      if (existing && editingCategory.id.length > 10) {
        // existing DB record
        const { error } = await supabase.from('homepage_categories').update(payload).eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        // new record
        const { error } = await supabase.from('homepage_categories').insert(payload);
        if (error) throw error;
      }
      toast({ title: "Catégorie sauvegardée", description: `"${editingCategory.title}" a été sauvegardée.` });
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", variant: "destructive" });
    }
    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: 'new',
      title: 'Nouvelle Catégorie',
      description: 'Description de la nouvelle catégorie',
      icon: '📁',
      itemCount: 0,
      featured: false,
      isActive: true,
      order: categories.length + 1
    };
    setEditingCategory(newCategory);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const { error } = await supabase.from('homepage_categories').delete().eq('id', categoryId);
    if (error) {
      toast({ title: "Erreur", variant: "destructive" });
      return;
    }
    fetchCategories();
    toast({ title: "Catégorie supprimée" });
  };

  const toggleCategoryStatus = async (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    await supabase.from('homepage_categories').update({ is_active: !cat.isActive }).eq('id', categoryId);
    fetchCategories();
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header avec aperçu */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Home className="h-6 w-6 text-blue-600" />
          Gestion de la page d'accueil
        </h2>
        <p className="text-slate-600">
          Configurez le contenu, les catégories et l'apparence de votre page d'accueil.
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Utilisateurs</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Contenus</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalContent}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Vues aujourd'hui</p>
                <p className="text-3xl font-bold text-slate-900">{stats.todayViews}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Annonces</p>
                <p className="text-3xl font-bold text-slate-900">{stats.announcements}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="hero" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Section Héro</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Catégories</TabsTrigger>
          <TabsTrigger value="layout" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Mise en Page</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Paramètres</TabsTrigger>
        </TabsList>

        {/* Section Héro */}
        <TabsContent value="hero">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <Home className="h-5 w-5 text-blue-600" />
                Gestion de la Section Héro
              </CardTitle>
              <CardDescription className="text-slate-600">
                Configurez le contenu principal de votre page d'accueil avec prévisualisation en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prévisualisation en temps réel */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Aperçu en temps réel
                </Label>
                <HeroPreview 
                  title={heroConfig.title}
                  subtitle={heroConfig.subtitle}
                  imageUrl={heroConfig.backgroundImage || ''}
                />
                <p className="text-sm text-muted-foreground">
                  Les modifications apparaissent ici instantanément pendant que vous éditez
                </p>
              </div>

              {/* Formulaire d'édition */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hero-title">Titre Principal</Label>
                    <Input
                      id="hero-title"
                      value={heroConfig.title}
                      onChange={(e) => setHeroConfig(prev => ({ ...prev, title: e.target.value }))}
                      className="text-lg font-semibold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-subtitle">Sous-titre</Label>
                    <Textarea
                      id="hero-subtitle"
                      value={heroConfig.subtitle}
                      onChange={(e) => setHeroConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-bg-image">Image de fond (URL)</Label>
                    <Input
                      id="hero-bg-image"
                      value={heroConfig.backgroundImage || ''}
                      onChange={(e) => setHeroConfig(prev => ({ ...prev, backgroundImage: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primary-btn">Bouton Principal</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-btn"
                        value={heroConfig.primaryButtonText}
                        onChange={(e) => setHeroConfig(prev => ({ ...prev, primaryButtonText: e.target.value }))}
                        placeholder="Texte du bouton"
                      />
                      <Input
                        value={heroConfig.primaryButtonLink}
                        onChange={(e) => setHeroConfig(prev => ({ ...prev, primaryButtonLink: e.target.value }))}
                        placeholder="Lien"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary-btn">Bouton Secondaire</Label>
                    <Input
                      id="secondary-btn"
                      value={heroConfig.secondaryButtonText}
                      onChange={(e) => setHeroConfig(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hero-active"
                  checked={heroConfig.isActive}
                  onCheckedChange={(checked) => setHeroConfig(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="hero-active">Section active</Label>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveHero} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Settings className="h-4 w-4" />
                  Sauvegarder les modifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestion des Catégories */}
        <TabsContent value="categories">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <FileText className="h-5 w-5 text-blue-600" />
                Gestion des Catégories
              </CardTitle>
              <CardDescription className="text-slate-600">
                Configurez les catégories affichées sur la page d'accueil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">
                  {categories.filter(cat => cat.isActive).length} catégories actives sur {categories.length}
                </p>
                <Button onClick={handleAddCategory} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4" />
                  Ajouter une catégorie
                </Button>
              </div>

              <div className="grid gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className={`border-slate-200 bg-white hover:shadow-md transition-all duration-200 ${!category.isActive ? 'opacity-60' : ''}`}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h4 className="font-semibold">{category.title}</h4>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{category.itemCount} éléments</Badge>
                            {category.featured && <Badge>En vedette</Badge>}
                            <Badge variant={category.isActive ? "default" : "destructive"}>
                              {category.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategoryStatus(category.id)}
                        >
                          {category.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category);
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer la catégorie "{category.title}" ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mise en Page */}
        <TabsContent value="layout">
          <LayoutManager />
        </TabsContent>

        {/* Paramètres */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Généraux</CardTitle>
              <CardDescription>
                Configuration générale de la page d'accueil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch />
                  <Label>Mode maintenance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Permettre l'inscription</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Affichage public</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Notifications par email</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cache-duration">Durée de cache (minutes)</Label>
                  <Input id="cache-duration" type="number" defaultValue="30" />
                </div>
                <div>
                  <Label htmlFor="max-categories">Nombre maximum de catégories</Label>
                  <Input id="max-categories" type="number" defaultValue="12" />
                </div>
              </div>

              <Button className="w-full">
                Mettre à jour les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog pour éditer une catégorie */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.id === Date.now().toString() ? 'Ajouter' : 'Modifier'} une catégorie
            </DialogTitle>
            <DialogDescription>
              Configurez les détails de la catégorie
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cat-title">Titre</Label>
                <Input
                  id="cat-title"
                  value={editingCategory.title}
                  onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                />
              </div>
              <div>
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                />
              </div>
              <div>
                <Label htmlFor="cat-icon">Icône (emoji)</Label>
                <Input
                  id="cat-icon"
                  value={editingCategory.icon}
                  onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, icon: e.target.value }) : null)}
                />
              </div>
              <div>
                <Label htmlFor="cat-link">Lien (optionnel)</Label>
                <Input
                  id="cat-link"
                  value={editingCategory.link || ''}
                  onChange={(e) => setEditingCategory(prev => prev ? ({ ...prev, link: e.target.value }) : null)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingCategory.featured}
                  onCheckedChange={(checked) => setEditingCategory(prev => prev ? ({ ...prev, featured: checked }) : null)}
                />
                <Label>En vedette</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveCategory} className="flex-1">
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};