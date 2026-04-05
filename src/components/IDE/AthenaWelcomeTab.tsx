import { useState } from 'react';
import { 
  Gamepad2, Code2, Image as ImageIcon, Music, Monitor, Cpu, 
  Box, Type, Layers, Network, Timer, Keyboard, Archive,
  Play, FileCode, GitBranch, FolderOpen, Palette, Zap, 
  ChevronRight, ExternalLink, Sparkles, BookOpen,
  Rocket, Shield, Globe, Film, LayoutGrid, Upload,
  Plus, Users, SquareCode
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    description: 'Texto, fuentes y estilos básicos del framework oficial.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-400',
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
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-400',
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
    color: 'from-purple-500/20 to-purple-500/5',
    iconColor: 'text-purple-400',
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
    color: 'from-orange-500/20 to-orange-500/5',
    iconColor: 'text-orange-400',
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
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-400',
  },
  {
    name: 'Keyboard',
    icon: Keyboard,
    description: 'Entrada USB PS2 (ps2kbd); demo de teclado y módulo IOP.',
    color: 'from-slate-500/20 to-slate-500/5',
    iconColor: 'text-slate-400',
  },
];

const MODULES_INFO = [
  { name: 'Screen', icon: Monitor, desc: 'Video modes, VSync, render params', color: 'bg-blue-500/15 text-blue-400' },
  { name: 'Draw', icon: Palette, desc: 'MMI accelerated 2D primitives', color: 'bg-purple-500/15 text-purple-400' },
  { name: 'Image', icon: ImageIcon, desc: 'PNG/BMP/JPEG, VRAM cache', color: 'bg-green-500/15 text-green-400' },
  { name: 'Font', icon: Type, desc: 'FreeType fonts, outline, shadow', color: 'bg-cyan-500/15 text-cyan-400' },
  { name: 'Render', icon: Box, desc: 'VU1 3D: lighting, skinning', color: 'bg-orange-500/15 text-orange-400' },
  { name: 'Sound', icon: Music, desc: 'ADPCM, WAV/OGG, pan & pitch', color: 'bg-pink-500/15 text-pink-400' },
  { name: 'Pads', icon: Gamepad2, desc: 'DS2/3/4 input, pressure, rumble', color: 'bg-red-500/15 text-red-400' },
  { name: 'TileMap', icon: Layers, desc: 'VU1 2D tilemap renderer', color: 'bg-yellow-500/15 text-yellow-400' },
  { name: 'Network', icon: Network, desc: 'HTTP/S, TLS, WebSockets', color: 'bg-emerald-500/15 text-emerald-400' },
  { name: 'Native', icon: Zap, desc: 'AOT: JS → MIPS R5900', color: 'bg-amber-500/15 text-amber-400' },
  { name: 'System', icon: Cpu, desc: 'Files, folders, machine info', color: 'bg-slate-500/15 text-slate-400' },
  { name: 'Video', icon: Film, desc: 'MPEG-1/2 playback', color: 'bg-indigo-500/15 text-indigo-400' },
  { name: 'Timer', icon: Timer, desc: 'High-resolution timers', color: 'bg-teal-500/15 text-teal-400' },
  { name: 'Archive', icon: Archive, desc: 'ZIP, GZ, TAR extraction', color: 'bg-violet-500/15 text-violet-400' },
];

