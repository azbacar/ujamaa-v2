import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Globe, Brain, ExternalLink } from 'lucide-react';

interface KnowledgeSource {
  id: string;
  name: string;
  url: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function AIKnowledgeManagementSection() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSource, setNewSource] = useState({ name: '', url: '', description: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const { data, error } = await supabase
      .from('ai_knowledge_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sources:', error);
      toast.error('Erreur lors du chargement des sources');
    } else {
      setSources(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newSource.name.trim() || !newSource.url.trim()) {
      toast.error('Nom et URL sont requis');
      return;
    }

    setAdding(true);
    const { error } = await supabase.from('ai_knowledge_sources').insert({
      name: newSource.name.trim(),
      url: newSource.url.trim(),
      description: newSource.description.trim(),
      is_active: true,
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    } else {
      toast.success('Source ajoutée');
      setNewSource({ name: '', url: '', description: '' });
      fetchSources();
    }
    setAdding(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('ai_knowledge_sources')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      setSources(prev => prev.map(s => s.id === id ? { ...s, is_active: !isActive } : s));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('ai_knowledge_sources').delete().eq('id', id);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Source supprimée');
      setSources(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="h-6 w-6 text-purple-600" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sources de connaissances IA</h2>
          <p className="text-sm text-slate-500">
            Ajoutez des liens web dont l'IA pourra citer les informations. L'IA mentionnera la source par son nom sans afficher l'URL externe.
          </p>
        </div>
      </div>

      {/* Add new source */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une source
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Nom de la source (ex: Gazette des Comores)"
              value={newSource.name}
              onChange={e => setNewSource(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="URL (ex: https://lagazettedescomores.com)"
              value={newSource.url}
              onChange={e => setNewSource(prev => ({ ...prev, url: e.target.value }))}
            />
          </div>
          <Textarea
            placeholder="Description / Instructions pour l'IA (ex: Actualités comoriennes, politique, économie...)"
            value={newSource.description}
            onChange={e => setNewSource(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <Button onClick={handleAdd} disabled={adding} className="gap-2">
            <Plus className="h-4 w-4" />
            {adding ? 'Ajout...' : 'Ajouter la source'}
          </Button>
        </CardContent>
      </Card>

      {/* Sources list */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Chargement...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          Aucune source configurée. L'IA utilisera uniquement les données de la plateforme.
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map(source => (
            <Card key={source.id} className={`transition-opacity ${!source.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Globe className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">{source.name}</span>
                      <Badge variant={source.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {source.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{source.url}</p>
                    {source.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{source.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={source.is_active}
                    onCheckedChange={() => handleToggle(source.id, source.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(source.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-sm text-blue-800 space-y-2">
          <p className="font-medium">💡 Comment ça fonctionne :</p>
          <ul className="list-disc pl-5 space-y-1 text-blue-700">
            <li>L'IA utilisera ces sources comme <strong>références nommées</strong> dans ses réponses.</li>
            <li>Elle citera la source par son nom (ex: « Selon la Gazette des Comores... ») <strong>sans afficher le lien externe</strong>.</li>
            <li>Les seuls liens cliquables proposés seront les pages internes du site ujamaan.com.</li>
            <li>Désactivez une source pour que l'IA cesse temporairement de l'utiliser.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
