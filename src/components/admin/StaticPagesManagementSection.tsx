import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  updated_at: string;
}

const PAGE_ICONS: Record<string, string> = {
  contact: '📞',
  'a-propos': 'ℹ️',
  confidentialite: '🔒',
  conditions: '📋',
};

export default function StaticPagesManagementSection() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data } = await supabase
      .from('static_pages')
      .select('*')
      .order('slug');
    if (data) setPages(data);
  };

  const handleSave = async () => {
    if (!editingPage) return;
    setSaving(true);
    const { error } = await supabase
      .from('static_pages')
      .update({
        title: editingPage.title,
        content: editingPage.content,
        meta_description: editingPage.meta_description,
      })
      .eq('id', editingPage.id);

    if (error) {
      toast.error('Erreur: ' + error.message);
    } else {
      toast.success('Page mise à jour !');
      fetchPages();
    }
    setSaving(false);
  };

  const selectedPage = editingPage || pages[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pages statiques</h2>
          <p className="text-slate-600 mt-1">Gérez le contenu des pages Contact, À propos, Confidentialité et Conditions</p>
        </div>
      </div>

      <Tabs
        defaultValue={pages[0]?.slug}
        onValueChange={(slug) => {
          const page = pages.find(p => p.slug === slug);
          if (page) setEditingPage({ ...page });
        }}
      >
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          {pages.map(page => (
            <TabsTrigger key={page.slug} value={page.slug} className="gap-1">
              <span>{PAGE_ICONS[page.slug] || '📄'}</span>
              {page.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {pages.map(page => (
          <TabsContent key={page.slug} value={page.slug}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Éditer : {page.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titre de la page</Label>
                  <Input
                    value={editingPage?.slug === page.slug ? editingPage.title : page.title}
                    onChange={(e) => setEditingPage(prev => prev?.slug === page.slug ? { ...prev, title: e.target.value } : { ...page, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Meta description (SEO)</Label>
                  <Input
                    value={editingPage?.slug === page.slug ? (editingPage.meta_description || '') : (page.meta_description || '')}
                    onChange={(e) => setEditingPage(prev => prev?.slug === page.slug ? { ...prev, meta_description: e.target.value } : { ...page, meta_description: e.target.value })}
                    placeholder="Description pour les moteurs de recherche"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Contenu (Markdown simplifié)</Label>
                  <Textarea
                    value={editingPage?.slug === page.slug ? editingPage.content : page.content}
                    onChange={(e) => setEditingPage(prev => prev?.slug === page.slug ? { ...prev, content: e.target.value } : { ...page, content: e.target.value })}
                    className="mt-1 min-h-[400px] font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Utilisez ## pour les titres, ### pour les sous-titres, **texte** pour le gras, - pour les listes
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`/page/${page.slug}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  Dernière modification : {new Date(page.updated_at).toLocaleString('fr-FR')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
