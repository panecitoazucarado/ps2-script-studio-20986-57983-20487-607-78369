import { Settings, RotateCcw, Maximize2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useWindowDocking } from '@/contexts/WindowDockingContext';

export function WindowConfigMenu() {
  const { dockingEnabled, toggleDocking, resetWindows, windows, toggleWindowVisibility } = useWindowDocking();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 border-ps2-purple/50 text-ps2-purple hover:bg-ps2-purple/10 gap-2"
        >
          <Settings className="w-4 h-4" />
          <span className="text-xs">Configuración</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 bg-ide-tab border-ps2-cyan/30">
        <DropdownMenuLabel className="text-ps2-cyan">Configuración de Ventanas</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuCheckboxItem
          checked={dockingEnabled}
          onCheckedChange={toggleDocking}
          className="cursor-pointer"
        >
          <Maximize2 className="w-4 h-4 mr-2" />
          Habilitar Acoplamiento
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Visibilidad de Ventanas
        </DropdownMenuLabel>
        
        <DropdownMenuCheckboxItem
          checked={windows.fileExplorer.visible}
          onCheckedChange={() => toggleWindowVisibility('fileExplorer')}
          className="cursor-pointer"
        >
          {windows.fileExplorer.visible ? (
            <Eye className="w-4 h-4 mr-2" />
          ) : (
            <EyeOff className="w-4 h-4 mr-2" />
          )}
          Explorador de Archivos
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={windows.preview.visible}
          onCheckedChange={() => toggleWindowVisibility('preview')}
          className="cursor-pointer"
        >
          {windows.preview.visible ? (
            <Eye className="w-4 h-4 mr-2" />
          ) : (
            <EyeOff className="w-4 h-4 mr-2" />
          )}
          Vista Previa
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuItem
          onClick={resetWindows}
          className="cursor-pointer text-ps2-green hover:bg-ps2-green/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restablecer Ventanas
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/50" />
        
        <div className="px-2 py-2 text-xs text-muted-foreground">
          <p className="mb-1">💡 <strong>Consejos:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-[10px]">
            <li>Arrastra el título para mover ventanas</li>
            <li>Doble click para acoplar</li>
            <li>Arrastra cerca del borde para acoplar</li>
            <li>Esquina inferior derecha para redimensionar</li>
          </ul>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
