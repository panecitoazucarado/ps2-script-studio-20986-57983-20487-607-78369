import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FolderOpen, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Settings,
  Plus,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { FileNode } from '@/types/athena';

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
  onProjectLoad?: (files: FileNode[]) => void;
}

const initialFileSystem: FileNode[] = [];

export function FileExplorer({ onFileSelect, selectedFile, onProjectLoad }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([]));
  const [searchTerm, setSearchTerm] = useState('');
  const [fileSystem, setFileSystem] = useState<FileNode[]>(initialFileSystem);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  const handleFolderImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (!files || files.length === 0) return;
      
      const fileTree = await buildFileTree(files);
      setFileSystem(fileTree);
      onProjectLoad?.(fileTree);
      
      // Expandir las carpetas raíz automáticamente
      const rootFolders = fileTree
        .filter(node => node.type === 'folder')
        .map(node => node.path);
      setExpandedFolders(new Set(rootFolders));
    };
    
    input.click();
  };

  const buildFileTree = async (files: FileList): Promise<FileNode[]> => {
    const tree: { [key: string]: FileNode } = {};
    const rootNodes: FileNode[] = [];
    
    // Primero crear toda la estructura de directorios
    const fileDataMap = new Map<string, File>();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pathParts = file.webkitRelativePath.split('/');
      
      let currentPath = '';
      
      for (let j = 0; j < pathParts.length; j++) {
        const part = pathParts[j];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
        
        const isFile = j === pathParts.length - 1;
        
        if (!tree[currentPath]) {
          const node: FileNode = {
            name: part,
            type: isFile ? 'file' : 'folder',
            path: currentPath,
            children: isFile ? undefined : []
          };
          
          tree[currentPath] = node;
          
          if (isFile) {
            fileDataMap.set(currentPath, file);
          }
          
          // Agregar a la carpeta padre o a la raíz
          if (parentPath && tree[parentPath]) {
            tree[parentPath].children?.push(node);
          } else if (j === 0) {
            rootNodes.push(node);
          }
        }
      }
    }
    
    // Ahora leer el contenido de todos los archivos
    const readPromises: Promise<void>[] = [];
    
    for (const [path, file] of fileDataMap.entries()) {
      const node = tree[path];
      if (!node) continue;
      
      const ext = node.name.toLowerCase();
      
      // Archivos de texto
      if (ext.endsWith('.js') || ext.endsWith('.txt') || ext.endsWith('.ini') || 
          ext.endsWith('.cnf') || ext.endsWith('.json') || ext.endsWith('.lua') ||
          ext.endsWith('.md') || ext.endsWith('.xml') || ext.endsWith('.css') ||
          ext.endsWith('.html') || ext.endsWith('.c') || ext.endsWith('.cpp') ||
          ext.endsWith('.h') || ext.endsWith('.hpp') || ext.endsWith('.glsl') ||
          ext.endsWith('.vert') || ext.endsWith('.frag')) {
        readPromises.push(
          file.text()
            .then(content => { 
              node.content = content;
              return undefined;
            })
            .catch(err => {
              console.error('Error reading text file:', node.name, err);
              return undefined;
            })
        );
      }
      // Archivos de imagen
      else if (ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') ||
               ext.endsWith('.gif') || ext.endsWith('.bmp') || ext.endsWith('.webp') ||
               ext.endsWith('.svg') || ext.endsWith('.ico') || ext.endsWith('.tga') ||
               ext.endsWith('.dds') || ext.endsWith('.tif') || ext.endsWith('.tiff')) {
        readPromises.push(
          new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              node.content = e.target?.result as string;
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }).catch(err => {
            console.error('Error reading image file:', node.name, err);
            return undefined;
          })
        );
      }
    }
    
    // Esperar a que todos los archivos se lean
    await Promise.all(readPromises);
    
    return rootNodes;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return <FolderOpen className="w-4 h-4 text-ps2-blue" />;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
        return <FileText className="w-4 h-4 text-ps2-purple" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
      case 'ico':
      case 'tga':
      case 'dds':
      case 'tif':
      case 'tiff':
        return <ImageIcon className="w-4 h-4 text-ps2-green" />;
      case 'wav':
      case 'ogg':
        return <Music className="w-4 h-4 text-ps2-orange" />;
      case 'ini':
      case 'cnf':
        return <Settings className="w-4 h-4 text-ps2-cyan" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes
      .filter(node => 
        searchTerm === '' || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(node => (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-accent/50 transition-colors ${
              selectedFile?.path === node.path ? 'bg-accent text-accent-foreground' : ''
            }`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => {
              if (node.type === 'folder') {
                toggleFolder(node.path);
              } else {
                onFileSelect(node);
              }
            }}
          >
            {node.type === 'folder' && (
              <button className="p-0 h-auto">
                {expandedFolders.has(node.path) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}
            {getFileIcon(node)}
            <span className="text-sm truncate flex-1">{node.name}</span>
            {node.name.endsWith('.js') && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                JS
              </Badge>
            )}
          </div>
          
          {node.type === 'folder' && 
           expandedFolders.has(node.path) && 
           node.children && 
           renderFileTree(node.children, depth + 1)}
        </div>
      ));
  };

  return (
    <Card className="h-full flex flex-col ide-sidebar">
      {/* Explorer Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">File Explorer</h3>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={handleFolderImport}
              title="Importar proyecto Athena ENV"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setFileSystem([])}
              title="Limpiar proyecto"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-xs text-muted-foreground font-medium mb-2 px-2">
          ATHENA ENV PROJECT
        </div>
        {fileSystem.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              No hay archivos cargados
            </p>
            <p className="text-xs text-muted-foreground/70 mb-4">
              Importa tu proyecto Athena ENV usando el botón +
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleFolderImport}
            >
              <Plus className="w-3 h-3 mr-2" />
              Importar Proyecto
            </Button>
          </div>
        ) : (
          renderFileTree(fileSystem)
        )}
      </div>

      {/* Explorer Footer */}
      <div className="p-2 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{fileSystem.flat().length} items</span>
          <Badge variant="outline" className="text-xs">
            PS2
          </Badge>
        </div>
      </div>
    </Card>
  );
}