import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Square, Circle, Type, Image as ImageIcon, Minus, CheckSquare, 
  Trash2, Copy, ChevronUp, ChevronDown, Code, Grid3x3, Layers, 
  Download, Eye, EyeOff, PenTool, Lock, Unlock, Search, X, 
  ZoomIn, ZoomOut, RotateCcw, Layout, List, Activity, Film, 
  Cpu, MousePointer, Shapes, Triangle, Heading1, SlidersHorizontal, 
  ToggleRight, PanelTop, PanelBottom, MessageSquare, PanelLeft, 
  SeparatorHorizontal, BarChart3, Heart, Gauge, Loader, Timer, 
  Clock, Gamepad2, Box, FolderOpen, Play, AudioLines, Star, 
  TextCursor, Hash, Sparkles, RotateCw, Wallpaper, ImagePlay, 
  AlignCenter, Rows3, FileText, Badge as BadgeIcon
} from 'lucide-react';

import {
  PS2Component, PS2Color, ComponentTemplate, ComponentCategory, CategoryInfo,
  CATEGORIES, PS2_WIDTH, PS2_HEIGHT, generateId, colorToRgba, colorToAthena
} from '@/lib/ps2-builder';
import { allTemplates, getTemplatesByCategory, searchTemplates, getTemplateByType } from '@/lib/ps2-builder';

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, React.ReactNode> = {
  'Square': <Square className="w-4 h-4" />,
  'Circle': <Circle className="w-4 h-4" />,
  'Type': <Type className="w-4 h-4" />,
  'Image': <ImageIcon className="w-4 h-4" />,
  'Minus': <Minus className="w-4 h-4" />,
  'CheckSquare': <CheckSquare className="w-4 h-4" />,
  'Triangle': <Triangle className="w-4 h-4" />,
  'Heading1': <Heading1 className="w-4 h-4" />,
  'AlignCenter': <AlignCenter className="w-4 h-4" />,
  'Gauge': <Gauge className="w-4 h-4" />,
  'Hash': <Hash className="w-4 h-4" />,
  'Sparkles': <Sparkles className="w-4 h-4" />,
  'ImagePlay': <ImagePlay className="w-4 h-4" />,
  'RotateCw': <RotateCw className="w-4 h-4" />,
  'Star': <Star className="w-4 h-4" />,
  'Wallpaper': <Wallpaper className="w-4 h-4" />,
  'TextCursor': <TextCursor className="w-4 h-4" />,
  'SlidersHorizontal': <SlidersHorizontal className="w-4 h-4" />,
  'ToggleRight': <ToggleRight className="w-4 h-4" />,
  'PanelTop': <PanelTop className="w-4 h-4" />,
  'PanelBottom': <PanelBottom className="w-4 h-4" />,
  'PanelTopClose': <PanelTop className="w-4 h-4" />,
  'MessageSquare': <MessageSquare className="w-4 h-4" />,
  'PanelLeft': <PanelLeft className="w-4 h-4" />,
  'SeparatorHorizontal': <SeparatorHorizontal className="w-4 h-4" />,
  'Space': <Square className="w-4 h-4 opacity-30" />,
  'List': <List className="w-4 h-4" />,
  'Grid3x3': <Grid3x3 className="w-4 h-4" />,
  'Rows3': <Rows3 className="w-4 h-4" />,
  'FileText': <FileText className="w-4 h-4" />,
  'BarChart3': <BarChart3 className="w-4 h-4" />,
  'Heart': <Heart className="w-4 h-4" />,
  'Loader': <Loader className="w-4 h-4" />,
  'Badge': <BadgeIcon className="w-4 h-4" />,
  'Timer': <Timer className="w-4 h-4" />,
  'Play': <Play className="w-4 h-4" />,
  'AudioLines': <AudioLines className="w-4 h-4" />,
  'Film': <Film className="w-4 h-4" />,
  'Volume2': <AudioLines className="w-4 h-4" />,
  'Grid2x2': <Grid3x3 className="w-4 h-4" />,
  'Clock': <Clock className="w-4 h-4" />,
  'Gamepad2': <Gamepad2 className="w-4 h-4" />,
  'Box': <Box className="w-4 h-4" />,
  'FolderOpen': <FolderOpen className="w-4 h-4" />,
  'Shapes': <Shapes className="w-4 h-4" />,
  'MousePointer': <MousePointer className="w-4 h-4" />,
  'Layout': <Layout className="w-4 h-4" />,
  'Activity': <Activity className="w-4 h-4" />,
  'Cpu': <Cpu className="w-4 h-4" />
};

