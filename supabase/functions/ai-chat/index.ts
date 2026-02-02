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

// Fonction pour récupérer les données dynamiques du site
async function getDynamicSiteData(authHeader: string | null) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : {},
  });

  try {
    // Récupérer les prix récents
    const { data: prices } = await supabase
      .from('prices')
      .select('product, price, unit, island, category')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50);

    // Récupérer les événements à venir
    const { data: events } = await supabase
      .from('events')
      .select('title, description, date, end_date, location, island')
      .gte('end_date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(20);

    // Récupérer les annonces récentes
    const { data: announcements } = await supabase
      .from('content_items')
      .select('title, description, category')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);

    // Récupérer les appels d'offres actifs
    const { data: tenders } = await supabase
      .from('tenders')
      .select('title, description, deadline, budget_range, category')
      .gte('deadline', new Date().toISOString())
      .eq('status', 'active')
      .order('deadline', { ascending: true })
      .limit(10);

    return {
      prices: prices || [],
      events: events || [],
      announcements: announcements || [],
      tenders: tenders || []
    };
  } catch (error) {
    console.error('Error fetching dynamic data:', error);
    return { prices: [], events: [], announcements: [], tenders: [] };
  }
}

// Informations de base sur l'ARCHIPEL DES COMORES (les 4 îles)
const comorosKnowledge = `
INFORMATIONS COMPLÈTES SUR L'ARCHIPEL DES COMORES:

🇰🇲 L'ARCHIPEL DES COMORES - UNE SEULE ENTITÉ GÉOGRAPHIQUE ET CULTURELLE:
L'archipel des Comores est composé de QUATRE ÎLES sœurs: Grande Comore (Ngazidja), Anjouan (Ndzuwani), Mohéli (Mwali) et Mayotte (Maore).
Ces quatre îles partagent la même histoire, la même culture, les mêmes traditions et la même langue (shikomori/shimaoré).
MAYOTTE EST UNE ÎLE COMORIENNE au même titre que les trois autres îles.

- Capitale historique de l'archipel: Moroni (Grande Comore/Ngazidja)
- Langues communes: Comorien (shikomori/shimaoré), Arabe, Français
- Les 4 îles: Grande Comore (Ngazidja), Anjouan (Ndzuwani), Mohéli (Mwali), Mayotte (Maore)
- Population totale de l'archipel: ~1,160,000 habitants sur les 4 îles
- Culture unifiée: Islam, traditions comoriennes, danse, musique (twarab, m'godro)
- Économie commune: Agriculture (ylang-ylang, vanille, girofle), pêche, tourisme

🏔️ GRANDE COMORE (NGAZIDJA):
- Capitale: Moroni (120,000 hab.)
- Volcan actif: Karthala (2361m) - dernière éruption 2007
- Population: ~400,000 habitants
- Villes principales: Moroni, Mitsamiouli, Foumbouni
- Monnaie: Franc comorien (KMF)
- Économie: Agriculture (ylang-ylang, vanille), pêche, services publics
- Aéroport: Prince Saïd Ibrahim International

🌺 ANJOUAN (NDZUWANI):
- Capitale: Mutsamudu (23,000 hab.)
- Surnommée "l'île aux parfums" et "perle des Comores"
- Population: ~350,000 habitants
- Relief montagneux culminant à 1595m (mont Ntingui)
- Monnaie: Franc comorien (KMF)
- Spécialités: Ylang-ylang (1ère production mondiale), girofle, vanille
- Villes: Mutsamudu, Domoni, Ouani, Sima

🐢 MOHÉLI (MWALI):
- Capitale: Fomboni (9,000 hab.)
- Plus petite île habitée de l'archipel (290 km²)
- Population: ~50,000 habitants
- Monnaie: Franc comorien (KMF)
- Parc marin national (première réserve des Comores)
- Réserve de biosphère UNESCO depuis 2021
- Activités: Écotourisme, pêche durable, agriculture biologique

🏝️ MAYOTTE (MAORE) - ÎLE COMORIENNE AU LAGON:
- Préfecture: Mamoudzou (71,000 hab.)
- Quatrième île de l'archipel des Comores
- Population: ~310,000 habitants (croissance rapide +3,8%/an)
- Superficie: 374 km²
- Monnaie: Euro (EUR) - statut administratif français depuis 2011
- Langues: Shimaoré (dialecte comorien), Français
- Culture: Traditions comoriennes identiques aux autres îles (Grand Mariage, musique, gastronomie)
- Particularité: Bien que sous administration française, Mayotte reste culturellement et historiquement comorienne

📊 ÉCONOMIE DE L'ARCHIPEL:

Sur les 3 îles (Grande Comore, Anjouan, Mohéli):
- PIB/habitant: ~1,500$
- Secteurs: Agriculture, pêche, commerce
- Monnaie: Franc comorien (KMF)

Sur Mayotte:
- PIB/habitant: ~10,000€ (contexte administratif français)
- Secteur public: 24% des emplois
- Taux de chômage: ~35% (jeunes: 60%)
- Monnaie: Euro (EUR)

Agriculture commune à toutes les îles: Vanille, ylang-ylang, girofle, cannelle, bananes
Pêche: Thon, espadon, poissons lagonaires
Tourisme: En développement sur toutes les îles

🏥 SERVICES PUBLICS:

Comores (Grande Comore, Anjouan, Mohéli):
- Système de santé comorien
- Éducation publique comorienne
- Services administratifs comoriens

Mayotte (contexte administratif français):
- Système de santé français (CHM, dispensaires)
- Éducation française gratuite 3-16 ans
- Allocations familiales et RSA
- Sécurité sociale

🚢 TRANSPORT INTER-ÎLES:
- Moroni ↔ Anjouan: 15,000-25,000 KMF
- Moroni ↔ Mohéli: 12,000-20,000 KMF  
- Anjouan ↔ Mohéli: 10,000-18,000 KMF
- Liaison vers Mayotte: 50,000-80,000 KMF (ou équivalent en euros)
- Vols domestiques: 35,000-60,000 KMF

🎭 CULTURE ET FESTIVITÉS COMMUNES AUX 4 ÎLES:
- Grand Mariage (Ada/Harusi) - tradition majeure sur TOUTES les îles
- Ramadan et fêtes islamiques
- Maulid (anniversaire du Prophète)
- Festivals de musique: Twarab, M'godro
- Artisanat commun: Vannerie, sculpture, bijoux
- Gastronomie commune: Pilao, mataba, langouste grillée

🏛️ DÉMARCHES ADMINISTRATIVES:

Comores (Grande Comore, Anjouan, Mohéli):
- Passeport comorien: 25,000 KMF (délai 15-30 jours)
- Carte d'identité: 5,000 KMF
- Permis de conduire: 15,000 KMF
- Acte de naissance: 2,000 KMF

Mayotte (administration française):
- Passeport français: 86€
- Carte d'identité: Gratuite
- Permis de conduire: 35€
- Titre de séjour: 225€

📱 CONTACTS UTILES:
- Urgences Comores: 17 (police), 18 (pompiers)
- Urgences Mayotte: 15 (SAMU), 17 (police), 18 (pompiers)
- Préfecture Mayotte: +262 269 61 12 34
- Mairie Moroni: +269 73 30 94
- CHM Mayotte: +262 269 61 80 00

🌴 CLIMAT IDENTIQUE SUR LES 4 ÎLES:
- Saison chaude/humide: Novembre-Avril (cyclones possibles)
- Saison fraîche/sèche: Mai-Octobre  
- Températures: 24-30°C toute l'année
- Précipitations: 1000-3000mm selon altitude et exposition
`;