export function AthenaWelcomeTab({ onCreateFile, onCloneRepo, onImportProject, onOpenVisualBuilder, onOpenAbout }: AthenaWelcomeTabProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<number | null>(null);
  const [activeSnippetView, setActiveSnippetView] = useState<'single' | 'multi'>('single');

  return (
    <div className="h-full overflow-y-auto bg-[hsl(var(--ide-editor))]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-10">
        
        {/* Hero Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--ps2-blue))] to-[hsl(var(--ps2-purple))] flex items-center justify-center shadow-lg shadow-[hsl(var(--ps2-blue))]/25">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Bienvenido a <span className="text-[hsl(var(--ps2-blue))]">Athena Env Studio</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enhanced JavaScript Runtime Environment for PlayStation 2™
            </p>
          </div>
          <Badge variant="outline" className="border-[hsl(var(--ps2-blue))]/30 text-[hsl(var(--ps2-blue))] text-[10px] hidden sm:flex">
            QUICKJS ENGINE
          </Badge>
        </div>

        {/* Main Grid: Workspace + Quick Start */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

          {/* ===== LEFT: Workspace Card (col-span-3) ===== */}
          <div className="lg:col-span-3 space-y-5">

            {/* Centro de Proyecto */}
            <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Centro de Proyecto</span>
                <div className="w-9 h-9 rounded-xl bg-[hsl(var(--ps2-blue))]/10 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-[hsl(var(--ps2-blue))]" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Workspace</h2>
              <p className="text-xs text-muted-foreground mb-6">Gestiona tus archivos y diseña interfaces para PS2.</p>

              {/* Crear nuevo proyecto — hero action */}
              <button
                onClick={() => onCreateFile('main.js', `// New AthenaEnv Project\nconst font = new Font("default");\n\nos.setInterval(() => {\n  Screen.clear();\n  font.print(50, 50, "My PS2 App");\n  Screen.flip();\n}, 0);\n`)}
                className="w-full group relative overflow-hidden rounded-xl border border-[hsl(var(--ps2-blue))]/20 bg-gradient-to-r from-[hsl(var(--ps2-blue))]/10 to-[hsl(var(--ps2-purple))]/10 hover:from-[hsl(var(--ps2-blue))]/15 hover:to-[hsl(var(--ps2-purple))]/15 p-4 mb-5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[hsl(var(--ps2-blue))]/15 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-[hsl(var(--ps2-blue))]" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-semibold text-foreground">Crear nuevo proyecto</div>
                    <div className="text-[11px] text-muted-foreground">
                      Usa el <span className="text-[hsl(var(--ps2-purple))] font-semibold">ASISTENTE PRO</span> para configurar tu entorno.
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
                </div>
              </button>

              {/* Workspace actions grid */}
              <div className="grid grid-cols-2 gap-3">
                <WorkspaceCard
                  icon={FileCode}
                  title="Nuevo archivo"
                  subtitle="Script JS limpio"
                  onClick={() => onCreateFile('script.js', '// AthenaEnv Script\n')}
                />
                <WorkspaceCard
                  icon={Upload}
                  title="Importar Proyecto"
                  subtitle="Desde local o en la nube"
                  onClick={onImportProject}
                />
                <WorkspaceCard
                  icon={GitBranch}
                  title="Clonar"
                  subtitle="Repo remoto"
                  onClick={onCloneRepo}
                />
                <WorkspaceCard
                  icon={Palette}
                  title="Visual Builder"
                  subtitle="Diseño UI PS2"
                  onClick={onOpenVisualBuilder}
                />
              </div>
            </div>
          </div>

          {/* ===== RIGHT: Quick Start Snippets (col-span-2) ===== */}
          <div className="lg:col-span-2 space-y-5">

            {/* Snippets de código */}
            <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Inicio Rápido</span>
                  <h2 className="text-lg font-bold text-foreground mt-0.5">Snippets de código</h2>
                </div>
                <Badge variant="outline" className="border-border/50 text-muted-foreground text-[10px]">
                  Script único
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {QUICK_START_TEMPLATES.map((tpl, i) => (
                  <button
                    key={tpl.name}
                    className="group relative text-left p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-accent/40 hover:border-border/60 transition-all duration-200"
                    onMouseEnter={() => setHoveredTemplate(i)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    onClick={() => onCreateFile(tpl.name.toLowerCase().replace(/\s+/g, '_') + '.js', tpl.code)}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tpl.color} flex items-center justify-center mb-3`}>
                      <tpl.icon className={`w-5 h-5 ${tpl.iconColor}`} />
                    </div>
                    <div className="text-sm font-semibold text-foreground leading-tight">{tpl.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-2">{tpl.description}</div>
                    {hoveredTemplate === i && (
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--ps2-blue))]/50 to-transparent rounded-b-xl" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Community Projects Row */}
        <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-sm mb-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--ps2-purple))]/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-[hsl(var(--ps2-purple))]" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Ecosistema AthenaEnv</span>
                <h2 className="text-lg font-bold text-foreground">Proyectos de Ejemplo</h2>
              </div>
            </div>
            <Badge className="bg-[hsl(var(--ps2-green))]/10 text-[hsl(var(--ps2-green))] border-[hsl(var(--ps2-green))]/20 text-[10px]">
              Comunidad
            </Badge>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {COMMUNITY_PROJECTS.map((proj) => (
              <div
                key={proj.name}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/20 hover:bg-accent/30 hover:border-border/50 transition-all cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${proj.color} flex items-center justify-center shrink-0`}>
                  <proj.icon className={`w-5 h-5 ${proj.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{proj.name}</div>
                  <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{proj.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modules Overview */}
        <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-sm mb-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Framework</span>
              <h2 className="text-lg font-bold text-foreground mt-0.5">Módulos Disponibles</h2>
            </div>
            <Badge variant="outline" className="border-border/50 text-muted-foreground text-[10px]">
              {MODULES_INFO.length} módulos
            </Badge>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {MODULES_INFO.map(mod => (
              <div key={mod.name} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-accent/30 transition-colors group">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${mod.color}`}>
                  <mod.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground">{mod.name}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight truncate">{mod.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resources + About Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Resources */}
          <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Recursos</span>
            <h2 className="text-lg font-bold text-foreground mt-0.5 mb-4">Aprende más</h2>
            <div className="space-y-1">
              <WelcomeLink icon={BookOpen} label="Sitio Web Oficial" href="https://athena-env.vercel.app/" />
              <WelcomeLink icon={Code2} label="Código Fuente en GitHub" href="https://github.com/DanielSant0s/AthenaEnv" />
              <WelcomeLink icon={Globe} label="Comunidad en Discord" href="https://discord.gg/h7D59mqmWU" />
            </div>
          </div>

          {/* About */}
          <div className="bg-card/40 border border-border/40 rounded-2xl p-6 backdrop-blur-sm">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Información</span>
            <h2 className="text-lg font-bold text-foreground mt-0.5 mb-4">Acerca del Studio</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Athena Env Studio fue diseñado y desarrollado por <strong className="text-foreground">José Manuel Álvarez Ayala</strong>,
              basándose en el framework <strong className="text-foreground">AthenaEnv</strong> de <strong className="text-foreground">Daniel Santos</strong>.
            </p>
            <button
              onClick={onOpenAbout}
              className="inline-flex items-center gap-2 text-xs text-[hsl(var(--ps2-blue))] hover:underline"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Leer más sobre el proyecto</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8 pt-2">
          <p className="text-[10px] text-muted-foreground/50">
            AthenaEnv by Daniel Santos · QuickJS powered · PS2DEV toolchain
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function WorkspaceCard({ icon: Icon, title, subtitle, onClick }: { icon: any; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/30 bg-card/20 hover:bg-accent/40 hover:border-border/50 transition-all duration-200 text-left"
    >
      <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 group-hover:bg-muted/60 transition-colors">
        <Icon className="w-4 h-4 text-[hsl(var(--ps2-blue))]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground leading-tight">{title}</div>
        <div className="text-[10px] text-muted-foreground">{subtitle}</div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
    </button>
  );
}

function WelcomeLink({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors group"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1">{label}</span>
      <ExternalLink className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
