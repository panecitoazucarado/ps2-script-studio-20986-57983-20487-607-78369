import { useState, useCallback, useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ImageViewer } from './ImageViewer';
import { PS2Preview } from './PS2Preview';
import { AthenaWelcomeTab } from './AthenaWelcomeTab';
import { IDEHeader } from './IDEHeader';
import { IDEStatusBar } from './IDEStatusBar';
import { FloatingWindow } from './FloatingWindow';
import { AIDeveloperChat } from './AIDeveloperChat';
import { IDETerminal } from './IDETerminal';
import { QuickCreateTemplates } from './QuickCreateTemplates';
import { PS2VisualBuilder } from './PS2VisualBuilder';
import { FileNode } from '@/types/athena';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, GripVertical, GitBranch, Terminal, Loader2, 
  HelpCircle, Copy, CheckCircle2, XCircle, ExternalLink, Download, FileArchive, Gamepad2 
} from 'lucide-react';
import { useWindowDocking } from '@/contexts/WindowDockingContext';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import JSZip from 'jszip';

export function IDELayoutContent() {
  const { windows, undockWindow, dockingEnabled, toggleWindowVisibility } = useWindowDocking();
  
  const welcomeTab: FileNode = {
    name: 'Bienvenida',
    type: 'file',
    path: '/__welcome__',
    content: ''
  };
  
  const [openTabsState, setOpenTabsState] = useState<FileNode[]>([welcomeTab]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);
  const [fileSystemVersion, setFileSystemVersion] = useState(0);
  
  // Clone repository state
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneUrl, setCloneUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState<string[]>([]);
  
  // Quick Create Templates state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateTargetFolder, setQuickCreateTargetFolder] = useState('/');
  
  // Visual Builder state
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);

  const fileExplorerHeaderRef = useRef<HTMLDivElement>(null);
  const previewHeaderRef = useRef<HTMLDivElement>(null);

  const openTabs = openTabsState;
  const selectedFile = openTabs[activeTabIndex] || null;
  const isWelcomeActive = selectedFile?.path === '/__welcome__';
  const hasNoTabs = openTabs.length === 0;

  const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const setOpenTabs = useCallback((updater: any) => {
    if (typeof updater === 'function') {
      setOpenTabsState((prev: FileNode[]) => updater(prev));
    } else {
      setOpenTabsState(updater);
    }
  }, []);

  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === 'file') {
      const existingTabIndex = openTabs.findIndex(tab => tab.path === file.path);
      
      if (existingTabIndex !== -1) {
        setActiveTabIndex(existingTabIndex);
        setCode(openTabs[existingTabIndex].content || '');
      } else {
        setOpenTabs((prev: FileNode[]) => [...prev, file]);
        setActiveTabIndex(openTabs.length);
        setCode(file.content || '');
      }
      setIsRunning(false);
    }
  }, [openTabs, setOpenTabs]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setOpenTabs((prev: FileNode[]) => prev.map((tab, idx) => 
      idx === activeTabIndex ? { ...tab, content: newCode } : tab
    ));
  }, [activeTabIndex, setOpenTabs]);

  const handleTabChange = useCallback((index: number) => {
    setActiveTabIndex(index);
    setCode(openTabs[index].content || '');
    setIsRunning(false);
  }, [openTabs]);

  const handleTabClose = useCallback((index: number) => {
    const newTabs = openTabs.filter((_, idx) => idx !== index);
    
    setOpenTabs(newTabs);
    
    if (newTabs.length === 0) {
      setActiveTabIndex(0);
      setCode('');
      return;
    }
    
    let newActiveIndex = activeTabIndex;
    if (activeTabIndex === index) {
      newActiveIndex = index > 0 ? index - 1 : 0;
    } else if (activeTabIndex > index) {
      newActiveIndex = activeTabIndex - 1;
    }
    
    setActiveTabIndex(newActiveIndex);
    setCode(newTabs[newActiveIndex].content || '');
  }, [openTabs, activeTabIndex, setOpenTabs]);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    setOpenTabs((prev: FileNode[]) => {
      const newTabs = [...prev];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return newTabs;
    });
    
    // Update active tab index after reordering
    if (activeTabIndex === fromIndex) {
      setActiveTabIndex(toIndex);
    } else if (activeTabIndex > fromIndex && activeTabIndex <= toIndex) {
      setActiveTabIndex(activeTabIndex - 1);
    } else if (activeTabIndex < fromIndex && activeTabIndex >= toIndex) {
      setActiveTabIndex(activeTabIndex + 1);
    }
  }, [activeTabIndex, setOpenTabs]);

  const handleFileRename = useCallback((index: number, newName: string) => {
    if (!newName.trim()) return;
    setOpenTabs((prev: FileNode[]) => prev.map((tab, idx) => 
      idx === index ? { ...tab, name: newName, path: tab.path.replace(tab.name, newName) } : tab
    ));
  }, [setOpenTabs]);

  const handleRun = useCallback(() => {
    setShowPreview(true);
    setIsRunning(true);
  }, []);

  const handleToggleRun = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  // Handle clone repository
  const handleOpenCloneDialog = useCallback(() => {
    setShowCloneDialog(true);
    setShowTerminal(true);
    setCloneProgress([]);
  }, []);

  const handleCloneRepository = useCallback(async (url?: string) => {
    const repoUrl = url || cloneUrl;
    if (!repoUrl.trim()) {
      toast.error("Por favor ingresa una URL de repositorio válida");
      return;
    }

    setIsCloning(true);
    setShowTerminal(true);
    
    // Professional git clone style output
    const startTime = Date.now();
    setCloneProgress([
      '',
      '\x1b[1;36m┌─────────────────────────────────────────────────────────────────┐\x1b[0m',
      '\x1b[1;36m│\x1b[0m  \x1b[1;37mATHENA IDE - Git Clone\x1b[0m                                         \x1b[1;36m│\x1b[0m',
      '\x1b[1;36m└─────────────────────────────────────────────────────────────────┘\x1b[0m',
      ''
    ]);

    try {
      // Parse GitHub URL to get owner and repo
      const urlMatch = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
      if (!urlMatch) {
        throw new Error('URL de GitHub no válida. Formato esperado: https://github.com/owner/repo');
      }

      const [, owner, repoName] = urlMatch;
      const repo = repoName.replace(/\.git$/, ''); // Remove .git suffix if present

      setCloneProgress(prev => [...prev, 
        `\x1b[1;33m$\x1b[0m git clone https://github.com/${owner}/${repo}.git`,
        '',
        `Cloning into '\x1b[1;36m${repo}\x1b[0m'...`,
        `remote: Enumerating objects... \x1b[2m(connecting)\x1b[0m`
      ]);

      // Use edge function to bypass CORS
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('clone-github-repo', {
        body: { owner, repo }
      });

      if (error) {
        throw new Error(error.message || 'Error al conectar con el servidor');
      }

      if (!data.success || !data.zipData) {
        throw new Error(data.error || 'No se recibieron datos del repositorio');
      }

      const sizeKB = (data.size / 1024).toFixed(2);
      const sizeMB = (data.size / (1024 * 1024)).toFixed(2);
      const sizeDisplay = data.size > 1024 * 1024 ? `${sizeMB} MiB` : `${sizeKB} KiB`;
      
      setCloneProgress(prev => [...prev, 
        `remote: Counting objects: \x1b[1;32mdone\x1b[0m`,
        `remote: Compressing objects: 100% \x1b[1;32mdone\x1b[0m`,
        `Receiving objects: 100% | \x1b[1;33m${sizeDisplay}\x1b[0m`,
        `Resolving deltas: 100% \x1b[1;32mdone\x1b[0m`,
        ''
      ]);
      setCloneProgress(prev => [...prev, 'Unpacking objects: \x1b[2m(processing archive)\x1b[0m']);

      // Decode base64 to binary
      const binaryString = atob(data.zipData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const zip = new JSZip();
      const contents = await zip.loadAsync(bytes);

      const totalEntries = Object.keys(contents.files).length;
      setCloneProgress(prev => [...prev, `Unpacking objects: 100% (${totalEntries}/${totalEntries}) \x1b[1;32mdone\x1b[0m`]);

      // Convert zip contents to FileNode tree (robust: creates missing intermediate folders)
      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rootFolderName = Object.keys(contents.files)[0]?.split('/')[0] || repo;

      const repoRoot: FileNode = {
        name: repo,
        type: 'folder',
        path: `/${repo}`,
        children: []
      };

      let fileCount = 0;
      let folderCount = 0;
      const fileTypes: Record<string, number> = {};
      const allFiles: string[] = [];

      const getOrCreateFolder = (parent: FileNode, folderName: string) => {
        parent.children ||= [];
        const folderPath = `${parent.path}/${folderName}`;
        const existing = parent.children.find(n => n.type === 'folder' && n.path === folderPath);
        if (existing) return existing;
        const created: FileNode = { name: folderName, type: 'folder', path: folderPath, children: [] };
        parent.children.push(created);
        folderCount++;
        return created;
      };

      for (const [entryPath, zipEntry] of Object.entries(contents.files)) {
        // Remove the GitHub zipball root folder prefix
        const relativePathRaw = entryPath.replace(new RegExp(`^${escapeRegExp(rootFolderName)}/?`), '');
        const relativePath = relativePathRaw.replace(/\\/g, '/');
        if (!relativePath) continue;

        const isDir = zipEntry.dir || relativePath.endsWith('/');
        const cleanPath = relativePath.replace(/\/$/, '');
        if (!cleanPath) continue;

        const parts = cleanPath.split('/').filter(Boolean);
        if (parts.length === 0) continue;

        // Walk / create folders
        let currentFolder = repoRoot;
        const folderParts = isDir ? parts : parts.slice(0, -1);
        for (const part of folderParts) {
          currentFolder = getOrCreateFolder(currentFolder, part);
        }

        if (isDir) continue;

        // Create file
        const fileName = parts[parts.length - 1];
        const filePath = `${currentFolder.path}/${fileName}`;

        // Track file extension
        const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || 'other' : 'no-ext';
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        allFiles.push(cleanPath);

        // Avoid duplicates
        currentFolder.children ||= [];
        if (currentFolder.children.some(n => n.type === 'file' && n.path === filePath)) continue;

        let content = '';
        try {
          content = await zipEntry.async('text');
        } catch {
          content = '[Binary file]';
        }

        currentFolder.children.push({
          name: fileName,
          type: 'file',
          path: filePath,
          content
        });

        fileCount++;
      }

      const sortTree = (nodes: FileNode[]) => {
        nodes.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        nodes.forEach(n => {
          if (n.type === 'folder' && n.children) sortTree(n.children);
        });
      };

      sortTree(repoRoot.children || []);

      // Calculate elapsed time
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      // Build file tree preview (show first few items)
      const buildTreePreview = (node: FileNode, prefix = '', isLast = true, depth = 0): string[] => {
        if (depth > 3) return []; // Limit depth
        const lines: string[] = [];
        const connector = isLast ? '└── ' : '├── ';
        const icon = node.type === 'folder' ? '\x1b[1;34m📁\x1b[0m' : '\x1b[0;37m📄\x1b[0m';
        const nameColor = node.type === 'folder' ? '\x1b[1;34m' : '\x1b[0;37m';
        lines.push(`${prefix}${connector}${icon} ${nameColor}${node.name}\x1b[0m`);
        
        if (node.type === 'folder' && node.children) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          const visibleChildren = node.children.slice(0, 5);
          const hasMore = node.children.length > 5;
          
          visibleChildren.forEach((child, idx) => {
            const childIsLast = idx === visibleChildren.length - 1 && !hasMore;
            lines.push(...buildTreePreview(child, newPrefix, childIsLast, depth + 1));
          });
          
          if (hasMore) {
            lines.push(`${newPrefix}└── \x1b[2m... and ${node.children.length - 5} more\x1b[0m`);
          }
        }
        return lines;
      };

      // Get sorted file type stats
      const sortedTypes = Object.entries(fileTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      const typeStatsLines = sortedTypes.map(([ext, count]) => {
        const bar = '█'.repeat(Math.min(Math.ceil(count / fileCount * 20), 20));
        const pct = ((count / fileCount) * 100).toFixed(1);
        return `  \x1b[0;36m.${ext.padEnd(12)}\x1b[0m ${String(count).padStart(4)} files \x1b[0;32m${bar}\x1b[0m ${pct}%`;
      });

      // Build tree preview from root
      const treeLines = repoRoot.children ? 
        repoRoot.children.slice(0, 8).flatMap((child, idx) => 
          buildTreePreview(child, '', idx === Math.min(repoRoot.children!.length - 1, 7), 0)
        ) : [];

      if (repoRoot.children && repoRoot.children.length > 8) {
        treeLines.push(`└── \x1b[2m... and ${repoRoot.children.length - 8} more items\x1b[0m`);
      }

      setCloneProgress(prev => [...prev, 
        '',
        '\x1b[1;32m✓\x1b[0m Clone completed successfully!',
        '',
        '\x1b[1;36m┌─ Repository Statistics ─────────────────────────────────────────┐\x1b[0m',
        `\x1b[1;36m│\x1b[0m  Repository:    \x1b[1;37m${owner}/${repo}\x1b[0m`,
        `\x1b[1;36m│\x1b[0m  Total Files:   \x1b[1;33m${fileCount}\x1b[0m`,
        `\x1b[1;36m│\x1b[0m  Total Folders: \x1b[1;33m${folderCount}\x1b[0m`,
        `\x1b[1;36m│\x1b[0m  Download Size: \x1b[1;33m${sizeDisplay}\x1b[0m`,
        `\x1b[1;36m│\x1b[0m  Clone Time:    \x1b[1;33m${elapsed}s\x1b[0m`,
        '\x1b[1;36m└─────────────────────────────────────────────────────────────────┘\x1b[0m',
        '',
        '\x1b[1;35m┌─ File Types Breakdown ───────────────────────────────────────────┐\x1b[0m',
        ...typeStatsLines,
        '\x1b[1;35m└─────────────────────────────────────────────────────────────────┘\x1b[0m',
        '',
        `\x1b[1;34m┌─ Project Structure (${repo}/) ────────────────────────────────────┐\x1b[0m`,
        ...treeLines,
        '\x1b[1;34m└─────────────────────────────────────────────────────────────────┘\x1b[0m',
        '',
        `\x1b[1;32m$\x1b[0m cd ${repo}`,
        `\x1b[2mProject loaded into File Explorer. Ready to code! 🚀\x1b[0m`,
        ''
      ]);

      setProjectFiles([repoRoot]);
      setFileSystemVersion(prev => prev + 1);
      setShowCloneDialog(false);
      setCloneUrl('');

      toast.success(`${repo} ha sido clonado exitosamente con ${fileCount} archivos`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setCloneProgress(prev => [...prev, `✗ Error: ${errorMsg}`]);
      toast.error(errorMsg);
    } finally {
      setIsCloning(false);
    }
  }, [cloneUrl]);

  // Manejar actualizaciones del sistema de archivos
  const handleFileSystemUpdate = useCallback((newFiles: FileNode[]) => {
    setProjectFiles(newFiles);
    setFileSystemVersion(prev => prev + 1);
  }, []);

  // Effect to update file system after clone
  const handleCloneComplete = useCallback((fileTree: FileNode[]) => {
    setProjectFiles(fileTree);
    setFileSystemVersion(prev => prev + 1);
  }, []);

  // Aplicar código de la IA al archivo actual
  const handleApplyCodeToFile = useCallback((code: string, language: string) => {
    if (selectedFile) {
      setCode(code);
      setOpenTabs((prev: FileNode[]) => prev.map((tab, idx) => 
        idx === activeTabIndex ? { ...tab, content: code } : tab
      ));
      
      // Update in project files as well
      setProjectFiles(prev => updateFileInTree(prev, selectedFile.path, code));
      setFileSystemVersion(prev => prev + 1);
    }
  }, [selectedFile, activeTabIndex, setOpenTabs]);

  // Aplicar operaciones de archivos generadas por la IA
  const handleApplyFileOperations = useCallback((operations: any[]) => {
    let updatedFiles = [...projectFiles];

    operations.forEach(op => {
      switch (op.operation) {
        case 'create_file': {
          const newFile: FileNode = {
            name: op.path.split('/').pop() || 'untitled',
            type: 'file',
            path: op.path,
            content: op.content || ''
          };
          updatedFiles = addOrUpdateFileInTree(updatedFiles, newFile);
          
          // Abrir el archivo creado
          handleFileSelect(newFile);
          break;
        }
        case 'update_file': {
          updatedFiles = updateFileInTree(updatedFiles, op.path, op.content);
          
          // Actualizar tabs abiertos
          setOpenTabs(prev => prev.map(tab => 
            tab.path === op.path ? { ...tab, content: op.content } : tab
          ));
          if (selectedFile?.path === op.path) {
            setCode(op.content);
          }
          break;
        }
        case 'create_folder': {
          const newFolder: FileNode = {
            name: op.path.split('/').pop() || 'folder',
            type: 'folder',
            path: op.path,
            children: []
          };
          updatedFiles = addOrUpdateFileInTree(updatedFiles, newFolder);
          break;
        }
        case 'delete_file': {
          updatedFiles = deleteFileFromTree(updatedFiles, op.path);
          
          // Cerrar tab si está abierto
          const tabIndex = openTabs.findIndex(tab => tab.path === op.path);
          if (tabIndex !== -1) {
            handleTabClose(tabIndex);
          }
          break;
        }
        case 'rename_file': {
          updatedFiles = renameFileInTree(updatedFiles, op.oldPath, op.newPath);
          
          // Actualizar tabs abiertos
          setOpenTabs(prev => prev.map(tab => 
            tab.path === op.oldPath ? { ...tab, path: op.newPath, name: op.newPath.split('/').pop() || tab.name } : tab
          ));
          break;
        }
      }
    });

    handleFileSystemUpdate(updatedFiles);
  }, [projectFiles, handleFileSelect, selectedFile, openTabs, handleTabClose]);

  // Funciones auxiliares para manipular el árbol de archivos
  const addOrUpdateFileInTree = (tree: FileNode[], newNode: FileNode): FileNode[] => {
    const pathParts = newNode.path.split('/').filter(Boolean);
    if (pathParts.length === 1) {
      const existingIndex = tree.findIndex(n => n.path === newNode.path);
      if (existingIndex >= 0) {
        const updated = [...tree];
        updated[existingIndex] = newNode;
        return updated;
      }
      return [...tree, newNode];
    }

    return tree.map(node => {
      if (node.type === 'folder' && newNode.path.startsWith(node.path + '/')) {
        return {
          ...node,
          children: addOrUpdateFileInTree(node.children || [], newNode)
        };
      }
      return node;
    });
  };

  const updateFileInTree = (tree: FileNode[], path: string, content: string): FileNode[] => {
    return tree.map(node => {
      if (node.path === path && node.type === 'file') {
        return { ...node, content };
      } else if (node.type === 'folder' && node.children) {
        return { ...node, children: updateFileInTree(node.children, path, content) };
      }
      return node;
    });
  };

  const deleteFileFromTree = (tree: FileNode[], path: string): FileNode[] => {
    return tree.filter(node => {
      if (node.path === path) return false;
      if (node.type === 'folder' && node.children) {
        node.children = deleteFileFromTree(node.children, path);
      }
      return true;
    });
  };

  const renameFileInTree = (tree: FileNode[], oldPath: string, newPath: string): FileNode[] => {
    return tree.map(node => {
      if (node.path === oldPath) {
        return { ...node, path: newPath, name: newPath.split('/').pop() || node.name };
      } else if (node.type === 'folder' && node.children) {
        return { ...node, children: renameFileInTree(node.children, oldPath, newPath) };
      }
      return node;
    });
  };

  // Handle dragging to undock
  const handleFileExplorerDrag = (e: React.MouseEvent) => {
    if (!dockingEnabled) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      if (deltaX > 30 || deltaY > 30) {
        hasMoved = true;
      }
    };

    const handleUp = (upEvent: MouseEvent) => {
      if (hasMoved && windows.fileExplorer.docked) {
        undockWindow('fileExplorer', { x: upEvent.clientX - 200, y: upEvent.clientY - 20 });
        setShowFileExplorer(false);
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handlePreviewDrag = (e: React.MouseEvent) => {
    if (!dockingEnabled) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      if (deltaX > 30 || deltaY > 30) {
        hasMoved = true;
      }
    };

    const handleUp = (upEvent: MouseEvent) => {
      if (hasMoved && windows.preview.docked) {
        undockWindow('preview', { x: upEvent.clientX - 300, y: upEvent.clientY - 20 });
        setShowPreview(false);
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-background">
        <IDEHeader 
          showFileExplorer={showFileExplorer && windows.fileExplorer.docked}
          showPreview={showPreview && windows.preview.docked}
          showAIChat={windows.aiChat.visible}
          showTerminal={showTerminal}
          disablePreviewAndAI={isWelcomeActive || hasNoTabs}
          onToggleFileExplorer={() => setShowFileExplorer(!showFileExplorer)}
          onToggleAIChat={() => toggleWindowVisibility('aiChat')}
          onTogglePreview={() => setShowPreview(!showPreview)}
          onToggleAIChatWindow={() => toggleWindowVisibility('aiChat')}
          onToggleTerminal={() => setShowTerminal(!showTerminal)}
          onOpenQuickCreate={() => setShowQuickCreate(true)}
          onOpenVisualBuilder={() => setShowVisualBuilder(true)}
        />
        
        {/* Quick Create Templates Dialog */}
        <QuickCreateTemplates
          open={showQuickCreate}
          onOpenChange={setShowQuickCreate}
          targetFolder={quickCreateTargetFolder}
          onCreateFile={(extension, content) => {
            const fileName = `nuevo_archivo.${extension}`;
            const newFile: FileNode = {
              name: fileName,
              type: 'file',
              path: `${quickCreateTargetFolder}/${fileName}`,
              content
            };
            handleFileSelect(newFile);
            setProjectFiles(prev => [...prev, newFile]);
            setFileSystemVersion(prev => prev + 1);
            toast.success(`Archivo ${fileName} creado exitosamente`);
          }}
        />
        
        {/* PS2 Visual UI Builder */}
        <PS2VisualBuilder
          open={showVisualBuilder}
          onOpenChange={setShowVisualBuilder}
          onGenerateCode={(generatedCode) => {
            // Create a new file with the generated code or update current
            if (selectedFile && selectedFile.type === 'file') {
              // Update current file
              setCode(generatedCode);
              setOpenTabs((prev: FileNode[]) => prev.map((tab, idx) => 
                idx === activeTabIndex ? { ...tab, content: generatedCode } : tab
              ));
              setProjectFiles(prev => updateFileInTree(prev, selectedFile.path, generatedCode));
              toast.success('Código generado aplicado al archivo actual');
            } else {
              // Create new file
              const newFile: FileNode = {
                name: 'ui_generated.js',
                type: 'file',
                path: '/ui_generated.js',
                content: generatedCode
              };
              handleFileSelect(newFile);
              setProjectFiles(prev => [...prev, newFile]);
              setFileSystemVersion(prev => prev + 1);
              toast.success('Archivo ui_generated.js creado con el código generado');
            }
          }}
        />

        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="flex-row-reverse">
            {showFileExplorer && windows.fileExplorer.docked && windows.fileExplorer.visible && (
              <>
                <ResizablePanel 
                  defaultSize={20} 
                  minSize={12} 
                  maxSize={40}
                  collapsible
                  collapsedSize={0}
                  onCollapse={() => setShowFileExplorer(false)}
                >
                  <div className="h-full flex flex-col">
                    {/* Draggable header for undocking */}
                    <div 
                      ref={fileExplorerHeaderRef}
                      className="flex items-center gap-2 px-3 py-2 bg-ide-tab border-b border-border/50 cursor-move select-none hover:bg-ps2-cyan/5 transition-colors group"
                      onMouseDown={handleFileExplorerDrag}
                    >
                      <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-ps2-cyan transition-colors" />
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-ps2-cyan transition-colors">EXPLORADOR</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
          <FileExplorer 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            externalFileSystem={projectFiles}
            onProjectLoad={setProjectFiles}
            onFileSystemUpdate={handleFileSystemUpdate}
            onCloneRepository={handleOpenCloneDialog}
            onAIConsult={(file, action) => {
              if (!windows.aiChat.visible) {
                toggleWindowVisibility('aiChat');
              }
              setShowPreview(false);
              console.log(`AI ${action} requested for:`, file.name);
            }}
          />
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="w-1.5 bg-border/50 hover:bg-ps2-purple/50 transition-all duration-200 data-[resize-handle-state=hover]:w-2 data-[resize-handle-state=drag]:w-2 data-[resize-handle-state=drag]:bg-ps2-purple group relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:w-1.5 bg-ps2-purple/20 group-hover:bg-ps2-purple/40 transition-all" />
                </ResizableHandle>
              </>
            )}
            
            <ResizablePanel defaultSize={showFileExplorer && windows.fileExplorer.docked && windows.fileExplorer.visible ? 80 : 100}>
              <ResizablePanelGroup direction="horizontal" className="flex-row-reverse">
            <ResizablePanel 
              defaultSize={50} 
              minSize={30}
            >
              {hasNoTabs ? (
                <div className="h-full flex flex-col items-center justify-center bg-[hsl(var(--ide-editor))] text-muted-foreground">
                  <Gamepad2 className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-sm opacity-50">Abre un archivo para comenzar a editar</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-xs text-[hsl(var(--ps2-blue))] hover:text-[hsl(var(--ps2-blue))]"
                    onClick={() => {
                      setOpenTabsState([welcomeTab]);
                      setActiveTabIndex(0);
                    }}
                  >
                    Mostrar Bienvenida
                  </Button>
                </div>
              ) : (
                <CodeEditor
                  code={code}
                  onChange={handleCodeChange}
                  onRun={handleRun}
                  openTabs={openTabs}
                  activeTabIndex={activeTabIndex}
                  onTabChange={handleTabChange}
                  onTabClose={handleTabClose}
                  onFileRename={handleFileRename}
                  onTabReorder={handleTabReorder}
                  welcomeTabContent={
                    selectedFile?.path === '/__welcome__' ? (
                      <AthenaWelcomeTab
                        onCreateFile={(name, content) => {
                          const newFile: FileNode = { name, type: 'file', path: `/${name}`, content };
                          setProjectFiles(prev => [...prev, newFile]);
                          setFileSystemVersion(prev => prev + 1);
                          setOpenTabs((prev: FileNode[]) => [...prev, newFile]);
                          setActiveTabIndex(openTabs.length);
                          setCode(content);
                        }}
                        onCloneRepo={handleOpenCloneDialog}
                        onImportProject={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.webkitdirectory = true;
                          input.click();
                        }}
                        onOpenVisualBuilder={() => setShowVisualBuilder(true)}
                      />
                    ) : undefined
                  }
                  imageViewerContent={
                    selectedFile && isImageFile(selectedFile.name) ? (
                      <ImageViewer
                        imageData={selectedFile.content || ''}
                        filename={selectedFile.name}
                      />
                    ) : undefined
                  }
                />
              )}
            </ResizablePanel>
            
            {!isWelcomeActive && !hasNoTabs && showPreview && windows.preview.docked && windows.preview.visible && (
              <>
                <ResizableHandle withHandle className="w-1.5 bg-border/50 hover:bg-ps2-purple/50 transition-all duration-200 data-[resize-handle-state=hover]:w-2 data-[resize-handle-state=drag]:w-2 data-[resize-handle-state=drag]:bg-ps2-purple group relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:w-1.5 bg-ps2-purple/20 group-hover:bg-ps2-purple/40 transition-all" />
                </ResizableHandle>
                <ResizablePanel 
                  defaultSize={50} 
                  minSize={25}
                  maxSize={70}
                  collapsible
                  collapsedSize={0}
                  onCollapse={() => setShowPreview(false)}
                >
                  <div className="h-full flex flex-col">
                    {/* Draggable header for undocking */}
                    <div 
                      ref={previewHeaderRef}
                      className="flex items-center justify-between bg-muted/50 border-b border-border px-3 py-1.5 cursor-move select-none hover:bg-ps2-cyan/5 transition-colors group"
                      onMouseDown={handlePreviewDrag}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-ps2-cyan transition-colors" />
                        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span className="text-xs font-medium group-hover:text-ps2-cyan transition-colors">VISTA PREVIA PS2</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => setShowPreview(false)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <PS2Preview
                        code={code}
                        isRunning={isRunning}
                        onToggleRun={handleToggleRun}
                        files={projectFiles}
                      />
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}

            {!isWelcomeActive && !hasNoTabs && windows.aiChat && windows.aiChat.docked && windows.aiChat.visible && (
              <>
                <ResizableHandle withHandle className="w-1.5 bg-border/50 hover:bg-ps2-purple/50 transition-all duration-200 data-[resize-handle-state=hover]:w-2 data-[resize-handle-state=drag]:w-2 data-[resize-handle-state=drag]:bg-ps2-purple group relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:w-1.5 bg-ps2-purple/20 group-hover:bg-ps2-purple/40 transition-all" />
                </ResizableHandle>
                <ResizablePanel 
                  defaultSize={50} 
                  minSize={25}
                  maxSize={70}
                  collapsible
                  collapsedSize={0}
                  onCollapse={() => toggleWindowVisibility('aiChat')}
                >
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between bg-gradient-to-r from-ps2-purple/10 to-ps2-cyan/10 border-b border-border px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-ps2-purple animate-pulse" />
                        <span className="text-xs font-medium text-ps2-purple">IA DEVELOPER</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => toggleWindowVisibility('aiChat')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <AIDeveloperChat 
                        projectFiles={projectFiles}
                        onFileSystemChange={handleFileSystemUpdate}
                        onApplyFileOperations={handleApplyFileOperations}
                        onApplyCode={handleApplyCodeToFile}
                        currentFile={selectedFile}
                      />
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <IDEStatusBar 
          selectedFile={selectedFile?.name || 'Bienvenido'}
          isRunning={isRunning}
          lineCount={code.split('\n').length}
        />
      </div>

      {/* Floating Windows */}
      {!windows.fileExplorer.docked && windows.fileExplorer.visible && (
        <FloatingWindow
          id="fileExplorer"
          title="Explorador de Archivos"
          onClose={() => setShowFileExplorer(false)}
        >
          <FileExplorer 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            externalFileSystem={projectFiles}
            onProjectLoad={setProjectFiles}
            onFileSystemUpdate={handleFileSystemUpdate}
            onCloneRepository={handleOpenCloneDialog}
            onAIConsult={(file, action) => {
              if (!windows.aiChat.visible) {
                toggleWindowVisibility('aiChat');
              }
              setShowPreview(false);
              console.log(`AI ${action} requested for:`, file.name);
            }}
          />
        </FloatingWindow>
      )}

      {!isWelcomeActive && !hasNoTabs && !windows.preview.docked && windows.preview.visible && (
        <FloatingWindow
          id="preview"
          title="Vista Previa PS2"
          onClose={() => setShowPreview(false)}
        >
          <PS2Preview
            code={code}
            isRunning={isRunning}
            onToggleRun={handleToggleRun}
            files={projectFiles}
          />
        </FloatingWindow>
      )}

      {!isWelcomeActive && !hasNoTabs && windows.aiChat && !windows.aiChat.docked && windows.aiChat.visible && (
        <FloatingWindow
          id="aiChat"
          title="IA Developer - Asistente de Desarrollo"
          onClose={() => toggleWindowVisibility('aiChat')}
        >
          <AIDeveloperChat 
            projectFiles={projectFiles}
            onFileSystemChange={handleFileSystemUpdate}
            onApplyFileOperations={handleApplyFileOperations}
            onApplyCode={handleApplyCodeToFile}
            currentFile={selectedFile}
          />
        </FloatingWindow>
      )}

      {/* Clone Repository Dialog - GitHub Style */}
      <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <DialogContent className="max-w-lg bg-[#0d1117] border-[#30363d] p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-green-600 rounded">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">Clone</span>
            </div>
            <a 
              href="https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#8b949e] hover:text-[#58a6ff] transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </a>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-3">
            <Tabs defaultValue="https" className="w-full">
              <TabsList className="bg-transparent border-b border-[#30363d] rounded-none w-full justify-start gap-4 h-auto p-0">
                <TabsTrigger 
                  value="https" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f78166] rounded-none pb-2 px-0 text-[#8b949e] data-[state=active]:text-white font-medium"
                >
                  HTTPS
                </TabsTrigger>
                <TabsTrigger 
                  value="cli" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#f78166] rounded-none pb-2 px-0 text-[#8b949e] data-[state=active]:text-white font-medium"
                >
                  GitHub CLI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="https" className="mt-4 space-y-3">
                {/* URL Input with Copy Button */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden">
                    <Input
                      placeholder="https://github.com/usuario/repositorio.git"
                      value={cloneUrl}
                      onChange={(e) => setCloneUrl(e.target.value)}
                      disabled={isCloning}
                      onKeyDown={(e) => e.key === 'Enter' && !isCloning && handleCloneRepository()}
                      className="flex-1 bg-transparent border-0 text-[#c9d1d9] placeholder:text-[#484f58] focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-[#8b949e]"
                    onClick={() => {
                      navigator.clipboard.writeText(cloneUrl);
                      toast.success('URL copiada al portapapeles');
                    }}
                    disabled={!cloneUrl.trim()}
                  >
                    <Copy className="w-4 h-4 text-[#8b949e]" />
                  </Button>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Clone using the web URL.
                </p>
              </TabsContent>

              <TabsContent value="cli" className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden">
                    <Input
                      value={cloneUrl ? `gh repo clone ${cloneUrl.replace('https://github.com/', '').replace('.git', '')}` : 'gh repo clone usuario/repositorio'}
                      readOnly
                      className="flex-1 bg-transparent border-0 text-[#c9d1d9] placeholder:text-[#484f58] focus-visible:ring-0 focus-visible:ring-offset-0 h-9 font-mono text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-[#8b949e]"
                    onClick={() => {
                      const cliCommand = cloneUrl ? `gh repo clone ${cloneUrl.replace('https://github.com/', '').replace('.git', '')}` : '';
                      navigator.clipboard.writeText(cliCommand);
                      toast.success('Comando copiado al portapapeles');
                    }}
                    disabled={!cloneUrl.trim()}
                  >
                    <Copy className="w-4 h-4 text-[#8b949e]" />
                  </Button>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Work fast with the official CLI.{' '}
                  <a href="https://cli.github.com" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">
                    Learn more about the CLI
                  </a>
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Clone Progress */}
          {cloneProgress.length > 0 && (
            <div className="mx-4 mt-3 bg-[#161b22] border border-[#30363d] rounded-md p-3 max-h-32 overflow-auto">
              <div className="font-mono text-xs space-y-1">
                {cloneProgress.map((line, i) => (
                  <div key={i} className={`flex items-start gap-2 ${line.includes('✓') ? 'text-green-400' : line.includes('✗') ? 'text-red-400' : 'text-[#8b949e]'}`}>
                    {line.includes('✓') && <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                    {line.includes('✗') && <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                    {!line.includes('✓') && !line.includes('✗') && <Terminal className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                    <span>{line.replace('✓ ', '').replace('✗ ', '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          <div className="border-t border-[#30363d] mt-4" />

          {/* Additional Options */}
          <div className="px-4 py-3 space-y-1">
            <button
              onClick={() => {
                if (cloneUrl) {
                  window.open(cloneUrl.replace('.git', ''), '_blank');
                }
              }}
              disabled={!cloneUrl.trim()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-[#c9d1d9] hover:bg-[#21262d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-[#8b949e]" />
              <span className="text-sm">Open in GitHub</span>
            </button>
            <button
              onClick={() => handleCloneRepository()}
              disabled={isCloning || !cloneUrl.trim()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-[#c9d1d9] hover:bg-[#21262d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCloning ? (
                <Loader2 className="w-4 h-4 text-[#8b949e] animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#8b949e]" />
              )}
              <span className="text-sm">{isCloning ? 'Cloning repository...' : 'Clone to Athena IDE'}</span>
            </button>
            <button
              onClick={() => {
                if (cloneUrl) {
                  const downloadUrl = cloneUrl.replace('.git', '') + '/archive/refs/heads/main.zip';
                  window.open(downloadUrl, '_blank');
                }
              }}
              disabled={!cloneUrl.trim()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-[#c9d1d9] hover:bg-[#21262d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileArchive className="w-4 h-4 text-[#8b949e]" />
              <span className="text-sm">Download ZIP</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#30363d] bg-[#161b22]">
            <Button 
              variant="outline" 
              onClick={() => setShowCloneDialog(false)} 
              disabled={isCloning}
              className="bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:border-[#8b949e]"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleCloneRepository()} 
              disabled={isCloning || !cloneUrl.trim()} 
              className="bg-[#238636] hover:bg-[#2ea043] text-white border-0 gap-2"
            >
              {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
              {isCloning ? 'Cloning...' : 'Clone'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terminal Panel */}
      {showTerminal && (
        <div className="fixed bottom-0 left-0 right-0 h-64 z-40 border-t border-border shadow-lg">
          <IDETerminal 
            onClose={() => setShowTerminal(false)}
            onCloneRepository={handleCloneRepository}
            isCloning={isCloning}
            cloneProgress={cloneProgress}
            projectFiles={projectFiles}
            onDeleteFiles={(paths) => {
              // Remove files from projectFiles state
              setProjectFiles(prev => prev.filter(f => !paths.some(p => p === `/${f.name}` || p === f.name)));
              setFileSystemVersion(prev => prev + 1);
            }}
            onClearClonedData={() => {
              setProjectFiles([]);
              setFileSystemVersion(prev => prev + 1);
            }}
          />
        </div>
      )}
    </>
  );
}
