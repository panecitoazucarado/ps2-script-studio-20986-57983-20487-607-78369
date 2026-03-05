import { useState } from 'react';
import { 
  Gamepad2, Code2, Image as ImageIcon, Music, Monitor, Cpu, 
  Box, Type, Layers, Network, Timer, Keyboard, Mouse, Archive,
  Play, FileCode, GitBranch, FolderOpen, Palette, Zap, 
  ChevronRight, ExternalLink, Sparkles, Terminal, BookOpen,
  Rocket, Shield, Globe, Film
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AthenaWelcomeTabProps {
  onCreateFile: (name: string, content: string) => void;
  onCloneRepo: () => void;
  onImportProject: () => void;
  onOpenVisualBuilder: () => void;
}

const QUICK_START_TEMPLATES = [
  {
    name: 'Hello World',
    icon: Rocket,
    description: 'Programa básico con texto y gráficos',
    color: 'text-[hsl(var(--ps2-green))]',
    code: `// Hello World - AthenaEnv
const font = new Font("default");

os.setInterval(() => {
  Screen.clear(Color.new(0, 32, 64, 255));
  
  font.color = Color.new(0, 255, 255, 255);
  font.scale = 2.0;
  font.print(50, 50, "Hello World!");
  
  font.color = Color.new(255, 255, 255, 128);
  font.scale = 1.0;
  font.print(50, 100, "Welcome to AthenaEnv on PS2");
  
  Draw.rect(50, 150, 200, 4, Color.new(0, 255, 255, 128));
  
  Screen.flip();
}, 0);`
  },
  {
    name: 'Gamepad Tester',
    icon: Gamepad2,
    description: 'Lee los botones del DualShock 2',
    color: 'text-[hsl(var(--ps2-blue))]',
    code: `// Gamepad Tester - AthenaEnv
const font = new Font("default");
font.scale = 1.0;

const PAD_BUTTONS = [
  { name: "Cross", btn: Pads.CROSS },
  { name: "Circle", btn: Pads.CIRCLE },
  { name: "Square", btn: Pads.SQUARE },
  { name: "Triangle", btn: Pads.TRIANGLE },
  { name: "L1", btn: Pads.L1 },
  { name: "R1", btn: Pads.R1 },
  { name: "L2", btn: Pads.L2 },
  { name: "R2", btn: Pads.R2 },
  { name: "Start", btn: Pads.START },
  { name: "Select", btn: Pads.SELECT },
  { name: "Up", btn: Pads.UP },
  { name: "Down", btn: Pads.DOWN },
  { name: "Left", btn: Pads.LEFT },
  { name: "Right", btn: Pads.RIGHT },
];

os.setInterval(() => {
  const pad = Pads.get(0);
  pad.update();
  
  Screen.clear(Color.new(15, 15, 30, 255));
  
  font.color = Color.new(0, 255, 255, 255);
  font.scale = 1.5;
  font.print(50, 30, "GAMEPAD TESTER");
  
  font.scale = 0.9;
  let y = 80;
  for (let i = 0; i < PAD_BUTTONS.length; i++) {
    const btn = PAD_BUTTONS[i];
    const pressed = pad.pressed(btn.btn);
    font.color = pressed 
      ? Color.new(0, 255, 128, 255)
      : Color.new(100, 100, 100, 128);
    font.print(60, y, (pressed ? "[X] " : "[ ] ") + btn.name);
    y += 22;
  }
  
  // Analog sticks
  font.color = Color.new(255, 200, 0, 255);
  font.print(350, 80, "Left Stick:");
  font.print(350, 105, "X: " + pad.lx + " Y: " + pad.ly);
  font.print(350, 140, "Right Stick:");
  font.print(350, 165, "X: " + pad.rx + " Y: " + pad.ry);
  
  Screen.flip();
}, 0);`
  },
  {
    name: 'Dibujo 2D',
    icon: Palette,
    description: 'Figuras geométricas con Draw',
    color: 'text-[hsl(var(--ps2-purple))]',
    code: `// 2D Drawing Demo - AthenaEnv
const font = new Font("default");

let angle = 0;

os.setInterval(() => {
  Screen.clear(Color.new(10, 10, 25, 255));
  
  // Grid background
  for (let x = 0; x < 640; x += 40) {
    Draw.line(x, 0, x, 448, Color.new(30, 30, 50, 128));
  }
  for (let y = 0; y < 448; y += 40) {
    Draw.line(0, y, 640, y, Color.new(30, 30, 50, 128));
  }
  
  // Rectangles
  Draw.rect(50, 100, 120, 80, Color.new(255, 0, 100, 128));
  Draw.rect(55, 105, 110, 70, Color.new(255, 50, 150, 80));
  
  // Circle
  Draw.circle(320, 224, 60, Color.new(0, 200, 255, 128));
  Draw.circle(320, 224, 40, Color.new(0, 255, 200, 80));
  
  // Triangle
  Draw.triangle(
    480, 120, 550, 250, 410, 250,
    Color.new(255, 200, 0, 128)
  );
  
  // Title
  font.color = Color.new(255, 255, 255, 255);
  font.scale = 1.5;
  font.print(50, 30, "2D DRAWING DEMO");
  
  font.scale = 0.8;
  font.color = Color.new(150, 150, 150, 128);
  font.print(50, 400, "Rect | Circle | Triangle | Line");
  
  angle += 0.02;
  Screen.flip();
}, 0);`
  },
  {
    name: 'Imagen + Textbox',
    icon: ImageIcon,
    description: 'Carga imágenes y muestra diálogos',
    color: 'text-[hsl(var(--ps2-orange))]',
    code: `// Image & Textbox Demo - AthenaEnv
// Place your images in an "assets" folder

const font = new Font("default");
font.scale = 1.3;
font.color = Color.new(255, 255, 255, 255);

const FONT_METRICS = font.getTextSize("Mg");
const LINE_HEIGHT = FONT_METRICS.height + 6;

const TEXTBOX_X = 80;
const TEXTBOX_Y = 320;
const TEXTBOX_WIDTH = 480;
const TEXTBOX_HEIGHT = 100;
const TEXT_PADDING = 24;

const DIALOG_TEXT = "Welcome to AthenaEnv! This is a textbox demo with automatic word wrapping.";

function wrapText(text, maxWidth) {
  const words = text.split(" ");
  let lines = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const testWidth = font.getTextSize(testLine).width;
    if (testWidth > maxWidth && line !== "") {
      lines.push(line.trim());
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  if (line !== "") lines.push(line.trim());
  return lines;
}

const wrappedLines = wrapText(DIALOG_TEXT, TEXTBOX_WIDTH - (TEXT_PADDING * 2));

function drawOutlined(text, x, y) {
  font.color = Color.new(30, 30, 30, 255);
  font.print(x - 1, y, text);
  font.print(x + 1, y, text);
  font.print(x, y - 1, text);
  font.print(x, y + 1, text);
  font.color = Color.new(255, 240, 210, 255);
  font.print(x, y, text);
}

os.setInterval(() => {
  Screen.clear(Color.new(20, 20, 40, 255));
  
  // Textbox background
  Draw.rect(TEXTBOX_X, TEXTBOX_Y, TEXTBOX_WIDTH, TEXTBOX_HEIGHT, Color.new(0, 0, 0, 100));
  Draw.rect(TEXTBOX_X, TEXTBOX_Y, TEXTBOX_WIDTH, 2, Color.new(0, 200, 255, 128));
  
  // Text
  const totalH = wrappedLines.length * LINE_HEIGHT;
  const startY = TEXTBOX_Y + ((TEXTBOX_HEIGHT - totalH) / 2);
  for (let i = 0; i < wrappedLines.length; i++) {
    drawOutlined(wrappedLines[i], TEXTBOX_X + TEXT_PADDING, startY + (i * LINE_HEIGHT));
  }
  
  font.color = Color.new(100, 100, 100, 128);
  font.scale = 0.8;
  font.print(TEXTBOX_X, TEXTBOX_Y + TEXTBOX_HEIGHT + 10, "Press X to continue...");
  font.scale = 1.3;
  
  Screen.flip();
}, 0);`
  },
];

const MODULES_INFO = [
  { name: 'Screen', icon: Monitor, desc: 'Video modes, VSync, render params, dual context', color: 'bg-blue-500/20 text-blue-400' },
  { name: 'Draw', icon: Palette, desc: 'MMI accelerated 2D: rect, circle, triangle, line', color: 'bg-purple-500/20 text-purple-400' },
  { name: 'Image', icon: ImageIcon, desc: 'PNG/BMP/JPEG, VRAM cache, async loading, filters', color: 'bg-green-500/20 text-green-400' },
  { name: 'Font', icon: Type, desc: 'FreeType/Image fonts, outline, shadow, alignment', color: 'bg-cyan-500/20 text-cyan-400' },
  { name: 'Render', icon: Box, desc: 'VU1 3D: lighting, skinning, bump maps, batching', color: 'bg-orange-500/20 text-orange-400' },
  { name: 'Sound', icon: Music, desc: 'ADPCM effects, WAV/OGG streams, pan & pitch', color: 'bg-pink-500/20 text-pink-400' },
  { name: 'Pads', icon: Gamepad2, desc: 'DS2/3/4 input, pressure, rumble, callbacks', color: 'bg-red-500/20 text-red-400' },
  { name: 'TileMap', icon: Layers, desc: 'VU1 2D tilemap renderer, sprite buffers', color: 'bg-yellow-500/20 text-yellow-400' },
  { name: 'Network', icon: Network, desc: 'HTTP/S, TLS 1.2, WebSockets, downloads', color: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Native', icon: Zap, desc: 'AOT compiler: JS → MIPS R5900, 40x+ speedup', color: 'bg-amber-500/20 text-amber-400' },
  { name: 'System', icon: Cpu, desc: 'Files, folders, machine info, dynamic libs', color: 'bg-slate-500/20 text-slate-400' },
  { name: 'Video', icon: Film, desc: 'MPEG-1/2 playback with full control', color: 'bg-indigo-500/20 text-indigo-400' },
  { name: 'Timer', icon: Timer, desc: 'Separated timers with selectable resolution', color: 'bg-teal-500/20 text-teal-400' },
  { name: 'Archive', icon: Archive, desc: 'ZIP, GZ, TAR extraction support', color: 'bg-violet-500/20 text-violet-400' },
];

export function AthenaWelcomeTab({ onCreateFile, onCloneRepo, onImportProject, onOpenVisualBuilder }: AthenaWelcomeTabProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<number | null>(null);

  return (
    <div className="h-full overflow-y-auto bg-[hsl(var(--ide-editor))]">
      <div className="max-w-[900px] mx-auto px-8 py-10">
        
        {/* Hero */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--ps2-blue))] to-[hsl(var(--ps2-purple))] flex items-center justify-center shadow-lg shadow-[hsl(var(--ps2-blue))]/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Bienvenido a <span className="text-[hsl(var(--ps2-blue))]">Athena Env Studio</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enhanced JavaScript Runtime Environment for PlayStation 2™
            </p>
          </div>
          <Badge variant="outline" className="ml-auto border-[hsl(var(--ps2-blue))]/30 text-[hsl(var(--ps2-blue))] text-[10px]">
            QuickJS Engine
          </Badge>
        </div>

        {/* Quick Start + Actions side by side */}
        <div className="grid grid-cols-5 gap-8 mb-10">
          
          {/* Left: Start */}
          <div className="col-span-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Inicio</h2>
            <div className="space-y-1.5">
              <WelcomeAction icon={FileCode} label="Crear Archivo" shortcut="Ctrl+N" onClick={() => onCreateFile('main.js', '')} />
              <WelcomeAction icon={FolderOpen} label="Importar Proyecto" onClick={onImportProject} />
              <WelcomeAction icon={GitBranch} label="Clonar Repositorio" onClick={onCloneRepo} />
              <WelcomeAction icon={Palette} label="PS2 Visual Builder" shortcut="UI" onClick={onOpenVisualBuilder} />
            </div>

            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-4">Ayuda</h2>
            <div className="space-y-1.5">
              <WelcomeLink icon={BookOpen} label="Sitio Web Oficial" href="https://athena-env.vercel.app/" />
              <WelcomeLink icon={Code2} label="Ejemplos Oficiales" href="https://github.com/DanielSant0s/AthenaEnv" />
              <WelcomeLink icon={Globe} label="Discord Oficial" href="https://discord.gg/h7D59mqmWU" />
            </div>
          </div>

          {/* Right: Quick Start Templates */}
          <div className="col-span-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Inicio Rápido</h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_START_TEMPLATES.map((tpl, i) => (
                <button
                  key={tpl.name}
                  className={`
                    group relative text-left p-4 rounded-lg border transition-all duration-200
                    ${hoveredTemplate === i 
                      ? 'bg-accent/80 border-[hsl(var(--ps2-blue))]/40 shadow-md shadow-[hsl(var(--ps2-blue))]/5' 
                      : 'bg-card/50 border-border/50 hover:bg-accent/50 hover:border-border'
                    }
                  `}
                  onMouseEnter={() => setHoveredTemplate(i)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  onClick={() => onCreateFile(tpl.name.toLowerCase().replace(/\s+/g, '_') + '.js', tpl.code)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${tpl.color}`}>
                      <tpl.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        {tpl.name}
                        <ChevronRight className={`w-3 h-3 transition-transform ${hoveredTemplate === i ? 'translate-x-0.5 opacity-100' : 'opacity-0'}`} />
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{tpl.description}</div>
                    </div>
                  </div>
                  {hoveredTemplate === i && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[hsl(var(--ps2-blue))]/60 to-transparent rounded-b-lg" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 mb-8" />

        {/* Modules Overview */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Módulos Disponibles
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {MODULES_INFO.map(mod => (
              <div key={mod.name} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/30 transition-colors group">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${mod.color}`}>
                  <mod.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground">{mod.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{mod.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Code Example */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Ejemplo Mínimo
          </h2>
          <div className="bg-[hsl(var(--ide-tab))] border border-border/50 rounded-lg p-5 font-mono text-xs leading-relaxed">
            <div className="text-muted-foreground">{"// Programa mínimo en AthenaEnv"}</div>
            <div><span className="text-[hsl(var(--ps2-blue))]">const</span> font = <span className="text-[hsl(var(--ps2-green))]">new</span> <span className="text-[hsl(var(--ps2-orange))]">Font</span>(<span className="text-[hsl(var(--ps2-purple))]">"default"</span>);</div>
            <br />
            <div>os.<span className="text-[hsl(var(--ps2-orange))]">setInterval</span>(() =&gt; {"{"}</div>
            <div className="pl-4">Screen.<span className="text-[hsl(var(--ps2-orange))]">clear</span>();</div>
            <div className="pl-4">font.<span className="text-[hsl(var(--ps2-orange))]">print</span>(0, 0, <span className="text-[hsl(var(--ps2-purple))]">"Hello PS2!"</span>);</div>
            <div className="pl-4">Screen.<span className="text-[hsl(var(--ps2-orange))]">flip</span>();</div>
            <div>{"}"}, 0);</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-[10px] text-muted-foreground/60">
            AthenaEnv by Daniel Santos • QuickJS powered • PS2DEV toolchain
          </p>
        </div>
      </div>
    </div>
  );
}

function WelcomeAction({ icon: Icon, label, shortcut, onClick }: { icon: any; label: string; shortcut?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent/50 transition-colors group"
    >
      <Icon className="w-4 h-4 text-[hsl(var(--ps2-blue))]" />
      <span className="text-sm text-[hsl(var(--ps2-blue))] group-hover:underline flex-1">{label}</span>
      {shortcut && <span className="text-[10px] text-muted-foreground/60 font-mono">{shortcut}</span>}
    </button>
  );
}

function WelcomeLink({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent/50 transition-colors group"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1">{label}</span>
      <ExternalLink className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
