// PS2 Visual Builder - Advanced Templates
// TileMap, Timer, System info, 3D elements based on AthenaEnv

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const advancedTemplates: ComponentTemplate[] = [
  // TileMap Display
  {
    type: 'tilemap',
    name: 'TileMap',
    description: 'Renderizado de tilemap VU1 acelerado',
    icon: 'Grid2x2',
    category: 'advanced',
    tags: ['tilemap', 'tiles', 'map', 'vu1'],
    defaultWidth: 320,
    defaultHeight: 224,
    defaultProps: {
      tilesWide: 10,
      tilesHigh: 7,
      tileSize: 32,
      texturePath: 'assets/tileset.png'
    },
    codeGenerator: (comp: PS2Component) => `// TileMap Component (VU1 accelerated)
// See docs/TILEMAP.md for full API

const tileTexture_${comp.id.slice(0, 6)} = new Image("${comp.props.texturePath}");

const descriptor_${comp.id.slice(0, 6)} = TileMap.Descriptor({
  textures: [tileTexture_${comp.id.slice(0, 6)}],
  materials: [
    { texture_index: 0, blend_mode: 0, end_offset: ${comp.props.tilesWide * comp.props.tilesHigh} }
  ]
});

// Create sprite buffer for tiles
const spriteBuffer_${comp.id.slice(0, 6)} = TileMap.SpriteBuffer.create(${comp.props.tilesWide * comp.props.tilesHigh});

const tilemap_${comp.id.slice(0, 6)} = TileMap.Instance({
  descriptor: descriptor_${comp.id.slice(0, 6)},
  spriteBuffer: spriteBuffer_${comp.id.slice(0, 6)}
});

// Render at position
// TileMap.begin();
// TileMap.setCamera(0, 0);
tilemap_${comp.id.slice(0, 6)}.render(${comp.x}, ${comp.y});`
  },

  // System Info Display
  {
    type: 'system-info',
    name: 'Info del Sistema',
    description: 'Muestra CPU, memoria, temperatura',
    icon: 'Cpu',
    category: 'advanced',
    tags: ['system', 'cpu', 'memory', 'debug'],
    defaultWidth: 200,
    defaultHeight: 100,
    defaultProps: {
      showCPU: true,
      showMemory: true,
      showTemperature: true,
      bgColor: defaultColor(20, 25, 35, 230),
      labelColor: defaultColor(150, 150, 180, 128),
      valueColor: defaultColor(0, 255, 200, 128)
    },
    codeGenerator: (comp: PS2Component) => `// System Info Display
const sysInfo_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  
  draw: function() {
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    let yOffset = 8;
    font.scale = 0.7f;
    
    ${comp.props.showCPU ? `// CPU Info
    const cpuInfo = System.getCPUInfo();
    font.color = ${colorToAthena(comp.props.labelColor)};
    font.print(this.x + 8, this.y + yOffset, "CPU:");
    font.color = ${colorToAthena(comp.props.valueColor)};
    font.print(this.x + 50, this.y + yOffset, "EE R5900 @ 295MHz");
    yOffset += 16;` : ''}
    
    ${comp.props.showMemory ? `// Memory Stats
    const memStats = System.getMemoryStats();
    font.color = ${colorToAthena(comp.props.labelColor)};
    font.print(this.x + 8, this.y + yOffset, "RAM:");
    font.color = ${colorToAthena(comp.props.valueColor)};
    font.print(this.x + 50, this.y + yOffset, (memStats.used / 1024 / 1024).toFixed(1) + " MB used");
    yOffset += 16;` : ''}
    
    ${comp.props.showTemperature ? `// Temperature (SCPH-500XX+)
    const temps = System.getTemperature();
    font.color = ${colorToAthena(comp.props.labelColor)};
    font.print(this.x + 8, this.y + yOffset, "Temp:");
    font.color = ${colorToAthena(comp.props.valueColor)};
    font.print(this.x + 50, this.y + yOffset, temps.ee.toFixed(1) + "°C");` : ''}
  }
};
sysInfo_${comp.id.slice(0, 6)}.draw();`
  },

  // Timer Manager
  {
    type: 'timer-manager',
    name: 'Gestor Timer',
    description: 'Timer separado con control',
    icon: 'Clock',
    category: 'advanced',
    subcategory: 'Tiempo',
    tags: ['timer', 'clock', 'time', 'manager'],
    defaultWidth: 160,
    defaultHeight: 50,
    defaultProps: {
      timerName: 'gameTimer',
      bgColor: defaultColor(25, 30, 45, 255),
      textColor: defaultColor(255, 255, 255, 128),
      accentColor: defaultColor(0, 200, 255, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Timer Manager Component
// Using AthenaEnv Timer module

const ${comp.props.timerName}_id = Timer.new();

const timerUI_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  timerId: ${comp.props.timerName}_id,
  
  draw: function() {
    Draw.rect(this.x, this.y, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});
    
    const elapsed = Timer.getTime(this.timerId);
    const secs = Math.floor(elapsed / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    
    const timeStr = String(hours).padStart(2, '0') + ':' + 
                    String(mins % 60).padStart(2, '0') + ':' + 
                    String(secs % 60).padStart(2, '0');
    
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = 1.2f;
    font.print(this.x + 10, this.y + 14, timeStr);
    
    // Playing indicator
    if (Timer.isPlaying(this.timerId)) {
      Draw.circle(this.x + ${comp.width - 20}, this.y + ${Math.floor(comp.height / 2)}, 6, ${colorToAthena(comp.props.accentColor)}, true);
    }
  },
  
  pause: function() { Timer.pause(this.timerId); },
  resume: function() { Timer.resume(this.timerId); },
  reset: function() { Timer.reset(this.timerId); }
};
timerUI_${comp.id.slice(0, 6)}.draw();`
  },

  // Pad Input Display
  {
    type: 'pad-display',
    name: 'Display de Control',
    description: 'Visualiza estado del gamepad',
    icon: 'Gamepad2',
    category: 'advanced',
    subcategory: 'Input',
    tags: ['pad', 'gamepad', 'controller', 'input'],
    defaultWidth: 200,
    defaultHeight: 120,
    defaultProps: {
      port: 0,
      bgColor: defaultColor(25, 25, 45, 255),
      buttonColor: defaultColor(80, 80, 120, 255),
      activeColor: defaultColor(0, 200, 100, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Pad Input Display
const padDisplay_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  port: ${comp.props.port},
  
  draw: function() {
    const pad = Pads.get(this.port);
    
    Draw.rect(this.x, this.y, ${comp.width}, ${comp.height}, ${colorToAthena(comp.props.bgColor)});
    
    // D-Pad
    const dpadX = this.x + 30, dpadY = this.y + 60;
    this.drawBtn(dpadX, dpadY - 15, pad.pressed(Pads.UP));
    this.drawBtn(dpadX, dpadY + 15, pad.pressed(Pads.DOWN));
    this.drawBtn(dpadX - 15, dpadY, pad.pressed(Pads.LEFT));
    this.drawBtn(dpadX + 15, dpadY, pad.pressed(Pads.RIGHT));
    
    // Face buttons
    const faceX = this.x + 160, faceY = this.y + 60;
    this.drawBtn(faceX, faceY - 15, pad.pressed(Pads.TRIANGLE)); // Triangle
    this.drawBtn(faceX, faceY + 15, pad.pressed(Pads.CROSS));    // Cross
    this.drawBtn(faceX - 15, faceY, pad.pressed(Pads.SQUARE));   // Square
    this.drawBtn(faceX + 15, faceY, pad.pressed(Pads.CIRCLE));   // Circle
    
    // Analog sticks position
    font.color = Color.new(150, 150, 180, 128);
    font.scale = 0.5f;
    font.print(this.x + 8, this.y + 8, "LX:" + pad.lx + " LY:" + pad.ly);
    font.print(this.x + 8, this.y + 20, "RX:" + pad.rx + " RY:" + pad.ry);
  },
  
  drawBtn: function(x, y, pressed) {
    const col = pressed 
      ? ${colorToAthena(comp.props.activeColor)}
      : ${colorToAthena(comp.props.buttonColor)};
    Draw.circle(x, y, 8, col, true);
  }
};
padDisplay_${comp.id.slice(0, 6)}.draw();`
  },

  // 3D Render Viewport
  {
    type: '3d-viewport',
    name: 'Vista 3D',
    description: 'Viewport para renderizado 3D VU1',
    icon: 'Box',
    category: 'advanced',
    subcategory: '3D',
    tags: ['3d', 'render', 'viewport', 'vu1'],
    defaultWidth: 320,
    defaultHeight: 240,
    defaultProps: {
      bgColor: defaultColor(10, 15, 25, 255),
      borderColor: defaultColor(60, 80, 140, 255),
      fov: 60,
      nearClip: 1.0,
      farClip: 2000.0
    },
    codeGenerator: (comp: PS2Component) => `// 3D Viewport Component
// Configure Screen for z-buffering before 3D rendering:
// const canvas = Screen.getMode();
// canvas.zbuffering = true;
// canvas.psmz = Screen.Z16S;
// Screen.setMode(canvas);

const viewport3D_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  fov: ${comp.props.fov},
  nearClip: ${comp.props.nearClip},
  farClip: ${comp.props.farClip},
  
  setup: function() {
    Render.init();
    Render.setView(this.fov, this.nearClip, this.farClip, this.width, this.height);
  },
  
  draw: function() {
    // Background for viewport area
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    // Start render pass
    Render.begin();
    
    // Update camera
    Camera.update();
    
    // Your 3D rendering code here:
    // const model = new RenderObject(modelData);
    // model.render();
    
    // Border
    Draw.line(this.x, this.y, this.x + this.width, this.y, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y, this.x + this.width, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y + this.height, this.x, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x, this.y + this.height, this.x, this.y, ${colorToAthena(comp.props.borderColor)});
  }
};
// viewport3D_${comp.id.slice(0, 6)}.setup();
viewport3D_${comp.id.slice(0, 6)}.draw();`
  },

  // File Browser
  {
    type: 'file-browser',
    name: 'Explorador de Archivos',
    description: 'Lista de archivos/carpetas del sistema',
    icon: 'FolderOpen',
    category: 'advanced',
    subcategory: 'Sistema',
    tags: ['file', 'browser', 'system', 'directory'],
    defaultWidth: 280,
    defaultHeight: 200,
    defaultProps: {
      rootPath: 'mass0:/',
      bgColor: defaultColor(20, 22, 35, 255),
      itemColor: defaultColor(200, 200, 220, 128),
      folderColor: defaultColor(255, 220, 100, 128),
      selectedBg: defaultColor(0, 80, 160, 255),
      borderColor: defaultColor(50, 60, 90, 255)
    },
    codeGenerator: (comp: PS2Component) => `// File Browser Component
const fileBrowser_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  currentPath: "${comp.props.rootPath}",
  items: [],
  selectedIndex: 0,
  scrollOffset: 0,
  itemHeight: 24,
  
  refresh: function() {
    this.items = System.listDir(this.currentPath);
  },
  
  draw: function() {
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    // Path header
    Draw.rect(this.x, this.y, this.width, 24, Color.new(40, 45, 65, 255));
    font.color = Color.new(150, 150, 180, 128);
    font.scale = 0.65f;
    font.print(this.x + 6, this.y + 5, this.currentPath);
    
    // File list
    const listY = this.y + 28;
    const visibleCount = Math.floor((this.height - 32) / this.itemHeight);
    
    for (let i = 0; i < Math.min(visibleCount, this.items.length); i++) {
      const idx = i + this.scrollOffset;
      if (idx >= this.items.length) break;
      
      const item = this.items[idx];
      const itemY = listY + i * this.itemHeight;
      const isSelected = idx === this.selectedIndex;
      
      if (isSelected) {
        Draw.rect(this.x, itemY, this.width, this.itemHeight, ${colorToAthena(comp.props.selectedBg)});
      }
      
      font.color = item.directory 
        ? ${colorToAthena(comp.props.folderColor)}
        : ${colorToAthena(comp.props.itemColor)};
      font.scale = 0.7f;
      font.print(this.x + 8, itemY + 4, (item.directory ? "[" : "") + item.name + (item.directory ? "]" : ""));
    }
    
    // Border
    Draw.line(this.x, this.y, this.x + this.width, this.y, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y, this.x + this.width, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x + this.width, this.y + this.height, this.x, this.y + this.height, ${colorToAthena(comp.props.borderColor)});
    Draw.line(this.x, this.y + this.height, this.x, this.y, ${colorToAthena(comp.props.borderColor)});
  }
};
fileBrowser_${comp.id.slice(0, 6)}.refresh();
fileBrowser_${comp.id.slice(0, 6)}.draw();`
  }
];
