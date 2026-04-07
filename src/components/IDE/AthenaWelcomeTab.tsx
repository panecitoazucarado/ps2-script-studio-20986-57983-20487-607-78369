import React, { useState, type ComponentType } from 'react';
import {
  Gamepad2, Code2, Image as ImageIcon, Music, Monitor, Cpu,
  Box, Type, Layers, Network, Timer, Archive,
  FileCode, GitBranch, Palette, Zap,
  ChevronRight, ExternalLink, Sparkles, BookOpen,
  Rocket, Globe, Film, FolderPlus, Upload, LayoutDashboard, ArrowRight, Users,
  GraduationCap, Copy, Check, Shield, Keyboard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AthenaWelcomeTabProps {
  onCreateFile: (name: string, content: string) => void;
  onCloneRepo: () => void;
  onImportProject: () => void;
  onOpenVisualBuilder: () => void;
  onOpenAbout: () => void;
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
  
  for (let x = 0; x < 640; x += 40) {
    Draw.line(x, 0, x, 448, Color.new(30, 30, 50, 128));
  }
  for (let y = 0; y < 448; y += 40) {
    Draw.line(0, y, 640, y, Color.new(30, 30, 50, 128));
  }
  
  Draw.rect(50, 100, 120, 80, Color.new(255, 0, 100, 128));
  Draw.rect(55, 105, 110, 70, Color.new(255, 50, 150, 80));
  
  Draw.circle(320, 224, 60, Color.new(0, 200, 255, 128));
  Draw.circle(320, 224, 40, Color.new(0, 255, 200, 80));
  
  Draw.triangle(
    480, 120, 550, 250, 410, 250,
    Color.new(255, 200, 0, 128)
  );
  
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
  
  Draw.rect(TEXTBOX_X, TEXTBOX_Y, TEXTBOX_WIDTH, TEXTBOX_HEIGHT, Color.new(0, 0, 0, 100));
  Draw.rect(TEXTBOX_X, TEXTBOX_Y, TEXTBOX_WIDTH, 2, Color.new(0, 200, 255, 128));
  
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

const COMMUNITY_PROJECTS = [
  {
    name: 'Hello World',
    icon: Rocket,
    description: 'Texto, fuentes y estilos básicos del framework oficial.',
    color: 'text-[hsl(var(--ps2-green))]',
  },
  {
    name: 'Keyboard',
    icon: Keyboard,
    description: 'Entrada USB PS2 (ps2kbd); demo de teclado y módulo IOP.',
    color: 'text-muted-foreground',
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

export function AthenaWelcomeTab({ onCreateFile, onCloneRepo, onImportProject, onOpenVisualBuilder, onOpenAbout }: AthenaWelcomeTabProps) {
  const [copied, setCopied] = useState(false);

  const helloWorldCode = `// Programa mínimo en AthenaEnv 
const font = new Font("default"); 

os.setInterval(() => { 
  Screen.clear(); 
  font.print(0, 0, "Hello PS2!"); 
  Screen.flip(); 
}, 0);`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(helloWorldCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto bg-[hsl(var(--ide-editor))] custom-scrollbar scroll-smooth overscroll-contain">
      <div className="w-full max-w-[1200px] mx-auto px-4 py-6 sm:px-8 sm:py-10">
        
        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-8 sm:mb-12 text-center sm:text-left">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--ps2-blue))] to-[hsl(var(--ps2-purple))] flex items-center justify-center shadow-lg shadow-[hsl(var(--ps2-blue))]/20 shrink-0">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">
              Bienvenido a <span className="text-[hsl(var(--ps2-blue))]">Athena Env Studio</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-xl mx-auto sm:mx-0">
              Enhanced JavaScript Runtime Environment for PlayStation 2™
            </p>
          </div>
          <Badge variant="outline" className="mt-2 sm:mt-0 sm:ml-auto border-[hsl(var(--ps2-blue))]/30 text-[hsl(var(--ps2-blue))] text-[10px] uppercase tracking-wider">
            QuickJS Engine
          </Badge>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 mb-10">
          
          {/* Left Side: Actions */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <WelcomeActionHub
              onCreateFile={onCreateFile}
              onImportProject={onImportProject}
              onCloneRepo={onCloneRepo}
              onOpenVisualBuilder={onOpenVisualBuilder}
            />

            {/* Resources Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.04] to-transparent">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/90">
                  Ayuda y recursos
                </h2>
              </div>
              <div className="p-2 space-y-0.5">
                <WelcomeLink icon={BookOpen} label="Sitio web oficial" href="https://athena-env.vercel.app/" />
                <WelcomeLink icon={Code2} label="Ejemplos en GitHub" href="https://github.com/DanielSant0s/AthenaEnv" />
                <WelcomeLink icon={Globe} label="Discord" href="https://discord.gg/h7D59mqmWU" />
              </div>
            </div>

            {/* About Card */}
            <div className="rounded-2xl border border-[hsl(var(--ps2-cyan))]/25 bg-gradient-to-br from-[hsl(var(--ps2-blue))]/12 via-white/[0.03] to-[hsl(var(--ps2-purple))]/10 shadow-lg overflow-hidden backdrop-blur-xl">
              <div className="px-5 py-5 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.05] to-transparent">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--ps2-cyan))]/30 bg-black/40">
                    <Shield className="h-5 w-5 text-[hsl(var(--ps2-cyan))]" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                      Información
                    </h2>
                    <p className="text-sm font-bold text-foreground mt-1.5 leading-snug">
                      Acerca del Studio
                    </p>
                    <p className="text-[11px] text-muted-foreground/85 mt-2.5 leading-relaxed">
                      Conoce al equipo detrás de Athena Env Studio y el framework.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className={cn(
                    'group w-full text-left rounded-xl px-4 py-4 transition-all duration-300',
                    'bg-white/[0.06] border border-white/[0.1] hover:border-[hsl(var(--ps2-cyan))]/40',
                    'hover:bg-white/[0.09] hover:shadow-xl'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-[hsl(var(--ps2-cyan))] shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-bold text-foreground">
                        Leer más sobre el proyecto
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-[hsl(var(--ps2-cyan))] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Templates + Examples */}
          <div className="lg:col-span-3 flex flex-col gap-6 sm:gap-8">
            
            {/* Quick Start Templates */}
            <section className="relative rounded-2xl overflow-hidden border border-white/[0.09] bg-gradient-to-b from-white/[0.06] to-transparent backdrop-blur-xl shadow-2xl">
              <div className="relative px-5 py-5 border-b border-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/85">
                      Inicio rápido
                    </p>
                    <h2 className="text-base font-bold text-foreground tracking-tight mt-1">
                      Snippets de código
                    </h2>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                    Script único
                  </Badge>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {QUICK_START_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      className={cn(
                        'group relative text-left rounded-xl p-4 transition-all duration-300',
                        'bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-[hsl(var(--ps2-blue))]/40'
                      )}
                      onClick={() =>
                        onCreateFile(tpl.name.toLowerCase().replace(/\s+/g, '_') + '.js', tpl.code)
                      }
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/40 border border-white/5', tpl.color)}>
                          <tpl.icon className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            {tpl.name}
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[hsl(var(--ps2-blue))]" />
                          </span>
                          <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">
                            {tpl.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Community Examples */}
            <section className="relative rounded-2xl overflow-hidden border border-white/[0.09] bg-gradient-to-b from-white/[0.07] to-transparent backdrop-blur-2xl shadow-2xl">
              <div className="px-5 py-5 border-b border-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-4 min-w-0">
                    <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                      <Users className="h-5 w-5 text-[hsl(var(--ps2-purple))]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/85">
                        Ecosistema AthenaEnv
                      </p>
                      <h2 className="text-base font-bold text-foreground tracking-tight mt-1">
                        Proyectos de Ejemplo
                      </h2>
                    </div>
                  </div>
                  <Badge className="bg-[hsl(var(--ps2-purple))]/20 text-[hsl(var(--ps2-purple))] border-[hsl(var(--ps2-purple))]/30 text-[9px] uppercase font-bold tracking-widest">
                    Comunidad
                  </Badge>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {COMMUNITY_PROJECTS.map((proj) => (
                    <div
                      key={proj.name}
                      className={cn(
                        'group relative text-left rounded-xl p-4 transition-all duration-300',
                        'bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-[hsl(var(--ps2-purple))]/40 cursor-pointer'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/40 border border-white/5', proj.color)}>
                          <proj.icon className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-bold text-foreground">{proj.name}</span>
                          <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">
                            {proj.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 mb-8" />

        {/* Modules Grid */}
        <section className="mb-12 relative rounded-2xl overflow-hidden border border-white/[0.09] bg-gradient-to-b from-white/[0.07] to-transparent backdrop-blur-2xl shadow-2xl">
          <div className="relative px-5 py-5 border-b border-white/[0.06]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/85">
                  AthenaEnv Core
                </p>
                <h2 className="text-base font-bold text-foreground tracking-tight mt-1">
                  Módulos de la API
                </h2>
              </div>
              <Badge variant="outline" className="text-[10px] border-[hsl(var(--ps2-blue))]/20 text-[hsl(var(--ps2-cyan))]">
                SDK V3.0
              </Badge>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {MODULES_INFO.map((mod) => (
                <article
                  key={mod.name}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border border-white/5 shadow-inner', mod.color)}>
                      <mod.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[12px] font-bold text-foreground">{mod.name}</h3>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-1">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Code Example */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--ps2-green))]/30 to-emerald-500/20 flex items-center justify-center border border-[hsl(var(--ps2-green))]/40 shadow-lg shadow-[hsl(var(--ps2-green))]/10">
                <Code2 className="w-5 h-5 text-[hsl(var(--ps2-green))]" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">
                  ¿Cómo hacer un Hello World en PS2?
                </h2>
                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-0.5">
                  Snippet funcional • PS2 Runtime
                </p>
              </div>
            </div>
            <Badge variant="outline" className="w-fit bg-[hsl(var(--ps2-green))]/10 border-[hsl(var(--ps2-green))]/30 text-[hsl(var(--ps2-green))] text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm">
              <Sparkles className="w-3 h-3 mr-1.5 animate-pulse" />
              Código Optimizado
            </Badge>
          </div>

          <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#080B11] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] transition-all duration-700 hover:border-[hsl(var(--ps2-green))]/40">
            {/* Window Controls */}
            <div className="flex items-center justify-between px-5 py-4 bg-white/[0.04] border-b border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-inner" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-inner" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-inner" />
                </div>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-black/40 border border-white/5">
                  <FileCode className="w-3.5 h-3.5 text-[hsl(var(--ps2-blue))]" />
                  <span className="text-[11px] font-mono font-bold text-foreground/80 tracking-wider">hello_world.js</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className={cn(
                  "h-9 px-4 gap-2 text-[11px] font-black uppercase transition-all duration-500 rounded-xl border border-white/5",
                  copied
                    ? "bg-[hsl(var(--ps2-green))]/20 text-[hsl(var(--ps2-green))] border-[hsl(var(--ps2-green))]/40"
                    : "bg-white/[0.03] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/10"
                )}
              >
                {copied ? (
                  <><Check className="w-4 h-4" /><span>Copiado</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copiar</span></>
                )}
              </Button>
            </div>

            {/* Code Content */}
            <div className="p-6 sm:p-8 font-mono text-[14px] leading-[1.7] relative overflow-x-auto custom-scrollbar selection:bg-[hsl(var(--ps2-green))]/30">
              <div className="flex">
                <div className="pr-8 text-muted-foreground/20 text-right select-none border-r border-white/5 hidden sm:block font-bold">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-[23.8px]">{i + 1}</div>
                  ))}
                </div>
                <div className="pl-8 space-y-0.5">
                  <div className="text-muted-foreground/40 italic flex items-center gap-2 mb-2">
                    <span className="opacity-50">{"//"}</span>
                    <span>Programa mínimo en AthenaEnv para PS2</span>
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <span className="text-[hsl(var(--ps2-blue))] font-bold italic">const</span>
                    <span className="text-foreground font-medium">font =</span>
                    <span className="text-[hsl(var(--ps2-green))] font-black">new</span>
                    <span className="text-[hsl(var(--ps2-orange))] font-bold">Font</span>
                    <span className="text-foreground/70">(</span>
                    <span className="text-[hsl(var(--ps2-purple))]">"default"</span>
                    <span className="text-foreground/70">);</span>
                  </div>
                  <div className="h-3" />
                  <div className="flex gap-1.5 items-center">
                    <span className="text-foreground/90 font-bold">os</span>
                    <span className="text-foreground/40">.</span>
                    <span className="text-[hsl(var(--ps2-orange))] font-black">setInterval</span>
                    <span className="text-foreground/70">(()</span>
                    <span className="text-[hsl(var(--ps2-blue))] font-bold">=&gt;</span>
                    <span className="text-foreground/70">{" {"}</span>
                  </div>
                  <div className="pl-8 flex gap-1.5 items-center border-l-2 border-white/[0.03]">
                    <span className="text-foreground/90 font-bold">Screen</span>
                    <span className="text-foreground/40">.</span>
                    <span className="text-[hsl(var(--ps2-orange))] font-black">clear</span>
                    <span className="text-foreground/70">();</span>
                  </div>
                  <div className="pl-8 flex gap-1.5 items-center border-l-2 border-white/[0.03]">
                    <span className="text-foreground/90 font-bold">font</span>
                    <span className="text-foreground/40">.</span>
                    <span className="text-[hsl(var(--ps2-orange))] font-black">print</span>
                    <span className="text-foreground/70">(</span>
                    <span className="text-[hsl(var(--ps2-cyan))] font-bold">0</span>
                    <span className="text-foreground/50">,</span>
                    <span className="text-[hsl(var(--ps2-cyan))] font-bold">0</span>
                    <span className="text-foreground/50">,</span>
                    <span className="text-[hsl(var(--ps2-purple))] font-medium">"Hello PS2!"</span>
                    <span className="text-foreground/70">);</span>
                  </div>
                  <div className="pl-8 flex gap-1.5 items-center border-l-2 border-white/[0.03]">
                    <span className="text-foreground/90 font-bold">Screen</span>
                    <span className="text-foreground/40">.</span>
                    <span className="text-[hsl(var(--ps2-orange))] font-black">flip</span>
                    <span className="text-foreground/70">();</span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <span className="text-foreground/70">{"}"}</span>
                    <span className="text-foreground/50">,</span>
                    <span className="text-[hsl(var(--ps2-cyan))] font-bold">0</span>
                    <span className="text-foreground/70">);</span>
                  </div>
                </div>
              </div>
              
              {/* Background Glows */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[hsl(var(--ps2-green))]/10 blur-[100px] pointer-events-none rounded-full animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[hsl(var(--ps2-blue))]/5 blur-[100px] pointer-events-none rounded-full" />
              
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground">
            AthenaEnv • Daniel Santos • Powered by QuickJS
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function WelcomeActionHub({
  onCreateFile,
  onImportProject,
  onCloneRepo,
  onOpenVisualBuilder,
}: {
  onCreateFile: (name: string, content: string) => void;
  onImportProject: () => void;
  onCloneRepo: () => void;
  onOpenVisualBuilder: () => void;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-2xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          background:
            'radial-gradient(120% 80% at 0% 0%, hsl(var(--ps2-purple) / 0.22) 0%, transparent 55%), radial-gradient(90% 70% at 100% 0%, hsl(var(--ps2-blue) / 0.18) 0%, transparent 50%)',
        }}
      />
      <div className="relative p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/80">
              Centro de proyecto
            </p>
            <h2 className="text-xl font-bold text-foreground tracking-tight mt-1.5">
              Workspace
            </h2>
            <p className="text-xs text-muted-foreground/80 mt-2 max-w-[280px] leading-relaxed">
              Gestiona tus archivos y diseña interfaces para PS2.
            </p>
          </div>
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md shadow-xl">
            <LayoutDashboard className="h-6 w-6 text-[hsl(var(--ps2-cyan))]" />
          </div>
        </div>

        {/* Hero CTA */}
        <button
          type="button"
          onClick={() => onCreateFile('main.js', `// New AthenaEnv Project\nconst font = new Font("default");\n\nos.setInterval(() => {\n  Screen.clear();\n  font.print(50, 50, "My PS2 App");\n  Screen.flip();\n}, 0);\n`)}
          className={cn(
            'group relative w-full text-left rounded-xl mb-6 overflow-hidden transition-all duration-300',
            'border border-[hsl(var(--ps2-purple))]/40 bg-gradient-to-br from-[hsl(var(--ps2-purple))]/25 via-[hsl(var(--ps2-blue))]/10 to-transparent',
            'hover:shadow-[0_20px_50px_-12px_hsl(var(--ps2-purple)/0.4)]'
          )}
        >
          <div className="relative flex items-center gap-5 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] border border-white/10 shadow-inner">
              <FolderPlus className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-foreground block">Crear nuevo proyecto</span>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                Usa el <span className="text-[hsl(var(--ps2-cyan))] font-bold uppercase tracking-wider text-[9px]">Asistente Pro</span> para configurar tu entorno.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <GlassActionRow icon={FileCode} title="Nuevo archivo" description="Script JS limpio" onClick={() => onCreateFile('script.js', '// AthenaEnv Script\n')} accent="hover:border-[hsl(var(--ps2-blue))]/40" iconClass="text-[hsl(var(--ps2-blue))]" />
          <GlassActionRow icon={Upload} title="Importar Proyecto" description="Desde local o en la nube" onClick={onImportProject} accent="hover:border-emerald-500/40" iconClass="text-emerald-400" />
          <GlassActionRow icon={GitBranch} title="Clonar" description="Repo remoto" onClick={onCloneRepo} accent="hover:border-orange-500/40" iconClass="text-orange-400" />
          <GlassActionRow icon={Palette} title="Visual Builder" description="Diseño UI PS2" onClick={onOpenVisualBuilder} accent="hover:border-[hsl(var(--ps2-purple))]/40" iconClass="text-[hsl(var(--ps2-purple))]" />
        </div>
      </div>
    </div>
  );
}

function GlassActionRow({
  icon: Icon,
  title,
  description,
  onClick,
  accent,
  iconClass,
}: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
  accent: string;
  iconClass: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={cn(
        'group relative w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-300',
        'bg-white/[0.04] backdrop-blur-md border border-white/[0.06]',
        'hover:bg-white/[0.07] hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ps2-blue))]/40',
        accent
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20 group-hover:border-white/15 transition-colors">
        <Icon className={cn('h-[18px] w-[18px]', iconClass)} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium text-foreground leading-none">{title}</span>
        <p className="text-[11px] text-muted-foreground/75 mt-1 leading-snug">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/35 group-hover:text-foreground/60 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}

function WelcomeLink({ icon: Icon, label, href }: { icon: ComponentType<{ className?: string }>; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors group hover:bg-white/[0.05]"
    >
      <Icon className="w-4 h-4 text-muted-foreground/80 shrink-0" />
      <span className="text-[13px] text-muted-foreground group-hover:text-foreground flex-1">{label}</span>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors shrink-0" />
    </a>
  );
}
