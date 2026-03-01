// PS2 Visual Builder - Scroll Templates
// Advanced scrollable containers for web-like content on real PS2 hardware
// Uses viewport culling: only renders blocks visible within the scroll viewport

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const scrollTemplates: ComponentTemplate[] = [
  // ── ScrollView Container ──
  {
    type: 'scrollview',
    name: 'ScrollView',
    description: 'Contenedor con scroll vertical (Pad ↑↓)',
    icon: 'Rows3',
    category: 'scroll',
    tags: ['scroll', 'scrollview', 'web', 'newspaper', 'diario', 'wiki', 'pagina'],
    defaultWidth: 580,
    defaultHeight: 380,
    defaultProps: {
      scrollSpeed: 4,
      contentHeight: 1200,
      bgColor: defaultColor(12, 12, 28, 255),
      borderColor: defaultColor(50, 60, 100, 200),
      showScrollbar: true,
      scrollbarColor: defaultColor(80, 120, 200, 180),
      scrollbarTrackColor: defaultColor(30, 30, 50, 120),
      scrollbarWidth: 6,
      clipContent: true,
    },
    codeGenerator: (comp: PS2Component) => {
      const id = comp.id.slice(0, 5);
      return `// ═══ ScrollView: Viewport-Culled Scrollable Container ═══
// This generates a scrollable area controlled by Pad UP/DOWN.
// Only content blocks whose Y falls inside the viewport are drawn.
// Perfect for newspapers, wikis, and long-form content on PS2.

let scrollY_${id} = 0;
const scrollSpeed_${id} = ${comp.props.scrollSpeed};
const viewportX_${id} = ${comp.x};
const viewportY_${id} = ${comp.y};
const viewportW_${id} = ${comp.width};
const viewportH_${id} = ${comp.height};
const contentH_${id} = ${comp.props.contentHeight};
const scrollbarW_${id} = ${comp.props.scrollbarWidth};

// Content blocks array — add your blocks here
// Each block: { y, h, draw(offsetY) }
const blocks_${id} = [];

function scrollUpdate_${id}(pad) {
  if (pad.pressed(Pads.UP))   scrollY_${id} = Math.max(0, scrollY_${id} - scrollSpeed_${id});
  if (pad.pressed(Pads.DOWN)) scrollY_${id} = Math.min(contentH_${id} - viewportH_${id}, scrollY_${id} + scrollSpeed_${id});
}

function scrollRender_${id}() {
  // Background
  Draw.rect(viewportX_${id}, viewportY_${id}, viewportW_${id}, viewportH_${id}, ${colorToAthena(comp.props.bgColor)});

  // Viewport-culled rendering: only draw blocks in view
  for (let i = 0; i < blocks_${id}.length; i++) {
    const blk = blocks_${id}[i];
    const screenY = blk.y - scrollY_${id} + viewportY_${id};
    // Skip if block is fully above or below the viewport
    if (screenY + blk.h < viewportY_${id} || screenY > viewportY_${id} + viewportH_${id}) continue;
    blk.draw(screenY);
  }
${comp.props.showScrollbar ? `
  // Scrollbar track
  const sbX_${id} = viewportX_${id} + viewportW_${id} - scrollbarW_${id} - 2;
  Draw.rect(sbX_${id}, viewportY_${id}, scrollbarW_${id}, viewportH_${id}, ${colorToAthena(comp.props.scrollbarTrackColor)});
  // Scrollbar thumb
  const thumbH_${id} = Math.max(20, (viewportH_${id} / contentH_${id}) * viewportH_${id});
  const thumbY_${id} = viewportY_${id} + (scrollY_${id} / (contentH_${id} - viewportH_${id})) * (viewportH_${id} - thumbH_${id});
  Draw.rect(sbX_${id}, thumbY_${id}, scrollbarW_${id}, thumbH_${id}, ${colorToAthena(comp.props.scrollbarColor)});` : ''}

  // Border
  Draw.line(viewportX_${id}, viewportY_${id}, viewportX_${id} + viewportW_${id}, viewportY_${id}, ${colorToAthena(comp.props.borderColor)});
  Draw.line(viewportX_${id} + viewportW_${id}, viewportY_${id}, viewportX_${id} + viewportW_${id}, viewportY_${id} + viewportH_${id}, ${colorToAthena(comp.props.borderColor)});
  Draw.line(viewportX_${id} + viewportW_${id}, viewportY_${id} + viewportH_${id}, viewportX_${id}, viewportY_${id} + viewportH_${id}, ${colorToAthena(comp.props.borderColor)});
  Draw.line(viewportX_${id}, viewportY_${id} + viewportH_${id}, viewportX_${id}, viewportY_${id}, ${colorToAthena(comp.props.borderColor)});
}

// ── Usage in your main loop ──
// scrollUpdate_${id}(pad);
// scrollRender_${id}();
`;
    }
  },

  // ── Text Block (child of ScrollView) ──
  {
    type: 'scroll-textblock',
    name: 'Bloque de Texto',
    description: 'Párrafo para ScrollView con word-wrap',
    icon: 'FileText',
    category: 'scroll',
    tags: ['texto', 'parrafo', 'bloque', 'articulo', 'noticia', 'paragraph'],
    defaultWidth: 540,
    defaultHeight: 80,
    defaultProps: {
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      textColor: defaultColor(210, 210, 230, 128),
      fontSize: 0.85,
      lineHeight: 18,
      paddingX: 12,
      paddingY: 8,
      bgColor: defaultColor(0, 0, 0, 0),
    },
    codeGenerator: (comp: PS2Component) => {
      const id = comp.id.slice(0, 5);
      return `// ── ScrollView Text Block ──
// Add to your blocks array: blocks_XXXXX.push({ y: ${comp.y}, h: ${comp.height}, draw: drawTextBlock_${id} });
function drawTextBlock_${id}(screenY) {
  ${comp.props.bgColor.a > 0 ? `Draw.rect(${comp.x}, screenY, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});` : ''}
  font.color = ${colorToAthena(comp.props.textColor)};
  font.scale = ${comp.props.fontSize};
  // Word-wrap helper
  const fullText_${id} = "${comp.props.text.replace(/"/g, '\\"')}";
  const maxW_${id} = ${comp.width - comp.props.paddingX * 2};
  const words_${id} = fullText_${id}.split(" ");
  let line_${id} = "", ly_${id} = screenY + ${comp.props.paddingY};
  for (let i = 0; i < words_${id}.length; i++) {
    const test = line_${id} + (line_${id} ? " " : "") + words_${id}[i];
    const sz = font.getTextSize(test);
    if (sz.width > maxW_${id} && line_${id}) {
      font.print(${comp.x + comp.props.paddingX}, ly_${id}, line_${id});
      ly_${id} += ${comp.props.lineHeight};
      line_${id} = words_${id}[i];
    } else {
      line_${id} = test;
    }
  }
  if (line_${id}) font.print(${comp.x + comp.props.paddingX}, ly_${id}, line_${id});
}`;
    }
  },

  // ── Heading Block ──
  {
    type: 'scroll-heading',
    name: 'Título de Sección',
    description: 'Encabezado grande para secciones del scroll',
    icon: 'Heading1',
    category: 'scroll',
    tags: ['titulo', 'heading', 'seccion', 'h1', 'h2', 'cabecera'],
    defaultWidth: 540,
    defaultHeight: 40,
    defaultProps: {
      text: 'Título de Sección',
      textColor: defaultColor(255, 255, 255, 128),
      fontSize: 1.4,
      underline: true,
      underlineColor: defaultColor(60, 130, 255, 200),
      paddingX: 12,
      paddingY: 6,
    },
    codeGenerator: (comp: PS2Component) => {
      const id = comp.id.slice(0, 5);
      return `// ── ScrollView Heading ──
// blocks_XXXXX.push({ y: ${comp.y}, h: ${comp.height}, draw: drawHeading_${id} });
function drawHeading_${id}(screenY) {
  font.color = ${colorToAthena(comp.props.textColor)};
  font.scale = ${comp.props.fontSize};
  font.print(${comp.x + comp.props.paddingX}, screenY + ${comp.props.paddingY}, "${comp.props.text.replace(/"/g, '\\"')}");
  ${comp.props.underline ? `Draw.rect(${comp.x + comp.props.paddingX}, screenY + ${comp.height - 4}, ${comp.width - comp.props.paddingX * 2}, 2, ${colorToAthena(comp.props.underlineColor)});` : ''}
}`;
    }
  },

  // ── Image Block ──
  {
    type: 'scroll-imageblock',
    name: 'Bloque de Imagen',
    description: 'Imagen con título dentro del scroll',
    icon: 'ImagePlay',
    category: 'scroll',
    tags: ['imagen', 'foto', 'image', 'picture', 'media', 'galeria'],
    defaultWidth: 540,
    defaultHeight: 200,
    defaultProps: {
      imagePath: 'content/photo.png',
      caption: 'Descripción de la imagen',
      captionColor: defaultColor(170, 170, 190, 128),
      borderColor: defaultColor(50, 60, 90, 180),
      paddingX: 12,
      paddingY: 8,
      showCaption: true,
    },
    codeGenerator: (comp: PS2Component) => {
      const id = comp.id.slice(0, 5);
      return `// ── ScrollView Image Block ──
// blocks_XXXXX.push({ y: ${comp.y}, h: ${comp.height}, draw: drawImgBlock_${id} });
// const img_${id} = new Image("${comp.props.imagePath}");
function drawImgBlock_${id}(screenY) {
  // Draw image — adjust width/height to fit
  // img_${id}.width = ${comp.width - comp.props.paddingX * 2};
  // img_${id}.height = ${comp.height - (comp.props.showCaption ? 28 : 0) - comp.props.paddingY * 2};
  // img_${id}.draw(${comp.x + comp.props.paddingX}, screenY + ${comp.props.paddingY});
  
  // Placeholder rect (remove when using real image)
  Draw.rect(${comp.x + comp.props.paddingX}, screenY + ${comp.props.paddingY}, ${comp.width - comp.props.paddingX * 2}, ${comp.height - (comp.props.showCaption ? 28 : 0) - comp.props.paddingY * 2}, Color.new(40, 40, 60, 200));
${comp.props.showCaption ? `
  // Caption
  font.color = ${colorToAthena(comp.props.captionColor)};
  font.scale = 0.7;
  font.print(${comp.x + comp.props.paddingX}, screenY + ${comp.height - 22}, "${comp.props.caption.replace(/"/g, '\\"')}");` : ''}
}`;
    }
  },

  // ── News Card Block ──
  {
    type: 'scroll-newscard',
    name: 'Tarjeta de Noticia',
    description: 'Card estilo diario/periódico con título + resumen',
    icon: 'BadgeIcon',
    category: 'scroll',
    tags: ['noticia', 'news', 'card', 'diario', 'periodico', 'articulo'],
    defaultWidth: 540,
    defaultHeight: 120,
    defaultProps: {
      title: 'Última Hora: PS2 Homebrew',
      summary: 'La escena de desarrollo homebrew para PlayStation 2 sigue creciendo con nuevas herramientas y proyectos innovadores.',
      date: '01/03/2026',
      bgColor: defaultColor(20, 22, 40, 240),
      titleColor: defaultColor(100, 180, 255, 128),
      summaryColor: defaultColor(180, 180, 200, 128),
      dateColor: defaultColor(120, 120, 150, 128),
      accentColor: defaultColor(60, 130, 255, 255),
      paddingX: 14,
      paddingY: 10,
    },
    codeGenerator: (comp: PS2Component) => {
      const id = comp.id.slice(0, 5);
      return `// ── ScrollView News Card ──
