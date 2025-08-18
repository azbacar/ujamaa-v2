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
import { Home, Edit3, Plus, Trash2, Eye, EyeOff, Settings, Image, Type, Link, BarChart3, Megaphone, Users, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const HomepageManagementSection = () => {
  const [heroConfig, setHeroConfig] = useState<HeroConfig>({
    id: '1',
    title: 'UJAMAA Plateforme Unifiée',
    subtitle: 'Votre portail d\'information centralisé pour les Comores - Prix, marchés, services publics et bien plus',
    primaryButtonText: '🚀 Voir Plus',
    primaryButtonLink: '/prix',
    secondaryButtonText: '🤖 Assistant IA UJAMAA',
    isActive: true
  });

  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      title: 'Prix & Marchés',
      description: 'Prix actualisés des produits alimentaires et biens de consommation dans tous les marchés',
      icon: '💰',
      itemCount: 156,
      link: '/prix',
      featured: true,
      isActive: true,
      order: 1
    },
    {
      id: '2',
      title: 'Appels d\'Offres',
      description: 'Marchés publics, appels à projets et opportunités d\'affaires',
      icon: '📋',
      itemCount: 23,
      link: '/appels-offres',
      featured: false,
      isActive: true,
      order: 2
    },
    {
      id: '3',
      title: 'Événements',
      description: 'Manifestations culturelles, cérémonies officielles et événements communautaires',
      icon: '🎭',
      itemCount: 45,
      link: '/evenements',
      featured: false,
      isActive: true,
      order: 3
    },
    {
      id: '4',
      title: 'Services Publics',
      description: 'Horaires, contacts et informations sur les administrations et services',
      icon: '🏛️',
      itemCount: 78,
      link: '/services',
      featured: false,
      isActive: true,
      order: 4
    },
    {
      id: '5',
      title: 'Transport',
      description: 'Horaires des liaisons, tarifs et informations de transport inter-îles',
      icon: '🚢',
      itemCount: 34,
      featured: false,
      isActive: true,
      order: 5
    },
    {
      id: '6',
      title: 'Santé',
      description: 'Services de santé, pharmacies de garde et informations médicales',
      icon: '🏥',
      itemCount: 67,
      link: '/services',
      featured: true,
      isActive: true,
      order: 6
    }
  ]);

  const [stats, setStats] = useState<HomepageStats>({
    totalUsers: 1247,
    totalContent: 523,
    todayViews: 3456,
    announcements: 12
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isHeroDialogOpen, setIsHeroDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveHero = () => {
    toast({
      title: "Héro mis à jour",
      description: "Les modifications de la section héro ont été sauvegardées.",
    });
    setIsHeroDialogOpen(false);
  };

  const handleSaveCategory = () => {
    if (editingCategory) {
      setCategories(prev => 
        prev.map(cat => cat.id === editingCategory.id ? editingCategory : cat)
      );
      toast({
        title: "Catégorie mise à jour",
        description: `La catégorie "${editingCategory.title}" a été mise à jour.`,
      });
    }
    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: Date.now().toString(),
      title: 'Nouvelle Catégorie',
      description: 'Description de la nouvelle catégorie',
      icon: '📁',
      itemCount: 0,
      featured: false,
      isActive: true,
      order: categories.length + 1
    };
    setCategories(prev => [...prev, newCategory]);
    setEditingCategory(newCategory);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    toast({
      title: "Catégorie supprimée",
      description: "La catégorie a été supprimée avec succès.",
    });
  };

  const toggleCategoryStatus = (categoryId: string) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
      )
    );
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
                Configurez le contenu principal de votre page d'accueil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
                  <Eye className="h-4 w-4 mr-2" />
                  Prévisualiser
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
          <Card>
            <CardHeader>
              <CardTitle>Configuration de la Mise en Page</CardTitle>
              <CardDescription>
                Organisez l'ordre et l'affichage des sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Sections actives</Label>
                  <div className="space-y-2 mt-2">
                    {['Hero Section', 'Catégories', 'Annonces', 'Statistiques', 'Assistant IA'].map((section) => (
                      <div key={section} className="flex items-center space-x-2">
                        <Switch defaultChecked />
                        <Label>{section}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Paramètres d'affichage</Label>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label htmlFor="categories-per-row">Catégories par ligne</Label>
                      <Select defaultValue="2">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 colonne</SelectItem>
                          <SelectItem value="2">2 colonnes</SelectItem>
                          <SelectItem value="3">3 colonnes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch />
                      <Label>Afficher la sidebar</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button className="w-full">
                Sauvegarder la configuration
              </Button>
            </CardContent>
          </Card>
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