// PS2 Visual Builder - Indicator Templates
// Progress bars, status displays, gauges

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const indicatorTemplates: ComponentTemplate[] = [
  // Progress Bar
  {
    type: 'progress-bar',
    name: 'Barra de Progreso',
    description: 'Indicador de progreso horizontal',
    icon: 'BarChart3',
    category: 'indicators',
    tags: ['progress', 'bar', 'loading', 'percentage'],
    defaultWidth: 220,
    defaultHeight: 24,
    defaultProps: {
      value: 65,
      max: 100,
      bgColor: defaultColor(40, 40, 60, 255),
      fillColor: defaultColor(0, 180, 100, 255),
      showText: true,
      textColor: defaultColor(255, 255, 255, 128),
      animated: false
    },
    codeGenerator: (comp: PS2Component) => `// Progress Bar Component
const progress_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  value: ${comp.props.value}, max: ${comp.props.max},
  
  draw: function() {
    // Background
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    // Fill
    const fillW = (this.value / this.max) * this.width;
    Draw.rect(this.x, this.y, fillW, this.height, ${colorToAthena(comp.props.fillColor)});
    
    ${comp.props.showText ? `// Percentage text
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = 0.7f;
    const pct = Math.floor((this.value / this.max) * 100) + "%";
    const tw = font.getTextSize(pct).width;
    font.print(this.x + (this.width - tw) / 2, this.y + 5, pct);` : ''}
  },
  
  setValue: function(v) {
    this.value = Math.max(0, Math.min(this.max, v));
  }
};
progress_${comp.id.slice(0, 6)}.draw();`
  },

  // Health Bar (Game style)
  {
    type: 'health-bar',
    name: 'Barra de Vida',
    description: 'Barra estilo videojuego con colores',
    icon: 'Heart',
    category: 'indicators',
    subcategory: 'Juego',
    tags: ['health', 'vida', 'hp', 'game'],
    defaultWidth: 200,
    defaultHeight: 20,
    defaultProps: {
      value: 75,
      max: 100,
      bgColor: defaultColor(40, 20, 20, 255),
      highColor: defaultColor(0, 200, 50, 255),
      mediumColor: defaultColor(200, 180, 0, 255),
      lowColor: defaultColor(200, 50, 50, 255),
      borderColor: defaultColor(100, 80, 80, 255),
      label: 'HP'
    },
    codeGenerator: (comp: PS2Component) => `// Health Bar Component
const healthbar_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  value: ${comp.props.value}, max: ${comp.props.max},
  
  draw: function() {
    const pct = this.value / this.max;
    
    // Background
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    // Fill color based on percentage
    let fillColor;
    if (pct > 0.5) {
      fillColor = ${colorToAthena(comp.props.highColor)};
    } else if (pct > 0.25) {
      fillColor = ${colorToAthena(comp.props.mediumColor)};
    } else {
      fillColor = ${colorToAthena(comp.props.lowColor)};
    }
    
    const fillW = pct * this.width;
    Draw.rect(this.x, this.y, fillW, this.height, fillColor);
    
    // Border
    Draw.line(this.x, this.y, this.x + this.width, this.y, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y, this.x + this.width, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y + this.height, this.x, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x, this.y + this.height, this.x, this.y, ${colorToAthena(comp.props.borderColor)});
    
    // Label
    font.color = Color.new(255, 255, 255, 128);
    font.scale = 0.65f;
    font.print(this.x + 4, this.y + 3, "${comp.props.label}: " + this.value + "/" + this.max);
  }
};
healthbar_${comp.id.slice(0, 6)}.draw();`
  },

  // Circular Gauge
  {
    type: 'gauge',
    name: 'Indicador Circular',
    description: 'Gauge circular para valores',
    icon: 'Gauge',
    category: 'indicators',
    tags: ['gauge', 'circular', 'meter', 'dial'],
    defaultWidth: 80,
    defaultHeight: 80,
    defaultProps: {
      value: 70,
      max: 100,
      bgColor: defaultColor(40, 40, 60, 255),
      fillColor: defaultColor(0, 200, 255, 255),
      textColor: defaultColor(255, 255, 255, 128),
      label: 'SPD'
    },
    codeGenerator: (comp: PS2Component) => `// Circular Gauge (approximated with arcs)
const gauge_${comp.id.slice(0, 6)} = {
  x: ${comp.x + Math.floor(comp.width / 2)},
  y: ${comp.y + Math.floor(comp.height / 2)},
  radius: ${Math.floor(Math.min(comp.width, comp.height) / 2 - 4)},
  value: ${comp.props.value}, max: ${comp.props.max},
  
  draw: function() {
    // Background circle
    Draw.circle(this.x, this.y, this.radius, ${colorToAthena(comp.props.bgColor)}, true);
    
    // Simple fill representation (full circle colored by %)
    const fillRadius = this.radius * (this.value / this.max);
    Draw.circle(this.x, this.y, fillRadius, ${colorToAthena(comp.props.fillColor)}, true);
    
    // Center text
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = 0.6f;
    const txt = String(Math.floor((this.value / this.max) * 100));
    const tw = font.getTextSize(txt).width;
    font.print(this.x - tw / 2, this.y - 6, txt);
    
    font.scale = 0.5f;
    const lw = font.getTextSize("${comp.props.label}").width;
    font.print(this.x - lw / 2, this.y + 8, "${comp.props.label}");
  }
};
gauge_${comp.id.slice(0, 6)}.draw();`
  },

  // Loading Spinner
  {
    type: 'spinner',
    name: 'Indicador de Carga',
    description: 'Spinner animado de carga',
    icon: 'Loader',
    category: 'indicators',
    tags: ['loading', 'spinner', 'wait', 'animated'],
    defaultWidth: 48,
    defaultHeight: 48,
    defaultProps: {
      color: defaultColor(0, 200, 255, 255),
      segments: 8,
      speed: 0.1
    },
    codeGenerator: (comp: PS2Component) => `// Loading Spinner (animated)
const spinner_${comp.id.slice(0, 6)} = {
  x: ${comp.x + Math.floor(comp.width / 2)},
  y: ${comp.y + Math.floor(comp.height / 2)},
  radius: ${Math.floor(Math.min(comp.width, comp.height) / 2 - 4)},
  segments: ${comp.props.segments},
  rotation: 0,
  
  draw: function() {
    this.rotation += ${comp.props.speed};
    if (this.rotation >= 1) this.rotation = 0;
    
    const activeIdx = Math.floor(this.rotation * this.segments);
    
    for (let i = 0; i < this.segments; i++) {
      const angle = (i / this.segments) * Math.PI * 2;
      const dotX = this.x + Math.cos(angle) * this.radius;
      const dotY = this.y + Math.sin(angle) * this.radius;
      
      const alpha = i === activeIdx ? 255 : 80;
      Draw.circle(dotX, dotY, 4, Color.new(${comp.props.color.r}, ${comp.props.color.g}, ${comp.props.color.b}, alpha), true);
    }
  }
};
spinner_${comp.id.slice(0, 6)}.draw();`
  },

  // Status Badge
  {
    type: 'status-badge',
    name: 'Insignia de Estado',
    description: 'Indicador de estado con texto',
    icon: 'Badge',
    category: 'indicators',
    tags: ['status', 'badge', 'state', 'label'],
    defaultWidth: 100,
    defaultHeight: 26,
    defaultProps: {
      text: 'ONLINE',
      bgColor: defaultColor(0, 150, 80, 255),
      textColor: defaultColor(255, 255, 255, 128),
      showDot: true,
      dotColor: defaultColor(100, 255, 150, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Status Badge
Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});
${comp.props.showDot ? `Draw.circle(${comp.x + 12}, ${comp.y + Math.floor(comp.height / 2)}, 5, ${colorToAthena(comp.props.dotColor)}, true);` : ''}
font.color = ${colorToAthena(comp.props.textColor)};
font.scale = 0.75f;
font.print(${comp.x + (comp.props.showDot ? 22 : 8)}, ${comp.y + 6}, "${comp.props.text}");`
  },

  // Timer Display
  {
    type: 'timer',
    name: 'Temporizador',
    description: 'Display de tiempo MM:SS',
    icon: 'Timer',
    category: 'indicators',
    subcategory: 'Tiempo',
    tags: ['timer', 'time', 'countdown', 'clock'],
    defaultWidth: 120,
    defaultHeight: 40,
    defaultProps: {
      variableName: 'gameTime',
      bgColor: defaultColor(30, 30, 50, 255),
      textColor: defaultColor(255, 255, 0, 128),
      label: 'TIME',
      labelColor: defaultColor(150, 150, 180, 128),
      format: 'mm:ss'
    },
    codeGenerator: (comp: PS2Component) => `// Timer Display
Draw.rect(${comp.x}, ${comp.y}, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});

// Label
font.color = ${colorToAthena(comp.props.labelColor)};
font.scale = 0.6f;
font.print(${comp.x + 8}, ${comp.y + 4}, "${comp.props.label}");

// Time value
font.color = ${colorToAthena(comp.props.textColor)};
font.scale = 1.1f;
const totalSec_${comp.id.slice(0, 4)} = Math.floor(${comp.props.variableName} / 1000);
const mins = Math.floor(totalSec_${comp.id.slice(0, 4)} / 60);
const secs = totalSec_${comp.id.slice(0, 4)} % 60;
const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
font.print(${comp.x + 8}, ${comp.y + 16}, timeStr);`
  }
];