// blocks_XXXXX.push({ y: ${comp.y}, h: ${comp.height}, draw: drawNews_${id} });
function drawNews_${id}(screenY) {
  // Card background
  Draw.rect(${comp.x}, screenY, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});
  // Accent strip
  Draw.rect(${comp.x}, screenY, 4, ${comp.height}, ${colorToAthena(comp.props.accentColor)});
  
  // Title
  font.color = ${colorToAthena(comp.props.titleColor)};
  font.scale = 1.0;
  font.print(${comp.x + comp.props.paddingX}, screenY + ${comp.props.paddingY}, "${comp.props.title.replace(/"/g, '\\"')}");
  
  // Summary with word-wrap
  font.color = ${colorToAthena(comp.props.summaryColor)};
  font.scale = 0.8;
  const sumText_${id} = "${comp.props.summary.replace(/"/g, '\\"')}";
  const sumWords_${id} = sumText_${id}.split(" ");
  let sLine_${id} = "", sY_${id} = screenY + ${comp.props.paddingY + 26};
  for (let i = 0; i < sumWords_${id}.length; i++) {
    const t = sLine_${id} + (sLine_${id} ? " " : "") + sumWords_${id}[i];
    const s = font.getTextSize(t);
    if (s.width > ${comp.width - comp.props.paddingX * 2 - 8} && sLine_${id}) {
      font.print(${comp.x + comp.props.paddingX}, sY_${id}, sLine_${id});
      sY_${id} += 16;
      sLine_${id} = sumWords_${id}[i];
    } else { sLine_${id} = t; }
  }
  if (sLine_${id}) font.print(${comp.x + comp.props.paddingX}, sY_${id}, sLine_${id});
  
  // Date
  font.color = ${colorToAthena(comp.props.dateColor)};
  font.scale = 0.65;
  font.print(${comp.x + comp.props.paddingX}, screenY + ${comp.height - 18}, "${comp.props.date}");
}`;
    }
  },

  // ── Scroll Divider ──
  {
    type: 'scroll-divider',
    name: 'Divisor de Scroll',
    description: 'Línea separadora dentro del scroll',
    icon: 'SeparatorHorizontal',
    category: 'scroll',
    tags: ['divisor', 'separador', 'linea', 'hr', 'divider'],
    defaultWidth: 540,
    defaultHeight: 16,
    defaultProps: {
      lineColor: defaultColor(60, 70, 110, 180),
      lineThickness: 1,
      paddingX: 20,
      style: 'solid', // solid | dashed | dots
    },
    codeGenerator: (comp: PS2Component) => {
      const id = comp.id.slice(0, 5);
      return `// ── ScrollView Divider ──
