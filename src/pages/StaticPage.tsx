import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const StaticPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currentLanguage, setLanguage } = useLanguage();
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('static_pages')
        .select('title, content')
        .eq('slug', slug)
        .single();
      setPage(data);
      setLoading(false);
    };
    if (slug) fetchPage();
  }, [slug]);

  // Whitelist only http(s) and mailto/tel URLs to prevent javascript:/data: XSS via [text](url) markdown
  const safeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (/^(https?:|mailto:|tel:|\/)/i.test(trimmed)) return trimmed;
    return '#';
  };

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const formatInline = (text: string) => {
    // Escape first, then re-apply our safe inline markdown
    const escaped = escapeHtml(text);
    return escaped
      .replace(/\[(.+?)\]\((.+?)\)/g, (_m, label, url) =>
        `<a href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">${label}</a>`
      )
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  };

  const sanitize = (html: string) =>
    DOMPurify.sanitize(html, { ALLOWED_TAGS: ['a', 'strong', 'em', 'br'], ALLOWED_ATTR: ['href', 'target', 'rel', 'class'] });

  // Simple markdown-like renderer
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-foreground mt-8 mb-4">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold text-foreground mt-6 mb-3">{line.slice(4)}</h3>;
      if (line.startsWith('- ')) {
        const text = line.slice(2);
        return <li key={i} className="text-muted-foreground ml-4 mb-1" dangerouslySetInnerHTML={{ __html: sanitize(formatInline(text)) }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: sanitize(formatInline(line)) }} />;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-6 py-12 max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : page ? (
          <Card>
            <CardContent className="p-8 md:p-12">
              <h1 className="text-3xl font-bold text-foreground mb-8">{page.title}</h1>
              <div className="prose prose-emerald max-w-none">
                {renderContent(page.content)}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-20 text-muted-foreground">Page introuvable.</div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StaticPage;
