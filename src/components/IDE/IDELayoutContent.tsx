import { useState, useCallback, useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ImageViewer } from './ImageViewer';
import { PS2Preview } from './PS2Preview';
import { AthenaWelcomeTab } from './AthenaWelcomeTab';
import { AthenaAboutTab } from './AthenaAboutTab';
import { CreateProjectWizardTab, CreateProjectPayload } from './CreateProjectWizardTab';
import { loadAthenaBuild, buildIniContent, buildMainScript, buildHelloScript } from '@/lib/athena/builds';
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
  HelpCircle, Copy, CheckCircle2, XCircle, ExternalLink, Download, FileArchive, Gamepad2,
  Github, Info, Folder, Code2, Sparkles
} from 'lucide-react';
import { useWindowDocking } from '@/contexts/WindowDockingContext';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

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
  const isWelcomeActive = selectedFile?.path === '/__welcome__'
    || selectedFile?.path === '/__about__'
    || selectedFile?.path === '/__create_project__';
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

  const handleFileDelete = useCallback((filePath: string) => {
    const tabIndex = openTabs.findIndex(tab => tab.path === filePath);
    if (tabIndex !== -1) {
      handleTabClose(tabIndex);
    }
  }, [openTabs, handleTabClose]);

  const handleProjectClear = useCallback(() => {
    // Close all tabs that correspond to project files (keep internal tabs like welcome/about/wizard)
    const internalPaths = new Set(['/__welcome__', '/__about__', '/__create_project__']);
    setOpenTabsState(prev => {
      const remaining = prev.filter(t => internalPaths.has(t.path));
      return remaining.length > 0 ? remaining : [welcomeTab];
    });
    setActiveTabIndex(0);
    setCode('');
    setProjectFiles([]);
    setFileSystemVersion(v => v + 1);
  }, []);

  const handleFileRenameFromExplorer = useCallback((oldPath: string, newPath: string, newName: string) => {
    setOpenTabs((prev: FileNode[]) => prev.map(tab => 
      tab.path === oldPath ? { ...tab, path: newPath, name: newName } : tab
    ));
  }, [setOpenTabs]);

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

  // Open the "Create new project" wizard inside a VS Code-like tab
  const handleOpenCreateWizard = useCallback(() => {
    const wizardTab: FileNode = {
      name: 'Crear nuevo proyecto',
      type: 'file',
      path: '/__create_project__',
      content: ''
    };
    const existing = openTabs.findIndex(t => t.path === '/__create_project__');
    if (existing !== -1) {
      setActiveTabIndex(existing);
    } else {
      setOpenTabs((prev: FileNode[]) => [...prev, wizardTab]);
      setActiveTabIndex(openTabs.length);
    }
  }, [openTabs, setOpenTabs]);

  const handleCloseCreateWizard = useCallback(() => {
    const idx = openTabs.findIndex(t => t.path === '/__create_project__');
    if (idx !== -1) handleTabClose(idx);
  }, [openTabs, handleTabClose]);

  // Build & inject project from wizard payload
  const handleCreateProject = useCallback(async (payload: CreateProjectPayload) => {
    const { kind, build, defaultScript, projectName } = payload;
    const safeName = projectName.replace(/[^a-zA-Z0-9_\-]/g, '-') || 'mi-proyecto-ps2';
    const root = `/${safeName}`;
    const newFiles: FileNode[] = [];

    try {
      if (kind === 'lite') {
        // Single script project
        const mainContent = buildMainScript(defaultScript, safeName);
        newFiles.push({
          name: safeName,
          type: 'folder',
          path: root,
          children: [
            { name: defaultScript, type: 'file', path: `${root}/${defaultScript}`, content: mainContent },
          ]
        });
      } else {
        // full or hello — both need build
        if (!build) {
          toast.error('Debes elegir una versión de AthenaEnv.');
          return;
        }
        toast.loading('Empaquetando athena.elf y athena.ini...', { id: 'create-proj' });
        const loaded = await loadAthenaBuild(build);
        const iniContent = buildIniContent(defaultScript);
        const scriptContent = kind === 'hello'
          ? buildHelloScript(safeName)
          : buildMainScript(defaultScript, safeName);

        const children: FileNode[] = [
          { name: defaultScript, type: 'file', path: `${root}/${defaultScript}`, content: scriptContent },
          { name: 'athena.ini', type: 'file', path: `${root}/athena.ini`, content: iniContent },
          { name: 'athena.elf', type: 'file', path: `${root}/athena.elf`, content: `__BASE64__:${loaded.elfBase64}` },
          { name: 'README.md', type: 'file', path: `${root}/README.md`, content:
`# ${safeName}\n\nProyecto generado por **ATHENA STUDIOS** con el asistente.\n\n- Runtime: \`${loaded.versionLabel}\`\n- Script principal: \`${defaultScript}\`\n\n## ¿Cómo arranca tu juego?\n\n1. \`athena.elf\` se ejecuta en la PS2 (o en el preview).\n2. Lee \`athena.ini\` y mira la línea \`default_script = "${defaultScript}"\`.\n3. Carga ese script con QuickJS y lo ejecuta.\n\nCambia esa línea en \`athena.ini\` si quieres usar otro archivo .js como entrypoint.\n` },
        ];

        newFiles.push({
          name: safeName,
          type: 'folder',
          path: root,
          children
        });
        toast.dismiss('create-proj');
      }

      // Inject into project file system
      setProjectFiles(prev => [...prev, ...newFiles]);
      setFileSystemVersion(v => v + 1);

      // Close the wizard tab
      const wizIdx = openTabs.findIndex(t => t.path === '/__create_project__');
      let tabsAfterClose = openTabs;
      if (wizIdx !== -1) {
        tabsAfterClose = openTabs.filter((_, i) => i !== wizIdx);
      }

      // Open the main script in a tab
      const mainScriptNode = newFiles[0].children!.find(c => c.name === defaultScript)!;
      const newTabs = [...tabsAfterClose, mainScriptNode];
      setOpenTabsState(newTabs);
      setActiveTabIndex(newTabs.length - 1);
      setCode(mainScriptNode.content || '');

      toast.success(`Proyecto "${safeName}" creado correctamente`, {
        description: kind !== 'lite'
          ? `Se copiaron athena.elf y athena.ini en /${safeName}`
          : `Script ${defaultScript} listo para editar`,
      });

      // Floating teaching bubble about default_script
      if (kind !== 'lite') {
        setTimeout(() => {
          toast.message('💡 ¿Cómo funciona athena.ini?', {
            description: `La línea default_script = "${defaultScript}" dentro de athena.ini le dice a athena.elf qué archivo .js cargar al arrancar. Cámbiala si renombras tu script principal.`,
            duration: 12000,
          });
        }, 800);
      }
    } catch (err) {
      toast.dismiss('create-proj');
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudo crear el proyecto: ${msg}`);
    }
  }, [openTabs, setOpenTabsState]);

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
      // Parse and sanitize GitHub URL / command input
      const parseGitHubRepository = (input: string) => {
        let clean = input.trim()
          .replace(/^git\s+clone\s+/i, '')
          .replace(/^gh\s+repo\s+clone\s+/i, '')
          .replace(/^['"]|['"]$/g, '')
          .trim();

        // The terminal accepts pasted commands/comments, so keep only the repository token.
        clean = clean.split(/\s+/)[0]?.trim() || '';
        if (!clean) {
          throw new Error('URL de GitHub no válida. Formato esperado: https://github.com/owner/repo.git');
        }

        const sshMatch = clean.match(/^git@github\.com:([^/\s]+)\/(.+?)(?:\.git)?[/?#]?$/i);
        if (sshMatch) {
          const owner = sshMatch[1];
          const repo = sshMatch[2].replace(/\.git$/i, '').replace(/[/?#].*$/, '');
          return { owner, repo };
        }

        if (/^[\w.-]+\/[\w.-]+(?:\.git)?$/i.test(clean)) {
          const [owner, rawRepo] = clean.split('/');
          return { owner, repo: rawRepo.replace(/\.git$/i, '') };
        }

        if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;

        try {
          const parsed = new URL(clean);
          if (!/^(www\.)?github\.com$/i.test(parsed.hostname)) {
            throw new Error('host');
          }
          const [owner, rawRepo] = parsed.pathname.split('/').filter(Boolean);
          const repo = (rawRepo || '').replace(/\.git$/i, '');
          if (!owner || !repo) throw new Error('path');
          return { owner, repo };
        } catch {
          throw new Error('URL de GitHub no válida. Formato esperado: https://github.com/owner/repo.git');
        }
      };

      const assertSafeGitHubName = (value: string, label: string) => {
        if (!/^[A-Za-z0-9_.-]+$/.test(value)) {
          throw new Error(`${label} de GitHub inválido: ${value}`);
        }
      };

      const { owner, repo } = parseGitHubRepository(repoUrl);
      assertSafeGitHubName(owner, 'Usuario');
      assertSafeGitHubName(repo, 'Repositorio');

      setCloneProgress(prev => [...prev, 
        `\x1b[1;33m$\x1b[0m git clone https://github.com/${owner}/${repo}.git`,
        '',
        `Cloning into '\x1b[1;36m${repo}\x1b[0m'...`,
        `remote: Enumerating objects... \x1b[2m(connecting)\x1b[0m`
      ]);

      // GitHub codeload ZIP blocks browser origins in the preview. Clone through the public
      // GitHub REST API instead: metadata → recursive tree → raw file contents.
      const githubJson = async <T,>(url: string): Promise<T> => {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Repositorio no encontrado o privado: ${owner}/${repo}`);
          }
          if (response.status === 403) {
            throw new Error('GitHub limitó temporalmente las peticiones públicas. Intenta de nuevo en unos minutos.');
          }
          throw new Error(`GitHub respondió ${response.status}. No se pudo leer el repositorio.`);
        }

        return response.json() as Promise<T>;
      };

      type GitHubRepoMeta = { default_branch?: string };
      type GitHubBranch = { commit?: { sha?: string } };
      type GitHubTreeItem = {
        path: string;
        type: 'blob' | 'tree' | 'commit';
        size?: number;
      };
      type GitHubTree = { tree?: GitHubTreeItem[]; truncated?: boolean };

      const meta = await githubJson<GitHubRepoMeta>(`https://api.github.com/repos/${owner}/${repo}`);
      const defaultBranch = meta.default_branch || 'main';

      setCloneProgress(prev => [...prev,
        `remote: Resolving \x1b[1;36m${defaultBranch}\x1b[0m...`,
      ]);

      const encodedBranch = encodeURIComponent(defaultBranch);
      const branchInfo = await githubJson<GitHubBranch>(`https://api.github.com/repos/${owner}/${repo}/branches/${encodedBranch}`);
      const treeSha = branchInfo.commit?.sha || defaultBranch;
      const treeData = await githubJson<GitHubTree>(`https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`);
      const treeEntries = (treeData.tree || []).filter(item => item.path && item.type !== 'commit');
      const blobEntries = treeEntries.filter(item => item.type === 'blob');

      if (!treeEntries.length) {
        throw new Error('El repositorio está vacío o GitHub no devolvió archivos para clonar.');
      }

      if (treeData.truncated) {
        setCloneProgress(prev => [...prev,
          `remote: \x1b[1;33mwarning\x1b[0m el árbol del repositorio fue truncado por GitHub; se cargarán los archivos disponibles.`,
        ]);
      }

      setCloneProgress(prev => [...prev,
        `remote: Counting objects: \x1b[1;32m${treeEntries.length}\x1b[0m`,
        `remote: Compressing objects: \x1b[1;32mdone\x1b[0m`,
        `Receiving objects:   0% (\x1b[1;33m0/${blobEntries.length} files\x1b[0m)`,
      ]);

      const repoRoot: FileNode = {
        name: repo,
        type: 'folder',
        path: `/${repo}`,
        children: []
      };

      let fileCount = 0;
      let folderCount = 0;
      let received = 0;
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

      const ensureFolderPath = (parts: string[]) => {
        let currentFolder = repoRoot;
        for (const part of parts.filter(Boolean)) {
          currentFolder = getOrCreateFolder(currentFolder, part);
        }
        return currentFolder;
      };

      // Detect binary-ish extensions to avoid mojibake from text decode.
      const BINARY_EXTS = new Set([
        'png','jpg','jpeg','gif','webp','bmp','ico','tga','dds',
        'mp3','wav','ogg','flac','m4a','aac',
        'mp4','mkv','avi','mov','webm',
        'zip','gz','tar','7z','rar',
        'elf','iso','bin','dat','pak','adp','ss2','vag','vp6','m2v','pss',
        'ttf','otf','woff','woff2',
        'pdf','psd','ai','blend','fbx','obj',
        'exe','dll','so','dylib','o','a',
      ]);

      const arrayBufferToBase64 = (buf: Uint8Array): string => {
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < buf.length; i += chunk) {
          binary += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)));
        }
        return btoa(binary);
      };

      const decodeText = (bytes: Uint8Array): string => {
        try {
          return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        } catch {
          return Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
        }
      };

      const branchPath = defaultBranch.split('/').map(encodeURIComponent).join('/');
      const rawFileUrl = (path: string) =>
        `https://raw.githubusercontent.com/${owner}/${repo}/${branchPath}/${path.split('/').map(encodeURIComponent).join('/')}`;

      for (const entry of treeEntries.filter(item => item.type === 'tree')) {
        ensureFolderPath(entry.path.split('/'));
      }

      let processedFiles = 0;
      let lastReportedPct = -1;
      const concurrency = 6;
      let nextIndex = 0;

      const processBlob = async (entry: GitHubTreeItem) => {
        const cleanPath = entry.path.replace(/^\/+/, '').replace(/\/+$/, '');
        const parts = cleanPath.split('/').filter(Boolean);
        if (!parts.length) return;

        const fileName = parts[parts.length - 1];
        const currentFolder = ensureFolderPath(parts.slice(0, -1));
        currentFolder.children ||= [];

        const filePath = `${currentFolder.path}/${fileName}`;
        if (currentFolder.children.some(n => n.type === 'file' && n.path === filePath)) return;

        const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || 'other' : 'no-ext';
        const extLower = ext === 'no-ext' ? '' : ext;

        const response = await fetch(rawFileUrl(cleanPath), { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`No se pudo descargar ${cleanPath} (${response.status})`);
        }

        const buffer = new Uint8Array(await response.arrayBuffer());
        received += buffer.byteLength;

        const isBinary = BINARY_EXTS.has(extLower);
        const content = isBinary ? `__BASE64__:${arrayBufferToBase64(buffer)}` : decodeText(buffer);

        currentFolder.children.push({
          name: fileName,
          type: 'file',
          path: filePath,
          content
        });

        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        allFiles.push(cleanPath);
        fileCount++;
        processedFiles++;

        const pct = blobEntries.length > 0 ? Math.floor((processedFiles / blobEntries.length) * 100) : 100;
        if (pct !== lastReportedPct && (pct === 100 || pct % 5 === 0 || processedFiles === 1)) {
          lastReportedPct = pct;
          const fmt = received > 1024 * 1024
            ? `${(received / (1024 * 1024)).toFixed(2)} MiB`
            : `${(received / 1024).toFixed(2)} KiB`;
          setCloneProgress(prev => {
            const next = [...prev];
            next[next.length - 1] = `Receiving objects: ${String(pct).padStart(3)}% (\x1b[1;33m${processedFiles}/${blobEntries.length} files, ${fmt}\x1b[0m)`;
            return next;
          });
        }
      };

      const workers = Array.from({ length: Math.min(concurrency, Math.max(blobEntries.length, 1)) }, async () => {
        while (nextIndex < blobEntries.length) {
          const currentIndex = nextIndex++;
          await processBlob(blobEntries[currentIndex]);
        }
      });

      await Promise.all(workers);

      const sizeMB = (received / (1024 * 1024)).toFixed(2);
      const sizeKB = (received / 1024).toFixed(2);
      const sizeDisplay = received > 1024 * 1024 ? `${sizeMB} MiB` : `${sizeKB} KiB`;

      setCloneProgress(prev => [...prev,
        `Receiving objects: 100% (\x1b[1;33m${sizeDisplay}\x1b[0m) \x1b[1;32mdone\x1b[0m`,
        `Resolving deltas: 100% \x1b[1;32mdone\x1b[0m`,
        '',
        `Branch: \x1b[1;36m${defaultBranch}\x1b[0m`,
        'Unpacking objects: \x1b[2m(creating file tree)\x1b[0m',
        `Unpacking objects: 100% (${treeEntries.length}/${treeEntries.length}) \x1b[1;32mdone\x1b[0m`
      ]);

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
        const bar = '█'.repeat(Math.min(Math.ceil(count / Math.max(fileCount, 1) * 20), 20));
        const pct = ((count / Math.max(fileCount, 1)) * 100).toFixed(1);
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
            onFileDelete={handleFileDelete}
            onFileRename={handleFileRenameFromExplorer}
            onCloneRepository={handleOpenCloneDialog}
            onProjectClear={handleProjectClear}
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
                          // The "Crear nuevo proyecto" hero CTA passes name='main.js'
                          // Route it through the new wizard tab. Other quick-create
                          // shortcuts (Nuevo archivo / Nuevo script) keep the old behavior.
                          if (name === 'main.js') {
                            handleOpenCreateWizard();
                            return;
                          }
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
                        onOpenAbout={() => {
                          const aboutTab: FileNode = { name: 'Acerca de', type: 'file', path: '/__about__', content: '' };
                          const existingIndex = openTabs.findIndex(t => t.path === '/__about__');
                          if (existingIndex !== -1) {
                            setActiveTabIndex(existingIndex);
                          } else {
                            setOpenTabs((prev: FileNode[]) => [...prev, aboutTab]);
                            setActiveTabIndex(openTabs.length);
                          }
                        }}
                      />
                    ) : selectedFile?.path === '/__about__' ? (
                      <AthenaAboutTab />
                    ) : selectedFile?.path === '/__create_project__' ? (
                      <CreateProjectWizardTab
                        onCreate={handleCreateProject}
                        onCancel={handleCloseCreateWizard}
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
            onFileDelete={handleFileDelete}
            onFileRename={handleFileRenameFromExplorer}
            onCloneRepository={handleOpenCloneDialog}
            onProjectClear={handleProjectClear}
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
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-50 w-full max-w-[520px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] shadow-2xl shadow-black/60 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            <DialogPrimitive.Title className="sr-only">Clone repository</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Clona un repositorio de GitHub directamente en Athena IDE.
            </DialogPrimitive.Description>

          {/* Header — GitHub-faithful */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#30363d] bg-gradient-to-b from-[#161b22] to-[#0d1117]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-[#2ea043] to-[#1a7f37] rounded-md shadow-sm shadow-green-900/40 ring-1 ring-white/10">
                <Github className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white text-sm leading-tight">Clone a repository</span>
                <span className="text-[11px] text-[#8b949e] leading-tight">Importa un proyecto de GitHub a tu workspace</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a 
                href="https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Ayuda"
                className="p-1.5 rounded-md text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </a>
              <DialogPrimitive.Close
                className="p-1.5 rounded-md text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors disabled:opacity-50"
                disabled={isCloning}
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Info banner */}
          <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-md border border-[#1f6feb]/30 bg-[#0c2d6b]/30 px-3 py-2">
            <Info className="w-3.5 h-3.5 text-[#58a6ff] mt-0.5 flex-shrink-0" />
            <p className="text-[11.5px] leading-relaxed text-[#c9d1d9]">
              Pega la URL pública del repositorio de GitHub. Athena descargará el contenido y lo añadirá a tu Explorador de archivos como un proyecto nuevo listo para editar.
            </p>
          </div>

          {/* Tabs */}
          <div className="px-5 pt-3">
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
                  <div className="flex-1 flex items-center bg-[#010409] border border-[#30363d] rounded-md overflow-hidden focus-within:border-[#1f6feb] focus-within:ring-1 focus-within:ring-[#1f6feb]/40 transition-all">
                    <Input
                      placeholder="https://github.com/usuario/repositorio.git"
                      value={cloneUrl}
                      onChange={(e) => setCloneUrl(e.target.value)}
                      disabled={isCloning}
                      onKeyDown={(e) => e.key === 'Enter' && !isCloning && handleCloneRepository()}
                      className="flex-1 bg-transparent border-0 text-[#c9d1d9] placeholder:text-[#484f58] focus-visible:ring-0 focus-visible:ring-offset-0 h-9 font-mono text-[12.5px]"
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
                    title="Copiar URL"
                  >
                    <Copy className="w-4 h-4 text-[#8b949e]" />
                  </Button>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Clona usando la URL web. Soporta repositorios <span className="text-[#c9d1d9] font-medium">públicos</span> de GitHub.
                </p>
              </TabsContent>

              <TabsContent value="cli" className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#010409] border border-[#30363d] rounded-md overflow-hidden">
                    <Input
                      value={cloneUrl ? `gh repo clone ${cloneUrl.replace('https://github.com/', '').replace('.git', '')}` : 'gh repo clone usuario/repositorio'}
                      readOnly
                      className="flex-1 bg-transparent border-0 text-[#c9d1d9] placeholder:text-[#484f58] focus-visible:ring-0 focus-visible:ring-offset-0 h-9 font-mono text-[12.5px]"
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
                    title="Copiar comando"
                  >
                    <Copy className="w-4 h-4 text-[#8b949e]" />
                  </Button>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Trabaja rápido con la CLI oficial.{' '}
                  <a href="https://cli.github.com" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">
                    Aprende más sobre la CLI
                  </a>
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Clone Progress */}
          {cloneProgress.length > 0 && (
            <div className="mx-5 mt-3 bg-[#010409] border border-[#30363d] rounded-md p-3 max-h-32 overflow-auto">
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

          {/* Separator with label */}
          <div className="mt-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#30363d]" />
              <span className="text-[10px] uppercase tracking-wider text-[#6e7681] font-semibold">Opciones</span>
              <div className="flex-1 h-px bg-[#30363d]" />
            </div>
          </div>

          {/* Additional Options */}
          <div className="px-3 py-2 space-y-0.5">
            <button
              onClick={() => {
                if (cloneUrl) {
                  window.open(cloneUrl.replace('.git', ''), '_blank');
                }
              }}
              disabled={!cloneUrl.trim()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-[#c9d1d9] hover:bg-[#21262d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
            >
              <ExternalLink className="w-4 h-4 text-[#8b949e] group-hover:text-[#58a6ff]" />
              <div className="flex-1 min-w-0">
                <div className="text-sm">Abrir en GitHub</div>
                <div className="text-[11px] text-[#6e7681]">Ver el repositorio en github.com</div>
              </div>
            </button>
            <button
              onClick={() => handleCloneRepository()}
              disabled={isCloning || !cloneUrl.trim()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-[#c9d1d9] hover:bg-[#21262d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
            >
              {isCloning ? (
                <Loader2 className="w-4 h-4 text-[#2ea043] animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#8b949e] group-hover:text-[#2ea043]" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm">{isCloning ? 'Clonando repositorio...' : 'Clonar en Athena IDE'}</div>
                <div className="text-[11px] text-[#6e7681]">{isCloning ? 'Descargando archivos…' : 'Importa el proyecto al Explorador'}</div>
              </div>
            </button>
            <button
              onClick={() => {
                if (cloneUrl) {
                  const downloadUrl = cloneUrl.replace('.git', '') + '/archive/refs/heads/main.zip';
                  window.open(downloadUrl, '_blank');
                }
              }}
              disabled={!cloneUrl.trim()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-[#c9d1d9] hover:bg-[#21262d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
            >
              <FileArchive className="w-4 h-4 text-[#8b949e] group-hover:text-[#f78166]" />
              <div className="flex-1 min-w-0">
                <div className="text-sm">Descargar ZIP</div>
                <div className="text-[11px] text-[#6e7681]">Guarda una copia comprimida en tu equipo</div>
              </div>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-[#30363d] bg-[#0a0d12]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#6e7681]">
              <Sparkles className="w-3 h-3 text-[#f78166]" />
              <span>Listo para editar al terminar</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCloneDialog(false)} 
                disabled={isCloning}
                className="h-8 px-3 bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:border-[#8b949e] text-sm"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => handleCloneRepository()} 
                disabled={isCloning || !cloneUrl.trim()} 
                className="h-8 px-3.5 bg-gradient-to-b from-[#2ea043] to-[#238636] hover:from-[#3fb950] hover:to-[#2ea043] text-white border border-[#1a7f37]/60 shadow-sm gap-2 text-sm font-medium"
              >
                {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                {isCloning ? 'Clonando…' : 'Clone'}
              </Button>
            </div>
          </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
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
