import { useState, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Square, Circle, Type, Image as ImageIcon, Minus, CheckSquare,
  Search, X, ChevronRight, ChevronLeft, Info,
  Triangle, Heading1, SlidersHorizontal,
  ToggleRight, PanelTop, PanelBottom, MessageSquare, PanelLeft,
  SeparatorHorizontal, BarChart3, Heart, Gauge, Loader, Timer,
  Clock, Gamepad2, Box, FolderOpen, Play, AudioLines, Star,
  TextCursor, Hash, Sparkles, RotateCw, Wallpaper, ImagePlay,
  AlignCenter, Rows3, FileText, Badge as BadgeIcon,
  List, Grid3x3, Activity, Film, Cpu, MousePointer, Shapes, Layout
} from 'lucide-react';
import {
  ComponentTemplate, ComponentCategory, CATEGORIES
} from '@/lib/ps2-builder';
import { getTemplatesByCategory, searchTemplates } from '@/lib/ps2-builder';

// ── Icon map ──
const iconMap: Record<string, React.ReactNode> = {
  'Square': <Square className="w-3.5 h-3.5" />,
  'Circle': <Circle className="w-3.5 h-3.5" />,
  'Type': <Type className="w-3.5 h-3.5" />,
  'Image': <ImageIcon className="w-3.5 h-3.5" />,
  'Minus': <Minus className="w-3.5 h-3.5" />,
  'CheckSquare': <CheckSquare className="w-3.5 h-3.5" />,
  'Triangle': <Triangle className="w-3.5 h-3.5" />,
  'Heading1': <Heading1 className="w-3.5 h-3.5" />,
  'AlignCenter': <AlignCenter className="w-3.5 h-3.5" />,
  'Gauge': <Gauge className="w-3.5 h-3.5" />,
  'Hash': <Hash className="w-3.5 h-3.5" />,
  'Sparkles': <Sparkles className="w-3.5 h-3.5" />,
  'ImagePlay': <ImagePlay className="w-3.5 h-3.5" />,
  'RotateCw': <RotateCw className="w-3.5 h-3.5" />,
  'Star': <Star className="w-3.5 h-3.5" />,
  'Wallpaper': <Wallpaper className="w-3.5 h-3.5" />,
  'TextCursor': <TextCursor className="w-3.5 h-3.5" />,
  'SlidersHorizontal': <SlidersHorizontal className="w-3.5 h-3.5" />,
  'ToggleRight': <ToggleRight className="w-3.5 h-3.5" />,
  'PanelTop': <PanelTop className="w-3.5 h-3.5" />,
  'PanelBottom': <PanelBottom className="w-3.5 h-3.5" />,
  'PanelTopClose': <PanelTop className="w-3.5 h-3.5" />,
  'MessageSquare': <MessageSquare className="w-3.5 h-3.5" />,
  'PanelLeft': <PanelLeft className="w-3.5 h-3.5" />,
  'SeparatorHorizontal': <SeparatorHorizontal className="w-3.5 h-3.5" />,
  'Space': <Square className="w-3.5 h-3.5 opacity-30" />,
  'List': <List className="w-3.5 h-3.5" />,
  'Grid3x3': <Grid3x3 className="w-3.5 h-3.5" />,
  'Rows3': <Rows3 className="w-3.5 h-3.5" />,
  'FileText': <FileText className="w-3.5 h-3.5" />,
  'BarChart3': <BarChart3 className="w-3.5 h-3.5" />,
  'Heart': <Heart className="w-3.5 h-3.5" />,
  'Loader': <Loader className="w-3.5 h-3.5" />,
  'Badge': <BadgeIcon className="w-3.5 h-3.5" />,
  'Timer': <Timer className="w-3.5 h-3.5" />,
  'Play': <Play className="w-3.5 h-3.5" />,
  'AudioLines': <AudioLines className="w-3.5 h-3.5" />,
  'Film': <Film className="w-3.5 h-3.5" />,
  'Volume2': <AudioLines className="w-3.5 h-3.5" />,
  'Grid2x2': <Grid3x3 className="w-3.5 h-3.5" />,
  'Clock': <Clock className="w-3.5 h-3.5" />,
  'Gamepad2': <Gamepad2 className="w-3.5 h-3.5" />,
  'Box': <Box className="w-3.5 h-3.5" />,
  'FolderOpen': <FolderOpen className="w-3.5 h-3.5" />,
  'Shapes': <Shapes className="w-3.5 h-3.5" />,
  'MousePointer': <MousePointer className="w-3.5 h-3.5" />,
  'Layout': <Layout className="w-3.5 h-3.5" />,
  'Activity': <Activity className="w-3.5 h-3.5" />,
  'Cpu': <Cpu className="w-3.5 h-3.5" />
};

