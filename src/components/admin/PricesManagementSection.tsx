import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';

interface Price {
  id: number;
  product: string;
  category: string;
  price: number;
  unit: string;
  vendor: string;
  location: string;
  market: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

// Données de démonstration
const mockPrices: Price[] = [
  {
    id: 1,
    product: "Riz blanc importé",
    category: "Céréales",
    price: 1500,
    unit: "kg",
    vendor: "Mama Hadija",
    location: "Volo-Volo, Moroni",
    market: "Marché Central Volo-Volo",
    status: 'approved',
    submittedAt: "2024-01-15",
    lastUpdated: "2024-01-15",
    trend: 'down'
  },
  {
    id: 2,
    product: "Bananes locales premium",
    category: "Fruits",
    price: 600,
    unit: "régime",
    vendor: "Ahmed Soilihi",
    location: "Bangoi-Madjou, Mutsamudu",
    market: "Marché de Mutsamudu",
    status: 'pending',
    submittedAt: "2024-01-16",
    lastUpdated: "2024-01-16",
    trend: 'stable'
  },
  {
    id: 3,
    product: "Tomates biologiques",
    category: "Légumes",
    price: 900,
    unit: "kg",
    vendor: "Fatima Abdou",
    location: "Mramani, Moroni",
    market: "Marché Mramani",
    status: 'pending',
    submittedAt: "2024-01-16",
    lastUpdated: "2024-01-16",
    trend: 'up'
  }
];

const PricesManagementSection = () => {
  const [prices, setPrices] = useState<Price[]>(mockPrices);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { toast } = useToast();

  const filteredPrices = prices.filter(price => {
    const matchesSearch = price.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || price.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprovePrice = (id: number) => {
    setPrices(prev => prev.map(price => 
      price.id === id ? { ...price, status: 'approved' as const } : price
    ));
    toast({
      title: "Prix approuvé",
      description: "Le prix a été approuvé et est maintenant visible publiquement.",
    });
  };

  const handleRejectPrice = (id: number) => {
    setPrices(prev => prev.map(price => 
      price.id === id ? { ...price, status: 'rejected' as const } : price
    ));
    toast({
      title: "Prix rejeté",
      description: "Le prix a été rejeté et ne sera pas publié.",
      variant: "destructive"
    });
  };

  const handleDeletePrice = (id: number) => {
    setPrices(prev => prev.filter(price => price.id !== id));
    toast({
      title: "Prix supprimé",
      description: "Le prix a été définitivement supprimé.",
      variant: "destructive"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 border-green-300">✓ Approuvé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">⏳ En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300">✗ Rejeté</Badge>;
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

  const pendingCount = prices.filter(p => p.status === 'pending').length;
  const approvedCount = prices.filter(p => p.status === 'approved').length;
  const totalCount = prices.length;

  return (
    <div className="space-y-6">
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
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                <p className="text-sm text-gray-600">Approuvés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-sm text-gray-600">En attente</p>
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
                variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('pending')}
                size="sm"
              >
                En attente ({pendingCount})
              </Button>
              <Button
                variant={selectedStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('approved')}
                size="sm"
              >
                Approuvés
              </Button>
              <Button
                variant={selectedStatus === 'rejected' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('rejected')}
                size="sm"
              >
                Rejetés
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
                        <p className="text-sm">{price.location}</p>
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
                      {new Date(price.submittedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {price.status === 'pending' && (
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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