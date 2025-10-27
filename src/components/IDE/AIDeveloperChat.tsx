import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIDeveloperChatProps {
  onFileSystemChange?: () => void;
  projectFiles?: any[];
}

export function AIDeveloperChat({ onFileSystemChange, projectFiles = [] }: AIDeveloperChatProps) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: '¡Hola! Soy tu asistente de desarrollo para PS2. Puedo ayudarte a crear archivos, carpetas, escribir código, optimizar tu proyecto y mucho más. ¿En qué estás trabajando hoy?',
    timestamp: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Si la IA modificó archivos, notificar al padre
      if (data.fileOperations && data.fileOperations.length > 0 && onFileSystemChange) {
        onFileSystemChange();
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

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-ps2-purple/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-ps2-purple" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-3 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-ps2-cyan/20 text-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-ps2-cyan/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-ps2-cyan" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-ps2-purple/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-ps2-purple" />
                </div>
                <div className="rounded-lg px-4 py-3 bg-muted">
                  <Loader2 className="w-5 h-5 animate-spin text-ps2-purple" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregúntame cualquier cosa sobre tu proyecto..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-ps2-purple hover:bg-ps2-purple/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Puedo crear archivos, carpetas, escribir código, optimizar proyectos y más
        </p>
      </div>
    </div>
  );
}
