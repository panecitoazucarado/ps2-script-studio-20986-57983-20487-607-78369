import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Cpu, 
  HardDrive, 
  Wifi, 
  Battery, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Gamepad2
} from 'lucide-react';

interface IDEStatusBarProps {
  selectedFile: string;
  isRunning: boolean;
  lineCount: number;
}

export function IDEStatusBar({ selectedFile, isRunning, lineCount }: IDEStatusBarProps) {
  return (
    <footer className="ide-statusbar">
      <div className="flex items-center justify-between px-4 py-1 text-xs">
        {/* Left: File & Status Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isRunning ? (
              <CheckCircle className="w-3 h-3 text-ps2-green" />
            ) : (
              <AlertCircle className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="font-medium">{selectedFile}</span>
            <Badge variant="outline" className="text-xs px-1 py-0">
              JavaScript
            </Badge>
          </div>
          
          <div className="h-3 w-px bg-border" />
          
          <div className="flex items-center gap-3">
            <span>Lines: {lineCount}</span>
            <span>UTF-8</span>
            <span>CRLF</span>
          </div>
        </div>

        {/* Center: PS2 System Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Gamepad2 className="w-3 h-3 text-ps2-blue" />
            <span>PS2 Ready</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-ps2-cyan" />
            <span>EE: 294MHz</span>
          </div>
          
          <div className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-ps2-green" />
            <span>VRAM: 4MB</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Battery className="w-3 h-3 text-ps2-orange" />
            <span>RAM: 32MB</span>
          </div>
        </div>

        {/* Right: Connection & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-3 h-3 text-ps2-green" />
            <span>Connected to PCSX2</span>
          </div>
          
          <div className="h-3 w-px bg-border" />
          
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <Badge 
              variant={isRunning ? "default" : "secondary"}
              className={`text-xs ${
                isRunning 
                  ? "bg-ps2-green text-background" 
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isRunning ? "Running" : "Stopped"}
            </Badge>
          </Button>
        </div>
      </div>
    </footer>
  );
}