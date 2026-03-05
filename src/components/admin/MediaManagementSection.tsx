import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, Image, FileText, Film, Music, Download, Trash2, Search, FolderOpen, Grid, List
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
  bucket: string;
}

const BUCKETS = ['event-images', 'avatars', 'Logo & icon'];

export default function MediaManagementSection() {
  const { user } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBucket, setSelectedBucket] = useState('event-images');

  useEffect(() => {
    fetchMediaFiles();
  }, [selectedBucket]);

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const allFiles: MediaFile[] = [];

      for (const bucket of BUCKETS) {
        const { data, error } = await supabase.storage.from(bucket).list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
        if (error) {
          console.error(`Error listing ${bucket}:`, error);
          continue;
        }
        if (data) {
          for (const file of data) {
            if (file.id) {
              const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(file.name);
              allFiles.push({
                id: file.id,
                name: file.name,
                type: file.metadata?.mimetype || 'application/octet-stream',
                size: file.metadata?.size || 0,
                url: urlData.publicUrl,
                created_at: file.created_at || new Date().toISOString(),
                bucket
              });
            }
          }
        }
      }

      setMediaFiles(allFiles);
    } catch (error) {
      console.error('Error fetching media files:', error);
      toast.error('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadProgress(10);
      for (const file of files) {
        const filePath = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from(selectedBucket).upload(filePath, file);
        if (error) {
          toast.error(`Erreur: ${error.message}`);
          continue;
        }
        setUploadProgress(80);
      }
      setUploadProgress(100);
      toast.success(`${files.length} fichier(s) téléchargé(s) avec succès`);
      await fetchMediaFiles();
      setUploadProgress(0);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erreur lors du téléchargement');
      setUploadProgress(0);
    }
    // Reset input
    event.target.value = '';
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Supprimer ${file.name} ?`)) return;
    try {
      const { error } = await supabase.storage.from(file.bucket).remove([file.name]);
      if (error) throw error;
      setMediaFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('Fichier supprimé');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (type.startsWith('video/')) return <Film className="h-5 w-5 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5 text-green-500" />;
    return <FileText className="h-5 w-5 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = mediaFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSize = mediaFiles.reduce((acc, file) => acc + file.size, 0);

  return (
    <div className="space-y-6 p-6">
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Gestion des médias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{mediaFiles.length}</div>
              <div className="text-sm text-slate-600">Fichiers</div>
            </div>
            <div className="text-center p-4 border border-green-200 rounded-lg bg-green-50">
              <Image className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{mediaFiles.filter(f => f.type.startsWith('image/')).length}</div>
              <div className="text-sm text-slate-600">Images</div>
            </div>
            <div className="text-center p-4 border border-purple-200 rounded-lg bg-purple-50">
              <FolderOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{BUCKETS.length}</div>
              <div className="text-sm text-slate-600">Buckets</div>
            </div>
            <div className="text-center p-4 border border-orange-200 rounded-lg bg-orange-50">
              <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
              <div className="text-sm text-slate-600">Taille totale</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-600 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Télécharger des fichiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {BUCKETS.map(bucket => (
                <Button
                  key={bucket}
                  variant={selectedBucket === bucket ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedBucket(bucket)}
                >
                  {bucket}
                </Button>
              ))}
            </div>
            <div className="border-2 border-dashed border-blue-200 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <Label htmlFor="file-upload" className="text-lg font-medium cursor-pointer text-blue-600 hover:text-blue-700">
                Cliquez pour télécharger dans "{selectedBucket}"
              </Label>
              <p className="text-sm text-muted-foreground mt-1">PNG, JPG, PDF, MP4 jusqu'à 10MB</p>
              <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
            </div>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="border-blue-200 bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Rechercher des fichiers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Display */}
      <Card className="border-blue-200 bg-white">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Chargement...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun fichier trouvé</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
              {filteredFiles.map((file) => (
                <div key={file.id} className={`border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors bg-white ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {getFileIcon(file.type)}
                    <Badge variant="outline" className="text-xs">{file.bucket}</Badge>
                  </div>
                  
                  {file.type.startsWith('image/') && viewMode === 'grid' && (
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden">
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className={viewMode === 'list' ? 'flex-1' : ''}>
                    <h4 className="font-medium text-sm truncate mb-1">{file.name}</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{formatFileSize(file.size)}</div>
                      <div>{new Date(file.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  
                  <div className={`flex gap-2 ${viewMode === 'list' ? '' : 'mt-3'}`}>
                    <Button size="sm" variant="outline" className="p-2" asChild>
                      <a href={file.url} target="_blank" rel="noopener noreferrer"><Download className="h-3 w-3" /></a>
                    </Button>
                    <Button size="sm" variant="outline" className="p-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleDelete(file)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
