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
  ChevronDown,
  FilePlus2,
  Sparkles,
  PenTool
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
  onOpenQuickCreate?: () => void;
  onOpenVisualBuilder?: () => void;
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
  onToggleTerminal,
  onOpenQuickCreate,
  onOpenVisualBuilder
}: IDEHeaderProps) {
  return (
    <header className="ide-statusbar border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 gap-2">
        {/* Left: Logo - Compact */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Gamepad2 className="w-4 h-4 text-ps2-purple" />
          <span className="font-bold text-sm gradient-text hidden md:inline">ATHENA</span>
          <Badge variant="outline" className="text-[10px] border-ps2-blue text-ps2-blue px-1 py-0 h-4">
            PS2
          </Badge>
        </div>

        {/* Center: View Controls - Compact & Responsive */}
        <div className="flex items-center flex-1 justify-center">
          <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5">
            <Button 
              variant={showFileExplorer ? "secondary" : "ghost"}
              size="sm" 
              className="h-7 px-2 gap-1.5 text-xs"
              onClick={onToggleFileExplorer}
              title="Explorador de archivos"
            >
              <Sidebar className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Explorador</span>
            </Button>
            
            <Button 
              variant={showPreview ? "secondary" : "ghost"}
              size="sm" 
              className="h-7 px-2 gap-1.5 text-xs"
              onClick={onTogglePreview}
              title="Vista previa PS2"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Preview</span>
            </Button>
            
            <Button 
              variant={showAIChat ? "secondary" : "ghost"}
              size="sm" 
              className="h-7 px-2 gap-1.5 text-xs bg-gradient-to-r from-ps2-purple/10 to-ps2-cyan/10 hover:from-ps2-purple/20 hover:to-ps2-cyan/20"
              onClick={onToggleAIChatWindow}
              title="Asistente IA"
            >
              <Bot className="w-3.5 h-3.5 text-ps2-purple" />
              <span className="hidden lg:inline text-ps2-purple">IA</span>
            </Button>

            {/* Development Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={showTerminal ? "secondary" : "ghost"}
                  size="sm" 
                  className="h-7 px-2 gap-1 text-xs"
                  title="Herramientas de desarrollo"
                >
                  <Wrench className="w-3.5 h-3.5 text-ps2-orange" />
                  <span className="hidden lg:inline">Tools</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52">
                <DropdownMenuLabel className="flex items-center gap-2 text-xs py-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Herramientas Dev
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Visual UI Builder */}
                <DropdownMenuItem 
                  onClick={onOpenVisualBuilder}
                  className="flex items-center gap-2 cursor-pointer py-1.5"
                >
                  <PenTool className="w-3.5 h-3.5 text-ps2-cyan" />
                  <div className="flex flex-col flex-1">
                    <span className="text-xs">Visual UI Builder</span>
                    <span className="text-[10px] text-muted-foreground">Diseño visual 640x448</span>
                  </div>
                </DropdownMenuItem>

                {/* Quick Create Templates */}
                <DropdownMenuItem 
                  onClick={onOpenQuickCreate}
                  className="flex items-center gap-2 cursor-pointer py-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-ps2-purple" />
                  <div className="flex flex-col flex-1">
                    <span className="text-xs">Plantillas Rápidas</span>
                    <span className="text-[10px] text-muted-foreground">Crear archivos PS2</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem 
                  onClick={onToggleTerminal}
                  className="flex items-center gap-2 cursor-pointer py-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-ps2-green" />
                  <div className="flex flex-col flex-1">
                    <span className="text-xs">Terminal ZSH</span>
                    <span className="text-[10px] text-muted-foreground">Línea de comandos</span>
                  </div>
                  {showTerminal && (
                    <div className="w-1.5 h-1.5 rounded-full bg-ps2-green ml-auto" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer opacity-50 py-1.5" disabled>
                  <Bug className="w-3.5 h-3.5 text-ps2-red" />
                  <div className="flex flex-col flex-1">
                    <span className="text-xs">Depurador</span>
                    <span className="text-[10px] text-muted-foreground">Debug PS2</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer opacity-50 py-1.5" disabled>
                  <Cpu className="w-3.5 h-3.5 text-ps2-blue" />
                  <div className="flex flex-col flex-1">
                    <span className="text-xs">Monitor</span>
                    <span className="text-[10px] text-muted-foreground">CPU/GPU/RAM</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer opacity-50 py-1.5" disabled>
                  <FileSearch className="w-3.5 h-3.5 text-ps2-cyan" />
                  <div className="flex flex-col flex-1">
                    <span className="text-xs">Buscador</span>
                    <span className="text-[10px] text-muted-foreground">Buscar en proyecto</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer opacity-50 py-1.5" disabled>
                  <Activity className="w-3.5 h-3.5 text-ps2-purple" />
                  <div className="flex flex-col flex-1">
                    <span className="text-xs">Profiler EE/VU</span>
                    <span className="text-[10px] text-muted-foreground">Rendimiento</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right: Actions - Compact */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="GitHub">
            <Github className="w-3.5 h-3.5" />
          </Button>
          
          <WindowConfigMenu />
        </div>
      </div>
    </header>
  );
}