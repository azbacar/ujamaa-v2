import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Crown,
  Zap,
  Star,
  Shield,
  TrendingUp,
  Users,
  BarChart3,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Banknote,
  CreditCard,
  X,
  Eye,
  MessageSquare,
  Bell,
  Search,
  FileText,
  Phone,
  Lock,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    id: "basic",
    name: "Gratuit",
    price: "0",
    currency: "FC",
    period: "/mois",
    description: "Accès aux fonctionnalités essentielles",
    features: [
      "Consultation des prix et marchés",
      "Annonces publiques",
      "Événements et actualités",
      "Assistant IA basique",
      "Support communautaire",
    ],
    icon: Shield,
    gradient: "from-muted to-muted/80",
    cta: "Plan actuel",
    disabled: true,
  },
  {
    id: "premium",
    name: "UJAMAA Pro",
    price: "5 000",
    currency: "FC",
    period: "/mois",
    description: "Pour les professionnels et commerçants",
    popular: true,
    features: [
      "Tout le plan Gratuit",
      "Alertes prix en temps réel",
      "Historique complet des prix",
      "Statistiques avancées",
      "Badge ✅ Vérifié sur le profil",
      "Boost IA pour vos annonces",
      "Contact direct activé",
      "Support prioritaire 24/7",
    ],
    icon: Star,
    gradient: "from-primary to-emerald-600",
    cta: "Passer au Pro",
    disabled: false,
  },
  {
    id: "enterprise",
    name: "Entreprise",
    price: "Sur devis",
    currency: "",
    period: "",
    description: "Solutions sur mesure pour organisations",
    features: [
      "Tout le plan Pro",
      "Intégration système personnalisée",
      "Tableau de bord dédié",
      "Formation équipe",
      "Consultant dédié",
      "SLA garanti 99.9%",
    ],
    icon: Crown,
    gradient: "from-purple-600 to-pink-600",
    cta: "Nous contacter",
    disabled: false,
  },
];

const PRO_ADVANTAGES = [
  {
    icon: Eye,
    title: "Visibilité maximale",
    desc: "Vos annonces apparaissent en priorité dans les résultats de recherche",
  },
  {
    icon: TrendingUp,
    title: "Analyses prédictives",
    desc: "IA avancée pour prévoir les tendances des prix sur l'archipel",
  },
  {
    icon: Bell,
    title: "Alertes intelligentes",
    desc: "Notifications instantanées sur les changements de prix qui vous concernent",
  },
  {
    icon: MessageSquare,
    title: "Contact direct",
    desc: "Les utilisateurs peuvent vous contacter directement depuis vos annonces",
  },
  { icon: Search, title: "Boost IA", desc: "L'assistant UJAMAA recommande vos annonces aux utilisateurs pertinents" },
  {
    icon: BarChart3,
    title: "Rapports détaillés",
    desc: "Statistiques de performance de vos annonces et tendances du marché",
  },
  { icon: FileText, title: "Annonces illimitées", desc: "Publiez autant d'annonces que nécessaire sans restriction" },
  {
    icon: Lock,
    title: "Badge vérifié",
    desc: "Gagnez la confiance des utilisateurs avec le badge ✅ sur votre profil",
  },
];

