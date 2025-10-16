import { ReactNode, useRef, useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWindowDocking, WindowId } from '@/contexts/WindowDockingContext';
import { DockingZones } from './DockingZones';

interface FloatingWindowProps {
  id: WindowId;
  title: string;
  children: ReactNode;
  onClose?: () => void;
}

export function FloatingWindow({ id, title, children, onClose }: FloatingWindowProps) {
  const { windows, updateWindowPosition, updateWindowSize, bringToFront, dockWindow } = useWindowDocking();
  const windowState = windows[id];
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showDockZones, setShowDockZones] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  const position = windowState.floatingPosition || { x: 100, y: 100 };
  const size = windowState.size || { width: 600, height: 500 };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        updateWindowPosition(id, { x: newX, y: newY });
        
        // Show dock zones when dragging near edges
        const threshold = 100;
        const nearEdge = 
          e.clientX < threshold || 
          e.clientX > window.innerWidth - threshold ||
          e.clientY < threshold || 
          e.clientY > window.innerHeight - threshold;
        
        setShowDockZones(nearEdge);
      } else if (isResizing && windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        const newWidth = Math.max(300, e.clientX - rect.left);
        const newHeight = Math.max(200, e.clientY - rect.top);
        updateWindowSize(id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        // Check for docking
        const threshold = 50;
        if (e.clientX < threshold) {
          dockWindow(id, 'left');
        } else if (e.clientX > window.innerWidth - threshold) {
          dockWindow(id, 'right');
        } else if (e.clientY < threshold) {
          dockWindow(id, 'top');
        } else if (e.clientY > window.innerHeight - threshold) {
          dockWindow(id, 'bottom');
        }
        setShowDockZones(false);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, id, updateWindowPosition, updateWindowSize, dockWindow]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLButtonElement) return;
    
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
      bringToFront(id);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    bringToFront(id);
  };

  const handleDoubleClick = () => {
    const dockPos = id === 'fileExplorer' ? 'left' : 'right';
    dockWindow(id, dockPos);
  };

  return (
    <>
      {showDockZones && <DockingZones />}
      
      <div
        ref={windowRef}
        className="fixed bg-card border-2 border-ps2-cyan/30 rounded-lg shadow-2xl overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          zIndex: windowState.zIndex + 1000,
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
        }}
        onMouseDown={() => bringToFront(id)}
      >
        {/* Window Header */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-ide-tab border-b border-ps2-cyan/30 cursor-move select-none"
          onMouseDown={handleHeaderMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          <div className="flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-ps2-cyan" />
            <span className="text-sm font-semibold text-ps2-cyan">{title}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-ps2-cyan/20"
              onClick={handleDoubleClick}
              title="Acoplar ventana (doble click)"
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                onClick={onClose}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Window Content */}
        <div className="h-[calc(100%-40px)] overflow-hidden">
          {children}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-ps2-cyan/20 hover:bg-ps2-cyan/40 transition-colors"
          onMouseDown={handleResizeMouseDown}
          style={{
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          }}
        />
      </div>
    </>
  );
}
