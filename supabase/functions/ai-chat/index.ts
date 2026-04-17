import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getDynamicSiteData(authHeader: string | null) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : {},
  });

  try {
    const [pricesRes, eventsRes, announcementsRes, freelancersRes, diasporaRes, taxiRes, pharmacyRes] = await Promise.all([
      supabase.from('prices').select('id, product, price, unit, island, category, currency, market, city, vendor, trend, created_at, village, region').eq('status', 'published').order('created_at', { ascending: false }).limit(200),
      supabase.from('events').select('id, title, description, date, end_date, location, island, category, price, currency').gte('date', new Date().toISOString()).order('date', { ascending: true }).limit(20),
      supabase.from('content_items').select('id, title, description, category, type').eq('status', 'published').order('published_at', { ascending: false }).limit(20),
      supabase.from('freelancer_profiles').select('id, display_name, skills, island, hourly_rate_min, hourly_rate_max, currency, experience_years, is_available, location').eq('is_visible', true).eq('is_available', true).limit(30),
      supabase.from('diaspora_projects').select('id, title, description, category, target_amount, current_amount, currency, island, location, min_investment, deadline').eq('status', 'published').order('created_at', { ascending: false }).limit(20),
      supabase.from('taxi_fares').select('id, from_location, to_location, island, price, currency, vehicle_type, notes').eq('is_active', true).order('island').limit(100),
      supabase.from('pharmacy_guards').select('id, name, address, phone, island, city, is_on_duty, duty_start, duty_end, notes').eq('is_active', true).order('island').limit(50),
    ]);

    return {
      prices: pricesRes.data || [],
      events: eventsRes.data || [],
      announcements: announcementsRes.data || [],
      freelancers: freelancersRes.data || [],
      diasporaProjects: diasporaRes.data || [],
      taxiFares: taxiRes.data || [],
      pharmacies: pharmacyRes.data || [],
    };
  } catch (error) {
    console.error('Error fetching dynamic data:', error);
    return { prices: [], events: [], announcements: [], freelancers: [], diasporaProjects: [], taxiFares: [], pharmacies: [] };
  }
}

async function getKnowledgeSources() {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  const { data } = await supabase
    .from('ai_knowledge_sources')
    .select('name, url, description')
    .eq('is_active', true);
  
  return data || [];
}

