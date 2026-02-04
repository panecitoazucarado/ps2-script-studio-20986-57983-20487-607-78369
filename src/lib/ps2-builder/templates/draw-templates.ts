// PS2 Visual Builder - Draw Module Templates
// Based on AthenaEnv Draw module documentation

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const drawTemplates: ComponentTemplate[] = [
  // Point
  {
    type: 'point',
    name: 'Punto',
    description: 'Dibuja un pixel en pantalla',
    icon: 'Circle',
    category: 'draw',
    tags: ['pixel', 'punto', 'draw'],
    defaultWidth: 8,
    defaultHeight: 8,
    defaultProps: {
      color: defaultColor(255, 255, 255, 255)
    },
    codeGenerator: (comp: PS2Component) => 
      `Draw.point(${comp.x + 4}, ${comp.y + 4}, ${colorToAthena(comp.props.color)});`
  },

  // Line
  {
    type: 'line',
    name: 'Línea',
    description: 'Línea entre dos puntos',
    icon: 'Minus',
    category: 'draw',
    tags: ['linea', 'line', 'draw'],
    defaultWidth: 100,
    defaultHeight: 4,
    defaultProps: {
      color: defaultColor(255, 255, 255, 255),
      diagonal: false
    },
    codeGenerator: (comp: PS2Component) => {
      const x2 = comp.x + comp.width;
      const y2 = comp.props.diagonal ? comp.y + comp.height : comp.y;
      return `Draw.line(${comp.x}, ${comp.y}, ${x2}, ${y2}, ${colorToAthena(comp.props.color)});`;
    }
  },

  // Rectangle
  {
    type: 'rect',
    name: 'Rectángulo',
    description: 'Rectángulo sólido o con borde',
    icon: 'Square',
    category: 'draw',
    tags: ['rect', 'rectangulo', 'cuadrado', 'draw'],
    defaultWidth: 120,
    defaultHeight: 80,
    defaultProps: {
      fillColor: defaultColor(60, 80, 140, 255),
      hasBorder: true,
      borderColor: defaultColor(100, 120, 200, 255),
      borderWidth: 2
    },
    codeGenerator: (comp: PS2Component) => {
      let code = `Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.fillColor)});`;
      if (comp.props.hasBorder) {
        const bc = colorToAthena(comp.props.borderColor);
        code += `\n// Border lines
Draw.line(${comp.x}, ${comp.y}, ${comp.x + comp.width}, ${comp.y}, ${bc});
Draw.line(${comp.x + comp.width}, ${comp.y}, ${comp.x + comp.width}, ${comp.y + comp.height}, ${bc});
Draw.line(${comp.x + comp.width}, ${comp.y + comp.height}, ${comp.x}, ${comp.y + comp.height}, ${bc});
Draw.line(${comp.x}, ${comp.y + comp.height}, ${comp.x}, ${comp.y}, ${bc});`;
      }
      return code;
    }
  },

  // Circle - Enhanced with full properties
  {
    type: 'circle',
    name: 'Círculo',
    description: 'Círculo con opciones avanzadas de renderizado PS2',
    icon: 'Circle',
    category: 'draw',
    tags: ['circulo', 'circle', 'draw', 'forma', 'shape'],
    defaultWidth: 80,
    defaultHeight: 80,
    defaultProps: {
      fillColor: defaultColor(200, 100, 100, 255),
      filled: true,
      // Border properties
      hasBorder: false,
      borderColor: defaultColor(255, 255, 255, 255),
      borderWidth: 2,
      // Advanced properties
      segments: 32, // Number of segments for circle smoothness (PS2 specific)
      antialiased: true,
      // Transform
      scaleX: 1.0,
      scaleY: 1.0,
      // Aspect ratio lock
      keepAspectRatio: true
    },
    codeGenerator: (comp: PS2Component) => {
      const p = comp.props;
      // Calculate radius based on dimensions and scale
      const baseRadius = Math.floor(Math.min(comp.width, comp.height) / 2);
      const cx = comp.x + Math.floor(comp.width / 2);
      const cy = comp.y + Math.floor(comp.height / 2);
      
      let code = '';
      
      // Main circle
      if (p.filled) {
        code = `Draw.circle(${cx}, ${cy}, ${baseRadius}, ${colorToAthena(p.fillColor)}, true);`;
      } else {
        code = `Draw.circle(${cx}, ${cy}, ${baseRadius}, ${colorToAthena(p.fillColor)}, false);`;
      }
      
      // Border/outline if enabled
      if (p.hasBorder && p.borderWidth > 0) {
        code += `\n// Circle border`;
        code += `\nDraw.circle(${cx}, ${cy}, ${baseRadius}, ${colorToAthena(p.borderColor)}, false);`;
        if (p.borderWidth > 1) {
          code += `\nDraw.circle(${cx}, ${cy}, ${baseRadius - 1}, ${colorToAthena(p.borderColor)}, false);`;
        }
      }
      
      return code;
    }
  },

  // Triangle (flat color)
  {
    type: 'triangle',
    name: 'Triángulo',
    description: 'Triángulo con colores por vértice (Gouraud)',
    icon: 'Triangle',
    category: 'draw',
    tags: ['triangulo', 'triangle', 'gouraud', 'draw'],
    defaultWidth: 100,
    defaultHeight: 86,
    defaultProps: {
      color1: defaultColor(255, 0, 0, 255),
      color2: defaultColor(0, 255, 0, 255),
      color3: defaultColor(0, 0, 255, 255),
      gouraud: true
    },
    codeGenerator: (comp: PS2Component) => {
      const x1 = comp.x + Math.floor(comp.width / 2);
      const y1 = comp.y;
      const x2 = comp.x;
      const y2 = comp.y + comp.height;
      const x3 = comp.x + comp.width;
      const y3 = comp.y + comp.height;
      
      if (comp.props.gouraud) {
        return `Draw.triangle(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3}, ${colorToAthena(comp.props.color1)}, ${colorToAthena(comp.props.color2)}, ${colorToAthena(comp.props.color3)});`;
      }
      return `Draw.triangle(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3}, ${colorToAthena(comp.props.color1)});`;
    }
  },

  // Quad (flat/gouraud)
  {
    type: 'quad',
    name: 'Cuadrilátero',
    description: 'Quad con 4 colores para sombreado Gouraud',
    icon: 'Square',
    category: 'draw',
    subcategory: 'Avanzado',
    tags: ['quad', 'cuadrilatero', 'gouraud', 'draw'],
    defaultWidth: 120,
    defaultHeight: 100,
    defaultProps: {
      color1: defaultColor(255, 100, 100, 255),
      color2: defaultColor(100, 255, 100, 255),
      color3: defaultColor(100, 100, 255, 255),
      color4: defaultColor(255, 255, 100, 255),
      gouraud: true
    },
    codeGenerator: (comp: PS2Component) => {
      const x1 = comp.x, y1 = comp.y;
      const x2 = comp.x + comp.width, y2 = comp.y;
      const x3 = comp.x + comp.width, y3 = comp.y + comp.height;
      const x4 = comp.x, y4 = comp.y + comp.height;
      
      if (comp.props.gouraud) {
        return `Draw.quad(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3}, ${x4}, ${y4}, ${colorToAthena(comp.props.color1)}, ${colorToAthena(comp.props.color2)}, ${colorToAthena(comp.props.color3)}, ${colorToAthena(comp.props.color4)});`;
      }
      return `Draw.quad(${x1}, ${y1}, ${x2}, ${y2}, ${x3}, ${y3}, ${x4}, ${y4}, ${colorToAthena(comp.props.color1)});`;
    }
  }
];
