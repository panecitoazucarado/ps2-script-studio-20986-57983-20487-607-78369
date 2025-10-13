import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Monitor, Power, RotateCcw, Settings, Maximize2, Volume2, Box, Minimize2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { PS2Engine } from '../PS2/PS2Engine';
import { PS2HardwareMonitor } from '../PS2/PS2HardwareMonitor';
import { AthenaRunner } from './AthenaRunner';
import { FileNode } from '@/types/athena';
import athenaLogo from '@/assets/athena-logo.png';

interface PS2PreviewProps {
  code: string;
  isRunning: boolean;
  onToggleRun: () => void;
  files?: FileNode[];
}

export function PS2Preview({ code, isRunning, onToggleRun, files }: PS2PreviewProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [renderMode, setRenderMode] = useState<'athena' | '3d'>('athena');
  const [consoleVisible, setConsoleVisible] = useState(true);
  const [consoleExpanded, setConsoleExpanded] = useState(true);
  const [commandInput, setCommandInput] = useState('');
  const [hasLoggedStart, setHasLoggedStart] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const frameRef = useRef(0);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const handleLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-99), message]);
  }, []);

  const processCommand = useCallback((command: string) => {
    const cmd = command.trim().toLowerCase();
    
    switch(cmd) {
      case 'clear':
        setLogs([]);
        handleLog('[SYSTEM] Console cleared');
        break;
      
      case 'help':
        handleLog('[SYSTEM] Available commands:');
        handleLog('  clear    - Clear console output');
        handleLog('  help     - Show this help message');
        handleLog('  status   - Show current system status');
        handleLog('  fps      - Show current frame rate');
        handleLog('  memory   - Show memory info (simulated)');
        handleLog('  reset    - Reset frame counter');
        break;
      
      case 'status':
        handleLog(`[SYSTEM] Status: ${isRunning ? 'RUNNING' : 'STOPPED'}`);
        handleLog(`[SYSTEM] Frame Count: ${frameCount}`);
        handleLog(`[SYSTEM] Mode: AthenaEnv`);
        break;
      
      case 'fps':
        const fps = isRunning ? '~60 FPS' : 'N/A (not running)';
        handleLog(`[SYSTEM] Current FPS: ${fps}`);
        break;
      
      case 'memory':
        handleLog('[SYSTEM] PS2 Memory Status:');
        handleLog('  Main RAM: 32 MB');
        handleLog('  VRAM: 4 MB');
        handleLog('  Sound RAM: 2 MB');
        break;
      
      case 'reset':
        setFrameCount(0);
        frameRef.current = 0;
        handleLog('[SYSTEM] Frame counter reset');
        break;
      
      default:
        if (cmd) {
          handleLog(`[ERROR] Unknown command: ${cmd}`);
          handleLog('[SYSTEM] Type "help" for available commands');
        }
    }
  }, [isRunning, frameCount, handleLog]);

  // Auto-open console when execution starts (only once)
  useEffect(() => {
    if (isRunning && !hasLoggedStart) {
      setConsoleVisible(true);
      setConsoleExpanded(true);
      handleLog('[SYSTEM] AthenaEnv initialized successfully');
      setHasLoggedStart(true);
    } else if (!isRunning) {
      setHasLoggedStart(false);
    }
  }, [isRunning, hasLoggedStart, handleLog]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (consoleExpanded) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, consoleExpanded]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      handleLog(`> ${commandInput}`);
      processCommand(commandInput);
      setCommandInput('');
    }
  };

  const handleCloseConsole = () => {
    if (!isRunning) {
      setConsoleVisible(false);
      // Clear logs when closing
      setLogs([]);
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!fullscreenContainerRef.current) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (fullscreenContainerRef.current.requestFullscreen) {
        fullscreenContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Listen for ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Update frame count when running
  useEffect(() => {
    if (!isRunning) {
      setFrameCount(0);
      frameRef.current = 0;
      return;
    }

    const interval = setInterval(() => {
      frameRef.current++;
      setFrameCount(frameRef.current);
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <Card className="h-full flex flex-col bg-card" ref={fullscreenContainerRef}>
      {/* PS2 Header - Minimalist */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50 bg-ide-tab">
          <div className="flex items-center gap-1.5">
            <Badge 
              variant={isRunning ? "default" : "secondary"} 
              className={`h-6 text-xs px-2 ${isRunning ? "bg-ps2-green" : ""}`}
            >
              {isRunning ? 'En ejecución' : 'Detenido'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 hover:bg-accent"
              title="Volumen"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 hover:bg-accent"
              title="Reiniciar"
              onClick={() => {
                setFrameCount(0);
                frameRef.current = 0;
                if (isRunning) {
                  onToggleRun();
                  setTimeout(onToggleRun, 100);
                }
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 hover:bg-accent"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              onClick={onToggleRun}
              size="sm"
              variant={isRunning ? "destructive" : "default"}
              className="h-7 px-3 text-xs"
            >
              <Power className="w-3.5 h-3.5 mr-1.5" />
              {isRunning ? 'Detener' : 'Arrancar'}
            </Button>
          </div>
        </div>
      )}

      {/* PS2 Content */}
      <div className={`flex-1 bg-gradient-to-br from-ps2-blue/10 via-ps2-purple/10 to-background overflow-hidden relative ${isFullscreen ? 'p-0' : 'p-2'}`}>
        {/* Fullscreen Controls Overlay */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-ps2-cyan/30">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-accent text-white"
              title="Volumen"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-accent text-white"
              title="Reiniciar"
              onClick={() => {
                setFrameCount(0);
                frameRef.current = 0;
                if (isRunning) {
                  onToggleRun();
                  setTimeout(onToggleRun, 100);
                }
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-accent text-white"
              title="Salir de pantalla completa (ESC)"
              onClick={toggleFullscreen}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-white/20 mx-1" />
            <Button
              onClick={onToggleRun}
              size="sm"
              variant={isRunning ? "destructive" : "default"}
              className="h-8 px-3 text-xs"
            >
              <Power className="w-4 h-4 mr-1.5" />
              {isRunning ? 'Detener' : 'Arrancar'}
            </Button>
          </div>
        )}
        
        <Tabs defaultValue="athena" className="h-full flex flex-col">
          {!isFullscreen && (
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="athena" className="flex items-center gap-2">
                <img src={athenaLogo} alt="Athena" className="w-4 h-4" />
                AthenaEnv Real-Time
              </TabsTrigger>
              <TabsTrigger value="pcsx2" className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                Conectar con PCSX2
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="athena" className="flex-1 mt-0">
            {/* AthenaEnv Real Runner - PANTALLA COMPLETA */}
            <div className="h-full bg-black rounded-lg overflow-hidden relative ps2-glow">
              <AthenaRunner
                code={code}
                isRunning={isRunning}
                onLog={handleLog}
                files={files}
              />
              {!isRunning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 pointer-events-none">
                  <div className="text-center text-ps2-cyan">
                    <img 
                      src={athenaLogo} 
                      alt="Athena Logo" 
                      className="w-32 h-32 mx-auto mb-4 opacity-60"
                      style={{ filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.3))' }}
                    />
                    <p className="text-xl font-bold opacity-80 mb-2">ATHENA ENV</p>
                    <p className="text-sm opacity-60 mt-2">Real PS2 JavaScript Environment</p>
                    <p className="text-xs opacity-50 mt-3">
                      Press "Arrancar" to start execution
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pcsx2" className="flex-1 mt-0">
            {/* PCSX2 Connection Interface */}
            <div className="h-full bg-black rounded-lg overflow-hidden relative ps2-glow p-8">
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-ps2-blue max-w-md">
                  <Box className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-semibold mb-4">Conectar con PCSX2</p>
                  <p className="text-sm opacity-70 mb-6">
                    Esta función permite ejecutar tu archivo .elf directamente en PCSX2 de tu PC
                  </p>
                  <div className="space-y-3 text-left bg-ps2-blue/10 p-4 rounded-lg border border-ps2-blue/30">
                    <p className="text-xs text-ps2-cyan">Requisitos:</p>
                    <ul className="text-xs opacity-70 space-y-2 list-disc list-inside">
                      <li>PCSX2 instalado en tu PC</li>
                      <li>Plugin de comunicación activo</li>
                      <li>Puerto de conexión configurado</li>
                    </ul>
                  </div>
                  <Button 
                    className="mt-6 bg-ps2-blue hover:bg-ps2-blue/80"
                    disabled
                  >
                    Configurar Conexión (Próximamente)
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* PS2 System Console Terminal */}
      {consoleVisible && !isFullscreen && (
        <div className={`border-t border-border bg-ide-editor transition-all duration-300 ${consoleExpanded ? 'h-48' : 'h-10'}`}>
          {/* Console Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-ide-tab">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-ps2-green animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-xs font-semibold text-ps2-green">PS2 SYSTEM TERMINAL</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-accent"
                onClick={() => setConsoleExpanded(!consoleExpanded)}
                title={consoleExpanded ? 'Minimizar' : 'Expandir'}
              >
                {consoleExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${isRunning ? 'opacity-30 cursor-not-allowed' : 'hover:bg-destructive/20 hover:text-destructive'}`}
                onClick={handleCloseConsole}
                disabled={isRunning}
                title={isRunning ? 'No se puede cerrar durante la ejecución' : 'Cerrar terminal'}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Console Content */}
          {consoleExpanded && (
            <div className="flex flex-col h-[calc(100%-40px)]">
              {/* Logs Display */}
              <div className="flex-1 p-2 text-xs font-mono overflow-y-auto ide-scrollbar">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground italic">PS2 Terminal ready. Waiting for system output...</div>
                ) : (
                  <>
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className={`mb-1 ${
                          log.includes('[ERROR]') 
                            ? 'text-destructive' 
                            : log.includes('[SYSTEM]')
                            ? 'text-ps2-green font-semibold'
                            : log.includes('[LOG]')
                            ? 'text-ps2-cyan'
                            : log.startsWith('>')
                            ? 'text-yellow-400'
                            : 'text-foreground'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                    <div ref={consoleEndRef} />
                  </>
                )}
              </div>

              {/* Command Input */}
              <form onSubmit={handleCommandSubmit} className="border-t border-border/50 p-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ps2-green font-mono">$</span>
                  <Input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="Type command and press Enter..."
                    className="flex-1 h-7 text-xs font-mono bg-black/30 border-border/50 focus:border-ps2-cyan"
                  />
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}