// blocks_XXXXX.push({ y: ${comp.y}, h: ${comp.height}, draw: drawDiv_${id} });
function drawDiv_${id}(screenY) {
  const divY = screenY + ${Math.floor(comp.height / 2)};
  Draw.rect(${comp.x + comp.props.paddingX}, divY, ${comp.width - comp.props.paddingX * 2}, ${comp.props.lineThickness}, ${colorToAthena(comp.props.lineColor)});
}`;
    }
  },

  // ── Quote Block ──
  {
    type: 'scroll-quote',
    name: 'Cita / Blockquote',
    description: 'Bloque de cita destacada con borde lateral',
    icon: 'TextCursor',
    category: 'scroll',
    tags: ['cita', 'quote', 'blockquote', 'destacado', 'referencia'],
    defaultWidth: 540,
    defaultHeight: 70,
    defaultProps: {
      text: '"La creatividad es la inteligencia divirtiéndose." — Albert Einstein',
      textColor: defaultColor(190, 200, 230, 128),
      accentColor: defaultColor(200, 160, 60, 255),
      bgColor: defaultColor(25, 25, 42, 200),
      fontSize: 0.9,
      paddingX: 20,
      paddingY: 12,
    },
    codeGenerator: (comp: PS2Component) => {
      const id = comp.id.slice(0, 5);
      return `// ── ScrollView Quote Block ──
