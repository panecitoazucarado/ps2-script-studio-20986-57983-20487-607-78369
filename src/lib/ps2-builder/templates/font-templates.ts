// PS2 Visual Builder - Font Module Templates
// Based on AthenaEnv Font module documentation

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const fontTemplates: ComponentTemplate[] = [
  // Basic Text
  {
    type: 'text',
    name: 'Texto',
    description: 'Texto simple con Font',
    icon: 'Type',
    category: 'font',
    tags: ['texto', 'text', 'font', 'label'],
    defaultWidth: 200,
    defaultHeight: 24,
    defaultProps: {
      text: 'Texto de ejemplo',
      color: defaultColor(255, 255, 255, 128),
      scale: 1.0,
      fontPath: 'default'
    },
    codeGenerator: (comp: PS2Component) => `// Text Label
font.color = ${colorToAthena(comp.props.color)};
font.scale = ${comp.props.scale.toFixed(2)}f;
font.print(${comp.x}, ${comp.y}, "${comp.props.text}");`
  },

  // Title with Shadow
  {
    type: 'title',
    name: 'Título',
    description: 'Título con sombra proyectada (dropshadow)',
    icon: 'Heading1',
    category: 'font',
    tags: ['titulo', 'title', 'header', 'shadow'],
    defaultWidth: 300,
    defaultHeight: 40,
    defaultProps: {
      text: 'TÍTULO PRINCIPAL',
      color: defaultColor(0, 255, 255, 128),
      scale: 1.75,
      dropshadow: 2.0,
      dropshadowColor: defaultColor(0, 0, 0, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Title with Dropshadow
font.color = ${colorToAthena(comp.props.color)};
font.scale = ${comp.props.scale.toFixed(2)}f;
font.dropshadow = ${comp.props.dropshadow.toFixed(1)}f;
font.dropshadow_color = ${colorToAthena(comp.props.dropshadowColor)};
font.print(${comp.x}, ${comp.y}, "${comp.props.text}");
font.dropshadow = 0.0f; // Reset`
  },

  // Outlined Text
  {
    type: 'outline-text',
    name: 'Texto con Borde',
    description: 'Texto con outline/contorno',
    icon: 'Type',
    category: 'font',
    subcategory: 'Estilos',
    tags: ['outline', 'border', 'contorno', 'font'],
    defaultWidth: 250,
    defaultHeight: 32,
    defaultProps: {
      text: 'TEXTO CONTORNEADO',
      color: defaultColor(255, 255, 0, 128),
      scale: 1.5,
      outline: 1.5,
      outlineColor: defaultColor(0, 0, 0, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Outlined Text
font.color = ${colorToAthena(comp.props.color)};
font.scale = ${comp.props.scale.toFixed(2)}f;
font.outline = ${comp.props.outline.toFixed(1)}f;
font.outline_color = ${colorToAthena(comp.props.outlineColor)};
font.print(${comp.x}, ${comp.y}, "${comp.props.text}");
font.outline = 0.0f; // Reset`
  },

  // Aligned Text (Center)
  {
    type: 'centered-text',
    name: 'Texto Centrado',
    description: 'Texto con alineación central',
    icon: 'AlignCenter',
    category: 'font',
    subcategory: 'Alineación',
    tags: ['center', 'centrado', 'align', 'font'],
    defaultWidth: 300,
    defaultHeight: 28,
    defaultProps: {
      text: 'Texto Centrado',
      color: defaultColor(255, 255, 255, 128),
      scale: 1.25,
      containerWidth: 300
    },
    codeGenerator: (comp: PS2Component) => `// Centered Text
font.color = ${colorToAthena(comp.props.color)};
font.scale = ${comp.props.scale.toFixed(2)}f;
font.align = Font.ALIGN_CENTER;
font.print(${comp.x}, ${comp.y}, "${comp.props.text}");
font.align = Font.ALIGN_NONE; // Reset`
  },

  // FPS Counter
  {
    type: 'fps-counter',
    name: 'Contador FPS',
    description: 'Muestra frames por segundo',
    icon: 'Gauge',
    category: 'font',
    subcategory: 'Debug',
    tags: ['fps', 'counter', 'debug', 'performance'],
    defaultWidth: 80,
    defaultHeight: 20,
    defaultProps: {
      color: defaultColor(0, 255, 0, 128),
      scale: 0.875,
      showLabel: true
    },
    codeGenerator: (comp: PS2Component) => `// FPS Counter
font.color = ${colorToAthena(comp.props.color)};
font.scale = ${comp.props.scale.toFixed(3)}f;
const fps = Screen.getFPS(1000);
font.print(${comp.x}, ${comp.y}, ${comp.props.showLabel ? '"FPS: " + ' : ''}fps.toFixed(1));`
  },

  // Dynamic Value Display
  {
    type: 'value-display',
    name: 'Valor Dinámico',
    description: 'Muestra un valor con etiqueta',
    icon: 'Hash',
    category: 'font',
    subcategory: 'Datos',
    tags: ['value', 'data', 'display', 'variable'],
    defaultWidth: 150,
    defaultHeight: 24,
    defaultProps: {
      label: 'Score: ',
      variableName: 'playerScore',
      color: defaultColor(255, 255, 255, 128),
      valueColor: defaultColor(255, 255, 0, 128),
      scale: 1.0
    },
    codeGenerator: (comp: PS2Component) => `// Dynamic Value Display
font.scale = ${comp.props.scale.toFixed(2)}f;
font.color = ${colorToAthena(comp.props.color)};
font.print(${comp.x}, ${comp.y}, "${comp.props.label}");
const labelWidth_${comp.id.slice(0, 4)} = font.getTextSize("${comp.props.label}").width;
font.color = ${colorToAthena(comp.props.valueColor)};
font.print(${comp.x} + labelWidth_${comp.id.slice(0, 4)}, ${comp.y}, String(${comp.props.variableName}));`
  }
];
