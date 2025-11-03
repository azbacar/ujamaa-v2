import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  X, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  MapPin,
  User,
  DollarSign
} from 'lucide-react';

interface Price {
  id: string;
  product: string;
  category: string;
  price: number;
  unit: string;
  vendor: string;
  city: string;
  market: string;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  trend: 'up' | 'down' | 'stable';
}

const PricesManagementSection = () => {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrices((data || []).map(p => ({
        ...p,
        trend: (p.trend || 'stable') as 'up' | 'down' | 'stable'
      })));
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Erreur lors du chargement des prix');
    } finally {
      setLoading(false);
    }
  };

  const filteredPrices = prices.filter(price => {
    const matchesSearch = price.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || price.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprovePrice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prices')
        .update({ status: 'published' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Prix approuvé avec succès');
      fetchPrices();
    } catch (error) {
      console.error('Error approving price:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleRejectPrice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prices')
        .update({ status: 'draft' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Prix rejeté');
      fetchPrices();
    } catch (error) {
      console.error('Error rejecting price:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const handleDeletePrice = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prix ?')) return;

    try {
      const { error } = await supabase
        .from('prices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Prix supprimé avec succès');
      fetchPrices();
    } catch (error) {
      console.error('Error deleting price:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">✓ Publié</Badge>;
      case 'draft':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">⏳ Brouillon</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">📦 Archivé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-blue-500"></div>;
    }
  };

  const draftCount = prices.filter(p => p.status === 'draft').length;
  const publishedCount = prices.filter(p => p.status === 'published').length;
  const totalCount = prices.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Prix</h2>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un prix
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="admin-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                <p className="text-sm text-gray-600">Total prix</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
                <p className="text-sm text-gray-600">Publiés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{draftCount}</p>
                <p className="text-sm text-gray-600">Brouillons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {prices.filter(p => p.trend === 'up').length}
                </p>
                <p className="text-sm text-gray-600">En hausse</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un produit, vendeur ou lieu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={selectedStatus === 'draft' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('draft')}
                size="sm"
              >
                Brouillons ({draftCount})
              </Button>
              <Button
                variant={selectedStatus === 'published' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('published')}
                size="sm"
              >
                Publiés
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des prix */}
      <Card>
        <CardHeader>
          <CardTitle>Prix soumis ({filteredPrices.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Vendeur</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Tendance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrices.map((price) => (
                <TableRow key={price.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{price.product}</p>
                      <p className="text-sm text-gray-500">{price.category}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-600">
                        {price.price.toLocaleString()} FC
                      </span>
                      <span className="text-sm text-gray-500">/ {price.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{price.vendor}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm">{price.city}</p>
                        <p className="text-xs text-gray-500">{price.market}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(price.trend)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(price.status)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(price.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {price.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprovePrice(price.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRejectPrice(price.id)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePrice(price.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPrices.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-600 mb-1">Aucun prix trouvé</h3>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Essayez de modifier vos critères de recherche.' : 'Aucun prix soumis pour le moment.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PricesManagementSection;