async function getConversationHistory(sessionId: string, authHeader: string | null) {
  if (!authHeader) return [];
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20);

  return (data || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

const comorosKnowledge = `
INFORMATIONS SUR L'ARCHIPEL DES COMORES:

🇰🇲 L'archipel des Comores est composé de 4 îles sœurs indissociables: Grande Comore (Ngazidja), Anjouan (Ndzuwani), Mohéli (Mwali) et Mayotte (Maore).
- Ces quatre îles forment UN SEUL archipel avec une histoire, une culture et une identité COMMUNES. Il n'y a AUCUNE distinction à faire entre elles.
- Capitale: Moroni (Grande Comore)
- Langues: Comorien (shikomori/shimaoré), Arabe, Français
- Monnaie: KMF (Ngazidja, Ndzuwani, Mwali), EUR (Maore)
- Culture commune: Islam, Grand Mariage, twarab, m'godro, pilao, mataba
- Économie: Agriculture (ylang-ylang, vanille, girofle), pêche, tourisme
- IMPORTANT: Ne JAMAIS séparer ou distinguer Mayotte des autres îles. Mayotte fait partie intégrante de l'archipel des Comores. Dire toujours "l'archipel des Comores" ou "les quatre îles" et non "les Comores et Mayotte".
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, searchQuery, clientHistory } = await req.json();

    if (!message || typeof message !== 'string') throw new Error('Message is required');
    if (!sessionId || typeof sessionId !== 'string') throw new Error('Session ID is required');
    if (message.length > 1000) throw new Error('Message too long');

    const sanitizedMessage = message.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const authHeader = req.headers.get('Authorization');
    let user = null;
    if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }

    // Fetch all data in parallel
    const [dynamicData, knowledgeSources, dbHistory] = await Promise.all([
      getDynamicSiteData(authHeader),
      getKnowledgeSources(),
      getConversationHistory(sessionId, authHeader),
    ]);

    // Use DB history for logged-in users, client-sent history for guests
    const history = dbHistory.length > 0 
      ? dbHistory 
      : (Array.isArray(clientHistory) ? clientHistory.slice(-20).map((m: any) => ({ role: m.role || (m.isUser ? 'user' : 'assistant'), content: m.content || m.text })).filter((m: any) => m.content) : []);

    // Build dynamic content section with IDs for direct linking
    let dynamicContent = '\n\n📊 DONNÉES ACTUELLES DE LA PLATEFORME UJAMAAN.COM:\n\n';
    
    if (dynamicData.prices.length > 0) {
      dynamicContent += `💰 PRIX PUBLIÉS (${dynamicData.prices.length} produits au total):\n`;
      dynamicData.prices.forEach(p => {
        const date = p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '';
        const trend = p.trend && p.trend !== 'stable' ? ` [${p.trend === 'up' ? '📈 hausse' : '📉 baisse'}]` : '';
        const location = [p.village, p.city, p.region].filter(Boolean).join(', ');
        dynamicContent += `- [ID:${p.id}] ${p.product}: ${p.price} ${p.currency || 'FC'}/${p.unit} — ${p.island}, ${location} (${p.market || ''}, vendeur: ${p.vendor || 'n/a'}, catégorie: ${p.category})${trend}${date ? ' — ' + date : ''}\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.events.length > 0) {
      dynamicContent += '🎉 ÉVÉNEMENTS À VENIR:\n';
      dynamicData.events.slice(0, 10).forEach(e => {
        const price = e.price && e.price > 0 ? ` — ${e.price} ${e.currency || 'FC'}` : ' — Gratuit';
        dynamicContent += `- [ID:${e.id}] ${e.title} - ${new Date(e.date).toLocaleDateString('fr-FR')} à ${e.location} (${e.island}) [${e.category}]${price}\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.announcements.length > 0) {
      dynamicContent += '📢 ANNONCES RÉCENTES:\n';
      dynamicData.announcements.slice(0, 8).forEach(a => {
        dynamicContent += `- [ID:${a.id}] ${a.title} (${a.category || a.type || 'général'})\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.freelancers && dynamicData.freelancers.length > 0) {
      dynamicContent += '👨‍💻 FREELANCERS DISPONIBLES:\n';
      dynamicData.freelancers.slice(0, 15).forEach((f: any) => {
        const skills = (f.skills || []).slice(0, 5).join(', ');
        const rate = f.hourly_rate_min ? `${f.hourly_rate_min}${f.hourly_rate_max ? '-' + f.hourly_rate_max : '+'} ${f.currency}/h` : '';
        dynamicContent += `- [ID:${f.id}] ${f.display_name} (${skills})${f.island ? ' - ' + f.island : ''}${f.location ? ', ' + f.location : ''}${rate ? ' - ' + rate : ''}${f.experience_years ? ' - ' + f.experience_years + ' ans exp.' : ''}\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.diasporaProjects && dynamicData.diasporaProjects.length > 0) {
      dynamicContent += '🌍 PROJETS D\'INVESTISSEMENT DIASPORA:\n';
      dynamicData.diasporaProjects.forEach((p: any) => {
        const progress = p.target_amount > 0 ? Math.round((p.current_amount / p.target_amount) * 100) : 0;
        const deadline = p.deadline ? new Date(p.deadline).toLocaleDateString('fr-FR') : '';
        dynamicContent += `- [ID:${p.id}] ${p.title} (${p.category}) - Objectif: ${p.target_amount} ${p.currency} - ${progress}% financé${p.island ? ' - ' + p.island : ''}${p.min_investment ? ' - Min: ' + p.min_investment + ' ' + p.currency : ''}${deadline ? ' - Échéance: ' + deadline : ''}\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.taxiFares && dynamicData.taxiFares.length > 0) {
      dynamicContent += '🚕 TARIFS DE TAXI:\n';
      dynamicData.taxiFares.forEach((t: any) => {
        dynamicContent += `- ${t.from_location} → ${t.to_location} (${t.island}): ${t.price} ${t.currency || 'FC'} [${t.vehicle_type}]${t.notes ? ' — ' + t.notes : ''}\n`;
      });
      dynamicContent += 'Lien: [Voir tous les tarifs taxi](/infos-pratiques)\n\n';
    }

    if (dynamicData.pharmacies && dynamicData.pharmacies.length > 0) {
      dynamicContent += '💊 PHARMACIES DE GARDE:\n';
      const onDuty = dynamicData.pharmacies.filter((p: any) => p.is_on_duty);
      const offDuty = dynamicData.pharmacies.filter((p: any) => !p.is_on_duty);
      if (onDuty.length > 0) {
        dynamicContent += 'Actuellement de garde:\n';
        onDuty.forEach((p: any) => {
          const dutyEnd = p.duty_end ? ' (jusqu\'au ' + new Date(p.duty_end).toLocaleDateString('fr-FR') + ')' : '';
          dynamicContent += `- 🟢 ${p.name}${p.city ? ' — ' + p.city : ''} (${p.island})${p.phone ? ' — Tél: ' + p.phone : ''}${p.address ? ' — ' + p.address : ''}${dutyEnd}\n`;
        });
      }
      if (offDuty.length > 0) {
        dynamicContent += `Autres pharmacies (${offDuty.length}):\n`;
        offDuty.slice(0, 10).forEach((p: any) => {
          dynamicContent += `- ${p.name}${p.city ? ' — ' + p.city : ''} (${p.island})${p.phone ? ' — Tél: ' + p.phone : ''}\n`;
        });
      }
      dynamicContent += 'Lien: [Voir toutes les pharmacies](/infos-pratiques)\n\n';
    }

    // Build knowledge sources section
    let knowledgeSection = '';
    if (knowledgeSources.length > 0) {
      knowledgeSection = '\n\n📚 SOURCES DE RÉFÉRENCE AUTORISÉES:\n';
      knowledgeSection += 'Tu peux citer ces sources PAR LEUR NOM quand pertinent, mais tu ne dois JAMAIS afficher leur URL.\n';
      knowledgeSources.forEach(s => {
        knowledgeSection += `- "${s.name}" (${s.description || 'source générale'})\n`;
      });
      knowledgeSection += '\nQuand tu cites une source, écris par exemple: "Selon [Nom de la source]..." sans jamais montrer le lien.\n';
    }

    const systemPrompt = `Tu es UJAMAA AI, l'assistant intelligent officiel de la plateforme ujamaan.com pour l'archipel des Comores (4 îles).

${comorosKnowledge}
${dynamicContent}
${knowledgeSection}

🧠 CONTINUITÉ DE CONVERSATION (TRÈS IMPORTANT):
- Tu as accès à l'HISTORIQUE COMPLET de la conversation ci-dessous. UTILISE-LE pour comprendre le contexte.
- Si l'utilisateur dit "et le prix ?", "et là-bas ?", "donne-moi plus de détails", "et pour Anjouan ?", etc., tu DOIS comprendre qu'il fait référence au SUJET précédent.
- Ne réponds JAMAIS "De quoi parlez-vous ?" si le contexte est clair dans l'historique.
- Exemples de suivi logique :
  • Q1: "Quel est le prix du riz ?" → Q2: "Et à Anjouan ?" → Tu comprends qu'il parle du prix du riz à Anjouan.
  • Q1: "Y a-t-il des événements ce weekend ?" → Q2: "Lequel est gratuit ?" → Tu comprends qu'il parle des événements listés.
  • Q1: "Je cherche un plombier" → Q2: "Il est disponible ?" → Tu comprends qu'il parle du freelancer suggéré.
- Quand l'utilisateur revient sur un sujet abordé plus tôt, rappelle brièvement le contexte avant de répondre.

🔗 LIENS DIRECTS — TU DOIS IMPÉRATIVEMENT LIER VERS LES PRODUITS/CONTENUS SPÉCIFIQUES:

Quand tu mentionnes un produit, un événement, un freelancer ou un projet, tu DOIS inclure un lien DIRECT vers ce contenu en utilisant son ID:
- Prix/Produit → [Voir ce produit](/prix) ← lien vers la page prix avec le produit mentionné
- Événement → [Voir cet événement](/evenements/ID_EVENEMENT)
- Annonce → [Voir cette annonce](/annonces/ID_ANNONCE)  
- Freelancer → [Voir le profil](/freelancers) ← vers le répertoire
- Projet diaspora → [Voir ce projet](/investissement/ID_PROJET)

EXEMPLES DE RÉPONSES AVEC LIENS DIRECTS:
- "Le riz coûte 500 FC/kg au marché de Volo-Volo. [Voir tous les prix du riz](/prix)"
- "L'événement 'Festival du cinéma' a lieu le 15/04. [Voir les détails](/evenements/abc-123)"
- "Mohamed est disponible comme plombier à Moroni. [Voir le répertoire](/freelancers)"

PAGES INTERNES DU SITE:
- /prix → Prix et marchés 💰
- /evenements → Événements 🎉
- /evenements/:id → Détail d'un événement
- /services → Services publics 🏛️
- /appels-offres → Appels d'offres 📋
- /annonces → Annonces 📢
- /annonces/:id → Détail d'une annonce
- /tourisme → Tourisme 🏨
- /infos-pratiques → Infos Pratiques (tarifs taxi, pharmacies de garde) 📋
- /freelance → Missions freelance 💼
- /freelancers → Répertoire des freelancers 👨‍💻
- /investissement → Investissement Diaspora 🌍
- /investissement/:id → Détail d'un projet
- /pro → Forfaits Pro et Entreprise 👑
- /entreprise → Tableau de bord entreprise (CRM, factures, comptabilité) 🏢
- /profil → Mon profil utilisateur 👤
- /messages → Messagerie directe ✉️
- /auth → Inscription / Connexion 🔐
- /guide → Guide d'utilisation interactif 📚
- /tourisme → Restaurants, hôtels, gastronomie 🍽️

📱 GUIDE D'UTILISATION DE LA PLATEFORME UJAMAAN.COM:
Tu es aussi un GUIDE D'UTILISATION. Quand un utilisateur demande comment faire quelque chose sur ujamaan, tu dois l'aider étape par étape.

INSCRIPTION ET CONNEXION:
- Pour créer un compte: [S'inscrire](/auth) → Remplir email + mot de passe → Confirmer par email
- Pour se connecter: [Connexion](/auth) → Entrer ses identifiants
- Mot de passe oublié: lien "Mot de passe oublié" sur la page de connexion

PUBLIER DU CONTENU (requiert le rôle Annonceur):
- Les annonceurs peuvent publier : annonces, événements, prix, missions freelance, projets diaspora
- Toute publication commence en "brouillon" et doit être validée par un modérateur
- Pour devenir annonceur: contacter un administrateur ou passer au forfait Pro

FORFAIT PRO (5 000 FC/mois):
- Avantages: alertes prix en temps réel, historique complet, statistiques avancées, badge ✅ vérifié, boost IA, contact direct, support 24/7
- Paiement: via Mvola (code USSD *444*1*2*4102122*5000*référence#) ou dépôt cash
- [Voir les forfaits](/pro)

FORFAIT ENTREPRISE (sur devis):
- Tout le Pro + CRM intégré (clients, factures, comptabilité), intégration personnalisée, formation équipe, consultant dédié, SLA 99.9%
- Le CRM permet: gestion des clients, création de factures/devis, suivi comptable (recettes/dépenses)
- [En savoir plus](/pro) ou [Accéder à l'espace entreprise](/entreprise)

PAIEMENT PAR MVOLA:
- Format: *444*1*2*4102122*montant*référence#
- Sur mobile: appuyer sur "Payer" → le code s'inscrit directement dans le composeur
- Sur ordinateur: scanner le QR code avec son téléphone
- La référence est générée automatiquement (15 caractères max)

GÉOLOCALISATION DES PRODUITS:
- Les annonceurs Pro peuvent partager leur position GPS sur leurs annonces de prix
- Les utilisateurs peuvent voir l'emplacement exact du vendeur sur une carte
- Pour les marchands ambulants, la géolocalisation expire après un temps défini
- Pour les commerces fixes, la position reste permanente

MESSAGERIE DIRECTE:
- Accessible depuis [Messages](/messages) ou via le bouton "Contacter" sur les profils
- Permet d'échanger directement avec les annonceurs, freelancers et porteurs de projets

FREELANCE:
- Chercher un freelancer: [Répertoire](/freelancers) → Filtrer par compétence, île, tarif
- Publier une mission: [Missions](/freelance) → Créer une mission (requiert rôle annonceur)
- Postuler: ouvrir une mission → "Soumettre une proposition"

INVESTISSEMENT DIASPORA:
- Explorer les projets: [Investissement](/investissement)
- Investir: ouvrir un projet → "Investir" → Choisir le montant et le mode de paiement
- Publier un projet: requiert un profil de porteur de projet

APPLICATION MOBILE NATIVE:
- Une application mobile native est en cours de développement (iOS et Android)
- En attendant, ujamaan.com est entièrement responsive et fonctionne parfaitement sur mobile
- Les notifications par e-mail sont disponibles pour rester informé

TOURISME & GASTRONOMIE (/tourisme):
- Découvrez restaurants, hôtels, recettes traditionnelles et hébergements de l'archipel
- Les restaurants peuvent indiquer leur mode de service: sur place, à emporter, ou les deux
- Filtrer par île et catégorie

🚨 RÈGLES ABSOLUES:
1. Tu te bases EXCLUSIVEMENT sur les données de la plateforme ujamaan.com listées ci-dessus et les sources de référence autorisées. RIEN D'AUTRE.
2. Si une information N'EST PAS dans les données ci-dessus, tu dis clairement : "Cette information n'est pas encore disponible sur ujamaan.com" puis tu SUGGÈRES la page la plus pertinente pour que l'utilisateur explore lui-même.
3. N'INVENTE JAMAIS de prix, de noms, de dates, d'événements ou de freelancers. Utilise UNIQUEMENT les données fournies.
4. Les SEULS LIENS que tu donnes sont les chemins internes du site. JAMAIS d'URLs externes (pas de https://...).
5. Quand tu cites une source externe autorisée, mentionne-la par son NOM uniquement, SANS URL.
6. Tes liens internes doivent être au format markdown: [Titre du lien](/chemin) ou [Titre](/chemin/ID)
7. Mayotte est une île comorienne. Dis TOUJOURS "l'archipel des Comores" (4 îles). JAMAIS "les Comores et Mayotte".
8. Sois DIRECT, CONCIS avec des emojis. Max 5-6 phrases par réponse sauf si l'utilisateur demande un calcul détaillé, une analyse complète ou un tutoriel d'utilisation.
9. TOUJOURS inclure au moins un lien DIRECT vers un contenu spécifique quand tu en mentionnes un.
10. Ne réponds PAS aux questions sans rapport avec les Comores ou la plateforme. Redirige poliment.
11. Quand un utilisateur demande "comment faire X" sur la plateforme, donne un tutoriel étape par étape CLAIR avec des liens directs vers chaque page concernée.

🧮 CALCULS ET RAISONNEMENT AVANCÉ:
- Tu PEUX et DOIS faire des calculs détaillés quand l'utilisateur le demande (comparaisons de prix, moyennes, totaux, budgets, estimations, conversions).
- Montre le détail du calcul étape par étape pour être transparent.
- Compare les prix entre îles, marchés, vendeurs quand c'est pertinent.
- Si on te demande "combien coûte X kg de Y", multiplie le prix unitaire par la quantité demandée.
- Si on te demande une comparaison, présente un TABLEAU CLAIR avec les différences en markdown.
- Utilise les tendances (hausse/baisse/stable) pour contextualiser tes réponses.
- Tu sais faire: additions, multiplications, moyennes, pourcentages, conversions KMF↔EUR (1 EUR ≈ 492 KMF), estimations de budget.
- Si l'utilisateur demande un budget (ex: "budget pour un mariage", "coût de la vie"), fais un calcul détaillé basé sur les prix réels de la plateforme.
- Quand tu compares des produits similaires, présente-les sous forme de tableau markdown pour une lecture rapide.

📊 FORMAT DES RÉPONSES:
- Pour les listes de prix: utilise un tableau markdown quand il y a 3+ produits à comparer
- Pour les calculs: montre chaque étape
- Pour les recommandations: bullet points avec liens directs
- Pour les événements: date, lieu, prix, lien direct
- Pour les tutoriels: étapes numérotées avec liens à chaque étape

🤝 HONNÊTETÉ ET HUMANITÉ:
- Si tu ne trouves PAS l'information dans les données fournies, dis-le franchement : "Je n'ai pas encore cette information sur ujamaan.com 😊"
- Propose des PISTES CONCRÈTES : oriente vers la page interne la plus pertinente avec un lien direct.
- Ne JAMAIS inventer de données. Mieux vaut dire "je ne sais pas" que donner une fausse info.
- Ton amical et empathique. Parle comme un ami comorien serviable.
- Sois naturel et humain dans tes formulations, évite le ton robotique.
${searchQuery ? `\nL'utilisateur recherche: "${searchQuery}". Aide-le avec les données de la plateforme et donne des liens directs vers les résultats pertinents.` : ''}`;

    // Build messages array with history
    const aiMessages: Array<{role: string; content: string}> = [
      { role: 'system', content: systemPrompt },
    ];
    
    // Add full conversation history for continuity (last 20 messages)
    history.slice(-20).forEach(m => {
      aiMessages.push({ role: m.role, content: m.content });
    });
    
    aiMessages.push({ role: 'user', content: sanitizedMessage });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: aiMessages,
        temperature: 0.3,
        max_tokens: 2000,
        reasoning: { effort: 'medium' },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Service surchargé. Réessayez.', code: 'RATE_LIMIT' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'Crédit IA insuffisant.', code: 'PAYMENT_REQUIRED' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Store conversation for analytics
    try {
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
      await adminSupabase.from('ai_conversations').insert({
        user_id: user?.id || null,
        user_session: sessionId,
        user_message: sanitizedMessage,
        ai_response: aiResponse,
      });
    } catch (dbErr) {
      console.error('Failed to store conversation:', dbErr);
    }

    return new Response(JSON.stringify({ response: aiResponse, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat:', error);
    return new Response(JSON.stringify({ error: 'Erreur. Réessayez.', details: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
