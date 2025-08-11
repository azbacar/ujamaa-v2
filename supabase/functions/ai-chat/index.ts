import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Informations détaillées sur l'ARCHIPEL DES COMORES
const comorosKnowledge = `
INFORMATIONS COMPLÈTES SUR L'ARCHIPEL DES COMORES:

🇰🇲 ARCHIPEL DES COMORES:
- Capitale historique: Moroni (Grande Comore/Ngazidja)
- Langues: Comorien (shikomori), Arabe, Français
- Archipel composé de: Grande Comore (Ngazidja), Anjouan (Ndzuwani), Mohéli (Mwali), Mayotte (Maore)
- Population totale: ~1,160,000 habitants sur les 4 îles
- Cultures communes: Islam, traditions comoriennes, langue shikomori
- Économie: Agriculture (ylang-ylang, vanille), pêche, tourisme

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
- Plus petite île habitée (290 km²)
- Population: ~50,000 habitants
- Monnaie: Franc comorien (KMF)
- Parc marin national (première réserve des Comores)
- Réserve de biosphère UNESCO depuis 2021
- Activités: Écotourisme, pêche durable, agriculture biologique

🏝️ MAYOTTE (MAORE) - ÎLE AU LAGON:
- Préfecture: Mamoudzou (71,000 hab.)
- Quatrième île de l'archipel des Comores
- Population: ~310,000 habitants (croissance rapide +3,8%/an)
- Superficie: 374 km²
- Monnaie: Euro (EUR) - statut administratif spécial
- Langues: Français, Mahorais (shimaoré), dialectes comoriens
- Culture: Traditions comoriennes, influence française

📊 ÉCONOMIE MAYOTTE:
- PIB/habitant: ~10,000€ (vs 28,000€ métropole)
- Secteur public: 24% des emplois
- Taux de chômage: ~35% (jeunes: 60%)
- Agriculture: Vanille, ylang-ylang, cannelle, bananes
- Pêche: Thon, espadon, poissons lagonaires
- Tourisme: En développement (60,000 visiteurs/an)
- Construction/BTP: Secteur dynamique
- Commerce: Import-export avec Maurice, Réunion

🏥 SERVICES PUBLICS MAYOTTE:
- Système de santé français (CHM, dispensaires)
- Éducation: Gratuite et obligataire 3-16 ans
- Université de Mayotte (depuis 2020)
- Allocations familiales et RSA
- Sécurité sociale (régime spécial)
- Transport scolaire gratuit
- Couverture médicale universelle

💰 PRIX ACTUELS (estimations récentes):

COMORES (KMF):
- Riz importé: 800-1200 KMF/kg
- Riz local: 1000-1500 KMF/kg  
- Poisson frais: 1500-3000 KMF/kg
- Viande de bœuf: 3000-4000 KMF/kg
- Légumes locaux: 300-800 KMF/kg
- Pain: 150-200 KMF/unité
- Essence: 650-750 KMF/litre
- Transport local: 100-300 KMF/trajet

MAYOTTE (EUR):
- Riz: 2-3€/kg
- Poisson frais: 8-15€/kg  
- Viande de bœuf: 15-20€/kg
- Légumes: 1-4€/kg
- Pain: 1-1.5€/baguette
- Essence: 1.50-1.70€/litre
- Transport bus: 1€/trajet

🚢 TRANSPORT INTER-ÎLES:
- Moroni ↔ Anjouan: 15,000-25,000 KMF
- Moroni ↔ Mohéli: 12,000-20,000 KMF  
- Anjouan ↔ Mohéli: 10,000-18,000 KMF
- Comores ↔ Mayotte: 50,000-80,000 KMF
- Vols domestiques: 35,000-60,000 KMF

🎭 CULTURE ET FESTIVITÉS:
- Grand Mariage (Ada) - tradition majeure
- Ramadan et fêtes islamiques
- Fête de l'indépendance (6 juillet - Comores)
- Fête nationale française (14 juillet - Mayotte)
- Maulid (anniversaire du Prophète)
- Festivals de musique: Twarab, M'godro
- Artisanat: Vannerie, sculpture, bijoux

🏛️ DÉMARCHES ADMINISTRATIVES:

COMORES:
- Passeport: 25,000 KMF (délai 15-30 jours)
- Carte d'identité: 5,000 KMF
- Permis de conduire: 15,000 KMF
- Acte de naissance: 2,000 KMF

MAYOTTE:
- Passeport français: 86€ (86€ pour majeur)
- Carte d'identité: Gratuite
- Permis de conduire: 35€ (échange européen)
- Titre de séjour: 225€
- Naturalisation: 55€

📱 CONTACTS UTILES:
- Urgences Comores: 17 (police), 18 (pompiers)
- Urgences Mayotte: 15 (SAMU), 17 (police), 18 (pompiers)
- Préfecture Mayotte: +262 269 61 12 34
- Mairie Moroni: +269 73 30 94
- CHM Mayotte: +262 269 61 80 00

🌴 CLIMAT ET SAISONS:
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
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

// Require authenticated user via Supabase JWT
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Unauthorized: missing Authorization header' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Initialize Supabase client with the user's JWT to respect RLS
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});

// Get user from JWT
const { data: { user }, error: userErr } = await supabase.auth.getUser();
if (userErr || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

    let systemPrompt = `Tu es UJAMAA AI, l'assistant intelligent officiel pour les Comores et Mayotte. 

