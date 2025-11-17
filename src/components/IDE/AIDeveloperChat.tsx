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
    content: 'Mensaje de bienvenida (no se muestra directamente)',
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
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [usageStats, setUsageStats] = useState({
    model: 'google/gemini-2.5-flash',
    imagesGenerated: 0,
    maxImages: 4,
    dailyTokensUsed: 0,
    dailyTokensLimit: 100000
  });
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
        content: 'Mensaje de bienvenida (no se muestra directamente)',
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
      content: 'Mensaje de bienvenida (no se muestra directamente)',
      timestamp: Date.now()
    }]);
    setShowConversations(false);
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
          setAiUnavailable(true);
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
          setAiUnavailable(true);
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

  // Welcome state - show only when no messages yet
  const showWelcome = messages.length === 1 && messages[0].role === 'assistant' && !isLoading;

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-background via-background to-background/95">
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
          {/* Compact Header with Glass Effect */}
          <div className="glass-panel border-b-0 rounded-b-xl mx-2 mt-2 backdrop-blur-xl">
            <div className="flex items-center justify-between p-2 px-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ps2-purple to-ps2-cyan flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                {currentFile && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-background/40 border-border/50">
                    {currentFile.name}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyConversation}
                  disabled={messages.length <= 1}
                  className="h-7 w-7 p-0 hover:bg-white/10 disabled:opacity-30"
                  title="Copiar chat"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveCurrentConversation}
                  disabled={messages.length <= 1}
                  className="h-7 w-7 p-0 hover:bg-white/10 disabled:opacity-30"
                  title="Guardar"
                >
                  <Save className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConversations(true)}
                  className="h-7 w-7 p-0 hover:bg-white/10 relative"
                  title="Historial"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {conversations.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-ps2-purple rounded-full text-[8px] flex items-center justify-center">
                      {conversations.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full" ref={scrollRef}>
              {showWelcome ? (
                /* Welcome Screen */
                <div className="h-full flex items-center justify-center p-6 animate-float-in">
                  <div className="max-w-2xl w-full text-center space-y-6">
                    <div className="inline-block p-4 rounded-full glass-panel">
                      <Sparkles className="w-12 h-12 text-ps2-purple" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-ps2-purple via-ps2-cyan to-ps2-blue bg-clip-text text-transparent">
                      Hola, ¿qué tienes en mente hoy?
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Soy tu asistente de desarrollo. Puedo ayudarte con código, imágenes, arquitectura y mucho más.
                    </p>
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="p-3 md:p-4 space-y-3">
                  {messages.slice(1).map((message, index) => (
                    <div key={index} className="animate-float-in" style={{ animationDelay: `${index * 0.05}s` }}>
                      {/* Reply indicator */}
                      {message.replyTo !== undefined && (
                        <div className="ml-10 mb-1 text-[10px] text-muted-foreground flex items-center gap-1">
                          <Reply className="w-2.5 h-2.5" />
                          {messages[message.replyTo]?.content.substring(0, 40)}...
                        </div>
                      )}
                      
                      <div
                        className={`flex gap-2 md:gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                        onContextMenu={(e) => message.images && message.images.length === 0 ? handleContextMenu(e, index + 1) : undefined}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-ps2-purple to-ps2-cyan flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          </div>
                        )}
                        <div className="space-y-1.5 max-w-[85%] md:max-w-[75%]">
                          <div
                            className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 text-sm transition-all ${
                              message.role === 'user'
                                ? 'glass-panel bg-gradient-to-r from-ps2-cyan/10 to-ps2-purple/10 border-ps2-cyan/20'
                                : 'glass-panel border-border/30'
                            }`}
                          >
                          {message.role === 'assistant' ? (
                            <div className="space-y-3">
                              {formatCodeBlock(message.content).map((part, i) => (
                                part.type === 'code' ? (
                                  <AICodeBlock
                                    key={i}
                                    code={part.content}
                                    language={part.language}
                                    onApplyToFile={onApplyCode}
                                  />
                                ) : (
                                  <p key={i} className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{part.content}</p>
                                )
                              ))}
                              
                              {/* Imágenes generadas por la IA */}
                              {message.images && message.images.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                  {message.images.map((img, imgIdx) => (
                                    <div 
                                      key={imgIdx} 
                                      className="relative group glass-panel p-1.5"
                                      onContextMenu={(e) => handleContextMenu(e, index + 1, imgIdx)}
                                    >
                                      <img 
                                        src={img} 
                                        alt={`Generado ${imgIdx + 1}`}
                                        className="rounded-lg w-full h-auto cursor-pointer transition-transform hover:scale-[1.02]"
                                        onClick={() => setSelectedImage(img)}
                                      />
                                      
                                      {/* Image controls overlay */}
                                      <div className="absolute inset-1.5 bg-black/0 group-hover:bg-black/50 transition-all rounded-lg flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="glass-button h-8 w-8 p-0"
                                          onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = img;
                                            a.download = `imagen-ai-${Date.now()}.png`;
                                            a.click();
                                          }}
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleImageLike(index + 1, imgIdx, 1)}
                                          className={`h-8 w-8 p-0 ${
                                            message.imageLikes?.[imgIdx] === 1 
                                              ? 'bg-green-500/70 hover:bg-green-500/90' 
                                              : 'glass-button'
                                          }`}
                                        >
                                          <ThumbsUp className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleImageLike(index + 1, imgIdx, -1)}
                                          className={`h-8 w-8 p-0 ${
                                            message.imageLikes?.[imgIdx] === -1 
                                              ? 'bg-red-500/70 hover:bg-red-500/90' 
                                              : 'glass-button'
                                          }`}
                                        >
                                          <ThumbsDown className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                      
                                      {/* Like indicator badge */}
                                      {message.imageLikes?.[imgIdx] === 1 && (
                                        <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                                          <ThumbsUp className="w-2.5 h-2.5" />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              
                              {/* Archivos adjuntos del usuario */}
                              {message.attachedFiles && message.attachedFiles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/20">
                                  {message.attachedFiles.map((file, fileIdx) => (
                                    <div key={fileIdx} className="glass-panel p-1">
                                      {file.preview ? (
                                        <div className="relative">
                                          <img 
                                            src={file.preview} 
                                            alt={file.name}
                                            className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => setSelectedImage(file.preview!)}
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-14 h-14 flex flex-col items-center justify-center">
                                          {file.type.includes('pdf') ? (
                                            <FileText className="w-4 h-4 text-red-400 mb-0.5" />
                                          ) : (
                                            <FileCode className="w-4 h-4 text-blue-400 mb-0.5" />
                                          )}
                                          <span className="text-[8px] text-center truncate w-full">{file.name.substring(0, 8)}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1.5 px-1">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            
                            {/* Like/Dislike buttons for assistant messages */}
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-0.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleLike(index + 1, 1)}
                                  className={`h-5 w-5 p-0 ${message.likes === 1 ? 'text-green-400 bg-green-500/10' : 'text-muted-foreground/50 hover:text-green-400'}`}
                                >
                                  <ThumbsUp className="w-2.5 h-2.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleLike(index + 1, -1)}
                                  className={`h-5 w-5 p-0 ${message.likes === -1 ? 'text-red-400 bg-red-500/10' : 'text-muted-foreground/50 hover:text-red-400'}`}
                                >
                                  <ThumbsDown className="w-2.5 h-2.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* File Operations */}
                        {message.fileOperations && message.fileOperations.length > 0 && (
                          <div className="flex flex-wrap gap-1 ml-9">
                            {message.fileOperations.map((op, opIndex) => (
                              <div key={opIndex}>
                                {renderFileOperationBadge(op)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-ps2-cyan to-blue-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 md:gap-3 justify-start animate-float-in">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-ps2-purple to-ps2-cyan flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <div className="glass-panel rounded-2xl px-3 py-2 md:px-4 md:py-3 max-w-[75%]">
                        <div className="flex items-center gap-2 mb-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-ps2-purple" />
                          <span className="text-xs text-muted-foreground">
                            {isGeneratingImage ? 'Creando...' : 'Pensando...'}
                          </span>
                        </div>
                        
                        {/* Vista previa de progreso de generación */}
                        {isGeneratingImage && imageGenerationProgress.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {imageGenerationProgress.map((prog, idx) => (
                              <div key={idx} className="relative aspect-square rounded-lg glass-panel overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ps2-purple/20 to-transparent animate-shimmer" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2">
                                  <Sparkles className="w-6 h-6 text-ps2-purple animate-pulse" />
                                  <div className="w-full bg-background/30 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-ps2-purple to-ps2-cyan transition-all duration-300"
                                      style={{ width: `${prog.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-muted-foreground">
                                    {prog.current}/{prog.total} • {Math.round(prog.progress)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Compact Input Area with Glass Effect */}
          <div className="p-2 md:p-3 space-y-2">
            {/* Reply indicator */}
            {replyingTo !== null && (
              <div className="glass-panel flex items-center justify-between p-1.5 rounded-lg mx-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Reply className="w-2.5 h-2.5" />
                  <span>{messages[replyingTo]?.content.substring(0, 30)}...</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingTo(null)}
                  className="h-5 px-1.5 text-[10px]"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            {/* Uploaded files preview */}
            {uploadedFiles.length > 0 && (
              <div className="glass-panel p-2 rounded-lg mx-1 flex flex-wrap gap-1.5">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    {file.preview ? (
                      <div className="relative glass-panel p-0.5 rounded">
                        <img 
                          src={file.preview} 
                          alt={file.name} 
                          className="w-12 h-12 object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 glass-panel flex flex-col items-center justify-center rounded">
                        {file.type.includes('pdf') ? (
                          <FileText className="w-4 h-4 text-red-400" />
                        ) : (
                          <FileCode className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => removeUploadedFile(idx)}
                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Modern Glass Input */}
            <div 
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`glass-panel mx-1 rounded-2xl transition-all ${
                isDragging ? 'scale-[1.02] border-ps2-cyan/50' : ''
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.txt,.js,.ts,.tsx,.jsx,.cpp,.c,.h,.css,.html,.json,.md"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {isDragging ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="glass-panel p-4 rounded-full mb-3">
                    <Upload className="w-8 h-8 text-ps2-cyan animate-bounce" />
                  </div>
                  <p className="text-sm font-medium text-ps2-cyan">Suelta aquí</p>
                </div>
              ) : (
                <div className="flex gap-2 p-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="glass-button h-10 w-10 rounded-xl flex-shrink-0"
                    title="Adjuntar"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Envía un mensaje..."
                    disabled={isLoading}
                    className="flex-1 glass-input min-h-[40px] max-h-[120px] resize-none text-sm rounded-xl border-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                    rows={1}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                    size="icon"
                    className="glass-button h-10 w-10 rounded-xl flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Context Menu with Glass Effect */}
          {contextMenuPosition && (
            <div
              className="fixed z-50 glass-panel rounded-xl shadow-2xl py-1 min-w-[160px] animate-float-in"
              style={{ 
                top: contextMenuPosition.y, 
                left: contextMenuPosition.x 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {contextMenuPosition.imageIndex !== undefined ? (
                <>
                  <button
                    className="w-full px-3 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2 transition-colors rounded-lg mx-1"
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
                    className="w-full px-3 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2 transition-colors rounded-lg mx-1"
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
                    Me gusta
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2 transition-colors rounded-lg mx-1"
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
                    Descargar
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="w-full px-3 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2 transition-colors rounded-lg mx-1"
                    onClick={() => handleReply(contextMenuPosition.messageIndex)}
                  >
                    <Reply className="w-3 h-3" />
                    Responder
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2 transition-colors rounded-lg mx-1"
                    onClick={() => {
                      navigator.clipboard.writeText(messages[contextMenuPosition.messageIndex].content);
                      setContextMenuPosition(null);
                      toast({ title: "Copiado", description: "Mensaje copiado" });
                    }}
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Image Viewer with Glass Effect */}
          {selectedImage && (
            <div 
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-float-in"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-[90vw] max-h-[90vh]">
                <Button
                  size="icon"
                  variant="ghost"
                  className="glass-button absolute -top-12 right-0 rounded-full"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <img 
                  src={selectedImage} 
                  alt="Vista completa"
                  className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl glass-panel"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Button
                    size="sm"
                    className="glass-button rounded-full px-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      const a = document.createElement('a');
                      a.href = selectedImage;
                      a.download = `imagen-ai-${Date.now()}.png`;
                      a.click();
                    }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
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
