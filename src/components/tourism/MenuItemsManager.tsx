import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ImagePlus, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  category: string;
  is_available: boolean;
  sort_order: number;
}

interface Props {
  gastronomyItemId: string;
  readOnly?: boolean;
}

const MENU_CATEGORIES = ['entrée', 'plat', 'dessert', 'boisson', 'accompagnement', 'spécialité'];

export default function MenuItemsManager({ gastronomyItemId, readOnly = false }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [gastronomyItemId]);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('restaurant_menu_items')
      .select('*')
      .eq('gastronomy_item_id', gastronomyItemId)
      .order('sort_order', { ascending: true });
    setItems((data || []) as MenuItem[]);
    setLoading(false);
  };

  const addItem = async () => {
    const newItem: any = {
      gastronomy_item_id: gastronomyItemId,
      name: '',
      description: '',
      price: 0,
      currency: 'FC',
      category: 'plat',
      is_available: true,
      sort_order: items.length,
    };
    const { data, error } = await supabase
      .from('restaurant_menu_items')
      .insert(newItem)
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setItems(prev => [...prev, data as MenuItem]);
  };

  const updateItem = async (id: string, updates: Partial<MenuItem>) => {
    const { error } = await supabase
      .from('restaurant_menu_items')
      .update(updates as any)
      .eq('id', id);
    if (error) { toast.error(error.message); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('restaurant_menu_items')
      .delete()
      .eq('id', id);
    if (error) { toast.error(error.message); return; }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    if (!user) return;
    setUploading(itemId);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${itemId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('menu-images').getPublicUrl(path);
      await updateItem(itemId, { image_url: `${publicUrl}?t=${Date.now()}` });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (readOnly) {
    return items.length > 0 ? (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">🍽️ Menu</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.filter(i => i.is_available).map(item => (
            <Card key={item.id} className="overflow-hidden">
              {item.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  </div>
                  <p className="font-semibold text-sm text-primary whitespace-nowrap">
                    {item.price.toLocaleString()} {item.currency}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">🍽️ Éléments du menu</h4>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3 w-3 mr-1" /> Ajouter
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun élément de menu. Cliquez sur "Ajouter" pour commencer.
        </p>
      )}

      {items.map((item, idx) => (
        <Card key={item.id || idx} className="p-3">
          <div className="space-y-3">
            <div className="flex gap-2">
              {/* Image */}
              <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted relative group">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                {item.id && (
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                    {uploading === item.id ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f && item.id) handleImageUpload(item.id, f);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Input
                    placeholder="Nom du plat"
                    value={item.name}
                    onChange={e => item.id && updateItem(item.id, { name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Prix"
                  value={item.price || ''}
                  onChange={e => item.id && updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm"
                />
                <Select
                  value={item.category}
                  onValueChange={v => item.id && updateItem(item.id, { category: v })}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MENU_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive h-8 w-8"
                onClick={() => item.id && deleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Input
              placeholder="Description (optionnel)"
              value={item.description}
              onChange={e => item.id && updateItem(item.id, { description: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