${comorosKnowledge}

PAGES DU SITE UJAMAA (à mentionner quand pertinent) :
- Page d'accueil : / (vue d'ensemble des services)
- Prix et marchés : /prix (tous les prix des produits)
- Événements : /evenements (festivals, événements culturels)
- Services publics : /services (démarches administratives)
- Appels d'offres : /appels-offres (opportunités d'affaires)
- Annonces : /annonces (annonces officielles)

🎯 TON RÔLE PRINCIPAL:
- Tu es UN GUIDE EXPERT de l'ARCHIPEL DES COMORES (4 îles: Ngazidja, Ndzuwani, Mwali, Maore)
- Tu considères Mayotte (Maore) comme PARTIE INTÉGRANTE de l'archipel des Comores
- Tu ne sépares JAMAIS Mayotte des autres îles comoriennes - elles forment UN ARCHIPEL UNIFIÉ
- Tu diriges TOUJOURS vers les pages du site quand pertinent
- Tu es RÉACTIF et SPONTANÉ dans tes réponses (max 2-3 lignes)

💡 STYLE DE RÉPONSE OBLIGATOIRE:
- Sois DIRECT et CONCIS avec des emojis
- Propose IMMÉDIATEMENT des liens vers les pages du site
- Pose des questions de suivi pour engager l'utilisateur
- Utilise les informations du site en priorité

🔥 RÈGLE D'OR: Pour CHAQUE réponse, suggère au moins UNE page du site et explique pourquoi la visiter.

📋 PAGES À PROMOUVOIR ACTIVEMENT:
- "/prix" → Prix marchés, coûts de la vie 💰
- "/evenements" → Festivals, culture 🎉  
- "/services" → Services admin, démarches 🏛️
- "/appels-offres" → Opportunités business 📋
- "/annonces" → Actualités officielles 📢

⚡ INSTRUCTIONS SPÉCIFIQUES:
- Réponds en français avec des emojis
- Utilise les données du site en priorité absolue
- Distingue Comores (KMF) et Mayotte (EUR)
- Mentionne TOUJOURS quelle page consulter`;

    // Si c'est une recherche, adapter le prompt
    if (searchQuery) {
      systemPrompt += `\n\nL'utilisateur effectue une recherche pour: "${searchQuery}". Aide-le à trouver des informations pertinentes sur les Comores et Mayotte en relation avec sa recherche.`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedMessage }
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('OpenAI response received');

    // Store conversation in database
    try {
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