serve(async (req) => {
  console.log('AI Chat function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, searchQuery } = await req.json();
    console.log('Received request:', { message, sessionId, searchQuery });

    // Input validation
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID is required and must be a string');
    }

    // Rate limiting - basic validation
    if (message.length > 1000) {
      throw new Error('Message too long (max 1000 characters)');
    }

    // Basic sanitization
    const sanitizedMessage = message.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Optionally get authenticated user if available
    const authHeader = req.headers.get('Authorization');
    let user = null;

    if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }

    // Récupérer les données dynamiques du site
    const dynamicData = await getDynamicSiteData(authHeader);

    // Construire la section des données dynamiques
    let dynamicContent = '\n\n📊 DONNÉES ACTUELLES DU SITE UJAMAAN.COM:\n\n';
    
    if (dynamicData.prices.length > 0) {
      dynamicContent += '💰 PRIX RÉCENTS:\n';
      dynamicData.prices.slice(0, 15).forEach(price => {
        dynamicContent += `- ${price.product}: ${price.price} ${price.unit} (${price.island})\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.events.length > 0) {
      dynamicContent += '🎉 ÉVÉNEMENTS À VENIR:\n';
      dynamicData.events.slice(0, 10).forEach(event => {
        const date = new Date(event.date).toLocaleDateString('fr-FR');
        dynamicContent += `- ${event.title} - ${date} à ${event.location} (${event.island})\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.announcements.length > 0) {
      dynamicContent += '📢 ANNONCES RÉCENTES:\n';
      dynamicData.announcements.slice(0, 8).forEach(announcement => {
        dynamicContent += `- ${announcement.title}\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.tenders.length > 0) {
      dynamicContent += '📋 APPELS D\'OFFRES ACTIFS:\n';
      dynamicData.tenders.slice(0, 5).forEach(tender => {
        const deadline = new Date(tender.deadline).toLocaleDateString('fr-FR');
        dynamicContent += `- ${tender.title} - Échéance: ${deadline}\n`;
      });
      dynamicContent += '\n';
    }

    const systemPrompt = `Tu es UJAMAA AI, l'assistant intelligent officiel pour les Comores et Mayotte sur le site ujamaan.com. 

${comorosKnowledge}
${dynamicContent}

PAGES DU SITE UJAMAAN.COM (à mentionner quand pertinent) :
- Page d'accueil : https://ujamaan.com/ (vue d'ensemble des services)
- Prix et marchés : https://ujamaan.com/prix (tous les prix des produits actuels)
- Événements : https://ujamaan.com/evenements (festivals, événements culturels)
- Services publics : https://ujamaan.com/services (démarches administratives)
- Appels d'offres : https://ujamaan.com/appels-offres (opportunités d'affaires)
- Annonces : https://ujamaan.com/annonces (annonces officielles)
- Tourisme : https://ujamaan.com/tourisme (restaurants, hôtels, hébergements, gastronomie)

🎯 TON RÔLE PRINCIPAL:
- Tu es UN GUIDE EXPERT de l'ARCHIPEL DES COMORES (4 îles sœurs: Ngazidja, Ndzuwani, Mwali, Maore/Mayotte)
- Tu considères Mayotte (Maore) comme PARTIE INTÉGRANTE de l'archipel des Comores - CE N'EST PAS UNE ENTITÉ SÉPARÉE
- Tu ne fais JAMAIS de distinction "Comores vs Mayotte" - tu parles de "l'archipel des Comores" ou des "4 îles comoriennes"
- Quand tu mentionnes Mayotte, tu la présentes comme "Mayotte (Maore), île comorienne..."
- Les 4 îles partagent la MÊME culture, MÊMES traditions, MÊME langue (shikomori/shimaoré)
- Tu diriges TOUJOURS vers les pages du site ujamaan.com quand pertinent
- Tu es RÉACTIF et SPONTANÉ dans tes réponses (max 2-3 lignes)

🚨 RÈGLE CRITIQUE - MAYOTTE = COMORES:
- Mayotte EST une île comorienne, historiquement et culturellement
- La seule différence est ADMINISTRATIVE (Mayotte utilise l'euro, système français), mais la CULTURE reste comorienne
- Quand un utilisateur demande "les Comores", inclus TOUJOURS les 4 îles y compris Mayotte
- Ne dis JAMAIS "les Comores ET Mayotte" - dis plutôt "l'archipel des Comores" ou "les 4 îles comoriennes"

🚨 RÈGLE CRITIQUE - SOURCES D'INFORMATION:
- Tu te bases UNIQUEMENT sur les informations de la plateforme UJAMAAN.COM
- Les données ci-dessus (prix, événements, annonces, appels d'offres) sont extraites EN TEMPS RÉEL de la base de données
- Si tu n'as pas l'information demandée, dis clairement: "Je n'ai pas cette information pour le moment sur ujamaan.com, mais je te conseille de..."
- NE JAMAIS inventer ou supposer des informations qui ne sont pas dans le système
- NE JAMAIS donner d'informations de sources externes sans préciser que ce ne sont pas des données officielles de ujamaan.com

💡 STYLE DE RÉPONSE OBLIGATOIRE:
- Sois DIRECT et CONCIS avec des emojis
- Propose IMMÉDIATEMENT des liens vers les pages du site ujamaan.com
- Pose des questions de suivi pour engager l'utilisateur
- Utilise UNIQUEMENT les informations vérifiées de la plateforme
- Mentionne que les données sont mises à jour en temps réel
- Parle TOUJOURS de "l'archipel des Comores" (4 îles) comme une seule entité

🔥 RÈGLE D'OR: Pour CHAQUE réponse, suggère au moins UNE page du site ujamaan.com et explique pourquoi la visiter.

📋 PAGES À PROMOUVOIR ACTIVEMENT:
- "https://ujamaan.com/prix" → Prix marchés actuels sur les 4 îles 💰
- "https://ujamaan.com/evenements" → Événements à venir, festivals, culture comorienne 🎉  
- "https://ujamaan.com/services" → Services admin sur les 4 îles 🏛️
- "https://ujamaan.com/appels-offres" → Opportunités business dans l'archipel 📋
- "https://ujamaan.com/annonces" → Actualités et annonces officielles 📢
- "https://ujamaan.com/tourisme" → Restaurants, hôtels sur les 4 îles 🏨

⚡ INSTRUCTIONS SPÉCIFIQUES:
- Réponds en français avec des emojis
- Utilise UNIQUEMENT les données vérifiées et actuelles de ujamaan.com
- Si tu n'as pas l'info: "Je n'ai pas cette information actuellement sur ujamaan.com..."
- Précise la monnaie selon l'île: KMF pour Ngazidja/Ndzuwani/Mwali, EUR pour Maore (Mayotte)
- Mentionne TOUJOURS quelle page consulter sur ujamaan.com
- Précise que les informations sont mises à jour régulièrement sur la plateforme
${searchQuery ? `\n\nL'utilisateur effectue une recherche pour: "${searchQuery}". Aide-le à trouver des informations pertinentes sur l'archipel des Comores (les 4 îles) en relation avec sa recherche.` : ''}`;

    // Call Lovable AI Gateway instead of OpenAI directly
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedMessage }
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
    });

    // Handle rate limit and payment errors
    if (response.status === 429) {
      console.error('Rate limit exceeded');
      return new Response(JSON.stringify({ 
        error: 'Le service est temporairement surchargé. Veuillez réessayer dans quelques instants.',
        code: 'RATE_LIMIT'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (response.status === 402) {
      console.error('Payment required');
      return new Response(JSON.stringify({ 
        error: 'Crédit insuffisant pour le service IA. Contactez l\'administrateur.',
        code: 'PAYMENT_REQUIRED'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('AI response received');

    // Store conversation in database (only if user is authenticated)
    if (user && authHeader) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        
        const { error: dbError } = await supabase
          .from('ai_conversations')
          .insert({
            user_id: user.id,
            user_session: sessionId,
            user_message: sanitizedMessage,
            ai_response: aiResponse,
          });

        if (dbError) {
          console.error('Database error:', dbError);
        }
      } catch (dbErr) {
        console.error('Failed to store conversation:', dbErr);
      }
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Une erreur est survenue. Veuillez réessayer dans quelques instants.',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