const getIcon = (name: string) => iconMap[name] || <Square className="w-3.5 h-3.5" />;

// ── Info content per template type ──
const getUsageInfo = (template: ComponentTemplate): string => {
  const infoMap: Record<string, string> = {
    'point': 'Draw.point(x, y, color) — Dibuja un solo píxel en la posición indicada. Útil para partículas o efectos de puntos.',
    'line': 'Draw.line(x1, y1, x2, y2, color) — Traza una línea recta entre dos puntos. Para separadores, guías o wireframes.',
    'rect': 'Draw.rect(x, y, w, h, color) — Dibuja un rectángulo sólido. Base de paneles, fondos y áreas de UI.',
    'circle': 'Draw.circle(x, y, radius, color, fill) — Dibuja un círculo. Soporta relleno sólido o solo contorno para indicadores.',
    'triangle': 'Draw.triangle(x1,y1, x2,y2, x3,y3, c1, c2, c3) — Triángulo con sombreado Gouraud por vértice.',
    'quad': 'Draw.quad(x1,y1,...x4,y4, c1,c2,c3,c4) — Cuadrilátero con 4 colores para gradientes suaves.',
  };
  return infoMap[template.type] || `${template.name}: ${template.description}. Usa el módulo ${template.category} de AthenaEnv.`;
};

interface ComponentPaletteProps {
  onAddComponent: (template: ComponentTemplate) => void;
}

export function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ComponentCategory>('draw');
  const [infoOpen, setInfoOpen] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    if (searchQuery.trim()) return searchTemplates(searchQuery);
    return getTemplatesByCategory(activeCategory);
  }, [searchQuery, activeCategory]);

  const activeCatInfo = CATEGORIES.find(c => c.id === activeCategory);

  const toggleInfo = useCallback((type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInfoOpen(prev => prev === type ? null : type);
  }, []);

  // ── Collapsed strip ──
  if (collapsed) {
    return (
      <div className="w-10 flex flex-col items-center border-r border-white/[0.06] bg-[#0c0c1e]/80 py-2 gap-1.5 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Expandir paleta"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <div className="w-5 h-px bg-white/[0.06] my-1" />
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setCollapsed(false); }}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              activeCategory === cat.id
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
            }`}
            title={cat.name}
          >
            <span className={cat.color}>{getIcon(cat.icon)}</span>
          </button>
        ))}
      </div>
    );
  }

  // ── Expanded panel ──
  return (
    <div
      className="w-56 flex flex-col shrink-0 border-r border-white/[0.06] overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(12,12,30,0.95) 0%, rgba(8,8,22,0.98) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Componentes</span>
        <button
          onClick={() => setCollapsed(true)}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Colapsar paleta"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 pr-7 text-[11px] bg-white/[0.03] border-white/[0.06] rounded-md placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-purple-500/40 focus-visible:border-purple-500/30"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      {!searchQuery && (
        <div className="px-2 py-1.5 border-b border-white/[0.06]">
          <div className="flex flex-wrap gap-[3px]">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1 px-1.5 py-[3px] rounded text-[9px] font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.1] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={isActive ? 'text-white' : cat.color}>{getIcon(cat.icon)}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category description */}
      {!searchQuery && activeCatInfo && (
        <div className="px-2.5 py-1.5 border-b border-white/[0.06]">
          <p className="text-[9px] text-gray-500 leading-tight">{activeCatInfo.description}</p>
        </div>
      )}

      {/* Template list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-1.5 space-y-px">
          {filteredTemplates.map(template => {
            const isInfoVisible = infoOpen === template.type;
            return (
              <div key={template.type} className="rounded-md overflow-hidden">
                {/* Item row */}
                <div
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group transition-colors hover:bg-white/[0.04] active:bg-white/[0.07]"
                  onClick={() => onAddComponent(template)}
                >
                  <div className="w-6 h-6 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-400 group-hover:text-cyan-400 group-hover:border-cyan-400/20 group-hover:bg-cyan-400/[0.06] transition-colors shrink-0">
                    {getIcon(template.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-gray-200 truncate leading-tight">{template.name}</div>
                    <div className="text-[9px] text-gray-600 truncate leading-tight">{template.description}</div>
                  </div>
                  <button
                    onClick={(e) => toggleInfo(template.type, e)}
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      isInfoVisible
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-purple-300 hover:bg-white/[0.06]'
                    }`}
                    title="Información de uso"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>

                {/* Info panel (inline, no overlap) */}
                {isInfoVisible && (
                  <div className="mx-2 mb-1.5 px-2.5 py-2 rounded bg-purple-500/[0.06] border border-purple-500/[0.12] text-[10px] text-purple-200/80 leading-relaxed">
                    {getUsageInfo(template)}
                  </div>
                )}
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-10 text-gray-600 text-[11px]">
              Sin resultados
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
