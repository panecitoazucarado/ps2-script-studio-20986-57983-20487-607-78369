// PS2 Visual Builder - Layout Templates
// Containers, panels, headers, footers

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const layoutTemplates: ComponentTemplate[] = [
  // Header
  {
    type: 'header',
    name: 'Encabezado',
    description: 'Barra superior de navegación',
    icon: 'PanelTop',
    category: 'layout',
    tags: ['header', 'encabezado', 'nav', 'top'],
    defaultWidth: 600,
    defaultHeight: 44,
    defaultProps: {
      title: 'Mi Aplicación PS2',
      bgColor: defaultColor(0, 50, 100, 255),
      textColor: defaultColor(255, 255, 255, 128),
      showDivider: true,
      dividerColor: defaultColor(0, 150, 255, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Header Component
Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});
${comp.props.showDivider ? `Draw.rect(${comp.x}, ${comp.y + comp.height - 2}, ${comp.width}, 2, ${colorToAthena(comp.props.dividerColor)});` : ''}
font.color = ${colorToAthena(comp.props.textColor)};
font.scale = 1.25;
font.print(${comp.x + 16}, ${comp.y + 12}, "${comp.props.title}");`
  },

  // Footer
  {
    type: 'footer',
    name: 'Pie de Página',
    description: 'Barra inferior con controles/info',
    icon: 'PanelBottom',
    category: 'layout',
    tags: ['footer', 'pie', 'bottom', 'controls'],
    defaultWidth: 600,
    defaultHeight: 36,
    defaultProps: {
      text: '© 2025 - Presiona START para continuar',
      bgColor: defaultColor(20, 20, 40, 255),
      textColor: defaultColor(150, 150, 170, 128),
      showDivider: true,
      dividerColor: defaultColor(60, 60, 100, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Footer Component
${comp.props.showDivider ? `Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, 1, ${colorToAthena(comp.props.dividerColor)});` : ''}
Draw.rect(${comp.x}, ${comp.y + 1}, ${comp.width}, ${comp.height - 1}, ${colorToAthena(comp.props.bgColor)});
font.color = ${colorToAthena(comp.props.textColor)};
font.scale = 0.8;
font.print(${comp.x + 12}, ${comp.y + 10}, "${comp.props.text}");`
  },

  // Panel/Card
  {
    type: 'panel',
    name: 'Panel',
    description: 'Contenedor con borde y título',
    icon: 'PanelTopClose',
    category: 'layout',
    tags: ['panel', 'card', 'container', 'box'],
    defaultWidth: 280,
    defaultHeight: 180,
    defaultProps: {
      title: 'Panel',
      bgColor: defaultColor(25, 25, 45, 230),
      borderColor: defaultColor(60, 80, 140, 255),
      titleBgColor: defaultColor(40, 60, 100, 255),
      titleColor: defaultColor(200, 220, 255, 128),
      showTitle: true,
      titleHeight: 28
    },
    codeGenerator: (comp: PS2Component) => {
      const th = comp.props.showTitle ? comp.props.titleHeight : 0;
      return `// Panel Component
// Background
Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});
${comp.props.showTitle ? `// Title bar
Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${th}, ${colorToAthena(comp.props.titleBgColor)});
font.color = ${colorToAthena(comp.props.titleColor)};
font.scale = 0.9;
font.print(${comp.x + 10}, ${comp.y + 6}, "${comp.props.title}");` : ''}
// Border
Draw.line(${comp.x}, ${comp.y}, ${comp.x + comp.width}, ${comp.y}, ${colorToAthena(comp.props.borderColor)});
Draw.line(${comp.x + comp.width}, ${comp.y}, ${comp.x + comp.width}, ${comp.y + comp.height}, ${colorToAthena(comp.props.borderColor)});
Draw.line(${comp.x + comp.width}, ${comp.y + comp.height}, ${comp.x}, ${comp.y + comp.height}, ${colorToAthena(comp.props.borderColor)});
Draw.line(${comp.x}, ${comp.y + comp.height}, ${comp.x}, ${comp.y}, ${colorToAthena(comp.props.borderColor)});`;
    }
  },

  // Dialog/Modal
  {
    type: 'dialog',
    name: 'Diálogo',
    description: 'Ventana modal centrada',
    icon: 'MessageSquare',
    category: 'layout',
    tags: ['dialog', 'modal', 'popup', 'window'],
    defaultWidth: 320,
    defaultHeight: 200,
    defaultProps: {
      title: 'Confirmación',
      message: '¿Desea continuar?',
      bgColor: defaultColor(30, 30, 55, 250),
      borderColor: defaultColor(80, 100, 180, 255),
      titleColor: defaultColor(255, 255, 255, 128),
      messageColor: defaultColor(200, 200, 220, 128),
      overlayOpacity: 180
    },
    codeGenerator: (comp: PS2Component) => `// Dialog Component
// Overlay (optional)
Draw.rect(0, 0, Screen.getMode().width, Screen.getMode().height, Color.new(0, 0, 0, ${comp.props.overlayOpacity}));

// Dialog box
const dlgX_${comp.id.slice(0, 4)} = ${comp.x}, dlgY_${comp.id.slice(0, 4)} = ${comp.y};
const dlgW_${comp.id.slice(0, 4)} = ${comp.width}, dlgH_${comp.id.slice(0, 4)} = ${comp.height};

Draw.rect(dlgX_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)}, dlgW_${comp.id.slice(0, 4)}, dlgH_${comp.id.slice(0, 4)}, ${colorToAthena(comp.props.bgColor)});

// Title bar
Draw.rect(dlgX_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)}, dlgW_${comp.id.slice(0, 4)}, 32, Color.new(50, 60, 90, 255));
font.color = ${colorToAthena(comp.props.titleColor)};
font.scale = 1.0;
font.print(dlgX_${comp.id.slice(0, 4)} + 12, dlgY_${comp.id.slice(0, 4)} + 8, "${comp.props.title}");

// Message
font.color = ${colorToAthena(comp.props.messageColor)};
font.scale = 0.9;
font.print(dlgX_${comp.id.slice(0, 4)} + 16, dlgY_${comp.id.slice(0, 4)} + 50, "${comp.props.message}");

// Border
Draw.line(dlgX_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)}, dlgX_${comp.id.slice(0, 4)} + dlgW_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)}, ${colorToAthena(comp.props.borderColor)});
Draw.line(dlgX_${comp.id.slice(0, 4)} + dlgW_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)}, dlgX_${comp.id.slice(0, 4)} + dlgW_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)} + dlgH_${comp.id.slice(0, 4)}, ${colorToAthena(comp.props.borderColor)});
Draw.line(dlgX_${comp.id.slice(0, 4)} + dlgW_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)} + dlgH_${comp.id.slice(0, 4)}, dlgX_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)} + dlgH_${comp.id.slice(0, 4)}, ${colorToAthena(comp.props.borderColor)});
Draw.line(dlgX_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)} + dlgH_${comp.id.slice(0, 4)}, dlgX_${comp.id.slice(0, 4)}, dlgY_${comp.id.slice(0, 4)}, ${colorToAthena(comp.props.borderColor)});`
  },

  // Sidebar
  {
    type: 'sidebar',
    name: 'Barra Lateral',
    description: 'Panel lateral de navegación',
    icon: 'PanelLeft',
    category: 'layout',
    tags: ['sidebar', 'lateral', 'menu', 'nav'],
    defaultWidth: 180,
    defaultHeight: 400,
    defaultProps: {
      bgColor: defaultColor(20, 25, 45, 255),
      borderColor: defaultColor(50, 60, 100, 255),
      position: 'left'
    },
    codeGenerator: (comp: PS2Component) => `// Sidebar Component
Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});
// Right border
Draw.line(${comp.x + comp.width}, ${comp.y}, ${comp.x + comp.width}, ${comp.y + comp.height}, ${colorToAthena(comp.props.borderColor)});`
  },

  // Divider/Separator
  {
    type: 'divider',
    name: 'Separador',
    description: 'Línea divisoria horizontal/vertical',
    icon: 'SeparatorHorizontal',
    category: 'layout',
    tags: ['divider', 'separator', 'line', 'hr'],
    defaultWidth: 200,
    defaultHeight: 2,
    defaultProps: {
      color: defaultColor(80, 80, 120, 255),
      orientation: 'horizontal'
    },
    codeGenerator: (comp: PS2Component) => {
      if (comp.props.orientation === 'horizontal') {
        return `Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.color)});`;
      }
      return `Draw.rect(${comp.x}, ${comp.y}, ${comp.height}, ${comp.width}, ${colorToAthena(comp.props.color)});`;
    }
  },

  // Spacer
  {
    type: 'spacer',
    name: 'Espaciador',
    description: 'Espacio invisible para layout',
    icon: 'Space',
    category: 'layout',
    tags: ['spacer', 'space', 'margin', 'padding'],
    defaultWidth: 100,
    defaultHeight: 50,
    defaultProps: {},
    codeGenerator: () => `// Spacer (invisible layout element)`
  }
];
