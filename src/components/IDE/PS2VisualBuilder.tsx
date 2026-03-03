import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ColorPickerPro } from './ColorPickerPro';
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
  AlignCenter, Rows3, FileText, Badge as BadgeIcon, GripVertical,
  ChevronsUp, ChevronsDown, MoreHorizontal, Blend, Palette
} from 'lucide-react';
import { ComponentPalette } from './ComponentPalette';

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
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleRequestClose = useCallback(() => {
    if (components.length > 0) {
      setShowExitConfirm(true);
    } else {
      onOpenChange(false);
    }
  }, [components.length, onOpenChange]);
  
  // Layer drag & drop state
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [layerContextMenu, setLayerContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  
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

  // Component mouse down handler - for dragging
  const handleComponentMouseDown = useCallback((e: React.MouseEvent, comp: PS2Component) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Always select component on click, even if locked
    setSelectedId(comp.id);
    
    // Only start dragging if not locked
    if (comp.locked) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - comp.x,
      y: (e.clientY - rect.top) / zoom - comp.y
    });
  }, [zoom]);

  // Component click handler - for selection only
  const handleComponentClick = useCallback((e: React.MouseEvent, comp: PS2Component) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(comp.id);
  }, []);

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

  // Move layer - enhanced with multiple options
  const handleMoveLayer = useCallback((componentId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setComponents(prev => {
      const idx = prev.findIndex(c => c.id === componentId);
      if (idx === -1) return prev;
      
      const newComps = [...prev];
      
      if (direction === 'up' && idx < prev.length - 1) {
        [newComps[idx], newComps[idx + 1]] = [newComps[idx + 1], newComps[idx]];
      } else if (direction === 'down' && idx > 0) {
        [newComps[idx], newComps[idx - 1]] = [newComps[idx - 1], newComps[idx]];
      } else if (direction === 'top') {
        const [comp] = newComps.splice(idx, 1);
        newComps.push(comp);
      } else if (direction === 'bottom') {
        const [comp] = newComps.splice(idx, 1);
        newComps.unshift(comp);
      }
      
      return newComps.map((c, i) => ({ ...c, zIndex: i }));
    });
  }, []);

  // Delete specific component by ID
  const handleDeleteComponent = useCallback((componentId: string) => {
    setComponents(prev => {
      const filtered = prev.filter(c => c.id !== componentId);
      return filtered.map((c, i) => ({ ...c, zIndex: i }));
    });
    if (selectedId === componentId) {
      setSelectedId(null);
    }
  }, [selectedId]);

  // Duplicate specific component by ID
  const handleDuplicateComponent = useCallback((componentId: string) => {
    const comp = components.find(c => c.id === componentId);
    if (comp) {
      const newComponent: PS2Component = {
        ...JSON.parse(JSON.stringify(comp)),
        id: generateId(),
        x: snapToGrid(comp.x + 20),
        y: snapToGrid(comp.y + 20),
        name: `${comp.name}_copy`,
        zIndex: components.length
      };
      setComponents(prev => [...prev, newComponent]);
      setSelectedId(newComponent.id);
    }
  }, [components, snapToGrid]);

  // Toggle lock for specific component
  const handleToggleLockComponent = useCallback((componentId: string) => {
    setComponents(prev => prev.map(c => 
      c.id === componentId ? { ...c, locked: !c.locked } : c
    ));
  }, []);

  // Toggle visibility for specific component
  const handleToggleVisibilityComponent = useCallback((componentId: string) => {
    setComponents(prev => prev.map(c => 
      c.id === componentId ? { ...c, visible: !c.visible } : c
    ));
  }, []);

  // Layer drag handlers
  const handleLayerDragStart = useCallback((e: React.DragEvent, componentId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', componentId);
    setDraggedLayerId(componentId);
  }, []);

  const handleLayerDragOver = useCallback((e: React.DragEvent, componentId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (componentId !== draggedLayerId) {
      setDragOverLayerId(componentId);
    }
  }, [draggedLayerId]);

  const handleLayerDragLeave = useCallback(() => {
    setDragOverLayerId(null);
  }, []);

  const handleLayerDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetId) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      return;
    }

    setComponents(prev => {
      const draggedIdx = prev.findIndex(c => c.id === draggedLayerId);
      const targetIdx = prev.findIndex(c => c.id === targetId);
      
      if (draggedIdx === -1 || targetIdx === -1) return prev;
      
      const newComps = [...prev];
      const [draggedComp] = newComps.splice(draggedIdx, 1);
      newComps.splice(targetIdx, 0, draggedComp);
      
      return newComps.map((c, i) => ({ ...c, zIndex: i }));
    });

    setDraggedLayerId(null);
    setDragOverLayerId(null);
  }, [draggedLayerId]);

  const handleLayerDragEnd = useCallback(() => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  }, []);

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

  // Generate full code - Clean JavaScript compatible with AthenaEnv browser runtime
  const generateFullCode = useCallback(() => {
    const sortedComponents = [...components].sort((a, b) => a.zIndex - b.zIndex);
    
    // Process generated code to fix syntax issues (remove 'f' suffix from floats)
    const fixFloatSyntax = (code: string): string => {
      // Replace patterns like 1.0f, 0.5f, etc. with just the number
      return code.replace(/(\d+\.?\d*)f\b/g, '$1');
    };
    
    let code = `// ════════════════════════════════════════════════════════════════
// PS2 UI - Generated by ATHENA Visual Builder
// Resolution: ${PS2_WIDTH}x${PS2_HEIGHT} (NTSC)
// Components: ${components.length}
// ════════════════════════════════════════════════════════════════

// Initialize font
const font = new Font("default");
font.scale = 1.0;
font.color = Color.new(255, 255, 255, 128);

// Frame counter for animations
let frameCount = 0;

// UI Draw Function
function drawUI() {
`;

    sortedComponents.forEach((comp) => {
      if (!comp.visible) return;
      
      const template = getTemplateByType(comp.type);
      if (template) {
        code += `\n  // ─── ${comp.name} (${comp.type}) ───\n`;
        // Generate and fix float syntax
        const componentCode = fixFloatSyntax(template.codeGenerator(comp));
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
  
  // Increment frame counter
  frameCount++;
  
  // Flip buffer
  Screen.flip();
}, 16);
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
      zIndex: comp.zIndex + 10, // Ensure components are above canvas background
      opacity: comp.visible ? 1 : 0.3,
      cursor: comp.locked ? 'default' : 'move',
      userSelect: 'none'
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
        onClick={(e) => handleComponentClick(e, comp)}
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
  }, [selectedId, zoom, handleComponentMouseDown, handleComponentClick, handleResizeMouseDown]);

  // Render circle-specific properties panel
  const renderCircleProperties = () => {
    if (!selectedComponent || selectedComponent.type !== 'circle') return null;
    
    const p = selectedComponent.props;
    const radius = Math.floor(Math.min(selectedComponent.width, selectedComponent.height) / 2);
    
    return (
      <div className="space-y-3">
        <div className="space-y-2 p-2 rounded bg-[#1a1a3a]/50 border border-[#2a2a4a]">
          <Label className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Circle className="w-3 h-3" /> Propiedades del Círculo
          </Label>
          
          {/* Fill Properties */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[9px] text-muted-foreground">Relleno</Label>
              <Switch
                checked={p.filled}
                onCheckedChange={(checked) => updateComponentProp('filled', checked)}
              />
            </div>
            
            {p.filled && (
              <ColorPickerPro
                label="Color Relleno"
                value={p.fillColor}
                onChange={(color) => updateComponentProp('fillColor', color)}
              />
            )}
          </div>
          
          {/* Border Properties */}
          <Separator className="bg-[#2a2a4a]" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[9px] text-muted-foreground">Borde</Label>
              <Switch
                checked={p.hasBorder}
                onCheckedChange={(checked) => updateComponentProp('hasBorder', checked)}
              />
            </div>
            
            {p.hasBorder && (
              <>
                <ColorPickerPro
                  label="Color Borde"
                  value={p.borderColor}
                  onChange={(color) => updateComponentProp('borderColor', color)}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-[9px] text-muted-foreground w-20">Grosor</Label>
                  <Slider
                    value={[p.borderWidth || 1]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={([v]) => updateComponentProp('borderWidth', v)}
                    className="flex-1"
                  />
                  <span className="text-[9px] text-muted-foreground font-mono w-6">{p.borderWidth || 1}px</span>
                </div>
              </>
            )}
          </div>
          
          {/* Geometry */}
          <Separator className="bg-[#2a2a4a]" />
          <div className="space-y-2">
            <Label className="text-[9px] text-cyan-400 font-semibold">Geometría</Label>
            
            <div className="flex items-center gap-2">
              <Label className="text-[9px] text-muted-foreground w-20">Radio</Label>
              <span className="text-[10px] font-mono text-cyan-300 bg-[#0d0d1a] px-2 py-0.5 rounded">
                {radius}px
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-[9px] text-muted-foreground w-20">Diámetro</Label>
              <span className="text-[10px] font-mono text-cyan-300 bg-[#0d0d1a] px-2 py-0.5 rounded">
                {radius * 2}px
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-[9px] text-muted-foreground w-20">Centro X</Label>
              <span className="text-[10px] font-mono text-green-300 bg-[#0d0d1a] px-2 py-0.5 rounded">
                {selectedComponent.x + Math.floor(selectedComponent.width / 2)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-[9px] text-muted-foreground w-20">Centro Y</Label>
              <span className="text-[10px] font-mono text-green-300 bg-[#0d0d1a] px-2 py-0.5 rounded">
                {selectedComponent.y + Math.floor(selectedComponent.height / 2)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-[9px] text-muted-foreground">Mantener Proporción</Label>
              <Switch
                checked={p.keepAspectRatio !== false}
                onCheckedChange={(checked) => updateComponentProp('keepAspectRatio', checked)}
              />
            </div>
          </div>
          
          {/* PS2 Specific */}
          <Separator className="bg-[#2a2a4a]" />
          <div className="space-y-2">
            <Label className="text-[9px] text-orange-400 font-semibold">PS2 Específico</Label>
            
            <div className="flex items-center gap-2">
              <Label className="text-[9px] text-muted-foreground w-20">Segmentos</Label>
              <Slider
                value={[p.segments || 32]}
                min={8}
                max={64}
                step={4}
                onValueChange={([v]) => updateComponentProp('segments', v)}
                className="flex-1"
              />
              <span className="text-[9px] text-muted-foreground font-mono w-6">{p.segments || 32}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-[9px] text-muted-foreground">Antialiasing</Label>
              <Switch
                checked={p.antialiased !== false}
                onCheckedChange={(checked) => updateComponentProp('antialiased', checked)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Color input component - now uses ColorPickerPro as fallback
  const ColorInput = ({ label, value, onChange }: { label: string; value: PS2Color; onChange: (color: PS2Color) => void }) => {
    return (
      <ColorPickerPro
        label={label}
        value={value}
        onChange={onChange}
      />
    );
  };

  if (!open) return null;

  return (
    <>
    {/* Fullscreen overlay */}
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a16' }}>
      {/* ── Header bar ── */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0" style={{ background: 'rgba(14,14,30,0.98)' }}>
        {/* Left: title + badges */}
        <div className="flex items-center gap-2.5 min-w-0">
          <PenTool className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-[12px] font-semibold text-white whitespace-nowrap">PS2 Visual UI Builder</span>
          <span className="text-[9px] text-cyan-400 border border-cyan-500/30 rounded px-1.5 py-[1px] whitespace-nowrap">{PS2_WIDTH}×{PS2_HEIGHT}</span>
          <span className="text-[9px] text-gray-400 whitespace-nowrap">{components.length} componentes</span>
        </div>

        {/* Center: tools */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setShowGrid(!showGrid)} className={`h-7 w-7 p-0 ${showGrid ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500'}`}>
                <Grid3x3 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Grilla</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setGridSnap(!gridSnap)} className={`h-7 w-7 p-0 ${gridSnap ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500'}`}>
                <Shapes className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Snap: {gridSnap ? 'ON' : 'OFF'}</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setShowLayers(!showLayers)} className={`h-7 w-7 p-0 ${showLayers ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500'}`}>
                <Layers className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom">Capas</TooltipContent></Tooltip>
          </TooltipProvider>

          <div className="w-px h-5 bg-white/[0.08] mx-1" />

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

        {/* Right: close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRequestClose}
          className="h-7 w-7 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Component Palette */}
          <ComponentPalette onAddComponent={handleAddComponent} />

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
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => selectedId && handleMoveLayer(selectedId, 'up')} disabled={!selectedId}>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger><TooltipContent>Subir capa</TooltipContent></Tooltip>
                
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => selectedId && handleMoveLayer(selectedId, 'down')} disabled={!selectedId}>
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
                onMouseDown={(e) => {
                  // Only deselect if clicking directly on canvas, not on a component
                  if (e.target === e.currentTarget) {
                    setSelectedId(null);
                  }
                }}
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
                      
                      {/* Component-Specific Properties */}
                      {selectedComponent.type === 'circle' ? (
                        renderCircleProperties()
                      ) : (
                        /* Dynamic Props for other components */
                        <div className="space-y-2">
                          <Label className="text-[10px] text-cyan-400 uppercase tracking-wider">Propiedades</Label>
                          {Object.entries(selectedComponent.props).map(([key, value]) => {
                            if (typeof value === 'object' && value !== null && 'r' in value) {
                              return (
                                <ColorPickerPro 
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
                                  <Switch checked={value} onCheckedChange={(checked) => updateComponentProp(key, checked)} />
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
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-xs">
                      Selecciona un componente para ver sus propiedades
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="layers" className="flex-1 m-0 overflow-hidden flex flex-col">
                {/* Layers Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Capas ({components.length})
                  </span>
                  <div className="flex items-center gap-1">
                    <Tooltip><TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0"
                        onClick={() => selectedId && handleMoveLayer(selectedId, 'top')}
                        disabled={!selectedId}
                      >
                        <ChevronsUp className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger><TooltipContent>Al frente</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0"
                        onClick={() => selectedId && handleMoveLayer(selectedId, 'bottom')}
                        disabled={!selectedId}
                      >
                        <ChevronsDown className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger><TooltipContent>Al fondo</TooltipContent></Tooltip>
                  </div>
                </div>
                
                {/* Layers List with Drag & Drop */}
                <ScrollArea className="flex-1">
                  <div className="p-1.5 space-y-0.5">
                    {[...components].reverse().map((comp, idx) => {
                      const layerNumber = components.length - idx;
                      const isSelected = comp.id === selectedId;
                      const isDragged = comp.id === draggedLayerId;
                      const isDragOver = comp.id === dragOverLayerId;
                      
                      return (
                        <div 
                          key={comp.id}
                          draggable
                          onDragStart={(e) => handleLayerDragStart(e, comp.id)}
                          onDragOver={(e) => handleLayerDragOver(e, comp.id)}
                          onDragLeave={handleLayerDragLeave}
                          onDrop={(e) => handleLayerDrop(e, comp.id)}
                          onDragEnd={handleLayerDragEnd}
                          onClick={() => setSelectedId(comp.id)}
                          className={`
                            group flex items-center gap-1.5 px-1.5 py-1 rounded-md cursor-pointer
                            transition-all duration-150 select-none
                            ${isSelected ? 'bg-primary/20 ring-1 ring-primary/50' : 'hover:bg-muted/50'}
                            ${isDragged ? 'opacity-50 scale-95' : ''}
                            ${isDragOver ? 'ring-2 ring-primary bg-primary/10' : ''}
                          `}
                        >
                          {/* Drag Handle */}
                          <div className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted/80 opacity-50 group-hover:opacity-100">
                            <GripVertical className="w-3 h-3 text-muted-foreground" />
                          </div>
                          
                          {/* Layer Number */}
                          <span className="text-[8px] text-muted-foreground w-3 text-center font-mono">
                            {layerNumber}
                          </span>
                          
                          {/* Component Icon */}
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${
                            isSelected ? 'bg-primary/30' : 'bg-muted/50'
                          }`}>
                            {getTemplateIcon(getTemplateByType(comp.type)?.icon || 'Square')}
                          </div>
                          
                          {/* Component Name */}
                          <span className={`text-[10px] flex-1 truncate ${
                            isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}>
                            {comp.name}
                          </span>
                          
                          {/* Quick Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Visibility Toggle */}
                            <Tooltip><TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleVisibilityComponent(comp.id); }}
                                className={`p-0.5 rounded hover:bg-muted/80 ${!comp.visible ? 'text-warning' : 'text-muted-foreground'}`}
                              >
                                {comp.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </button>
                            </TooltipTrigger><TooltipContent>{comp.visible ? 'Ocultar' : 'Mostrar'}</TooltipContent></Tooltip>
                            
                            {/* Lock Toggle */}
                            <Tooltip><TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleLockComponent(comp.id); }}
                                className={`p-0.5 rounded hover:bg-muted/80 ${comp.locked ? 'text-warning' : 'text-muted-foreground'}`}
                              >
                                {comp.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </button>
                            </TooltipTrigger><TooltipContent>{comp.locked ? 'Desbloquear' : 'Bloquear'}</TooltipContent></Tooltip>
                            
                            {/* Move Up */}
                            <Tooltip><TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveLayer(comp.id, 'up'); }}
                                className="p-0.5 rounded hover:bg-muted/80 text-muted-foreground"
                                disabled={idx === 0}
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                            </TooltipTrigger><TooltipContent>+1 Adelante</TooltipContent></Tooltip>
                            
                            {/* Move Down */}
                            <Tooltip><TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveLayer(comp.id, 'down'); }}
                                className="p-0.5 rounded hover:bg-muted/80 text-muted-foreground"
                                disabled={idx === components.length - 1}
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </TooltipTrigger><TooltipContent>+1 Atrás</TooltipContent></Tooltip>
                            
                            {/* Duplicate */}
                            <Tooltip><TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDuplicateComponent(comp.id); }}
                                className="p-0.5 rounded hover:bg-muted/80 text-muted-foreground"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </TooltipTrigger><TooltipContent>Duplicar</TooltipContent></Tooltip>
                            
                            {/* Delete */}
                            <Tooltip><TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteComponent(comp.id); }}
                                className="p-0.5 rounded hover:bg-destructive/20 text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </TooltipTrigger><TooltipContent>Eliminar</TooltipContent></Tooltip>
                          </div>
                          
                          {/* Status Icons (always visible) */}
                          <div className="flex items-center gap-0.5 group-hover:hidden">
                            {comp.locked && <Lock className="w-2.5 h-2.5 text-warning" />}
                            {!comp.visible && <EyeOff className="w-2.5 h-2.5 text-muted-foreground" />}
                          </div>
                        </div>
                      );
                    })}
                    
                    {components.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Layers className="w-8 h-8 mb-2 opacity-30" />
                        <span className="text-xs">Sin componentes</span>
                        <span className="text-[10px] opacity-60">Arrastra componentes aquí</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Layers Footer */}
                <div className="flex items-center justify-between px-2 py-1.5 border-t border-border bg-muted/20 text-[9px] text-muted-foreground">
                  <span>Arrastra para reordenar</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5" />
                      {components.filter(c => c.visible).length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      {components.filter(c => c.locked).length}
                    </span>
                  </div>
                </div>
              </TabsContent>
              
              {showCode && (
                <TabsContent value="code" className="flex-1 m-0 overflow-hidden flex flex-col min-h-0">
                  {/* Mini Editor Header */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a2e] border-b border-[#2a2a4a]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">ui_generated.js</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-emerald-500/50 text-emerald-400">
                        JavaScript
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(generateFullCode());
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Mini Code Editor - Professional scrollbars for both axes */}
                  <div className="flex-1 min-h-0 bg-[#0d0d1a] relative overflow-hidden">
                    <div className="absolute inset-0 overflow-auto code-editor-scroll">
                      <div className="flex text-[10px] font-mono leading-relaxed min-w-max">
                        {/* Line Numbers - Sticky column */}
                        <div className="select-none text-right pr-3 pl-2 py-2 bg-[#0a0a15] text-gray-600 border-r border-[#1a1a3a] sticky left-0 z-10 min-w-[40px]">
                          {generateFullCode().split('\n').map((_, i) => (
                            <div key={i} className="h-[14px] leading-[14px]">{i + 1}</div>
                          ))}
                        </div>
                        
                        {/* Code Content with Syntax Highlighting */}
                        <div className="flex-1 py-2 pl-3 pr-6 pb-4">
                          {generateFullCode().split('\n').map((line, i) => (
                            <div key={i} className="h-[14px] leading-[14px] whitespace-pre">
                              {highlightSyntax(line)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mini Editor Footer */}
                  <div className="flex items-center justify-between px-3 py-1 bg-[#12122a] border-t border-[#2a2a4a] text-[9px] text-gray-500">
                    <span>{generateFullCode().split('\n').length} líneas</span>
                    <span>UTF-8 • AthenaEnv JS</span>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>

    {/* Exit confirmation dialog */}
    <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
      <AlertDialogContent className="bg-[#12122a] border-white/[0.08]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">¿Salir del Visual Builder?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Se perderá todo el avance no aplicado. ¿Estás seguro de que deseas cerrar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/[0.1] text-gray-300 hover:bg-white/[0.05]">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-500 text-white"
            onClick={() => { setShowExitConfirm(false); onOpenChange(false); }}
          >
            Salir sin guardar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// Syntax highlighting helper function
function highlightSyntax(line: string): React.ReactNode {
  // Empty line
  if (!line.trim()) return <span>&nbsp;</span>;
  
  // Comment lines
  if (line.trim().startsWith('//')) {
    return <span className="text-gray-500 italic">{line}</span>;
  }
  
  // Decorative comment lines (═══)
  if (line.includes('═══') || line.includes('───')) {
    return <span className="text-gray-600">{line}</span>;
  }
  
  // Tokenize and highlight
  const tokens: React.ReactNode[] = [];
  let remaining = line;
  let keyIndex = 0;
  
  // Keywords
  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'new', 'true', 'false'];
  const builtins = ['Screen', 'Color', 'Font', 'Draw', 'Pads', 'os', 'Math'];
  const methods = ['setParam', 'clear', 'flip', 'print', 'rect', 'circle', 'line', 'triangle', 'get', 'update', 'setInterval'];
  
  // Process the line character by character with regex matching
  while (remaining.length > 0) {
    let matched = false;
    
    // String literals (double quotes)
    const stringMatch = remaining.match(/^"[^"]*"/);
    if (stringMatch) {
      tokens.push(<span key={keyIndex++} className="text-amber-400">{stringMatch[0]}</span>);
      remaining = remaining.slice(stringMatch[0].length);
      matched = true;
      continue;
    }
    
    // String literals (single quotes)
    const singleStringMatch = remaining.match(/^'[^']*'/);
    if (singleStringMatch) {
      tokens.push(<span key={keyIndex++} className="text-amber-400">{singleStringMatch[0]}</span>);
      remaining = remaining.slice(singleStringMatch[0].length);
      matched = true;
      continue;
    }
    
    // Numbers
    const numberMatch = remaining.match(/^\b\d+\.?\d*\b/);
    if (numberMatch) {
      tokens.push(<span key={keyIndex++} className="text-purple-400">{numberMatch[0]}</span>);
      remaining = remaining.slice(numberMatch[0].length);
      matched = true;
      continue;
    }
    
    // Keywords
    for (const kw of keywords) {
      const kwRegex = new RegExp(`^\\b${kw}\\b`);
      const kwMatch = remaining.match(kwRegex);
      if (kwMatch) {
        tokens.push(<span key={keyIndex++} className="text-pink-400 font-medium">{kwMatch[0]}</span>);
        remaining = remaining.slice(kwMatch[0].length);
        matched = true;
        break;
      }
    }
    if (matched) continue;
    
    // Built-in objects
    for (const bi of builtins) {
      const biRegex = new RegExp(`^\\b${bi}\\b`);
      const biMatch = remaining.match(biRegex);
      if (biMatch) {
        tokens.push(<span key={keyIndex++} className="text-cyan-400">{biMatch[0]}</span>);
        remaining = remaining.slice(biMatch[0].length);
        matched = true;
        break;
      }
    }
    if (matched) continue;
    
    // Methods
    for (const mt of methods) {
      const mtRegex = new RegExp(`^\\b${mt}\\b`);
      const mtMatch = remaining.match(mtRegex);
      if (mtMatch) {
        tokens.push(<span key={keyIndex++} className="text-yellow-300">{mtMatch[0]}</span>);
        remaining = remaining.slice(mtMatch[0].length);
        matched = true;
        break;
      }
    }
    if (matched) continue;
    
    // Function names (word followed by parenthesis)
    const funcMatch = remaining.match(/^(\w+)(?=\()/);
    if (funcMatch) {
      tokens.push(<span key={keyIndex++} className="text-blue-400">{funcMatch[0]}</span>);
      remaining = remaining.slice(funcMatch[0].length);
      matched = true;
      continue;
    }
    
    // Operators and punctuation
    const opMatch = remaining.match(/^[{}()\[\];,.:=<>+\-*\/&|!?]+/);
    if (opMatch) {
      tokens.push(<span key={keyIndex++} className="text-gray-400">{opMatch[0]}</span>);
      remaining = remaining.slice(opMatch[0].length);
      matched = true;
      continue;
    }
    
    // Identifiers and other text
    const identMatch = remaining.match(/^\w+/);
    if (identMatch) {
      tokens.push(<span key={keyIndex++} className="text-gray-200">{identMatch[0]}</span>);
      remaining = remaining.slice(identMatch[0].length);
      matched = true;
      continue;
    }
    
    // Whitespace
    const wsMatch = remaining.match(/^\s+/);
    if (wsMatch) {
      tokens.push(<span key={keyIndex++}>{wsMatch[0]}</span>);
      remaining = remaining.slice(wsMatch[0].length);
      continue;
    }
    
    // Fallback: single character
    tokens.push(<span key={keyIndex++} className="text-gray-300">{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }
  
  return <>{tokens}</>;
}