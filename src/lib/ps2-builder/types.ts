// PS2 Visual Builder - Types and Interfaces

// PS2 Native Resolution Constants
export const PS2_WIDTH = 640;
export const PS2_HEIGHT = 448;

// Color type for PS2 components
export interface PS2Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Base component interface
export interface PS2Component {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, any>;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  name: string;
}

// Component template definition
export interface ComponentTemplate {
  type: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: ComponentCategory;
  subcategory?: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultProps: Record<string, any>;
  codeGenerator: (comp: PS2Component) => string;
  tags: string[];
}

// Component categories based on AthenaEnv modules
export type ComponentCategory = 
  | 'draw'        // Draw module: shapes and primitives
  | 'font'        // Font module: text rendering
  | 'image'       // Image module: images and sprites
  | 'controls'    // UI controls: buttons, inputs
  | 'layout'      // Layout components: containers, panels
  | 'lists'       // List and grid components
  | 'indicators'  // Progress, status indicators
  | 'media'       // Video, audio components
  | 'scroll'      // Scrollable containers for web-like content
  | 'advanced';   // TileMap, Render, etc.

// Category metadata
export interface CategoryInfo {
  id: ComponentCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// All categories with metadata
export const CATEGORIES: CategoryInfo[] = [
  { 
    id: 'draw', 
    name: 'Primitivas', 
    description: 'Formas básicas del módulo Draw',
    icon: 'Shapes',
    color: 'text-blue-400'
  },
  { 
    id: 'font', 
    name: 'Texto', 
    description: 'Renderizado de texto con Font',
    icon: 'Type',
    color: 'text-green-400'
  },
  { 
    id: 'image', 
    name: 'Imágenes', 
    description: 'Componentes del módulo Image',
    icon: 'Image',
    color: 'text-purple-400'
  },
  { 
    id: 'controls', 
    name: 'Controles', 
    description: 'Elementos interactivos de UI',
    icon: 'MousePointer',
    color: 'text-cyan-400'
  },
  { 
    id: 'layout', 
    name: 'Layout', 
    description: 'Contenedores y estructura',
    icon: 'Layout',
    color: 'text-orange-400'
  },
  { 
    id: 'lists', 
    name: 'Listas', 
    description: 'Listas y grillas de datos',
    icon: 'List',
    color: 'text-yellow-400'
  },
  { 
    id: 'indicators', 
    name: 'Indicadores', 
    description: 'Barras de progreso y estados',
    icon: 'Activity',
    color: 'text-red-400'
  },
  { 
    id: 'media', 
    name: 'Media', 
    description: 'Video y contenido multimedia',
    icon: 'Film',
    color: 'text-pink-400'
  },
  { 
    id: 'scroll', 
    name: 'Scroll', 
    description: 'Contenedores scrolleables para web, diarios y wikis en PS2',
    icon: 'Rows3',
    color: 'text-emerald-400'
  },
  { 
    id: 'advanced', 
    name: 'Avanzado', 
    description: 'TileMap, Timer, sistemas',
    icon: 'Cpu',
    color: 'text-indigo-400'
  }
];

// Helper to create default color
export const defaultColor = (r: number, g: number, b: number, a: number = 255): PS2Color => ({ r, g, b, a });

// Generate unique ID
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Color to CSS rgba string
export const colorToRgba = (color: PS2Color, alphaOverride?: number): string => {
  const a = alphaOverride !== undefined ? alphaOverride : color.a / 255;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${a})`;
};

// Color to AthenaEnv Color.new() string
export const colorToAthena = (color: PS2Color): string => {
  return `Color.new(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
};
