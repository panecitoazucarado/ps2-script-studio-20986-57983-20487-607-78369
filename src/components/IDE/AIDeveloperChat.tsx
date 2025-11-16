import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Code2, FileText, FolderPlus, Trash2, Edit3, MessageSquare, Save, Copy, ThumbsUp, ThumbsDown, Reply, ImagePlus, Sparkles, Download, Upload, X, FileCode, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileNode } from '@/types/athena';
import { AICodeBlock } from './AICodeBlock';
import { ConversationManager, Conversation } from './ConversationManager';

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  data: string; // base64 or text content
  preview?: string; // for images
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  fileOperations?: FileOperation[];
  images?: string[]; // URLs o base64 de imágenes generadas o cargadas
  likes?: number; // 1 = like, -1 = dislike, 0 = neutral
  replyTo?: number; // índice del mensaje al que responde
  imageLikes?: { [key: number]: number }; // likes por imagen individual
  attachedFiles?: UploadedFile[]; // archivos adjuntos en el mensaje
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
    content: '👋 ¡Hola! Soy tu **Asistente Experto de Desarrollo PS2** con capacidades avanzadas.\n\n🚀 **Puedo ayudarte con:**\n• Escribir código complejo y completo para ATHENA ENV\n• Crear arquitecturas avanzadas de juegos\n• Optimizar performance para PS2\n• Refactorizar y mejorar código existente\n• Explicar conceptos técnicos en profundidad\n• Debugging de problemas complejos\n\n💡 **Características especiales:**\n• Aprendo de tu código para adaptarme a tu estilo\n• Escribo código completo sin omisiones\n• Analizo todo el contexto de tu proyecto\n• Sin límites de longitud en las respuestas\n\n¿En qué proyecto estás trabajando? Puedes compartir código existente para que lo analice y aprenda de tu estilo. 🎮',
    timestamp: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number; messageIndex: number; imageIndex?: number } | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [imageGenerationProgress, setImageGenerationProgress] = useState<{ current: number; total: number; progress: number }[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
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
        content: '👋 ¡Hola! Soy tu **Asistente Experto de Desarrollo PS2** con capacidades avanzadas.\n\n🚀 **Puedo ayudarte con:**\n• Escribir código complejo y completo para ATHENA ENV\n• Crear arquitecturas avanzadas de juegos\n• Optimizar performance para PS2\n• Refactorizar y mejorar código existente\n• Explicar conceptos técnicos en profundidad\n• Debugging de problemas complejos\n\n💡 **Características especiales:**\n• Aprendo de tu código para adaptarme a tu estilo\n• Escribo código completo sin omisiones\n• Analizo todo el contexto de tu proyecto\n• Sin límites de longitud en las respuestas\n\n¿En qué proyecto estás trabajando? Puedes compartir código existente para que lo analice y aprenda de tu estilo. 🎮',
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
      content: '👋 ¡Hola! Soy tu **Asistente Experto de Desarrollo PS2** con capacidades avanzadas.\n\n🚀 **Puedo ayudarte con:**\n• Escribir código complejo y completo para ATHENA ENV\n• Crear arquitecturas avanzadas de juegos\n• Optimizar performance para PS2\n• Refactorizar y mejorar código existente\n• Explicar conceptos técnicos en profundidad\n• Debugging de problemas complejos\n\n💡 **Características especiales:**\n• Aprendo de tu código para adaptarme a tu estilo\n• Escribo código completo sin omisiones\n• Analizo todo el contexto de tu proyecto\n• Sin límites de longitud en las respuestas\n\n¿En qué proyecto estás trabajando? Puedes compartir código existente para que lo analice y aprenda de tu estilo. 🎮',
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

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClick = () => setContextMenuPosition(null);
    if (contextMenuPosition) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenuPosition]);

  // Handle like/dislike for messages
  const handleLike = (index: number, value: 1 | -1) => {
    setMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, likes: msg.likes === value ? 0 : value } : msg
    ));
    toast({
      title: value === 1 ? "¡Gracias por tu feedback!" : "Feedback registrado",
      description: value === 1 ? "Nos alegra que te haya gustado la respuesta" : "Trabajaremos para mejorar",
    });
  };

  // Handle like/dislike for individual images
  const handleImageLike = (messageIndex: number, imageIndex: number, value: 1 | -1) => {
    setMessages(prev => prev.map((msg, i) => {
      if (i === messageIndex) {
        const currentLikes = msg.imageLikes || {};
        const newLikes = { ...currentLikes, [imageIndex]: currentLikes[imageIndex] === value ? 0 : value };
        return { ...msg, imageLikes: newLikes };
      }
      return msg;
    }));
    toast({
      title: value === 1 ? "¡Imagen favorita!" : "Feedback registrado",
      description: value === 1 ? "Guardaré tus preferencias de estilo" : "Tomaré nota de tus preferencias",
    });
  };

  // Handle context menu (right click)
  const handleContextMenu = (e: React.MouseEvent, index: number, imageIndex?: number) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY, messageIndex: index, imageIndex });
  };

  // Handle reply
  const handleReply = (index: number) => {
    setReplyingTo(index);
    setContextMenuPosition(null);
    toast({
      title: "Respondiendo",
      description: `Respondiendo al mensaje: "${messages[index].content.substring(0, 50)}..."`,
    });
  };

  // Detectar si el usuario pide generar una imagen y cuántas
  const detectImageGeneration = (text: string): { shouldGenerate: boolean; count: number } => {
    const imageKeywords = [
      'genera', 'crea', 'dibuja', 'diseña', 'imagen', 'foto', 'picture', 
      'ilustración', 'gráfico', 'visual', 'render', 'arte', 'logo', 'icono'
    ];
    const lowerText = text.toLowerCase();
    const shouldGenerate = imageKeywords.some(keyword => lowerText.includes(keyword));
    
    // Detectar cantidad de imágenes solicitadas
    let count = 1;
    const numberMatch = lowerText.match(/(\d+)\s*(imagen|imagenes|fotos?|pictures?)/);
    if (numberMatch) {
      count = Math.min(parseInt(numberMatch[1]), 4); // Max 4 imágenes
    }
    
    return { shouldGenerate, count };
  };

  // Handle file upload with support for multiple file types
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    const filesArray = Array.from(files);

    for (const file of filesArray) {
      try {
        const fileData: UploadedFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: ''
        };

        if (file.type.startsWith('image/')) {
          // Comprimir y redimensionar imágenes para evitar errores por tamaño
          const base64 = await compressImageFile(file, 1280, 0.82);
          fileData.data = base64;
          fileData.preview = base64;
        } else if (file.type === 'application/pdf' || 
                   file.type.startsWith('text/') || 
                   file.name.endsWith('.js') || 
                   file.name.endsWith('.ts') || 
                   file.name.endsWith('.tsx') || 
                   file.name.endsWith('.jsx') ||
                   file.name.endsWith('.cpp') ||
                   file.name.endsWith('.c') ||
                   file.name.endsWith('.h')) {
          // Para archivos de texto y código
          const text = await readFileAsText(file);
          fileData.data = text;
        } else {
          // Para otros archivos, convertir a base64
          const base64 = await readFileAsBase64(file);
          fileData.data = base64;
        }

        newFiles.push(fileData);
      } catch (error) {
        console.error('Error reading file:', error);
        toast({
          title: "Error al cargar archivo",
          description: `No se pudo cargar ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast({
      title: "Archivos cargados",
      description: `${newFiles.length} archivo(s) listo(s) para enviar`,
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const compressImageFile = (file: File, maxDimension: number = 1280, quality: number = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          const largest = Math.max(width, height);
          const scale = largest > maxDimension ? maxDimension / largest : 1;

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback sin compresión
            readFileAsBase64(file).then(resolve).catch(reject);
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const output = canvas.toDataURL('image/jpeg', quality);
          resolve(output);
        };
        img.onerror = () => reject(new Error('No se pudo cargar la imagen para compresión'));
        img.src = URL.createObjectURL(file);
      } catch (e) {
        // Fallback sin compresión
        readFileAsBase64(file).then(resolve).catch(reject);
      }
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };
  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
      replyTo: replyingTo !== null ? replyingTo : undefined,
      attachedFiles: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const inputText = input;
    const userFilesData = [...uploadedFiles];
    setInput('');
    setReplyingTo(null);
    setUploadedFiles([]);
    setIsLoading(true);

    // Detectar si debe generar imagen y cuántas
    const { shouldGenerate: shouldGenerateImage, count: imageCount } = detectImageGeneration(inputText);
    
    if (shouldGenerateImage) {
      setIsGeneratingImage(true);
      // Inicializar progreso para cada imagen
      const progressArray = Array.from({ length: imageCount }, (_, i) => ({
        current: i + 1,
        total: imageCount,
        progress: 0
      }));
      setImageGenerationProgress(progressArray);
      
      // Simular progreso visual
      progressArray.forEach((_, index) => {
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += Math.random() * 15;
          if (currentProgress > 95) {
            clearInterval(interval);
            return;
          }
          setImageGenerationProgress(prev => 
            prev.map((p, i) => i === index ? { ...p, progress: Math.min(currentProgress, 95) } : p)
          );
        }, 300);
      });
    }

    try {
      // Recolectar archivos abiertos con contenido (si están disponibles)
      const openFilesWithContent = projectFiles
        .filter(f => f.type === 'file' && f.content)
        .map(f => ({
          name: f.name,
          path: f.path,
          content: f.content.substring(0, 5000) // Primeros 5000 chars de cada archivo
        }));

      // Información del archivo actual si está disponible
      const currentFileInfo = currentFile ? {
        name: currentFile.name,
        path: currentFile.path,
        content: currentFile.content?.substring(0, 10000) // Primeros 10000 chars del archivo activo
      } : null;

      // Extraer imágenes y otros archivos
      const userImages = userFilesData
        .filter(f => f.type.startsWith('image/'))
        .map(f => f.data);
      
      const otherFiles = userFilesData
        .filter(f => !f.type.startsWith('image/'))
        .map(f => ({ name: f.name, type: f.type, content: f.data }));

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
          })),
          openFiles: openFilesWithContent,
          currentFileContent: currentFileInfo,
          generateImage: shouldGenerateImage,
          imageCount: imageCount,
          userImages: userImages.length > 0 ? userImages : undefined,
          userFiles: otherFiles.length > 0 ? otherFiles : undefined
        }
      });

      if (error) {
        const status = (error as any).status || (error as any)?.context?.response?.status;
        const msg = (error as any).message || '';
        if (status === 402 || /payment_required|Not enough credits|402/i.test(msg)) {
          toast({
            title: 'Créditos agotados',
            description: 'No hay suficientes créditos para generar/analizar imágenes. Agrega créditos y vuelve a intentar.',
            variant: 'destructive',
          });
          // Mensaje amigable en el chat
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '⚠️ No hay créditos suficientes para procesar tu solicitud de imagen. Agrega créditos y vuelve a intentar, o envía tu mensaje sin imágenes para continuar con ayuda de texto.',
            timestamp: Date.now()
          }]);
          setIsLoading(false);
          setIsGeneratingImage(false);
          setImageGenerationProgress([]);
          return;
        }
        if (status === 429 || /Rate limits exceeded|429/i.test(msg)) {
          toast({
            title: 'Límite de uso alcanzado',
            description: 'Has alcanzado el límite de solicitudes. Intenta más tarde.',
            variant: 'destructive',
          });
          setIsLoading(false);
          setIsGeneratingImage(false);
          setImageGenerationProgress([]);
          return;
        }
        throw error;
      }

      if (data.error) {
        const derr = String(data.error);
        if (/Rate limits exceeded|429/i.test(derr)) {
          toast({ title: 'Límite de uso alcanzado', description: 'Has alcanzado el límite de solicitudes. Por favor, intenta más tarde.', variant: 'destructive' });
        } else if (/Payment required|payment_required|Not enough credits|402/i.test(derr)) {
          toast({ title: 'Créditos agotados', description: 'Por favor, agrega créditos en tu espacio de trabajo y vuelve a intentar.', variant: 'destructive' });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '⚠️ No hay créditos suficientes para procesar tu solicitud de imagen. Agrega créditos y vuelve a intentar, o envía tu mensaje sin imágenes para continuar con ayuda de texto.',
            timestamp: Date.now()
          }]);
        } else {
          throw new Error(derr);
        }
        setIsLoading(false);
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
        fileOperations: data.fileOperations,
        images: data.images || [],
        likes: 0
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
      setIsGeneratingImage(false);
      setImageGenerationProgress([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Copiar toda la conversación
  const handleCopyConversation = () => {
    const conversationText = messages.map(m => {
      const role = m.role === 'user' ? 'Usuario' : 'IA Developer';
      const time = new Date(m.timestamp).toLocaleString();
      return `[${role}] - ${time}\n${m.content}\n`;
    }).join('\n---\n\n');

    navigator.clipboard.writeText(conversationText).then(() => {
      toast({
        title: "Conversación copiada",
        description: "Toda la conversación ha sido copiada al portapapeles",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudo copiar la conversación",
        variant: "destructive"
      });
    });
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
                onClick={handleCopyConversation}
                disabled={messages.length <= 1}
                className="h-7 px-2 text-xs hover:bg-green-500/20 hover:text-green-500"
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copiar Chat
              </Button>
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
                {/* Reply indicator */}
                {message.replyTo !== undefined && (
                  <div className="ml-12 text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Reply className="w-3 h-3" />
                    Respondiendo a: {messages[message.replyTo]?.content.substring(0, 50)}...
                  </div>
                )}
                
                <div
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  onContextMenu={(e) => message.images && message.images.length === 0 ? handleContextMenu(e, index) : undefined}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ps2-purple to-ps2-cyan flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="space-y-2 max-w-[85%]">
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-ps2-cyan/20 to-ps2-cyan/10 text-foreground border border-ps2-cyan/30'
                          : 'bg-muted text-foreground border border-border/50'
                      } max-w-full overflow-x-auto shadow-sm hover:shadow-md transition-shadow`}
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
                          
                          {/* Imágenes generadas por la IA */}
                          {message.images && message.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              {message.images.map((img, imgIdx) => (
                                <div 
                                  key={imgIdx} 
                                  className="relative group"
                                  onContextMenu={(e) => handleContextMenu(e, index, imgIdx)}
                                >
                                  <img 
                                    src={img} 
                                    alt={`Generado ${imgIdx + 1}`}
                                    className="rounded-lg border border-ps2-purple/30 w-full h-auto shadow-lg cursor-pointer hover:border-ps2-purple/60 transition-all hover:scale-105"
                                    onClick={() => setSelectedImage(img)}
                                  />
                                  
                                  {/* Image controls overlay */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="bg-black/50 hover:bg-black/70 text-white"
                                      onClick={() => {
                                        const a = document.createElement('a');
                                        a.href = img;
                                        a.download = `imagen-ai-${Date.now()}.png`;
                                        a.click();
                                      }}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleImageLike(index, imgIdx, 1)}
                                      className={`${
                                        message.imageLikes?.[imgIdx] === 1 
                                          ? 'bg-green-500/70 hover:bg-green-500/90 text-white' 
                                          : 'bg-black/50 hover:bg-black/70 text-white'
                                      }`}
                                    >
                                      <ThumbsUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleImageLike(index, imgIdx, -1)}
                                      className={`${
                                        message.imageLikes?.[imgIdx] === -1 
                                          ? 'bg-red-500/70 hover:bg-red-500/90 text-white' 
                                          : 'bg-black/50 hover:bg-black/70 text-white'
                                      }`}
                                    >
                                      <ThumbsDown className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  
                                  {/* Like indicator badge */}
                                  {message.imageLikes?.[imgIdx] === 1 && (
                                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
                                      <ThumbsUp className="w-3 h-3" />
                                      Favorita
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          
                          {/* Archivos adjuntos del usuario */}
                          {message.attachedFiles && message.attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border/30">
                              {message.attachedFiles.map((file, fileIdx) => (
                                <div key={fileIdx} className="relative group">
                                  {file.preview ? (
                                    <div className="relative">
                                      <img 
                                        src={file.preview} 
                                        alt={file.name}
                                        className="w-24 h-24 object-cover rounded border-2 border-ps2-cyan/30 shadow cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => setSelectedImage(file.preview!)}
                                      />
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] px-1 truncate">
                                        {file.name}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-20 h-20 flex flex-col items-center justify-center bg-muted/50 border border-border/50 rounded shadow-sm">
                                      {file.type.includes('pdf') ? (
                                        <FileText className="w-5 h-5 text-red-500 mb-1" />
                                      ) : (
                                        <FileCode className="w-5 h-5 text-blue-500 mb-1" />
                                      )}
                                      <span className="text-[8px] text-center px-1 truncate w-full">{file.name}</span>
                                      <span className="text-[7px] text-muted-foreground">{(file.size / 1024).toFixed(1)}KB</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        
                        {/* Like/Dislike buttons for assistant messages */}
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLike(index, 1)}
                              className={`h-6 px-2 ${message.likes === 1 ? 'text-green-500 bg-green-500/20' : 'text-muted-foreground hover:text-green-500'}`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLike(index, -1)}
                              className={`h-6 px-2 ${message.likes === -1 ? 'text-red-500 bg-red-500/20' : 'text-muted-foreground hover:text-red-500'}`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ps2-cyan to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ps2-purple to-ps2-cyan flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="rounded-lg px-4 py-3 bg-muted border border-border/50 shadow-sm max-w-[85%]">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin text-ps2-purple" />
                    <span className="text-sm text-muted-foreground">
                      {isGeneratingImage ? 'Creando imágenes...' : 'Pensando...'}
                    </span>
                  </div>
                  
                  {/* Vista previa de progreso de generación */}
                  {isGeneratingImage && imageGenerationProgress.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {imageGenerationProgress.map((prog, idx) => (
                        <div key={idx} className="relative">
                          <div className="aspect-square rounded-lg border border-ps2-purple/30 bg-gradient-to-br from-ps2-purple/5 to-ps2-cyan/5 overflow-hidden">
                            {/* Efecto de generación animado */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ps2-purple/20 to-transparent animate-shimmer" />
                            
                            {/* Progreso */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                              <Sparkles className="w-8 h-8 text-ps2-purple animate-pulse" />
                              <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-ps2-purple to-ps2-cyan transition-all duration-300 ease-out"
                                  style={{ width: `${prog.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Imagen {prog.current}/{prog.total} • {Math.round(prog.progress)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

          <div className="border-t border-border p-4 bg-background space-y-3">
            {/* Reply indicator */}
            {replyingTo !== null && (
              <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Reply className="w-3 h-3" />
                  <span>Respondiendo: {messages[replyingTo]?.content.substring(0, 40)}...</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingTo(null)}
                  className="h-6 px-2"
                >
                  Cancelar
                </Button>
              </div>
            )}
            
            {/* Uploaded files preview */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg border border-border/50">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    {file.preview ? (
                      <div className="relative">
                        <img 
                          src={file.preview} 
                          alt={file.name} 
                          className="w-20 h-20 object-cover rounded-md border-2 border-border/50 shadow-sm"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 py-0.5 truncate rounded-b-md">
                          {file.name}
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 flex flex-col items-center justify-center bg-muted border-2 border-border/50 rounded-md shadow-sm">
                        {file.type.includes('pdf') ? (
                          <FileText className="w-6 h-6 text-red-500 mb-1" />
                        ) : file.type.includes('code') || file.name.match(/\.(js|ts|tsx|jsx|cpp|c|h)$/) ? (
                          <FileCode className="w-6 h-6 text-blue-500 mb-1" />
                        ) : (
                          <File className="w-6 h-6 text-muted-foreground mb-1" />
                        )}
                        <span className="text-[9px] text-center px-1 truncate w-full">{file.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeUploadedFile(idx)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                      title="Eliminar archivo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-md text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  {uploadedFiles.length} archivo(s) listo(s)
                </div>
              </div>
            )}
            
            {/* Drag and Drop Zone */}
            <div 
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg transition-all ${
                isDragging 
                  ? 'border-ps2-cyan bg-ps2-cyan/10 scale-[1.02]' 
                  : 'border-border/30 bg-muted/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.js,.ts,.tsx,.jsx,.cpp,.c,.h,.css,.html,.json,.md"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {isDragging ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Upload className="w-12 h-12 text-ps2-cyan animate-bounce mb-2" />
                  <p className="text-sm font-medium text-ps2-cyan">¡Suelta tus archivos aquí!</p>
                  <p className="text-xs text-muted-foreground mt-1">Imágenes, PDFs, código...</p>
                </div>
              ) : (
                <div className="flex gap-2 p-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="h-[80px] w-[60px] flex-shrink-0 border-ps2-cyan/30 hover:bg-ps2-cyan/10 hover:border-ps2-cyan/50 transition-all"
                    title="Cargar archivos"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5" />
                      <span className="text-[9px]">Archivos</span>
                    </div>
                  </Button>
                  <div className="flex-1 flex flex-col gap-1">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="💬 Describe qué quieres crear o editar...
📁 Click en 'Archivos' o arrastra archivos aquí (imágenes, PDFs, código)
🎨 Sube una imagen y pídeme: 'Conviértela a anime', 'Elimina el fondo', 'Hazla estilo Ghibli'
✨ O pídeme: 'Genera 4 imágenes de un atardecer cyberpunk'"
                      disabled={isLoading}
                      className="flex-1 min-h-[80px] max-h-[200px] resize-none font-mono text-sm bg-background/50"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                    size="icon"
                    className="bg-gradient-to-r from-ps2-purple to-ps2-cyan hover:from-ps2-purple/90 hover:to-ps2-cyan/90 h-[80px] w-[80px] flex-shrink-0 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : isGeneratingImage ? (
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Code2 className="w-3 h-3" />
                  Código completo sin límites
                </span>
                <span className="flex items-center gap-1">
                  <ImagePlus className="w-3 h-3" />
                  Genera hasta 4 imágenes
                </span>
                <span className="flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Transforma tus imágenes
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {projectFiles.length} archivos
                </span>
              </div>
              <span className="text-muted-foreground">
                Shift + Enter para nueva línea • Click derecho para responder
              </span>
            </div>
          </div>
          
          {/* Context Menu */}
          {contextMenuPosition && (
            <div
              className="fixed z-50 bg-background border border-border rounded-md shadow-lg py-1 min-w-[180px]"
              style={{ 
                top: contextMenuPosition.y, 
                left: contextMenuPosition.x 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {contextMenuPosition.imageIndex !== undefined ? (
                // Image-specific context menu
                <>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => {
                      const msg = messages[contextMenuPosition.messageIndex];
                      const imgUrl = msg.images?.[contextMenuPosition.imageIndex!];
                      if (imgUrl) {
                        setInput(`Genera más imágenes como esta, con el mismo estilo y características.`);
                      }
                      setContextMenuPosition(null);
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Generar similares
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => {
                      handleImageLike(contextMenuPosition.messageIndex, contextMenuPosition.imageIndex!, 1);
                      setContextMenuPosition(null);
                      toast({ 
                        title: "Preferencia guardada", 
                        description: "Generaré más imágenes con este estilo" 
                      });
                    }}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    Me gusta este estilo
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => {
                      const msg = messages[contextMenuPosition.messageIndex];
                      const imgUrl = msg.images?.[contextMenuPosition.imageIndex!];
                      if (imgUrl) {
                        const a = document.createElement('a');
                        a.href = imgUrl;
                        a.download = `imagen-ai-${Date.now()}.png`;
                        a.click();
                      }
                      setContextMenuPosition(null);
                    }}
                  >
                    <Download className="w-3 h-3" />
                    Descargar imagen
                  </button>
                </>
              ) : (
                // Message context menu
                <>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => handleReply(contextMenuPosition.messageIndex)}
                  >
                    <Reply className="w-3 h-3" />
                    Responder
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(messages[contextMenuPosition.messageIndex].content);
                      setContextMenuPosition(null);
                      toast({ title: "Copiado", description: "Mensaje copiado al portapapeles" });
                    }}
                  >
                    <Copy className="w-3 h-3" />
                    Copiar mensaje
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Visor de imagen en grande */}
          {selectedImage && (
            <div 
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-[90vw] max-h-[90vh]">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -top-12 right-0 text-white hover:bg-white/20"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="w-6 h-6" />
                </Button>
                <img 
                  src={selectedImage} 
                  alt="Vista completa"
                  className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const a = document.createElement('a');
                      a.href = selectedImage;
                      a.download = `imagen-ai-${Date.now()}.png`;
                      a.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
