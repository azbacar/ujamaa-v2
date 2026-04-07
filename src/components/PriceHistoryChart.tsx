import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { History, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PriceHistoryEntry {
  id: string;
  old_price: number;
  new_price: number;
  changed_at: string;
}

interface Props {
  priceId: string;
  productName: string;
  currentPrice: number;
  currency: string;
}

export default function PriceHistoryChart({ priceId, productName, currentPrice, currency }: Props) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('price_history')
        .select('*')
        .eq('price_id', priceId)
        .order('changed_at', { ascending: true });
      setHistory((data as PriceHistoryEntry[]) || []);
      setLoading(false);
    };
    fetch();
  }, [priceId]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <History className="h-6 w-6 mx-auto mb-1 opacity-50" />
        <p>Aucun historique de prix disponible</p>
      </div>
    );
  }

  // Build chart data: start with first old_price, then each new_price
  const chartData = [
    {
      date: new Date(history[0].changed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      prix: Number(history[0].old_price),
    },
    ...history.map(h => ({
      date: new Date(h.changed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      prix: Number(h.new_price),
    })),
  ];

  const minPrice = Math.min(...chartData.map(d => d.prix));
  const maxPrice = Math.max(...chartData.map(d => d.prix));
  const priceChange = history.length > 0 ? Number(history[history.length - 1].new_price) - Number(history[0].old_price) : 0;
  const percentChange = history.length > 0 && Number(history[0].old_price) > 0
    ? ((priceChange / Number(history[0].old_price)) * 100).toFixed(1)
    : '0';

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4" /> Historique des prix
          </span>
          <div className="flex items-center gap-2">
            {priceChange > 0 ? (
              <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" /> +{percentChange}%
              </Badge>
            ) : priceChange < 0 ? (
              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 text-xs">
                <TrendingDown className="h-3 w-3 mr-1" /> {percentChange}%
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Stable</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis
              domain={[minPrice * 0.9, maxPrice * 1.1]}
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={v => `${v.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} ${currency}`, 'Prix']}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="prix"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Min: {minPrice.toLocaleString()} {currency}</span>
          <span>{history.length} modification{history.length > 1 ? 's' : ''}</span>
          <span>Max: {maxPrice.toLocaleString()} {currency}</span>
        </div>
      </CardContent>
    </Card>
  );
}
