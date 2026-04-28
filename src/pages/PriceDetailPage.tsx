import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PriceDetailDialog from '@/components/PriceDetailDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { usePageSEO } from '@/hooks/usePageSEO';

interface PriceData {
  id: string;
  product: string;
  category: string;
  price: number;
  currency: string;
  vendor: string;
  location: { village: string | null; city: string; region: string | null; island: string };
  market: string;
  created_at: string;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  merchant_type?: string | null;
  geo_expires_at?: string | null;
}

export default function PriceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [language, setLanguage] = useState('fr');

  usePageSEO(
    price
      ? {
          title: `${price.product} — ${price.price.toLocaleString('fr-FR')} ${price.currency}/${price.unit}`,
          description: `Prix de ${price.product} chez ${price.vendor} au marché ${price.market}, ${price.location.city} (${price.location.island}). Consultez les détails et l'historique sur UJAMAA.`,
          canonicalPath: `/prix/${price.id}`,
          ogImage: price.image_url || undefined,
          keywords: `${price.product}, prix Comores, ${price.location.island}, ${price.market}, ${price.category}`,
        }
      : { title: 'Détail du prix', description: 'Détail d\'un prix sur UJAMAA', canonicalPath: `/prix/${id}` }
  );

  // Inject Product JSON-LD for rich results
  useEffect(() => {
    if (!price) return;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: price.product,
      category: price.category,
      image: price.image_url || undefined,
      offers: {
        '@type': 'Offer',
        price: price.price,
        priceCurrency: price.currency === 'FC' ? 'KMF' : price.currency,
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: price.vendor },
        areaServed: `${price.location.city}, ${price.location.island}`,
      },
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-product-jsonld', price.id);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [price]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPrice({
        id: data.id,
        product: data.product,
        category: data.category,
        price: Number(data.price),
        currency: data.currency,
        vendor: data.vendor,
        market: data.market,
        location: { village: data.village, city: data.city, region: data.region, island: data.island },
        trend: (data.trend as 'up' | 'down' | 'stable') || 'stable',
        unit: data.unit,
        created_at: data.created_at,
        image_url: (data as any).image_url,
        latitude: (data as any).latitude,
        longitude: (data as any).longitude,
        merchant_type: (data as any).merchant_type,
        geo_expires_at: (data as any).geo_expires_at,
      });
      // Increment views via RPC atomique (best-effort, dédupliqué par session)
      const vKey = `view:price:${id}`;
      if (!sessionStorage.getItem(vKey)) {
        sessionStorage.setItem(vKey, '1');
        supabase.rpc('increment_content_view', { _type: 'price', _id: id }).then(({ error }) => {
          if (error) sessionStorage.removeItem(vKey);
        });
      }
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
      <Header currentLanguage={language} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 py-8">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link to="/prix"><ArrowLeft className="h-4 w-4 mr-1" /> Retour aux prix</Link>
        </Button>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        )}

        {notFound && !loading && (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-2">Prix introuvable</h1>
            <p className="text-muted-foreground mb-4">Ce prix n'existe pas ou n'est plus publié.</p>
            <Button onClick={() => navigate('/prix')}>Voir tous les prix</Button>
          </div>
        )}

        <PriceDetailDialog price={price} open={!!price} onOpenChange={(o) => !o && navigate('/prix')} />
      </main>
      <Footer />
    </div>
  );
}
