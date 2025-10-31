import { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Download,
  Save,
  X,
  SearchX,
  Trash2,
  Edit3,
  Info,
  History,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import JSZip from 'jszip';
import { FileNode } from '@/types/athena';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
  onProjectLoad?: (files: FileNode[]) => void;
  onFileSystemUpdate?: (files: FileNode[]) => void;
  onAIConsult?: (file: FileNode, action: 'consult' | 'analyze' | 'improve') => void;
}

interface FileMetadata {
  size: number;
  created: Date;
  modified: Date;
  type: string;
  lines?: number;
}

interface FileHistory {
  timestamp: Date;
  action: string;
  size: number;
}

const initialFileSystem: FileNode[] = [];

export function FileExplorer({ onFileSelect, selectedFile, onProjectLoad, onFileSystemUpdate, onAIConsult }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([]));
  const [searchTerm, setSearchTerm] = useState('');
  const [fileSystem, setFileSystem] = useState<FileNode[]>(initialFileSystem);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('/');
  
  // Context menu & rename states
  const [renamingFile, setRenamingFile] = useState<FileNode | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenuFile, setContextMenuFile] = useState<FileNode | null>(null);
  
  // Dialog states
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [fileHistory, setFileHistory] = useState<FileHistory[]>([]);
  
  // Double click detection
  const lastClickTime = useRef<number>(0);
  const lastClickedFile = useRef<string>('');

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

  const handleExportProject = async () => {
    if (fileSystem.length === 0) {
      alert('No hay archivos para exportar');
      return;
    }

    const zip = new JSZip();
    
    const addFilesToZip = (nodes: FileNode[], folder?: JSZip) => {
      nodes.forEach(node => {
        if (node.type === 'folder' && node.children) {
          const newFolder = folder ? folder.folder(node.name) : zip.folder(node.name);
          if (newFolder) {
            addFilesToZip(node.children, newFolder);
          }
        } else if (node.type === 'file' && node.content) {
          const targetFolder = folder || zip;
          
          // Si es una imagen (base64), extraer los datos
          if (node.content.startsWith('data:')) {
            const base64Data = node.content.split(',')[1];
            targetFolder.file(node.name, base64Data, { base64: true });
          } else {
            // Archivo de texto
            targetFolder.file(node.name, node.content);
          }
        }
      });
    };

    addFilesToZip(fileSystem);

    // Generar el ZIP y descargarlo
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'athena-env-project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const updateFileSystem = (newFileSystem: FileNode[]) => {
    setFileSystem(newFileSystem);
    onFileSystemUpdate?.(newFileSystem);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const extension = newFileName.includes('.') ? newFileName.split('.').pop()?.toLowerCase() : 'txt';
    const filePath = selectedFolderPath === '/' ? `/${newFileName}` : `${selectedFolderPath}/${newFileName}`;
    
    const newFile: FileNode = {
      name: newFileName,
      type: 'file',
      path: filePath,
      content: getDefaultContentByExtension(extension || '')
    };

    const updatedFileSystem = addFileToTree(fileSystem, newFile, selectedFolderPath);
    updateFileSystem(updatedFileSystem);
    setNewFileName('');
    setShowNewFileDialog(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const folderPath = selectedFolderPath === '/' ? `/${newFolderName}` : `${selectedFolderPath}/${newFolderName}`;
    
    const newFolder: FileNode = {
      name: newFolderName,
      type: 'folder',
      path: folderPath,
      children: []
    };

    const updatedFileSystem = addFileToTree(fileSystem, newFolder, selectedFolderPath);
    updateFileSystem(updatedFileSystem);
    setExpandedFolders(prev => new Set([...prev, folderPath]));
    setNewFolderName('');
    setShowNewFolderDialog(false);
  };

  const addFileToTree = (tree: FileNode[], newNode: FileNode, targetPath: string): FileNode[] => {
    if (targetPath === '/') {
      return [...tree, newNode];
    }

    return tree.map(node => {
      if (node.type === 'folder' && node.path === targetPath) {
        return {
          ...node,
          children: [...(node.children || []), newNode]
        };
      } else if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: addFileToTree(node.children, newNode, targetPath)
        };
      }
      return node;
    });
  };

  const getDefaultContentByExtension = (ext: string): string => {
    switch (ext) {
      case 'js':
        return '// ATHENA ENV JavaScript file\n\n';
      case 'c':
        return '#include <stdio.h>\n\nint main() {\n    return 0;\n}\n';
      case 'h':
        return '#ifndef HEADER_H\n#define HEADER_H\n\n#endif\n';
      case 'html':
        return '<!DOCTYPE html>\n<html>\n<head>\n    <title>Document</title>\n</head>\n<body>\n    \n</body>\n</html>\n';
      case 'css':
        return '/* Stylesheet */\n\n';
      case 'json':
        return '{\n    \n}\n';
      case 'ini':
      case 'cnf':
      case 'cfg':
        return '# Configuration file\n\n';
      default:
        return '';
    }
  };

  // Handle double click to rename
  const handleFileClick = (node: FileNode) => {
    const now = Date.now();
    const timeDiff = now - lastClickTime.current;
    
    if (timeDiff < 300 && lastClickedFile.current === node.path) {
      // Double click detected
      if (node.type === 'file') {
        setRenamingFile(node);
        setRenameValue(node.name);
      }
    } else {
      // Single click
      if (node.type === 'folder') {
        toggleFolder(node.path);
        setSelectedFolderPath(node.path);
      } else {
        onFileSelect(node);
      }
    }
    
    lastClickTime.current = now;
    lastClickedFile.current = node.path;
  };

  // Delete file/folder
  const handleDelete = (node: FileNode) => {
    if (confirm(`¿Estás seguro de que quieres eliminar "${node.name}"?`)) {
      const updatedFileSystem = deleteFileFromTree(fileSystem, node.path);
      updateFileSystem(updatedFileSystem);
    }
  };

  const deleteFileFromTree = (tree: FileNode[], targetPath: string): FileNode[] => {
    return tree.filter(node => {
      if (node.path === targetPath) {
        return false;
      }
      if (node.type === 'folder' && node.children) {
        node.children = deleteFileFromTree(node.children, targetPath);
      }
      return true;
    });
  };

  // Rename file/folder
  const handleRename = (oldNode: FileNode, newName: string) => {
    if (!newName.trim() || newName === oldNode.name) {
      setRenamingFile(null);
      return;
    }

    const pathParts = oldNode.path.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');

    const updatedFileSystem = renameFileInTree(fileSystem, oldNode.path, newName, newPath);
    updateFileSystem(updatedFileSystem);
    setRenamingFile(null);
  };

  const renameFileInTree = (tree: FileNode[], oldPath: string, newName: string, newPath: string): FileNode[] => {
    return tree.map(node => {
      if (node.path === oldPath) {
        return { ...node, name: newName, path: newPath };
      }
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: renameFileInTree(node.children, oldPath, newName, newPath)
        };
      }
      return node;
    });
  };

  // Get file metadata
  const getFileMetadata = (node: FileNode): FileMetadata => {
    const content = node.content || '';
    const size = new Blob([content]).size;
    const lines = content.split('\n').length;
    const extension = node.name.split('.').pop()?.toLowerCase() || '';
    
    return {
      size,
      created: new Date(), // In real app, this would come from file system
      modified: new Date(),
      type: extension,
      lines: node.type === 'file' ? lines : undefined
    };
  };

  // Show file info
  const handleShowInfo = (node: FileNode) => {
    setContextMenuFile(node);
    setFileMetadata(getFileMetadata(node));
    setShowInfoDialog(true);
  };

  // Show history
  const handleShowHistory = (node: FileNode) => {
    setContextMenuFile(node);
    // In real app, this would come from version control
    setFileHistory([
      { timestamp: new Date(), action: 'Creado', size: getFileMetadata(node).size },
      { timestamp: new Date(Date.now() - 3600000), action: 'Modificado', size: getFileMetadata(node).size - 100 },
    ]);
    setShowHistoryDialog(true);
  };

  // AI actions
  const handleAIAction = (node: FileNode, action: 'consult' | 'analyze' | 'improve') => {
    onAIConsult?.(node, action);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

  const countFilteredFiles = (nodes: FileNode[], term: string): number => {
    let count = 0;
    for (const node of nodes) {
      if (node.name.toLowerCase().includes(term.toLowerCase())) {
        count++;
      }
      if (node.type === 'folder' && node.children) {
        count += countFilteredFiles(node.children, term);
      }
    }
    return count;
  };

  const hasSearchResults = searchTerm ? countFilteredFiles(fileSystem, searchTerm) > 0 : true;

  const renderFileTree = (nodes: FileNode[], depth = 0, parentPath = '/') => {
    return nodes
      .filter(node => 
        searchTerm === '' || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(node => {
        const isRenaming = renamingFile?.path === node.path;
        
        return (
          <div key={node.path}>
            <ContextMenu>
              <ContextMenuTrigger>
                <div
                  className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-accent/50 transition-colors group ${
                    selectedFile?.path === node.path ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  style={{ paddingLeft: `${8 + depth * 16}px` }}
                  onClick={() => handleFileClick(node)}
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
                  
                  {isRenaming ? (
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(node, renameValue)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRename(node, renameValue);
                        } else if (e.key === 'Escape') {
                          setRenamingFile(null);
                        }
                      }}
                      className="h-5 text-xs flex-1 px-1"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className="text-sm truncate flex-1">{node.name}</span>
                      {node.name.endsWith('.js') && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          JS
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </ContextMenuTrigger>
              
              <ContextMenuContent className="w-64 bg-background/95 backdrop-blur-sm border-border">
                <ContextMenuItem onClick={() => {
                  setRenamingFile(node);
                  setRenameValue(node.name);
                }} className="gap-2 cursor-pointer">
                  <Edit3 className="w-4 h-4 text-ps2-cyan" />
                  <span>Renombrar</span>
                  <span className="ml-auto text-xs text-muted-foreground">F2</span>
                </ContextMenuItem>
                
                <ContextMenuItem onClick={() => handleDelete(node)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                  <span className="ml-auto text-xs text-muted-foreground">Del</span>
                </ContextMenuItem>
                
                <ContextMenuSeparator />
                
                <ContextMenuItem onClick={() => handleShowInfo(node)} className="gap-2 cursor-pointer">
                  <Info className="w-4 h-4 text-ps2-blue" />
                  <span>Información</span>
                </ContextMenuItem>
                
                <ContextMenuItem onClick={() => handleShowHistory(node)} className="gap-2 cursor-pointer">
                  <History className="w-4 h-4 text-ps2-purple" />
                  <span>Historial de cambios</span>
                </ContextMenuItem>
                
                {node.type === 'file' && (
                  <>
                    <ContextMenuSeparator />
                    
                    <ContextMenuItem onClick={() => handleAIAction(node, 'consult')} className="gap-2 cursor-pointer">
                      <MessageSquare className="w-4 h-4 text-ps2-green" />
                      <span>Consultar con IA</span>
                    </ContextMenuItem>
                    
                    <ContextMenuItem onClick={() => handleAIAction(node, 'analyze')} className="gap-2 cursor-pointer">
                      <Sparkles className="w-4 h-4 text-ps2-orange" />
                      <span>Analizar con IA</span>
                    </ContextMenuItem>
                    
                    <ContextMenuItem onClick={() => handleAIAction(node, 'improve')} className="gap-2 cursor-pointer">
                      <Sparkles className="w-4 h-4 text-ps2-cyan" />
                      <span>Mejorar con IA</span>
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
            
            {node.type === 'folder' && 
             expandedFolders.has(node.path) && 
             node.children && 
             renderFileTree(node.children, depth + 1, node.path)}
          </div>
        );
      });
  };

  return (
    <Card className="h-full flex flex-col ide-sidebar">
      {/* Explorer Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">File Explorer</h3>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setShowNewFileDialog(true)}
              title="Crear nuevo archivo"
            >
              <File className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setShowNewFolderDialog(true)}
              title="Crear nueva carpeta"
            >
              <FolderOpen className="w-3 h-3" />
            </Button>
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
              onClick={() => {
                setFileSystem([]);
                updateFileSystem([]);
              }}
              title="Limpiar proyecto"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* New File Dialog */}
        {showNewFileDialog && (
          <div className="mb-3 p-2 bg-muted rounded-md border border-border">
            <div className="flex items-center gap-2 mb-2">
              <File className="w-4 h-4 text-ps2-cyan" />
              <span className="text-sm font-medium">Nuevo Archivo</span>
            </div>
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="nombre.js"
              className="mb-2 h-7 text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') setShowNewFileDialog(false);
              }}
              autoFocus
            />
            <div className="flex gap-1">
              <Button 
                size="sm" 
                className="h-6 flex-1 text-xs bg-ps2-cyan hover:bg-ps2-cyan/90"
                onClick={handleCreateFile}
              >
                Crear
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                className="h-6 flex-1 text-xs"
                onClick={() => {
                  setShowNewFileDialog(false);
                  setNewFileName('');
                }}
              >
                Cancelar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Extensiones: .js .c .h .html .css .json .ini .cfg .jpg y más
            </p>
          </div>
        )}

        {/* New Folder Dialog */}
        {showNewFolderDialog && (
          <div className="mb-3 p-2 bg-muted rounded-md border border-border">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-ps2-blue" />
              <span className="text-sm font-medium">Nueva Carpeta</span>
            </div>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="nombre-carpeta"
              className="mb-2 h-7 text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setShowNewFolderDialog(false);
              }}
              autoFocus
            />
            <div className="flex gap-1">
              <Button 
                size="sm" 
                className="h-6 flex-1 text-xs bg-ps2-blue hover:bg-ps2-blue/90"
                onClick={handleCreateFolder}
              >
                Crear
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                className="h-6 flex-1 text-xs"
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {fileSystem.length > 0 && (
          <div className="flex gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-7 gap-2"
              onClick={() => {/* Save functionality */}}
            >
              <Save className="w-3 h-3" />
              <span className="text-xs">Guardar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-7 gap-2 border-ps2-purple/50 text-ps2-purple hover:bg-ps2-purple/10"
              onClick={handleExportProject}
            >
              <Download className="w-3 h-3" />
              <span className="text-xs">Exportar</span>
            </Button>
          </div>
        )}
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Buscar archivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-7 pr-7 h-7 text-xs transition-colors ${
              searchTerm && !hasSearchResults 
                ? 'border-destructive/50 focus-visible:ring-destructive/50' 
                : searchTerm && hasSearchResults 
                ? 'border-ps2-purple/50 focus-visible:ring-ps2-purple/50'
                : ''
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-accent rounded p-0.5 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        
        {searchTerm && !hasSearchResults && fileSystem.length > 0 && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
            <div className="flex items-center gap-2">
              <SearchX className="w-3 h-3 flex-shrink-0" />
              <span>No se encontró "{searchTerm}"</span>
            </div>
          </div>
        )}
        
        {searchTerm && hasSearchResults && fileSystem.length > 0 && (
          <div className="mt-2 p-2 bg-ps2-purple/10 border border-ps2-purple/20 rounded text-xs text-ps2-purple">
            <div className="flex items-center gap-2">
              <Search className="w-3 h-3 flex-shrink-0" />
              <span>{countFilteredFiles(fileSystem, searchTerm)} resultado(s) encontrado(s)</span>
            </div>
          </div>
        )}
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
        ) : searchTerm && !hasSearchResults ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <SearchX className="w-12 h-12 text-destructive/50 mb-3" />
            <p className="text-sm text-destructive mb-2">
              Archivo no encontrado
            </p>
            <p className="text-xs text-muted-foreground/70 mb-4">
              No se encontró ningún archivo que coincida con "{searchTerm}"
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSearchTerm('')}
            >
              <X className="w-3 h-3 mr-2" />
              Limpiar búsqueda
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

      {/* File Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-sm border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-ps2-blue" />
              Información del archivo
            </DialogTitle>
            <DialogDescription>
              Detalles y metadatos de {contextMenuFile?.name}
            </DialogDescription>
          </DialogHeader>
          
          {fileMetadata && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{contextMenuFile?.name}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="outline" className="text-xs">{fileMetadata.type.toUpperCase()}</Badge>
              </div>
              
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Tamaño:</span>
                <span className="font-mono text-xs">{formatBytes(fileMetadata.size)}</span>
              </div>
              
              {fileMetadata.lines && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Líneas:</span>
                  <span className="font-mono text-xs">{fileMetadata.lines}</span>
                </div>
              )}
              
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Creado:</span>
                <span className="text-xs">{fileMetadata.created.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Modificado:</span>
                <span className="text-xs">{fileMetadata.modified.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* File History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-sm border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-ps2-purple" />
              Historial de cambios
            </DialogTitle>
            <DialogDescription>
              Registro de modificaciones de {contextMenuFile?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fileHistory.map((entry, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg border border-border/50">
                <div className="w-2 h-2 rounded-full bg-ps2-purple"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{entry.action}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatBytes(entry.size)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.timestamp.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            
            {fileHistory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay historial disponible</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}