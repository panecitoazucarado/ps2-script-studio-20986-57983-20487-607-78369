// Complete AthenaEnv API Implementation for Browser
// Maps PS2 APIs to Canvas 2D/3D operations
// Enhanced with full project file system integration

import { AthenaVirtualFS } from './AthenaVirtualFS';
import { createNativeModule } from './modules/NativeModule';
import { Vector4, Matrix4 } from './modules/MathModules';
import { createRenderModules } from './modules/RenderModules';
import { SCREEN_CONSTANTS, FONT_CONSTANTS } from './modules/ScreenConstants';
import { createTileMapModule } from './modules/TileMapModule';

export interface AthenaColor {
  r: number;
  g: number;
  b: number;
  a: number;
  toString(): string;
}

// Sound handle interface
interface SoundHandle {
  id: number;
  path: string;
  audio: HTMLAudioElement | null;
  loaded: boolean;
  volume: number;
}

export class AthenaEnvAPI {
  private canvas2D: HTMLCanvasElement;
  private ctx2D: CanvasRenderingContext2D;
  private canvas3D: HTMLCanvasElement;
  private vfs: AthenaVirtualFS;
  private onLog: (message: string) => void;
  private screenMode = {
    width: 640,
    height: 448,
    mode: 'NTSC',
    psm: 'CT32',
    zbuffering: false,
    psmz: 'Z16',
    double_buffering: true,
    interlace: 'PROGRESSIVE',
    field: 'FRAME'
  };
  private clearColor: AthenaColor = { r: 0, g: 0, b: 0, a: 255, toString: () => 'rgb(0,0,0)' };
  private frameCount = 0;
  private fpsCounter = { enabled: false, lastTime: 0, frames: 0, fps: 0 };
  private vsync = true;
  private timers: Map<number, any> = new Map();
  private nextTimerId = 1;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private keyState: Map<string, boolean> = new Map();
  private mouseState = { x: 0, y: 0, buttons: 0, wheel: 0 };
  private padState = {
    btns: 0,
    old_btns: 0,
    lx: 0,
    ly: 0,
    rx: 0,
    ry: 0
  };
  private keyboardBtns = 0; // raw keyboard state updated by events
  
  // Sound system
  private globalVolume = 100;
  private soundHandles: Map<number, SoundHandle> = new Map();
  private nextSoundId = 1;
  private audioContext: AudioContext | null = null;

