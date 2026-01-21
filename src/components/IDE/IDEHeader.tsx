import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Save, 
  FolderOpen, 
  Download, 
  Upload, 
  Settings, 
  HelpCircle,
  Github,
  Gamepad2,
  Code,
  Play,
  MonitorPlay,
  Eye,
  EyeOff,
  Sidebar,
  Bot,
  Terminal,
  Wrench,
  FileSearch,
  Bug,
  Cpu,
  Activity,
  ChevronDown
} from 'lucide-react';
import { WindowConfigMenu } from './WindowConfigMenu';

interface IDEHeaderProps {
  showFileExplorer: boolean;
  showPreview: boolean;
  showAIChat: boolean;
  showTerminal?: boolean;
  onToggleFileExplorer: () => void;
  onTogglePreview: () => void;
  onToggleAIChat: () => void;
  onToggleAIChatWindow: () => void;
  onToggleTerminal?: () => void;
}

export function IDEHeader({ 
  showFileExplorer, 
  showPreview,
  showAIChat,
  showTerminal,
  onToggleFileExplorer, 
  onTogglePreview,
  onToggleAIChat,
  onToggleAIChatWindow,
  onToggleTerminal
}: IDEHeaderProps) {
  return (
    <header className="ide-statusbar border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Gamepad2 className="w-5 h-5 text-ps2-purple" />
          <span className="font-bold text-base gradient-text">ATHENA ENV</span>
          <Badge variant="outline" className="text-xs border-ps2-blue text-ps2-blue px-1.5 py-0">
            PS2
          </Badge>
        </div>

        {/* Center: View Controls */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button 
              variant={showFileExplorer ? "secondary" : "ghost"}
              size="sm" 
              className="h-8 px-3 gap-2"
              onClick={onToggleFileExplorer}
            >
              <Sidebar className="w-4 h-4" />
              <span className="hidden sm:inline">Explorador</span>
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button 
              variant={showPreview ? "secondary" : "ghost"}
              size="sm" 
              className="h-8 px-3 gap-2"
              onClick={onTogglePreview}
            >
              <MonitorPlay className="w-4 h-4" />
              <span className="hidden sm:inline">Vista Previa</span>
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button 
              variant={showAIChat ? "secondary" : "ghost"}
              size="sm" 
              className="h-8 px-3 gap-2 bg-gradient-to-r from-ps2-purple/10 to-ps2-cyan/10 hover:from-ps2-purple/20 hover:to-ps2-cyan/20"
              onClick={onToggleAIChatWindow}
            >
              <Bot className="w-4 h-4 text-ps2-purple" />
              <span className="hidden sm:inline text-ps2-purple">IA Developer</span>
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Development Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm" 
                  className="h-8 px-3 gap-2"
                >
                  <Wrench className="w-4 h-4 text-ps2-orange" />
                  <span className="hidden sm:inline">Herramientas</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Herramientas de Desarrollo
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={onToggleTerminal}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-ps2-green" />
                  <div className="flex flex-col">
                    <span>Terminal ZSH</span>
                    <span className="text-xs text-muted-foreground">Línea de comandos integrada</span>
                  </div>
                  {showTerminal && (
                    <Badge variant="secondary" className="ml-auto text-xs">Activo</Badge>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer opacity-50" disabled>
                  <Bug className="w-4 h-4 text-ps2-red" />
                  <div className="flex flex-col">
                    <span>Depurador</span>
                    <span className="text-xs text-muted-foreground">Debug de código PS2</span>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">Próximamente</Badge>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer opacity-50" disabled>
                  <Cpu className="w-4 h-4 text-ps2-blue" />
                  <div className="flex flex-col">
                    <span>Monitor de Rendimiento</span>
                    <span className="text-xs text-muted-foreground">CPU, GPU, Memoria</span>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">Próximamente</Badge>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer opacity-50" disabled>
                  <FileSearch className="w-4 h-4 text-ps2-cyan" />
                  <div className="flex flex-col">
                    <span>Buscador Global</span>
                    <span className="text-xs text-muted-foreground">Buscar en todo el proyecto</span>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">Próximamente</Badge>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer opacity-50" disabled>
                  <Activity className="w-4 h-4 text-ps2-purple" />
                  <div className="flex flex-col">
                    <span>Profiler EE/VU</span>
                    <span className="text-xs text-muted-foreground">Análisis de rendimiento</span>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">Próximamente</Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Github className="w-4 h-4" />
          </Button>
          
          <WindowConfigMenu />
        </div>
      </div>
    </header>
  );
}