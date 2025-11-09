-- Ajouter les colonnes pour personnaliser l'assistant IA
ALTER TABLE public.site_settings
ADD COLUMN ai_assistant_name TEXT DEFAULT 'Assistant UJAMAA',
ADD COLUMN ai_assistant_welcome_message TEXT DEFAULT '🌺 Salut ! Je suis votre guide UJAMAA pour les Comores et Mayotte ! Que cherchez-vous : prix des marchés, événements, services admin... ? 🚀',
ADD COLUMN ai_assistant_enabled BOOLEAN DEFAULT true;