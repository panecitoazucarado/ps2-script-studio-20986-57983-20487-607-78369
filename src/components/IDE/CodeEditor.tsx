import { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Play, Save, Download, X, FileCode, 
  ChevronLeft, ChevronRight, MoreHorizontal,
  FileJson, FileText, Image as ImageIcon, Code2,
  RotateCcw, List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileNode } from '@/types/athena';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  openTabs: FileNode[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  onTabClose: (index: number) => void;
  onFileRename: (index: number, newName: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
}

export function CodeEditor({ 
  code, 
  onChange, 
  onRun, 
  openTabs, 
  activeTabIndex, 
  onTabChange, 
  onTabClose,
  onFileRename,
  onTabReorder
}: CodeEditorProps) {
  const [lineCount, setLineCount] = useState(1);
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenuTab, setContextMenuTab] = useState<number | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [modifiedTabs, setModifiedTabs] = useState<Set<number>>(new Set());
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [closedTabsHistory, setClosedTabsHistory] = useState<FileNode[]>([]);
  const [showTabsList, setShowTabsList] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentFile = openTabs[activeTabIndex];

  // Track modifications
  useEffect(() => {
    const initialContent = openTabs[activeTabIndex].content || '';
    if (code !== initialContent) {
      setModifiedTabs(prev => new Set(prev).add(activeTabIndex));
    }
  }, [code, activeTabIndex, openTabs]);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure Monaco Editor for PS2 development
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontLigatures: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      parameterHints: {
        enabled: true,
      },
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoIndent: 'full',
      bracketPairColorization: {
        enabled: true,
      },
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyCode.F5, () => {
      onRun();
    });

    // Ctrl+W to close tab
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
      if (openTabs.length > 1) {
        handleCloseCurrentTab();
      }
    });
  }, [onRun, openTabs]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  const handleSave = useCallback(() => {
    setModifiedTabs(prev => {
      const newSet = new Set(prev);
      newSet.delete(activeTabIndex);
      return newSet;
    });
    toast({
      title: "File saved",
      description: `${currentFile.name} has been saved successfully`,
    });
  }, [currentFile.name, activeTabIndex, toast]);

  const handleExport = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File exported",
      description: `${currentFile.name} has been exported successfully`,
    });
  }, [code, currentFile.name, toast]);

  const handleDoubleClick = useCallback((index: number) => {
    setEditingTabIndex(index);
    setEditingName(openTabs[index].name);
  }, [openTabs]);

  const handleNameChange = useCallback(() => {
    if (editingTabIndex !== null && editingName.trim()) {
      onFileRename(editingTabIndex, editingName.trim());
    }
    setEditingTabIndex(null);
  }, [editingTabIndex, editingName, onFileRename]);

  const handleContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenuTab(index);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuTab(null);
  }, []);

  const handleCloseOthers = useCallback(() => {
    if (contextMenuTab !== null) {
      // Use callbacks to parent component
      const tabsToClose: number[] = [];
      openTabs.forEach((_, idx) => {
        if (idx !== contextMenuTab) tabsToClose.push(idx);
      });
      tabsToClose.reverse().forEach(idx => onTabClose(idx));
    }
    closeContextMenu();
  }, [contextMenuTab, openTabs, onTabClose, closeContextMenu]);

  const handleCloseToRight = useCallback(() => {
    if (contextMenuTab !== null) {
      const tabsToClose: number[] = [];
      for (let i = openTabs.length - 1; i > contextMenuTab; i--) {
        tabsToClose.push(i);
      }
      tabsToClose.forEach(idx => onTabClose(idx));
    }
    closeContextMenu();
  }, [contextMenuTab, openTabs, onTabClose, closeContextMenu]);

  const handleCloseAll = useCallback(() => {
    if (openTabs.length > 1) {
      // Save all tabs to history except the first one (we keep one open)
      setClosedTabsHistory(prev => [...prev, ...openTabs.slice(1)].slice(-10));
      for (let i = openTabs.length - 1; i > 0; i--) {
        onTabClose(i);
      }
    }
    closeContextMenu();
  }, [openTabs, onTabClose, closeContextMenu]);

  const handleCloseCurrentTab = useCallback(() => {
    if (openTabs.length > 1) {
      const closedTab = openTabs[activeTabIndex];
      setClosedTabsHistory(prev => [...prev, closedTab].slice(-10));
      onTabClose(activeTabIndex);
    }
  }, [openTabs, activeTabIndex, onTabClose]);

  const handleReopenLastClosed = useCallback(() => {
    if (closedTabsHistory.length > 0) {
      const lastClosed = closedTabsHistory[closedTabsHistory.length - 1];
      setClosedTabsHistory(prev => prev.slice(0, -1));
      
      // Trigger parent to re-open the file
      // This would need to be passed as a prop from parent
      toast({
        title: "Tab reopened",
        description: `${lastClosed.name} has been restored`,
      });
    }
  }, [closedTabsHistory, toast]);

  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set a transparent drag image
    const dragImage = document.createElement('div');
    dragImage.style.opacity = '0';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTabIndex !== null && draggedTabIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedTabIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTabIndex !== null && draggedTabIndex !== index) {
      onTabReorder(draggedTabIndex, index);
    }
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  }, [draggedTabIndex, onTabReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  }, []);

  // Comprehensive file type detection
  const getFileTypeInfo = (filename: string): { 
    language: string; 
    displayName: string; 
    color: string;
    icon: React.ReactNode;
    category: string;
  } => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const basename = filename.toLowerCase();
    
    // Special filenames first (no extension)
    const specialFiles: Record<string, { language: string; displayName: string; color: string; category: string }> = {
      'makefile': { language: 'makefile', displayName: 'Makefile', color: 'text-orange-500', category: 'Build' },
      'dockerfile': { language: 'dockerfile', displayName: 'Dockerfile', color: 'text-cyan-500', category: 'Container' },
      'cmakelists.txt': { language: 'cmake', displayName: 'CMake', color: 'text-green-500', category: 'Build' },
      '.gitignore': { language: 'gitignore', displayName: 'Git Ignore', color: 'text-gray-500', category: 'Git' },
      '.gitattributes': { language: 'gitattributes', displayName: 'Git Attrs', color: 'text-gray-500', category: 'Git' },
      '.editorconfig': { language: 'editorconfig', displayName: 'EditorConfig', color: 'text-gray-500', category: 'Config' },
      '.env': { language: 'dotenv', displayName: 'Environment', color: 'text-yellow-600', category: 'Config' },
      '.env.local': { language: 'dotenv', displayName: 'Env Local', color: 'text-yellow-600', category: 'Config' },
      '.env.production': { language: 'dotenv', displayName: 'Env Prod', color: 'text-yellow-600', category: 'Config' },
      '.babelrc': { language: 'json', displayName: 'Babel', color: 'text-yellow-500', category: 'Config' },
      '.eslintrc': { language: 'json', displayName: 'ESLint', color: 'text-purple-500', category: 'Config' },
      '.prettierrc': { language: 'json', displayName: 'Prettier', color: 'text-pink-500', category: 'Config' },
      'package.json': { language: 'json', displayName: 'Package', color: 'text-green-500', category: 'Node' },
      'package-lock.json': { language: 'json', displayName: 'Lock File', color: 'text-green-600', category: 'Node' },
      'tsconfig.json': { language: 'json', displayName: 'TypeScript Config', color: 'text-blue-500', category: 'Config' },
      'vite.config.ts': { language: 'typescript', displayName: 'Vite Config', color: 'text-purple-500', category: 'Config' },
      'tailwind.config.ts': { language: 'typescript', displayName: 'Tailwind', color: 'text-cyan-500', category: 'Config' },
      'readme.md': { language: 'markdown', displayName: 'README', color: 'text-blue-400', category: 'Docs' },
      'license': { language: 'plaintext', displayName: 'License', color: 'text-gray-500', category: 'Docs' },
      'changelog.md': { language: 'markdown', displayName: 'Changelog', color: 'text-blue-400', category: 'Docs' },
    };

    // Check special filenames
    if (specialFiles[basename]) {
      const info = specialFiles[basename];
      return {
        ...info,
        icon: getIconForType(info.language, info.color)
      };
    }

    // Extension-based detection
    const extensionMap: Record<string, { language: string; displayName: string; color: string; category: string }> = {
      // JavaScript/TypeScript
      'js': { language: 'javascript', displayName: 'JavaScript', color: 'text-yellow-400', category: 'Script' },
      'jsx': { language: 'javascript', displayName: 'React JSX', color: 'text-cyan-400', category: 'React' },
      'ts': { language: 'typescript', displayName: 'TypeScript', color: 'text-blue-500', category: 'Script' },
      'tsx': { language: 'typescript', displayName: 'React TSX', color: 'text-blue-400', category: 'React' },
      'mjs': { language: 'javascript', displayName: 'ES Module', color: 'text-yellow-500', category: 'Script' },
      'cjs': { language: 'javascript', displayName: 'CommonJS', color: 'text-yellow-600', category: 'Script' },
      
      // Web
      'html': { language: 'html', displayName: 'HTML', color: 'text-orange-500', category: 'Web' },
      'htm': { language: 'html', displayName: 'HTML', color: 'text-orange-500', category: 'Web' },
      'css': { language: 'css', displayName: 'CSS', color: 'text-blue-500', category: 'Style' },
      'scss': { language: 'scss', displayName: 'SCSS', color: 'text-pink-500', category: 'Style' },
      'sass': { language: 'sass', displayName: 'Sass', color: 'text-pink-400', category: 'Style' },
      'less': { language: 'less', displayName: 'Less', color: 'text-blue-600', category: 'Style' },
      
      // Data
      'json': { language: 'json', displayName: 'JSON', color: 'text-yellow-500', category: 'Data' },
      'jsonc': { language: 'jsonc', displayName: 'JSON+Comments', color: 'text-yellow-500', category: 'Data' },
      'yaml': { language: 'yaml', displayName: 'YAML', color: 'text-red-400', category: 'Data' },
      'yml': { language: 'yaml', displayName: 'YAML', color: 'text-red-400', category: 'Data' },
      'xml': { language: 'xml', displayName: 'XML', color: 'text-orange-400', category: 'Data' },
      'toml': { language: 'toml', displayName: 'TOML', color: 'text-gray-400', category: 'Config' },
      'ini': { language: 'ini', displayName: 'INI', color: 'text-gray-500', category: 'Config' },
      'cfg': { language: 'ini', displayName: 'Config', color: 'text-gray-500', category: 'Config' },
      'conf': { language: 'ini', displayName: 'Config', color: 'text-gray-500', category: 'Config' },
      'cnf': { language: 'ini', displayName: 'Config', color: 'text-gray-500', category: 'Config' },
      
      // C/C++/PS2
      'c': { language: 'c', displayName: 'C', color: 'text-blue-600', category: 'Native' },
      'h': { language: 'c', displayName: 'C Header', color: 'text-blue-500', category: 'Native' },
      'cpp': { language: 'cpp', displayName: 'C++', color: 'text-blue-500', category: 'Native' },
      'cc': { language: 'cpp', displayName: 'C++', color: 'text-blue-500', category: 'Native' },
      'cxx': { language: 'cpp', displayName: 'C++', color: 'text-blue-500', category: 'Native' },
      'hpp': { language: 'cpp', displayName: 'C++ Header', color: 'text-blue-400', category: 'Native' },
      'hxx': { language: 'cpp', displayName: 'C++ Header', color: 'text-blue-400', category: 'Native' },
      
      // Assembly/Low-level
      's': { language: 'assembly', displayName: 'Assembly', color: 'text-red-500', category: 'ASM' },
      'asm': { language: 'assembly', displayName: 'Assembly', color: 'text-red-500', category: 'ASM' },
      'vcl': { language: 'assembly', displayName: 'VU Microcode', color: 'text-purple-500', category: 'PS2' },
      'vsm': { language: 'assembly', displayName: 'VU Shader', color: 'text-purple-400', category: 'PS2' },
      'dsm': { language: 'assembly', displayName: 'DMA Script', color: 'text-purple-600', category: 'PS2' },
      
      // Shaders
      'glsl': { language: 'glsl', displayName: 'GLSL', color: 'text-green-500', category: 'Shader' },
      'vert': { language: 'glsl', displayName: 'Vertex Shader', color: 'text-green-400', category: 'Shader' },
      'frag': { language: 'glsl', displayName: 'Fragment Shader', color: 'text-green-600', category: 'Shader' },
      'hlsl': { language: 'hlsl', displayName: 'HLSL', color: 'text-blue-400', category: 'Shader' },
      
      // Scripts
      'py': { language: 'python', displayName: 'Python', color: 'text-yellow-500', category: 'Script' },
      'lua': { language: 'lua', displayName: 'Lua', color: 'text-blue-500', category: 'Script' },
      'rb': { language: 'ruby', displayName: 'Ruby', color: 'text-red-500', category: 'Script' },
      'sh': { language: 'shell', displayName: 'Shell', color: 'text-green-500', category: 'Script' },
      'bash': { language: 'shell', displayName: 'Bash', color: 'text-green-500', category: 'Script' },
      'zsh': { language: 'shell', displayName: 'Zsh', color: 'text-green-400', category: 'Script' },
      'bat': { language: 'bat', displayName: 'Batch', color: 'text-gray-500', category: 'Script' },
      'cmd': { language: 'bat', displayName: 'Command', color: 'text-gray-500', category: 'Script' },
      'ps1': { language: 'powershell', displayName: 'PowerShell', color: 'text-blue-500', category: 'Script' },
      
      // Build
      'mak': { language: 'makefile', displayName: 'Makefile', color: 'text-orange-500', category: 'Build' },
      'mk': { language: 'makefile', displayName: 'Makefile', color: 'text-orange-500', category: 'Build' },
      'cmake': { language: 'cmake', displayName: 'CMake', color: 'text-green-500', category: 'Build' },
      'ld': { language: 'linker', displayName: 'Linker Script', color: 'text-orange-600', category: 'Build' },
      
      // Documentation
      'md': { language: 'markdown', displayName: 'Markdown', color: 'text-blue-400', category: 'Docs' },
      'mdx': { language: 'mdx', displayName: 'MDX', color: 'text-blue-500', category: 'Docs' },
      'txt': { language: 'plaintext', displayName: 'Text', color: 'text-gray-500', category: 'Docs' },
      'rst': { language: 'restructuredtext', displayName: 'RST', color: 'text-gray-500', category: 'Docs' },
      
      // Images
      'png': { language: 'image', displayName: 'PNG', color: 'text-purple-500', category: 'Image' },
      'jpg': { language: 'image', displayName: 'JPEG', color: 'text-purple-500', category: 'Image' },
      'jpeg': { language: 'image', displayName: 'JPEG', color: 'text-purple-500', category: 'Image' },
      'gif': { language: 'image', displayName: 'GIF', color: 'text-purple-500', category: 'Image' },
      'svg': { language: 'xml', displayName: 'SVG', color: 'text-orange-400', category: 'Image' },
      'ico': { language: 'image', displayName: 'Icon', color: 'text-purple-400', category: 'Image' },
      'webp': { language: 'image', displayName: 'WebP', color: 'text-purple-500', category: 'Image' },
      
      // Other
      'sql': { language: 'sql', displayName: 'SQL', color: 'text-blue-500', category: 'Database' },
      'graphql': { language: 'graphql', displayName: 'GraphQL', color: 'text-pink-500', category: 'API' },
      'gql': { language: 'graphql', displayName: 'GraphQL', color: 'text-pink-500', category: 'API' },
      'wasm': { language: 'wasm', displayName: 'WebAssembly', color: 'text-purple-600', category: 'Binary' },
      'elf': { language: 'binary', displayName: 'ELF Binary', color: 'text-gray-600', category: 'Binary' },
      'irx': { language: 'binary', displayName: 'IOP Module', color: 'text-cyan-600', category: 'PS2' },
    };

    if (ext && extensionMap[ext]) {
      const info = extensionMap[ext];
      return {
        ...info,
        icon: getIconForType(info.language, info.color)
      };
    }

    // Default fallback
    return {
      language: 'plaintext',
      displayName: 'Plain Text',
      color: 'text-gray-400',
      category: 'File',
      icon: <FileText className="w-3.5 h-3.5 shrink-0 text-gray-400" />
    };
  };

  const getIconForType = (language: string, color: string): React.ReactNode => {
    const iconClass = `w-3.5 h-3.5 shrink-0 ${color}`;
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        return <Code2 className={iconClass} />;
      case 'json':
      case 'jsonc':
        return <FileJson className={iconClass} />;
      case 'image':
        return <ImageIcon className={iconClass} />;
      case 'markdown':
      case 'plaintext':
        return <FileText className={iconClass} />;
      default:
        return <FileCode className={iconClass} />;
    }
  };

  const getFileIcon = (filename: string) => {
    return getFileTypeInfo(filename).icon;
  };

  useEffect(() => {
    if (editingTabIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabIndex]);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [closeContextMenu]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Tab or Ctrl+Shift+Tab to navigate tabs
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          // Previous tab
          const newIndex = activeTabIndex > 0 ? activeTabIndex - 1 : openTabs.length - 1;
          onTabChange(newIndex);
        } else {
          // Next tab
          const newIndex = activeTabIndex < openTabs.length - 1 ? activeTabIndex + 1 : 0;
          onTabChange(newIndex);
        }
      }
      
      // Ctrl+Shift+T to reopen last closed tab
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        handleReopenLastClosed();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTabIndex, openTabs, onTabChange, handleReopenLastClosed]);

  const getLanguage = (filename: string): string => {
    return getFileTypeInfo(filename).language;
  };

  const getCursorPosition = () => {
    if (!editorRef.current) return { line: 1, column: 1 };
    const position = editorRef.current.getPosition();
    return {
      line: position?.lineNumber || 1,
      column: position?.column || 1,
    };
  };

  return (
    <Card className="h-full flex flex-col bg-ide-editor border-border relative">
      {/* Professional Header - VS Code Style */}
      <div className="flex flex-col border-b border-border bg-[hsl(var(--ide-tab))]">
        {/* Tabs Row with Navigation */}
        <div className="flex items-center gap-0">
          {/* Scroll Left Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-8 px-0 shrink-0 rounded-none hover:bg-muted/50"
            onClick={() => scrollTabs('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Tabs Container */}
          <div 
            ref={tabsContainerRef}
            className="flex items-center gap-0 overflow-x-auto scrollbar-thin scroll-smooth flex-1"
          >
            {openTabs.map((tab, index) => (
            <div
              key={tab.path}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                group relative flex items-center gap-2 px-4 py-2 min-w-[140px] max-w-[220px]
                border-t-2 border-r border-border/50
                transition-all duration-200 select-none
                ${draggedTabIndex === index ? 'opacity-50 cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}
                ${dragOverIndex === index ? 'border-l-2 border-l-[hsl(var(--ps2-blue))]' : ''}
                ${index === activeTabIndex 
                  ? 'bg-[hsl(var(--ide-editor))] border-t-[hsl(var(--ps2-blue))] text-foreground shadow-sm' 
                  : 'bg-[hsl(var(--ide-tab))] border-t-transparent text-muted-foreground hover:bg-[hsl(var(--ide-editor))]/70 hover:text-foreground'
                }
              `}
              onClick={() => onTabChange(index)}
              onContextMenu={(e) => handleContextMenu(e, index)}
              title={tab.path}
            >
              {/* File Icon */}
              {getFileIcon(tab.name)}
              
              {/* File Name */}
              {editingTabIndex === index ? (
                <Input
                  ref={inputRef}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleNameChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameChange();
                    if (e.key === 'Escape') setEditingTabIndex(null);
                  }}
                  className="h-5 px-1 py-0 text-xs border-[hsl(var(--ps2-blue))] bg-background"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span 
                  className="text-xs font-medium truncate flex-1"
                  onDoubleClick={() => handleDoubleClick(index)}
                >
                  {tab.name}
                </span>
              )}
              
              {/* Modified Indicator */}
              {modifiedTabs.has(index) && (
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--ps2-blue))] shrink-0" title="Unsaved changes" />
              )}
              
              {/* Close Button */}
              {openTabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(index);
                  }}
                  className={`
                    ${modifiedTabs.has(index) ? 'opacity-0' : 'opacity-0'}
                    group-hover:opacity-100
                    hover:bg-muted/80 rounded p-0.5 
                    transition-all duration-150
                    ml-auto shrink-0
                  `}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              
              {/* Active Tab Indicator */}
              {index === activeTabIndex && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--ps2-blue))]" />
              )}
            </div>
          ))}
          </div>

          {/* Scroll Right Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-8 px-0 shrink-0 rounded-none hover:bg-muted/50"
            onClick={() => scrollTabs('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Tabs Dropdown List */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-8 px-0 shrink-0 rounded-none hover:bg-muted/50 border-l border-border/50"
              >
                <List className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto bg-popover z-50">
              {openTabs.map((tab, index) => (
                <DropdownMenuItem
                  key={tab.path}
                  onClick={() => onTabChange(index)}
                  className={`flex items-center gap-2 ${index === activeTabIndex ? 'bg-accent' : ''}`}
                >
                  {getFileIcon(tab.name)}
                  <span className="flex-1 truncate">{tab.name}</span>
                  {modifiedTabs.has(index) && (
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--ps2-blue))]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reopen Last Closed Tab */}
          {closedTabsHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-8 px-0 shrink-0 rounded-none hover:bg-muted/50 border-l border-border/50"
              onClick={handleReopenLastClosed}
              title={`Reopen ${closedTabsHistory[closedTabsHistory.length - 1]?.name}`}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Professional Actions Row */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[hsl(var(--ide-editor))]/50 border-t border-border/30">
          {/* Left: File Info */}
          <div className="flex items-center gap-3">
            {/* File Icon & Name */}
            <div className="flex items-center gap-2">
              {getFileIcon(currentFile.name)}
              <span className="font-medium text-xs text-foreground">{currentFile.name}</span>
            </div>
            
            {/* Separator */}
            <div className="h-4 w-px bg-border/50" />
            
            {/* File Type Badge */}
            {(() => {
              const fileInfo = getFileTypeInfo(currentFile.name);
              return (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-2 py-0.5 h-5 font-medium border-border/50 ${fileInfo.color}`}
                  >
                    {fileInfo.displayName}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] px-1.5 py-0.5 h-5 bg-muted/50 text-muted-foreground"
                  >
                    {fileInfo.category}
                  </Badge>
                </div>
              );
            })()}
            
            {/* Separator */}
            <div className="h-4 w-px bg-border/50" />
            
            {/* Line Count & Encoding */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>Ln {lineCount}</span>
              <span>•</span>
              <span>UTF-8</span>
              {modifiedTabs.has(activeTabIndex) && (
                <>
                  <span>•</span>
                  <span className="text-[hsl(var(--ps2-orange))]">Modified</span>
                </>
              )}
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-[10px] hover:bg-muted gap-1"
              onClick={handleSave}
              title="Save file (Ctrl+S)"
            >
              <Save className="w-3 h-3" />
              Save
            </Button>
            
            <div className="h-4 w-px bg-border/50" />
            
            <Button 
              onClick={onRun} 
              size="sm" 
              className="h-6 px-2 text-[10px] bg-[hsl(var(--ps2-green))] hover:bg-[hsl(var(--ps2-green))]/80 text-primary-foreground gap-1"
              title="Run script (F5)"
            >
              <Play className="w-3 h-3" />
              Run
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-[10px] hover:bg-muted gap-1"
              onClick={handleExport}
              title="Export current file"
            >
              <Download className="w-3 h-3" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuTab !== null && (
        <div
          className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50 min-w-[180px] animate-in fade-in-0 zoom-in-95"
          style={{ 
            left: `${contextMenuPosition.x}px`, 
            top: `${contextMenuPosition.y}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors flex items-center gap-2"
            onClick={() => {
              onTabClose(contextMenuTab);
              closeContextMenu();
            }}
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
            onClick={handleCloseOthers}
            disabled={openTabs.length === 1}
          >
            Close Others
          </button>
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
            onClick={handleCloseToRight}
            disabled={contextMenuTab === openTabs.length - 1}
          >
            Close to the Right
          </button>
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors text-destructive"
            onClick={handleCloseAll}
            disabled={openTabs.length === 1}
          >
            Close All
          </button>
          <div className="h-px bg-border my-1" />
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
            onClick={() => {
              handleDoubleClick(contextMenuTab);
              closeContextMenu();
            }}
          >
            Rename
          </button>
          {closedTabsHistory.length > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <button
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors flex items-center gap-2"
                onClick={() => {
                  handleReopenLastClosed();
                  closeContextMenu();
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reopen Last Closed
              </button>
            </>
          )}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={getLanguage(currentFile.name)}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: {
              enabled: true,
            },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            bracketPairColorization: {
              enabled: true,
            },
          }}
        />
      </div>

      {/* Editor Status Bar */}
      <div className="ide-statusbar flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">{getLanguage(currentFile.name).toUpperCase()}</span>
          <span className="text-muted-foreground">UTF-8</span>
          <span className="text-muted-foreground">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-[10px]">
            {openTabs.length} tab{openTabs.length > 1 ? 's' : ''} • {modifiedTabs.size} modified
          </span>
          <span className="text-muted-foreground">
            Ln {getCursorPosition().line}, Col {getCursorPosition().column}
          </span>
          <span className="text-muted-foreground">Spaces: 2</span>
        </div>
      </div>
    </Card>
  );
}