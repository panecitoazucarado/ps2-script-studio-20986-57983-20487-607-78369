import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Sidebar
} from 'lucide-react';

interface IDEHeaderProps {
  showFileExplorer: boolean;
  showPreview: boolean;
  onToggleFileExplorer: () => void;
  onTogglePreview: () => void;
}

export function IDEHeader({ 
  showFileExplorer, 
  showPreview, 
  onToggleFileExplorer, 
  onTogglePreview 
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
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 px-3 gap-2 hidden md:flex">
            <Save className="w-4 h-4" />
            <span className="text-xs">Guardar</span>
          </Button>
          
          <Separator orientation="vertical" className="h-6 hidden md:block" />
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Github className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 border-ps2-purple/50 text-ps2-purple hover:bg-ps2-purple/10 gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Config</span>
          </Button>
        </div>
      </div>
    </header>
  );
}