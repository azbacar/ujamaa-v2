interface HeroPreviewProps {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export const HeroPreview = ({ title, subtitle, imageUrl }: HeroPreviewProps) => {
  return (
    <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-border">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: imageUrl 
            ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${imageUrl})`
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {title || "Titre de la page d'accueil"}
        </h1>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl">
          {subtitle || "Sous-titre de la page d'accueil"}
        </p>
      </div>
    </div>
  );
};
