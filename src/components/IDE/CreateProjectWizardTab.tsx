import React, { useState } from 'react';
import {
  Sparkles, Box, FileCode, Rocket, Cpu, ChevronRight, Info,
  CheckCircle2, ArrowRight, Package, Calendar, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ProjectKind = 'full' | 'lite' | 'hello';
export type AthenaBuildId = '2026-01-15' | '2025-04-03';

export interface CreateProjectPayload {
  kind: ProjectKind;
  build: AthenaBuildId | null;
  defaultScript: string;
  projectName: string;
}

interface Props {
  onCreate: (payload: CreateProjectPayload) => void;
  onCancel: () => void;
}

const PROJECT_TYPES = [
  {
    id: 'full' as ProjectKind,
    icon: Box,
    title: 'Proyecto Athena Env (completo)',
    badge: 'Incluye ELF + ini reales',
    desc: 'main.js + athena.ini + athena.elf en el explorador.',
    detail:
      'Se copian el ejecutable PS2 real y el athena.ini del release que elijas (Daniel Santos / QuickJS). El default_script se ajusta a tu script principal.',
    needsBuild: true,
    accent: 'from-[hsl(var(--ps2-purple))]/30 to-transparent',
    border: 'border-[hsl(var(--ps2-purple))]/40',
  },
  {
    id: 'lite' as ProjectKind,
    icon: FileCode,
    title: 'Proyecto ligero (solo script)',
    badge: '',
    desc: 'Un único main.js para iterar rápido en la vista previa.',
    detail:
      'Sin athena.ini ni athena.elf en el árbol. Ideal para pruebas JS puras en el IDE.',
    needsBuild: false,
    accent: 'from-[hsl(var(--ps2-blue))]/20 to-transparent',
    border: 'border-[hsl(var(--ps2-blue))]/30',
  },
  {
    id: 'hello' as ProjectKind,
    icon: Rocket,
    title: 'Plantilla Hello (framework)',
    badge: 'Incluye ELF + ini reales',
    desc: 'hello.js del framework + athena.ini + athena.elf del release elegido.',
    detail:
      'Mismo flujo que el ejemplo Hello World, con ELF e ini auténticos de la carpeta de versión.',
    needsBuild: true,
    accent: 'from-emerald-500/20 to-transparent',
    border: 'border-emerald-500/30',
  },
];

const BUILDS: { id: AthenaBuildId; date: string; title: string; desc: string; tag: string; recent?: boolean }[] = [
  {
    id: '2026-01-15',
    date: '15 ene 2026',
    title: 'runtime reciente',
    desc: 'Incluye el athena.elf y athena.ini del directorio ver. 15 Jan 2026 (QuickJS / core AthenaEnv en C, Daniel Santos).',
    tag: 'AthenaEnv Framework / ver. 15 Jan 2026 · athena.elf',
    recent: true,
  },
  {
    id: '2025-04-03',
    date: '3 abr 2025',
    title: 'build anterior',
    desc: 'Incluye Athena.elf y athena.ini del directorio ver 3 April 2025. Útil si tu script depende de APIs de esa época.',
    tag: 'AthenaEnv Framework / ver 3 April 2025 · Athena.elf',
  },
];

export function CreateProjectWizardTab({ onCreate, onCancel }: Props) {
  const [kind, setKind] = useState<ProjectKind>('full');
  const [build, setBuild] = useState<AthenaBuildId>('2025-04-03');
  const [defaultScript, setDefaultScript] = useState('main.js');
  const [projectName, setProjectName] = useState('mi-proyecto-ps2');

  const selectedType = PROJECT_TYPES.find(t => t.id === kind)!;
  const needsBuild = selectedType.needsBuild;

  const handleCreate = () => {
    onCreate({
      kind,
      build: needsBuild ? build : null,
      defaultScript: defaultScript.trim() || 'main.js',
      projectName: projectName.trim() || 'mi-proyecto-ps2',
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-[hsl(var(--ide-editor))]">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--ps2-purple))]/40 to-[hsl(var(--ps2-blue))]/20 border border-white/10 flex items-center justify-center shadow-xl shrink-0">
            <Sparkles className="h-7 w-7 text-[hsl(var(--ps2-purple))]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">
              Asistente de Proyecto
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight mt-1">
              Crear nuevo proyecto
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Elige el tipo de proyecto y, si aplica, qué build de{' '}
              <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[hsl(var(--ps2-cyan))] text-[12px]">athena.elf</code>{' '}
              copiar desde el árbol del AthenaEnv Framework empaquetado en este repo.
            </p>
          </div>
        </div>

        {/* Info callout */}
        <div className="rounded-xl border border-[hsl(var(--ps2-blue))]/25 bg-[hsl(var(--ps2-blue))]/[0.06] p-4 mb-8 flex gap-3">
          <Info className="h-4 w-4 text-[hsl(var(--ps2-blue))] mt-0.5 shrink-0" />
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">AthenaEnv</span> es el runtime en C que empaqueta QuickJS:
            el <code className="text-[hsl(var(--ps2-cyan))]">athena.elf</code> arranca el intérprete en la PS2;
            <code className="text-[hsl(var(--ps2-cyan))]"> athena.ini</code> indica qué script cargar
            (<code className="text-[hsl(var(--ps2-cyan))]">default_script</code>). Aquí importamos ambos archivos del release que elijas.
          </p>
        </div>

        {/* Section 1: Project type */}
        <Section number="1" title="Tipo de proyecto">
          <div className="space-y-3">
            {PROJECT_TYPES.map(t => {
              const Icon = t.icon;
              const active = kind === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setKind(t.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-4 transition-all duration-200 group',
                    'bg-gradient-to-br backdrop-blur-md',
                    active
                      ? `${t.border} ${t.accent} shadow-lg`
                      : 'border-white/[0.06] from-white/[0.02] to-transparent hover:border-white/[0.12] hover:from-white/[0.04]'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'h-11 w-11 rounded-xl border border-white/10 flex items-center justify-center shrink-0',
                      active ? 'bg-white/[0.08]' : 'bg-black/20'
                    )}>
                      <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-foreground">{t.title}</span>
                        {t.badge && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[hsl(var(--ps2-cyan))]/30 text-[hsl(var(--ps2-cyan))] bg-[hsl(var(--ps2-cyan))]/[0.08]">
                            {t.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground/90 mt-1.5">{t.desc}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-2 leading-relaxed">{t.detail}</p>
                    </div>
                    <div className={cn(
                      'shrink-0 transition-opacity',
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                    )}>
                      <CheckCircle2 className="h-5 w-5 text-[hsl(var(--ps2-purple))]" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Section 2: Build selection (only if needed) */}
        {needsBuild && (
          <Section number="2" title="Versión de AthenaEnv (athena.elf + athena.ini)">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--ps2-orange))]/15 border border-[hsl(var(--ps2-orange))]/30 flex items-center justify-center shrink-0">
                  <Cpu className="h-4 w-4 text-[hsl(var(--ps2-orange))]" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-foreground">¿Qué build copiar al proyecto?</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Cada opción empaqueta el binario y el <code className="text-[hsl(var(--ps2-cyan))]">athena.ini</code> de esa carpeta dentro del repo.
                    En la consola PS2 sustituye o ajusta rutas según tu transferencia (USB, host, etc.).
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {BUILDS.map(b => {
                  const active = build === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBuild(b.id)}
                      className={cn(
                        'w-full text-left rounded-lg border p-3.5 transition-all flex items-start gap-3',
                        active
                          ? 'border-[hsl(var(--ps2-purple))]/50 bg-[hsl(var(--ps2-purple))]/[0.08] shadow-md'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]'
                      )}
                    >
                      <div className={cn(
                        'h-4 w-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center',
                        active ? 'border-[hsl(var(--ps2-purple))]' : 'border-muted-foreground/40'
                      )}>
                        {active && <div className="h-2 w-2 rounded-full bg-[hsl(var(--ps2-purple))]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Calendar className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-[13px] font-bold text-foreground">{b.date} — {b.title}</span>
                          {b.recent && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{b.desc}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">{b.tag}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>
        )}

        {/* Section 3: Naming */}
        <Section number={needsBuild ? '3' : '2'} title="Configuración del proyecto">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md p-4 space-y-4">
            <Field
              label="Nombre del proyecto"
              hint="Carpeta raíz que aparecerá en el explorador."
              icon={Package}
            >
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="mi-proyecto-ps2"
                className="h-9 bg-black/30 border-white/10 text-[13px] font-mono"
              />
            </Field>
            <Field
              label="Script principal (default_script)"
              hint="Se escribe en athena.ini. Es el archivo .js que arrancará tu athena.elf al iniciar."
              icon={FileText}
            >
              <Input
                value={defaultScript}
                onChange={(e) => setDefaultScript(e.target.value)}
                placeholder="main.js"
                className="h-9 bg-black/30 border-white/10 text-[13px] font-mono"
              />
            </Field>
          </div>
        </Section>

        {/* Footer / actions */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-10">
          <Button variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-[hsl(var(--ps2-purple))] to-[hsl(var(--ps2-blue))] hover:opacity-90 text-white font-semibold shadow-[0_10px_30px_-10px_hsl(var(--ps2-purple)/0.6)] gap-2"
          >
            Crear proyecto
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">
          {number} · {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Field({
  label, hint, icon: Icon, children,
}: {
  label: string; hint: string; icon: any; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[12px] font-semibold text-foreground mb-1.5">
        <Icon className="h-3.5 w-3.5 text-[hsl(var(--ps2-cyan))]" />
        {label}
      </label>
      {children}
      <p className="text-[10.5px] text-muted-foreground/70 mt-1.5 leading-relaxed">{hint}</p>
    </div>
  );
}