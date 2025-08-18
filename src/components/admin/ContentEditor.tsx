
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  X, 
  Eye,
  Calendar,
  User,
  Tag
} from 'lucide-react';

interface ContentEditorProps {
  onSave: (content: any) => void;
  onCancel: () => void;
  initialData?: any;
  type: 'announcement' | 'event' | 'service' | 'tender';
}

export default function ContentEditor({ 
  onSave, 
  onCancel, 
  initialData, 
  type 
}: ContentEditorProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    status: initialData?.status || 'draft',
    ...initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, type });
  };

  const getTypeLabel = () => {
    switch(type) {
      case 'announcement': return 'Annonce';
      case 'event': return 'Événement';
      case 'service': return 'Service';
      case 'tender': return 'Appel d\'offres';
      default: return 'Contenu';
    }
  };

  const getTypeColor = () => {
    switch(type) {
      case 'announcement': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'event': return 'bg-green-100 text-green-700 border-green-200';
      case 'service': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'tender': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-2xl font-bold text-slate-900">
                {initialData ? 'Modifier' : 'Créer'} - {getTypeLabel()}
              </CardTitle>
              <Badge className={getTypeColor()}>
                {getTypeLabel()}
              </Badge>
            </div>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Titre *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={`Titre de ${getTypeLabel().toLowerCase()}...`}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Catégorie
                  </Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Transport, Culture, Administrative..."
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                    Statut
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">📝 Brouillon</SelectItem>
                      <SelectItem value="published">✅ Publié</SelectItem>
                      <SelectItem value="archived">📦 Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Aperçu des métadonnées
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-slate-500" />
                      <span className="text-slate-600">Créé par vous</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span className="text-slate-600">
                        {new Date().toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {formData.category && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 text-slate-500" />
                        <span className="text-slate-600">{formData.category}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={`Description détaillée de ${getTypeLabel().toLowerCase()}...`}
                rows={8}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Utilisez une description claire et informative pour vos utilisateurs.
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
              <Button variant="outline" type="button" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Save className="h-4 w-4 mr-2" />
                {initialData ? 'Mettre à jour' : 'Créer et publier'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
