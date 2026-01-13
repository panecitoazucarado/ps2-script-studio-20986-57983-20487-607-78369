import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Terminal, 
  X, 
  Maximize2, 
  Minimize2, 
  Plus, 
  ChevronDown,
  Trash2,
  HardDrive,
  FolderOpen,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileNode } from '@/types/athena';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'system' | 'warning';
  content: string;
  timestamp: Date;
}

interface TerminalTab {
  id: string;
  name: string;
  lines: TerminalLine[];
  currentDirectory: string;
  isRunning: boolean;
  shell: 'zsh' | 'bash' | 'powershell';
}

interface ClonedRepo {
  name: string;
  path: string;
  clonedAt: Date;
  fileCount: number;
  folderCount: number;
  sizeBytes: number;
}

interface IDETerminalProps {
  onClose?: () => void;
  onCloneRepository?: (url: string) => void;
  isCloning?: boolean;
  cloneProgress?: string[];
  projectFiles?: FileNode[];
  onDeleteFiles?: (paths: string[]) => void;
  onClearClonedData?: () => void;
}

// Persistent storage for cloned repos metadata
const CLONED_REPOS_KEY = 'athena_cloned_repos';

export function IDETerminal({ 
  onClose, 
  onCloneRepository, 
  isCloning, 
  cloneProgress,
  projectFiles = [],
  onDeleteFiles,
  onClearClonedData
}: IDETerminalProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'terminal-1',
      name: 'zsh',
      lines: [
        { id: '1', type: 'system', content: '\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m', timestamp: new Date() },
        { id: '2', type: 'system', content: '\x1b[1;36m║\x1b[0m  \x1b[1;37mATHENA IDE Terminal\x1b[0m v2.0.0 - Professional Dev Environment   \x1b[1;36m║\x1b[0m', timestamp: new Date() },
        { id: '3', type: 'system', content: '\x1b[1;36m║\x1b[0m  PlayStation 2 Homebrew Development                           \x1b[1;36m║\x1b[0m', timestamp: new Date() },
        { id: '4', type: 'system', content: '\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m', timestamp: new Date() },
        { id: '5', type: 'info', content: '', timestamp: new Date() },
        { id: '6', type: 'info', content: 'Type \x1b[1;33m"help"\x1b[0m for available commands or \x1b[1;33m"repos"\x1b[0m to manage cloned repositories.', timestamp: new Date() },
        { id: '7', type: 'output', content: '', timestamp: new Date() },
      ],
      currentDirectory: '~',
      isRunning: false,
      shell: 'zsh'
    }
  ]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [clonedRepos, setClonedRepos] = useState<ClonedRepo[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<ClonedRepo | null>(null);
  const [showStorageInfo, setShowStorageInfo] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs[activeTabIndex];

  // Load cloned repos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CLONED_REPOS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setClonedRepos(parsed.map((r: any) => ({
          ...r,
          clonedAt: new Date(r.clonedAt)
        })));
      }
    } catch (e) {
      console.error('Error loading cloned repos:', e);
    }
  }, []);

  // Save cloned repos to localStorage
  const saveClonedRepos = useCallback((repos: ClonedRepo[]) => {
    try {
      localStorage.setItem(CLONED_REPOS_KEY, JSON.stringify(repos));
      setClonedRepos(repos);
    } catch (e) {
      console.error('Error saving cloned repos:', e);
    }
  }, []);

  // Build virtual file system from projectFiles
  const virtualFS = useMemo(() => {
    const fs: Map<string, { type: 'file' | 'folder'; content?: string; children?: string[] }> = new Map();
    
    const processNode = (node: FileNode, parentPath: string = '') => {
      const fullPath = parentPath ? `${parentPath}/${node.name}` : `/${node.name}`;
      
      if (node.type === 'folder') {
        const children = node.children?.map(c => c.name) || [];
        fs.set(fullPath, { type: 'folder', children });
        node.children?.forEach(child => processNode(child, fullPath));
      } else {
        fs.set(fullPath, { type: 'file', content: node.content });
      }
    };
    
    projectFiles.forEach(node => processNode(node));
    
    // Add root
    fs.set('/', { type: 'folder', children: projectFiles.map(n => n.name) });
    fs.set('~', { type: 'folder', children: projectFiles.map(n => n.name) });
    
    return fs;
  }, [projectFiles]);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab?.lines]);

  // Track cloned repository from progress
  useEffect(() => {
    if (cloneProgress && cloneProgress.length > 0) {
      const newLines = cloneProgress.map((line, index) => ({
        id: `clone-${Date.now()}-${index}`,
        type: line.includes('error') || line.includes('Error') || line.includes('✗') ? 'error' as const : 
              line.includes('✓') || line.includes('successfully') ? 'success' as const : 
              line.includes('warning') ? 'warning' as const :
              'info' as const,
        content: line,
        timestamp: new Date()
      }));

      setTabs(prev => prev.map((tab, idx) => 
        idx === activeTabIndex 
          ? { ...tab, lines: [...tab.lines.filter(l => !l.id.startsWith('clone-')), ...newLines] }
          : tab
      ));

      // Extract repo info from clone progress
      const repoMatch = cloneProgress.find(l => l.includes('Repository:'))?.match(/Repository:\s+.*?([^\/\s]+\/[^\/\s]+)/);
      const filesMatch = cloneProgress.find(l => l.includes('Total Files:'))?.match(/Total Files:\s+.*?(\d+)/);
      const foldersMatch = cloneProgress.find(l => l.includes('Total Folders:'))?.match(/Total Folders:\s+.*?(\d+)/);
      const sizeMatch = cloneProgress.find(l => l.includes('Download Size:'))?.match(/Download Size:\s+.*?([\d.]+)\s*(KiB|MiB)/);
      
      if (repoMatch && cloneProgress.some(l => l.includes('successfully'))) {
        const repoName = repoMatch[1].split('/')[1];
        const fileCount = parseInt(filesMatch?.[1] || '0');
        const folderCount = parseInt(foldersMatch?.[1] || '0');
        let sizeBytes = 0;
        if (sizeMatch) {
          const sizeValue = parseFloat(sizeMatch[1]);
          sizeBytes = sizeMatch[2] === 'MiB' ? sizeValue * 1024 * 1024 : sizeValue * 1024;
        }
        
        // Add to cloned repos if not already there
        setClonedRepos(prev => {
          const exists = prev.some(r => r.name === repoName);
          if (exists) return prev;
          
          const newRepos = [...prev, {
            name: repoName,
            path: `/${repoName}`,
            clonedAt: new Date(),
            fileCount,
            folderCount,
            sizeBytes
          }];
          saveClonedRepos(newRepos);
          return newRepos;
        });
      }
    }
  }, [cloneProgress, activeTabIndex, saveClonedRepos]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date()
    };

    setTabs(prev => prev.map((tab, idx) => 
      idx === activeTabIndex 
        ? { ...tab, lines: [...tab.lines, newLine] }
        : tab
    ));
  }, [activeTabIndex]);

  const addLines = useCallback((lines: Array<{ type: TerminalLine['type']; content: string }>) => {
    const newLines = lines.map((line, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random()}`,
      type: line.type,
      content: line.content,
      timestamp: new Date()
    }));

    setTabs(prev => prev.map((tab, idx) => 
      idx === activeTabIndex 
        ? { ...tab, lines: [...tab.lines, ...newLines] }
        : tab
    ));
  }, [activeTabIndex]);

  // Resolve path relative to current directory
  const resolvePath = useCallback((path: string, cwd: string): string => {
    if (path.startsWith('/')) return path;
    if (path.startsWith('~')) return path.replace('~', '');
    
    const cwdPath = cwd === '~' ? '' : cwd.replace('~', '');
    const parts = cwdPath.split('/').filter(Boolean);
    
    path.split('/').forEach(part => {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.' && part !== '') {
        parts.push(part);
      }
    });
    
    return '/' + parts.join('/');
  }, []);

  // List directory contents
  const listDirectory = useCallback((path: string): { name: string; type: 'file' | 'folder' }[] | null => {
    const normalizedPath = path === '~' ? '/' : path;
    
    // Check virtual FS first
    const entry = virtualFS.get(normalizedPath);
    if (entry?.type === 'folder' && entry.children) {
      return entry.children.map(name => {
        const childPath = normalizedPath === '/' ? `/${name}` : `${normalizedPath}/${name}`;
        const child = virtualFS.get(childPath);
        return { name, type: child?.type || 'file' };
      });
    }
    
    // If path is a repo root, check projectFiles
    const repoMatch = projectFiles.find(f => `/${f.name}` === normalizedPath || normalizedPath === '/' + f.name);
    if (repoMatch?.children) {
      return repoMatch.children.map(c => ({ name: c.name, type: c.type === 'folder' ? 'folder' : 'file' }));
    }
    
    // Return root level
    if (normalizedPath === '/' || normalizedPath === '') {
      return projectFiles.map(f => ({ name: f.name, type: f.type === 'folder' ? 'folder' : 'file' }));
    }
    
    return null;
  }, [virtualFS, projectFiles]);

  // Read file content
  const readFile = useCallback((path: string): string | null => {
    const entry = virtualFS.get(path);
    if (entry?.type === 'file') {
      return entry.content || '';
    }
    return null;
  }, [virtualFS]);

  // Calculate storage usage
  const storageStats = useMemo(() => {
    const totalSize = clonedRepos.reduce((sum, r) => sum + r.sizeBytes, 0);
    const totalFiles = clonedRepos.reduce((sum, r) => sum + r.fileCount, 0);
    const totalFolders = clonedRepos.reduce((sum, r) => sum + r.folderCount, 0);
    return { totalSize, totalFiles, totalFolders, repoCount: clonedRepos.length };
  }, [clonedRepos]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
  };

  const executeCommand = useCallback((command: string) => {
    const trimmedCmd = command.trim();
    const parts = trimmedCmd.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Add command to history
    if (trimmedCmd) {
      setCommandHistory(prev => [...prev.filter(c => c !== trimmedCmd), trimmedCmd].slice(-100));
      setHistoryIndex(-1);
    }

    // Add input line
    const prompt = activeTab.shell === 'powershell' ? 'PS' : '';
    addLine('input', `\x1b[1;32m${activeTab.currentDirectory}\x1b[0m ${prompt}\x1b[1;37m$\x1b[0m ${command}`);

    // Execute command
    switch (cmd) {
      case 'help':
        addLines([
          { type: 'info', content: '' },
          { type: 'system', content: '\x1b[1;36m┌─────────────────────────────────────────────────────────────────┐\x1b[0m' },
          { type: 'system', content: '\x1b[1;36m│\x1b[0m  \x1b[1;37mATHENA Terminal Commands\x1b[0m                                      \x1b[1;36m│\x1b[0m' },
          { type: 'system', content: '\x1b[1;36m└─────────────────────────────────────────────────────────────────┘\x1b[0m' },
          { type: 'info', content: '' },
          { type: 'info', content: '\x1b[1;33m  Navigation & File System:\x1b[0m' },
          { type: 'output', content: '    ls [-la]           List directory contents' },
          { type: 'output', content: '    cd <dir>           Change directory' },
          { type: 'output', content: '    pwd                Print working directory' },
          { type: 'output', content: '    cat <file>         Display file contents' },
          { type: 'output', content: '    head <file>        Show first 10 lines of file' },
          { type: 'output', content: '    tail <file>        Show last 10 lines of file' },
          { type: 'output', content: '    tree [dir]         Display directory tree' },
          { type: 'output', content: '    find <pattern>     Search for files' },
          { type: 'output', content: '    wc <file>          Count lines/words/chars' },
          { type: 'info', content: '' },
          { type: 'info', content: '\x1b[1;33m  Repository Management:\x1b[0m' },
          { type: 'output', content: '    git clone <url>    Clone GitHub repository' },
          { type: 'output', content: '    repos              List cloned repositories' },
          { type: 'output', content: '    repos clean        Remove all cloned data' },
          { type: 'output', content: '    rm -rf <repo>      Delete specific repository' },
          { type: 'output', content: '    du [-h]            Show disk usage' },
          { type: 'info', content: '' },
          { type: 'info', content: '\x1b[1;33m  Development:\x1b[0m' },
          { type: 'output', content: '    npm install        Install dependencies (sim)' },
          { type: 'output', content: '    npm run <script>   Run npm script (sim)' },
          { type: 'output', content: '    make               Build with Makefile (sim)' },
          { type: 'output', content: '    ps2-build          Build PS2 project' },
          { type: 'output', content: '    ps2-run            Run in PS2 emulator' },
          { type: 'info', content: '' },
          { type: 'info', content: '\x1b[1;33m  Terminal:\x1b[0m' },
          { type: 'output', content: '    clear / cls        Clear terminal screen' },
          { type: 'output', content: '    history            Show command history' },
          { type: 'output', content: '    echo <text>        Print text' },
          { type: 'output', content: '    date               Show current date/time' },
          { type: 'output', content: '    whoami             Display current user' },
          { type: 'output', content: '    uname [-a]         System information' },
          { type: 'output', content: '    exit               Close terminal' },
          { type: 'info', content: '' },
          { type: 'info', content: '\x1b[2m  Shortcuts: ↑↓ History | Tab Autocomplete | Ctrl+C Cancel | Ctrl+L Clear\x1b[0m' },
          { type: 'info', content: '' },
        ]);
        break;

      case 'clear':
      case 'cls':
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, lines: [] } : tab
        ));
        break;

      case 'ls': {
        const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
        const targetPath = args.find(a => !a.startsWith('-')) || activeTab.currentDirectory;
        const resolvedPath = resolvePath(targetPath, activeTab.currentDirectory);
        
        const entries = listDirectory(resolvedPath);
        
        if (!entries) {
          addLine('error', `ls: cannot access '${targetPath}': No such file or directory`);
          break;
        }

        if (entries.length === 0) {
          addLine('output', '\x1b[2m(empty directory)\x1b[0m');
          break;
        }

        const filteredEntries = showHidden ? entries : entries.filter(e => !e.name.startsWith('.'));
        
        if (showLong) {
          addLine('output', `total ${filteredEntries.length}`);
          filteredEntries.forEach(entry => {
            const permissions = entry.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
            const color = entry.type === 'folder' ? '\x1b[1;34m' : '\x1b[0m';
            const suffix = entry.type === 'folder' ? '/' : '';
            addLine('output', `${permissions}  1 dev dev    4096 ${new Date().toLocaleDateString()}  ${color}${entry.name}${suffix}\x1b[0m`);
          });
        } else {
          const folders = filteredEntries.filter(e => e.type === 'folder').map(e => `\x1b[1;34m${e.name}/\x1b[0m`);
          const files = filteredEntries.filter(e => e.type === 'file').map(e => e.name);
          const output = [...folders, ...files].join('  ');
          addLine('output', output);
        }
        break;
      }

      case 'cd': {
        if (!args[0] || args[0] === '~') {
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, currentDirectory: '~' } : tab
          ));
          break;
        }

        const targetPath = resolvePath(args[0], activeTab.currentDirectory);
        const entries = listDirectory(targetPath);
        
        if (entries !== null) {
          const displayPath = targetPath === '/' ? '~' : '~' + targetPath;
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, currentDirectory: displayPath } : tab
          ));
        } else {
          addLine('error', `cd: ${args[0]}: No such file or directory`);
        }
        break;
      }

      case 'pwd':
        const pwdPath = activeTab.currentDirectory === '~' ? '/home/dev' : activeTab.currentDirectory.replace('~', '/home/dev');
        addLine('output', pwdPath);
        break;

      case 'cat': {
        if (!args[0]) {
          addLine('error', 'cat: missing file operand');
          break;
        }
        const filePath = resolvePath(args[0], activeTab.currentDirectory);
        const content = readFile(filePath);
        
        if (content !== null) {
          content.split('\n').forEach(line => addLine('output', line));
        } else {
          addLine('error', `cat: ${args[0]}: No such file or directory`);
        }
        break;
      }

      case 'head': {
        if (!args[0]) {
          addLine('error', 'head: missing file operand');
          break;
        }
        const filePath = resolvePath(args[0], activeTab.currentDirectory);
        const content = readFile(filePath);
        
        if (content !== null) {
          const lines = content.split('\n').slice(0, 10);
          lines.forEach(line => addLine('output', line));
          if (content.split('\n').length > 10) {
            addLine('info', `\x1b[2m... (${content.split('\n').length - 10} more lines)\x1b[0m`);
          }
        } else {
          addLine('error', `head: ${args[0]}: No such file or directory`);
        }
        break;
      }

      case 'tail': {
        if (!args[0]) {
          addLine('error', 'tail: missing file operand');
          break;
        }
        const filePath = resolvePath(args[0], activeTab.currentDirectory);
        const content = readFile(filePath);
        
        if (content !== null) {
          const allLines = content.split('\n');
          const lines = allLines.slice(-10);
          if (allLines.length > 10) {
            addLine('info', `\x1b[2m... (${allLines.length - 10} lines above)\x1b[0m`);
          }
          lines.forEach(line => addLine('output', line));
        } else {
          addLine('error', `tail: ${args[0]}: No such file or directory`);
        }
        break;
      }

      case 'tree': {
        const targetPath = args[0] ? resolvePath(args[0], activeTab.currentDirectory) : 
                          activeTab.currentDirectory === '~' ? '/' : activeTab.currentDirectory.replace('~', '');
        
        const buildTree = (path: string, prefix: string = '', maxDepth: number = 4, depth: number = 0): string[] => {
          if (depth >= maxDepth) return [];
          
          const entries = listDirectory(path);
          if (!entries) return [];
          
          const lines: string[] = [];
          const sortedEntries = [...entries].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
          
          sortedEntries.forEach((entry, idx) => {
            const isLast = idx === sortedEntries.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const color = entry.type === 'folder' ? '\x1b[1;34m' : '\x1b[0m';
            const suffix = entry.type === 'folder' ? '/' : '';
            lines.push(`${prefix}${connector}${color}${entry.name}${suffix}\x1b[0m`);
            
            if (entry.type === 'folder') {
              const childPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
              const newPrefix = prefix + (isLast ? '    ' : '│   ');
              lines.push(...buildTree(childPath, newPrefix, maxDepth, depth + 1));
            }
          });
          
          return lines;
        };
        
        const dirName = targetPath === '/' ? '.' : targetPath.split('/').pop() || '.';
        addLine('output', `\x1b[1;34m${dirName}\x1b[0m`);
        buildTree(targetPath).forEach(line => addLine('output', line));
        break;
      }

      case 'find': {
        if (!args[0]) {
          addLine('error', 'find: missing pattern');
          break;
        }
        const pattern = args[0].toLowerCase();
        const results: string[] = [];
        
        const searchInPath = (node: FileNode, path: string) => {
          const fullPath = `${path}/${node.name}`;
          if (node.name.toLowerCase().includes(pattern)) {
            results.push(fullPath);
          }
          if (node.children) {
            node.children.forEach(child => searchInPath(child, fullPath));
          }
        };
        
        projectFiles.forEach(node => searchInPath(node, ''));
        
        if (results.length === 0) {
          addLine('output', `No files matching '${args[0]}' found`);
        } else {
          results.slice(0, 50).forEach(result => {
            const color = result.endsWith('/') ? '\x1b[1;34m' : '\x1b[0m';
            addLine('output', `${color}${result}\x1b[0m`);
          });
          if (results.length > 50) {
            addLine('info', `\x1b[2m... and ${results.length - 50} more results\x1b[0m`);
          }
        }
        break;
      }

      case 'wc': {
        if (!args[0]) {
          addLine('error', 'wc: missing file operand');
          break;
        }
        const filePath = resolvePath(args[0], activeTab.currentDirectory);
        const content = readFile(filePath);
        
        if (content !== null) {
          const lines = content.split('\n').length;
          const words = content.split(/\s+/).filter(Boolean).length;
          const chars = content.length;
          addLine('output', `  ${lines}   ${words}  ${chars} ${args[0]}`);
        } else {
          addLine('error', `wc: ${args[0]}: No such file or directory`);
        }
        break;
      }

      case 'repos':
        if (args[0] === 'clean') {
          if (clonedRepos.length === 0) {
            addLine('info', 'No cloned repositories to clean.');
            break;
          }
          addLines([
            { type: 'warning', content: '' },
            { type: 'warning', content: '\x1b[1;33m⚠ WARNING: This will delete all cloned repository data!\x1b[0m' },
            { type: 'info', content: `  ${clonedRepos.length} repositories (${formatSize(storageStats.totalSize)})` },
            { type: 'info', content: '' },
          ]);
          
          // Clear all data
          saveClonedRepos([]);
          if (onClearClonedData) onClearClonedData();
          
          addLines([
            { type: 'success', content: '\x1b[1;32m✓\x1b[0m All cloned repository data has been removed.' },
            { type: 'info', content: '  Browser storage cleared. File explorer will be empty on next refresh.' },
            { type: 'info', content: '' },
          ]);
          break;
        }
        
        addLines([
          { type: 'info', content: '' },
          { type: 'system', content: '\x1b[1;36m┌─────────────────────────────────────────────────────────────────┐\x1b[0m' },
          { type: 'system', content: '\x1b[1;36m│\x1b[0m  \x1b[1;37mCloned Repositories\x1b[0m                                           \x1b[1;36m│\x1b[0m' },
          { type: 'system', content: '\x1b[1;36m└─────────────────────────────────────────────────────────────────┘\x1b[0m' },
        ]);
        
        if (clonedRepos.length === 0) {
          addLines([
            { type: 'info', content: '' },
            { type: 'output', content: '  \x1b[2mNo repositories cloned yet.\x1b[0m' },
            { type: 'output', content: '  Use \x1b[1;33mgit clone <url>\x1b[0m to clone a GitHub repository.' },
            { type: 'info', content: '' },
          ]);
        } else {
          addLine('info', '');
          clonedRepos.forEach((repo, idx) => {
            addLines([
              { type: 'output', content: `  \x1b[1;34m${idx + 1}. ${repo.name}\x1b[0m` },
              { type: 'output', content: `     Path: ${repo.path}` },
              { type: 'output', content: `     Files: ${repo.fileCount} | Folders: ${repo.folderCount} | Size: ${formatSize(repo.sizeBytes)}` },
              { type: 'output', content: `     Cloned: ${repo.clonedAt.toLocaleString()}` },
              { type: 'info', content: '' },
            ]);
          });
          
          addLines([
            { type: 'info', content: '\x1b[1;35m  Storage Summary:\x1b[0m' },
            { type: 'output', content: `    Total: ${storageStats.repoCount} repos | ${storageStats.totalFiles} files | ${formatSize(storageStats.totalSize)}` },
            { type: 'info', content: '' },
            { type: 'info', content: '  \x1b[2mCommands: rm -rf <repo-name> | repos clean\x1b[0m' },
            { type: 'info', content: '' },
          ]);
        }
        break;

      case 'du':
        const showHuman = args.includes('-h');
        addLines([
          { type: 'info', content: '' },
          { type: 'output', content: '\x1b[1;37mDisk Usage (Virtual File System):\x1b[0m' },
          { type: 'info', content: '' },
        ]);
        
        clonedRepos.forEach(repo => {
          const size = showHuman ? formatSize(repo.sizeBytes) : `${repo.sizeBytes}`;
          addLine('output', `${size.padStart(12)}  ${repo.path}`);
        });
        
        addLines([
          { type: 'info', content: '' },
          { type: 'output', content: `${(showHuman ? formatSize(storageStats.totalSize) : String(storageStats.totalSize)).padStart(12)}  \x1b[1;37mtotal\x1b[0m` },
          { type: 'info', content: '' },
        ]);
        break;

      case 'rm':
        if (args[0] === '-rf' && args[1]) {
          const repoName = args[1].replace(/^\//, '').replace(/\/$/, '');
          const repo = clonedRepos.find(r => r.name === repoName || r.path === `/${repoName}`);
          
          if (repo) {
            setRepoToDelete(repo);
            setShowDeleteDialog(true);
          } else {
            addLine('error', `rm: cannot remove '${args[1]}': No such repository`);
            addLine('info', 'Use \x1b[1;33mrepos\x1b[0m to list available repositories');
          }
        } else if (args[0] && !args[0].startsWith('-')) {
          addLine('error', `rm: cannot remove '${args[0]}': Use rm -rf for directories`);
        } else {
          addLine('error', 'rm: missing operand');
          addLine('info', 'Usage: rm -rf <repository-name>');
        }
        break;

      case 'git':
        if (args[0] === 'clone' && args[1]) {
          addLine('info', `Initializing clone for: ${args[1]}`);
          if (onCloneRepository) {
            onCloneRepository(args[1]);
          }
        } else if (args[0] === 'status') {
          addLines([
            { type: 'output', content: 'On branch main' },
            { type: 'output', content: 'nothing to commit, working tree clean' },
          ]);
        } else if (args[0] === 'log') {
          addLines([
            { type: 'output', content: '\x1b[33mcommit abc1234567890...\x1b[0m' },
            { type: 'output', content: 'Author: Developer <dev@example.com>' },
            { type: 'output', content: `Date:   ${new Date().toDateString()}` },
            { type: 'output', content: '' },
            { type: 'output', content: '    Initial commit' },
          ]);
        } else {
          addLine('error', `git: '${args[0] || ''}' is not a git command`);
        }
        break;

      case 'npm':
        if (args[0] === 'install' || args[0] === 'i') {
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: true } : tab
          ));
          addLine('info', '\x1b[1;33m⠋\x1b[0m Installing dependencies...');
          
          setTimeout(() => {
            addLines([
              { type: 'output', content: '' },
              { type: 'output', content: 'added 847 packages, and audited 848 packages in 12s' },
              { type: 'output', content: '' },
              { type: 'output', content: '142 packages are looking for funding' },
              { type: 'output', content: '  run `npm fund` for details' },
              { type: 'output', content: '' },
              { type: 'success', content: '\x1b[1;32m✓\x1b[0m npm install completed successfully' },
              { type: 'output', content: '' },
            ]);
            setTabs(prev => prev.map((tab, idx) => 
              idx === activeTabIndex ? { ...tab, isRunning: false } : tab
            ));
          }, 2500);
        } else if (args[0] === 'run' && args[1]) {
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: true } : tab
          ));
          addLine('info', `\x1b[2m> project@1.0.0 ${args[1]}\x1b[0m`);
          
          setTimeout(() => {
            addLine('success', `\x1b[1;32m✓\x1b[0m Script '${args[1]}' executed successfully`);
            setTabs(prev => prev.map((tab, idx) => 
              idx === activeTabIndex ? { ...tab, isRunning: false } : tab
            ));
          }, 1500);
        } else {
          addLine('error', `npm: '${args[0] || ''}' is not a recognized command`);
        }
        break;

      case 'make':
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, isRunning: true } : tab
        ));
        addLines([
          { type: 'output', content: 'make: Entering directory...' },
          { type: 'output', content: 'ee-gcc -c -O2 -G0 -I$PS2SDK/ee/include main.c -o main.o' },
        ]);
        
        setTimeout(() => addLine('output', 'ee-gcc -c -O2 -G0 draw.c -o draw.o'), 500);
        setTimeout(() => addLine('output', 'ee-ld -T$PS2SDK/ee/startup/linkfile main.o draw.o -o main.elf'), 1000);
        setTimeout(() => {
          addLines([
            { type: 'success', content: '\x1b[1;32m✓\x1b[0m Build successful: main.elf' },
            { type: 'output', content: '' },
          ]);
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: false } : tab
          ));
        }, 1500);
        break;

      case 'ps2-build':
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, isRunning: true } : tab
        ));
        addLines([
          { type: 'info', content: '' },
          { type: 'info', content: '\x1b[1;35m🎮 PS2 Build System v1.0\x1b[0m' },
          { type: 'info', content: '' },
        ]);
        
        setTimeout(() => addLine('output', '  → Compiling EE Core modules...'), 300);
        setTimeout(() => addLine('output', '  → Linking PS2SDK libraries...'), 700);
        setTimeout(() => addLine('output', '  → Processing VU microcode...'), 1100);
        setTimeout(() => addLine('output', '  → Generating ELF executable...'), 1500);
        setTimeout(() => {
          addLines([
            { type: 'info', content: '' },
            { type: 'success', content: '\x1b[1;32m✓\x1b[0m Build completed: \x1b[1;37moutput/game.elf\x1b[0m' },
            { type: 'info', content: '' },
          ]);
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: false } : tab
          ));
        }, 2000);
        break;

      case 'ps2-run':
        addLines([
          { type: 'info', content: '\x1b[1;35m🎮 Starting PS2 Emulator...\x1b[0m' },
          { type: 'output', content: 'PCSX2 loading: output/game.elf' },
        ]);
        setTimeout(() => addLine('success', '\x1b[1;32m✓\x1b[0m Emulator started successfully'), 800);
        break;

      case 'echo':
        addLine('output', args.join(' '));
        break;

      case 'date':
        addLine('output', new Date().toString());
        break;

      case 'whoami':
        addLine('output', 'dev');
        break;

      case 'uname':
        if (args.includes('-a')) {
          addLine('output', 'AthenaOS 1.0.0 PS2-DEV x86_64 GNU/Linux');
        } else {
          addLine('output', 'AthenaOS');
        }
        break;

      case 'history':
        if (commandHistory.length === 0) {
          addLine('output', '\x1b[2m(no commands in history)\x1b[0m');
        } else {
          commandHistory.slice(-20).forEach((cmd, idx) => {
            addLine('output', `  ${String(idx + 1).padStart(4)}  ${cmd}`);
          });
        }
        break;

      case 'exit':
        if (onClose) onClose();
        break;

      case '':
        break;

      default:
        addLine('error', `${activeTab.shell}: command not found: ${cmd}`);
        addLine('info', 'Type \x1b[1;33m"help"\x1b[0m for available commands');
    }
  }, [activeTab, addLine, addLines, onCloneRepository, onClose, activeTabIndex, 
      resolvePath, listDirectory, readFile, clonedRepos, storageStats, 
      saveClonedRepos, onClearClonedData, projectFiles]);

  const handleDeleteRepo = useCallback(() => {
    if (!repoToDelete) return;
    
    // Remove from cloned repos
    const newRepos = clonedRepos.filter(r => r.name !== repoToDelete.name);
    saveClonedRepos(newRepos);
    
    // Call delete callback
    if (onDeleteFiles) {
      onDeleteFiles([repoToDelete.path]);
    }
    
    addLines([
      { type: 'success', content: `\x1b[1;32m✓\x1b[0m Removed repository: ${repoToDelete.name}` },
      { type: 'info', content: `  Freed ${formatSize(repoToDelete.sizeBytes)} of storage` },
      { type: 'info', content: '' },
    ]);
    
    setShowDeleteDialog(false);
    setRepoToDelete(null);
  }, [repoToDelete, clonedRepos, saveClonedRepos, onDeleteFiles, addLines]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputValue);
      setInputValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInputValue('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Autocomplete
      const parts = inputValue.split(' ');
      const lastPart = parts[parts.length - 1];
      
      // Command autocomplete
      if (parts.length === 1) {
        const commands = ['help', 'clear', 'cls', 'ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'tree', 
                         'find', 'wc', 'git', 'npm', 'make', 'repos', 'rm', 'du', 'echo', 'date',
                         'whoami', 'uname', 'history', 'ps2-build', 'ps2-run', 'exit'];
        const match = commands.find(c => c.startsWith(lastPart));
        if (match) setInputValue(match);
      } else {
        // File/directory autocomplete
        const targetDir = activeTab.currentDirectory === '~' ? '/' : activeTab.currentDirectory.replace('~', '');
        const entries = listDirectory(targetDir);
        if (entries) {
          const match = entries.find(e => e.name.startsWith(lastPart));
          if (match) {
            parts[parts.length - 1] = match.name + (match.type === 'folder' ? '/' : '');
            setInputValue(parts.join(' '));
          }
        }
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (activeTab.isRunning) {
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, isRunning: false } : tab
        ));
        addLine('error', '^C');
      } else {
        setInputValue('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setTabs(prev => prev.map((tab, idx) => 
        idx === activeTabIndex ? { ...tab, lines: [] } : tab
      ));
    }
  };

  const addNewTab = () => {
    const newTab: TerminalTab = {
      id: `terminal-${Date.now()}`,
      name: `zsh ${tabs.length + 1}`,
      lines: [
        { id: '1', type: 'system', content: 'ATHENA Terminal - New session', timestamp: new Date() },
      ],
      currentDirectory: '~',
      isRunning: false,
      shell: 'zsh'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabIndex(tabs.length);
  };

  const closeTab = (index: number) => {
    if (tabs.length === 1) return;
    setTabs(prev => prev.filter((_, i) => i !== index));
    if (activeTabIndex >= index && activeTabIndex > 0) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const changeShell = (shell: 'zsh' | 'bash' | 'powershell') => {
    setTabs(prev => prev.map((tab, idx) => 
      idx === activeTabIndex ? { ...tab, shell, name: shell } : tab
    ));
    addLine('info', `Switched to ${shell}`);
  };

  const parseAnsiToSpans = (text: string): React.ReactNode[] => {
    const ansiRegex = /\x1b\[([0-9;]+)m/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let currentStyles: React.CSSProperties = {};
    let match;
    let keyCounter = 0;

    const resetStyles = (): React.CSSProperties => ({});
    
    const getStyleFromCode = (code: number): React.CSSProperties => {
      switch (code) {
        case 0: return resetStyles();
        case 1: return { fontWeight: 'bold' };
        case 2: return { opacity: 0.6 };
        case 30: return { color: '#1e1e1e' };
        case 31: return { color: '#f87171' };
        case 32: return { color: '#4ade80' };
        case 33: return { color: '#facc15' };
        case 34: return { color: '#60a5fa' };
        case 35: return { color: '#c084fc' };
        case 36: return { color: '#22d3ee' };
        case 37: return { color: '#e2e8f0' };
        default: return {};
      }
    };

    while ((match = ansiRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const textSegment = text.slice(lastIndex, match.index);
        parts.push(
          <span key={keyCounter++} style={currentStyles}>
            {textSegment}
          </span>
        );
      }

      const codes = match[1].split(';').map(Number);
      for (const code of codes) {
        if (code === 0) {
          currentStyles = resetStyles();
        } else {
          currentStyles = { ...currentStyles, ...getStyleFromCode(code) };
        }
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        <span key={keyCounter++} style={currentStyles}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : [text];
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      case 'system': return 'text-purple-400';
      case 'input': return 'text-yellow-300';
      case 'warning': return 'text-amber-400';
      default: return 'text-foreground/90';
    }
  };

  return (
    <>
      <div 
        className={`flex flex-col bg-[#1e1e1e] border-t border-border ${isMaximized ? 'fixed inset-0 z-50' : 'h-full'}`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-2 py-1 bg-[#252526] border-b border-[#3c3c3c]">
          <div className="flex items-center gap-1">
            {/* Tabs */}
            <div className="flex items-center">
              {tabs.map((tab, index) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-1 px-3 py-1 text-xs cursor-pointer border-r border-[#3c3c3c] transition-colors ${
                    index === activeTabIndex 
                      ? 'bg-[#1e1e1e] text-foreground' 
                      : 'bg-[#2d2d2d] text-muted-foreground hover:bg-[#333333]'
                  }`}
                  onClick={() => setActiveTabIndex(index)}
                >
                  <Terminal className="w-3 h-3" />
                  <span>{tab.name}</span>
                  {tab.isRunning && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                  {tabs.length > 1 && (
                    <button
                      className="ml-1 hover:bg-[#444444] rounded p-0.5"
                      onClick={(e) => { e.stopPropagation(); closeTab(index); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-[#333333]"
              onClick={addNewTab}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {/* Storage indicator */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1 text-xs hover:bg-[#333333]"
              onClick={() => setShowStorageInfo(!showStorageInfo)}
              title="Storage usage"
            >
              <HardDrive className="w-3 h-3" />
              <span className="text-muted-foreground">{formatSize(storageStats.totalSize)}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 gap-1 text-xs hover:bg-[#333333]">
                  <Terminal className="w-3 h-3" />
                  {activeTab.shell}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#252526] border-[#3c3c3c]">
                <DropdownMenuItem className="text-xs" onClick={() => changeShell('zsh')}>zsh</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => changeShell('bash')}>bash</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => changeShell('powershell')}>PowerShell</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs" onClick={() => executeCommand('repos')}>
                  <FolderOpen className="w-3 h-3 mr-2" />
                  Cloned Repos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-[#333333]"
              onClick={() => setTabs(prev => prev.map((tab, idx) => 
                idx === activeTabIndex ? { ...tab, lines: [] } : tab
              ))}
              title="Clear terminal"
            >
              <Trash2 className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-[#333333]"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-[#333333]"
                onClick={onClose}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Storage Info Banner */}
        {showStorageInfo && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#3c3c3c] text-xs">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                <HardDrive className="w-3 h-3 inline mr-1" />
                {storageStats.repoCount} repos | {storageStats.totalFiles} files | {formatSize(storageStats.totalSize)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs text-amber-400 hover:bg-[#333333] hover:text-amber-300"
              onClick={() => executeCommand('repos clean')}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clean All
            </Button>
          </div>
        )}

        {/* Terminal Content */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-auto p-2 font-mono text-sm"
          style={{ fontFamily: 'Menlo, Monaco, "Courier New", monospace' }}
        >
          {activeTab.lines.map((line) => (
            <div key={line.id} className={`${getLineColor(line.type)} leading-5 whitespace-pre-wrap break-all`}>
              {line.content.includes('\x1b[') ? parseAnsiToSpans(line.content) : line.content}
            </div>
          ))}
          
          {/* Input Line */}
          <div className="flex items-center text-foreground/90 leading-5">
            <span className="text-green-400">{activeTab.currentDirectory}</span>
            <span className="text-foreground/70 mx-1">$</span>
            {activeTab.isRunning ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Running...
                <span className="text-xs">(Ctrl+C to cancel)</span>
              </span>
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none border-none text-foreground/90 caret-white"
                autoFocus
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-2 py-0.5 bg-[#007acc] text-white text-[10px]">
          <div className="flex items-center gap-3">
            <span>UTF-8</span>
            <span>{activeTab.shell}</span>
            <span>{clonedRepos.length} repos</span>
          </div>
          <div className="flex items-center gap-3">
            {activeTab.isRunning && (
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Running
              </span>
            )}
            <span>{activeTab.currentDirectory}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#252526] border-[#3c3c3c] text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Delete Repository
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{repoToDelete?.name}</strong>?
              <br />
              This will remove {repoToDelete?.fileCount} files and free {formatSize(repoToDelete?.sizeBytes || 0)} of storage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              className="hover:bg-[#333333]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRepo}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Repository
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