const getCategoryIcon = (id: string): React.ReactNode => {
  const iconName = CATEGORIES.find(c => c.id === id)?.icon || 'Square';
  return iconMap[iconName] || <Square className="w-4 h-4" />;
};

const getTemplateIcon = (iconName: string): React.ReactNode => {
  return iconMap[iconName] || <Square className="w-4 h-4" />;
};

interface PS2VisualBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateCode: (code: string) => void;
  initialCode?: string;
}

export function PS2VisualBuilder({ open, onOpenChange, onGenerateCode }: PS2VisualBuilderProps) {
  const [components, setComponents] = useState<PS2Component[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [gridSnap, setGridSnap] = useState(true);
  const [gridSize, setGridSize] = useState(8);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [activeCategory, setActiveCategory] = useState<ComponentCategory>('draw');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLayers, setShowLayers] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectedComponent = components.find(c => c.id === selectedId);

  // Filter templates based on search or category
  const filteredTemplates = useMemo(() => {
    if (searchQuery.trim()) {
      return searchTemplates(searchQuery);
    }
    return getTemplatesByCategory(activeCategory);
  }, [searchQuery, activeCategory]);

  // Snap to grid helper
  const snapToGrid = useCallback((value: number) => {
    if (!gridSnap) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [gridSnap, gridSize]);

  // Add component from template
  const handleAddComponent = useCallback((template: ComponentTemplate) => {
    const newComponent: PS2Component = {
      id: generateId(),
      type: template.type,
      x: snapToGrid(PS2_WIDTH / 2 - template.defaultWidth / 2),
      y: snapToGrid(PS2_HEIGHT / 2 - template.defaultHeight / 2),
      width: template.defaultWidth,
      height: template.defaultHeight,
      props: JSON.parse(JSON.stringify(template.defaultProps)),
      zIndex: components.length,
      locked: false,
      visible: true,
      name: `${template.name}_${components.length + 1}`
    };
    
    setComponents(prev => [...prev, newComponent]);
    setSelectedId(newComponent.id);
  }, [components.length, snapToGrid]);

  // Component mouse down handler
  const handleComponentMouseDown = useCallback((e: React.MouseEvent, comp: PS2Component) => {
    if (comp.locked) return;
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setSelectedId(comp.id);
    setIsDragging(true);
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - comp.x,
      y: (e.clientY - rect.top) / zoom - comp.y
    });
  }, [zoom]);

  // Resize handle mouse down
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
  }, []);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (isDragging && selectedId && selectedComponent) {
      const x = snapToGrid(Math.max(0, Math.min(PS2_WIDTH - selectedComponent.width, 
        (e.clientX - rect.left) / zoom - dragOffset.x)));
      const y = snapToGrid(Math.max(0, Math.min(PS2_HEIGHT - selectedComponent.height, 
        (e.clientY - rect.top) / zoom - dragOffset.y)));
      
      setComponents(prev => prev.map(c => 
        c.id === selectedId ? { ...c, x, y } : c
      ));
    }
    
    if (isResizing && selectedId && resizeHandle && selectedComponent) {
      const mouseX = (e.clientX - rect.left) / zoom;
      const mouseY = (e.clientY - rect.top) / zoom;
      
      let newX = selectedComponent.x;
      let newY = selectedComponent.y;
      let newWidth = selectedComponent.width;
      let newHeight = selectedComponent.height;
      
      if (resizeHandle.includes('e')) {
        newWidth = snapToGrid(Math.max(20, mouseX - selectedComponent.x));
      }
      if (resizeHandle.includes('w')) {
        const diff = selectedComponent.x - snapToGrid(mouseX);
        newX = snapToGrid(mouseX);
        newWidth = Math.max(20, selectedComponent.width + diff);
      }
      if (resizeHandle.includes('s')) {
        newHeight = snapToGrid(Math.max(20, mouseY - selectedComponent.y));
      }
      if (resizeHandle.includes('n')) {
        const diff = selectedComponent.y - snapToGrid(mouseY);
        newY = snapToGrid(mouseY);
        newHeight = Math.max(20, selectedComponent.height + diff);
      }
      
      setComponents(prev => prev.map(c => 
        c.id === selectedId ? { ...c, x: newX, y: newY, width: newWidth, height: newHeight } : c
      ));
    }
  }, [isDragging, isResizing, selectedId, selectedComponent, dragOffset, zoom, resizeHandle, snapToGrid]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Delete component
  const handleDelete = useCallback(() => {
    if (selectedId) {
      setComponents(prev => prev.filter(c => c.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId]);

  // Duplicate component
  const handleDuplicate = useCallback(() => {
    if (selectedComponent) {
      const newComponent: PS2Component = {
        ...JSON.parse(JSON.stringify(selectedComponent)),
        id: generateId(),
        x: snapToGrid(selectedComponent.x + 20),
        y: snapToGrid(selectedComponent.y + 20),
        name: `${selectedComponent.name}_copy`
      };
      setComponents(prev => [...prev, newComponent]);
      setSelectedId(newComponent.id);
    }
  }, [selectedComponent, snapToGrid]);

  // Move layer
  const handleMoveLayer = useCallback((direction: 'up' | 'down') => {
    if (!selectedId) return;
    
    setComponents(prev => {
      const idx = prev.findIndex(c => c.id === selectedId);
      if (direction === 'up' && idx < prev.length - 1) {
        const newComps = [...prev];
        [newComps[idx], newComps[idx + 1]] = [newComps[idx + 1], newComps[idx]];
        return newComps.map((c, i) => ({ ...c, zIndex: i }));
      }
      if (direction === 'down' && idx > 0) {
        const newComps = [...prev];
        [newComps[idx], newComps[idx - 1]] = [newComps[idx - 1], newComps[idx]];
        return newComps.map((c, i) => ({ ...c, zIndex: i }));
      }
      return prev;
    });
  }, [selectedId]);

  // Toggle lock
  const handleToggleLock = useCallback(() => {
    if (selectedId) {
      setComponents(prev => prev.map(c => 
        c.id === selectedId ? { ...c, locked: !c.locked } : c
      ));
    }
  }, [selectedId]);

  // Toggle visibility
  const handleToggleVisibility = useCallback(() => {
    if (selectedId) {
      setComponents(prev => prev.map(c => 
        c.id === selectedId ? { ...c, visible: !c.visible } : c
      ));
    }
  }, [selectedId]);

  // Generate full code
  const generateFullCode = useCallback(() => {
    const sortedComponents = [...components].sort((a, b) => a.zIndex - b.zIndex);
    
    let code = `// ════════════════════════════════════════════════════════════════
// PS2 UI - Generated by ATHENA Visual Builder
// Resolution: ${PS2_WIDTH}x${PS2_HEIGHT} (NTSC)
// Components: ${components.length}
// ════════════════════════════════════════════════════════════════

// Initialize font
const font = new Font("default");

// Disable depth test for 2D UI
Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);

// UI Draw Function
function drawUI() {
`;

    sortedComponents.forEach((comp) => {
      if (!comp.visible) return;
      
      const template = getTemplateByType(comp.type);
      if (template) {
        code += `\n  // ─── ${comp.name} (${comp.type}) ───\n`;
        const componentCode = template.codeGenerator(comp);
        code += componentCode.split('\n').map(line => '  ' + line).join('\n');
        code += '\n';
      }
    });

    code += `}

// Main Loop
os.setInterval(() => {
  // Handle Input
  const pad = Pads.get(0);
  pad.update();
  
  // Clear screen
  Screen.clear(Color.new(15, 15, 30, 255));
  
  // Draw UI
  drawUI();
  
  // Flip buffer
  Screen.flip();
}, 0);
`;

    return code;
  }, [components]);

  // Update property
  const updateComponentProp = useCallback((propPath: string, value: any) => {
    if (!selectedId) return;
    
    setComponents(prev => prev.map(c => {
      if (c.id !== selectedId) return c;
      
      const pathParts = propPath.split('.');
      if (pathParts.length === 1) {
        return { ...c, props: { ...c.props, [propPath]: value } };
      } else {
        const newProps = JSON.parse(JSON.stringify(c.props));
        let current = newProps;
        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = value;
        return { ...c, props: newProps };
      }
    }));
  }, [selectedId]);

  // Render component preview
  const renderComponentPreview = useCallback((comp: PS2Component) => {
    const template = getTemplateByType(comp.type);
    if (!template) return null;

    const isSelected = comp.id === selectedId;
    const p = comp.props;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: comp.x * zoom,
      top: comp.y * zoom,
      width: comp.width * zoom,
      height: comp.height * zoom,
      zIndex: comp.zIndex,
      opacity: comp.visible ? 1 : 0.3,
      cursor: comp.locked ? 'not-allowed' : 'move',
      pointerEvents: comp.locked ? 'none' : 'auto'
    };

    // Simplified visual representations
    const getVisual = () => {
      switch (comp.type) {
        case 'rect':
        case 'panel':
          return (
            <div className="w-full h-full" style={{ 
              backgroundColor: colorToRgba(p.fillColor || p.bgColor),
              border: p.hasBorder || p.borderColor ? `2px solid ${colorToRgba(p.borderColor || { r: 100, g: 100, b: 150, a: 255 })}` : 'none'
            }} />
          );
        case 'circle':
          return (
            <div className="w-full h-full rounded-full" style={{ 
              backgroundColor: colorToRgba(p.fillColor)
            }} />
          );
        case 'triangle':
          return (
            <div className="w-full h-full flex items-center justify-center">
              <Triangle className="w-3/4 h-3/4" style={{ color: colorToRgba(p.color1) }} />
            </div>
          );
        case 'text':
        case 'title':
        case 'centered-text':
        case 'outline-text':
          return (
            <div className="w-full h-full flex items-center overflow-hidden" style={{ 
              color: colorToRgba(p.color),
              fontSize: (p.scale || 1) * 14 * zoom,
              fontWeight: comp.type === 'title' ? 'bold' : 'normal',
              textShadow: p.dropshadow ? '2px 2px 0 rgba(0,0,0,0.7)' : 'none'
            }}>
              {p.text}
            </div>
          );
        case 'button':
          return (
            <div className="w-full h-full flex items-center justify-center text-xs font-semibold" style={{ 
              backgroundColor: colorToRgba(p.bgColor),
              color: colorToRgba(p.textColor)
            }}>
              {p.text}
            </div>
          );
        case 'textbox':
          return (
            <div className="w-full h-full flex items-center px-2 text-xs border" style={{ 
              backgroundColor: colorToRgba(p.bgColor),
              borderColor: colorToRgba(p.borderColor),
              color: p.value ? colorToRgba(p.textColor) : 'rgba(100,100,130,1)'
            }}>
              {p.value || p.placeholder}
            </div>
          );
        case 'checkbox':
          return (
            <div className="w-full h-full flex items-center gap-2">
              <div className="w-4 h-4 border flex items-center justify-center" style={{ borderColor: colorToRgba(p.boxColor || p.color) }}>
                {p.checked && <CheckSquare className="w-3 h-3" style={{ color: colorToRgba(p.checkColor) }} />}
              </div>
              <span className="text-[10px]" style={{ color: colorToRgba(p.labelColor || p.color) }}>{p.label}</span>
            </div>
          );
        case 'radio':
          return (
            <div className="w-full h-full flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border flex items-center justify-center" style={{ borderColor: colorToRgba(p.circleColor || p.color) }}>
                {p.selected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorToRgba(p.activeColor) }} />}
              </div>
              <span className="text-[10px]" style={{ color: colorToRgba(p.labelColor) }}>{p.label}</span>
            </div>
          );
        case 'slider':
          const progress = ((p.value - p.min) / (p.max - p.min)) * 100;
          return (
            <div className="w-full h-full flex items-center px-1">
              <div className="w-full h-2 rounded relative" style={{ backgroundColor: colorToRgba(p.trackColor) }}>
                <div className="h-full rounded" style={{ width: `${progress}%`, backgroundColor: colorToRgba(p.fillColor) }} />
              </div>
            </div>
          );
        case 'progress-bar':
        case 'health-bar':
          const pct = (p.value / p.max) * 100;
          return (
            <div className="w-full h-full relative" style={{ backgroundColor: colorToRgba(p.bgColor) }}>
              <div className="h-full" style={{ width: `${pct}%`, backgroundColor: colorToRgba(p.fillColor || p.highColor) }} />
              {p.showText && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-semibold">{Math.floor(pct)}%</span>
              )}
            </div>
          );
        case 'header':
        case 'footer':
          return (
            <div className="w-full h-full flex items-center px-3 text-xs font-semibold" style={{ 
              backgroundColor: colorToRgba(p.bgColor),
              color: colorToRgba(p.textColor)
            }}>
              {p.title || p.text}
            </div>
          );
        case 'image':
        case 'logo':
        case 'sprite':
        case 'icon':
        case 'background':
          return (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-dashed border-gray-500">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          );
        case 'list':
          return (
            <div className="w-full h-full overflow-hidden" style={{ backgroundColor: colorToRgba(p.bgColor), border: '1px solid rgba(60,70,110,1)' }}>
              {(p.items || []).slice(0, 4).map((item: string, i: number) => (
                <div key={i} className="px-2 py-1 text-[9px]" style={{ 
                  backgroundColor: i === p.selectedIndex ? colorToRgba(p.selectedBgColor || p.selectedBg) : 'transparent',
                  color: colorToRgba(p.itemColor || p.selectedTextColor)
                }}>{item}</div>
              ))}
            </div>
          );
        case 'grid':
          return (
            <div className="w-full h-full p-1 flex flex-wrap gap-0.5" style={{ backgroundColor: colorToRgba(p.bgColor) }}>
              {Array.from({ length: Math.min((p.columns || 3) * (p.rows || 3), 9) }).map((_, i) => (
                <div key={i} style={{ 
                  width: `${100 / (p.columns || 3) - 2}%`,
                  aspectRatio: '1',
                  backgroundColor: i === p.selectedIndex ? colorToRgba(p.selectedCellColor) : colorToRgba(p.cellColor),
                  border: i === p.selectedIndex ? '1px solid white' : '1px solid transparent'
                }} />
              ))}
            </div>
          );
        case 'line':
        case 'divider':
          return <div className="w-full h-full" style={{ backgroundColor: colorToRgba(p.color) }} />;
        default:
          return <div className="w-full h-full bg-gray-600/50 flex items-center justify-center text-[8px] text-gray-300">{comp.type}</div>;
      }
    };

    return (
      <div
        key={comp.id}
        style={baseStyle}
        className={`${isSelected ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-transparent' : ''} transition-shadow`}
        onMouseDown={(e) => handleComponentMouseDown(e, comp)}
      >
        {getVisual()}
        
        {/* Resize handles */}
        {isSelected && !comp.locked && (
          <>
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-cyan-400 border border-white cursor-nw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 border border-white cursor-ne-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-cyan-400 border border-white cursor-sw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-cyan-400 border border-white cursor-se-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
          </>
        )}
        
        {/* Lock indicator */}
        {comp.locked && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
    );
  }, [selectedId, zoom, handleComponentMouseDown, handleResizeMouseDown]);

  // Color input component
  const ColorInput = ({ label, value, onChange }: { label: string; value: PS2Color; onChange: (color: PS2Color) => void }) => {
    const hexValue = `#${value.r.toString(16).padStart(2, '0')}${value.g.toString(16).padStart(2, '0')}${value.b.toString(16).padStart(2, '0')}`;
    
    return (
      <div className="flex items-center gap-2">
        <Label className="text-[10px] text-muted-foreground w-16 truncate">{label}</Label>
        <input 
          type="color" 
          value={hexValue}
          onChange={(e) => {
            const hex = e.target.value;
            onChange({
              r: parseInt(hex.slice(1, 3), 16),
              g: parseInt(hex.slice(3, 5), 16),
              b: parseInt(hex.slice(5, 7), 16),
              a: value.a
            });
          }}
          className="w-7 h-5 cursor-pointer border-0 rounded"
        />
        <span className="text-[9px] text-muted-foreground font-mono">
          {value.r},{value.g},{value.b}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[1400px] h-[90vh] p-0 flex flex-col bg-[#0d0d1a] border-[#2a2a4a]">
        {/* Header */}
        <DialogHeader className="px-4 py-2 border-b border-[#2a2a4a] bg-[#12122a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                <PenTool className="w-4 h-4 text-purple-400" />
                PS2 Visual UI Builder
              </DialogTitle>
              <Badge variant="outline" className="text-[9px] border-cyan-500/50 text-cyan-400 px-1.5 py-0">
                {PS2_WIDTH}×{PS2_HEIGHT}
              </Badge>
              <Badge variant="secondary" className="text-[9px] bg-[#1a1a3a] text-gray-300 px-1.5 py-0">
                {components.length} componentes
              </Badge>
            </div>
            
            <div className="flex items-center gap-1.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setShowGrid(!showGrid)} className={`h-7 w-7 p-0 ${showGrid ? 'bg-purple-500/20' : ''}`}>
                      <Grid3x3 className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Toggle Grid</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setGridSnap(!gridSnap)} className={`h-7 w-7 p-0 ${gridSnap ? 'bg-purple-500/20' : ''}`}>
                      <Shapes className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Snap to Grid: {gridSnap ? 'ON' : 'OFF'}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setShowLayers(!showLayers)} className={`h-7 w-7 p-0 ${showLayers ? 'bg-purple-500/20' : ''}`}>
                      <Layers className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Layers Panel</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Separator orientation="vertical" className="h-5 bg-[#2a2a4a]" />
              
              <Button
                variant={showCode ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowCode(!showCode)}
                className="h-7 px-2 text-[11px]"
              >
                <Code className="w-3.5 h-3.5 mr-1" />
                Código
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  onGenerateCode(generateFullCode());
                  onOpenChange(false);
                }}
                className="h-7 px-3 text-[11px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Aplicar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Component Palette */}
          <div className="w-60 border-r border-[#2a2a4a] bg-[#10102a] flex flex-col">
            {/* Search */}
            <div className="p-2 border-b border-[#2a2a4a]">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar componentes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-7 pr-7 text-[11px] bg-[#1a1a3a] border-[#2a2a4a]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-muted-foreground hover:text-white" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Categories */}
            {!searchQuery && (
              <div className="flex flex-wrap gap-1 p-2 border-b border-[#2a2a4a]">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors ${
                      activeCategory === cat.id 
                        ? 'bg-purple-500/30 text-purple-300' 
                        : 'bg-[#1a1a3a] text-gray-400 hover:bg-[#252550] hover:text-gray-200'
                    }`}
                  >
                    <span className={cat.color}>{getCategoryIcon(cat.id)}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Component List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredTemplates.map(template => (
                  <button
                    key={template.type}
                    onClick={() => handleAddComponent(template)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[#1a1a3a] transition-colors group"
                  >
                    <div className="w-7 h-7 rounded bg-[#1a1a3a] flex items-center justify-center text-gray-400 group-hover:text-cyan-400 group-hover:bg-[#252550]">
                      {getTemplateIcon(template.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-200 truncate">{template.name}</div>
                      <div className="text-[9px] text-gray-500 truncate">{template.description}</div>
                    </div>
                  </button>
                ))}
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    No se encontraron componentes
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a18]">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-[#2a2a4a] bg-[#12122a]">
              <TooltipProvider>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDelete} disabled={!selectedId}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </TooltipTrigger><TooltipContent>Eliminar</TooltipContent></Tooltip>
                
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleDuplicate} disabled={!selectedId}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger><TooltipContent>Duplicar</TooltipContent></Tooltip>
                
                <Separator orientation="vertical" className="h-4 bg-[#2a2a4a]" />
                
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMoveLayer('up')} disabled={!selectedId}>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger><TooltipContent>Subir capa</TooltipContent></Tooltip>
                
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMoveLayer('down')} disabled={!selectedId}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger><TooltipContent>Bajar capa</TooltipContent></Tooltip>
                
                <Separator orientation="vertical" className="h-4 bg-[#2a2a4a]" />
                
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleToggleLock} disabled={!selectedId}>
                    {selectedComponent?.locked ? <Lock className="w-3.5 h-3.5 text-orange-400" /> : <Unlock className="w-3.5 h-3.5" />}
                  </Button>
                </TooltipTrigger><TooltipContent>{selectedComponent?.locked ? 'Desbloquear' : 'Bloquear'}</TooltipContent></Tooltip>
                
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleToggleVisibility} disabled={!selectedId}>
                    {selectedComponent?.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-gray-500" />}
                  </Button>
                </TooltipTrigger><TooltipContent>{selectedComponent?.visible ? 'Ocultar' : 'Mostrar'}</TooltipContent></Tooltip>
              </TooltipProvider>
              
              <div className="flex-1" />
              
              {/* Zoom controls */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[10px] text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={() => setZoom(1)}>
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
              
              {selectedComponent && (
                <>
                  <Separator orientation="vertical" className="h-4 bg-[#2a2a4a]" />
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {selectedComponent.name} • ({selectedComponent.x}, {selectedComponent.y}) {selectedComponent.width}×{selectedComponent.height}
                  </span>
                </>
              )}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <div 
                ref={canvasRef}
                className="relative shadow-2xl border border-[#2a2a4a]"
                style={{ 
                  width: PS2_WIDTH * zoom, 
                  height: PS2_HEIGHT * zoom,
                  backgroundColor: '#14142a',
                  backgroundImage: showGrid ? `
                    linear-gradient(to right, rgba(60,60,100,0.15) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(60,60,100,0.15) 1px, transparent 1px)
                  ` : 'none',
                  backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`
                }}
                onClick={() => setSelectedId(null)}
              >
                {/* Safe area guide */}
                <div 
                  className="absolute border border-dashed border-yellow-500/20 pointer-events-none"
                  style={{ left: 32 * zoom, top: 32 * zoom, right: 32 * zoom, bottom: 32 * zoom }}
                />
                
                {/* Components */}
                {[...components].sort((a, b) => a.zIndex - b.zIndex).map(renderComponentPreview)}
                
                {/* Center crosshair */}
                <div className="absolute pointer-events-none opacity-30" style={{ 
                  left: (PS2_WIDTH / 2 - 10) * zoom, top: (PS2_HEIGHT / 2) * zoom - 0.5, 
                  width: 20 * zoom, height: 1, backgroundColor: '#666' 
                }} />
                <div className="absolute pointer-events-none opacity-30" style={{ 
                  left: (PS2_WIDTH / 2) * zoom - 0.5, top: (PS2_HEIGHT / 2 - 10) * zoom, 
                  width: 1, height: 20 * zoom, backgroundColor: '#666' 
                }} />
              </div>
            </div>
          </div>

          {/* Right Sidebar: Properties / Layers / Code */}
          <div className="w-64 border-l border-[#2a2a4a] bg-[#10102a] flex flex-col">
            <Tabs defaultValue="properties" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b border-[#2a2a4a] bg-[#12122a] h-8 p-0">
                <TabsTrigger value="properties" className="rounded-none text-[10px] h-8 data-[state=active]:bg-[#1a1a3a]">
                  Propiedades
                </TabsTrigger>
                <TabsTrigger value="layers" className="rounded-none text-[10px] h-8 data-[state=active]:bg-[#1a1a3a]">
                  Capas
                </TabsTrigger>
                {showCode && (
                  <TabsTrigger value="code" className="rounded-none text-[10px] h-8 data-[state=active]:bg-[#1a1a3a]">
                    Código
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="properties" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {selectedComponent ? (
                    <div className="p-3 space-y-3">
                      {/* Component Info */}
                      <div className="space-y-2">
                        <Label className="text-[10px] text-cyan-400 uppercase tracking-wider">Componente</Label>
                        <Input
                          value={selectedComponent.name}
                          onChange={(e) => setComponents(prev => prev.map(c => c.id === selectedId ? { ...c, name: e.target.value } : c))}
                          className="h-7 text-[11px] bg-[#1a1a3a] border-[#2a2a4a]"
                        />
                      </div>
                      
                      <Separator className="bg-[#2a2a4a]" />
                      
                      {/* Position & Size */}
                      <div className="space-y-2">
                        <Label className="text-[10px] text-cyan-400 uppercase tracking-wider">Posición & Tamaño</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[9px] text-muted-foreground">X</Label>
                            <Input type="number" value={selectedComponent.x} onChange={(e) => setComponents(prev => prev.map(c => c.id === selectedId ? { ...c, x: Number(e.target.value) } : c))} className="h-6 text-[10px] bg-[#1a1a3a] border-[#2a2a4a]" />
                          </div>
                          <div>
                            <Label className="text-[9px] text-muted-foreground">Y</Label>
                            <Input type="number" value={selectedComponent.y} onChange={(e) => setComponents(prev => prev.map(c => c.id === selectedId ? { ...c, y: Number(e.target.value) } : c))} className="h-6 text-[10px] bg-[#1a1a3a] border-[#2a2a4a]" />
                          </div>
                          <div>
                            <Label className="text-[9px] text-muted-foreground">Ancho</Label>
                            <Input type="number" value={selectedComponent.width} onChange={(e) => setComponents(prev => prev.map(c => c.id === selectedId ? { ...c, width: Number(e.target.value) } : c))} className="h-6 text-[10px] bg-[#1a1a3a] border-[#2a2a4a]" />
                          </div>
                          <div>
                            <Label className="text-[9px] text-muted-foreground">Alto</Label>
                            <Input type="number" value={selectedComponent.height} onChange={(e) => setComponents(prev => prev.map(c => c.id === selectedId ? { ...c, height: Number(e.target.value) } : c))} className="h-6 text-[10px] bg-[#1a1a3a] border-[#2a2a4a]" />
                          </div>
                        </div>
                      </div>
                      
                      <Separator className="bg-[#2a2a4a]" />
                      
                      {/* Dynamic Props */}
                      <div className="space-y-2">
                        <Label className="text-[10px] text-cyan-400 uppercase tracking-wider">Propiedades</Label>
                        {Object.entries(selectedComponent.props).map(([key, value]) => {
                          if (typeof value === 'object' && value !== null && 'r' in value) {
                            return (
                              <ColorInput 
                                key={key} 
                                label={key} 
                                value={value as PS2Color} 
                                onChange={(color) => updateComponentProp(key, color)} 
                              />
                            );
                          }
                          if (typeof value === 'boolean') {
                            return (
                              <div key={key} className="flex items-center justify-between">
                                <Label className="text-[10px] text-muted-foreground">{key}</Label>
                                <input type="checkbox" checked={value} onChange={(e) => updateComponentProp(key, e.target.checked)} className="w-4 h-4" />
                              </div>
                            );
                          }
                          if (typeof value === 'number') {
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <Label className="text-[10px] text-muted-foreground w-16 truncate">{key}</Label>
                                <Input type="number" value={value} onChange={(e) => updateComponentProp(key, Number(e.target.value))} className="h-6 text-[10px] bg-[#1a1a3a] border-[#2a2a4a] flex-1" />
                              </div>
                            );
                          }
                          if (typeof value === 'string') {
                            return (
                              <div key={key} className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">{key}</Label>
                                <Input value={value} onChange={(e) => updateComponentProp(key, e.target.value)} className="h-6 text-[10px] bg-[#1a1a3a] border-[#2a2a4a]" />
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-xs">
                      Selecciona un componente para ver sus propiedades
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="layers" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {[...components].reverse().map((comp, idx) => (
                      <div 
                        key={comp.id}
                        onClick={() => setSelectedId(comp.id)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${
                          comp.id === selectedId ? 'bg-purple-500/30' : 'hover:bg-[#1a1a3a]'
                        }`}
                      >
                        <span className="text-[9px] text-gray-500 w-4">{components.length - idx}</span>
                        <div className="w-5 h-5 rounded bg-[#1a1a3a] flex items-center justify-center">
                          {getTemplateIcon(getTemplateByType(comp.type)?.icon || 'Square')}
                        </div>
                        <span className="text-[11px] text-gray-200 flex-1 truncate">{comp.name}</span>
                        {comp.locked && <Lock className="w-3 h-3 text-orange-400" />}
                        {!comp.visible && <EyeOff className="w-3 h-3 text-gray-500" />}
                      </div>
                    ))}
                    {components.length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-xs">
                        Sin componentes
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              {showCode && (
                <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <pre className="p-3 text-[10px] font-mono text-green-400 whitespace-pre-wrap">
                      {generateFullCode()}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
