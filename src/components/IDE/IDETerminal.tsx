import { useState, useRef, useEffect, useCallback } from 'react';
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
  Play,
  Square
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'system';
  content: string;
  timestamp: Date;
}

interface TerminalTab {
  id: string;
  name: string;
  lines: TerminalLine[];
  currentDirectory: string;
  isRunning: boolean;
}

interface IDETerminalProps {
  onClose?: () => void;
  onCloneRepository?: (url: string) => void;
  isCloning?: boolean;
  cloneProgress?: string[];
}

export function IDETerminal({ onClose, onCloneRepository, isCloning, cloneProgress }: IDETerminalProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'terminal-1',
      name: 'zsh',
      lines: [
        { id: '1', type: 'system', content: 'ATHENA ENV Terminal v1.0.0 - PlayStation 2 Development Environment', timestamp: new Date() },
        { id: '2', type: 'system', content: 'Type "help" for available commands.', timestamp: new Date() },
        { id: '3', type: 'output', content: '', timestamp: new Date() },
      ],
      currentDirectory: '~/athena-project',
      isRunning: false
    }
  ]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs[activeTabIndex];

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab?.lines]);

  // Add clone progress lines
  useEffect(() => {
    if (cloneProgress && cloneProgress.length > 0) {
      const newLines = cloneProgress.map((line, index) => ({
        id: `clone-${Date.now()}-${index}`,
        type: line.includes('error') || line.includes('Error') ? 'error' as const : 
              line.includes('✓') || line.includes('Clonación completada') ? 'success' as const : 
              'info' as const,
        content: line,
        timestamp: new Date()
      }));

      setTabs(prev => prev.map((tab, idx) => 
        idx === activeTabIndex 
          ? { ...tab, lines: [...tab.lines.filter(l => !l.id.startsWith('clone-')), ...newLines] }
          : tab
      ));
    }
  }, [cloneProgress]);

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

  const executeCommand = useCallback((command: string) => {
    const cmd = command.trim().toLowerCase();
    const args = command.trim().split(' ').slice(1);

    // Add command to history
    if (command.trim()) {
      setCommandHistory(prev => [...prev, command]);
      setHistoryIndex(-1);
    }

    // Add input line
    addLine('input', `${activeTab.currentDirectory} $ ${command}`);

    // Execute command
    switch (cmd.split(' ')[0]) {
      case 'help':
        addLine('info', '═══════════════════════════════════════════════════════════');
        addLine('info', '  ATHENA ENV Terminal - Comandos Disponibles');
        addLine('info', '═══════════════════════════════════════════════════════════');
        addLine('output', '  help          - Muestra esta ayuda');
        addLine('output', '  clear         - Limpia la terminal');
        addLine('output', '  ls            - Lista archivos en directorio actual');
        addLine('output', '  cd <dir>      - Cambia de directorio');
        addLine('output', '  pwd           - Muestra directorio actual');
        addLine('output', '  cat <file>    - Muestra contenido de archivo');
        addLine('output', '  mkdir <name>  - Crea directorio');
        addLine('output', '  touch <file>  - Crea archivo vacío');
        addLine('output', '  rm <file>     - Elimina archivo/directorio');
        addLine('output', '  echo <text>   - Imprime texto');
        addLine('output', '  git clone <url> - Clona repositorio de GitHub');
        addLine('output', '  npm install   - Instala dependencias (simulado)');
        addLine('output', '  npm run build - Compila el proyecto (simulado)');
        addLine('output', '  ps2-build     - Compila proyecto PS2');
        addLine('output', '  ps2-run       - Ejecuta en emulador');
        addLine('output', '  exit          - Cierra la terminal');
        addLine('info', '═══════════════════════════════════════════════════════════');
        break;

      case 'clear':
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, lines: [] } : tab
        ));
        break;

      case 'ls':
        addLine('output', 'src/         package.json    README.md');
        addLine('output', 'public/      tsconfig.json   vite.config.ts');
        addLine('output', 'node_modules/  index.html');
        break;

      case 'pwd':
        addLine('output', activeTab.currentDirectory);
        break;

      case 'cd':
        if (args[0]) {
          const newDir = args[0] === '..' 
            ? activeTab.currentDirectory.split('/').slice(0, -1).join('/') || '~'
            : `${activeTab.currentDirectory}/${args[0]}`;
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, currentDirectory: newDir } : tab
          ));
          addLine('output', `Directorio cambiado a: ${newDir}`);
        } else {
          addLine('error', 'cd: falta argumento de directorio');
        }
        break;

      case 'echo':
        addLine('output', args.join(' '));
        break;

      case 'git':
        if (args[0] === 'clone' && args[1]) {
          addLine('info', `Clonando repositorio: ${args[1]}`);
          if (onCloneRepository) {
            onCloneRepository(args[1]);
          }
        } else if (args[0] === 'status') {
          addLine('output', 'On branch main');
          addLine('output', 'nothing to commit, working tree clean');
        } else {
          addLine('error', `git: comando '${args[0] || ''}' no reconocido`);
        }
        break;

      case 'npm':
        if (args[0] === 'install' || args[0] === 'i') {
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: true } : tab
          ));
          addLine('info', '📦 Installing dependencies...');
          
          // Simular instalación
          setTimeout(() => {
            addLine('output', 'added 1245 packages in 8.5s');
            addLine('success', '✓ npm install completed successfully');
            setTabs(prev => prev.map((tab, idx) => 
              idx === activeTabIndex ? { ...tab, isRunning: false } : tab
            ));
          }, 2000);
        } else if (args[0] === 'run') {
          addLine('info', `Ejecutando script: ${args[1] || 'default'}`);
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: true } : tab
          ));
          setTimeout(() => {
            addLine('success', '✓ Script ejecutado correctamente');
            setTabs(prev => prev.map((tab, idx) => 
              idx === activeTabIndex ? { ...tab, isRunning: false } : tab
            ));
          }, 1500);
        } else {
          addLine('error', `npm: comando '${args[0] || ''}' no reconocido`);
        }
        break;

      case 'ps2-build':
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, isRunning: true } : tab
        ));
        addLine('info', '🎮 PS2 Build System v1.0');
        addLine('output', 'Compilando para PlayStation 2...');
        setTimeout(() => addLine('output', '  → Compilando módulos EE Core...'), 500);
        setTimeout(() => addLine('output', '  → Enlazando bibliotecas PS2SDK...'), 1000);
        setTimeout(() => addLine('output', '  → Generando ELF...'), 1500);
        setTimeout(() => {
          addLine('success', '✓ Build completado: output/game.elf');
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: false } : tab
          ));
        }, 2000);
        break;

      case 'ps2-run':
        addLine('info', '🎮 Iniciando emulador PS2...');
        addLine('output', 'PCSX2 starting with: output/game.elf');
        setTimeout(() => addLine('success', '✓ Emulador iniciado correctamente'), 1000);
        break;

      case 'mkdir':
        if (args[0]) {
          addLine('success', `✓ Directorio creado: ${args[0]}`);
        } else {
          addLine('error', 'mkdir: falta nombre de directorio');
        }
        break;

      case 'touch':
        if (args[0]) {
          addLine('success', `✓ Archivo creado: ${args[0]}`);
        } else {
          addLine('error', 'touch: falta nombre de archivo');
        }
        break;

      case 'exit':
        if (onClose) onClose();
        break;

      case '':
        break;

      default:
        addLine('error', `zsh: comando no encontrado: ${cmd.split(' ')[0]}`);
        addLine('info', 'Escribe "help" para ver los comandos disponibles');
    }
  }, [activeTab, addLine, onCloneRepository, onClose, activeTabIndex]);

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
      // Simple autocomplete
      const suggestions = ['help', 'clear', 'ls', 'cd', 'pwd', 'git clone', 'npm install', 'npm run', 'ps2-build', 'ps2-run'];
      const match = suggestions.find(s => s.startsWith(inputValue));
      if (match) setInputValue(match);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (activeTab.isRunning) {
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, isRunning: false } : tab
        ));
        addLine('error', '^C');
      }
    }
  };

  const addNewTab = () => {
    const newTab: TerminalTab = {
      id: `terminal-${Date.now()}`,
      name: `zsh ${tabs.length + 1}`,
      lines: [
        { id: '1', type: 'system', content: 'ATHENA ENV Terminal - Nueva sesión', timestamp: new Date() },
      ],
      currentDirectory: '~/athena-project',
      isRunning: false
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

  const parseAnsiToSpans = (text: string): React.ReactNode[] => {
    // Parse ANSI escape codes and convert to styled spans
    const ansiRegex = /\x1b\[([0-9;]+)m/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let currentStyles: React.CSSProperties = {};
    let match;
    let keyCounter = 0;

    const resetStyles = (): React.CSSProperties => ({});
    
    const getStyleFromCode = (code: number): React.CSSProperties => {
      switch (code) {
        case 0: return resetStyles(); // Reset
        case 1: return { fontWeight: 'bold' }; // Bold
        case 2: return { opacity: 0.6 }; // Dim
        case 30: return { color: '#1e1e1e' }; // Black
        case 31: return { color: '#f87171' }; // Red
        case 32: return { color: '#4ade80' }; // Green
        case 33: return { color: '#facc15' }; // Yellow
        case 34: return { color: '#60a5fa' }; // Blue
        case 35: return { color: '#c084fc' }; // Magenta
        case 36: return { color: '#22d3ee' }; // Cyan
        case 37: return { color: '#e2e8f0' }; // White
        default: return {};
      }
    };

    while ((match = ansiRegex.exec(text)) !== null) {
      // Add text before this match with current styles
      if (match.index > lastIndex) {
        const textSegment = text.slice(lastIndex, match.index);
        parts.push(
          <span key={keyCounter++} style={currentStyles}>
            {textSegment}
          </span>
        );
      }

      // Parse the style codes
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

    // Add remaining text
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
      default: return 'text-foreground/90';
    }
  };

  return (
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 gap-1 text-xs hover:bg-[#333333]">
                <Terminal className="w-3 h-3" />
                zsh
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#252526] border-[#3c3c3c]">
              <DropdownMenuItem className="text-xs">zsh</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">bash</DropdownMenuItem>
              <DropdownMenuItem className="text-xs">PowerShell</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-[#333333]"
            onClick={() => setTabs(prev => prev.map((tab, idx) => 
              idx === activeTabIndex ? { ...tab, lines: [] } : tab
            ))}
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
              Ejecutando...
              <span className="text-xs">(Ctrl+C para cancelar)</span>
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
          <span>zsh</span>
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
  );
}
