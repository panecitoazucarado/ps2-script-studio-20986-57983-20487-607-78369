import { Heart, Github, Globe, ExternalLink, Code2, Gamepad2, Sparkles, Shield, Cpu, FileCode, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import flagBolivia from '@/assets/flag-bolivia.png';
import flagBrazil from '@/assets/flag-brazil.png';

export function AthenaAboutTab() {
  return (
    <div className="h-full overflow-y-auto bg-[hsl(var(--ide-editor))]">
      <div className="max-w-[750px] mx-auto px-8 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(var(--ps2-blue))] to-[hsl(var(--ps2-purple))] flex items-center justify-center shadow-xl shadow-[hsl(var(--ps2-blue))]/25 mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Athena Env <span className="text-[hsl(var(--ps2-blue))]">Studio</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Entorno de desarrollo integrado en la web para la creación de juegos y aplicaciones
            homebrew en PlayStation 2™, impulsado por el framework AthenaEnv.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
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

        <div className="space-y-8">

          {/* About the project */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-5 h-5 text-[hsl(var(--ps2-blue))]" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Acerca del Proyecto</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Athena Env Studio</strong> es una plataforma web de desarrollo profesional
              diseñada para facilitar la creación de juegos y aplicaciones para la consola <strong className="text-foreground">PlayStation 2™</strong>.
              El proyecto fue concebido con la visión de democratizar el desarrollo homebrew de PS2,
              eliminando las barreras de configuración y ofreciendo todas las herramientas necesarias
              directamente desde el navegador.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              La plataforma incluye un editor de código profesional, previsualizador en tiempo real,
              terminal integrada, Visual Builder con drag-and-drop, asistente de IA para desarrolladores,
              y soporte completo para todos los módulos del runtime de AthenaEnv — siempre respetando
              la documentación oficial del framework.
            </p>
          </div>

          {/* How it works */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-5 h-5 text-[hsl(var(--ps2-cyan))]" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">¿Cómo funciona?</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              En el corazón del ecosistema se encuentra <strong className="text-foreground">athena.elf</strong>,
              un ejecutable compilado que corre directamente en el hardware real de PlayStation 2.
              Este archivo integra su propio core con un motor <strong className="text-foreground">QuickJS embebido</strong>,
              capaz de interpretar archivos <code className="text-[hsl(var(--ps2-cyan))] bg-muted/50 px-1 rounded text-xs">script.js</code> y
              cargar recursos adicionales como <code className="text-[hsl(var(--ps2-cyan))] bg-muted/50 px-1 rounded text-xs">.xml</code>,{' '}
              <code className="text-[hsl(var(--ps2-cyan))] bg-muted/50 px-1 rounded text-xs">.json</code> y más.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Un ejemplo notable es <strong className="text-foreground">OSDXMB</strong> de{' '}
              <strong className="text-foreground">@Hirotex</strong>, quien desarrolló un lector de XML
              implementado enteramente en JavaScript, demostrando la versatilidad del runtime para
              construir aplicaciones complejas que procesan múltiples formatos de datos en el hardware real de PS2.
            </p>
          </div>

          {/* Creators heading */}
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-4 h-4 text-red-400" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Los Creadores</h2>
          </div>

          {/* Creator cards */}
          <div className="grid grid-cols-1 gap-5">

            {/* José Manuel — enhanced card */}
            <div className="relative overflow-hidden bg-card/60 border border-border/50 rounded-2xl hover:border-[hsl(var(--ps2-blue))]/40 transition-all duration-300 group">
              {/* Flag banner */}
              <div className="relative h-28 overflow-hidden">
                <img
                  src={flagBolivia}
                  alt="Bandera de Bolivia"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-300"
                  loading="lazy"
                  width={1024}
                  height={576}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/95" />
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[hsl(var(--ide-editor))] to-transparent" />
              </div>

              <div className="relative px-6 pb-6 -mt-10">
                <div className="flex items-end gap-4 mb-5">
                  <div className="relative shrink-0">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[hsl(var(--ps2-blue))] to-[hsl(var(--ps2-purple))] flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-[hsl(var(--ps2-blue))]/30 ring-4 ring-[hsl(var(--ide-editor))]">
                      JM
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[hsl(var(--ps2-green))] flex items-center justify-center ring-2 ring-[hsl(var(--ide-editor))]">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <h3 className="text-lg font-bold text-foreground leading-tight">José Manuel Álvarez Ayala</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span>@panecitoazucarado</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>🇧🇴 Bolivia</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <Badge className="bg-[hsl(var(--ps2-blue))]/10 text-[hsl(var(--ps2-blue))] border-[hsl(var(--ps2-blue))]/20 text-[10px]">
                    <Code2 className="w-3 h-3 mr-1" />
                    Creador de Athena Env Studio
                  </Badge>
                  <Badge className="bg-[hsl(var(--ps2-purple))]/10 text-[hsl(var(--ps2-purple))] border-[hsl(var(--ps2-purple))]/20 text-[10px]">
                    <FileCode className="w-3 h-3 mr-1" />
                    Full-Stack Developer
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Diseñador y desarrollador integral de <strong className="text-foreground">Athena Env Studio</strong>.
                  Concibió, diseñó y programó por completo esta plataforma web donde los usuarios interactúan
                  con un IDE profesional para crear juegos y aplicaciones de PlayStation 2 directamente desde el navegador.
                  Desarrolló todas las herramientas disponibles en el sitio — el editor de código, el Visual Builder,
                  la terminal, el sistema de pestañas, el previsualizador, el asistente de IA y cada funcionalidad
                  que compone el ecosistema — siempre basándose en la documentación oficial del framework AthenaEnv.
                </p>

                <div className="mt-5 pt-4 border-t border-border/30">
                  <a
                    href="https://github.com/panecitoazucarado"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group/link"
                  >
                    <Github className="w-4 h-4" />
                    <span>github.com/panecitoazucarado</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
            </div>

            {/* Daniel Santos — enhanced card */}
            <div className="relative overflow-hidden bg-card/60 border border-border/50 rounded-2xl hover:border-[hsl(var(--ps2-green))]/40 transition-all duration-300 group">
              {/* Flag banner */}
              <div className="relative h-28 overflow-hidden">
                <img
                  src={flagBrazil}
                  alt="Bandera de Brasil"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-300"
                  loading="lazy"
                  width={1024}
                  height={576}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/95" />
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[hsl(var(--ide-editor))] to-transparent" />
              </div>

              <div className="relative px-6 pb-6 -mt-10">
                <div className="flex items-end gap-4 mb-5">
                  <div className="relative shrink-0">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[hsl(var(--ps2-green))] to-[hsl(var(--ps2-cyan))] flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-[hsl(var(--ps2-green))]/30 ring-4 ring-[hsl(var(--ide-editor))]">
                      DS
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[hsl(var(--ps2-orange))] flex items-center justify-center ring-2 ring-[hsl(var(--ide-editor))]">
                      <Shield className="w-3 h-3 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <h3 className="text-lg font-bold text-foreground leading-tight">Daniel Santos</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span>@DanielSant0s</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>🇧🇷 Brasil</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <Badge className="bg-[hsl(var(--ps2-green))]/10 text-[hsl(var(--ps2-green))] border-[hsl(var(--ps2-green))]/20 text-[10px]">
                    <Gamepad2 className="w-3 h-3 mr-1" />
                    Creador de AthenaEnv
                  </Badge>
                  <Badge className="bg-[hsl(var(--ps2-orange))]/10 text-[hsl(var(--ps2-orange))] border-[hsl(var(--ps2-orange))]/20 text-[10px]">
                    <Shield className="w-3 h-3 mr-1" />
                    Ciberseguridad & Low-Level
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Creador del framework <strong className="text-foreground">AthenaEnv</strong>, el potente runtime
                  de JavaScript basado en QuickJS que permite ejecutar código directamente en el hardware real de PlayStation 2.
                  Experto en ciberseguridad y desarrollo de bajo nivel, domina C a la perfección e incluso programa
                  en las unidades de procesamiento vectorial (VU0/VU1) de la PS2 — conocidas como programación V0 —,
                  un nivel de expertise que pocos en el mundo poseen. Conocido en la comunidad como
                  <strong className="text-foreground"> "the f**king Daniel Sant0s"</strong>, su trabajo es la base
                  fundamental sobre la cual se construye todo este ecosistema.
                </p>

                <div className="mt-5 pt-4 border-t border-border/30">
                  <a
                    href="https://github.com/DanielSant0s"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group/link"
                  >
                    <Github className="w-4 h-4" />
                    <span>github.com/DanielSant0s</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Enlaces Oficiales</h2>
            <div className="space-y-2">
              <AboutLink icon={Globe} label="Sitio Oficial de AthenaEnv" href="https://athena-env.vercel.app/" />
              <AboutLink icon={Github} label="AthenaEnv en GitHub" href="https://github.com/DanielSant0s/AthenaEnv" />
              <AboutLink icon={Globe} label="Comunidad en Discord" href="https://discord.gg/h7D59mqmWU" />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 pb-8">
            <p className="text-[10px] text-muted-foreground/50 flex items-center justify-center gap-1.5">
              Hecho con <Heart className="w-3 h-3 text-red-400/60" /> desde Bolivia 🇧🇴 y Brasil 🇧🇷 para la comunidad de PS2 homebrew
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
