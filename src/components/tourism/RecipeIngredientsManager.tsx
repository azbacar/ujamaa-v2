import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Ingredient {
  id?: string;
  name: string;
  quantity: string;
  unit: string;
  sort_order: number;
}

interface Props {
  gastronomyItemId: string;
  readOnly?: boolean;
}

const UNITS = ['g', 'kg', 'ml', 'l', 'pincée', 'cuillère à café', 'cuillère à soupe', 'tasse', 'pièce', 'tranche', 'feuille', 'gousse'];

export default function RecipeIngredientsManager({ gastronomyItemId, readOnly = false }: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIngredients();
  }, [gastronomyItemId]);

  const fetchIngredients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('gastronomy_item_id', gastronomyItemId)
      .order('sort_order', { ascending: true });
    setIngredients((data || []) as Ingredient[]);
    setLoading(false);
  };

  const addIngredient = async () => {
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .insert({
        gastronomy_item_id: gastronomyItemId,
        name: '',
        quantity: '',
        unit: 'g',
        sort_order: ingredients.length,
      } as any)
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setIngredients(prev => [...prev, data as Ingredient]);
  };

  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    // Optimistic update
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    const { error } = await supabase
      .from('recipe_ingredients')
      .update(updates as any)
      .eq('id', id);
    if (error) toast.error(error.message);
  };

  const deleteIngredient = async (id: string) => {
    const { error } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('id', id);
    if (error) { toast.error(error.message); return; }
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (readOnly) {
    return ingredients.length > 0 ? (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">🧑‍🍳 Ingrédients</h4>
        <div className="grid grid-cols-2 gap-1">
          {ingredients.map(ing => (
            <div key={ing.id} className="flex items-center gap-2 p-2 rounded bg-muted text-sm">
              <span className="font-medium">{ing.quantity} {ing.unit}</span>
              <span className="text-muted-foreground">{ing.name}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">🧑‍🍳 Ingrédients & Dosages</h4>
        <Button variant="outline" size="sm" onClick={addIngredient}>
          <Plus className="h-3 w-3 mr-1" /> Ajouter
        </Button>
      </div>

      {ingredients.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-3">
          Ajoutez les ingrédients de votre recette avec les dosages précis.
        </p>
      )}

      {ingredients.map((ing, idx) => (
        <div key={ing.id || idx} className="flex gap-2 items-center">
          <Input
            placeholder="Quantité"
            value={ing.quantity}
            onChange={e => ing.id && updateIngredient(ing.id, { quantity: e.target.value })}
            className="h-8 text-sm w-20"
          />
          <select
            value={ing.unit}
            onChange={e => ing.id && updateIngredient(ing.id, { unit: e.target.value })}
            className="h-8 text-sm border rounded px-2 bg-background"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <Input
            placeholder="Nom de l'ingrédient"
            value={ing.name}
            onChange={e => ing.id && updateIngredient(ing.id, { name: e.target.value })}
            className="h-8 text-sm flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive shrink-0"
            onClick={() => ing.id && deleteIngredient(ing.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