// blocks_XXXXX.push({ y: ${comp.y}, h: ${comp.height}, draw: drawQuote_${id} });
function drawQuote_${id}(screenY) {
  Draw.rect(${comp.x + 8}, screenY, ${comp.width - 8}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});
  Draw.rect(${comp.x}, screenY + 4, 4, ${comp.height - 8}, ${colorToAthena(comp.props.accentColor)});
  font.color = ${colorToAthena(comp.props.textColor)};
  font.scale = ${comp.props.fontSize};
  // Word-wrap
  const qText_${id} = "${comp.props.text.replace(/"/g, '\\"')}";
  const qW_${id} = qText_${id}.split(" ");
  let qL_${id} = "", qY_${id} = screenY + ${comp.props.paddingY};
  for (let i = 0; i < qW_${id}.length; i++) {
    const t = qL_${id} + (qL_${id} ? " " : "") + qW_${id}[i];
    const s = font.getTextSize(t);
    if (s.width > ${comp.width - comp.props.paddingX * 2} && qL_${id}) {
      font.print(${comp.x + comp.props.paddingX}, qY_${id}, qL_${id});
      qY_${id} += 16;
      qL_${id} = qW_${id}[i];
    } else { qL_${id} = t; }
  }
  if (qL_${id}) font.print(${comp.x + comp.props.paddingX}, qY_${id}, qL_${id});
}`;
    }
  },
];
