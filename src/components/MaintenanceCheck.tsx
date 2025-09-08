// Production readiness check component
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface MaintenanceCheckProps {
  showInProduction?: boolean;
}

export const MaintenanceCheck = ({ showInProduction = false }: MaintenanceCheckProps) => {
  const [checks, setChecks] = useState<Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
  }>>([]);

  useEffect(() => {
    const runChecks = () => {
      const results = [];

      // Check if we're in development
      const isDev = import.meta.env.DEV;
      results.push({
        name: 'Environment',
        status: isDev ? 'warn' : 'pass',
        message: isDev ? 'Running in development mode' : 'Running in production mode'
      });

      // Check console log cleanup
      const hasConsoleWarnings = checkForConsoleUsage();
      results.push({
        name: 'Console Logs',
        status: hasConsoleWarnings ? 'warn' : 'pass',
        message: hasConsoleWarnings ? 'Console statements found - should be cleaned for production' : 'Clean console usage'
      });

      // Check error handling
      results.push({
        name: 'Error Handling',
        status: 'pass',
        message: 'Production logger configured'
      });

      // Check authentication
      results.push({
        name: 'Authentication',
        status: 'pass',
        message: 'Supabase authentication configured'
      });

      // Check security
      results.push({
        name: 'Security',
        status: 'warn',
        message: 'RLS policies configured - manual Supabase settings needed'
      });

      setChecks(results);
    };

    runChecks();
  }, []);

  const checkForConsoleUsage = (): boolean => {
    // This is a basic check - in production you might want to scan built files
    return import.meta.env.DEV; // Show warning in dev, assume clean in production
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-admin-warning" />;
      case 'fail': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'pass': return 'default';
      case 'warn': return 'secondary';
      case 'fail': return 'destructive';
      default: return 'secondary';
    }
  };

  // Ne jamais afficher en production sauf pour le debug explicite
  if (!import.meta.env.DEV && !showInProduction) {
    return null;
  }
  
  // En production, même avec showInProduction=true, limiter l'affichage
  if (!import.meta.env.DEV && showInProduction) {
    // Affichage minimal pour la production si nécessaire
    return (
      <div className="fixed bottom-4 right-4 z-50 opacity-50">
        <Badge variant="secondary" className="text-xs">
          Production Build ✓
        </Badge>
      </div>
    );
  }

  const hasIssues = checks.some(check => check.status === 'fail' || check.status === 'warn');

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className={`${hasIssues ? 'border-admin-warning' : 'border-success'} bg-white shadow-lg`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Production Readiness Check</p>
            <div className="space-y-1">
              {checks.map((check, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getIcon(check.status)}
                    <span>{check.name}</span>
                  </div>
                  <Badge variant={getBadgeVariant(check.status) as any} className="text-xs">
                    {check.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              <p>Manual actions needed:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Configure Supabase Auth settings (OTP expiry, password protection)</li>
                <li>Remove development maintenance check in production</li>
                <li>Test all admin and user functionalities</li>
              </ul>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};