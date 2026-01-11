import { useState, useCallback, useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ImageViewer } from './ImageViewer';
import { PS2Preview } from './PS2Preview';
import { IDEHeader } from './IDEHeader';
import { IDEStatusBar } from './IDEStatusBar';
import { FloatingWindow } from './FloatingWindow';
import { AIDeveloperChat } from './AIDeveloperChat';
import { IDETerminal } from './IDETerminal';
import { FileNode } from '@/types/athena';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, GripVertical, GitBranch, Terminal, Loader2, 
  HelpCircle, Copy, CheckCircle2, XCircle, ExternalLink, Download, FileArchive 
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
  
  const defaultFile: FileNode = {
    name: 'main.js',
    type: 'file',
    path: '/main.js',
    content: '// Welcome to ATHENA ENV SDK for PlayStation 2\n// Enhanced JavaScript environment for PS2 homebrew development\n\n// {"name": "My PS2 App", "author": "Developer", "version": "1.0.0", "icon": "icon.png", "file": "main.js"}\n\nconst font = new Font("default");\nlet frameCount = 0;\n\nos.setInterval(() => {\n  Screen.clear(Color.new(0, 32, 64, 255));\n  \n  // Draw title\n  font.print(50, 50, "ATHENA ENV SDK Demo");\n  font.print(50, 80, "Frame: " + frameCount);\n  \n  // Draw some graphics\n  Draw.rect(200, 150, 240, 100, Color.new(128, 0, 255, 255));\n  Draw.circle(320, 200, 30, Color.new(0, 255, 128, 255));\n  \n  font.print(50, 350, "Press buttons on your controller!");\n  \n  frameCount++;\n  Screen.flip();\n}, 16);'
  };
  
  const [openTabsState, setOpenTabsState] = useState<FileNode[]>([defaultFile]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [code, setCode] = useState(defaultFile.content || '');
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

  const fileExplorerHeaderRef = useRef<HTMLDivElement>(null);
  const previewHeaderRef = useRef<HTMLDivElement>(null);

  const openTabs = openTabsState;
  const selectedFile = openTabs[activeTabIndex];

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
    if (openTabs.length === 1) return;
    
    const newTabs = openTabs.filter((_, idx) => idx !== index);
    setOpenTabs(newTabs);
    
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
    setCloneProgress(['Iniciando clonación...']);

    try {
      // Parse GitHub URL to get owner and repo
      const urlMatch = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
      if (!urlMatch) {
        throw new Error('URL de GitHub no válida. Formato esperado: https://github.com/owner/repo');
      }

      const [, owner, repoName] = urlMatch;
      const repo = repoName.replace(/\.git$/, ''); // Remove .git suffix if present

      setCloneProgress(prev => [...prev, `Conectando a GitHub: ${owner}/${repo}`]);
      setCloneProgress(prev => [...prev, 'Descargando repositorio via proxy...']);

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

      setCloneProgress(prev => [...prev, `Recibido: ${(data.size / 1024).toFixed(1)} KB`]);
      setCloneProgress(prev => [...prev, 'Procesando archivo ZIP...']);

      // Decode base64 to binary
      const binaryString = atob(data.zipData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const zip = new JSZip();
      const contents = await zip.loadAsync(bytes);

      setCloneProgress(prev => [...prev, `Encontrados ${Object.keys(contents.files).length} archivos`]);

      // Convert zip contents to FileNode structure
      const newFiles: FileNode[] = [];
      const rootFolderName = Object.keys(contents.files)[0]?.split('/')[0] || repo;

      for (const [path, zipEntry] of Object.entries(contents.files)) {
        // Remove the root folder prefix that GitHub adds
        const relativePath = path.replace(new RegExp(`^${rootFolderName}/?`), '');
        if (!relativePath) continue;

        if (zipEntry.dir) {
          // It's a folder
          newFiles.push({
            name: relativePath.replace(/\/$/, '').split('/').pop() || 'folder',
            type: 'folder',
            path: `/${relativePath.replace(/\/$/, '')}`,
            children: []
          });
        } else {
          // It's a file - try to read as text, handle binary files
          let content = '';
          try {
            content = await zipEntry.async('text');
          } catch {
            content = '[Binary file]';
          }
          newFiles.push({
            name: relativePath.split('/').pop() || 'file',
            type: 'file',
            path: `/${relativePath}`,
            content
          });
        }
      }

      // Build folder structure
      const buildTree = (files: FileNode[]): FileNode[] => {
        const root: FileNode[] = [];
        const folderMap = new Map<string, FileNode>();

        // Create all folders first
        files.filter(f => f.type === 'folder').forEach(folder => {
          folderMap.set(folder.path, { ...folder, children: [] });
        });

        // Process files
        files.filter(f => f.type === 'file').forEach(file => {
          const pathParts = file.path.split('/').filter(Boolean);
          if (pathParts.length === 1) {
            root.push(file);
          } else {
            const parentPath = '/' + pathParts.slice(0, -1).join('/');
            const parent = folderMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(file);
            } else {
              root.push(file);
            }
          }
        });

        // Build folder hierarchy
        folderMap.forEach((folder, path) => {
          const pathParts = path.split('/').filter(Boolean);
          if (pathParts.length === 1) {
            root.push(folder);
          } else {
            const parentPath = '/' + pathParts.slice(0, -1).join('/');
            const parent = folderMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(folder);
            }
          }
        });

        return root;
      };

      const fileTree = buildTree(newFiles);
      setCloneProgress(prev => [...prev, '✓ Estructura de archivos creada']);
      setCloneProgress(prev => [...prev, `✓ Clonación completada: ${repo}`]);

      setProjectFiles(fileTree);
      setFileSystemVersion(prev => prev + 1);
      setShowCloneDialog(false);
      setCloneUrl('');

      toast.success(`${repo} ha sido clonado exitosamente con ${newFiles.length} archivos`);

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
          onToggleFileExplorer={() => setShowFileExplorer(!showFileExplorer)}
          onToggleAIChat={() => toggleWindowVisibility('aiChat')}
          onTogglePreview={() => setShowPreview(!showPreview)}
          onToggleAIChatWindow={() => toggleWindowVisibility('aiChat')}
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
              {selectedFile && isImageFile(selectedFile.name) ? (
                <ImageViewer
                  imageData={selectedFile.content || ''}
                  filename={selectedFile.name}
                />
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
                />
              )}
            </ResizablePanel>
            
            {showPreview && windows.preview.docked && windows.preview.visible && (
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

            {windows.aiChat && windows.aiChat.docked && windows.aiChat.visible && (
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
          selectedFile={selectedFile.name}
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
            onProjectLoad={setProjectFiles}
            onFileSystemUpdate={handleFileSystemUpdate}
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

      {!windows.preview.docked && windows.preview.visible && (
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

      {windows.aiChat && !windows.aiChat.docked && windows.aiChat.visible && (
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
          />
        </div>
      )}
    </>
  );
}
