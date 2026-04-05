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
    const [pricesRes, eventsRes, announcementsRes, freelancersRes, diasporaRes] = await Promise.all([
      supabase.from('prices').select('product, price, unit, island, category, currency, market, city, vendor, trend, created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(200),
      supabase.from('events').select('title, description, date, end_date, location, island').gte('end_date', new Date().toISOString()).order('date', { ascending: true }).limit(20),
      supabase.from('content_items').select('title, description, category').eq('status', 'published').order('published_at', { ascending: false }).limit(20),
      supabase.from('freelancer_profiles').select('display_name, skills, island, hourly_rate_min, hourly_rate_max, currency, experience_years, is_available').eq('is_visible', true).eq('is_available', true).limit(30),
      supabase.from('diaspora_projects').select('title, description, category, target_amount, current_amount, currency, island, location, min_investment, deadline').eq('status', 'published').order('created_at', { ascending: false }).limit(20),
    ]);

    return {
      prices: pricesRes.data || [],
      events: eventsRes.data || [],
      announcements: announcementsRes.data || [],
      freelancers: freelancersRes.data || [],
      diasporaProjects: diasporaRes.data || [],
    };
  } catch (error) {
    console.error('Error fetching dynamic data:', error);
    return { prices: [], events: [], announcements: [], freelancers: [], diasporaProjects: [] };
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

    // Build dynamic content section
    let dynamicContent = '\n\n📊 DONNÉES ACTUELLES DE LA PLATEFORME UJAMAAN.COM:\n\n';
    
    if (dynamicData.prices.length > 0) {
      dynamicContent += '💰 PRIX RÉCENTS:\n';
      dynamicData.prices.slice(0, 15).forEach(p => {
        dynamicContent += `- ${p.product}: ${p.price} ${p.unit} (${p.island})\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.events.length > 0) {
      dynamicContent += '🎉 ÉVÉNEMENTS À VENIR:\n';
      dynamicData.events.slice(0, 10).forEach(e => {
        dynamicContent += `- ${e.title} - ${new Date(e.date).toLocaleDateString('fr-FR')} à ${e.location} (${e.island})\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.announcements.length > 0) {
      dynamicContent += '📢 ANNONCES RÉCENTES:\n';
      dynamicData.announcements.slice(0, 8).forEach(a => {
        dynamicContent += `- ${a.title}\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.freelancers && dynamicData.freelancers.length > 0) {
      dynamicContent += '👨‍💻 FREELANCERS DISPONIBLES:\n';
      dynamicData.freelancers.slice(0, 15).forEach((f: any) => {
        const skills = (f.skills || []).slice(0, 5).join(', ');
        const rate = f.hourly_rate_min ? `${f.hourly_rate_min}${f.hourly_rate_max ? '-' + f.hourly_rate_max : '+'} ${f.currency}/h` : '';
        dynamicContent += `- ${f.display_name} (${skills})${f.island ? ' - ' + f.island : ''}${rate ? ' - ' + rate : ''}${f.experience_years ? ' - ' + f.experience_years + ' ans exp.' : ''}\n`;
      });
      dynamicContent += '\n';
    }

    if (dynamicData.diasporaProjects && dynamicData.diasporaProjects.length > 0) {
      dynamicContent += '🌍 PROJETS D\'INVESTISSEMENT DIASPORA:\n';
      dynamicData.diasporaProjects.forEach((p: any) => {
        const progress = p.target_amount > 0 ? Math.round((p.current_amount / p.target_amount) * 100) : 0;
        const deadline = p.deadline ? new Date(p.deadline).toLocaleDateString('fr-FR') : '';
        dynamicContent += `- ${p.title} (${p.category}) - Objectif: ${p.target_amount} ${p.currency} - ${progress}% financé${p.island ? ' - ' + p.island : ''}${p.min_investment ? ' - Min: ' + p.min_investment + ' ' + p.currency : ''}${deadline ? ' - Échéance: ' + deadline : ''}\n`;
      });
      dynamicContent += '\n';
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

🔗 PAGES INTERNES DU SITE (les SEULS liens que tu peux donner) :
- /prix → Prix et marchés 💰
- /evenements → Événements 🎉
- /services → Services publics 🏛️
- /appels-offres → Appels d'offres 📋
- /annonces → Annonces 📢
- /tourisme → Tourisme 🏨
- /freelance → Missions freelance 💼
- /freelancers → Répertoire des freelancers 👨‍💻
- /investissement → Investissement Diaspora 🌍

🚨 RÈGLES ABSOLUES:
1. Tu te bases EXCLUSIVEMENT sur les données de la plateforme ujamaan.com listées ci-dessus et les sources de référence autorisées. RIEN D'AUTRE.
2. Si une information N'EST PAS dans les données ci-dessus, tu dis clairement : "Cette information n'est pas encore disponible sur ujamaan.com".
3. N'INVENTE JAMAIS de prix, de noms, de dates, d'événements ou de freelancers. Utilise UNIQUEMENT les données fournies.
4. Les SEULS LIENS que tu donnes sont les chemins internes du site. JAMAIS d'URLs externes (pas de https://...).
5. Quand tu cites une source externe autorisée, mentionne-la par son NOM uniquement, SANS URL.
6. Tes liens internes doivent être au format markdown: [Titre du lien](/chemin)
7. Mayotte est une île comorienne. Dis TOUJOURS "l'archipel des Comores" (4 îles). JAMAIS "les Comores et Mayotte".
8. Sois DIRECT, CONCIS avec des emojis. Max 3-4 phrases par réponse.
9. Suggère TOUJOURS au moins une page interne pertinente.
10. Ne réponds PAS aux questions sans rapport avec les Comores ou la plateforme (politique internationale, code informatique, maths, etc.). Redirige poliment vers le sujet du site.

🤝 HONNÊTETÉ ET HUMANITÉ:
- Si tu ne trouves PAS l'information dans les données fournies, dis-le franchement : "Je n'ai pas encore cette information sur ujamaan.com 😊"
- Propose des PISTES CONCRÈTES : oriente vers la page interne la plus pertinente.
- Ne JAMAIS inventer de données. Mieux vaut dire "je ne sais pas" que donner une fausse info.
- Ton amical et empathique. Parle comme un ami comorien serviable.
${searchQuery ? `\nL'utilisateur recherche: "${searchQuery}". Aide-le avec les données de la plateforme.` : ''}`;

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
        max_tokens: 1500,
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
