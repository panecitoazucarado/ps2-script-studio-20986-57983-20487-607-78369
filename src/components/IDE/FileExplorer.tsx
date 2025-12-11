import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Sparkles,
  FolderPlus,
  Upload,
  FileCode,
  FileJson,
  FileType,
  Code2,
  Package,
  MoreVertical,
  Copy,
  ClipboardPaste,
  Eye,
  FilePlus2
} from 'lucide-react';
import JSZip from 'jszip';
import { FileNode } from '@/types/athena';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
  onProjectLoad?: (files: FileNode[]) => void;
  onFileSystemUpdate?: (files: FileNode[]) => void;
  onAIConsult?: (file: FileNode, action: 'consult' | 'analyze' | 'improve') => void;
  externalFileSystem?: FileNode[];
}

interface FileMetadata {
  size: number;
  created: Date;
  modified: Date;
  type: string;
  lines?: number;
  encoding?: string;
}

interface FileHistory {
  timestamp: Date;
  action: string;
  size: number;
  user?: string;
}

// Templates for different file types
const fileTemplates: Record<string, { content: string; description: string }> = {
  'js': { content: '// ATHENA ENV JavaScript\n\nfunction main() {\n    console.log("Hello, PS2!");\n}\n\nmain();\n', description: 'JavaScript' },
  'ts': { content: '// TypeScript file\n\ninterface Config {\n    name: string;\n}\n\nconst config: Config = {\n    name: "ATHENA"\n};\n', description: 'TypeScript' },
  'c': { content: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, PS2!\\n");\n    return 0;\n}\n', description: 'C Source' },
  'cpp': { content: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, PS2!" << std::endl;\n    return 0;\n}\n', description: 'C++ Source' },
  'h': { content: '#ifndef HEADER_H\n#define HEADER_H\n\n// Header declarations\n\n#endif // HEADER_H\n', description: 'C/C++ Header' },
  'hpp': { content: '#ifndef HEADER_HPP\n#define HEADER_HPP\n\nclass MyClass {\npublic:\n    MyClass();\n    ~MyClass();\n};\n\n#endif // HEADER_HPP\n', description: 'C++ Header' },
  'html': { content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    \n</body>\n</html>\n', description: 'HTML' },
  'css': { content: '/* Stylesheet */\n\n* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n', description: 'CSS' },
  'json': { content: '{\n    "name": "project",\n    "version": "1.0.0"\n}\n', description: 'JSON' },
  'xml': { content: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n    \n</root>\n', description: 'XML' },
  'lua': { content: '-- Lua Script\n\nfunction init()\n    print("Hello from Lua!")\nend\n\ninit()\n', description: 'Lua Script' },
  'py': { content: '#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n', description: 'Python' },
  'sh': { content: '#!/bin/bash\n\necho "Hello, PS2!"\n', description: 'Shell Script' },
  'md': { content: '# Project Title\n\n## Description\n\nWrite your description here.\n', description: 'Markdown' },
  'txt': { content: '', description: 'Text File' },
  'ini': { content: '# Configuration file\n\n[General]\nname = ATHENA\nversion = 1.0\n', description: 'INI Config' },
  'cfg': { content: '# Configuration\n\n', description: 'Config File' },
  'cnf': { content: '# PCSX2 Configuration\n\n', description: 'Config File' },
  'glsl': { content: '#version 330 core\n\nvoid main() {\n    // Shader code\n}\n', description: 'GLSL Shader' },
  'vert': { content: '#version 330 core\n\nlayout(location = 0) in vec3 aPos;\n\nvoid main() {\n    gl_Position = vec4(aPos, 1.0);\n}\n', description: 'Vertex Shader' },
  'frag': { content: '#version 330 core\n\nout vec4 FragColor;\n\nvoid main() {\n    FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n}\n', description: 'Fragment Shader' },
  'elf': { content: '', description: 'ELF Executable' },
  'irx': { content: '', description: 'IRX Module' },
};

export function FileExplorer({ 
  onFileSelect, 
  selectedFile, 
  onProjectLoad, 
  onFileSystemUpdate, 
  onAIConsult,
  externalFileSystem 
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([]));
  const [searchTerm, setSearchTerm] = useState('');
  const [fileSystem, setFileSystem] = useState<FileNode[]>([]);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('/');
  const [isDragging, setIsDragging] = useState(false);
  
  // Context menu & rename states
  const [renamingFile, setRenamingFile] = useState<FileNode | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenuFile, setContextMenuFile] = useState<FileNode | null>(null);
  const [clipboard, setClipboard] = useState<{ node: FileNode; operation: 'copy' | 'cut' } | null>(null);
  
  // Dialog states
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [fileHistory, setFileHistory] = useState<FileHistory[]>([]);
  
  // Double click detection
  const lastClickTime = useRef<number>(0);
  const lastClickedFile = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync with external file system
  useEffect(() => {
    if (externalFileSystem) {
      setFileSystem(externalFileSystem);
    }
  }, [externalFileSystem]);

  // Get all files recursively for AI reading
  const getAllFilesContent = useCallback((): Array<{ path: string; content: string; type: string }> => {
    const files: Array<{ path: string; content: string; type: string }> = [];
    
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.content) {
          files.push({
            path: node.path,
            content: node.content,
            type: node.name.split('.').pop() || 'txt'
          });
        } else if (node.type === 'folder' && node.children) {
          traverse(node.children);
        }
      }
    };
    
    traverse(fileSystem);
    return files;
  }, [fileSystem]);

  // Expose to parent for AI access
  useEffect(() => {
    (window as any).__athenaFS = {
      getFiles: getAllFilesContent,
      createFile: (path: string, content: string) => handleAICreateFile(path, content),
      createFolder: (path: string) => handleAICreateFolder(path),
      updateFile: (path: string, content: string) => handleAIUpdateFile(path, content),
      deleteFile: (path: string) => handleAIDeleteFile(path),
      renameFile: (oldPath: string, newPath: string) => handleAIRenameFile(oldPath, newPath),
      readFile: (path: string) => handleAIReadFile(path),
      fileSystem: fileSystem
    };
  }, [fileSystem, getAllFilesContent]);

  // AI File Operations
  const handleAICreateFile = (path: string, content: string = '') => {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop() || 'newfile.txt';
    const folderPath = '/' + parts.join('/');
    
    const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'txt';
    const template = fileTemplates[ext || 'txt'];
    
    const newFile: FileNode = {
      name: fileName,
      type: 'file',
      path: path.startsWith('/') ? path : `/${path}`,
      content: content || template?.content || ''
    };

    // Create folders if they don't exist
    let updatedFS = [...fileSystem];
    if (folderPath && folderPath !== '/') {
      updatedFS = ensureFolderExists(updatedFS, folderPath);
    }

    updatedFS = addFileToTree(updatedFS, newFile, folderPath || '/');
    updateFileSystem(updatedFS);
    
    toast({
      title: "Archivo creado",
      description: `${fileName} creado por IA`,
    });
    
    return newFile;
  };

  const handleAICreateFolder = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    const folderName = parts.pop() || 'newfolder';
    const parentPath = '/' + parts.join('/');
    
    const newFolder: FileNode = {
      name: folderName,
      type: 'folder',
      path: path.startsWith('/') ? path : `/${path}`,
      children: []
    };

    let updatedFS = [...fileSystem];
    if (parentPath && parentPath !== '/') {
      updatedFS = ensureFolderExists(updatedFS, parentPath);
    }

    updatedFS = addFileToTree(updatedFS, newFolder, parentPath || '/');
    updateFileSystem(updatedFS);
    setExpandedFolders(prev => new Set([...prev, newFolder.path]));
    
    toast({
      title: "Carpeta creada",
      description: `${folderName} creada por IA`,
    });
    
    return newFolder;
  };

  const handleAIUpdateFile = (path: string, content: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const updatedFS = updateFileContentInTree(fileSystem, normalizedPath, content);
    updateFileSystem(updatedFS);
    
    toast({
      title: "Archivo actualizado",
      description: `${path.split('/').pop()} modificado por IA`,
    });
  };

  const handleAIDeleteFile = (path: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const updatedFS = deleteFileFromTree(fileSystem, normalizedPath);
    updateFileSystem(updatedFS);
    
    toast({
      title: "Archivo eliminado",
      description: `${path.split('/').pop()} eliminado por IA`,
    });
  };

  const handleAIRenameFile = (oldPath: string, newPath: string) => {
    const normalizedOldPath = oldPath.startsWith('/') ? oldPath : `/${oldPath}`;
    const normalizedNewPath = newPath.startsWith('/') ? newPath : `/${newPath}`;
    const newName = normalizedNewPath.split('/').pop() || '';
    
    const updatedFS = renameFileInTree(fileSystem, normalizedOldPath, newName, normalizedNewPath);
    updateFileSystem(updatedFS);
    
    toast({
      title: "Archivo renombrado",
      description: `Renombrado por IA`,
    });
  };

  const handleAIReadFile = (path: string): string | null => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const file = findFileByPath(fileSystem, normalizedPath);
    return file?.content || null;
  };

  const findFileByPath = (nodes: FileNode[], path: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.type === 'folder' && node.children) {
        const found = findFileByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const ensureFolderExists = (tree: FileNode[], folderPath: string): FileNode[] => {
    const parts = folderPath.split('/').filter(Boolean);
    let currentTree = tree;
    let currentPath = '';

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
      const existingFolder = currentTree.find(n => n.path === currentPath && n.type === 'folder');
      
      if (!existingFolder) {
        const newFolder: FileNode = {
          name: part,
          type: 'folder',
          path: currentPath,
          children: []
        };
        currentTree.push(newFolder);
        currentTree = newFolder.children!;
      } else {
        currentTree = existingFolder.children!;
      }
    }

    return tree;
  };

  const updateFileContentInTree = (tree: FileNode[], path: string, content: string): FileNode[] => {
    return tree.map(node => {
      if (node.path === path) {
        return { ...node, content };
      }
      if (node.type === 'folder' && node.children) {
        return { ...node, children: updateFileContentInTree(node.children, path, content) };
      }
      return node;
    });
  };

  const handleFolderImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (!files || files.length === 0) return;
      
      toast({
        title: "Importando proyecto...",
        description: `Cargando ${files.length} archivos`,
      });
      
      const fileTree = await buildFileTree(files);
      setFileSystem(fileTree);
      onProjectLoad?.(fileTree);
      
      const rootFolders = fileTree
        .filter(node => node.type === 'folder')
        .map(node => node.path);
      setExpandedFolders(new Set(rootFolders));
      
      toast({
        title: "Proyecto importado",
        description: `${files.length} archivos cargados exitosamente`,
      });
    };
    
    input.click();
  };

  const handleFilesImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (!files || files.length === 0) return;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await readFileContent(file);
        
        const newFile: FileNode = {
          name: file.name,
          type: 'file',
          path: selectedFolderPath === '/' ? `/${file.name}` : `${selectedFolderPath}/${file.name}`,
          content
        };
        
        const updatedFS = addFileToTree(fileSystem, newFile, selectedFolderPath);
        setFileSystem(updatedFS);
      }
      
      onFileSystemUpdate?.(fileSystem);
      toast({
        title: "Archivos importados",
        description: `${files.length} archivo(s) agregado(s)`,
      });
    };
    
    input.click();
  };

  const readFileContent = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    // Binary/image files
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tga', 'dds', 'tif', 'tiff'].includes(ext || '')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    
    // Text files
    return file.text();
  };

  const handleExportProject = async () => {
    if (fileSystem.length === 0) {
      toast({
        title: "Sin archivos",
        description: "No hay archivos para exportar",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Exportando...",
      description: "Preparando archivo ZIP",
    });

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
          
          if (node.content.startsWith('data:')) {
            const base64Data = node.content.split(',')[1];
            targetFolder.file(node.name, base64Data, { base64: true });
          } else {
            targetFolder.file(node.name, node.content);
          }
        }
      });
    };

    addFilesToZip(fileSystem);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'athena-project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Proyecto exportado",
      description: "ZIP descargado exitosamente",
    });
  };

  const buildFileTree = async (files: FileList): Promise<FileNode[]> => {
    const tree: { [key: string]: FileNode } = {};
    const rootNodes: FileNode[] = [];
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
          
          if (parentPath && tree[parentPath]) {
            tree[parentPath].children?.push(node);
          } else if (j === 0) {
            rootNodes.push(node);
          }
        }
      }
    }
    
    const readPromises: Promise<void>[] = [];
    const textExtensions = ['js', 'ts', 'jsx', 'tsx', 'txt', 'ini', 'cnf', 'cfg', 'json', 'lua', 'md', 'xml', 'css', 'html', 'c', 'cpp', 'h', 'hpp', 'glsl', 'vert', 'frag', 'py', 'sh', 'bat', 'ps1', 'yaml', 'yml', 'toml', 'makefile', 'dockerfile'];
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tga', 'dds', 'tif', 'tiff'];
    
    for (const [path, file] of fileDataMap.entries()) {
      const node = tree[path];
      if (!node) continue;
      
      const ext = node.name.split('.').pop()?.toLowerCase() || '';
      
      if (textExtensions.includes(ext) || node.name.toLowerCase() === 'makefile' || node.name.toLowerCase() === 'dockerfile') {
        readPromises.push(
          file.text()
            .then(content => { node.content = content; })
            .catch(err => console.error('Error reading:', node.name, err))
        );
      } else if (imageExtensions.includes(ext)) {
        readPromises.push(
          new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => { node.content = e.target?.result as string; resolve(); };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }).catch(err => console.error('Error reading image:', node.name, err))
        );
      }
    }
    
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
    const template = fileTemplates[extension || 'txt'];
    
    const newFile: FileNode = {
      name: newFileName,
      type: 'file',
      path: filePath,
      content: template?.content || ''
    };

    const updatedFileSystem = addFileToTree(fileSystem, newFile, selectedFolderPath);
    updateFileSystem(updatedFileSystem);
    setNewFileName('');
    setShowNewFileDialog(false);
    setShowQuickCreate(false);
    
    // Select the new file
    onFileSelect(newFile);
    
    toast({
      title: "Archivo creado",
      description: newFileName,
    });
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
    setShowQuickCreate(false);
    
    toast({
      title: "Carpeta creada",
      description: newFolderName,
    });
  };

  const handleQuickCreateFile = (extension: string) => {
    const ext = extension.replace('.', '');
    const template = fileTemplates[ext];
    const fileName = `untitled.${ext}`;
    const filePath = selectedFolderPath === '/' ? `/${fileName}` : `${selectedFolderPath}/${fileName}`;
    
    const newFile: FileNode = {
      name: fileName,
      type: 'file',
      path: filePath,
      content: template?.content || ''
    };

    const updatedFileSystem = addFileToTree(fileSystem, newFile, selectedFolderPath);
    updateFileSystem(updatedFileSystem);
    setShowQuickCreate(false);
    
    // Start renaming immediately
    setRenamingFile(newFile);
    setRenameValue(fileName);
    onFileSelect(newFile);
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

  // Handle double click to rename
  const handleFileClick = (node: FileNode) => {
    const now = Date.now();
    const timeDiff = now - lastClickTime.current;
    
    if (timeDiff < 300 && lastClickedFile.current === node.path) {
      if (node.type === 'file') {
        setRenamingFile(node);
        setRenameValue(node.name);
      }
    } else {
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

  const handleDelete = (node: FileNode) => {
    const updatedFileSystem = deleteFileFromTree(fileSystem, node.path);
    updateFileSystem(updatedFileSystem);
    toast({
      title: "Eliminado",
      description: node.name,
    });
  };

  const deleteFileFromTree = (tree: FileNode[], targetPath: string): FileNode[] => {
    return tree.filter(node => {
      if (node.path === targetPath) return false;
      if (node.type === 'folder' && node.children) {
        node.children = deleteFileFromTree(node.children, targetPath);
      }
      return true;
    });
  };

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

  const handleCopy = (node: FileNode) => {
    setClipboard({ node, operation: 'copy' });
    toast({ title: "Copiado", description: node.name });
  };

  const handleCut = (node: FileNode) => {
    setClipboard({ node, operation: 'cut' });
    toast({ title: "Cortado", description: node.name });
  };

  const handlePaste = () => {
    if (!clipboard) return;

    const newPath = selectedFolderPath === '/' 
      ? `/${clipboard.node.name}` 
      : `${selectedFolderPath}/${clipboard.node.name}`;

    const newNode: FileNode = {
      ...clipboard.node,
      path: newPath
    };

    let updatedFS = addFileToTree(fileSystem, newNode, selectedFolderPath);
    
    if (clipboard.operation === 'cut') {
      updatedFS = deleteFileFromTree(updatedFS, clipboard.node.path);
      setClipboard(null);
    }

    updateFileSystem(updatedFS);
    toast({ title: "Pegado", description: newNode.name });
  };

  const getFileMetadata = (node: FileNode): FileMetadata => {
    const content = node.content || '';
    const size = new Blob([content]).size;
    const lines = content.split('\n').length;
    const extension = node.name.split('.').pop()?.toLowerCase() || '';
    
    return {
      size,
      created: new Date(),
      modified: new Date(),
      type: extension,
      lines: node.type === 'file' ? lines : undefined,
      encoding: 'UTF-8'
    };
  };

  const handleShowInfo = (node: FileNode) => {
    setContextMenuFile(node);
    setFileMetadata(getFileMetadata(node));
    setShowInfoDialog(true);
  };

  const handleShowHistory = (node: FileNode) => {
    setContextMenuFile(node);
    setFileHistory([
      { timestamp: new Date(), action: 'Modificado', size: getFileMetadata(node).size, user: 'Usuario' },
      { timestamp: new Date(Date.now() - 3600000), action: 'Creado', size: getFileMetadata(node).size - 100, user: 'IA Developer' },
    ]);
    setShowHistoryDialog(true);
  };

  const handleShowPreview = (node: FileNode) => {
    setContextMenuFile(node);
    setShowPreviewDialog(true);
  };

  const handleAIAction = (node: FileNode, action: 'consult' | 'analyze' | 'improve') => {
    onAIConsult?.(node, action);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      return newSet;
    });
  };

  const getFileIcon = (file: FileNode, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    if (file.type === 'folder') {
      return <FolderOpen className={`${sizeClass} text-ps2-blue`} />;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return <FileCode className={`${sizeClass} text-yellow-400`} />;
      case 'ts':
      case 'tsx':
        return <FileCode className={`${sizeClass} text-blue-400`} />;
      case 'c':
      case 'cpp':
      case 'h':
      case 'hpp':
        return <Code2 className={`${sizeClass} text-purple-400`} />;
      case 'py':
        return <FileCode className={`${sizeClass} text-green-400`} />;
      case 'json':
        return <FileJson className={`${sizeClass} text-yellow-500`} />;
      case 'html':
        return <FileType className={`${sizeClass} text-orange-500`} />;
      case 'css':
        return <FileType className={`${sizeClass} text-blue-500`} />;
      case 'md':
        return <FileText className={`${sizeClass} text-gray-400`} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return <ImageIcon className={`${sizeClass} text-ps2-green`} />;
      case 'wav':
      case 'ogg':
      case 'mp3':
        return <Music className={`${sizeClass} text-ps2-orange`} />;
      case 'ini':
      case 'cnf':
      case 'cfg':
        return <Settings className={`${sizeClass} text-ps2-cyan`} />;
      case 'elf':
      case 'irx':
        return <Package className={`${sizeClass} text-ps2-purple`} />;
      default:
        return <File className={`${sizeClass} text-muted-foreground`} />;
    }
  };

  const countFiles = (nodes: FileNode[]): { files: number; folders: number } => {
    let files = 0, folders = 0;
    for (const node of nodes) {
      if (node.type === 'file') files++;
      else {
        folders++;
        if (node.children) {
          const counts = countFiles(node.children);
          files += counts.files;
          folders += counts.folders;
        }
      }
    }
    return { files, folders };
  };

  const filterFiles = (nodes: FileNode[], term: string): FileNode[] => {
    if (!term) return nodes;
    return nodes.filter(node => {
      if (node.name.toLowerCase().includes(term.toLowerCase())) return true;
      if (node.type === 'folder' && node.children) {
        return filterFiles(node.children, term).length > 0;
      }
      return false;
    });
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await readFileContent(file);
        
        const newFile: FileNode = {
          name: file.name,
          type: 'file',
          path: selectedFolderPath === '/' ? `/${file.name}` : `${selectedFolderPath}/${file.name}`,
          content
        };
        
        const updatedFS = addFileToTree(fileSystem, newFile, selectedFolderPath);
        setFileSystem(updatedFS);
      }
      
      onFileSystemUpdate?.(fileSystem);
      toast({
        title: "Archivos agregados",
        description: `${files.length} archivo(s)`,
      });
    }
  };

  const filteredFiles = filterFiles(fileSystem, searchTerm);
  const { files: totalFiles, folders: totalFolders } = countFiles(fileSystem);

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => {
      const isRenaming = renamingFile?.path === node.path;
      const isSelected = selectedFile?.path === node.path;
      
      return (
        <div key={node.path}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-all group ${
                  isSelected 
                    ? 'bg-ps2-purple/20 text-foreground border-l-2 border-ps2-purple' 
                    : 'hover:bg-accent/50 border-l-2 border-transparent'
                }`}
                style={{ paddingLeft: `${8 + depth * 12}px` }}
                onClick={() => handleFileClick(node)}
              >
                {node.type === 'folder' && (
                  <button className="p-0 h-auto opacity-60 hover:opacity-100 transition-opacity">
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
                      if (e.key === 'Enter') handleRename(node, renameValue);
                      else if (e.key === 'Escape') setRenamingFile(null);
                    }}
                    className="h-5 text-xs flex-1 px-1 py-0 bg-background"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm truncate flex-1">{node.name}</span>
                )}
                
                {/* Quick actions on hover */}
                <div className="hidden group-hover:flex items-center gap-0.5">
                  {node.type === 'folder' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFolderPath(node.path);
                        setShowNewFileDialog(true);
                      }}
                    >
                      <FilePlus2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent className="w-56 bg-background/95 backdrop-blur-xl border-border">
              <ContextMenuItem onClick={() => {
                setRenamingFile(node);
                setRenameValue(node.name);
              }} className="gap-2 cursor-pointer">
                <Edit3 className="w-4 h-4 text-ps2-cyan" />
                Renombrar
                <span className="ml-auto text-xs text-muted-foreground">F2</span>
              </ContextMenuItem>
              
              <ContextMenuItem onClick={() => handleCopy(node)} className="gap-2 cursor-pointer">
                <Copy className="w-4 h-4" />
                Copiar
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+C</span>
              </ContextMenuItem>
              
              <ContextMenuItem onClick={() => handleCut(node)} className="gap-2 cursor-pointer">
                <X className="w-4 h-4" />
                Cortar
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+X</span>
              </ContextMenuItem>
              
              {clipboard && (
                <ContextMenuItem onClick={handlePaste} className="gap-2 cursor-pointer">
                  <ClipboardPaste className="w-4 h-4" />
                  Pegar
                  <span className="ml-auto text-xs text-muted-foreground">Ctrl+V</span>
                </ContextMenuItem>
              )}
              
              <ContextMenuSeparator />
              
              <ContextMenuItem onClick={() => handleDelete(node)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4" />
                Eliminar
                <span className="ml-auto text-xs text-muted-foreground">Del</span>
              </ContextMenuItem>
              
              <ContextMenuSeparator />
              
              {node.type === 'file' && (
                <ContextMenuItem onClick={() => handleShowPreview(node)} className="gap-2 cursor-pointer">
                  <Eye className="w-4 h-4 text-ps2-green" />
                  Vista previa
                </ContextMenuItem>
              )}
              
              <ContextMenuItem onClick={() => handleShowInfo(node)} className="gap-2 cursor-pointer">
                <Info className="w-4 h-4 text-ps2-blue" />
                Información
              </ContextMenuItem>
              
              <ContextMenuItem onClick={() => handleShowHistory(node)} className="gap-2 cursor-pointer">
                <History className="w-4 h-4 text-ps2-purple" />
                Historial
              </ContextMenuItem>
              
              {node.type === 'file' && (
                <>
                  <ContextMenuSeparator />
                  
                  <ContextMenuSub>
                    <ContextMenuSubTrigger className="gap-2">
                      <Sparkles className="w-4 h-4 text-ps2-orange" />
                      Acciones IA
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48">
                      <ContextMenuItem onClick={() => handleAIAction(node, 'consult')} className="gap-2 cursor-pointer">
                        <MessageSquare className="w-4 h-4 text-ps2-green" />
                        Consultar
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleAIAction(node, 'analyze')} className="gap-2 cursor-pointer">
                        <Sparkles className="w-4 h-4 text-ps2-orange" />
                        Analizar
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleAIAction(node, 'improve')} className="gap-2 cursor-pointer">
                        <Sparkles className="w-4 h-4 text-ps2-cyan" />
                        Mejorar
                      </ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
          
          {node.type === 'folder' && 
           expandedFolders.has(node.path) && 
           node.children && 
           renderFileTree(node.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <Card 
      className={`h-full flex flex-col ide-sidebar overflow-hidden transition-all ${
        isDragging ? 'ring-2 ring-ps2-purple ring-inset' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-2 border-b border-border bg-gradient-to-r from-background to-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explorer</h3>
          <div className="flex gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowNewFileDialog(true)} className="gap-2">
                  <File className="w-4 h-4" />
                  Nuevo Archivo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)} className="gap-2">
                  <FolderPlus className="w-4 h-4" />
                  Nueva Carpeta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowQuickCreate(true)} className="gap-2">
                  <Sparkles className="w-4 h-4 text-ps2-purple" />
                  Creación Rápida
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleFolderImport} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Importar Proyecto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFilesImport} className="gap-2">
                  <FilePlus2 className="w-4 h-4" />
                  Importar Archivos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportProject} disabled={fileSystem.length === 0} className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar como ZIP
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setFileSystem([]); updateFileSystem([]); }} className="gap-2 text-destructive">
                  <RefreshCw className="w-4 h-4" />
                  Limpiar Proyecto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar archivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 pl-7 text-xs bg-background/50"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Create Panel */}
      {showQuickCreate && (
        <div className="p-2 border-b border-border bg-muted/30 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Creación Rápida</span>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setShowQuickCreate(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {['.js', '.c', '.h', '.lua', '.py', '.json', '.html', '.css'].map(ext => (
              <Button
                key={ext}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleQuickCreateFile(ext)}
              >
                {ext}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* New File Dialog Inline */}
      {showNewFileDialog && (
        <div className="p-2 border-b border-border bg-muted/30 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2">
            <File className="w-4 h-4 text-ps2-cyan" />
            <span className="text-xs font-medium">Nuevo Archivo</span>
          </div>
          <div className="flex gap-1">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="nombre.extensión"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') { setShowNewFileDialog(false); setNewFileName(''); }
              }}
              autoFocus
            />
            <Button size="sm" className="h-7 px-2" onClick={handleCreateFile}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setShowNewFileDialog(false); setNewFileName(''); }}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Carpeta: {selectedFolderPath}
          </p>
        </div>
      )}

      {/* New Folder Dialog Inline */}
      {showNewFolderDialog && (
        <div className="p-2 border-b border-border bg-muted/30 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2">
            <FolderPlus className="w-4 h-4 text-ps2-blue" />
            <span className="text-xs font-medium">Nueva Carpeta</span>
          </div>
          <div className="flex gap-1">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="nombre-carpeta"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') { setShowNewFolderDialog(false); setNewFolderName(''); }
              }}
              autoFocus
            />
            <Button size="sm" className="h-7 px-2" onClick={handleCreateFolder}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setShowNewFolderDialog(false); setNewFolderName(''); }}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {fileSystem.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Sin proyecto</p>
              <p className="text-xs text-muted-foreground/70 mb-4">
                Importa un proyecto o crea archivos
              </p>
              <div className="flex flex-col gap-2 w-full max-w-[160px]">
                <Button size="sm" variant="outline" className="gap-2" onClick={handleFolderImport}>
                  <Upload className="w-3 h-3" />
                  Importar
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowNewFileDialog(true)}>
                  <Plus className="w-3 h-3" />
                  Crear Archivo
                </Button>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <SearchX className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Sin resultados</p>
            </div>
          ) : (
            renderFileTree(filteredFiles)
          )}
        </div>
      </ScrollArea>

      {/* Footer Status */}
      {fileSystem.length > 0 && (
        <div className="p-2 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{totalFiles} archivos, {totalFolders} carpetas</span>
            {clipboard && (
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {clipboard.operation === 'copy' ? 'Copiado' : 'Cortado'}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-ps2-purple/10 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center">
            <Upload className="w-12 h-12 text-ps2-purple mx-auto mb-2" />
            <p className="text-sm font-medium">Soltar archivos aquí</p>
          </div>
        </div>
      )}

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {contextMenuFile && getFileIcon(contextMenuFile, 'md')}
              {contextMenuFile?.name}
            </DialogTitle>
            <DialogDescription>Información del archivo</DialogDescription>
          </DialogHeader>
          {fileMetadata && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Tipo</span>
                <span>{fileMetadata.type.toUpperCase() || 'Desconocido'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Tamaño</span>
                <span>{formatBytes(fileMetadata.size)}</span>
              </div>
              {fileMetadata.lines !== undefined && (
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Líneas</span>
                  <span>{fileMetadata.lines}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Codificación</span>
                <span>{fileMetadata.encoding}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Ruta</span>
                <span className="text-xs truncate max-w-[150px]">{contextMenuFile?.path}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-ps2-purple" />
              Historial
            </DialogTitle>
            <DialogDescription>{contextMenuFile?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {fileHistory.map((entry, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-ps2-purple/20 flex items-center justify-center">
                  {entry.user === 'IA Developer' ? (
                    <Sparkles className="w-4 h-4 text-ps2-purple" />
                  ) : (
                    <Edit3 className="w-4 h-4 text-ps2-cyan" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.user} • {entry.timestamp.toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{formatBytes(entry.size)}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {contextMenuFile && getFileIcon(contextMenuFile, 'md')}
              {contextMenuFile?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/30">
            {contextMenuFile?.content?.startsWith('data:image') ? (
              <img src={contextMenuFile.content} alt={contextMenuFile.name} className="max-w-full h-auto" />
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap">{contextMenuFile?.content || 'Sin contenido'}</pre>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
