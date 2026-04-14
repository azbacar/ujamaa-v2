import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Zap,
  Star,
  Shield,
  TrendingUp,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Eye,
  MessageSquare,
  Bell,
  Search,
  FileText,
  Lock,
  Tag,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import MvolaPaymentDialog from "@/components/MvolaPaymentDialog";
import { Input } from "@/components/ui/input";

const PLANS = [
  {
    id: "basic",
    name: "Gratuit",
    price: "0",
    amount: 0,
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
    price: "4 875",
    amount: 4875,
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
    amount: 0,
    currency: "",
    period: "",
    description: "Solutions complètes pour organisations",
    features: [
      "Tout le plan Pro inclus",
      "CRM intégré (clients, factures, comptabilité)",
      "Intégration système personnalisée",
      "Tableau de bord dédié",
      "Formation équipe complète",
      "Consultant dédié",
      "SLA garanti 99.9%",
      "Support prioritaire VIP",
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

function generateUserRef(userId: string): string {
  return ("UJA" + userId.replace(/-/g, "").slice(0, 12)).toUpperCase();
}

export default function ProPage() {
  const [currentLanguage, setCurrentLanguage] = useState("fr");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount_type: string; discount_value: number } | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) { toast.error('Code promo invalide ou expiré'); setAppliedPromo(null); return; }

      const promo = data as any;
      if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
        toast.error('Ce code promo a expiré'); setAppliedPromo(null); return;
      }
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        toast.error('Ce code promo a atteint son nombre maximum d\'utilisations'); setAppliedPromo(null); return;
      }
      if (!promo.applicable_plans.includes(selectedPlan)) {
        toast.error('Ce code ne s\'applique pas à ce plan'); setAppliedPromo(null); return;
      }

      setAppliedPromo({ code: promo.code, discount_type: promo.discount_type, discount_value: promo.discount_value });
      toast.success(`Code "${promo.code}" appliqué ! ${promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-${promo.discount_value.toLocaleString()} FC`}`);
    } catch {
      toast.error('Erreur lors de la vérification');
    } finally {
      setCheckingPromo(false);
    }
  };

  const getDiscountedAmount = (baseAmount: number) => {
    if (!appliedPromo) return baseAmount;
    if (appliedPromo.discount_type === 'percentage') {
      return Math.max(0, baseAmount - (baseAmount * appliedPromo.discount_value / 100));
    }
    return Math.max(0, baseAmount - appliedPromo.discount_value);
  };

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

  const handlePaymentSubmit = async (method: "mvola" | "cash" | "card", reference: string) => {
    if (!user) return;
    const plan = PLANS.find((p) => p.id === selectedPlan);
    const baseAmount = plan?.amount || 0;
    const finalAmount = getDiscountedAmount(baseAmount);
    
    const { error } = await supabase.from("pro_subscription_requests" as any).insert({
      user_id: user.id,
      plan: selectedPlan,
      payment_method: method,
      payment_reference: reference,
      amount: baseAmount,
      currency: "FC",
      status: "pending",
      promo_code: appliedPromo?.code || null,
      discount_amount: baseAmount - finalAmount,
      final_amount: finalAmount,
    });
    if (error) throw error;

    // Increment promo code usage
    if (appliedPromo) {
      await supabase.from('promo_codes').update({ current_uses: (appliedPromo as any).current_uses + 1 } as any).eq('code', appliedPromo.code).then(() => {});
    }

    toast.success("Demande envoyée ! Vous recevrez une notification après validation.");
  };

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan);
  const userRef = user ? generateUserRef(user.id) : "UJAMAAN";

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

        {/* Promo Code Section */}
        <Card className="max-w-md mx-auto mb-16">
          <CardContent className="p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" /> Vous avez un code promo ?
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Entrez votre code"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                className="font-mono flex-1"
              />
              <Button onClick={handleApplyPromo} disabled={checkingPromo} variant="outline">
                {checkingPromo ? '...' : 'Appliquer'}
              </Button>
            </div>
            {appliedPromo && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Code "{appliedPromo.code}" appliqué : {appliedPromo.discount_type === 'percentage' ? `-${appliedPromo.discount_value}%` : `-${appliedPromo.discount_value.toLocaleString()} FC`}
              </div>
            )}
          </CardContent>
        </Card>

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
            <p className="text-muted-foreground text-sm">📧 support@azzhy.com</p>
            <p className="text-muted-foreground text-sm">📞 +269 733 2122</p>
            <Button variant="outline" onClick={() => (window.location.href = "mailto:contact@ujamaan.com")}>
              Envoyer un email <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Payment Dialog */}
      {selectedPlanData && (
        <MvolaPaymentDialog
          open={showPayment}
          onOpenChange={setShowPayment}
          amount={selectedPlanData.amount}
          currency="FC"
          label={`Souscrire au ${selectedPlanData.name}`}
          description={`${selectedPlanData.price} ${selectedPlanData.currency}${selectedPlanData.period}`}
          userRef={userRef}
          onPaymentSubmit={handlePaymentSubmit}
        />
      )}

      <Footer />
    </div>
  );
}
