import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Mail, Shield, Clock, AlertTriangle } from 'lucide-react';

const DeleteAccountPage = () => {
  const { currentLanguage, setLanguage } = useLanguage();

  const handleRequestDeletion = () => {
    const subject = encodeURIComponent("Demande de suppression de compte et données");
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite demander la suppression définitive de mon compte et de toutes mes données personnelles sur la plateforme Ujamaan.\n\nMerci de traiter cette demande dans les meilleurs délais.\n\nCordialement.`
    );
    window.open(`mailto:contact@ujamaan.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-3xl">
        <Card>
          <CardContent className="p-8 md:p-12 space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Trash2 className="h-8 w-8 text-destructive" />
                Suppression de compte et données
              </h1>
              <p className="text-muted-foreground text-lg">
                Conformément à la réglementation sur la protection des données personnelles, vous avez le droit de demander la suppression de votre compte et de toutes les données associées.
              </p>
            </div>

            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Quelles données sont supprimées ?
                </h2>
                <ul className="space-y-2 text-muted-foreground ml-7 list-disc">
                  <li>Votre profil utilisateur (nom, e-mail, avatar)</li>
                  <li>Vos annonces, commentaires et contributions</li>
                  <li>Vos favoris et préférences</li>
                  <li>Votre historique de conversations avec l'assistant IA</li>
                  <li>Vos inscriptions aux événements</li>
                  <li>Toute autre donnée personnelle liée à votre compte</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Comment ça fonctionne ?
                </h2>
                <ol className="space-y-3 text-muted-foreground ml-7 list-decimal">
                  <li>Envoyez une demande de suppression par e-mail à <strong className="text-foreground">contact@ujamaan.com</strong></li>
                  <li>Notre équipe vérifie votre identité pour protéger votre compte</li>
                  <li>Votre compte et toutes vos données sont supprimés définitivement</li>
                  <li>Vous recevez une confirmation par e-mail sous <strong className="text-foreground">72 heures</strong></li>
                </ol>
              </section>

              <section className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Attention
                </h2>
                <p className="text-muted-foreground text-sm">
                  La suppression de votre compte est <strong className="text-foreground">irréversible</strong>. Une fois effectuée, il ne sera plus possible de récupérer vos données, annonces ou historique. Assurez-vous de sauvegarder toute information importante avant de faire votre demande.
                </p>
              </section>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button variant="destructive" onClick={handleRequestDeletion} className="gap-2">
                  <Mail className="h-4 w-4" />
                  Envoyer une demande de suppression
                </Button>
                <Button variant="outline" asChild>
                  <a href="/page/confidentialite">Politique de confidentialité</a>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Pour toute question, contactez-nous au <strong>+269 733 2122</strong> ou via <a href="https://wanzani.com/ujamaan" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">wanzani.com/ujamaan</a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default DeleteAccountPage;
