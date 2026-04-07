import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  feature: string;
  children: React.ReactNode;
  isPro: boolean;
}

export default function ProFeaturesGate({ feature, children, isPro }: Props) {
  const navigate = useNavigate();

  if (isPro) return <>{children}</>;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-sm bg-background/60 z-10 flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="font-bold text-foreground mb-1">Fonctionnalité Pro</h3>
          <p className="text-sm text-muted-foreground mb-4">{feature} est réservé aux abonnés UJAMAA Pro</p>
          <Button
            onClick={() => navigate('/pro')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Crown className="h-4 w-4 mr-2" /> Passer au Pro
          </Button>
        </div>
      </div>
      <CardContent className="p-6 opacity-30 pointer-events-none">
        {children}
      </CardContent>
    </Card>
  );
}
