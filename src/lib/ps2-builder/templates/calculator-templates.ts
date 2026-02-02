// PS2 Visual Builder - Calculator/UI Templates
// Based on functional PS2 Calculator code patterns
// Features: Glass effects, button grids, animated buttons, selection states

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const calculatorTemplates: ComponentTemplate[] = [
  // Glass Panel (Glassmorphism effect)
  {
    type: 'glass-panel',
    name: 'Panel Cristal',
    description: 'Panel con efecto glassmorphism/translúcido',
    icon: 'Layers',
    category: 'layout',
    subcategory: 'Efectos',
    tags: ['glass', 'cristal', 'transparent', 'blur', 'modern'],
    defaultWidth: 360,
    defaultHeight: 400,
    defaultProps: {
      bgColor: defaultColor(28, 32, 38, 217), // 0.85 alpha
      glassOverlay: defaultColor(255, 255, 255, 20), // 0.08 alpha
      borderColor: defaultColor(255, 255, 255, 38), // 0.15 alpha
      shadowColor: defaultColor(0, 0, 0, 64),
      borderRadius: 16,
      showGlassEffect: true,
      showShadow: true
    },
    codeGenerator: (comp: PS2Component) => `// Glass Panel with Glassmorphism Effect
const glassPanel_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  
  draw: function() {
    ${comp.props.showShadow ? `// Drop shadow
    Draw.rect(this.x + 4, this.y + 4, this.width, this.height, ${colorToAthena(comp.props.shadowColor)});` : ''}
    
    // Main background
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    ${comp.props.showGlassEffect ? `// Glass overlay effect
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.glassOverlay)});` : ''}
    
    // Border highlight
    Draw.line(this.x, this.y, this.x + this.width, this.y, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x, this.y, this.x, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
  }
};
glassPanel_${comp.id.slice(0, 6)}.draw();`
  },

  // Calculator Display
  {
    type: 'calc-display',
    name: 'Display Calculadora',
    description: 'Display LCD estilo calculadora con efecto cristal',
    icon: 'Monitor',
    category: 'indicators',
    subcategory: 'Displays',
    tags: ['display', 'lcd', 'calculator', 'screen', 'output'],
    defaultWidth: 360,
    defaultHeight: 100,
    defaultProps: {
      bgColor: defaultColor(20, 25, 30, 178), // 0.7 alpha
      textColor: defaultColor(255, 255, 255, 242), // 0.95 alpha
      shadowColor: defaultColor(0, 0, 0, 64),
      borderRadius: 16,
      padding: 20,
      fontSize: 1.5,
      variableName: 'displayValue',
      maxLength: 18,
      showShadow: true,
      alignment: 'right'
    },
    codeGenerator: (comp: PS2Component) => `// Calculator Display Component
const calcDisplay_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  padding: ${comp.props.padding},
  maxLength: ${comp.props.maxLength},
  
  draw: function(value) {
    ${comp.props.showShadow ? `// Shadow
    Draw.rect(this.x + 2, this.y + 2, this.width, this.height, ${colorToAthena(comp.props.shadowColor)});` : ''}
    
    // Display background (LCD effect)
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    // Handle long text
    let dispText = value || "0";
    if (dispText.length > this.maxLength) {
      dispText = "..." + dispText.slice(dispText.length - this.maxLength + 3);
    }
    
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = ${comp.props.fontSize.toFixed(2)}f;
    
    ${comp.props.alignment === 'right' ? `// Right-aligned text
    const textWidth = font.getTextSize(dispText).width;
    font.print(this.x + this.width - this.padding - textWidth, this.y + this.padding, dispText);` : 
    `// Left-aligned text
    font.print(this.x + this.padding, this.y + this.padding, dispText);`}
  }
};
calcDisplay_${comp.id.slice(0, 6)}.draw(${comp.props.variableName});`
  },

  // Animated Button (with press animation)
  {
    type: 'animated-button',
    name: 'Botón Animado',
    description: 'Botón con animación de presión y efectos',
    icon: 'MousePointerClick',
    category: 'controls',
    subcategory: 'Animados',
    tags: ['button', 'animated', 'press', 'scale', 'interactive'],
    defaultWidth: 60,
    defaultHeight: 35,
    defaultProps: {
      text: '7',
      bgColor: defaultColor(60, 65, 75, 153), // 0.6 alpha
      selectedColor: defaultColor(0, 122, 255, 178), // 0.7 alpha
      textColor: defaultColor(255, 255, 255, 242),
      shadowColor: defaultColor(0, 0, 0, 64),
      highlightColor: defaultColor(255, 255, 255, 64),
      borderRadius: 10,
      animationDuration: 200
    },
    codeGenerator: (comp: PS2Component) => `// Animated Button with Press Effect
const animBtn_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  text: "${comp.props.text}",
  selected: false,
  pressTime: 0,
  
  draw: function() {
    // Calculate press animation scale
    let scale = 1.0f;
    if (this.pressTime > 0) {
      const elapsed = Date.now() - this.pressTime;
      if (elapsed < ${comp.props.animationDuration}) {
        scale = 1.0f - 0.1f * Math.sin((elapsed / ${comp.props.animationDuration}) * Math.PI);
      } else {
        this.pressTime = 0;
      }
    }
    
    const scaledW = this.width * scale;
    const scaledH = this.height * scale;
    const offsetX = (this.width - scaledW) / 2;
    const offsetY = (this.height - scaledH) / 2;
    
    // Shadow
    Draw.rect(this.x + offsetX + 2, this.y + offsetY + 2, scaledW, scaledH, ${colorToAthena(comp.props.shadowColor)});
    
    // Button background
    const bgCol = this.selected ? ${colorToAthena(comp.props.selectedColor)} : ${colorToAthena(comp.props.bgColor)};
    Draw.rect(this.x + offsetX, this.y + offsetY, scaledW, scaledH, bgCol);
    
    // Top highlight (glass effect)
    Draw.rect(this.x + offsetX, this.y + offsetY, scaledW, scaledH * 0.4f, ${colorToAthena(comp.props.highlightColor)});
    
    // Selection border
    if (this.selected) {
      Draw.line(this.x + offsetX - 2, this.y + offsetY - 2, this.x + offsetX + scaledW + 2, this.y + offsetY - 2, Color.new(0, 255, 255, 255));
      Draw.line(this.x + offsetX + scaledW + 2, this.y + offsetY - 2, this.x + offsetX + scaledW + 2, this.y + offsetY + scaledH + 2, Color.new(0, 255, 255, 255));
      Draw.line(this.x + offsetX + scaledW + 2, this.y + offsetY + scaledH + 2, this.x + offsetX - 2, this.y + offsetY + scaledH + 2, Color.new(0, 255, 255, 255));
      Draw.line(this.x + offsetX - 2, this.y + offsetY + scaledH + 2, this.x + offsetX - 2, this.y + offsetY - 2, Color.new(0, 255, 255, 255));
    }
    
    // Centered text
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = 0.9f;
    const textSize = font.getTextSize(this.text);
    font.print(this.x + offsetX + (scaledW - textSize.width) / 2, this.y + offsetY + (scaledH - textSize.height) / 2, this.text);
  },
  
  press: function() {
    this.pressTime = Date.now();
  }
};
animBtn_${comp.id.slice(0, 6)}.draw();`
  },

  // Button Grid
  {
    type: 'button-grid',
    name: 'Grilla de Botones',
    description: 'Grilla navegable de botones estilo calculadora',
    icon: 'Grid3x3',
    category: 'controls',
    subcategory: 'Grillas',
    tags: ['grid', 'buttons', 'calculator', 'keypad', 'navegable'],
    defaultWidth: 350,
    defaultHeight: 270,
    defaultProps: {
      columns: 5,
      rows: 6,
      buttonWidth: 60,
      buttonHeight: 35,
      gap: 10,
      bgColor: defaultColor(60, 65, 75, 153),
      operationColor: defaultColor(0, 122, 255, 178),
      scientificColor: defaultColor(50, 55, 65, 178),
      clearColor: defaultColor(255, 59, 48, 178),
      equalColor: defaultColor(0, 180, 120, 178),
      textColor: defaultColor(255, 255, 255, 242),
      buttons: '["sin","cos","tan","log","ln"],["7","8","9","/","sqrt"],["4","5","6","*","^2"],["1","2","3","-","^"],["0",".","(",")","pi"],["C","+","=","1/x","Hist"]'
    },
    codeGenerator: (comp: PS2Component) => `// Button Grid with D-Pad Navigation
const btnGrid_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  cols: ${comp.props.columns}, rows: ${comp.props.rows},
  btnW: ${comp.props.buttonWidth}, btnH: ${comp.props.buttonHeight},
  gap: ${comp.props.gap},
  selX: 0, selY: 0,
  buttons: [${comp.props.buttons}],
  pressTime: 0,
  
  getButtonColor: function(btn) {
    if (["/", "*", "-", "+", "="].includes(btn)) return ${colorToAthena(comp.props.operationColor)};
    if (["sin", "cos", "tan", "log", "ln", "sqrt", "^2", "^", "pi", "1/x", "Hist"].includes(btn)) return ${colorToAthena(comp.props.scientificColor)};
    if (btn === "C") return ${colorToAthena(comp.props.clearColor)};
    if (btn === "=") return ${colorToAthena(comp.props.equalColor)};
    return ${colorToAthena(comp.props.bgColor)};
  },
  
  draw: function() {
    for (let row = 0; row < this.buttons.length; row++) {
      for (let col = 0; col < this.buttons[row].length; col++) {
        const btnX = this.x + col * (this.btnW + this.gap);
        const btnY = this.y + row * (this.btnH + this.gap);
        const btn = this.buttons[row][col];
        
        // Press animation
        let scale = 1.0f;
        if (col === this.selX && row === this.selY && this.pressTime > 0) {
          const elapsed = Date.now() - this.pressTime;
          if (elapsed < 200) {
            scale = 1.0f - 0.1f * Math.sin((elapsed / 200) * Math.PI);
          } else {
            this.pressTime = 0;
          }
        }
        
        const scaledW = this.btnW * scale;
        const scaledH = this.btnH * scale;
        const offsetX = (this.btnW - scaledW) / 2;
        const offsetY = (this.btnH - scaledH) / 2;
        
        // Shadow
        Draw.rect(btnX + offsetX + 2, btnY + offsetY + 2, scaledW, scaledH, Color.new(0, 0, 0, 64));
        
        // Button
        Draw.rect(btnX + offsetX, btnY + offsetY, scaledW, scaledH, this.getButtonColor(btn));
        
        // Selection highlight
        if (col === this.selX && row === this.selY) {
          Draw.line(btnX + offsetX - 2, btnY + offsetY - 2, btnX + offsetX + scaledW + 2, btnY + offsetY - 2, Color.new(0, 255, 255, 255));
          Draw.line(btnX + offsetX + scaledW + 2, btnY + offsetY - 2, btnX + offsetX + scaledW + 2, btnY + offsetY + scaledH + 2, Color.new(0, 255, 255, 255));
          Draw.line(btnX + offsetX + scaledW + 2, btnY + offsetY + scaledH + 2, btnX + offsetX - 2, btnY + offsetY + scaledH + 2, Color.new(0, 255, 255, 255));
          Draw.line(btnX + offsetX - 2, btnY + offsetY + scaledH + 2, btnX + offsetX - 2, btnY + offsetY - 2, Color.new(0, 255, 255, 255));
        }
        
        // Button text
        font.color = ${colorToAthena(comp.props.textColor)};
        font.scale = 0.85f;
        const textSize = font.getTextSize(btn);
        font.print(btnX + offsetX + (scaledW - textSize.width) / 2, btnY + offsetY + 8, btn);
      }
    }
  },
  
  navigate: function(pad) {
    if (pad.justPressed(Pads.UP)) this.selY = Math.max(0, this.selY - 1);
    if (pad.justPressed(Pads.DOWN)) this.selY = Math.min(this.buttons.length - 1, this.selY + 1);
    if (pad.justPressed(Pads.LEFT)) this.selX = Math.max(0, this.selX - 1);
    if (pad.justPressed(Pads.RIGHT)) this.selX = Math.min(this.buttons[this.selY].length - 1, this.selX + 1);
    
    if (pad.justPressed(Pads.CROSS)) {
      this.pressTime = Date.now();
      return this.buttons[this.selY][this.selX];
    }
    return null;
  }
};
btnGrid_${comp.id.slice(0, 6)}.draw();`
  },

  // Selectable History List
  {
    type: 'history-list',
    name: 'Lista de Historial',
    description: 'Lista navegable con D-Pad y selección',
    icon: 'History',
    category: 'lists',
    subcategory: 'Navegables',
    tags: ['history', 'list', 'selectable', 'scrollable', 'navegable'],
    defaultWidth: 360,
    defaultHeight: 250,
    defaultProps: {
      bgColor: defaultColor(20, 25, 30, 178),
      selectedColor: defaultColor(0, 122, 255, 178),
      textColor: defaultColor(255, 255, 255, 242),
      itemHeight: 25,
      maxVisible: 8,
      borderRadius: 10,
      variableName: 'historyArray',
      emptyMessage: 'No hay historial'
    },
    codeGenerator: (comp: PS2Component) => `// History List with Navigation
const histList_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  itemH: ${comp.props.itemHeight},
  maxVisible: ${comp.props.maxVisible},
  selected: 0,
  scrollOffset: 0,
  items: ${comp.props.variableName} || [],
  
  draw: function() {
    // Background
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    if (this.items.length === 0) {
      font.color = Color.new(150, 150, 170, 128);
      font.scale = 0.85f;
      font.print(this.x + 12, this.y + 12, "${comp.props.emptyMessage}");
      return;
    }
    
    // Calculate visible range
    const startIdx = Math.max(0, this.selected - Math.floor(this.maxVisible / 2));
    const endIdx = Math.min(this.items.length, startIdx + this.maxVisible);
    
    for (let i = startIdx; i < endIdx; i++) {
      const itemY = this.y + 10 + (i - startIdx) * this.itemH;
      let itemText = String(this.items[i]);
      
      // Truncate if too long
      if (itemText.length > 35) {
        itemText = itemText.substring(0, 32) + "...";
      }
      
      // Selection highlight
      if (i === this.selected) {
        Draw.rect(this.x + 5, itemY - 2, this.width - 10, this.itemH, ${colorToAthena(comp.props.selectedColor)});
      }
      
      font.color = ${colorToAthena(comp.props.textColor)};
      font.scale = 0.8f;
      font.print(this.x + 12, itemY, itemText);
    }
    
    // Scroll indicators
    if (startIdx > 0) {
      font.print(this.x + this.width - 20, this.y + 5, "▲");
    }
    if (endIdx < this.items.length) {
      font.print(this.x + this.width - 20, this.y + this.height - 20, "▼");
    }
  },
  
  navigate: function(pad) {
    if (pad.justPressed(Pads.UP)) this.selected = Math.max(0, this.selected - 1);
    if (pad.justPressed(Pads.DOWN)) this.selected = Math.min(this.items.length - 1, this.selected + 1);
    if (pad.justPressed(Pads.CROSS) && this.items.length > 0) {
      return this.items[this.selected];
    }
    return null;
  }
};
histList_${comp.id.slice(0, 6)}.draw();`
  },

  // Operation Button (colored)
  {
    type: 'operation-button',
    name: 'Botón Operación',
    description: 'Botón de operación matemática (azul)',
    icon: 'Plus',
    category: 'controls',
    subcategory: 'Calculadora',
    tags: ['operation', 'math', 'blue', 'operator'],
    defaultWidth: 60,
    defaultHeight: 35,
    defaultProps: {
      text: '+',
      bgColor: defaultColor(0, 122, 255, 178),
      gradientEnd: defaultColor(0, 102, 235, 178),
      textColor: defaultColor(255, 255, 255, 242),
      glowColor: defaultColor(30, 152, 255, 178)
    },
    codeGenerator: (comp: PS2Component) => `// Operation Button (Math operator)
const opBtn_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  text: "${comp.props.text}",
  selected: false,
  
  draw: function() {
    // Glow effect when selected
    if (this.selected) {
      Draw.rect(this.x - 3, this.y - 3, this.width + 6, this.height + 6, ${colorToAthena(comp.props.glowColor)});
    }
    
    // Button with gradient effect (top to bottom simulation)
    Draw.rect(this.x, this.y, this.width, this.height / 2, ${colorToAthena(comp.props.bgColor)});
    Draw.rect(this.x, this.y + this.height / 2, this.width, this.height / 2, ${colorToAthena(comp.props.gradientEnd)});
    
    // Text
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = 1.1f;
    const tw = font.getTextSize(this.text).width;
    font.print(this.x + (this.width - tw) / 2, this.y + 8, this.text);
  }
};
opBtn_${comp.id.slice(0, 6)}.draw();`
  },

  // Scientific Button
  {
    type: 'scientific-button',
    name: 'Botón Científico',
    description: 'Botón de función científica (gris oscuro)',
    icon: 'Calculator',
    category: 'controls',
    subcategory: 'Calculadora',
    tags: ['scientific', 'function', 'sin', 'cos', 'tan', 'log'],
    defaultWidth: 60,
    defaultHeight: 35,
    defaultProps: {
      text: 'sin',
      bgColor: defaultColor(50, 55, 65, 178),
      textColor: defaultColor(255, 255, 255, 242),
      accentColor: defaultColor(70, 75, 85, 178)
    },
    codeGenerator: (comp: PS2Component) => `// Scientific Function Button
const sciBtn_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  text: "${comp.props.text}",
  selected: false,
  
  draw: function() {
    const bgCol = this.selected ? ${colorToAthena(comp.props.accentColor)} : ${colorToAthena(comp.props.bgColor)};
    Draw.rect(this.x, this.y, this.width, this.height, bgCol);
    
    // Selection indicator
    if (this.selected) {
      Draw.rect(this.x, this.y, 3, this.height, Color.new(0, 200, 255, 255));
    }
    
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = 0.8f;
    const tw = font.getTextSize(this.text).width;
    font.print(this.x + (this.width - tw) / 2, this.y + 10, this.text);
  }
};
sciBtn_${comp.id.slice(0, 6)}.draw();`
  },

  // Numeric Keypad
  {
    type: 'numeric-keypad',
    name: 'Teclado Numérico',
    description: 'Teclado numérico 3x4 estándar',
    icon: 'Grid2x2',
    category: 'controls',
    subcategory: 'Grillas',
    tags: ['keypad', 'numeric', 'numbers', 'input', 'telefono'],
    defaultWidth: 220,
    defaultHeight: 180,
    defaultProps: {
      buttonWidth: 60,
      buttonHeight: 35,
      gap: 10,
      bgColor: defaultColor(60, 65, 75, 153),
      textColor: defaultColor(255, 255, 255, 242),
      selectedColor: defaultColor(0, 122, 255, 178)
    },
    codeGenerator: (comp: PS2Component) => `// Numeric Keypad (3x4)
const numpad_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  btnW: ${comp.props.buttonWidth}, btnH: ${comp.props.buttonHeight},
  gap: ${comp.props.gap},
  selX: 1, selY: 1,
  keys: [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["C", "0", "OK"]
  ],
  
  draw: function() {
    for (let row = 0; row < this.keys.length; row++) {
      for (let col = 0; col < this.keys[row].length; col++) {
        const btnX = this.x + col * (this.btnW + this.gap);
        const btnY = this.y + row * (this.btnH + this.gap);
        const key = this.keys[row][col];
        
        const isSelected = col === this.selX && row === this.selY;
        const bgCol = isSelected ? ${colorToAthena(comp.props.selectedColor)} : ${colorToAthena(comp.props.bgColor)};
        
        Draw.rect(btnX, btnY, this.btnW, this.btnH, bgCol);
        
        if (isSelected) {
          Draw.line(btnX - 1, btnY - 1, btnX + this.btnW + 1, btnY - 1, Color.new(0, 255, 255, 255));
          Draw.line(btnX + this.btnW + 1, btnY - 1, btnX + this.btnW + 1, btnY + this.btnH + 1, Color.new(0, 255, 255, 255));
          Draw.line(btnX + this.btnW + 1, btnY + this.btnH + 1, btnX - 1, btnY + this.btnH + 1, Color.new(0, 255, 255, 255));
          Draw.line(btnX - 1, btnY + this.btnH + 1, btnX - 1, btnY - 1, Color.new(0, 255, 255, 255));
        }
        
        font.color = ${colorToAthena(comp.props.textColor)};
        font.scale = 1.0f;
        const tw = font.getTextSize(key).width;
        font.print(btnX + (this.btnW - tw) / 2, btnY + 8, key);
      }
    }
  },
  
  navigate: function(pad) {
    if (pad.justPressed(Pads.UP)) this.selY = Math.max(0, this.selY - 1);
    if (pad.justPressed(Pads.DOWN)) this.selY = Math.min(3, this.selY + 1);
    if (pad.justPressed(Pads.LEFT)) this.selX = Math.max(0, this.selX - 1);
    if (pad.justPressed(Pads.RIGHT)) this.selX = Math.min(2, this.selX + 1);
    
    if (pad.justPressed(Pads.CROSS)) {
      return this.keys[this.selY][this.selX];
    }
    return null;
  }
};
numpad_${comp.id.slice(0, 6)}.draw();`
  },

  // Mode Switcher
  {
    type: 'mode-switcher',
    name: 'Selector de Modo',
    description: 'Tabs/botones para cambiar entre modos',
    icon: 'LayoutList',
    category: 'controls',
    subcategory: 'Navegación',
    tags: ['tabs', 'mode', 'switcher', 'toggle', 'selector'],
    defaultWidth: 200,
    defaultHeight: 32,
    defaultProps: {
      modes: 'Calc,Hist',
      activeMode: 0,
      bgColor: defaultColor(40, 45, 55, 255),
      activeColor: defaultColor(0, 122, 255, 200),
      textColor: defaultColor(255, 255, 255, 200),
      inactiveTextColor: defaultColor(150, 150, 170, 150)
    },
    codeGenerator: (comp: PS2Component) => `// Mode Switcher Tabs
const modeSwitcher_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  modes: "${comp.props.modes}".split(","),
  active: ${comp.props.activeMode},
  
  draw: function() {
    const tabW = this.width / this.modes.length;
    
    // Background
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    for (let i = 0; i < this.modes.length; i++) {
      const tabX = this.x + i * tabW;
      
      if (i === this.active) {
        Draw.rect(tabX, this.y, tabW, this.height, ${colorToAthena(comp.props.activeColor)});
        font.color = ${colorToAthena(comp.props.textColor)};
      } else {
        font.color = ${colorToAthena(comp.props.inactiveTextColor)};
      }
      
      font.scale = 0.85f;
      const tw = font.getTextSize(this.modes[i]).width;
      font.print(tabX + (tabW - tw) / 2, this.y + 8, this.modes[i]);
    }
  },
  
  setActive: function(idx) {
    this.active = Math.max(0, Math.min(this.modes.length - 1, idx));
  }
};
modeSwitcher_${comp.id.slice(0, 6)}.draw();`
  }
];
