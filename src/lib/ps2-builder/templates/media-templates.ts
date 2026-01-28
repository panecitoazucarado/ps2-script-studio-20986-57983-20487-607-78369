// PS2 Visual Builder - Media Templates
// Video, audio, animations based on AthenaEnv

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const mediaTemplates: ComponentTemplate[] = [
  // Video Player
  {
    type: 'video-player',
    name: 'Reproductor Video',
    description: 'MPEG-1/2 video playback (Video module)',
    icon: 'Play',
    category: 'media',
    tags: ['video', 'mpeg', 'player', 'movie'],
    defaultWidth: 320,
    defaultHeight: 240,
    defaultProps: {
      src: 'videos/intro.pss',
      autoPlay: false,
      loop: false,
      showControls: true,
      bgColor: defaultColor(0, 0, 0, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Video Player Component (MPEG-1/2)
// Note: Requires Video module initialization

const video_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  src: "${comp.props.src}",
  isPlaying: ${comp.props.autoPlay},
  loop: ${comp.props.loop},
  
  // TODO: Initialize video with Video module when ready
  // const vid = new Video(this.src);
  
  draw: function() {
    // Placeholder background
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    ${comp.props.showControls ? `// Simple controls UI
    const ctrlY = this.y + this.height - 30;
    Draw.rect(this.x, ctrlY, this.width, 30, Color.new(0, 0, 0, 180));
    
    // Play/Pause icon placeholder
    if (this.isPlaying) {
      Draw.rect(this.x + 10, ctrlY + 8, 5, 14, Color.new(255, 255, 255, 200));
      Draw.rect(this.x + 18, ctrlY + 8, 5, 14, Color.new(255, 255, 255, 200));
    } else {
      Draw.triangle(this.x + 10, ctrlY + 6, this.x + 10, ctrlY + 24, this.x + 26, ctrlY + 15, Color.new(255, 255, 255, 200));
    }
    
    font.color = Color.new(200, 200, 200, 128);
    font.scale = 0.6f;
    font.print(this.x + 36, ctrlY + 10, "00:00 / 00:00");` : ''}
  },
  
  play: function() { this.isPlaying = true; },
  pause: function() { this.isPlaying = false; },
  stop: function() { this.isPlaying = false; }
};
video_${comp.id.slice(0, 6)}.draw();`
  },

  // Audio Visualizer
  {
    type: 'audio-viz',
    name: 'Visualizador Audio',
    description: 'Barras de visualización de audio',
    icon: 'AudioLines',
    category: 'media',
    tags: ['audio', 'visualizer', 'music', 'bars'],
    defaultWidth: 200,
    defaultHeight: 60,
    defaultProps: {
      bars: 16,
      barWidth: 8,
      gap: 4,
      baseColor: defaultColor(0, 150, 255, 255),
      peakColor: defaultColor(255, 100, 100, 255),
      bgColor: defaultColor(20, 20, 40, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Audio Visualizer (decorative - connect to Sound module for real data)
const audioViz_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  bars: ${comp.props.bars},
  barWidth: ${comp.props.barWidth},
  gap: ${comp.props.gap},
  levels: new Array(${comp.props.bars}).fill(0),
  
  draw: function() {
    Draw.rect(this.x, this.y, this.width, this.height, ${colorToAthena(comp.props.bgColor)});
    
    for (let i = 0; i < this.bars; i++) {
      const barX = this.x + i * (this.barWidth + this.gap);
      // Simulate random levels for demo
      const level = Math.random() * 0.8 + 0.2;
      const barH = this.height * level;
      const barY = this.y + this.height - barH;
      
      // Gradient effect: base to peak
      const isPeak = level > 0.8;
      const barCol = isPeak 
        ? ${colorToAthena(comp.props.peakColor)}
        : ${colorToAthena(comp.props.baseColor)};
      
      Draw.rect(barX, barY, this.barWidth, barH, barCol);
    }
  }
};
audioViz_${comp.id.slice(0, 6)}.draw();`
  },

  // Animated Sprite
  {
    type: 'animated-sprite',
    name: 'Sprite Animado',
    description: 'Sprite con animación de frames',
    icon: 'Film',
    category: 'media',
    tags: ['animation', 'sprite', 'frames', 'animated'],
    defaultWidth: 64,
    defaultHeight: 64,
    defaultProps: {
      src: 'assets/spritesheet.png',
      frameWidth: 64,
      frameHeight: 64,
      framesPerRow: 4,
      totalFrames: 8,
      fps: 12,
      loop: true
    },
    codeGenerator: (comp: PS2Component) => `// Animated Sprite Component
const animSprite_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  sprite: null, // Will be new Image("${comp.props.src}")
  frameWidth: ${comp.props.frameWidth},
  frameHeight: ${comp.props.frameHeight},
  framesPerRow: ${comp.props.framesPerRow},
  totalFrames: ${comp.props.totalFrames},
  currentFrame: 0,
  fps: ${comp.props.fps},
  loop: ${comp.props.loop},
  lastFrameTime: 0,
  
  init: function() {
    this.sprite = new Image("${comp.props.src}");
    this.sprite.width = ${comp.width};
    this.sprite.height = ${comp.height};
  },
  
  update: function(currentTime) {
    const frameDelay = 1000 / this.fps;
    if (currentTime - this.lastFrameTime >= frameDelay) {
      this.currentFrame++;
      if (this.currentFrame >= this.totalFrames) {
        this.currentFrame = this.loop ? 0 : this.totalFrames - 1;
      }
      this.lastFrameTime = currentTime;
    }
  },
  
  draw: function() {
    if (!this.sprite || !this.sprite.ready()) return;
    
    const col = this.currentFrame % this.framesPerRow;
    const row = Math.floor(this.currentFrame / this.framesPerRow);
    
    this.sprite.startx = col * this.frameWidth;
    this.sprite.starty = row * this.frameHeight;
    this.sprite.endx = this.sprite.startx + this.frameWidth;
    this.sprite.endy = this.sprite.starty + this.frameHeight;
    
    this.sprite.draw(this.x, this.y);
  }
};
// animSprite_${comp.id.slice(0, 6)}.init();
animSprite_${comp.id.slice(0, 6)}.draw();`
  },

  // Sound Effect Button
  {
    type: 'sfx-button',
    name: 'Botón con Sonido',
    description: 'Botón que reproduce efecto de sonido',
    icon: 'Volume2',
    category: 'media',
    subcategory: 'Audio',
    tags: ['sound', 'sfx', 'button', 'audio'],
    defaultWidth: 140,
    defaultHeight: 40,
    defaultProps: {
      text: 'Play Sound',
      soundPath: 'sounds/click.adpcm',
      bgColor: defaultColor(60, 40, 100, 255),
      textColor: defaultColor(255, 255, 255, 128),
      iconColor: defaultColor(200, 150, 255, 255)
    },
    codeGenerator: (comp: PS2Component) => `// Sound Effect Button
const sfxBtn_${comp.id.slice(0, 6)} = {
  x: ${comp.x}, y: ${comp.y},
  width: ${comp.width}, height: ${comp.height},
  text: "${comp.props.text}",
  selected: false,
  // sound: Sound.load("${comp.props.soundPath}"),
  
  draw: function() {
    const bg = this.selected 
      ? Color.new(80, 60, 140, 255) 
      : ${colorToAthena(comp.props.bgColor)};
    Draw.rect(this.x, this.y, this.width, this.height, bg);
    
    // Speaker icon (simplified)
    Draw.rect(this.x + 10, this.y + 14, 8, 12, ${colorToAthena(comp.props.iconColor)});
    Draw.triangle(
      this.x + 18, this.y + 10,
      this.x + 18, this.y + 30,
      this.x + 30, this.y + 20,
      ${colorToAthena(comp.props.iconColor)}
    );
    
    // Text
    font.color = ${colorToAthena(comp.props.textColor)};
    font.scale = 0.85f;
    font.print(this.x + 38, this.y + 12, this.text);
  },
  
  play: function() {
    // Sound.play(this.sound);
  }
};
sfxBtn_${comp.id.slice(0, 6)}.draw();`
  }
];
