import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Brain, 
  FileCode, 
  FolderOpen, 
  GitBranch, 
  Sparkles,
  Code2,
  FileText,
  Settings2,
  Zap,
  Target,
  ListTodo,
  Eye,
  Lightbulb
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ThinkingTask {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  description?: string;
  subtasks?: ThinkingTask[];
}

export interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete';
  additions?: number;
  deletions?: number;
}

export interface ThinkingProcessData {
  userRequest: string;
  analysis: string[];
  tasks: ThinkingTask[];
  fileChanges: FileChange[];
  architecture?: string;
  suggestions?: string[];
}

interface AIThinkingProcessProps {
  data: ThinkingProcessData | null;
  isThinking: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function AIThinkingProcess({ 
  data, 
  isThinking, 
  isExpanded = true, 
  onToggleExpand 
}: AIThinkingProcessProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    analysis: true,
    tasks: true,
    files: true,
    suggestions: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Animate task completion
  const [animatedTasks, setAnimatedTasks] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (data?.tasks) {
      data.tasks.forEach((task, index) => {
        if (task.status === 'completed' && !animatedTasks.has(task.id)) {
          setTimeout(() => {
            setAnimatedTasks(prev => new Set([...prev, task.id]));
          }, index * 200);
        }
      });
    }
  }, [data?.tasks]);

  if (!data && !isThinking) return null;

  const completedTasks = data?.tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = data?.tasks?.length || 0;

  const getStatusIcon = (status: ThinkingTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'in-progress':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Circle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getFileIcon = (type: FileChange['type']) => {
    switch (type) {
      case 'create':
        return <FileCode className="w-3.5 h-3.5 text-emerald-400" />;
      case 'modify':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'delete':
        return <FileText className="w-3.5 h-3.5 text-red-400" />;
    }
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-slate-700/50 overflow-hidden shadow-xl backdrop-blur-xl">
      {/* Header - Cursor/Trae Style */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isThinking ? (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white animate-pulse" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            {isThinking && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping" />
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              {isThinking ? 'Analizando solicitud...' : 'Proceso de pensamiento'}
              {!isThinking && totalTasks > 0 && (
                <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {completedTasks}/{totalTasks} completadas
                </Badge>
              )}
            </h3>
            {data?.userRequest && (
              <p className="text-xs text-slate-400 truncate max-w-[300px]">
                "{data.userRequest.substring(0, 50)}{data.userRequest.length > 50 ? '...' : ''}"
              </p>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpand}
          className="h-7 px-2 text-slate-400 hover:text-slate-200"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="divide-y divide-slate-700/30">
          {/* Analysis Section */}
          {(data?.analysis?.length || isThinking) && (
            <div className="p-4">
              <button 
                onClick={() => toggleSection('analysis')}
                className="flex items-center gap-2 w-full text-left mb-3 group"
              >
                {expandedSections.analysis ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
                  Análisis de la solicitud
                </span>
              </button>
              
              {expandedSections.analysis && (
                <div className="ml-6 space-y-2">
                  {isThinking && !data?.analysis?.length ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Analizando tu solicitud...</span>
                    </div>
                  ) : (
                    data?.analysis?.map((item, i) => (
                      <div 
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-400 animate-in fade-in slide-in-from-left-2"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span>{item}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tasks Section - Main Feature */}
          {(data?.tasks?.length || isThinking) && (
            <div className="p-4">
              <button 
                onClick={() => toggleSection('tasks')}
                className="flex items-center gap-2 w-full text-left mb-3 group"
              >
                {expandedSections.tasks ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <ListTodo className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
                  Tareas a realizar
                </span>
                {totalTasks > 0 && (
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {Math.round((completedTasks / totalTasks) * 100)}%
                    </span>
                  </div>
                )}
              </button>
              
              {expandedSections.tasks && (
                <div className="ml-6 space-y-2">
                  {isThinking && !data?.tasks?.length ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Planificando tareas...</span>
                    </div>
                  ) : (
                    data?.tasks?.map((task, i) => (
                      <div 
                        key={task.id}
                        className={`flex items-start gap-2 p-2 rounded-lg transition-all duration-300 ${
                          task.status === 'completed' 
                            ? 'bg-emerald-500/5 border border-emerald-500/20' 
                            : task.status === 'in-progress'
                              ? 'bg-blue-500/5 border border-blue-500/20'
                              : 'bg-slate-800/30 border border-transparent'
                        }`}
                        style={{ animationDelay: `${i * 150}ms` }}
                      >
                        <div className="mt-0.5">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${
                            task.status === 'completed' 
                              ? 'text-emerald-300 line-through opacity-70' 
                              : task.status === 'in-progress'
                                ? 'text-blue-300'
                                : 'text-slate-300'
                          }`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[10px] text-slate-500 mt-0.5">{task.description}</p>
                          )}
                          
                          {/* Subtasks */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mt-2 ml-4 space-y-1 border-l border-slate-700/50 pl-3">
                              {task.subtasks.map(subtask => (
                                <div key={subtask.id} className="flex items-center gap-2">
                                  {getStatusIcon(subtask.status)}
                                  <span className={`text-[10px] ${
                                    subtask.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-400'
                                  }`}>
                                    {subtask.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* File Changes Section */}
          {data?.fileChanges && data.fileChanges.length > 0 && (
            <div className="p-4">
              <button 
                onClick={() => toggleSection('files')}
                className="flex items-center gap-2 w-full text-left mb-3 group"
              >
                {expandedSections.files ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
                  Archivos afectados
                </span>
                <Badge variant="outline" className="ml-auto text-[10px] bg-slate-700/50 text-slate-400 border-slate-600/50">
                  {data.fileChanges.length} archivo(s)
                </Badge>
              </button>
              
              {expandedSections.files && (
                <div className="ml-6 space-y-1.5">
                  {data.fileChanges.map((file, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="text-xs font-mono text-slate-300">{file.path}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.additions !== undefined && file.additions > 0 && (
                          <span className="text-[10px] text-emerald-400 font-mono">+{file.additions}</span>
                        )}
                        {file.deletions !== undefined && file.deletions > 0 && (
                          <span className="text-[10px] text-red-400 font-mono">-{file.deletions}</span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1.5 text-[10px] text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Ver Diff
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions Section */}
          {data?.suggestions && data.suggestions.length > 0 && (
            <div className="p-4">
              <button 
                onClick={() => toggleSection('suggestions')}
                className="flex items-center gap-2 w-full text-left mb-3 group"
              >
                {expandedSections.suggestions ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
                  Sugerencias
                </span>
              </button>
              
              {expandedSections.suggestions && (
                <div className="ml-6 space-y-2">
                  {data.suggestions.map((suggestion, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-400 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10"
                    >
                      <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading skeleton when thinking */}
          {isThinking && !data?.tasks?.length && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-slate-700 rounded animate-pulse" />
                <div className="h-3 bg-slate-700 rounded w-2/3 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="w-3 h-3 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-2.5 bg-slate-700/50 rounded w-1/2 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="w-3 h-3 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-2.5 bg-slate-700/50 rounded w-3/5 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer status */}
      <div className="px-4 py-2 bg-slate-800/40 border-t border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Settings2 className="w-3 h-3" />
          <span>Powered by AI Developer</span>
        </div>
        {isThinking && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Procesando</span>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to parse thinking process from AI response
export function parseThinkingProcess(response: string, userRequest: string): ThinkingProcessData | null {
  // Try to extract structured thinking data
  const thinkingMatch = response.match(/\[THINKING\]([\s\S]*?)\[\/THINKING\]/);
  
  if (thinkingMatch) {
    try {
      return JSON.parse(thinkingMatch[1]);
    } catch (e) {
      console.error('Error parsing thinking process:', e);
    }
  }
  
  // Fallback: generate basic analysis from response
  const analysis: string[] = [];
  const tasks: ThinkingTask[] = [];
  
  // Detect what user is asking for
  const lowerRequest = userRequest.toLowerCase();
  
  if (/calculadora|calculator/i.test(lowerRequest)) {
    analysis.push('El usuario solicita crear una calculadora');
    analysis.push('Detectado lenguaje: JavaScript');
    tasks.push({
      id: '1',
      title: 'Analizar requisitos de la calculadora',
      status: 'completed',
      description: 'Determinar operaciones básicas necesarias'
    });
    tasks.push({
      id: '2',
      title: 'Diseñar estructura del código',
      status: 'completed',
      description: 'Organizar funciones y variables'
    });
    tasks.push({
      id: '3',
      title: 'Implementar operaciones matemáticas',
      status: 'completed',
      subtasks: [
        { id: '3.1', title: 'Suma y resta', status: 'completed' },
        { id: '3.2', title: 'Multiplicación y división', status: 'completed' },
        { id: '3.3', title: 'Manejo de errores', status: 'completed' }
      ]
    });
    tasks.push({
      id: '4',
      title: 'Generar código final',
      status: 'completed'
    });
  } else if (/menu|navegacion|navigation/i.test(lowerRequest)) {
    analysis.push('El usuario solicita crear un menú de navegación');
    tasks.push({
      id: '1',
      title: 'Diseñar estructura del menú',
      status: 'completed'
    });
    tasks.push({
      id: '2',
      title: 'Implementar lógica de navegación',
      status: 'completed'
    });
  } else {
    // Generic code generation tasks
    analysis.push(`Solicitud del usuario: "${userRequest.substring(0, 100)}"`);
    analysis.push('Analizando contexto y requisitos...');
    tasks.push({
      id: '1',
      title: 'Comprender solicitud',
      status: 'completed'
    });
    tasks.push({
      id: '2',
      title: 'Planificar implementación',
      status: 'completed'
    });
    tasks.push({
      id: '3',
      title: 'Generar código',
      status: 'completed'
    });
  }
  
  return {
    userRequest,
    analysis,
    tasks,
    fileChanges: [],
    suggestions: []
  };
}
