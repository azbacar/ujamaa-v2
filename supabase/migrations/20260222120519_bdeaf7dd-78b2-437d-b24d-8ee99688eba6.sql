
-- Table to store customizable page content
CREATE TABLE public.static_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta_description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Static pages are publicly readable"
ON public.static_pages FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can update static pages"
ON public.static_pages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can insert static pages"
ON public.static_pages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Seed the 4 pages
INSERT INTO public.static_pages (slug, title, content) VALUES
('contact', 'Contact', '## Contactez-nous

📞 **Téléphone** : +269 XX XX XX XX

📧 **Email** : contact@ujamaan.com

📍 **Adresse** : Moroni, Grande Comore, Union des Comores

### Horaires d''ouverture
- Lundi - Vendredi : 8h00 - 17h00
- Samedi : 9h00 - 12h00
- Dimanche : Fermé

### Formulaire de contact
N''hésitez pas à nous écrire pour toute question ou suggestion.'),

('a-propos', 'À propos', '## À propos d''Ujamaan

**Ujamaan Call Center** est la plateforme centralisée d''information pour les Comores.

### Notre mission
Rendre l''information comorienne accessible, actualisée et centralisée pour tous les citoyens et la diaspora.

### Nos valeurs
- 🌍 **Accessibilité** : Information pour tous
- ✅ **Fiabilité** : Données vérifiées
- 🤝 **Communauté** : Au service des Comoriens
- 💡 **Innovation** : Technologies modernes

### Notre équipe
Une équipe passionnée dédiée à connecter les Comores au monde.'),

('confidentialite', 'Politique de Confidentialité', '## Politique de Confidentialité

**Dernière mise à jour** : Février 2026

### Collecte des données
Nous collectons uniquement les données nécessaires au bon fonctionnement de nos services :
- Adresse email pour la création de compte
- Informations de profil fournies volontairement

### Utilisation des données
Vos données sont utilisées exclusivement pour :
- Fournir et améliorer nos services
- Communiquer des informations pertinentes
- Assurer la sécurité de votre compte

### Protection des données
Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données personnelles.

### Vos droits
Vous avez le droit d''accéder, modifier ou supprimer vos données personnelles à tout moment.'),

('conditions', 'Conditions d''Utilisation', '## Conditions d''Utilisation

**Dernière mise à jour** : Février 2026

### Acceptation des conditions
En utilisant Ujamaan, vous acceptez les présentes conditions d''utilisation.

### Utilisation du service
- Le service est fourni « tel quel »
- Vous êtes responsable de l''exactitude des informations que vous publiez
- Tout contenu illégal ou inapproprié sera supprimé

### Comptes utilisateurs
- Vous devez fournir des informations exactes lors de l''inscription
- Vous êtes responsable de la confidentialité de votre mot de passe
- Un seul compte par personne est autorisé

### Propriété intellectuelle
Le contenu publié sur Ujamaan reste la propriété de ses auteurs respectifs.

### Limitation de responsabilité
Ujamaan ne peut être tenu responsable des informations publiées par les utilisateurs.');

-- Trigger for updated_at
CREATE TRIGGER update_static_pages_updated_at
BEFORE UPDATE ON public.static_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
