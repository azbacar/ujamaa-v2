import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Copy, Check, Smartphone, Shield, Zap, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "vpibvgdpeiicczelbynf";
const API_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/mobile-api`;

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  permission: "login" | "admin";
  body?: string;
  example?: string;
}

const ENDPOINTS: { group: string; items: Endpoint[] }[] = [
  {
    group: "🔐 Authentification (utilisateurs publics)",
    items: [
      { method: "POST", path: "/auth/login", description: "Connexion email/password.", permission: "login",
        body: '{ "email": "user@ex.com", "password": "***" }' },
      { method: "POST", path: "/auth/refresh", description: "Rafraîchir un access_token.", permission: "login",
        body: '{ "refresh_token": "..." }' },
      { method: "GET", path: "/auth/me", description: "Profil de l'utilisateur connecté (Bearer requis).", permission: "login" },
    ],
  },
  {
    group: "📱 Contenu public (lecture)",
    items: [
      { method: "GET", path: "/public/prices?limit=50", description: "Prix publiés (filtres : island, category).", permission: "login" },
      { method: "GET", path: "/public/events", description: "Événements à venir publiés.", permission: "login" },
      { method: "GET", path: "/public/content", description: "Articles, services, appels d'offres, annonces.", permission: "login" },
      { method: "GET", path: "/public/gastronomy", description: "Tourisme & gastronomie publiés.", permission: "login" },
      { method: "GET", path: "/public/freelancers", description: "Freelancers visibles et disponibles.", permission: "login" },
      { method: "GET", path: "/public/diaspora", description: "Projets diaspora publiés.", permission: "login" },
    ],
  },
  {
    group: "🤖 Assistant IA",
    items: [
      { method: "POST", path: "/ai-chat", description: "Pose une question à l'assistant Ujamaan.", permission: "login",
        body: '{ "message": "Prix du riz à Moroni ?", "sessionId": "uuid-v4" }' },
    ],
  },
  {
    group: "👥 Utilisateurs (admin)",
    items: [
      { method: "GET", path: "/users?search=&limit=50", description: "Liste des utilisateurs.", permission: "admin" },
      { method: "GET", path: "/users/{id}", description: "Détail d'un utilisateur + rôle.", permission: "admin" },
    ],
  },
  {
    group: "💰 Prix (admin – écriture)",
    items: [
      { method: "GET", path: "/prices?island=&category=&limit=50", description: "Liste filtrée.", permission: "admin" },
      { method: "GET", path: "/prices/{id}", description: "Détail.", permission: "admin" },
      { method: "PUT", path: "/prices/{id}", description: "Mise à jour.", permission: "admin", body: '{ "price": 500 }' },
      { method: "DELETE", path: "/prices/{id}", description: "Suppression.", permission: "admin" },
    ],
  },
  {
    group: "🎭 Événements (admin)",
    items: [
      { method: "GET", path: "/events", description: "Liste.", permission: "admin" },
      { method: "PUT", path: "/events/{id}", description: "Mise à jour.", permission: "admin" },
      { method: "DELETE", path: "/events/{id}", description: "Suppression.", permission: "admin" },
    ],
  },
  {
    group: "📰 Contenu (admin)",
    items: [
      { method: "GET", path: "/content?type=announcement", description: "Liste, filtrer par type.", permission: "admin" },
      { method: "PUT", path: "/content/{id}", description: "Mise à jour.", permission: "admin" },
      { method: "DELETE", path: "/content/{id}", description: "Suppression.", permission: "admin" },
    ],
  },
];

const methodColor: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 border-emerald-300",
  POST: "bg-ocean-100 text-ocean-700 border-ocean-300",
  PUT: "bg-amber-100 text-amber-700 border-amber-300",
  DELETE: "bg-red-100 text-red-700 border-red-300",
};

const ApiDocsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  usePageSEO({
    title: "Documentation API mobile",
    description: "Documentation privée de l'API Ujamaan pour l'application mobile.",
    noIndex: true,
    canonicalPath: "/api-docs",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/api-docs", { replace: true });
    }
  }, [loading, user, navigate]);

  const copy = async (txt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
      toast({ title: "Copié", description: "Commande copiée dans le presse-papier." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier.", variant: "destructive" });
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto text-emerald-600 mb-3" />
          <p className="text-muted-foreground">Vérification de l'accès…</p>
        </div>
      </div>
    );
  }

  const curlExample = (e: Endpoint) =>
    `curl -X ${e.method} "${API_BASE}${e.path}" \\
  -H "x-api-key: VOTRE_CLE_API" \\
  -H "Authorization: Bearer VOTRE_TOKEN_UTILISATEUR" \\
  -H "Content-Type: application/json"${e.body ? ` \\\n  -d '${e.body}'` : ""}`;

  return (
    <>
      <Header currentLanguage="fr" onLanguageChange={() => {}} />

      <main className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-ocean-50/40 pb-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
          <div className="mb-8">
            <Badge variant="outline" className="mb-3 border-amber-400 text-amber-700 bg-amber-50">
              <Lock className="w-3 h-3 mr-1" /> API privée — accès réservé
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
              Documentation API – Application Mobile
            </h1>
            <p className="text-muted-foreground">
              Cette API alimente l'application mobile Ujamaan. Elle couvre l'ensemble du site
              <strong> à l'exception du back-office d'administration</strong>.
              Une <strong>clé API</strong> est requise pour tous les appels ; les routes utilisateur
              demandent en plus un <strong>Bearer token</strong> obtenu via <code>/auth/login</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex gap-3 items-center">
                <Shield className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Privée</div>
                  <div className="text-xs text-muted-foreground">Accès via clé + auth utilisateur</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex gap-3 items-center">
                <Smartphone className="w-8 h-8 text-ocean-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Mobile-first</div>
                  <div className="text-xs text-muted-foreground">Optimisée pour Capacitor / React Native</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex gap-3 items-center">
                <Zap className="w-8 h-8 text-amber-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Temps réel</div>
                  <div className="text-xs text-muted-foreground">Données rafraîchies via Supabase</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview"><BookOpen className="w-4 h-4 mr-1" />Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="auth">Authentification</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <Card>
                <CardHeader><CardTitle>Base URL</CardTitle></CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-emerald-300 text-sm p-3 rounded-lg overflow-x-auto">
                    {API_BASE}
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    Toutes les requêtes utilisent ce préfixe. Format JSON, encodage UTF-8.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Codes HTTP</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div><Badge>200</Badge> Succès</div>
                  <div><Badge variant="secondary">400</Badge> Requête invalide</div>
                  <div><Badge variant="destructive">401</Badge> Clé API ou token manquant/invalide</div>
                  <div><Badge variant="destructive">403</Badge> Permission insuffisante</div>
                  <div><Badge variant="destructive">404</Badge> Ressource introuvable</div>
                  <div><Badge variant="destructive">500</Badge> Erreur serveur</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auth" className="space-y-4 mt-6">
              <Card>
                <CardHeader><CardTitle>1️⃣ Clé API (obligatoire)</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    Chaque requête doit inclure l'en-tête <code>x-api-key</code>.
                    Les clés sont émises et révoquées par l'équipe Ujamaan
                    (table <code>api_keys</code>, hashée SHA-256).
                  </p>
                  <pre className="bg-gray-900 text-amber-200 text-xs p-3 rounded overflow-x-auto">
                    x-api-key: VOTRE_CLE_API
                  </pre>
                  <p className="text-xs text-muted-foreground">
                    Permissions disponibles : <code>login</code> (app mobile publique), <code>admin</code> (CRM interne).
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>2️⃣ Connexion utilisateur</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    L'utilisateur final s'authentifie via <code>POST /auth/login</code> et reçoit un
                    <code> access_token</code> à inclure dans l'en-tête <code>Authorization: Bearer …</code>
                    pour toutes les routes protégées (profil, messages, paiements, candidatures…).
                  </p>
                  <pre className="bg-gray-900 text-emerald-300 text-xs p-3 rounded overflow-x-auto">
{`POST /auth/login
{ "email": "user@ex.com", "password": "***" }

