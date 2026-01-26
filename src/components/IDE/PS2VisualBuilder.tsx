import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Menu,
  Minus,
  CheckSquare,
  Radio,
  ListOrdered,
  Grid3X3,
  Trash2,
  Copy,
  Move,
  RotateCcw,
  Code,
  Palette,
  Layers,
  Settings,
  Download,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
  MousePointer,
  PenTool,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  ArrowUpDown
} from 'lucide-react';

// PS2 Native Resolution
const PS2_WIDTH = 640;
const PS2_HEIGHT = 448;

// Component types available for PS2 development
interface PS2Component {
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

interface ComponentTemplate {
  type: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultProps: Record<string, any>;
  codeGenerator: (comp: PS2Component) => string;
}

// Component templates with code generators
const componentTemplates: ComponentTemplate[] = [
  // Layout Components
  {
    type: 'header',
    name: 'Header',
    icon: <Menu className="w-4 h-4" />,
    category: 'Layout',
    defaultWidth: 600,
    defaultHeight: 40,
    defaultProps: { 
      text: 'Mi Aplicación PS2', 
      bgColor: { r: 0, g: 64, b: 128, a: 255 },
      textColor: { r: 255, g: 255, b: 255, a: 255 },
      fontSize: 24
    },
    codeGenerator: (comp) => `// Header Component
Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, Color.new(${comp.props.bgColor.r}, ${comp.props.bgColor.g}, ${comp.props.bgColor.b}, ${comp.props.bgColor.a}));
font.color = Color.new(${comp.props.textColor.r}, ${comp.props.textColor.g}, ${comp.props.textColor.b}, ${comp.props.textColor.a});
font.scale = ${(comp.props.fontSize / 16).toFixed(2)};
font.print(${comp.x + 10}, ${comp.y + Math.floor(comp.height / 2 - comp.props.fontSize / 2)}, "${comp.props.text}");`
  },
  {
    type: 'footer',
    name: 'Footer',
    icon: <Minus className="w-4 h-4" />,
    category: 'Layout',
    defaultWidth: 600,
    defaultHeight: 30,
    defaultProps: { 
      text: '© 2025 - Press START to continue',
      bgColor: { r: 32, g: 32, b: 64, a: 255 },
      textColor: { r: 180, g: 180, b: 180, a: 255 },
      fontSize: 12
    },
    codeGenerator: (comp) => `// Footer Component
Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, Color.new(${comp.props.bgColor.r}, ${comp.props.bgColor.g}, ${comp.props.bgColor.b}, ${comp.props.bgColor.a}));
font.color = Color.new(${comp.props.textColor.r}, ${comp.props.textColor.g}, ${comp.props.textColor.b}, ${comp.props.textColor.a});
font.scale = ${(comp.props.fontSize / 16).toFixed(2)};
font.print(${comp.x + 10}, ${comp.y + 8}, "${comp.props.text}");`
  },
  // Basic Shapes
  {
    type: 'rect',
    name: 'Rectángulo',
    icon: <Square className="w-4 h-4" />,
    category: 'Formas',
    defaultWidth: 100,
    defaultHeight: 60,
    defaultProps: { 
      fillColor: { r: 100, g: 100, b: 200, a: 255 },
      borderColor: { r: 255, g: 255, b: 255, a: 255 },
      hasBorder: true,
      borderWidth: 2
    },
    codeGenerator: (comp) => {
      let code = `// Rectangle
Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, Color.new(${comp.props.fillColor.r}, ${comp.props.fillColor.g}, ${comp.props.fillColor.b}, ${comp.props.fillColor.a}));`;
      if (comp.props.hasBorder) {
        code += `
// Border
Draw.line(${comp.x}, ${comp.y}, ${comp.x + comp.width}, ${comp.y}, Color.new(${comp.props.borderColor.r}, ${comp.props.borderColor.g}, ${comp.props.borderColor.b}, ${comp.props.borderColor.a}));
Draw.line(${comp.x + comp.width}, ${comp.y}, ${comp.x + comp.width}, ${comp.y + comp.height}, Color.new(${comp.props.borderColor.r}, ${comp.props.borderColor.g}, ${comp.props.borderColor.b}, ${comp.props.borderColor.a}));
Draw.line(${comp.x + comp.width}, ${comp.y + comp.height}, ${comp.x}, ${comp.y + comp.height}, Color.new(${comp.props.borderColor.r}, ${comp.props.borderColor.g}, ${comp.props.borderColor.b}, ${comp.props.borderColor.a}));
Draw.line(${comp.x}, ${comp.y + comp.height}, ${comp.x}, ${comp.y}, Color.new(${comp.props.borderColor.r}, ${comp.props.borderColor.g}, ${comp.props.borderColor.b}, ${comp.props.borderColor.a}));`;
      }
      return code;
    }
  },
  {
    type: 'circle',
    name: 'Círculo',
    icon: <Circle className="w-4 h-4" />,
    category: 'Formas',
    defaultWidth: 60,
    defaultHeight: 60,
    defaultProps: { 
      fillColor: { r: 200, g: 100, b: 100, a: 255 },
      radius: 30
    },
    codeGenerator: (comp) => `// Circle
Draw.circle(${comp.x + Math.floor(comp.width / 2)}, ${comp.y + Math.floor(comp.height / 2)}, ${Math.floor(Math.min(comp.width, comp.height) / 2)}, Color.new(${comp.props.fillColor.r}, ${comp.props.fillColor.g}, ${comp.props.fillColor.b}, ${comp.props.fillColor.a}));`
  },
  {
    type: 'line',
    name: 'Línea',
    icon: <Minus className="w-4 h-4 rotate-45" />,
    category: 'Formas',
    defaultWidth: 100,
    defaultHeight: 2,
    defaultProps: { 
      color: { r: 255, g: 255, b: 255, a: 255 },
      thickness: 1
    },
    codeGenerator: (comp) => `// Line
Draw.line(${comp.x}, ${comp.y}, ${comp.x + comp.width}, ${comp.y + comp.height}, Color.new(${comp.props.color.r}, ${comp.props.color.g}, ${comp.props.color.b}, ${comp.props.color.a}));`
  },
  // Text Components
  {
    type: 'text',
    name: 'Texto',
    icon: <Type className="w-4 h-4" />,
    category: 'Texto',
    defaultWidth: 200,
    defaultHeight: 24,
    defaultProps: { 
      text: 'Texto de ejemplo',
      color: { r: 255, g: 255, b: 255, a: 255 },
      fontSize: 16,
      align: 'left'
    },
    codeGenerator: (comp) => `// Text Label
font.color = Color.new(${comp.props.color.r}, ${comp.props.color.g}, ${comp.props.color.b}, ${comp.props.color.a});
font.scale = ${(comp.props.fontSize / 16).toFixed(2)};
font.print(${comp.x}, ${comp.y}, "${comp.props.text}");`
  },
  {
    type: 'title',
    name: 'Título',
    icon: <Bold className="w-4 h-4" />,
    category: 'Texto',
    defaultWidth: 300,
    defaultHeight: 36,
    defaultProps: { 
      text: 'TÍTULO PRINCIPAL',
      color: { r: 0, g: 255, b: 255, a: 255 },
      fontSize: 28,
      shadow: true
    },
    codeGenerator: (comp) => {
      let code = '';
      if (comp.props.shadow) {
        code += `// Title Shadow
font.color = Color.new(0, 0, 0, 180);
font.scale = ${(comp.props.fontSize / 16).toFixed(2)};
font.print(${comp.x + 2}, ${comp.y + 2}, "${comp.props.text}");
`;
      }
      code += `// Title Text
font.color = Color.new(${comp.props.color.r}, ${comp.props.color.g}, ${comp.props.color.b}, ${comp.props.color.a});
font.scale = ${(comp.props.fontSize / 16).toFixed(2)};
font.print(${comp.x}, ${comp.y}, "${comp.props.text}");`;
      return code;
    }
  },
  // Form Controls
  {
    type: 'textbox',
    name: 'TextBox',
    icon: <AlignLeft className="w-4 h-4" />,
    category: 'Controles',
    defaultWidth: 200,
    defaultHeight: 28,
    defaultProps: { 
      placeholder: 'Ingrese texto...',
      value: '',
      bgColor: { r: 40, g: 40, b: 60, a: 255 },
      borderColor: { r: 100, g: 100, b: 150, a: 255 },
      textColor: { r: 255, g: 255, b: 255, a: 255 },
      focused: false
    },
    codeGenerator: (comp) => `// TextBox Component
const textbox_${comp.id.slice(0, 6)} = {
  x: ${comp.x},
  y: ${comp.y},
  width: ${comp.width},
  height: ${comp.height},
  value: "${comp.props.value}",
  placeholder: "${comp.props.placeholder}",
  focused: false,
  
  draw: function() {
    // Background
    Draw.rect(this.x, this.y, this.width, this.height, Color.new(${comp.props.bgColor.r}, ${comp.props.bgColor.g}, ${comp.props.bgColor.b}, ${comp.props.bgColor.a}));
    
    // Border
    const borderColor = this.focused ? Color.new(0, 200, 255, 255) : Color.new(${comp.props.borderColor.r}, ${comp.props.borderColor.g}, ${comp.props.borderColor.b}, ${comp.props.borderColor.a});
    Draw.line(this.x, this.y, this.x + this.width, this.y, borderColor);
    Draw.line(this.x + this.width, this.y, this.x + this.width, this.y + this.height, borderColor);
    Draw.line(this.x + this.width, this.y + this.height, this.x, this.y + this.height, borderColor);
    Draw.line(this.x, this.y + this.height, this.x, this.y, borderColor);
    
    // Text
    font.color = this.value ? Color.new(${comp.props.textColor.r}, ${comp.props.textColor.g}, ${comp.props.textColor.b}, ${comp.props.textColor.a}) : Color.new(128, 128, 128, 255);
    font.scale = 0.875;
    font.print(this.x + 8, this.y + 6, this.value || this.placeholder);
  }
};
textbox_${comp.id.slice(0, 6)}.draw();`
  },
  {
    type: 'button',
    name: 'Botón',
    icon: <Square className="w-4 h-4" />,
    category: 'Controles',
    defaultWidth: 120,
    defaultHeight: 32,
    defaultProps: { 
      text: 'ACEPTAR',
      bgColor: { r: 0, g: 100, b: 180, a: 255 },
      hoverColor: { r: 0, g: 130, b: 220, a: 255 },
      textColor: { r: 255, g: 255, b: 255, a: 255 },
      selected: false
    },
    codeGenerator: (comp) => `// Button Component
const btn_${comp.id.slice(0, 6)} = {
  x: ${comp.x},
  y: ${comp.y},
  width: ${comp.width},
  height: ${comp.height},
  text: "${comp.props.text}",
  selected: false,
  
  draw: function() {
    const bgColor = this.selected ? 
      Color.new(${comp.props.hoverColor.r}, ${comp.props.hoverColor.g}, ${comp.props.hoverColor.b}, ${comp.props.hoverColor.a}) : 
      Color.new(${comp.props.bgColor.r}, ${comp.props.bgColor.g}, ${comp.props.bgColor.b}, ${comp.props.bgColor.a});
    
    Draw.rect(this.x, this.y, this.width, this.height, bgColor);
    
    // Selection indicator
    if (this.selected) {
      Draw.rect(this.x, this.y, 4, this.height, Color.new(0, 255, 255, 255));
    }
    
    font.color = Color.new(${comp.props.textColor.r}, ${comp.props.textColor.g}, ${comp.props.textColor.b}, ${comp.props.textColor.a});
    font.scale = 1;
    const textWidth = font.getTextSize(this.text).width;
    font.print(this.x + (this.width - textWidth) / 2, this.y + 8, this.text);
  },
  
  onPress: function() {
    console.log("Button pressed: " + this.text);
    // Add your action here
  }
};
btn_${comp.id.slice(0, 6)}.draw();`
  },
  {
    type: 'checkbox',
    name: 'CheckBox',
    icon: <CheckSquare className="w-4 h-4" />,
    category: 'Controles',
    defaultWidth: 150,
    defaultHeight: 20,
    defaultProps: { 
      label: 'Opción',
      checked: false,
      color: { r: 255, g: 255, b: 255, a: 255 },
      checkColor: { r: 0, g: 255, b: 128, a: 255 }
    },
    codeGenerator: (comp) => `// Checkbox Component
const checkbox_${comp.id.slice(0, 6)} = {
  x: ${comp.x},
  y: ${comp.y},
  label: "${comp.props.label}",
  checked: ${comp.props.checked},
  selected: false,
  
  draw: function() {
    // Box
    const boxColor = this.selected ? Color.new(0, 200, 255, 255) : Color.new(${comp.props.color.r}, ${comp.props.color.g}, ${comp.props.color.b}, ${comp.props.color.a});
    Draw.line(this.x, this.y, this.x + 16, this.y, boxColor);
    Draw.line(this.x + 16, this.y, this.x + 16, this.y + 16, boxColor);
    Draw.line(this.x + 16, this.y + 16, this.x, this.y + 16, boxColor);
    Draw.line(this.x, this.y + 16, this.x, this.y, boxColor);
    
    // Check mark
    if (this.checked) {
      Draw.line(this.x + 3, this.y + 8, this.x + 6, this.y + 12, Color.new(${comp.props.checkColor.r}, ${comp.props.checkColor.g}, ${comp.props.checkColor.b}, ${comp.props.checkColor.a}));
      Draw.line(this.x + 6, this.y + 12, this.x + 13, this.y + 4, Color.new(${comp.props.checkColor.r}, ${comp.props.checkColor.g}, ${comp.props.checkColor.b}, ${comp.props.checkColor.a}));
    }
    
    // Label
    font.color = Color.new(${comp.props.color.r}, ${comp.props.color.g}, ${comp.props.color.b}, ${comp.props.color.a});
    font.scale = 0.875;
    font.print(this.x + 24, this.y + 2, this.label);
  },
  
  toggle: function() {
    this.checked = !this.checked;
  }
};
checkbox_${comp.id.slice(0, 6)}.draw();`
  },
  {
    type: 'radiobutton',
    name: 'RadioButton',
    icon: <Radio className="w-4 h-4" />,
    category: 'Controles',
    defaultWidth: 150,
    defaultHeight: 20,
    defaultProps: { 
      label: 'Opción',
      selected: false,
      group: 'group1',
      color: { r: 255, g: 255, b: 255, a: 255 },
      activeColor: { r: 0, g: 255, b: 200, a: 255 }
    },
    codeGenerator: (comp) => `// RadioButton Component
const radio_${comp.id.slice(0, 6)} = {
  x: ${comp.x},
  y: ${comp.y},
  label: "${comp.props.label}",
  selected: ${comp.props.selected},
  group: "${comp.props.group}",
  focused: false,
  
  draw: function() {
    // Outer circle
    const circleColor = this.focused ? Color.new(0, 200, 255, 255) : Color.new(${comp.props.color.r}, ${comp.props.color.g}, ${comp.props.color.b}, ${comp.props.color.a});
    Draw.circle(this.x + 8, this.y + 8, 8, Color.new(40, 40, 60, 255));
    Draw.circle(this.x + 8, this.y + 8, 7, circleColor);
    Draw.circle(this.x + 8, this.y + 8, 6, Color.new(40, 40, 60, 255));
    
    // Inner dot when selected
    if (this.selected) {
      Draw.circle(this.x + 8, this.y + 8, 4, Color.new(${comp.props.activeColor.r}, ${comp.props.activeColor.g}, ${comp.props.activeColor.b}, ${comp.props.activeColor.a}));
    }
    
    // Label
    font.color = Color.new(${comp.props.color.r}, ${comp.props.color.g}, ${comp.props.color.b}, ${comp.props.color.a});
    font.scale = 0.875;
    font.print(this.x + 24, this.y + 2, this.label);
  }
};
radio_${comp.id.slice(0, 6)}.draw();`
  },
  {
    type: 'slider',
    name: 'Slider',
    icon: <ArrowUpDown className="w-4 h-4 rotate-90" />,
    category: 'Controles',
    defaultWidth: 200,
    defaultHeight: 24,
    defaultProps: { 
      value: 50,
      min: 0,
      max: 100,
      trackColor: { r: 60, g: 60, b: 80, a: 255 },
      fillColor: { r: 0, g: 180, b: 255, a: 255 },
      thumbColor: { r: 255, g: 255, b: 255, a: 255 }
    },
    codeGenerator: (comp) => `// Slider Component
const slider_${comp.id.slice(0, 6)} = {
  x: ${comp.x},
  y: ${comp.y},
  width: ${comp.width},
  value: ${comp.props.value},
  min: ${comp.props.min},
  max: ${comp.props.max},
  selected: false,
  
  draw: function() {
    const trackY = this.y + 8;
    const trackHeight = 8;
    const progress = (this.value - this.min) / (this.max - this.min);
    const fillWidth = this.width * progress;
    const thumbX = this.x + fillWidth;
    
    // Track background
    Draw.rect(this.x, trackY, this.width, trackHeight, Color.new(${comp.props.trackColor.r}, ${comp.props.trackColor.g}, ${comp.props.trackColor.b}, ${comp.props.trackColor.a}));
    
    // Fill
    Draw.rect(this.x, trackY, fillWidth, trackHeight, Color.new(${comp.props.fillColor.r}, ${comp.props.fillColor.g}, ${comp.props.fillColor.b}, ${comp.props.fillColor.a}));
    
    // Thumb
    const thumbColor = this.selected ? Color.new(0, 255, 255, 255) : Color.new(${comp.props.thumbColor.r}, ${comp.props.thumbColor.g}, ${comp.props.thumbColor.b}, ${comp.props.thumbColor.a});
    Draw.circle(thumbX, trackY + 4, 8, thumbColor);
  },
  
  setValue: function(val) {
    this.value = Math.max(this.min, Math.min(this.max, val));
  }
};
slider_${comp.id.slice(0, 6)}.draw();`
  },
  // List/Grid Components
  {
    type: 'list',
    name: 'Lista',
    icon: <ListOrdered className="w-4 h-4" />,
    category: 'Listas',
    defaultWidth: 200,
    defaultHeight: 150,
    defaultProps: { 
      items: ['Elemento 1', 'Elemento 2', 'Elemento 3', 'Elemento 4'],
      selectedIndex: 0,
      bgColor: { r: 30, g: 30, b: 50, a: 255 },
      itemColor: { r: 255, g: 255, b: 255, a: 255 },
      selectedBg: { r: 0, g: 100, b: 180, a: 255 },
      itemHeight: 28
    },
    codeGenerator: (comp) => `// List Component
const list_${comp.id.slice(0, 6)} = {
  x: ${comp.x},
  y: ${comp.y},
  width: ${comp.width},
  height: ${comp.height},
  items: ${JSON.stringify(comp.props.items)},
  selectedIndex: ${comp.props.selectedIndex},
  scrollOffset: 0,
  itemHeight: ${comp.props.itemHeight},
  
  draw: function() {
    // Background
    Draw.rect(this.x, this.y, this.width, this.height, Color.new(${comp.props.bgColor.r}, ${comp.props.bgColor.g}, ${comp.props.bgColor.b}, ${comp.props.bgColor.a}));
    
    const visibleItems = Math.floor(this.height / this.itemHeight);
    
    for (let i = 0; i < Math.min(visibleItems, this.items.length); i++) {
      const itemIndex = i + this.scrollOffset;
      if (itemIndex >= this.items.length) break;
      
      const itemY = this.y + i * this.itemHeight;
      
      // Selected item background
      if (itemIndex === this.selectedIndex) {
        Draw.rect(this.x, itemY, this.width, this.itemHeight, Color.new(${comp.props.selectedBg.r}, ${comp.props.selectedBg.g}, ${comp.props.selectedBg.b}, ${comp.props.selectedBg.a}));
      }
      
      // Item text
      font.color = Color.new(${comp.props.itemColor.r}, ${comp.props.itemColor.g}, ${comp.props.itemColor.b}, ${comp.props.itemColor.a});
      font.scale = 0.875;
      font.print(this.x + 12, itemY + 6, this.items[itemIndex]);
    }
    
    // Border
    Draw.line(this.x, this.y, this.x + this.width, this.y, Color.new(80, 80, 120, 255));
    Draw.line(this.x + this.width, this.y, this.x + this.width, this.y + this.height, Color.new(80, 80, 120, 255));
    Draw.line(this.x + this.width, this.y + this.height, this.x, this.y + this.height, Color.new(80, 80, 120, 255));
    Draw.line(this.x, this.y + this.height, this.x, this.y, Color.new(80, 80, 120, 255));
  },
  
  moveUp: function() {
    if (this.selectedIndex > 0) this.selectedIndex--;
  },
  
  moveDown: function() {
    if (this.selectedIndex < this.items.length - 1) this.selectedIndex++;
  }
};
list_${comp.id.slice(0, 6)}.draw();`
  },
  {
    type: 'grid',
    name: 'Grid',
    icon: <Grid3X3 className="w-4 h-4" />,
    category: 'Listas',
    defaultWidth: 280,
    defaultHeight: 200,
    defaultProps: { 
      columns: 4,
      rows: 3,
      cellWidth: 64,
      cellHeight: 64,
      gap: 8,
      bgColor: { r: 30, g: 30, b: 50, a: 255 },
      cellColor: { r: 60, g: 60, b: 90, a: 255 },
      selectedColor: { r: 0, g: 150, b: 255, a: 255 },
      selectedIndex: 0
    },
    codeGenerator: (comp) => `// Grid Component
const grid_${comp.id.slice(0, 6)} = {
  x: ${comp.x},
  y: ${comp.y},
  columns: ${comp.props.columns},
  rows: ${comp.props.rows},
  cellWidth: ${comp.props.cellWidth},
  cellHeight: ${comp.props.cellHeight},
  gap: ${comp.props.gap},
  selectedIndex: ${comp.props.selectedIndex},
  items: [], // Add your items here
  
  draw: function() {
    // Background
    Draw.rect(this.x - 4, this.y - 4, 
      this.columns * (this.cellWidth + this.gap) + 8, 
      this.rows * (this.cellHeight + this.gap) + 8, 
      Color.new(${comp.props.bgColor.r}, ${comp.props.bgColor.g}, ${comp.props.bgColor.b}, ${comp.props.bgColor.a}));
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        const index = row * this.columns + col;
        const cellX = this.x + col * (this.cellWidth + this.gap);
        const cellY = this.y + row * (this.cellHeight + this.gap);
        
        // Cell background
        const isSelected = index === this.selectedIndex;
        const cellColor = isSelected ? 
          Color.new(${comp.props.selectedColor.r}, ${comp.props.selectedColor.g}, ${comp.props.selectedColor.b}, ${comp.props.selectedColor.a}) : 
          Color.new(${comp.props.cellColor.r}, ${comp.props.cellColor.g}, ${comp.props.cellColor.b}, ${comp.props.cellColor.a});
        
        Draw.rect(cellX, cellY, this.cellWidth, this.cellHeight, cellColor);
        
        // Selection border
        if (isSelected) {
          Draw.line(cellX, cellY, cellX + this.cellWidth, cellY, Color.new(255, 255, 255, 255));
          Draw.line(cellX + this.cellWidth, cellY, cellX + this.cellWidth, cellY + this.cellHeight, Color.new(255, 255, 255, 255));
          Draw.line(cellX + this.cellWidth, cellY + this.cellHeight, cellX, cellY + this.cellHeight, Color.new(255, 255, 255, 255));
          Draw.line(cellX, cellY + this.cellHeight, cellX, cellY, Color.new(255, 255, 255, 255));
        }
      }
    }
  },
  
  navigate: function(direction) {
    const col = this.selectedIndex % this.columns;
    const row = Math.floor(this.selectedIndex / this.columns);
    
    switch(direction) {
      case 'up': if (row > 0) this.selectedIndex -= this.columns; break;
      case 'down': if (row < this.rows - 1) this.selectedIndex += this.columns; break;
      case 'left': if (col > 0) this.selectedIndex--; break;
      case 'right': if (col < this.columns - 1) this.selectedIndex++; break;
    }
  }
};
grid_${comp.id.slice(0, 6)}.draw();`
  },
  // Image
  {
    type: 'image',
    name: 'Imagen',
    icon: <ImageIcon className="w-4 h-4" />,
    category: 'Media',
    defaultWidth: 128,
    defaultHeight: 128,
    defaultProps: { 
      src: 'assets/image.png',
      filter: 'LINEAR'
    },
    codeGenerator: (comp) => `// Image Component
const img_${comp.id.slice(0, 6)} = new Image("${comp.props.src}");
img_${comp.id.slice(0, 6)}.width = ${comp.width};
img_${comp.id.slice(0, 6)}.height = ${comp.height};
img_${comp.id.slice(0, 6)}.filter = Image.${comp.props.filter};
img_${comp.id.slice(0, 6)}.draw(${comp.x}, ${comp.y});`
  },
  // Progress bar
  {
    type: 'progressbar',
    name: 'Barra de Progreso',
    icon: <Minus className="w-4 h-4" />,
    category: 'Indicadores',
    defaultWidth: 200,
    defaultHeight: 20,
    defaultProps: { 
      value: 75,
      max: 100,
      bgColor: { r: 40, g: 40, b: 60, a: 255 },
      fillColor: { r: 0, g: 200, b: 100, a: 255 },
      showText: true
    },
    codeGenerator: (comp) => `// Progress Bar Component
const progress_${comp.id.slice(0, 6)} = {
  x: ${comp.x},
  y: ${comp.y},
  width: ${comp.width},
  height: ${comp.height},
  value: ${comp.props.value},
  max: ${comp.props.max},
  
  draw: function() {
    // Background
    Draw.rect(this.x, this.y, this.width, this.height, Color.new(${comp.props.bgColor.r}, ${comp.props.bgColor.g}, ${comp.props.bgColor.b}, ${comp.props.bgColor.a}));
    
    // Fill
    const fillWidth = (this.value / this.max) * this.width;
    Draw.rect(this.x, this.y, fillWidth, this.height, Color.new(${comp.props.fillColor.r}, ${comp.props.fillColor.g}, ${comp.props.fillColor.b}, ${comp.props.fillColor.a}));
    
    ${comp.props.showText ? `// Text
    font.color = Color.new(255, 255, 255, 255);
    font.scale = 0.75;
    const text = Math.floor((this.value / this.max) * 100) + "%";
    const textWidth = font.getTextSize(text).width;
    font.print(this.x + (this.width - textWidth) / 2, this.y + 4, text);` : ''}
  },
  
  setValue: function(val) {
    this.value = Math.max(0, Math.min(this.max, val));
  }
};
progress_${comp.id.slice(0, 6)}.draw();`
  }
];

// Group templates by category
const categories = [...new Set(componentTemplates.map(t => t.category))];

interface PS2VisualBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateCode: (code: string) => void;
  initialCode?: string;
}

