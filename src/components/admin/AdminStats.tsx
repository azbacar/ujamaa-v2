import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
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
      color: 'admin-primary'
    },
    {
      title: 'Modifications en attente',
      value: pendingModifications,
      icon: Clock,
      color: 'admin-warning'
    },
    {
      title: 'Modifications approuvées',
      value: approvedModifications,
      icon: CheckCircle,
      color: 'admin-success'
    },
    {
      title: 'Modifications rejetées',
      value: rejectedModifications,
      icon: XCircle,
      color: 'admin-danger'
    },
    {
      title: 'Actions administratives',
      value: adminActions,
      icon: Shield,
      color: 'admin-accent'
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
              <div className="text-2xl font-bold text-slate-900">
                {stat.value}
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600`} />
          </Card>
        );
      })}
    </div>
  );
}