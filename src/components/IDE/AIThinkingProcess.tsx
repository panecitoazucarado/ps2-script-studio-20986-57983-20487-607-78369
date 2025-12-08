import { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Loader2, 
  Brain, 
  FileCode, 
  Sparkles,
  GitCompare,
  Check,
  X,
  Clock,
  Pencil,
  History,
  RotateCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete';
  additions?: number;
  deletions?: number;
  originalContent?: string;
  newContent?: string;
  accepted?: boolean;
}

export interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  isComplete: boolean;
}

export interface ThinkingProcessData {
  userRequest: string;
  thinkingSteps: ThinkingStep[];
  fileChanges: FileChange[];
  isComplete: boolean;
}

interface AIThinkingProcessProps {
  data: ThinkingProcessData | null;
  isThinking: boolean;
  onAcceptChange?: (fileIndex: number) => void;
  onRejectChange?: (fileIndex: number) => void;
  onOpenDiff?: (file: FileChange) => void;
  onRevertToVersion?: (versionId: string) => void;
}

// Simulated thinking text generator for Cursor-like effect
const thinkingTexts = [
  "Analizando la estructura del proyecto y los archivos existentes...",
  "Identificando dependencias y patrones de código actuales...",
  "Evaluando la mejor aproximación para implementar esta funcionalidad...",
  "Considerando las mejores prácticas y convenciones del proyecto...",
  "Planificando los cambios necesarios en el código...",
  "Determinando qué archivos necesitan ser modificados o creados...",
  "Estructurando la implementación de manera modular y mantenible...",
  "Verificando compatibilidad con el código existente...",
];

