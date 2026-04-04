import { Heart, Github, Globe, ExternalLink, Code2, Gamepad2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AthenaAboutTab() {
  return (
    <div className="h-full overflow-y-auto bg-[hsl(var(--ide-editor))]">
      <div className="max-w-[700px] mx-auto px-8 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(var(--ps2-blue))] to-[hsl(var(--ps2-purple))] flex items-center justify-center shadow-xl shadow-[hsl(var(--ps2-blue))]/25 mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Athena Env <span className="text-[hsl(var(--ps2-blue))]">Studio</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            IDE web para desarrollo de juegos y aplicaciones en PlayStation 2™
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="outline" className="border-[hsl(var(--ps2-blue))]/30 text-[hsl(var(--ps2-blue))] text-[10px]">
              Web IDE
            </Badge>
            <Badge variant="outline" className="border-[hsl(var(--ps2-purple))]/30 text-[hsl(var(--ps2-purple))] text-[10px]">
              QuickJS Engine
            </Badge>
            <Badge variant="outline" className="border-[hsl(var(--ps2-green))]/30 text-[hsl(var(--ps2-green))] text-[10px]">
              PS2DEV
            </Badge>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />

        {/* About */}
        <div className="space-y-8">

          {/* Project description */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-5 h-5 text-[hsl(var(--ps2-blue))]" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Acerca del Proyecto</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Athena Env Studio</strong> es un entorno de desarrollo integrado (IDE) basado en la web 
              que permite crear juegos y aplicaciones para la consola <strong className="text-foreground">PlayStation 2™</strong> directamente 
              desde el navegador. El proyecto nace con la visión de hacer accesible el desarrollo homebrew de PS2 
              a cualquier persona, sin necesidad de configuraciones complejas ni herramientas locales.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Incluye un editor de código profesional, previsualizador en tiempo real, terminal integrada, 
              Visual Builder con drag-and-drop, chat con IA para asistencia al desarrollador, y soporte 
              completo para todos los módulos del runtime de AthenaEnv.
            </p>
          </div>

          {/* Creators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Jose Manuel */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-5 hover:border-[hsl(var(--ps2-blue))]/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--ps2-blue))] to-[hsl(var(--ps2-purple))] flex items-center justify-center text-white font-bold text-sm">
                  JM
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">José Manuel Álvarez</h3>
                  <p className="text-[11px] text-muted-foreground">@josema</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Creador de <strong className="text-foreground">Athena Env Studio</strong>. Desarrolló la versión web del IDE 
                basándose en el framework AthenaEnv, con el objetivo de llevar el desarrollo de PS2 al navegador 
                de forma profesional y accesible para todos.
              </p>
              <div className="mt-3 pt-3 border-t border-border/30">
                <Badge className="bg-[hsl(var(--ps2-blue))]/10 text-[hsl(var(--ps2-blue))] border-[hsl(var(--ps2-blue))]/20 text-[10px]">
                  <Code2 className="w-3 h-3 mr-1" />
                  Web IDE Developer
                </Badge>
              </div>
            </div>

            {/* Daniel Santos */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-5 hover:border-[hsl(var(--ps2-green))]/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--ps2-green))] to-[hsl(var(--ps2-blue))] flex items-center justify-center text-white font-bold text-sm">
                  DS
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Daniel Santos</h3>
                  <p className="text-[11px] text-muted-foreground">@DanielSant0s</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Creador del framework <strong className="text-foreground">AthenaEnv</strong>, el runtime de JavaScript 
                potenciado por QuickJS que permite ejecutar código directamente en el hardware real de PlayStation 2. 
                Su trabajo es la base sobre la cual se construye este Studio.
              </p>
              <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2">
                <Badge className="bg-[hsl(var(--ps2-green))]/10 text-[hsl(var(--ps2-green))] border-[hsl(var(--ps2-green))]/20 text-[10px]">
                  <Gamepad2 className="w-3 h-3 mr-1" />
                  AthenaEnv Creator
                </Badge>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Enlaces</h2>
            <div className="space-y-2">
              <AboutLink icon={Globe} label="Sitio Oficial de AthenaEnv" href="https://athena-env.vercel.app/" />
              <AboutLink icon={Github} label="AthenaEnv en GitHub" href="https://github.com/DanielSant0s/AthenaEnv" />
              <AboutLink icon={Globe} label="Discord de la Comunidad" href="https://discord.gg/h7D59mqmWU" />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 pb-8">
            <p className="text-[10px] text-muted-foreground/50 flex items-center justify-center gap-1">
              Hecho con <Heart className="w-3 h-3 text-red-400/60" /> para la comunidad de PS2 homebrew
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutLink({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors group"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1">{label}</span>
      <ExternalLink className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
