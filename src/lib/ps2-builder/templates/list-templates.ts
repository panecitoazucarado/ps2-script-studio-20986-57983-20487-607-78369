// PS2 Visual Builder - List and Grid Templates

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const listTemplates: ComponentTemplate[] = [
  // Vertical List
  {
    type: 'list',
    name: 'Lista Vertical',
    description: 'Lista de elementos seleccionables',
    icon: 'List',
    category: 'lists',
    tags: ['list', 'menu', 'items', 'vertical'],
    defaultWidth: 240,
    defaultHeight: 180,
    defaultProps: {
      items: ['Nuevo Juego', 'Cargar Partida', 'Opciones', 'Créditos', 'Salir'],
      selectedIndex: 0,
      bgColor: defaultColor(25, 25, 45, 255),
      itemColor: defaultColor(200, 200, 220, 128),
      selectedBgColor: defaultColor(0, 80, 160, 255),
      selectedTextColor: defaultColor(255, 255, 255, 128),
      itemHeight: 32,
      showBorder: true,
      borderColor: defaultColor(60, 70, 110, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Vertical List Component
const list_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  items: ${JSON.stringify(comp.props.items)},
  selectedIndex: ${comp.props.selectedIndex},
  scrollOffset: 0,
  itemHeight: ${comp.props.itemHeight},
  
  draw: function() {
    // Background
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    const visibleCount = Math.floor(this.height / this.itemHeight);
    
    for (let i = 0; i < Math.min(visibleCount, this.items.length); i++) {
      const idx = i + this.scrollOffset;
      if (idx >= this.items.length) break;
      
      const itemY = this.y + i * this.itemHeight;
      const isSelected = idx === this.selectedIndex;
      
      if (isSelected) {
        Draw.rect(this.x, itemY, this.width, this.itemHeight, ${colorToAthena(comp.props.selectedBgColor)});
        // Selection indicator
        Draw.rect(this.x, itemY, 4, this.itemHeight, Color.new(0, 255, 200, 255));
      }
      
      font.color = isSelected 
        ? ${colorToAthena(comp.props.selectedTextColor)}
        : ${colorToAthena(comp.props.itemColor)};
      font.scale = 0.9f;
      font.print(this.x + 16, itemY + 8, this.items[idx]);
    }
    
    ${comp.props.showBorder ? `// Border
    Draw.line(this.x, this.y, this.x + this.width, this.y, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y, this.x + this.width, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y + this.height, this.x, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x, this.y + this.height, this.x, this.y, ${colorToAthena(comp.props.borderColor)});` : ''}
  },
  
  moveUp: function() {
    if (this.selectedIndex > 0) this.selectedIndex--;
    this.updateScroll();
  },
  
  moveDown: function() {
    if (this.selectedIndex < this.items.length - 1) this.selectedIndex++;
    this.updateScroll();
  },
  
  updateScroll: function() {
    const visibleCount = Math.floor(this.height / this.itemHeight);
    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + visibleCount) {
      this.scrollOffset = this.selectedIndex - visibleCount + 1;
    }
  }
};
list_${comp.id.slice(0, 6)}.draw();`
  },

  // Grid
  {
    type: 'grid',
    name: 'Cuadrícula',
    description: 'Grid para iconos o items',
    icon: 'Grid3x3',
    category: 'lists',
    tags: ['grid', 'cuadricula', 'icons', 'gallery'],
    defaultWidth: 300,
    defaultHeight: 220,
    defaultProps: {
      columns: 4,
      rows: 3,
      cellWidth: 64,
      cellHeight: 64,
      gap: 8,
      selectedIndex: 0,
      bgColor: defaultColor(25, 25, 45, 255),
      cellColor: defaultColor(45, 50, 75, 255),
      selectedCellColor: defaultColor(0, 120, 200, 255),
      borderColor: defaultColor(60, 70, 110, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Grid Component
const grid_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  columns: ${comp.props.columns}, rows: ${comp.props.rows},
  cellWidth: ${comp.props.cellWidth}, cellHeight: ${comp.props.cellHeight},
  gap: ${comp.props.gap},
  selectedIndex: ${comp.props.selectedIndex},
  items: [], // Add your item data here
  
  draw: function() {
    // Background
    const totalW = this.columns * (this.cellWidth + this.gap) - this.gap + 16;
    const totalH = this.rows * (this.cellHeight + this.gap) - this.gap + 16;
    Draw.rect(this.x - 8, this.y - 8, totalW, totalH, ${colorToAthena(comp.props.bgColor)});
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        const idx = row * this.columns + col;
        const cellX = this.x + col * (this.cellWidth + this.gap);
        const cellY = this.y + row * (this.cellHeight + this.gap);
        const isSelected = idx === this.selectedIndex;
        
        const cellCol = isSelected 
          ? ${colorToAthena(comp.props.selectedCellColor)}
          : ${colorToAthena(comp.props.cellColor)};
        Draw.rect(cellX, cellY, this.cellWidth, this.cellHeight, cellCol);
        
        if (isSelected) {
          Draw.line(cellX, cellY, cellX + this.cellWidth, cellY, Color.new(255, 255, 255, 255));
          Draw.line(cellX + this.cellWidth, cellY, cellX + this.cellWidth, cellY + this.cellHeight, Color.new(255, 255, 255, 255));
          Draw.line(cellX + this.cellWidth, cellY + this.cellHeight, cellX, cellY + this.cellHeight, Color.new(255, 255, 255, 255));
          Draw.line(cellX, cellY + this.cellHeight, cellX, cellY, Color.new(255, 255, 255, 255));
        }
      }
    }
  },
  
  navigate: function(dir) {
    const col = this.selectedIndex % this.columns;
    const row = Math.floor(this.selectedIndex / this.columns);
    const maxIdx = this.columns * this.rows - 1;
    
    switch(dir) {
      case 'up': if (row > 0) this.selectedIndex -= this.columns; break;
      case 'down': if (row < this.rows - 1 && this.selectedIndex + this.columns <= maxIdx) this.selectedIndex += this.columns; break;
      case 'left': if (col > 0) this.selectedIndex--; break;
      case 'right': if (col < this.columns - 1 && this.selectedIndex < maxIdx) this.selectedIndex++; break;
    }
  }
};
grid_${comp.id.slice(0, 6)}.draw();`
  },

  // Horizontal Menu
  {
    type: 'horizontal-menu',
    name: 'Menú Horizontal',
    description: 'Tabs o menú en fila',
    icon: 'Rows3',
    category: 'lists',
    tags: ['menu', 'tabs', 'horizontal', 'nav'],
    defaultWidth: 400,
    defaultHeight: 40,
    defaultProps: {
      items: ['Inicio', 'Jugar', 'Opciones', 'Salir'],
      selectedIndex: 0,
      bgColor: defaultColor(30, 35, 55, 255),
      textColor: defaultColor(150, 150, 180, 128),
      selectedBgColor: defaultColor(0, 100, 180, 255),
      selectedTextColor: defaultColor(255, 255, 255, 128),
      itemWidth: 100
    },
    codeGenerator: (comp: PS2Component) => `// Horizontal Menu Component
const hmenu_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  height: ${comp.height},
  items: ${JSON.stringify(comp.props.items)},
  selectedIndex: ${comp.props.selectedIndex},
  itemWidth: ${comp.props.itemWidth},
  
  draw: function() {
    // Background
    Draw.rect(this.x, this.y, this.items.length * this.itemWidth, this.height, ${colorToAthena(comp.props.bgColor)});
    
    for (let i = 0; i < this.items.length; i++) {
      const itemX = this.x + i * this.itemWidth;
      const isSelected = i === this.selectedIndex;
      
      if (isSelected) {
        Draw.rect(itemX, this.y, this.itemWidth, this.height, ${colorToAthena(comp.props.selectedBgColor)});
        // Bottom indicator
        Draw.rect(itemX, this.y + this.height - 3, this.itemWidth, 3, Color.new(0, 255, 200, 255));
      }
      
      font.color = isSelected 
        ? ${colorToAthena(comp.props.selectedTextColor)}
        : ${colorToAthena(comp.props.textColor)};
      font.scale = 0.9f;
      const tw = font.getTextSize(this.items[i]).width;
      font.print(itemX + (this.itemWidth - tw) / 2, this.y + 10, this.items[i]);
    }
  },
  
  moveLeft: function() {
    if (this.selectedIndex > 0) this.selectedIndex--;
  },
  
  moveRight: function() {
    if (this.selectedIndex < this.items.length - 1) this.selectedIndex++;
  }
};
hmenu_${comp.id.slice(0, 6)}.draw();`
  },

  // Scrollable Text Area
  {
    type: 'text-area',
    name: 'Área de Texto',
    description: 'Texto largo con scroll',
    icon: 'FileText',
    category: 'lists',
    tags: ['textarea', 'text', 'scroll', 'content'],
    defaultWidth: 280,
    defaultHeight: 160,
    defaultProps: {
      text: 'Este es un área de texto que puede contener múltiples líneas de contenido. El texto puede hacer scroll si es más largo que el área visible.',
      bgColor: defaultColor(20, 20, 40, 255),
      textColor: defaultColor(200, 200, 220, 128),
      borderColor: defaultColor(60, 70, 110, 255),
      lineHeight: 18,
      padding: 10
    },
    codeGenerator: (comp: PS2Component) => `// Text Area Component
const textarea_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  text: "${comp.props.text.replace(/"/g, '\\"')}",
  scrollY: 0,
  lineHeight: ${comp.props.lineHeight},
  padding: ${comp.props.padding},
  
  draw: function() {
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    // TODO: Implement word wrapping and scrolling
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = 0.8f;
    font.print(this.x + this.padding, this.y + this.padding - this.scrollY, this.text);
    
    // Border
    Draw.line(this.x, this.y, this.x + this.width, this.y, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y, this.x + this.width, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y + this.height, this.x, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x, this.y + this.height, this.x, this.y, ${colorToAthena(comp.props.borderColor)});
  }
};
textarea_${comp.id.slice(0, 6)}.draw();`
  }
];
