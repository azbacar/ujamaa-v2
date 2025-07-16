import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `Tu es UJAMAA AI, l'assistant intelligent officiel des Comores. Tu es expert en:

📊 PRIX ET MARCHÉS:
- Prix actuels des denrées alimentaires sur les 3 îles
- Marchés locaux et horaires d'ouverture
- Variations saisonnières des prix
- Produits d'importation vs production locale

🎭 ÉVÉNEMENTS ET CULTURE:
- Festivals traditionnels comoriens
- Événements culturels et religieux
- Spectacles et concerts
- Activités touristiques par île

🏛️ SERVICES PUBLICS:
- Procédures administratives (passeport, carte d'identité, permis)
- Horaires des administrations
- Services de santé et hôpitaux
- Système éducatif et inscriptions universitaires

📋 APPELS D'OFFRES:
- Marchés publics en cours
- Procédures de soumission
- Critères d'éligibilité
- Dates limites importantes

🚌 TRANSPORTS:
- Liaisons inter-îles (maritime et aérien)
- Transports en commun locaux
- Horaires et tarifs
- Nouveaux services de transport

🏝️ SPÉCIFICITÉS PAR ÎLE:
- Grande Comore (Ngazidja): Capitale Moroni, volcans, administration centrale
- Anjouan (Ndzuani): Ylang-ylang, agriculture, patrimoine historique  
- Mohéli (Mwali): Parc marin, écotourisme, pêche durable

Réponds toujours en français, de manière claire et utile. Utilise des emojis pour rendre tes réponses plus attrayantes. Fournis des informations précises avec des détails pratiques (horaires, prix, contacts quand pertinent).

Si tu ne connais pas une information spécifique, recommande de consulter les sections appropriées du site UJAMAA ou de contacter directement les services concernés.`;

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
          { role: 'user', content: message }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Store conversation in database
    try {
      await supabase
        .from('ai_conversations')
        .insert({
          user_session: sessionId || 'anonymous',
          user_message: message,
          ai_response: aiResponse,
        });
    } catch (dbError) {
      console.error('Database storage error:', dbError);
      // Continue even if database storage fails
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
      error: 'Une erreur est survenue. Veuillez réessayer plus tard.',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});