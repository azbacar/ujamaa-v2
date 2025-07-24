import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Shield
} from 'lucide-react';

interface AdminStatsProps {
  userCount: number;
  pendingModifications: number;
  approvedModifications: number;
  rejectedModifications: number;
  adminActions: number;
}

export default function AdminStats({ 
  userCount, 
  pendingModifications, 
  approvedModifications, 
  rejectedModifications,
  adminActions 
}: AdminStatsProps) {
  const stats = [
    {
      title: 'Utilisateurs totaux',
      value: userCount,
      icon: Users,
      color: 'admin-primary',
      trend: '+5%'
    },
    {
      title: 'Modifications en attente',
      value: pendingModifications,
      icon: Clock,
      color: 'admin-warning',
      trend: '-2%'
    },
    {
      title: 'Modifications approuvées',
      value: approvedModifications,
      icon: CheckCircle,
      color: 'admin-success',
      trend: '+12%'
    },
    {
      title: 'Modifications rejetées',
      value: rejectedModifications,
      icon: XCircle,
      color: 'admin-danger',
      trend: '+3%'
    },
    {
      title: 'Actions administratives',
      value: adminActions,
      icon: Shield,
      color: 'admin-accent',
      trend: '+8%'
    },
    {
      title: 'Activité générale',
      value: '94%',
      icon: Activity,
      color: 'admin-secondary',
      trend: '+6%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden border-blue-200 bg-white hover:bg-blue-50 transition-all duration-300 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 text-blue-600`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    stat.trend.startsWith('+') 
                      ? 'text-green-600 border-green-200' 
                      : 'text-red-600 border-red-200'
                  }`}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                depuis le mois dernier
              </p>
            </CardContent>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600`} />
          </Card>
        );
      })}
    </div>
  );
}