export function PS2VisualBuilder({ open, onOpenChange, onGenerateCode, initialCode }: PS2VisualBuilderProps) {
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
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectedComponent = components.find(c => c.id === selectedId);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Snap to grid
  const snapToGrid = (value: number) => {
    if (!gridSnap) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Add component from palette
  const handleAddComponent = (template: ComponentTemplate) => {
    const newComponent: PS2Component = {
      id: generateId(),
      type: template.type,
      x: snapToGrid(PS2_WIDTH / 2 - template.defaultWidth / 2),
      y: snapToGrid(PS2_HEIGHT / 2 - template.defaultHeight / 2),
      width: template.defaultWidth,
      height: template.defaultHeight,
      props: { ...template.defaultProps },
      zIndex: components.length,
      locked: false,
      visible: true,
      name: `${template.name}_${components.length + 1}`
    };
    
    setComponents(prev => [...prev, newComponent]);
    setSelectedId(newComponent.id);
  };

  // Handle mouse down on component
  const handleComponentMouseDown = (e: React.MouseEvent, comp: PS2Component) => {
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
  };

  // Handle resize handle mouse down
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
  };

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (isDragging && selectedId) {
      const x = snapToGrid(Math.max(0, Math.min(PS2_WIDTH - (selectedComponent?.width || 0), 
        (e.clientX - rect.left) / zoom - dragOffset.x)));
      const y = snapToGrid(Math.max(0, Math.min(PS2_HEIGHT - (selectedComponent?.height || 0), 
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
  }, [isDragging, isResizing, selectedId, selectedComponent, dragOffset, zoom, gridSnap, gridSize, resizeHandle]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Add/remove event listeners
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

  // Delete selected component
  const handleDelete = () => {
    if (selectedId) {
      setComponents(prev => prev.filter(c => c.id !== selectedId));
      setSelectedId(null);
    }
  };

  // Duplicate selected component
  const handleDuplicate = () => {
    if (selectedComponent) {
      const newComponent: PS2Component = {
        ...selectedComponent,
        id: generateId(),
        x: snapToGrid(selectedComponent.x + 20),
        y: snapToGrid(selectedComponent.y + 20),
        name: `${selectedComponent.name}_copy`
      };
      setComponents(prev => [...prev, newComponent]);
      setSelectedId(newComponent.id);
    }
  };

  // Move component in layer order
  const handleMoveLayer = (direction: 'up' | 'down') => {
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
  };

  // Generate full code
  const generateFullCode = useCallback(() => {
    const sortedComponents = [...components].sort((a, b) => a.zIndex - b.zIndex);
    
    let code = `// ============================================
// PS2 UI Generated by ATHENA Visual Builder
// Resolution: ${PS2_WIDTH}x${PS2_HEIGHT}
// Components: ${components.length}
// ============================================

// Initialize font
const font = new Font("default");

// Clear screen and draw UI
function drawUI() {
  Screen.clear(Color.new(20, 20, 40, 255));
  
`;

    sortedComponents.forEach((comp, index) => {
      if (!comp.visible) return;
      
      const template = componentTemplates.find(t => t.type === comp.type);
      if (template) {
        code += `  // ${comp.name} (${comp.type})\n`;
        const componentCode = template.codeGenerator(comp);
        // Indent each line
        code += componentCode.split('\n').map(line => '  ' + line).join('\n');
        code += '\n\n';
      }
    });

    code += `  Screen.flip();
}

// Main loop
os.setInterval(() => {
  // Handle input
  const pad = Pads.get(0);
  
  // Update pad state
  // ... your input handling code here ...
  
  // Draw UI
  drawUI();
}, 16); // ~60 FPS
`;

    return code;
  }, [components]);

  // Update property of selected component
  const updateComponentProp = (propPath: string, value: any) => {
    if (!selectedId) return;
    
    setComponents(prev => prev.map(c => {
      if (c.id !== selectedId) return c;
      
      const pathParts = propPath.split('.');
      if (pathParts.length === 1) {
        return { ...c, props: { ...c.props, [propPath]: value } };
      } else {
        // Handle nested props like 'bgColor.r'
        const newProps = { ...c.props };
        let current: any = newProps;
        for (let i = 0; i < pathParts.length - 1; i++) {
          current[pathParts[i]] = { ...current[pathParts[i]] };
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = value;
        return { ...c, props: newProps };
      }
    }));
  };

  // Render component preview
  const renderComponent = (comp: PS2Component) => {
    const template = componentTemplates.find(t => t.type === comp.type);
    if (!template) return null;

    const isSelected = comp.id === selectedId;
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

    // Render based on type
    const getComponentVisual = () => {
      const p = comp.props;
      switch (comp.type) {
        case 'header':
        case 'footer':
          return (
            <div 
              className="w-full h-full flex items-center px-2 text-xs font-semibold"
              style={{ 
                backgroundColor: `rgba(${p.bgColor.r}, ${p.bgColor.g}, ${p.bgColor.b}, ${p.bgColor.a / 255})`,
                color: `rgba(${p.textColor.r}, ${p.textColor.g}, ${p.textColor.b}, ${p.textColor.a / 255})`
              }}
            >
              {p.text}
            </div>
          );
        case 'rect':
          return (
            <div 
              className="w-full h-full"
              style={{ 
                backgroundColor: `rgba(${p.fillColor.r}, ${p.fillColor.g}, ${p.fillColor.b}, ${p.fillColor.a / 255})`,
                border: p.hasBorder ? `${p.borderWidth}px solid rgba(${p.borderColor.r}, ${p.borderColor.g}, ${p.borderColor.b}, ${p.borderColor.a / 255})` : 'none'
              }}
            />
          );
        case 'circle':
          return (
            <div 
              className="w-full h-full rounded-full"
              style={{ 
                backgroundColor: `rgba(${p.fillColor.r}, ${p.fillColor.g}, ${p.fillColor.b}, ${p.fillColor.a / 255})`
              }}
            />
          );
        case 'text':
        case 'title':
          return (
            <div 
              className="w-full h-full flex items-center"
              style={{ 
                color: `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.color.a / 255})`,
                fontSize: p.fontSize * zoom * 0.6,
                fontWeight: comp.type === 'title' ? 'bold' : 'normal',
                textShadow: p.shadow ? '2px 2px 0 rgba(0,0,0,0.7)' : 'none'
              }}
            >
              {p.text}
            </div>
          );
        case 'textbox':
          return (
            <div 
              className="w-full h-full flex items-center px-2 text-xs border"
              style={{ 
                backgroundColor: `rgba(${p.bgColor.r}, ${p.bgColor.g}, ${p.bgColor.b}, ${p.bgColor.a / 255})`,
                borderColor: `rgba(${p.borderColor.r}, ${p.borderColor.g}, ${p.borderColor.b}, ${p.borderColor.a / 255})`,
                color: p.value ? `rgba(${p.textColor.r}, ${p.textColor.g}, ${p.textColor.b}, ${p.textColor.a / 255})` : 'rgba(128,128,128,1)'
              }}
            >
              {p.value || p.placeholder}
            </div>
          );
        case 'button':
          return (
            <div 
              className="w-full h-full flex items-center justify-center text-xs font-semibold"
              style={{ 
                backgroundColor: `rgba(${p.bgColor.r}, ${p.bgColor.g}, ${p.bgColor.b}, ${p.bgColor.a / 255})`,
                color: `rgba(${p.textColor.r}, ${p.textColor.g}, ${p.textColor.b}, ${p.textColor.a / 255})`
              }}
            >
              {p.text}
            </div>
          );
        case 'checkbox':
          return (
            <div className="w-full h-full flex items-center gap-1">
              <div 
                className="w-4 h-4 border flex items-center justify-center"
                style={{ borderColor: `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.color.a / 255})` }}
              >
                {p.checked && <CheckSquare className="w-3 h-3" style={{ color: `rgba(${p.checkColor.r}, ${p.checkColor.g}, ${p.checkColor.b}, 1)` }} />}
              </div>
              <span className="text-[10px]" style={{ color: `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.color.a / 255})` }}>
                {p.label}
              </span>
            </div>
          );
        case 'radiobutton':
          return (
            <div className="w-full h-full flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded-full border flex items-center justify-center"
                style={{ borderColor: `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.color.a / 255})` }}
              >
                {p.selected && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `rgba(${p.activeColor.r}, ${p.activeColor.g}, ${p.activeColor.b}, 1)` }} />
                )}
              </div>
              <span className="text-[10px]" style={{ color: `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.color.a / 255})` }}>
                {p.label}
              </span>
            </div>
          );
        case 'slider':
          const progress = (p.value - p.min) / (p.max - p.min) * 100;
          return (
            <div className="w-full h-full flex items-center">
              <div className="w-full h-2 rounded" style={{ backgroundColor: `rgba(${p.trackColor.r}, ${p.trackColor.g}, ${p.trackColor.b}, ${p.trackColor.a / 255})` }}>
                <div 
                  className="h-full rounded relative"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: `rgba(${p.fillColor.r}, ${p.fillColor.g}, ${p.fillColor.b}, ${p.fillColor.a / 255})`
                  }}
                >
                  <div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: `rgba(${p.thumbColor.r}, ${p.thumbColor.g}, ${p.thumbColor.b}, ${p.thumbColor.a / 255})` }}
                  />
                </div>
              </div>
            </div>
          );
        case 'list':
          return (
            <div 
              className="w-full h-full overflow-hidden border"
              style={{ 
                backgroundColor: `rgba(${p.bgColor.r}, ${p.bgColor.g}, ${p.bgColor.b}, ${p.bgColor.a / 255})`,
                borderColor: 'rgba(80,80,120,1)'
              }}
            >
              {p.items.slice(0, 5).map((item: string, i: number) => (
                <div 
                  key={i}
                  className="px-2 py-1 text-[10px]"
                  style={{ 
                    backgroundColor: i === p.selectedIndex ? `rgba(${p.selectedBg.r}, ${p.selectedBg.g}, ${p.selectedBg.b}, ${p.selectedBg.a / 255})` : 'transparent',
                    color: `rgba(${p.itemColor.r}, ${p.itemColor.g}, ${p.itemColor.b}, ${p.itemColor.a / 255})`
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          );
        case 'grid':
          return (
            <div 
              className="w-full h-full p-1 flex flex-wrap gap-1"
              style={{ backgroundColor: `rgba(${p.bgColor.r}, ${p.bgColor.g}, ${p.bgColor.b}, ${p.bgColor.a / 255})` }}
            >
              {Array.from({ length: Math.min(p.columns * p.rows, 12) }).map((_, i) => (
                <div 
                  key={i}
                  className="border"
                  style={{ 
                    width: `${100 / p.columns - 2}%`,
                    aspectRatio: '1',
                    backgroundColor: i === p.selectedIndex ? 
                      `rgba(${p.selectedColor.r}, ${p.selectedColor.g}, ${p.selectedColor.b}, ${p.selectedColor.a / 255})` : 
                      `rgba(${p.cellColor.r}, ${p.cellColor.g}, ${p.cellColor.b}, ${p.cellColor.a / 255})`,
                    borderColor: i === p.selectedIndex ? 'white' : 'transparent'
                  }}
                />
              ))}
            </div>
          );
        case 'image':
          return (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-dashed border-gray-500">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          );
        case 'progressbar':
          const pct = (p.value / p.max) * 100;
          return (
            <div 
              className="w-full h-full relative"
              style={{ backgroundColor: `rgba(${p.bgColor.r}, ${p.bgColor.g}, ${p.bgColor.b}, ${p.bgColor.a / 255})` }}
            >
              <div 
                className="h-full"
                style={{ 
                  width: `${pct}%`,
                  backgroundColor: `rgba(${p.fillColor.r}, ${p.fillColor.g}, ${p.fillColor.b}, ${p.fillColor.a / 255})`
                }}
              />
              {p.showText && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-semibold">
                  {Math.floor(pct)}%
                </span>
              )}
            </div>
          );
        case 'line':
          return (
            <div 
              className="w-full"
              style={{ 
                height: Math.max(2, p.thickness),
                backgroundColor: `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.color.a / 255})`
              }}
            />
          );
        default:
          return <div className="w-full h-full bg-gray-600" />;
      }
    };

    return (
      <div
        key={comp.id}
        style={baseStyle}
        className={`${isSelected ? 'ring-2 ring-ps2-cyan' : ''}`}
        onMouseDown={(e) => handleComponentMouseDown(e, comp)}
      >
        {getComponentVisual()}
        
        {/* Resize handles */}
        {isSelected && !comp.locked && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-ps2-cyan cursor-nw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-ps2-cyan cursor-ne-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-ps2-cyan cursor-sw-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-ps2-cyan cursor-se-resize" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
            <div className="absolute top-1/2 -left-1 w-2 h-2 bg-ps2-cyan cursor-w-resize -translate-y-1/2" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-ps2-cyan cursor-e-resize -translate-y-1/2" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
            <div className="absolute -top-1 left-1/2 w-2 h-2 bg-ps2-cyan cursor-n-resize -translate-x-1/2" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
            <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-ps2-cyan cursor-s-resize -translate-x-1/2" onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
          </>
        )}
      </div>
    );
  };

  // Color input component
  const ColorInput = ({ label, value, onChange }: { label: string; value: { r: number; g: number; b: number; a: number }; onChange: (color: { r: number; g: number; b: number; a: number }) => void }) => {
    const hexValue = `#${value.r.toString(16).padStart(2, '0')}${value.g.toString(16).padStart(2, '0')}${value.b.toString(16).padStart(2, '0')}`;
    
    const handleChange = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      onChange({ r, g, b, a: value.a });
    };
    
    return (
      <div className="flex items-center gap-2">
        <Label className="text-xs w-20">{label}</Label>
        <input 
          type="color" 
          value={hexValue}
          onChange={(e) => handleChange(e.target.value)}
          className="w-8 h-6 cursor-pointer border-0"
        />
        <span className="text-[10px] text-muted-foreground font-mono">
          ({value.r}, {value.g}, {value.b})
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 flex flex-col bg-ide-background">
        <DialogHeader className="px-4 py-2 border-b border-border bg-ide-tab">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <PenTool className="w-4 h-4 text-ps2-purple" />
                PS2 Visual UI Builder
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] border-ps2-cyan text-ps2-cyan">
                {PS2_WIDTH}x{PS2_HEIGHT}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {components.length} componentes
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className="h-7 px-2 text-xs"
              >
                <Grid3X3 className="w-3.5 h-3.5 mr-1" />
                Grid
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGridSnap(!gridSnap)}
                className={`h-7 px-2 text-xs ${gridSnap ? 'bg-ps2-purple/20' : ''}`}
              >
                Snap: {gridSnap ? 'ON' : 'OFF'}
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant={showCode ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowCode(!showCode)}
                className="h-7 px-3 text-xs"
              >
                <Code className="w-3.5 h-3.5 mr-1" />
                Código
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onGenerateCode(generateFullCode());
                  onOpenChange(false);
                }}
                className="h-7 px-3 text-xs bg-ps2-green hover:bg-ps2-green/80"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Aplicar Código
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Component Palette */}
          <div className="w-56 border-r border-border bg-ide-tab flex flex-col">
            <div className="p-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground">COMPONENTES</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-3">
                {categories.map(category => (
                  <div key={category}>
                    <span className="text-[10px] font-semibold text-ps2-cyan uppercase tracking-wide">
                      {category}
                    </span>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {componentTemplates
                        .filter(t => t.category === category)
                        .map(template => (
                          <Button
                            key={template.type}
                            variant="ghost"
                            size="sm"
                            className="h-auto py-2 px-2 flex flex-col items-center gap-1 hover:bg-ps2-purple/20"
                            onClick={() => handleAddComponent(template)}
                          >
                            {template.icon}
                            <span className="text-[9px] leading-tight">{template.name}</span>
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1a1a2e]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-ide-tab">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleDelete}
                disabled={!selectedId}
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleDuplicate}
                disabled={!selectedId}
                title="Duplicar"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleMoveLayer('up')}
                disabled={!selectedId}
                title="Subir capa"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleMoveLayer('down')}
                disabled={!selectedId}
                title="Bajar capa"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <span className="text-xs text-muted-foreground">Zoom:</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>-</Button>
              <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>+</Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setZoom(1)}>Reset</Button>
              
              {selectedComponent && (
                <>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="text-xs text-muted-foreground">
                    {selectedComponent.name}: ({selectedComponent.x}, {selectedComponent.y}) {selectedComponent.width}x{selectedComponent.height}
                  </span>
                </>
              )}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <div 
                ref={canvasRef}
                className="relative bg-[#14142a] shadow-2xl"
                style={{ 
                  width: PS2_WIDTH * zoom, 
                  height: PS2_HEIGHT * zoom,
                  backgroundImage: showGrid ? `
                    linear-gradient(to right, rgba(100,100,150,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(100,100,150,0.1) 1px, transparent 1px)
                  ` : 'none',
                  backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`
                }}
                onClick={() => setSelectedId(null)}
              >
                {/* Safe area guides */}
                <div 
                  className="absolute border border-dashed border-yellow-500/30 pointer-events-none"
                  style={{
                    left: 32 * zoom,
                    top: 32 * zoom,
                    right: 32 * zoom,
                    bottom: 32 * zoom
                  }}
                />
                
                {/* Components */}
                {components.map(comp => comp.visible && renderComponent(comp))}
                
                {/* Resolution indicator */}
                <div className="absolute bottom-1 right-1 text-[10px] text-white/30 pointer-events-none">
                  {PS2_WIDTH}x{PS2_HEIGHT}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Properties / Code */}
          <div className="w-72 border-l border-border bg-ide-tab flex flex-col">
            <Tabs defaultValue="properties" className="flex-1 flex flex-col">
              <TabsList className="w-full rounded-none border-b border-border bg-transparent h-9">
                <TabsTrigger value="properties" className="text-xs flex-1">
                  <Settings className="w-3 h-3 mr-1" />
                  Propiedades
                </TabsTrigger>
                <TabsTrigger value="layers" className="text-xs flex-1">
                  <Layers className="w-3 h-3 mr-1" />
                  Capas
                </TabsTrigger>
                {showCode && (
                  <TabsTrigger value="code" className="text-xs flex-1">
                    <Code className="w-3 h-3 mr-1" />
                    Código
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="properties" className="flex-1 overflow-auto m-0 p-0">
                {selectedComponent ? (
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-4">
                      {/* Basic properties */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-semibold text-ps2-cyan uppercase">General</span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs w-16">Nombre</Label>
                            <Input
                              value={selectedComponent.name}
                              onChange={(e) => setComponents(prev => prev.map(c => 
                                c.id === selectedId ? { ...c, name: e.target.value } : c
                              ))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs w-16">Tipo</Label>
                            <Badge variant="outline" className="text-[10px]">{selectedComponent.type}</Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Position */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-semibold text-ps2-cyan uppercase">Posición</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px]">X</Label>
                            <Input
                              type="number"
                              value={selectedComponent.x}
                              onChange={(e) => setComponents(prev => prev.map(c => 
                                c.id === selectedId ? { ...c, x: parseInt(e.target.value) || 0 } : c
                              ))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Y</Label>
                            <Input
                              type="number"
                              value={selectedComponent.y}
                              onChange={(e) => setComponents(prev => prev.map(c => 
                                c.id === selectedId ? { ...c, y: parseInt(e.target.value) || 0 } : c
                              ))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Ancho</Label>
                            <Input
                              type="number"
                              value={selectedComponent.width}
                              onChange={(e) => setComponents(prev => prev.map(c => 
                                c.id === selectedId ? { ...c, width: parseInt(e.target.value) || 20 } : c
                              ))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Alto</Label>
                            <Input
                              type="number"
                              value={selectedComponent.height}
                              onChange={(e) => setComponents(prev => prev.map(c => 
                                c.id === selectedId ? { ...c, height: parseInt(e.target.value) || 20 } : c
                              ))}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Component-specific properties */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-semibold text-ps2-cyan uppercase">Propiedades</span>
                        <div className="space-y-2">
                          {Object.entries(selectedComponent.props).map(([key, value]) => {
                            if (typeof value === 'object' && 'r' in value) {
                              return (
                                <ColorInput
                                  key={key}
                                  label={key}
                                  value={value as { r: number; g: number; b: number; a: number }}
                                  onChange={(color) => updateComponentProp(key, color)}
                                />
                              );
                            }
                            if (typeof value === 'boolean') {
                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => updateComponentProp(key, e.target.checked)}
                                    className="w-4 h-4"
                                  />
                                  <Label className="text-xs">{key}</Label>
                                </div>
                              );
                            }
                            if (typeof value === 'number') {
                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <Label className="text-xs w-20">{key}</Label>
                                  <Input
                                    type="number"
                                    value={value}
                                    onChange={(e) => updateComponentProp(key, parseFloat(e.target.value) || 0)}
                                    className="h-7 text-xs flex-1"
                                  />
                                </div>
                              );
                            }
                            if (typeof value === 'string') {
                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <Label className="text-xs w-20">{key}</Label>
                                  <Input
                                    value={value}
                                    onChange={(e) => updateComponentProp(key, e.target.value)}
                                    className="h-7 text-xs flex-1"
                                  />
                                </div>
                              );
                            }
                            if (Array.isArray(value)) {
                              return (
                                <div key={key} className="space-y-1">
                                  <Label className="text-xs">{key}</Label>
                                  <textarea
                                    value={value.join('\n')}
                                    onChange={(e) => updateComponentProp(key, e.target.value.split('\n'))}
                                    className="w-full h-20 text-xs p-2 bg-background border rounded"
                                  />
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Visibility controls */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-semibold text-ps2-cyan uppercase">Opciones</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedComponent.visible}
                            onChange={(e) => setComponents(prev => prev.map(c => 
                              c.id === selectedId ? { ...c, visible: e.target.checked } : c
                            ))}
                            className="w-4 h-4"
                          />
                          <Label className="text-xs">Visible</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedComponent.locked}
                            onChange={(e) => setComponents(prev => prev.map(c => 
                              c.id === selectedId ? { ...c, locked: e.target.checked } : c
                            ))}
                            className="w-4 h-4"
                          />
                          <Label className="text-xs">Bloqueado</Label>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-xs">
                    Selecciona un componente para editar sus propiedades
                  </div>
                )}
              </TabsContent>

              <TabsContent value="layers" className="flex-1 overflow-auto m-0 p-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {[...components].reverse().map((comp, idx) => (
                      <div
                        key={comp.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent ${
                          comp.id === selectedId ? 'bg-ps2-purple/20 border border-ps2-purple/50' : ''
                        }`}
                        onClick={() => setSelectedId(comp.id)}
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground" />
                        {componentTemplates.find(t => t.type === comp.type)?.icon}
                        <span className="text-xs flex-1 truncate">{comp.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setComponents(prev => prev.map(c => 
                              c.id === comp.id ? { ...c, visible: !c.visible } : c
                            ));
                          }}
                        >
                          {comp.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                        </Button>
                      </div>
                    ))}
                    {components.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground text-xs">
                        Arrastra componentes desde la paleta izquierda
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {showCode && (
                <TabsContent value="code" className="flex-1 overflow-auto m-0 p-0">
                  <ScrollArea className="h-full">
                    <pre className="p-3 text-[10px] font-mono text-ps2-cyan whitespace-pre-wrap">
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
