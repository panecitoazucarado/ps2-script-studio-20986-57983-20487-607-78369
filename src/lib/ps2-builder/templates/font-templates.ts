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
font.scale = ${comp.props.scale.toFixed(2)};
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
      shadowOffset: 2
    },
    codeGenerator: (comp: PS2Component) => `// Title with Shadow
// Shadow
font.color = Color.new(0, 0, 0, 128);
font.scale = ${comp.props.scale.toFixed(2)};
font.print(${comp.x + comp.props.shadowOffset}, ${comp.y + comp.props.shadowOffset}, "${comp.props.text}");
// Main text
font.color = ${colorToAthena(comp.props.color)};
font.print(${comp.x}, ${comp.y}, "${comp.props.text}");`
  },

  // Outlined Text (simulated with multiple prints)
  {
    type: 'outline-text',
    name: 'Texto con Borde',
    description: 'Texto con outline/contorno simulado',
    icon: 'Type',
    category: 'font',
    subcategory: 'Estilos',
    tags: ['outline', 'border', 'contorno', 'font'],
    defaultWidth: 250,
    defaultHeight: 32,
    defaultProps: {
      text: 'TEXTO CONTORNEADO',
      color: defaultColor(255, 255, 0, 128),
      outlineColor: defaultColor(0, 0, 0, 128),
      scale: 1.5
    },
    codeGenerator: (comp: PS2Component) => `// Outlined Text (simulated)
font.scale = ${comp.props.scale.toFixed(2)};
font.color = ${colorToAthena(comp.props.outlineColor)};
// Outline passes
font.print(${comp.x - 1}, ${comp.y}, "${comp.props.text}");
font.print(${comp.x + 1}, ${comp.y}, "${comp.props.text}");
font.print(${comp.x}, ${comp.y - 1}, "${comp.props.text}");
font.print(${comp.x}, ${comp.y + 1}, "${comp.props.text}");
// Main text
font.color = ${colorToAthena(comp.props.color)};
font.print(${comp.x}, ${comp.y}, "${comp.props.text}");`
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
font.scale = ${comp.props.scale.toFixed(2)};
const textWidth_${comp.id.slice(0, 4)} = font.getTextSize("${comp.props.text}").width;
const centerX_${comp.id.slice(0, 4)} = ${comp.x} + (${comp.props.containerWidth} - textWidth_${comp.id.slice(0, 4)}) / 2;
font.print(centerX_${comp.id.slice(0, 4)}, ${comp.y}, "${comp.props.text}");`
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
font.scale = ${comp.props.scale.toFixed(3)};
Screen.setFrameCounter(true);
const fps_${comp.id.slice(0, 4)} = Screen.getFPS(1000);
font.print(${comp.x}, ${comp.y}, ${comp.props.showLabel ? '"FPS: " + ' : ''}fps_${comp.id.slice(0, 4)}.toFixed(1));`
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
      defaultValue: '0',
      color: defaultColor(255, 255, 255, 128),
      valueColor: defaultColor(255, 255, 0, 128),
      scale: 1.0
    },
    codeGenerator: (comp: PS2Component) => `// Dynamic Value Display
font.scale = ${comp.props.scale.toFixed(2)};
font.color = ${colorToAthena(comp.props.color)};
font.print(${comp.x}, ${comp.y}, "${comp.props.label}");
const labelW_${comp.id.slice(0, 4)} = font.getTextSize("${comp.props.label}").width;
font.color = ${colorToAthena(comp.props.valueColor)};
font.print(${comp.x} + labelW_${comp.id.slice(0, 4)}, ${comp.y}, "${comp.props.defaultValue}");`
  }
];
