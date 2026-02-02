// PS2 Visual Builder - Control/Input Templates
// Based on AthenaEnv Pads, Keyboard, Mouse modules

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const controlTemplates: ComponentTemplate[] = [
  // Button
  {
    type: 'button',
    name: 'Botón',
    description: 'Botón interactivo con estados',
    icon: 'Square',
    category: 'controls',
    tags: ['button', 'boton', 'click', 'interactive'],
    defaultWidth: 140,
    defaultHeight: 36,
    defaultProps: {
      text: 'ACEPTAR',
      bgColor: defaultColor(0, 100, 180, 255),
      hoverColor: defaultColor(0, 140, 220, 255),
      textColor: defaultColor(255, 255, 255, 128),
      borderRadius: 0,
      padButton: 'CROSS'
    },
    codeGenerator: (comp: PS2Component) => `// Button Component
const btn_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  text: "${comp.props.text}",
  selected: false,
  
  draw: function() {
    const bg = this.selected 
      ? ${colorToAthena(comp.props.hoverColor)}
      : ${colorToAthena(comp.props.bgColor)};
    Draw.rect(this.x, this.y, this.width, this.height, bg);
    
    if (this.selected) {
      Draw.rect(this.x, this.y, 4, this.height, Color.new(0, 255, 255, 255));
    }
    
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = 1.0;
    const tw = font.getTextSize(this.text).width;
    font.print(this.x + (this.width - tw) / 2, this.y + 10, this.text);
  },
  
  onPress: function() {
    // Action when button is pressed with ${comp.props.padButton}
  }
};
btn_${comp.id.slice(0, 6)}.draw();`
  },

  // TextBox
  {
    type: 'textbox',
    name: 'Campo de Texto',
    description: 'Input de texto con teclado USB',
    icon: 'TextCursor',
    category: 'controls',
    tags: ['textbox', 'input', 'text', 'keyboard'],
    defaultWidth: 220,
    defaultHeight: 32,
    defaultProps: {
      placeholder: 'Ingrese texto...',
      value: '',
      bgColor: defaultColor(30, 30, 50, 255),
      borderColor: defaultColor(80, 80, 120, 255),
      focusBorderColor: defaultColor(0, 200, 255, 255),
      textColor: defaultColor(255, 255, 255, 128),
      placeholderColor: defaultColor(100, 100, 130, 128),
      maxLength: 32
    },
    codeGenerator: (comp: PS2Component) => `// TextBox Component
const textbox_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  value: "${comp.props.value}",
  placeholder: "${comp.props.placeholder}",
  focused: false,
  maxLength: ${comp.props.maxLength},
  
  draw: function() {
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    const borderCol = this.focused 
      ? ${colorToAthena(comp.props.focusBorderColor)}
      : ${colorToAthena(comp.props.borderColor)};
    Draw.line(this.x, this.y, this.x + this.width, this.y, borderCol);
    Draw.line(this.x + this.width, this.y, this.x + this.width, this.y + this.height, borderCol);
    Draw.line(this.x + this.width, this.y + this.height, this.x, this.y + this.height, borderCol);
    Draw.line(this.x, this.y + this.height, this.x, this.y, borderCol);
    
    font.scale = 0.9;
    font.color = this.value 
      ? ${colorToAthena(comp.props.textColor)}
      : ${colorToAthena(comp.props.placeholderColor)};
    font.print(this.x + 8, this.y + 8, this.value || this.placeholder);
    
    // Cursor
    if (this.focused) {
      const cursorX = this.x + 8 + font.getTextSize(this.value).width;
      Draw.rect(cursorX, this.y + 6, 2, this.height - 12, Color.new(255, 255, 255, 200));
    }
  }
};
textbox_${comp.id.slice(0, 6)}.draw();`
  },

  // Checkbox
  {
    type: 'checkbox',
    name: 'Casilla',
    description: 'Casilla de verificación',
    icon: 'CheckSquare',
    category: 'controls',
    tags: ['checkbox', 'check', 'toggle', 'option'],
    defaultWidth: 160,
    defaultHeight: 24,
    defaultProps: {
      label: 'Activar opción',
      checked: false,
      boxColor: defaultColor(255, 255, 255, 255),
      checkColor: defaultColor(0, 255, 128, 255),
      labelColor: defaultColor(255, 255, 255, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Checkbox Component
const checkbox_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  label: "${comp.props.label}",
  checked: ${comp.props.checked},
  selected: false,
  
  draw: function() {
    const boxCol = this.selected 
      ? Color.new(0, 200, 255, 255) 
      : ${colorToAthena(comp.props.boxColor)};
    
    // Box outline
    Draw.line(this.x, this.y, this.x + 18, this.y, boxCol);
    Draw.line(this.x + 18, this.y, this.x + 18, this.y + 18, boxCol);
    Draw.line(this.x + 18, this.y + 18, this.x, this.y + 18, boxCol);
    Draw.line(this.x, this.y + 18, this.x, this.y, boxCol);
    
    // Check mark
    if (this.checked) {
      Draw.line(this.x + 4, this.y + 9, this.x + 7, this.y + 14, ${colorToAthena(comp.props.checkColor)});
      Draw.line(this.x + 7, this.y + 14, this.x + 14, this.y + 4, ${colorToAthena(comp.props.checkColor)});
    }
    
    // Label
    font.color = ${colorToAthena(comp.props.labelColor)};
    font.scale = 0.9;
    font.print(this.x + 26, this.y + 2, this.label);
  },
  
  toggle: function() {
    this.checked = !this.checked;
  }
};
checkbox_${comp.id.slice(0, 6)}.draw();`
  },

  // Radio Button
  {
    type: 'radio',
    name: 'Radio',
    description: 'Botón de opción para grupos',
    icon: 'Circle',
    category: 'controls',
    tags: ['radio', 'option', 'select', 'group'],
    defaultWidth: 160,
    defaultHeight: 24,
    defaultProps: {
      label: 'Opción A',
      selected: false,
      group: 'radioGroup1',
      circleColor: defaultColor(255, 255, 255, 255),
      activeColor: defaultColor(0, 255, 200, 255),
      labelColor: defaultColor(255, 255, 255, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Radio Button Component
const radio_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  label: "${comp.props.label}",
  selected: ${comp.props.selected},
  group: "${comp.props.group}",
  focused: false,
  
  draw: function() {
    const circleCol = this.focused 
      ? Color.new(0, 200, 255, 255) 
      : ${colorToAthena(comp.props.circleColor)};
    
    // Outer circle
    Draw.circle(this.x + 9, this.y + 9, 9, Color.new(40, 40, 60, 255), true);
    Draw.circle(this.x + 9, this.y + 9, 8, circleCol, false);
    
    // Inner dot when selected
    if (this.selected) {
      Draw.circle(this.x + 9, this.y + 9, 5, ${colorToAthena(comp.props.activeColor)}, true);
    }
    
    // Label
    font.color = ${colorToAthena(comp.props.labelColor)};
    font.scale = 0.9;
    font.print(this.x + 26, this.y + 2, this.label);
  }
};
radio_${comp.id.slice(0, 6)}.draw();`
  },

  // Slider
  {
    type: 'slider',
    name: 'Deslizador',
    description: 'Control deslizante para valores',
    icon: 'SlidersHorizontal',
    category: 'controls',
    tags: ['slider', 'range', 'value', 'control'],
    defaultWidth: 200,
    defaultHeight: 28,
    defaultProps: {
      value: 50,
      min: 0,
      max: 100,
      step: 1,
      trackColor: defaultColor(50, 50, 70, 255),
      fillColor: defaultColor(0, 160, 255, 255),
      thumbColor: defaultColor(255, 255, 255, 255),
      showValue: true
    },
    codeGenerator: (comp: PS2Component) => `// Slider Component
const slider_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width - (comp.props.showValue ? 40 : 0)},
  value: ${comp.props.value},
  min: ${comp.props.min}, max: ${comp.props.max},
  step: ${comp.props.step},
  selected: false,
  
  draw: function() {
    const trackY = this.y + 10;
    const trackH = 8;
    const progress = (this.value - this.min) / (this.max - this.min);
    const fillW = this.width * progress;
    const thumbX = this.x + fillW;
    
    // Track
    Draw.rect(this.x, trackY, this.width, trackH, ${colorToAthena(comp.props.trackColor)});
    
    // Fill
    Draw.rect(this.x, trackY, fillW, trackH, ${colorToAthena(comp.props.fillColor)});
    
    // Thumb
    const thumbCol = this.selected 
      ? Color.new(0, 255, 255, 255) 
      : ${colorToAthena(comp.props.thumbColor)};
    Draw.circle(thumbX, trackY + 4, 8, thumbCol, true);
    
    ${comp.props.showValue ? `// Value text
    font.color = Color.new(255, 255, 255, 128);
    font.scale = 0.75;
    font.print(this.x + this.width + 8, this.y + 6, String(this.value));` : ''}
  },
  
  increase: function() {
    this.value = Math.min(this.max, this.value + this.step);
  },
  
  decrease: function() {
    this.value = Math.max(this.min, this.value - this.step);
  }
};
slider_${comp.id.slice(0, 6)}.draw();`
  },

  // Toggle Switch
  {
    type: 'toggle',
    name: 'Interruptor',
    description: 'Switch on/off estilo moderno',
    icon: 'ToggleRight',
    category: 'controls',
    tags: ['toggle', 'switch', 'on', 'off'],
    defaultWidth: 100,
    defaultHeight: 28,
    defaultProps: {
      label: 'Activado',
      enabled: false,
      trackOffColor: defaultColor(60, 60, 80, 255),
      trackOnColor: defaultColor(0, 180, 100, 255),
      thumbColor: defaultColor(255, 255, 255, 255),
      labelColor: defaultColor(255, 255, 255, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Toggle Switch Component
const toggle_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  label: "${comp.props.label}",
  enabled: ${comp.props.enabled},
  selected: false,
  
  draw: function() {
    const trackW = 44, trackH = 22;
    const trackCol = this.enabled 
      ? ${colorToAthena(comp.props.trackOnColor)}
      : ${colorToAthena(comp.props.trackOffColor)};
    
    // Track (rounded rect approximated)
    Draw.rect(this.x, this.y + 3, trackW, trackH, trackCol);
    Draw.circle(this.x, this.y + 14, 11, trackCol, true);
    Draw.circle(this.x + trackW, this.y + 14, 11, trackCol, true);
    
    // Thumb
    const thumbX = this.enabled ? this.x + trackW - 11 : this.x + 11;
    const thumbCol = this.selected 
      ? Color.new(0, 255, 255, 255) 
      : ${colorToAthena(comp.props.thumbColor)};
    Draw.circle(thumbX, this.y + 14, 9, thumbCol, true);
    
    // Label
    font.color = ${colorToAthena(comp.props.labelColor)};
    font.scale = 0.85;
    font.print(this.x + 52, this.y + 6, this.label);
  },
  
  toggle: function() {
    this.enabled = !this.enabled;
  }
};
toggle_${comp.id.slice(0, 6)}.draw();`
  }
];
