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
  Smartphone,
  Phone,
  QrCode,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import MvolaPaymentDialog from "@/components/MvolaPaymentDialog";
import { Input } from "@/components/ui/input";
import { authPath, proPath } from '@/lib/authRedirect';

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
    // Le prix affiché est dynamique (mensuel/annuel) — voir billingCycle ci-dessous
    price: "990",
    amount: 990,
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

// Tarification Pro : 990 FC/mois, ou 990 × 12 × 0,90 = 10 692 FC/an (-10%)
const PRO_MONTHLY_AMOUNT = 990;
const PRO_YEARLY_AMOUNT = Math.round(PRO_MONTHLY_AMOUNT * 12 * 0.9); // 10 692
const PRO_YEARLY_SAVINGS = PRO_MONTHLY_AMOUNT * 12 - PRO_YEARLY_AMOUNT; // 1 188

export default function ProPage() {
  const [currentLanguage, setCurrentLanguage] = useState("fr");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount_type: string; discount_value: number } | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    try {
      const planId = selectedPlan === 'premium'
        ? (billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly')
        : selectedPlan;
      const { data, error } = await supabase.rpc('validate_promo_code' as any, {
        _code: promoCode.toUpperCase().trim(),
        _plan: planId,
      });

      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!row || !row.valid) {
        toast.error(row?.message || 'Code promo invalide ou expiré');
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo({ code: row.code, discount_type: row.discount_type, discount_value: Number(row.discount_value) });
      toast.success(`Code "${row.code}" appliqué ! ${row.discount_type === 'percentage' ? `-${row.discount_value}%` : `-${Number(row.discount_value).toLocaleString()} FC`}`);
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
      navigate(authPath());
      return;
    }
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  // Montant de base du plan sélectionné en tenant compte du cycle (mois/année)
  const getPlanBaseAmount = (planId: string) => {
    if (planId !== "premium") return PLANS.find((p) => p.id === planId)?.amount || 0;
    return billingCycle === "yearly" ? PRO_YEARLY_AMOUNT : PRO_MONTHLY_AMOUNT;
  };

  // Identifiant de plan envoyé à la BDD (pro_monthly | pro_yearly | basic | enterprise)
  const getPlanDbId = (planId: string) => {
    if (planId !== "premium") return planId;
    return billingCycle === "yearly" ? "pro_yearly" : "pro_monthly";
  };

  const handlePaymentSubmit = async (method: "mvola" | "cash" | "card", reference: string) => {
    if (!user) return;
    const baseAmount = getPlanBaseAmount(selectedPlan);
    const finalAmount = getDiscountedAmount(baseAmount);

    const { error } = await supabase.from("pro_subscription_requests" as any).insert({
      user_id: user.id,
      plan: getPlanDbId(selectedPlan),
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

    // Increment promo code usage via secure RPC
    if (appliedPromo) {
      await supabase.rpc('increment_promo_code_usage' as any, { _code: appliedPromo.code });
    }

    toast.success("Demande envoyée ! Vous recevrez une notification après validation.");
  };

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan);
  const userRef = user ? generateUserRef(user.id) : "UJAMAAN";
  const proDisplayPrice = billingCycle === "yearly" ? PRO_YEARLY_AMOUNT : PRO_MONTHLY_AMOUNT;
  const proDisplayPeriod = billingCycle === "yearly" ? "/an" : "/mois";

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

        {/* Sélecteur cycle de facturation (mois / année -10%) */}
        <div className="flex justify-center mb-8">
          <div
            role="tablist"
            aria-label="Cycle de facturation"
            className="inline-flex items-center bg-muted rounded-full p-1 shadow-sm"
          >
            <button
              type="button"
              role="tab"
              aria-selected={billingCycle === "monthly"}
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billingCycle === "yearly"}
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel
              <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0">−10 %</Badge>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => {
            const isPro = plan.id === "premium";
            const displayPrice = isPro ? proDisplayPrice.toLocaleString("fr-FR") : plan.price;
            const displayPeriod = isPro ? proDisplayPeriod : plan.period;
            return (
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
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">{displayPrice}</span>
                    {plan.currency && <span className="text-muted-foreground ml-1">{plan.currency}</span>}
                    <span className="text-muted-foreground text-sm">{displayPeriod}</span>
                  </div>
                  {isPro && billingCycle === "yearly" && (
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      Économisez {PRO_YEARLY_SAVINGS.toLocaleString("fr-FR")} FC / an
                    </p>
                  )}
                  {isPro && billingCycle === "monthly" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ou {PRO_YEARLY_AMOUNT.toLocaleString("fr-FR")} FC/an (−10 %)
                    </p>
                  )}
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
            );
          })}
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

        {/* Comment payer avec Mvola ? */}
        <Card className="max-w-4xl mx-auto mb-16 border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-ocean-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Smartphone className="w-6 h-6" /> Comment payer avec Mvola ?
            </CardTitle>
            <CardDescription>
              Mvola est le service de paiement mobile de Telma Madagascar, accepté partout aux Comores via les agents partenaires.
              Aucun compte bancaire n'est nécessaire.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">1</span>
                  <h4 className="font-semibold text-foreground">Choisissez votre plan</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez Pro mensuel (990 FC) ou annuel (10 692 FC, soit −10 %), puis cliquez sur <em>Passer au Pro</em>.
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">2</span>
                  <h4 className="font-semibold text-foreground flex items-center gap-1"><Phone className="w-4 h-4" /> Sur mobile</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Le bouton <strong>Composer le code USSD</strong> ouvre directement votre clavier avec :
                  <code className="block mt-1 bg-muted px-2 py-1 rounded text-xs font-mono">
                    *444*1*2*4102122*MONTANT*VOTRE-REF#
                  </code>
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">3</span>
                  <h4 className="font-semibold text-foreground flex items-center gap-1"><QrCode className="w-4 h-4" /> Sur ordinateur</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Un <strong>QR code dynamique</strong> s'affiche : scannez-le avec votre téléphone pour ouvrir automatiquement le code USSD pré-rempli.
                </p>
              </div>
            </div>

            <div className="bg-white/80 rounded-xl p-4 border border-emerald-100">
              <h4 className="font-semibold text-foreground mb-2">📋 Détails importants</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                <li><strong>Numéro marchand Ujamaan</strong> : <code className="bg-muted px-1.5 py-0.5 rounded font-mono">4102122</code></li>
                <li><strong>Référence personnelle</strong> : générée automatiquement (commence par <code>UJA…</code>) — ne la modifiez pas, elle permet de retrouver votre paiement.</li>
                <li><strong>Confirmation</strong> : après le paiement, vous recevez un SMS Mvola avec un <strong>numéro de référence</strong>. Collez-le dans le champ <em>Référence Mvola</em> et validez.</li>
                <li><strong>Activation</strong> : un administrateur valide votre paiement (généralement sous <strong>24 h</strong>). Vous recevez ensuite une notification dans l'app dès l'activation du compte Pro.</li>
                <li><strong>Pas de Mvola ?</strong> Vous pouvez payer en <strong>espèces</strong> auprès d'un partenaire Ujamaan, ou par <strong>carte bancaire</strong> via Stripe (à venir).</li>
              </ul>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-1">
              Besoin d'aide ? Contactez le support : <a href="mailto:support@azzhy.com" className="text-emerald-700 underline">support@azzhy.com</a> · 📞 +269 733 2122
            </div>
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
      {selectedPlanData && (() => {
        const baseAmount = getPlanBaseAmount(selectedPlan);
        const finalAmount = getDiscountedAmount(baseAmount);
        const cycleLabel = selectedPlan === "premium"
          ? (billingCycle === "yearly" ? "Pro annuel" : "Pro mensuel")
          : selectedPlanData.name;
        const periodLabel = selectedPlan === "premium" ? proDisplayPeriod : selectedPlanData.period;
        return (
          <MvolaPaymentDialog
            open={showPayment}
            onOpenChange={setShowPayment}
            amount={finalAmount}
            currency="FC"
            label={`Souscrire au ${cycleLabel}`}
            description={appliedPromo
              ? `${baseAmount.toLocaleString("fr-FR")} FC${periodLabel} → ${finalAmount.toLocaleString("fr-FR")} FC (promo ${appliedPromo.code})`
              : `${baseAmount.toLocaleString("fr-FR")} FC${periodLabel}`}
            userRef={userRef}
            onPaymentSubmit={handlePaymentSubmit}
          />
        );
      })()}

      <Footer />
    </div>
  );
}