export function AIThinkingProcess({ 
  data, 
  isThinking,
  onAcceptChange,
  onRejectChange,
  onOpenDiff,
  onRevertToVersion
}: AIThinkingProcessProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentThinkingText, setCurrentThinkingText] = useState('');
  const [thinkingTextIndex, setThinkingTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const thinkingRef = useRef<HTMLDivElement>(null);

  // Typewriter effect for thinking text
  useEffect(() => {
    if (!isThinking) return;

    const targetText = thinkingTexts[thinkingTextIndex % thinkingTexts.length];
    
    if (charIndex < targetText.length) {
      const timer = setTimeout(() => {
        setCurrentThinkingText(targetText.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      }, 20 + Math.random() * 30); // Variable typing speed for realism
      return () => clearTimeout(timer);
    } else {
      // Wait and move to next text
      const timer = setTimeout(() => {
        setThinkingTextIndex(prev => prev + 1);
        setCharIndex(0);
        setCurrentThinkingText('');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isThinking, thinkingTextIndex, charIndex]);

  // Reset on new thinking process
  useEffect(() => {
    if (isThinking) {
      setThinkingTextIndex(0);
      setCharIndex(0);
      setCurrentThinkingText('');
    }
  }, [data?.userRequest]);

  // Auto-scroll thinking content
  useEffect(() => {
    if (thinkingRef.current && isThinking) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
    }
  }, [currentThinkingText, data?.thinkingSteps]);

  if (!data && !isThinking) return null;

  const completedSteps = data?.thinkingSteps?.filter(s => s.isComplete).length || 0;
  const totalSteps = data?.thinkingSteps?.length || 0;
  const hasFileChanges = data?.fileChanges && data.fileChanges.length > 0;

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header - Cursor/Trae Style */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/70 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isThinking ? (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Brain className="w-5 h-5 text-white animate-pulse" />
              </div>
            ) : data?.isComplete ? (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
            {isThinking && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-400 rounded-full animate-ping" />
            )}
          </div>
          
          <div className="flex flex-col">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-200">
                Thought process
              </span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Version History Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className="h-7 px-2 text-slate-400 hover:text-slate-200 gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span className="text-xs">Historial</span>
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex flex-col">
          {/* Main Thinking Content - Cursor/Trae Style */}
          <div className="p-4 border-b border-slate-700/30">
            {/* Current Thinking Title */}
            {isThinking && (
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1 flex-shrink-0">
                  <div className="w-5 h-5 rounded-full border-2 border-purple-400/50 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-200 mb-1">
                    {data?.thinkingSteps?.length 
                      ? data.thinkingSteps[data.thinkingSteps.length - 1]?.title || 'Procesando solicitud'
                      : 'Analizando tu solicitud'
                    }
                  </h4>
                </div>
              </div>
            )}

            {/* Thinking Text - Main Feature (Cursor-like) */}
            <ScrollArea className="max-h-[200px]" ref={thinkingRef}>
              <div className="space-y-3 pr-4">
                {/* Previous completed thoughts */}
                {data?.thinkingSteps?.slice(0, -1).map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3 opacity-70">
                    <div className="mt-1 flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 leading-relaxed">{step.content}</p>
                    </div>
                  </div>
                ))}

                {/* Current thinking text with typewriter effect */}
                {isThinking && (
                  <div className="pl-8">
                    <p className="text-sm text-slate-300 leading-relaxed font-light">
                      {currentThinkingText}
                      <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse" />
                    </p>
                  </div>
                )}

                {/* AI's detailed reasoning from response */}
                {data?.thinkingSteps?.length ? (
                  <div className="pl-8 space-y-2">
                    {data.thinkingSteps.slice(-1).map(step => (
                      <div key={step.id} className="text-sm text-slate-300 leading-relaxed">
                        <p className="whitespace-pre-wrap">{step.content}</p>
                        {step.isComplete && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Análisis completado</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </div>

          {/* File Changes Section - Trae AI Style with Open Diff */}
          {hasFileChanges && (
            <div className="p-4 bg-slate-800/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-slate-300">
                    Cambios propuestos
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-400 border-slate-600/50">
                    {data.fileChanges.length} archivo(s)
                  </Badge>
                </div>
                
                {/* Accept All / Reject All */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    onClick={() => data.fileChanges.forEach((_, i) => onAcceptChange?.(i))}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Aceptar todo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => data.fileChanges.forEach((_, i) => onRejectChange?.(i))}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {data.fileChanges.map((file, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all group ${
                      file.accepted === true 
                        ? 'bg-emerald-500/10 border border-emerald-500/30' 
                        : file.accepted === false
                          ? 'bg-red-500/10 border border-red-500/30 opacity-50'
                          : 'bg-slate-800/50 border border-slate-700/30 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* File Type Icon */}
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                        file.type === 'create' 
                          ? 'bg-emerald-500/20' 
                          : file.type === 'delete'
                            ? 'bg-red-500/20'
                            : 'bg-amber-500/20'
                      }`}>
                        <Pencil className={`w-3 h-3 ${
                          file.type === 'create' 
                            ? 'text-emerald-400' 
                            : file.type === 'delete'
                              ? 'text-red-400'
                              : 'text-amber-400'
                        }`} />
                      </div>
                      
                      {/* File Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-mono text-slate-300 truncate">
                          {file.path.split('/').pop()}
                        </span>
                        <span className="text-xs text-slate-500 truncate hidden sm:block">
                          {file.path}
                        </span>
                      </div>
                    </div>

                    {/* Stats and Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Line Stats */}
                      <div className="flex items-center gap-2">
                        {file.additions !== undefined && file.additions > 0 && (
                          <span className="text-xs text-emerald-400 font-mono font-medium">
                            +{file.additions}
                          </span>
                        )}
                        {file.deletions !== undefined && file.deletions > 0 && (
                          <span className="text-xs text-red-400 font-mono font-medium">
                            -{file.deletions}
                          </span>
                        )}
                      </div>

                      {/* Open Diff Button - Main Feature */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300"
                        onClick={() => onOpenDiff?.(file)}
                      >
                        <GitCompare className="w-3 h-3 mr-1.5" />
                        Open Diff
                      </Button>

                      {/* Accept/Reject Individual */}
                      {file.accepted === undefined && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => onAcceptChange?.(index)}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => onRejectChange?.(index)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}

                      {/* Status Badge */}
                      {file.accepted === true && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          Aceptado
                        </Badge>
                      )}
                      {file.accepted === false && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                          Rechazado
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Version History Panel */}
          {showVersionHistory && (
            <div className="p-4 bg-slate-900/50 border-t border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-slate-300">Historial de cambios</span>
              </div>
              
              <div className="space-y-2">
                {/* Sample version history - would be populated from actual data */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors group">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400">Versión actual</span>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                    Activa
                  </Badge>
                </div>
                
                {data?.fileChanges?.length ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs text-slate-400">Antes de los cambios</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRevertToVersion?.('previous')}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restaurar
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">
                    No hay versiones anteriores disponibles
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-800/40 border-t border-slate-700/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Sparkles className="w-3 h-3" />
              <span>AI Developer • Pensamiento profundo</span>
            </div>
            {isThinking && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-purple-400">Razonando</span>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {!isThinking && data?.isComplete && (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px]">Análisis completado</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to generate thinking steps based on user request
export function generateThinkingSteps(userRequest: string): ThinkingStep[] {
  const steps: ThinkingStep[] = [];
  const now = Date.now();
  
  // Analyze the request type
  const isCalculator = /calculadora|calculator/i.test(userRequest);
  const isComponent = /componente|component/i.test(userRequest);
  const isAPI = /api|endpoint|backend/i.test(userRequest);
  const isUI = /interfaz|ui|diseño|design|pantalla|screen/i.test(userRequest);
  
  if (isCalculator) {
    steps.push({
      id: '1',
      title: 'Analizando requisitos',
      content: `He recibido tu solicitud para crear una calculadora. Voy a analizar los requisitos necesarios.

Primero, necesito determinar qué tipo de calculadora deseas:
• Calculadora básica con operaciones +, -, *, /
• Posibles funciones adicionales (raíz cuadrada, porcentaje, etc.)
• Interfaz de usuario o solo lógica de código

Voy a estructurar el código de manera modular para que sea fácil de mantener y extender. Crearé funciones separadas para cada operación matemática y una función principal que maneje la entrada del usuario.`,
      timestamp: now,
      isComplete: false
    });
  } else if (isComponent) {
    steps.push({
      id: '1',
      title: 'Diseñando componente',
      content: `Analizando tu solicitud de componente. Voy a considerar:

• Estructura y props necesarias
• Estado interno si es requerido
• Estilos y responsividad
• Accesibilidad y mejores prácticas

Implementaré el componente siguiendo las convenciones de React y el sistema de diseño del proyecto.`,
      timestamp: now,
      isComplete: false
    });
  } else if (isAPI) {
    steps.push({
      id: '1',
      title: 'Diseñando endpoint',
      content: `Voy a crear el endpoint/API solicitado considerando:

• Métodos HTTP apropiados (GET, POST, PUT, DELETE)
• Validación de datos de entrada
• Manejo de errores robusto
• Seguridad y autenticación si es necesario
• Documentación clara del endpoint`,
      timestamp: now,
      isComplete: false
    });
  } else {
    steps.push({
      id: '1',
      title: 'Procesando solicitud',
      content: `Analizando tu solicitud: "${userRequest.substring(0, 100)}${userRequest.length > 100 ? '...' : ''}"

Voy a:
1. Comprender exactamente lo que necesitas
2. Revisar el contexto del proyecto actual
3. Planificar la mejor implementación
4. Generar código limpio y funcional`,
      timestamp: now,
      isComplete: false
    });
  }
  
  return steps;
}

// Parse AI response to extract thinking process
export function parseThinkingFromResponse(response: string, userRequest: string): ThinkingProcessData {
  const steps: ThinkingStep[] = [];
  
  // Try to extract thinking sections from the response
  const thinkingMatch = response.match(/(?:##\s*)?(?:Análisis|Thinking|Proceso|Plan)(?:.*?):\s*([\s\S]*?)(?=##|```|$)/i);
  
  if (thinkingMatch) {
    steps.push({
      id: '1',
      title: 'Análisis de la IA',
      content: thinkingMatch[1].trim(),
      timestamp: Date.now(),
      isComplete: true
    });
  }
  
  return {
    userRequest,
    thinkingSteps: steps,
    fileChanges: [],
    isComplete: true
  };
}