→ { access_token, refresh_token, expires_at, user }`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="endpoints" className="space-y-6 mt-6">
              {ENDPOINTS.map((group) => (
                <div key={group.group}>
                  <h3 className="text-lg font-bold mb-3 text-emerald-700">{group.group}</h3>
                  <div className="space-y-3">
                    {group.items.map((e, i) => {
                      const id = `${e.method}-${e.path}-${i}`;
                      const cmd = curlExample(e);
                      return (
                        <Card key={id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge className={`${methodColor[e.method]} border font-mono`}>
                                {e.method}
                              </Badge>
                              <code className="font-mono text-sm break-all">{e.path}</code>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {e.permission === "admin" ? "🔒 Admin" : "👤 Utilisateur"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{e.description}</p>
                            <div className="relative">
                              <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded overflow-x-auto pr-10">
                                {cmd}
                              </pre>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copy(cmd, id)}
                                className="absolute top-1 right-1 h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
                              >
                                {copied === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}

              <Card className="border-amber-300 bg-amber-50/50">
                <CardContent className="p-4 text-sm">
                  <strong>⚠️ Hors périmètre :</strong> Les endpoints d'administration interne
                  (<code>/admin/*</code>, modération, paramètres globaux du site) ne sont
                  <strong> pas exposés</strong> via cette API mobile.
                </CardContent>
              </Card>

              <div className="text-center pt-4">
                <Button variant="outline" asChild>
                  <a
                    href={`${API_BASE}/openapi.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📥 Télécharger la spec OpenAPI (JSON)
                  </a>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ApiDocsPage;
