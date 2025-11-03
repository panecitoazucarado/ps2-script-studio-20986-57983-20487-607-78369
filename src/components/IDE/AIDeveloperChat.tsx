import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Code2, FileText, FolderPlus, Trash2, Edit3, MessageSquare, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileNode } from '@/types/athena';
import { AICodeBlock } from './AICodeBlock';
import { ConversationManager, Conversation } from './ConversationManager';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  fileOperations?: FileOperation[];
}

interface FileOperation {
  operation: string;
  path?: string;
  oldPath?: string;
  newPath?: string;
  content?: string;
}

interface AIDeveloperChatProps {
  onFileSystemChange?: (files: FileNode[]) => void;
  projectFiles?: FileNode[];
  onApplyFileOperations?: (operations: FileOperation[]) => void;
  onApplyCode?: (code: string, language: string) => void;
  currentFile?: FileNode;
}

export function AIDeveloperChat({ 
  onFileSystemChange, 
  projectFiles = [], 
  onApplyFileOperations,
  onApplyCode,
  currentFile
}: AIDeveloperChatProps) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: '¡Hola! Soy tu asistente de desarrollo para PS2. Puedo ayudarte a crear archivos, carpetas, escribir código, optimizar tu proyecto y mucho más. ¿En qué estás trabajando hoy?',
    timestamp: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }
  }, []);

  // Save current conversation
  const saveCurrentConversation = () => {
    if (messages.length <= 1) return; // Don't save if only welcome message

    const conversationTitle = messages.length > 1 
      ? messages[1].content.substring(0, 50) + (messages[1].content.length > 50 ? '...' : '')
      : 'Nueva conversación';

    const conversation: Conversation = {
      id: currentConversationId || Date.now().toString(),
      title: conversationTitle,
      timestamp: Date.now(),
      messageCount: messages.length
    };

    const updatedConversations = currentConversationId
      ? conversations.map(c => c.id === currentConversationId ? conversation : c)
      : [...conversations, conversation];

    setConversations(updatedConversations);
    localStorage.setItem('ai-conversations', JSON.stringify(updatedConversations));
    localStorage.setItem(`conversation-${conversation.id}`, JSON.stringify(messages));
    
    if (!currentConversationId) {
      setCurrentConversationId(conversation.id);
    }

    toast({
      title: "Conversación guardada",
      description: "Tu conversación ha sido guardada exitosamente",
    });
  };

  // Load conversation
  const loadConversation = (id: string) => {
    const saved = localStorage.getItem(`conversation-${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
        setCurrentConversationId(id);
        setShowConversations(false);
        toast({
          title: "Conversación cargada",
          description: "Se ha restaurado la conversación seleccionada",
        });
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la conversación",
          variant: "destructive"
        });
      }
    }
  };

  // Delete conversation
  const deleteConversation = (id: string) => {
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);
    localStorage.setItem('ai-conversations', JSON.stringify(updatedConversations));
    localStorage.removeItem(`conversation-${id}`);
    
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([{
        role: 'assistant',
        content: '¡Hola! Soy tu asistente de desarrollo para PS2. Puedo ayudarte a crear archivos, carpetas, escribir código, optimizar tu proyecto y mucho más. ¿En qué estás trabajando hoy?',
        timestamp: Date.now()
      }]);
    }

    toast({
      title: "Conversación eliminada",
      description: "La conversación ha sido eliminada",
    });
  };

  // New conversation
  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([{
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de desarrollo para PS2. Puedo ayudarte a crear archivos, carpetas, escribir código, optimizar tu proyecto y mucho más. ¿En qué estás trabajando hoy?',
      timestamp: Date.now()
    }]);
    setShowConversations(false);
    toast({
      title: "Nueva conversación",
      description: "Se ha iniciado una nueva conversación",
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-developer-chat', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          projectFiles: projectFiles.map(f => ({
            name: f.name,
            path: f.path,
            type: f.type
          }))
        }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limits exceeded')) {
          toast({
            title: "Límite de uso alcanzado",
            description: "Has alcanzado el límite de solicitudes. Por favor, intenta más tarde.",
            variant: "destructive"
          });
        } else if (data.error.includes('Payment required')) {
          toast({
            title: "Créditos agotados",
            description: "Por favor, agrega créditos en la configuración de tu espacio de trabajo.",
            variant: "destructive"
          });
        } else {
          throw new Error(data.error);
        }
        setIsLoading(false);
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
        fileOperations: data.fileOperations
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Si la IA generó operaciones de archivos, aplicarlas
      if (data.fileOperations && data.fileOperations.length > 0) {
        if (onApplyFileOperations) {
          onApplyFileOperations(data.fileOperations);
        }
        toast({
          title: "Archivos actualizados",
          description: `La IA ha realizado ${data.fileOperations.length} operación(es) en el proyecto`,
        });
      }

    } catch (error: any) {
      console.error('Error al comunicarse con la IA:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo conectar con la IA. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderFileOperationBadge = (operation: FileOperation) => {
    const icons: Record<string, any> = {
      create_file: <FileText className="w-3 h-3" />,
      create_folder: <FolderPlus className="w-3 h-3" />,
      update_file: <Edit3 className="w-3 h-3" />,
      delete_file: <Trash2 className="w-3 h-3" />,
      rename_file: <Edit3 className="w-3 h-3" />
    };

    const labels: Record<string, string> = {
      create_file: 'Archivo creado',
      create_folder: 'Carpeta creada',
      update_file: 'Archivo actualizado',
      delete_file: 'Archivo eliminado',
      rename_file: 'Archivo renombrado'
    };

    return (
      <Badge variant="outline" className="gap-1 text-xs bg-ps2-purple/10 border-ps2-purple/30">
        {icons[operation.operation] || <Code2 className="w-3 h-3" />}
        {labels[operation.operation] || operation.operation}
      </Badge>
    );
  };

  const formatCodeBlock = (content: string) => {
    // Detectar bloques de código entre ```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Agregar texto antes del bloque de código
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      // Agregar bloque de código
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].trim()
      });

      lastIndex = match.index + match[0].length;
    }

    // Agregar texto restante
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {showConversations ? (
        <ConversationManager
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={loadConversation}
          onNewConversation={startNewConversation}
          onDeleteConversation={deleteConversation}
          onClose={() => setShowConversations(false)}
        />
      ) : (
        <>
          {/* Header with actions */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-ps2-purple" />
              <h3 className="font-semibold text-sm">IA Developer</h3>
              {currentFile && (
                <Badge variant="outline" className="text-xs">
                  {currentFile.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={saveCurrentConversation}
                disabled={messages.length <= 1}
                className="h-7 px-2 text-xs hover:bg-ps2-purple/20 hover:text-ps2-purple"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                Guardar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowConversations(true)}
                className="h-7 px-2 text-xs hover:bg-ps2-cyan/20 hover:text-ps2-cyan"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                Historial ({conversations.length})
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-ps2-purple/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-ps2-purple" />
                    </div>
                  )}
                  <div className="space-y-2 max-w-[85%]">
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-ps2-cyan/20 text-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="space-y-4">
                          {formatCodeBlock(message.content).map((part, i) => (
                            part.type === 'code' ? (
                              <AICodeBlock
                                key={i}
                                code={part.content}
                                language={part.language}
                                onApplyToFile={onApplyCode}
                              />
                            ) : (
                              <p key={i} className="text-sm whitespace-pre-wrap leading-relaxed">{part.content}</p>
                            )
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      )}
                      <span className="text-xs text-muted-foreground mt-2 block">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {/* File Operations */}
                    {message.fileOperations && message.fileOperations.length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-2">
                        {message.fileOperations.map((op, opIndex) => (
                          <div key={opIndex}>
                            {renderFileOperationBadge(op)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-ps2-cyan/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-ps2-cyan" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-ps2-purple/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-ps2-purple" />
                </div>
                <div className="rounded-lg px-4 py-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-ps2-purple" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

          <div className="border-t border-border p-4 bg-background">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe qué quieres crear, modificar, analizar o consultar..."
                disabled={isLoading}
                className="flex-1 min-h-[80px] max-h-[200px] resize-none font-mono text-sm"
                rows={3}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-ps2-purple hover:bg-ps2-purple/90 h-[80px] w-[80px] flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Code2 className="w-3 h-3" />
                  Análisis profundo de código
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {projectFiles.length} archivos
                </span>
              </div>
              <span className="text-muted-foreground">
                Shift + Enter para nueva línea
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