export default function ProPage() {
  const [currentLanguage, setCurrentLanguage] = useState("fr");
  const { user } = useAuth();
  const { role } = useRole();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [paymentTab, setPaymentTab] = useState("manual");
  const [paymentRef, setPaymentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSelectPlan = (planId: string) => {
    if (planId === "basic") return;
    if (planId === "enterprise") {
      document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!user) {
      toast.error("Connectez-vous d'abord pour souscrire");
      navigate("/auth");
      return;
    }
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handleSubmitPayment = async (method: string) => {
    if (!user) return;
    if (method !== "card" && !paymentRef.trim()) {
      toast.error("Veuillez entrer la référence de paiement");
      return;
    }
    setSubmitting(true);
    try {
      const plan = PLANS.find((p) => p.id === selectedPlan);
      const { error } = await supabase.from("pro_subscription_requests" as any).insert({
        user_id: user.id,
        plan: selectedPlan,
        payment_method: method,
        payment_reference: method === "card" ? "CARD_PENDING" : paymentRef.trim(),
        amount: plan?.id === "premium" ? 5000 : 0,
        currency: "FC",
        status: "pending",
      });
      if (error) throw error;
      toast.success("Demande envoyée ! Vous recevrez une notification après validation par notre équipe.");
      setShowPayment(false);
      setPaymentRef("");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold text-sm">UJAMAA Pro</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">Débloquez tout le potentiel d'UJAMAA</h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Outils professionnels, visibilité maximale et données avancées pour réussir dans l'archipel des Comores
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all hover:shadow-lg ${plan.popular ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-border"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-md">⭐ Populaire</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-6">
                <div
                  className={`w-14 h-14 mx-auto rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-3`}
                >
                  <plan.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.currency && <span className="text-muted-foreground ml-1">{plan.currency}</span>}
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={plan.disabled}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Avantages Pro */}
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-8">Pourquoi passer au Pro ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRO_ADVANTAGES.map((adv, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 text-center">
                  <div className="w-11 h-11 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <adv.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{adv.title}</h3>
                  <p className="text-muted-foreground text-xs">{adv.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Enterprise */}
        <Card id="contact-section" className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Besoin d'une solution sur mesure ?
            </CardTitle>
            <CardDescription>Contactez-nous pour un devis personnalisé</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-muted-foreground text-sm">📧 contact@ujamaan.com</p>
            <p className="text-muted-foreground text-sm">📞 +269 77 12 34 56</p>
            <Button variant="outline" onClick={() => (window.location.href = "mailto:contact@ujamaan.com")}>
              Envoyer un email <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className={`${isMobile ? "max-w-[95vw]" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Souscrire au {selectedPlanData?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedPlanData?.price} {selectedPlanData?.currency}
              {selectedPlanData?.period}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={paymentTab} onValueChange={setPaymentTab} className="mt-2">
            <TabsList className={`grid w-full ${isMobile ? "grid-cols-3" : "grid-cols-3"}`}>
              <TabsTrigger value="manual" className="text-xs sm:text-sm">
                <Banknote className="w-3.5 h-3.5 mr-1" /> Manuel
              </TabsTrigger>
              {isMobile && (
                <TabsTrigger value="mvola" className="text-xs sm:text-sm">
                  <Smartphone className="w-3.5 h-3.5 mr-1" /> Mvola
                </TabsTrigger>
              )}
              {!isMobile && (
                <TabsTrigger value="mvola" disabled className="text-xs sm:text-sm opacity-50">
                  <Smartphone className="w-3.5 h-3.5 mr-1" /> Mvola
                  <span className="text-[10px] ml-1">(mobile)</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="card" className="text-xs sm:text-sm">
                <CreditCard className="w-3.5 h-3.5 mr-1" /> Carte
              </TabsTrigger>
            </TabsList>

            {/* Paiement Manuel */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">📋 Instructions de paiement</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>Virement bancaire :</strong>
                    </p>
                    <p>🏦 Banque : BIC Comores</p>
                    <p>👤 Titulaire : UJAMAA SARL</p>
                    <p>📝 IBAN : KM46 00006 00001 0 0010061829 73</p>
                    <p className="border-t border-border pt-2 mt-2">
                      <strong>Ou espèces :</strong>
                    </p>
                    <p>📍 Moroni : ESPACE BEINNOV, Rond Point Yemenia, Rue des Douanes à 10 metres de la DRS</p>
                    <p>📍 Mutsamudu : Bientôt</p>
                    <p>📍 Fomboni : Bientôt</p>
                    <p className="text-xs mt-2">🕐 Lun-Sam 8h-17h</p>
                  </div>
                </CardContent>
              </Card>
              <div>
                <Label className="text-sm">Référence du paiement / N° de reçu *</Label>
                <Input
                  placeholder="Ex: REC-2026-001 ou numéro de transaction"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button className="w-full" onClick={() => handleSubmitPayment("manual")} disabled={submitting}>
                {submitting ? "Envoi..." : "Soumettre pour validation"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                ⏱️ Validation sous 24h par notre équipe de modération
              </p>
            </TabsContent>

            {/* Mvola USSD - Mobile only */}
            <TabsContent value="mvola" className="space-y-4 mt-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">📱 Paiement Mvola (USSD)</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Composez directement depuis votre téléphone :</p>
                    <div className="bg-background rounded-lg p-3 text-center">
                      <a
                        href={`tel:*880*3*0773456789*${selectedPlanData?.id === "premium" ? "5000" : "0"}%23`}
                        className="text-lg font-mono font-bold text-primary"
                      >
                        *444*1*2*4102122*5000*ujamaan#
                      </a>
                      <p className="text-xs text-muted-foreground mt-1">Appuyez pour composer</p>
                    </div>
                    <div className="border-t border-border pt-2 space-y-1">
                      <p>1️⃣ Composez le code USSD ci-dessus</p>
                      <p>2️⃣ Confirmez avec votre code PIN Mvola</p>
                      <p>3️⃣ Notez le numéro de transaction</p>
                      <p>4️⃣ Entrez-le ci-dessous</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div>
                <Label className="text-sm">N° de transaction Mvola *</Label>
                <Input
                  placeholder="Ex: MP240305.1234.A56789"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button className="w-full" onClick={() => handleSubmitPayment("mvola")} disabled={submitting}>
                {submitting ? "Envoi..." : "Confirmer le paiement Mvola"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                ⏱️ Validation sous 12h après vérification de la transaction
              </p>
            </TabsContent>

            {/* Carte bancaire */}
            <TabsContent value="card" className="space-y-4 mt-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center space-y-3">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h4 className="font-semibold text-sm text-foreground">Paiement par carte bancaire</h4>
                  <p className="text-sm text-muted-foreground">
                    Le paiement par carte sera bientôt disponible via Stripe. En attendant, utilisez le paiement manuel
                    ou Mvola.
                  </p>
                </CardContent>
              </Card>
              <Button className="w-full" disabled variant="outline">
                <Lock className="w-4 h-4 mr-2" /> Bientôt disponible
              </Button>
            </TabsContent>
          </Tabs>

          <div className="bg-accent/50 rounded-lg p-3 mt-2">
            <p className="text-xs text-muted-foreground">
              🔒 Votre paiement sera vérifié par notre équipe. Votre compte sera mis à jour automatiquement après
              validation. En cas de problème : <strong>support@ujamaan.com</strong>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