  constructor(canvas2D: HTMLCanvasElement, canvas3D: HTMLCanvasElement, vfs: AthenaVirtualFS, onLog: (msg: string) => void) {
    this.canvas2D = canvas2D;
    this.canvas3D = canvas3D;
    this.ctx2D = canvas2D.getContext('2d')!;
    this.vfs = vfs;
    this.onLog = onLog;

    // Set default canvas size
    this.canvas2D.width = this.screenMode.width;
    this.canvas2D.height = this.screenMode.height;

    // Setup input handlers
    this.setupInputHandlers();
    
    // Initialize audio context
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      this.onLog('[WARN] AudioContext not available');
    }
  }

  // Reset API state and clear canvases
  reset() {
    // Reset state
    this.frameCount = 0;
    this.clearColor = { r: 0, g: 0, b: 0, a: 255, toString: () => 'rgb(0,0,0)' };
    this.fpsCounter = { enabled: false, lastTime: 0, frames: 0, fps: 0 };
    this.timers.clear();
    this.nextTimerId = 1;
    this.keyState.clear();
    this.mouseState = { x: 0, y: 0, buttons: 0, wheel: 0 };
    this.padState = { btns: 0, old_btns: 0, lx: 0, ly: 0, rx: 0, ry: 0 };
    
    // Stop all sounds
    this.soundHandles.forEach(handle => {
      if (handle.audio) {
        handle.audio.pause();
        handle.audio.currentTime = 0;
      }
    });
    this.soundHandles.clear();
    this.nextSoundId = 1;
    
    // Clear 2D canvas to black
    this.ctx2D.fillStyle = '#000000';
    this.ctx2D.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);
    
    // Clear 3D canvas
    const gl = this.canvas3D.getContext('webgl') || this.canvas3D.getContext('webgl2');
    if (gl) {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
  }

  private setupInputHandlers() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keyState.set(e.key, true);
      this.updatePadFromKeyboard();
    });

    window.addEventListener('keyup', (e) => {
      this.keyState.set(e.key, false);
      this.updatePadFromKeyboard();
    });

    // Mouse
    this.canvas2D.addEventListener('mousemove', (e) => {
      const rect = this.canvas2D.getBoundingClientRect();
      this.mouseState.x = e.clientX - rect.left;
      this.mouseState.y = e.clientY - rect.top;
    });

    this.canvas2D.addEventListener('mousedown', (e) => {
      this.mouseState.buttons |= (1 << e.button);
    });

    this.canvas2D.addEventListener('mouseup', (e) => {
      this.mouseState.buttons &= ~(1 << e.button);
    });

    this.canvas2D.addEventListener('wheel', (e) => {
      this.mouseState.wheel = e.deltaY;
    });

    // Gamepad API
    window.addEventListener('gamepadconnected', () => {
      // Gamepad state is polled per-frame in updatePadFrame()
    });
  }

  private updatePadFromKeyboard() {
    let btns = 0;

    // Map keyboard to PS2 buttons
    if (this.keyState.get('ArrowUp')) btns |= 0x0010;
    if (this.keyState.get('ArrowDown')) btns |= 0x0040;
    if (this.keyState.get('ArrowLeft')) btns |= 0x0080;
    if (this.keyState.get('ArrowRight')) btns |= 0x0020;
    if (this.keyState.get('Enter')) btns |= 0x0008; // START
    if (this.keyState.get('Shift')) btns |= 0x0001; // SELECT
    if (this.keyState.get('x') || this.keyState.get('X')) btns |= 0x4000; // CROSS
    if (this.keyState.get('c') || this.keyState.get('C')) btns |= 0x2000; // CIRCLE
    if (this.keyState.get('s') || this.keyState.get('S')) btns |= 0x8000; // SQUARE
    if (this.keyState.get('t') || this.keyState.get('T')) btns |= 0x1000; // TRIANGLE
    if (this.keyState.get('q') || this.keyState.get('Q')) btns |= 0x0400; // L1
    if (this.keyState.get('e') || this.keyState.get('E')) btns |= 0x0800; // R1
    if (this.keyState.get('1')) btns |= 0x0100; // L2
    if (this.keyState.get('3')) btns |= 0x0200; // R2

    // Only update raw keyboard state, NOT padState directly
    // padState.old_btns/btns are managed by pad.update()
    this.keyboardBtns = btns;
  }

  private getGamepadBtns(): { btns: number; lx: number; ly: number; rx: number; ry: number } {
    const gamepads = navigator.getGamepads();
    const pad = gamepads[0];
    let btns = 0;
    let lx = 0, ly = 0, rx = 0, ry = 0;
    
    if (pad) {
      if (pad.buttons[12]?.pressed) btns |= 0x0010; // UP
      if (pad.buttons[13]?.pressed) btns |= 0x0040; // DOWN
      if (pad.buttons[14]?.pressed) btns |= 0x0080; // LEFT
      if (pad.buttons[15]?.pressed) btns |= 0x0020; // RIGHT
      if (pad.buttons[9]?.pressed) btns |= 0x0008; // START
      if (pad.buttons[8]?.pressed) btns |= 0x0001; // SELECT
      if (pad.buttons[0]?.pressed) btns |= 0x4000; // CROSS
      if (pad.buttons[1]?.pressed) btns |= 0x2000; // CIRCLE
      if (pad.buttons[2]?.pressed) btns |= 0x8000; // SQUARE
      if (pad.buttons[3]?.pressed) btns |= 0x1000; // TRIANGLE
      if (pad.buttons[4]?.pressed) btns |= 0x0400; // L1
      if (pad.buttons[5]?.pressed) btns |= 0x0800; // R1
      if (pad.buttons[6]?.pressed) btns |= 0x0100; // L2
      if (pad.buttons[7]?.pressed) btns |= 0x0200; // R2

      lx = Math.round((pad.axes[0] || 0) * 128);
      ly = Math.round((pad.axes[1] || 0) * 128);
      rx = Math.round((pad.axes[2] || 0) * 128);
      ry = Math.round((pad.axes[3] || 0) * 128);
    }
    
    return { btns, lx, ly, rx, ry };
  }

  // Called once per frame by pad.update() — snapshots old state, merges keyboard + gamepad
  private updatePadFrame() {
    this.padState.old_btns = this.padState.btns;
    
    const gp = this.getGamepadBtns();
    this.padState.btns = this.keyboardBtns | gp.btns;
    this.padState.lx = gp.lx;
    this.padState.ly = gp.ly;
    this.padState.rx = gp.rx;
    this.padState.ry = gp.ry;
  }

  // Create complete API
  createAPI() {
    const self = this;

    // Color Module
    const Color = {
      new: (r: number, g: number, b: number, a: number = 255): AthenaColor => ({
        r, g, b, a,
        toString() { return `rgba(${this.r},${this.g},${this.b},${this.a / 255})`; }
      }),
      getR: (col: AthenaColor) => col.r,
      getG: (col: AthenaColor) => col.g,
      getB: (col: AthenaColor) => col.b,
      getA: (col: AthenaColor) => col.a,
      setR: (col: AthenaColor, r: number) => { col.r = r; },
      setG: (col: AthenaColor, g: number) => { col.g = g; },
      setB: (col: AthenaColor, b: number) => { col.b = b; },
      setA: (col: AthenaColor, a: number) => { col.a = a; }
    };

    // Screen parameters state
    const screenParams: Record<string, any> = {};

    // Screen Module
    const Screen = {
      clear: (color?: AthenaColor) => {
        const col = color || self.clearColor;
        self.ctx2D.fillStyle = col.toString();
        self.ctx2D.fillRect(0, 0, self.canvas2D.width, self.canvas2D.height);
      },
      flip: () => {
        self.frameCount++;
        if (self.fpsCounter.enabled) {
          self.fpsCounter.frames++;
        }
      },
      clearColor: (color: AthenaColor) => {
        self.clearColor = color;
      },
      display: (fn: Function) => {
        const loop = () => {
          Screen.clear();
          fn();
          Screen.flip();
          if (self.vsync) {
            requestAnimationFrame(loop);
          } else {
            setTimeout(loop, 0);
          }
        };
        loop();
      },
      getMode: () => ({ ...self.screenMode }),
      setMode: (mode: any) => {
        Object.assign(self.screenMode, mode);
        self.canvas2D.width = mode.width || self.screenMode.width;
        self.canvas2D.height = mode.height || self.screenMode.height;
      },
      setVSync: (enabled: boolean) => { self.vsync = enabled; },
      setFrameCounter: (enabled: boolean) => {
        self.fpsCounter.enabled = enabled;
        if (enabled) {
          self.fpsCounter.lastTime = Date.now();
          self.fpsCounter.frames = 0;
        }
      },
      getFPS: (interval: number = 1000) => {
        if (!self.fpsCounter.enabled) return 0;
        const now = Date.now();
        const elapsed = now - self.fpsCounter.lastTime;
        if (elapsed >= interval) {
          self.fpsCounter.fps = (self.fpsCounter.frames / elapsed) * 1000;
          self.fpsCounter.frames = 0;
          self.fpsCounter.lastTime = now;
        }
        return self.fpsCounter.fps;
      },
      getFreeVRAM: () => 4096 * 1024,
      getMemoryStats: (statId: number = 1) => {
        const stats = [4 * 1024 * 1024, 2 * 1024 * 1024, 512 * 1024, 1.5 * 1024 * 1024];
        return stats[statId] || 0;
      },
      waitVblankStart: () => { /* Mock */ },
      initBuffers: () => { /* Mock */ },
      resetBuffers: () => { /* Mock */ },
      getBuffer: (id: number) => null,
      setBuffer: (id: number, image: any, mask?: number) => { /* Mock */ },
      switchContext: () => 0,
      flush: () => { /* Mock */ },
      getParam: (param: string) => screenParams[param],
      setParam: (param: string, value: any) => { screenParams[param] = value; },
      alphaEquation: (a: number, b: number, c: number, d: number, fix: number) => {
        return { a, b, c, d, fix };
      },
      // All Screen constants
      ...SCREEN_CONSTANTS
    };

    // Draw Module
    const Draw = {
      point: (x: number, y: number, color: AthenaColor) => {
        self.ctx2D.fillStyle = color.toString();
        self.ctx2D.fillRect(x, y, 1, 1);
      },
      rect: (x: number, y: number, w: number, h: number, color: AthenaColor) => {
        self.ctx2D.fillStyle = color.toString();
        self.ctx2D.fillRect(x, y, w, h);
      },
      line: (x1: number, y1: number, x2: number, y2: number, color: AthenaColor) => {
        self.ctx2D.strokeStyle = color.toString();
        self.ctx2D.beginPath();
        self.ctx2D.moveTo(x1, y1);
        self.ctx2D.lineTo(x2, y2);
        self.ctx2D.stroke();
      },
      circle: (x: number, y: number, radius: number, color: AthenaColor, filled: boolean = true) => {
        self.ctx2D.beginPath();
        self.ctx2D.arc(x, y, radius, 0, Math.PI * 2);
        if (filled) {
          self.ctx2D.fillStyle = color.toString();
          self.ctx2D.fill();
        } else {
          self.ctx2D.strokeStyle = color.toString();
          self.ctx2D.stroke();
        }
      },
      triangle: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, 
                 c1: AthenaColor, c2?: AthenaColor, c3?: AthenaColor) => {
        self.ctx2D.beginPath();
        self.ctx2D.moveTo(x1, y1);
        self.ctx2D.lineTo(x2, y2);
        self.ctx2D.lineTo(x3, y3);
        self.ctx2D.closePath();
        self.ctx2D.fillStyle = c1.toString();
        self.ctx2D.fill();
      },
      quad: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number,
             c1: AthenaColor, c2?: AthenaColor, c3?: AthenaColor, c4?: AthenaColor) => {
        self.ctx2D.beginPath();
        self.ctx2D.moveTo(x1, y1);
        self.ctx2D.lineTo(x2, y2);
        self.ctx2D.lineTo(x3, y3);
        self.ctx2D.lineTo(x4, y4);
        self.ctx2D.closePath();
        self.ctx2D.fillStyle = c1.toString();
        self.ctx2D.fill();
      }
    };

    // Sound Module - Complete implementation with VFS integration
    const Sound = {
      load: (path: string): number => {
        const id = self.nextSoundId++;
        
        // Try to get asset from VFS
        const asset = self.vfs.getAsset(path);
        
        if (asset && asset.content) {
          // Create audio element
          const audio = new Audio();
          
          // If content is a data URL, use it directly
          if (typeof asset.content === 'string' && asset.content.startsWith('data:')) {
            audio.src = asset.content;
          } else if (typeof asset.content === 'string') {
            // Try to create a blob URL for text content
            const blob = new Blob([asset.content], { type: asset.mimeType });
            audio.src = URL.createObjectURL(blob);
          }
          
          const handle: SoundHandle = {
            id,
            path,
            audio,
            loaded: false,
            volume: self.globalVolume / 100
          };
          
          audio.oncanplaythrough = () => {
            handle.loaded = true;
            self.onLog(`[SOUND] Loaded: ${path}`);
          };
          
          audio.onerror = () => {
            self.onLog(`[SOUND] Simulated load for: ${path} (format not playable in browser)`);
            handle.loaded = true; // Mark as loaded even if can't play (for simulation)
          };
          
          audio.volume = handle.volume;
          self.soundHandles.set(id, handle);
        } else {
          // File not found - create placeholder handle
          self.onLog(`[SOUND] Loading: ${path} (file not in project, simulating)`);
          const handle: SoundHandle = {
            id,
            path,
            audio: null,
            loaded: true,
            volume: self.globalVolume / 100
          };
          self.soundHandles.set(id, handle);
        }
        
        return id;
      },
      
      play: (handle: number, channel?: number) => {
        const sound = self.soundHandles.get(handle);
        if (sound?.audio && sound.loaded) {
          sound.audio.currentTime = 0;
          sound.audio.play().catch(() => {
            // Silently handle autoplay restrictions
          });
        }
        // Log for simulation
        if (sound) {
          self.onLog(`[SOUND] Playing: ${sound.path}`);
        }
      },
      
      pause: (handle: number) => {
        const sound = self.soundHandles.get(handle);
        if (sound?.audio) {
          sound.audio.pause();
        }
      },
      
      resume: (handle: number) => {
        const sound = self.soundHandles.get(handle);
        if (sound?.audio) {
          sound.audio.play().catch(() => {});
        }
      },
      
      stop: (handle: number) => {
        const sound = self.soundHandles.get(handle);
        if (sound?.audio) {
          sound.audio.pause();
          sound.audio.currentTime = 0;
        }
      },
      
      free: (handle: number) => {
        const sound = self.soundHandles.get(handle);
        if (sound?.audio) {
          sound.audio.pause();
          if (sound.audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(sound.audio.src);
          }
        }
        self.soundHandles.delete(handle);
      },
      
      setVolume: (volume: number, channel?: number) => {
        if (channel === undefined) {
          self.globalVolume = Math.max(0, Math.min(100, volume));
          // Update all sounds
          self.soundHandles.forEach(sound => {
            if (sound.audio) {
              sound.audio.volume = self.globalVolume / 100;
            }
            sound.volume = self.globalVolume / 100;
          });
        }
      },
      
      getVolume: (channel?: number): number => {
        return self.globalVolume;
      },
      
      isPlaying: (handle: number): boolean => {
        const sound = self.soundHandles.get(handle);
        return sound?.audio ? !sound.audio.paused : false;
      },
      
      getDuration: (handle: number): number => {
        const sound = self.soundHandles.get(handle);
        return sound?.audio?.duration || 0;
      },
      
      getPosition: (handle: number): number => {
        const sound = self.soundHandles.get(handle);
        return sound?.audio?.currentTime || 0;
      },
      
      setPosition: (handle: number, position: number) => {
        const sound = self.soundHandles.get(handle);
        if (sound?.audio) {
          sound.audio.currentTime = position;
        }
      },
      
      loop: (handle: number, loop: boolean = true) => {
        const sound = self.soundHandles.get(handle);
        if (sound?.audio) {
          sound.audio.loop = loop;
        }
      }
    };

    // Font Module - Enhanced with VFS integration and alignment
    class Font {
      public color: AthenaColor = Color.new(255, 255, 255, 128);
      public scale: number = 1.0;
      public outline_color: AthenaColor = Color.new(0, 0, 0, 128);
      public outline: number = 0;
      public dropshadow_color: AthenaColor = Color.new(0, 0, 0, 128);
      public dropshadow: number = 0;
      public align: number = 0;
      private fontFamily: string = 'monospace';
      private loaded: boolean = false;

      // Static alignment constants
      static ALIGN_NONE = FONT_CONSTANTS.ALIGN_NONE;
      static ALIGN_TOP = FONT_CONSTANTS.ALIGN_TOP;
      static ALIGN_BOTTOM = FONT_CONSTANTS.ALIGN_BOTTOM;
      static ALIGN_LEFT = FONT_CONSTANTS.ALIGN_LEFT;
      static ALIGN_RIGHT = FONT_CONSTANTS.ALIGN_RIGHT;
      static ALIGN_VCENTER = FONT_CONSTANTS.ALIGN_VCENTER;
      static ALIGN_HCENTER = FONT_CONSTANTS.ALIGN_HCENTER;
      static ALIGN_CENTER = FONT_CONSTANTS.ALIGN_CENTER;

      constructor(path: string = 'default') {
        if (path === 'default' || !path) {
          this.fontFamily = 'monospace';
          this.loaded = true;
        } else {
          // Try to load font from VFS
          const asset = self.vfs.getAsset(path);
          
          if (asset && asset.content) {
            // Extract font name from path
            const fontName = path.replace(/\.(ttf|otf|woff|woff2)$/i, '').split('/').pop() || 'CustomFont';
            
            // If content is a data URL, we can use it
            if (typeof asset.content === 'string' && asset.content.startsWith('data:')) {
              const fontFace = new FontFace(fontName, `url(${asset.content})`);
              fontFace.load().then(loadedFace => {
                document.fonts.add(loadedFace);
                this.fontFamily = fontName;
                this.loaded = true;
                self.onLog(`[FONT] Loaded: ${path}`);
              }).catch(() => {
                self.onLog(`[FONT] Failed to load: ${path}, using fallback`);
                this.fontFamily = 'monospace';
                this.loaded = true;
              });
            } else {
              self.onLog(`[FONT] Simulating: ${path}`);
              this.fontFamily = 'monospace';
              this.loaded = true;
            }
          } else {
            self.onLog(`[FONT] Not found: ${path}, using fallback`);
            this.fontFamily = 'monospace';
            this.loaded = true;
          }
        }
      }

      print(x: number, y: number, text: string) {
        const fontSize = 16 * this.scale;
        self.ctx2D.font = `${fontSize}px ${this.fontFamily}`;
        const drawY = y + fontSize;

        // Dropshadow
        if (this.dropshadow > 0) {
          self.ctx2D.fillStyle = this.dropshadow_color.toString();
          self.ctx2D.fillText(text, x + this.dropshadow, drawY + this.dropshadow);
        }

        // Outline (simulated with stroke)
        if (this.outline > 0) {
          self.ctx2D.strokeStyle = this.outline_color.toString();
          self.ctx2D.lineWidth = this.outline;
          self.ctx2D.strokeText(text, x, drawY);
        }

        // Main text
        self.ctx2D.fillStyle = this.color.toString();
        self.ctx2D.fillText(text, x, drawY);
      }

      getTextSize(text: string): { width: number; height: number } {
        self.ctx2D.font = `${16 * this.scale}px ${this.fontFamily}`;
        const metrics = self.ctx2D.measureText(text);
        return {
          width: metrics.width,
          height: 16 * this.scale
        };
      }
    }

    // Image Module - Enhanced with VFS integration
    class Image {
      public width: number = 0;
      public height: number = 0;
      public startx: number = 0;
      public starty: number = 0;
      public endx: number = 0;
      public endy: number = 0;
      public angle: number = 0;
      public color: AthenaColor = Color.new(255, 255, 255, 128);
      public filter: 'LINEAR' | 'NEAREST' = 'NEAREST';
      private img: HTMLImageElement | null = null;
      private isReady: boolean = false;

      constructor(path: string, mode: string = 'RAM', asyncList?: any) {
        this.loadImage(path, asyncList);
      }

      private async loadImage(path: string, asyncList?: any) {
        // Check cache first
        const cached = self.imageCache.get(path);
        if (cached) {
          this.img = cached;
          this.width = this.img.width;
          this.height = this.img.height;
          this.endx = this.width;
          this.endy = this.height;
          this.isReady = true;
          return;
        }

        const img = new window.Image();
        
        img.onload = () => {
          this.img = img;
          this.width = img.width;
          this.height = img.height;
          this.endx = this.width;
          this.endy = this.height;
          this.isReady = true;
          self.imageCache.set(path, img);
          self.onLog(`[IMAGE] Loaded: ${path}`);
        };
        
        img.onerror = () => {
          self.onLog(`[IMAGE] Failed to load: ${path}`);
          this.isReady = true; // Mark as ready to prevent blocking
        };
        
        // Try to load from VFS
        const asset = self.vfs.getAsset(path);
        
        if (asset && asset.content) {
          // If content is a data URL, use it directly
          if (typeof asset.content === 'string' && asset.content.startsWith('data:')) {
            img.src = asset.content;
          } else if (typeof asset.content === 'string') {
            // Try to create a blob URL
            const blob = new Blob([asset.content], { type: asset.mimeType });
            img.src = URL.createObjectURL(blob);
          }
        } else {
          // Fallback to direct path (for external URLs)
          self.onLog(`[IMAGE] Not in project: ${path}, trying direct load`);
          img.src = path;
        }
      }

      draw(x: number, y: number) {
        if (!this.img || !this.isReady) return;

        self.ctx2D.save();
        self.ctx2D.translate(x, y);
        if (this.angle !== 0) {
          self.ctx2D.rotate(this.angle * Math.PI / 180);
        }
        self.ctx2D.globalAlpha = this.color.a / 255;
        
        self.ctx2D.drawImage(
          this.img,
          this.startx, this.starty,
          this.endx - this.startx, this.endy - this.starty,
          0, 0,
          this.width, this.height
        );
        
        self.ctx2D.restore();
      }

      ready(): boolean {
        return this.isReady;
      }

      optimize() { /* Mock */ }

      get size() { return this.width * this.height * 4; }
      get bpp() { return 32; }
      get delayed() { return false; }
      get pixels() { return new ArrayBuffer(0); }
    }

    // Pads Module
    const Pads = {
      SELECT: 0x0001,
      START: 0x0008,
      UP: 0x0010,
      RIGHT: 0x0020,
      DOWN: 0x0040,
      LEFT: 0x0080,
      L2: 0x0100,
      R2: 0x0200,
      L1: 0x0400,
      R1: 0x0800,
      TRIANGLE: 0x1000,
      CIRCLE: 0x2000,
      CROSS: 0x4000,
      SQUARE: 0x8000,
      
      get: (port: number = 0) => {
        return {
          btns: self.padState.btns,
          old_btns: self.padState.old_btns,
          lx: self.padState.lx,
          ly: self.padState.ly,
          rx: self.padState.rx,
          ry: self.padState.ry,
          update: () => { self.updatePadFrame(); },
          pressed: (btn: number) => (self.padState.btns & btn) !== 0,
          justPressed: (btn: number) => {
            return (self.padState.btns & btn) !== 0 && (self.padState.old_btns & btn) === 0;
          },
          setEventHandler: () => { /* Mock */ }
        };
      },
      
      DIGITAL: 0,
      ANALOG: 1,
      DUALSHOCK: 2,
      
      getType: () => 2, // Mock as DualShock
      getPressure: () => 255,
      rumble: () => { /* Mock */ },
      newEvent: () => 0,
      deleteEvent: () => {},
      PRESSED: 0,
      JUST_PRESSED: 1,
      NON_PRESSED: 2
    };

    // Timer Module
    const Timer = {
      new: () => {
        const id = self.nextTimerId++;
        self.timers.set(id, { start: Date.now(), paused: false, offset: 0 });
        return id;
      },
      getTime: (timer: number) => {
        const t = self.timers.get(timer);
        if (!t) return 0;
        return t.paused ? t.offset : Date.now() - t.start + t.offset;
      },
      setTime: (timer: number, value: number) => {
        const t = self.timers.get(timer);
        if (t) {
          t.start = Date.now();
          t.offset = value;
        }
      },
      pause: (timer: number) => {
        const t = self.timers.get(timer);
        if (t && !t.paused) {
          t.offset = Date.now() - t.start + t.offset;
          t.paused = true;
        }
      },
      resume: (timer: number) => {
        const t = self.timers.get(timer);
        if (t && t.paused) {
          t.start = Date.now();
          t.paused = false;
        }
      },
      reset: (timer: number) => {
        const t = self.timers.get(timer);
        if (t) {
          t.start = Date.now();
          t.offset = 0;
        }
      },
      destroy: (timer: number) => {
        self.timers.delete(timer);
      },
      isPlaying: (timer: number) => {
        const t = self.timers.get(timer);
        return t ? !t.paused : false;
      }
    };

    // System Module  
    const System = {
      listDir: (path: string) => {
        const files = self.vfs.readdir(path);
        if (!files) return [];
        return files.map(name => {
          const stat = self.vfs.stat(path + '/' + name);
          return {
            name,
            size: stat?.size || 0,
            directory: (stat?.mode & 0o040000) !== 0
          };
        });
      },
      removeDirectory: (path: string) => self.vfs.remove(path),
      copyFile: () => { /* Mock */ },
      moveFile: () => { /* Mock */ },
      rename: () => { /* Mock */ },
      sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms * 1000)),
      exitToBrowser: () => { self.onLog('[SYSTEM] Exit to browser'); },
      setDarkMode: () => { /* Mock */ },
      getTemperature: () => ({ ee: 45.0, board: 40.0 }),
      getMCInfo: () => ({ type: 0, freemem: 8192, format: 0 }),
      getCPUInfo: () => ({
        implementation: 0x2e,
        revision: 0x10,
        FPUimplementation: 0,
        FPUrevision: 0,
        ICacheSize: 16384,
        DCacheSize: 8192,
        RAMSize: 32 * 1024 * 1024,
        MachineSize: 0
      }),
      getGPUInfo: () => ({ id: 0x12, revision: 0x20 }),
      getMemoryStats: () => ({
        core: 1024 * 1024,
        nativeStack: 256 * 1024,
        allocs: 4 * 1024 * 1024,
        used: 5 * 1024 * 1024
      })
    };

    // std Module
    const std = {
      loadFile: (path: string) => {
        const content = self.vfs.readFile(path);
        return typeof content === 'string' ? content : null;
      },
      loadScript: (path: string) => {
        const content = std.loadFile(path);
        if (content) {
          try {
            eval(content);
          } catch (e) {
            self.onLog(`[ERROR] ${e}`);
          }
        }
      },
      evalScript: (code: string) => {
        try {
          eval(code);
        } catch (e) {
          self.onLog(`[ERROR] ${e}`);
        }
      },
      exists: (path: string) => self.vfs.exists(path),
      SEEK_SET: 0,
      SEEK_CUR: 1,
      SEEK_END: 2,
      reload: (script: string) => {
        self.onLog('[SYSTEM] Reloading script...');
        std.loadScript(script);
      }
    };

    // os Module - with POSIX-like file operations and open flags
    const os = {
      setInterval: (fn: Function, ms: number) => setInterval(fn, ms),
      clearInterval: (id: number) => clearInterval(id),
      setTimeout: (fn: Function, ms: number) => setTimeout(fn, ms),
      clearTimeout: (id: number) => clearTimeout(id),
      setImmediate: (fn: Function) => setTimeout(fn, 0),
      clearImmediate: (id: number) => clearTimeout(id),
      sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
      platform: 'ps2',
      open: (path: string, flags: string) => self.vfs.open(path, flags),
      close: (fd: number) => self.vfs.close(fd),
      read: (fd: number, length: number) => self.vfs.read(fd, length),
      write: (fd: number, data: any) => self.vfs.write(fd, data),
      remove: (path: string) => self.vfs.remove(path),
      rename: (oldName: string, newName: string) => { self.onLog(`[OS] rename: ${oldName} -> ${newName}`); return 0; },
      realpath: (path: string) => [path, 0],
      mkdir: (path: string) => self.vfs.mkdir(path),
      readdir: (path: string) => {
        const files = self.vfs.readdir(path);
        return [files || [], files ? 0 : -1];
      },
      stat: (path: string) => [self.vfs.stat(path), 0],
      lstat: (path: string) => [self.vfs.stat(path), 0],
      utimes: () => 0,
      getcwd: () => [self.vfs.getcwd(), 0],
      chdir: (path: string) => self.vfs.chdir(path),
      setReadHandler: () => { /* Mock */ },
      setWriteHandler: () => { /* Mock */ },
      // Open flags
      O_RDONLY: 'r',
      O_WRONLY: 'w',
      O_RDWR: 'rw',
      O_APPEND: 'a',
      O_CREAT: 'w',
      O_EXCL: 'wx',
      O_TRUNC: 'w',
      // Stat constants
      S_IFMT: 0o170000,
      S_IFIFO: 0o010000,
      S_IFCHR: 0o020000,
      S_IFDIR: 0o040000,
      S_IFBLK: 0o060000,
      S_IFREG: 0o100000,
      S_IFSOCK: 0o140000,
      S_IFLNK: 0o120000,
      S_ISGID: 0o002000,
      S_ISUID: 0o004000,
    };

    // Create all new modules
    const Native = createNativeModule(self.onLog);
    const renderModules = createRenderModules(self.ctx2D, self.onLog);
    const TileMap = createTileMapModule(self.ctx2D, self.onLog);

    // Additional stub modules
    const Archive = {
      extract: (path: string, dest: string) => { self.onLog(`[ARCHIVE] Extract: ${path} -> ${dest}`); return true; },
      list: (path: string) => { return []; },
    };

    const IOP = {
      loadModule: (path: string) => { self.onLog(`[IOP] Module loaded: ${path}`); return 0; },
      reset: () => { self.onLog('[IOP] Reset'); },
    };

    const Network = {
      init: () => { self.onLog('[NETWORK] Initialized'); return true; },
      get: (url: string) => fetch(url).then(r => r.text()).catch(() => ''),
      post: (url: string, data: string) => fetch(url, { method: 'POST', body: data }).then(r => r.text()).catch(() => ''),
      download: (url: string, dest: string) => { self.onLog(`[NETWORK] Download: ${url}`); return true; },
      deinit: () => {},
    };

    const Socket = {
      create: () => ({ send: () => {}, close: () => {}, onmessage: null }),
    };

    const Keyboard = {
      get: () => ({
        pressed: (key: number) => self.keyState.get(String.fromCharCode(key)) || false,
        getChar: () => '',
      }),
    };

    const Mouse = {
      get: () => ({
        x: self.mouseState.x,
        y: self.mouseState.y,
        buttons: self.mouseState.buttons,
        wheel: self.mouseState.wheel,
      }),
    };

    const Video = {
      load: (path: string) => { self.onLog(`[VIDEO] Load: ${path}`); return 0; },
      play: () => {},
      pause: () => {},
      stop: () => {},
      free: () => {},
    };

    const Shadows = {
      create: () => ({ update: () => {}, render: () => {} }),
    };

    // Console
    const console = {
      log: (...args: any[]) => self.onLog(`[LOG] ${args.join(' ')}`),
      error: (...args: any[]) => self.onLog(`[ERROR] ${args.join(' ')}`),
      warn: (...args: any[]) => self.onLog(`[WARN] ${args.join(' ')}`)
    };

    // ImageList class
    class ImageList {
      private queue: any[] = [];
      process() { /* mock async image loading */ }
    }

    // Constants
    const RAM = 'RAM';
    const VRAM = 'VRAM';
    const Z16 = 'Z16';
    const Z16S = 'Z16S';
    const Z24 = 'Z24';
    const Z32 = 'Z32';
    const LINEAR = 'LINEAR';
    const NEAREST = 'NEAREST';
    const FontAlign = FONT_CONSTANTS;

    return {
      // Core modules
      Color,
      Screen,
      Draw,
      Sound,
      Font,
      Image,
      ImageList,
      Pads,
      Timer,
      System,
      std,
      os,
      console,
      
      // Math
      Vector4,
      Matrix4,
      Math: {
        ...Math,
        fround: Math.fround || ((x: number) => x),
        // Extended PS2 math functions
        clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
        lerp: (a: number, b: number, t: number) => a + (b - a) * t,
        saturate: (x: number) => Math.min(Math.max(x, 0), 1),
        step: (edge: number, x: number) => x >= edge ? 1 : 0,
        smoothstep: (e0: number, e1: number, x: number) => {
          const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
          return t * t * (3 - 2 * t);
        },
        rsqrt: (x: number) => 1 / Math.sqrt(x),
        fma: (a: number, b: number, c: number) => a * b + c,
      },
      
      // Native compilation (mock)
      Native,
      
      // 3D Rendering
      Render: renderModules.Render,
      RenderData: renderModules.RenderData,
      RenderObject: renderModules.RenderObject,
      AnimCollection: renderModules.AnimCollection,
      Camera: renderModules.Camera,
      Lights: renderModules.Lights,
      Batch: renderModules.Batch,
      SceneNode: renderModules.SceneNode,
      AsyncLoader: renderModules.AsyncLoader,
      
      // TileMap
      TileMap,
      
      // Additional modules
      Archive,
      IOP,
      Network,
      Socket,
      Keyboard,
      Mouse,
      Video,
      Shadows,
      
      // Constants
      RAM,
      VRAM,
      Z16,
      Z16S,
      Z24,
      Z32,
      LINEAR,
      NEAREST,
      FontAlign,
    };
  }

  getCanvas2D() {
    return this.canvas2D;
  }

  getCanvas3D() {
    return this.canvas3D;
  }

  getFrameCount() {
    return this.frameCount;
  }
}
