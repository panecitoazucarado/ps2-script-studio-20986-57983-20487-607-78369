import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Code2, FileText, FolderPlus, Trash2, Edit3, MessageSquare, Save, Copy, ThumbsUp, ThumbsDown, Reply, ImagePlus, Sparkles, Download, Upload, X, FileCode, File, Paintbrush, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileNode } from '@/types/athena';
import { AICodeBlock } from './AICodeBlock';
import { ConversationManager, Conversation } from './ConversationManager';
import { ImagePaintEditor } from './ImagePaintEditor';
import { AIThinkingProcess, ThinkingProcessData, generateThinkingSteps, FileChange } from './AIThinkingProcess';

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
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [imageGenerationProgress, setImageGenerationProgress] = useState<{ current: number; total: number; progress: number }[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editedMaskData, setEditedMaskData] = useState<{ [key: number]: string }>({});
  const [usageStats, setUsageStats] = useState({
    model: 'google/gemini-2.5-flash',
    imagesGenerated: 0,
    maxImages: 4,
    dailyTokensUsed: 0,
    dailyTokensLimit: 100000
  });
  const [thinkingProcess, setThinkingProcess] = useState<ThinkingProcessData | null>(null);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [showThinkingProcess, setShowThinkingProcess] = useState(false);
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

  // Save current conversation (without base64 images to avoid QuotaExceededError)
  const saveCurrentConversation = () => {
    if (messages.length <= 1) return; // Don't save if only welcome message

    // Get existing conversation title if renaming, otherwise use first user message
    const existingConv = conversations.find(c => c.id === currentConversationId);
    const conversationTitle = existingConv?.title || (messages.length > 1 
      ? messages[1].content.substring(0, 50) + (messages[1].content.length > 50 ? '...' : '')
      : 'Nueva conversación');

    const conversation: Conversation = {
      id: currentConversationId || Date.now().toString(),
      title: conversationTitle,
      timestamp: Date.now(),
      messageCount: messages.length
    };

    const updatedConversations = currentConversationId
      ? conversations.map(c => c.id === currentConversationId ? { ...conversation, title: c.title } : c)
      : [...conversations, conversation];

    // Clean messages to avoid localStorage quota issues - remove base64 images
    const cleanedMessages = messages.map(msg => ({
      ...msg,
      images: msg.images?.map(img => 
        img.startsWith('data:') ? '[imagen generada]' : img
      ),
      attachedFiles: msg.attachedFiles?.map(file => ({
        ...file,
        data: file.data.length > 10000 ? '[archivo grande]' : file.data,
        preview: undefined
      }))
    }));

    try {
      setConversations(updatedConversations);
      localStorage.setItem('ai-conversations', JSON.stringify(updatedConversations));
      localStorage.setItem(`conversation-${conversation.id}`, JSON.stringify(cleanedMessages));
      
      if (!currentConversationId) {
        setCurrentConversationId(conversation.id);
      }

      toast({
        title: "Conversación guardada",
        description: "Tu conversación ha sido guardada exitosamente",
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
      // If still too large, try saving without any file data
      const minimalMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        fileOperations: msg.fileOperations,
        images: msg.images?.length ? ['[imagen generada]'] : undefined,
        likes: msg.likes,
        replyTo: msg.replyTo
      }));
      
      try {
        localStorage.setItem(`conversation-${conversation.id}`, JSON.stringify(minimalMessages));
        toast({
          title: "Conversación guardada",
          description: "Guardada sin archivos adjuntos por límite de espacio",
        });
      } catch (e) {
        toast({
          title: "Error",
          description: "No se pudo guardar la conversación - espacio insuficiente",
          variant: "destructive"
        });
      }
    }
  };

  // Rename conversation
  const renameConversation = (id: string, newTitle: string) => {
    const updatedConversations = conversations.map(c => 
      c.id === id ? { ...c, title: newTitle } : c
    );
    setConversations(updatedConversations);
    localStorage.setItem('ai-conversations', JSON.stringify(updatedConversations));
    toast({
      title: "Nombre actualizado",
      description: "El nombre de la conversación ha sido cambiado",
    });
  };

  // Load conversation - normalize for current interface version
  const loadConversation = (id: string) => {
    const saved = localStorage.getItem(`conversation-${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Normalize messages for current interface
        const normalizedMessages: Message[] = parsed.map((msg: any) => ({
          role: msg.role || 'assistant',
          content: msg.content || '',
          timestamp: msg.timestamp || Date.now(),
          fileOperations: msg.fileOperations || [],
          // Handle placeholder images or keep real URLs
          images: msg.images?.filter((img: string) => img && img !== '[imagen generada]') || [],
          likes: msg.likes || 0,
          replyTo: msg.replyTo,
          imageLikes: msg.imageLikes || {},
          attachedFiles: msg.attachedFiles?.filter((f: any) => f.data && f.data !== '[archivo grande]') || []
        }));
        
        // Ensure we have at least the welcome message structure
        if (normalizedMessages.length === 0) {
          normalizedMessages.push({
            role: 'assistant',
            content: 'Conversación restaurada',
            timestamp: Date.now()
          });
        }
        
        setMessages(normalizedMessages);
        setCurrentConversationId(id);
        setShowConversations(false);
        toast({
          title: "Conversación cargada",
          description: `Se ha restaurado la conversación (${normalizedMessages.length} mensajes)`,
        });
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la conversación",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error",
        description: "No se encontró la conversación guardada",
        variant: "destructive"
      });
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

  // Detectar si el usuario pide generar CÓDIGO
  const detectCodeGeneration = (text: string): boolean => {
    const lowerText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Keywords fuertes que indican código
    const codeKeywords = [
      'codigo', 'code', 'script', 'funcion', 'function', 'algoritmo', 'algorithm',
      'programa', 'program', 'clase', 'class', 'metodo', 'method', 'variable',
      'implementa', 'implement', 'desarrolla', 'develop', 'escribe.*codigo',
      'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'html', 'css',
      'react', 'vue', 'angular', 'node', 'express', 'sql', 'json', 'api',
      'archivo.*\\.js', 'archivo.*\\.ts', 'archivo.*\\.py', 'archivo.*\\.cpp',
      '\\.js', '\\.ts', '\\.py', '\\.cpp', '\\.c', '\\.h', '\\.java', '\\.html', '\\.css',
      'calculadora.*en', 'en.*javascript', 'en.*python', 'en.*java', 'en.*c\\+\\+',
      'loop', 'bucle', 'array', 'objeto', 'string', 'number', 'boolean',
      'if.*else', 'switch', 'for.*loop', 'while.*loop', 'try.*catch',
      'import', 'export', 'module', 'package', 'library', 'framework'
    ];
    
    return codeKeywords.some(keyword => new RegExp(keyword, 'i').test(lowerText));
  };

  // Detectar si el usuario pide generar una imagen y cuántas
  const detectImageGeneration = (text: string): { shouldGenerate: boolean; count: number } => {
    const lowerText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // PRIMERO: Si detectamos que es una solicitud de código, NO generar imagen
    if (detectCodeGeneration(text)) {
      return { shouldGenerate: false, count: 0 };
    }
    
    // Keywords que indican generación de imagen VISUAL (no código)
    const imageKeywords = [
      'imagen', 'foto', 'picture', 'ilustracion', 'grafico', 'visual', 'render', 
      'arte', 'dibujo', 'drawing', 'pintura', 'painting', 'banner', 'poster', 
      'portada', 'thumbnail', 'wallpaper', 'fondo de pantalla', 'avatar',
      'retrato', 'portrait', 'paisaje', 'landscape', 'escena', 'scene'
    ];
    
    // Verbos de creación visual
    const visualVerbs = [
      'dibuja', 'draw', 'pinta', 'paint', 'ilustra', 'illustrate',
      'renderiza', 'render', 'visualiza', 'visualize'
    ];
    
    // Debe tener keyword de imagen O verbo visual
    const hasImageKeyword = imageKeywords.some(keyword => lowerText.includes(keyword));
    const hasVisualVerb = visualVerbs.some(verb => lowerText.includes(verb));
    
    // Contexto que indica imagen visual explícita
    const explicitImageContext = /genera(me)?\s+(una?\s+)?(imagen|foto|ilustracion|dibujo|arte)/i.test(lowerText) ||
                                 /crea(me)?\s+(una?\s+)?(imagen|foto|ilustracion|dibujo|arte)/i.test(lowerText) ||
                                 /haz(me)?\s+(una?\s+)?(imagen|foto|ilustracion|dibujo|arte)/i.test(lowerText);
    
    const shouldGenerate = hasImageKeyword || hasVisualVerb || explicitImageContext;
    if (!shouldGenerate) return { shouldGenerate: false, count: 0 };
    
    // Detectar cantidad
    let count = 1;
    
    // Patrones para números explícitos
    const explicitNumberPatterns = [
      /(\d+)\s*(imagenes?|fotos?|ilustraciones?|dibujos?|pictures?|images?)/i,
      /genera(?:me)?\s+(\d+)/i,
      /crea(?:me)?\s+(\d+)/i,
      /haz(?:me)?\s+(\d+)/i,
    ];
    
    for (const pattern of explicitNumberPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        count = Math.min(Math.max(parseInt(match[1]), 1), 4);
        return { shouldGenerate, count };
      }
    }
    
    // Patrones para palabras numéricas
    const wordNumbers: Record<string, number> = {
      'una': 1, 'uno': 1, 'un': 1, 'one': 1,
      'dos': 2, 'two': 2, 'par de': 2, 'couple': 2,
      'tres': 3, 'three': 3,
      'cuatro': 4, 'four': 4,
    };
    
    for (const [word, num] of Object.entries(wordNumbers)) {
      if (lowerText.includes(word)) {
        count = num;
        break;
      }
    }
    
    // Detectar plural
    const pluralPatterns = ['imagenes', 'fotos', 'ilustraciones', 'dibujos', 'pictures', 'images'];
    const hasPlural = pluralPatterns.some(p => lowerText.includes(p));
    
    if (/algunas?|varias?|several|multiple/i.test(lowerText)) {
      count = 3;
    } else if (hasPlural && count === 1) {
      count = 2;
    }
    
    return { shouldGenerate, count: Math.min(Math.max(count, 1), 4) };
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
    const shouldGenerateCode = detectCodeGeneration(inputText);
    
    if (shouldGenerateImage) {
      setIsGeneratingImage(true);
      setIsGeneratingCode(false);
      setShowThinkingProcess(false);
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
    } else if (shouldGenerateCode) {
      setIsGeneratingCode(true);
      setIsGeneratingImage(false);
      setShowThinkingProcess(true);
      
      // Initialize thinking process with Cursor-like thinking steps
      const initialSteps = generateThinkingSteps(inputText);
      setThinkingProcess({
        userRequest: inputText,
        thinkingSteps: initialSteps,
        fileChanges: [],
        isComplete: false
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
      
      // Get mask data for edited images
      const imageMasks = userFilesData
        .filter(f => f.type.startsWith('image/'))
        .map((_, idx) => editedMaskData[idx] || null);
      
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
          imageMasks: imageMasks.some(m => m) ? imageMasks : undefined,
          userFiles: otherFiles.length > 0 ? otherFiles : undefined
        }
      });

      // Clear mask data after sending
      setEditedMaskData({});

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

      // If code was generated, complete the thinking process
      if (shouldGenerateCode && thinkingProcess) {
        // Mark thinking as complete with file changes
        const fileChanges: FileChange[] = data.fileOperations?.map((op: any) => ({
          path: op.path || op.newPath || '',
          type: op.operation === 'create_file' ? 'create' as const : 
                op.operation === 'delete_file' ? 'delete' as const : 'modify' as const,
          additions: Math.floor(Math.random() * 50) + 10,
          deletions: Math.floor(Math.random() * 10),
          originalContent: '',
          newContent: op.content || '',
          accepted: undefined
        })) || [];

        setThinkingProcess(prev => prev ? {
          ...prev,
          thinkingSteps: prev.thinkingSteps.map(s => ({ ...s, isComplete: true })),
          fileChanges,
          isComplete: true
        } : null);
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
      setIsGeneratingCode(false);
      setImageGenerationProgress([]);
      // Keep thinking process visible for a moment after completion
      if (shouldGenerateCode) {
        setTimeout(() => {
          setShowThinkingProcess(false);
          setThinkingProcess(null);
        }, 3000);
      }
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
          onRenameConversation={renameConversation}
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
                        <div className="space-y-1.5 w-full max-w-[95%] sm:max-w-[85%] md:max-w-[75%] min-w-0">
                          <div
                            className={`rounded-2xl px-2 py-2 sm:px-3 md:px-4 md:py-3 text-sm transition-all overflow-hidden ${
                              message.role === 'user'
                                ? 'glass-panel bg-gradient-to-r from-ps2-cyan/10 to-ps2-purple/10 border-ps2-cyan/20'
                                : 'glass-panel border-border/30'
                            }`}
                          >
                          {message.role === 'assistant' ? (
                            <div className="space-y-2 sm:space-y-3 w-full overflow-hidden">
                              {formatCodeBlock(message.content).map((part, i) => (
                                part.type === 'code' ? (
                                  <div key={i} className="w-full overflow-x-auto">
                                    <AICodeBlock
                                      code={part.content}
                                      language={part.language}
                                      onApplyToFile={onApplyCode}
                                    />
                                  </div>
                                ) : (
                                  <p key={i} className="text-[11px] sm:text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words">{part.content}</p>
                                )
                              ))}
                              
                              {/* Imágenes generadas por la IA - Layout responsivo según cantidad */}
                              {message.images && message.images.length > 0 && (
                                <div className={`mt-4 ${
                                  message.images.length === 1 
                                    ? 'w-full' 
                                    : message.images.length === 2 
                                      ? 'grid grid-cols-2 gap-3' 
                                      : message.images.length === 3 
                                        ? 'grid grid-cols-3 gap-3' 
                                        : 'grid grid-cols-2 gap-3'
                                }`}>
                                  {message.images.map((img, imgIdx) => (
                                    <div 
                                      key={imgIdx} 
                                      className={`relative group overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-purple-500/10 p-[2px] ${
                                        message.images.length === 1 ? 'w-full max-w-lg mx-auto' : ''
                                      }`}
                                      onContextMenu={(e) => handleContextMenu(e, index + 1, imgIdx)}
                                    >
                                      <div className="relative rounded-[14px] overflow-hidden bg-background/80 backdrop-blur-xl">
                                        <img 
                                          src={img} 
                                          alt={`Generado ${imgIdx + 1}`}
                                          className={`w-full h-auto cursor-pointer transition-all duration-300 hover:scale-[1.03] ${
                                            message.images.length === 1 ? 'max-h-[400px] object-contain' : 'aspect-square object-cover'
                                          }`}
                                          onClick={() => setSelectedImage(img)}
                                        />
                                        
                                        {/* Gradient overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                                        
                                        {/* Image controls - Modern floating style */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                          <button
                                            onClick={() => {
                                              const a = document.createElement('a');
                                              a.href = img;
                                              a.download = `imagen-ai-${Date.now()}.png`;
                                              a.click();
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium hover:bg-white/30 transition-colors"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleImageLike(index + 1, imgIdx, 1)}
                                            className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                                              message.imageLikes?.[imgIdx] === 1 
                                                ? 'bg-emerald-500/80 text-white' 
                                                : 'bg-white/20 text-white hover:bg-emerald-500/50'
                                            }`}
                                          >
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleImageLike(index + 1, imgIdx, -1)}
                                            className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                                              message.imageLikes?.[imgIdx] === -1 
                                                ? 'bg-red-500/80 text-white' 
                                                : 'bg-white/20 text-white hover:bg-red-500/50'
                                            }`}
                                          >
                                            <ThumbsDown className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        
                                        {/* Like indicator badge - Copilot style */}
                                        {message.imageLikes?.[imgIdx] === 1 && (
                                          <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 shadow-lg">
                                            <ThumbsUp className="w-3 h-3" />
                                            <span>Favorita</span>
                                          </div>
                                        )}
                                      </div>
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
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                        <Bot className="w-4 h-4 md:w-5 md:h-5 text-white animate-pulse" />
                      </div>
                      
                      {isGeneratingImage && imageGenerationProgress.length > 0 ? (
                        /* Modern Image Generation Preview - Copilot Style */
                        <div className={`${
                          imageGenerationProgress.length === 1 
                            ? 'w-full max-w-sm' 
                            : imageGenerationProgress.length === 2 
                              ? 'grid grid-cols-2 gap-3 max-w-lg' 
                              : imageGenerationProgress.length === 3 
                                ? 'grid grid-cols-3 gap-3 max-w-xl' 
                                : 'grid grid-cols-2 gap-3 max-w-lg'
                        }`}>
                          {imageGenerationProgress.map((prog, idx) => (
                            <div 
                              key={idx} 
                              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-purple-600/20 p-[1px] ${
                                imageGenerationProgress.length === 1 ? 'aspect-[4/3]' : 'aspect-square'
                              }`}
                            >
                              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                {/* Animated gradient background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-950/90 to-slate-900/95" />
                                
                                {/* Animated shimmer effect */}
                                <div className="absolute inset-0 overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                </div>
                                
                                {/* Glowing orbs */}
                                <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
                                <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-purple-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                              </div>
                              
                              {/* Content */}
                              <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4">
                                {/* Rotating ring */}
                                <div className="relative">
                                  <div className="w-14 h-14 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-blue-400" />
                                  </div>
                                </div>
                                
                                {/* Progress info */}
                                <div className="text-center space-y-2 w-full px-2">
                                  <p className="text-sm font-medium text-blue-100">
                                    Imaginando...
                                  </p>
                                  
                                  {/* Progress bar */}
                                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full transition-all duration-500 ease-out"
                                      style={{ width: `${prog.progress}%` }}
                                    />
                                  </div>
                                  
                                  {/* Stats */}
                                  <div className="flex items-center justify-center gap-2 text-xs text-blue-200/70">
                                    <span className="font-mono">{Math.round(prog.progress)}%</span>
                                    {imageGenerationProgress.length > 1 && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-blue-400/50" />
                                        <span>{prog.current} de {prog.total}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isGeneratingCode && showThinkingProcess ? (
                        /* AI Thinking Process - Cursor/Trae Style */
                        <div className="w-full max-w-xl">
                          <AIThinkingProcess
                            data={thinkingProcess}
                            isThinking={isLoading}
                            onAcceptChange={(index) => {
                              setThinkingProcess(prev => prev ? {
                                ...prev,
                                fileChanges: prev.fileChanges.map((f, i) => 
                                  i === index ? { ...f, accepted: true } : f
                                )
                              } : null);
                            }}
                            onRejectChange={(index) => {
                              setThinkingProcess(prev => prev ? {
                                ...prev,
                                fileChanges: prev.fileChanges.map((f, i) => 
                                  i === index ? { ...f, accepted: false } : f
                                )
                              } : null);
                            }}
                            onOpenDiff={(file) => {
                              toast({
                                title: "Open Diff",
                                description: `Visualizando cambios en ${file.path}`,
                              });
                            }}
                            onRevertToVersion={(versionId) => {
                              toast({
                                title: "Revertir versión",
                                description: `Restaurando a versión: ${versionId}`,
                              });
                            }}
                          />
                        </div>
                      ) : isGeneratingCode ? (
                        /* Fallback Code Generation Indicator */
                        <div className="w-full max-w-md rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 border-b border-slate-700/50">
                            <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500/70" />
                              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                              <div className="w-3 h-3 rounded-full bg-green-500/70" />
                            </div>
                            <span className="text-xs text-slate-400 font-mono ml-2">Desarrollando código...</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-mono text-xs">1</span>
                                <div className="h-3 bg-gradient-to-r from-emerald-500/30 to-transparent rounded animate-pulse w-3/4" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-mono text-xs">2</span>
                                <div className="h-3 bg-gradient-to-r from-blue-500/30 to-transparent rounded animate-pulse w-1/2" style={{ animationDelay: '0.1s' }} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-mono text-xs">3</span>
                                <div className="h-3 bg-gradient-to-r from-purple-500/30 to-transparent rounded animate-pulse w-2/3" style={{ animationDelay: '0.2s' }} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-mono text-xs">4</span>
                                <div className="h-3 bg-gradient-to-r from-cyan-500/30 to-transparent rounded animate-pulse w-4/5" style={{ animationDelay: '0.3s' }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                              <Code2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                              <span className="text-xs text-slate-400">Analizando y generando código profesional</span>
                              <div className="ml-auto flex gap-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Text thinking indicator */
                        <div className="rounded-2xl px-4 py-3 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm text-muted-foreground">Pensando...</span>
                          </div>
                        </div>
                      )}
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
              <div className="glass-panel p-2 rounded-lg mx-1 flex flex-wrap gap-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    {file.preview ? (
                      <div className="relative glass-panel p-0.5 rounded-lg overflow-hidden">
                        <img 
                          src={file.preview} 
                          alt={file.name} 
                          className={`w-16 h-16 object-cover rounded-lg transition-all ${
                            editedMaskData[idx] ? 'ring-2 ring-blue-500' : ''
                          }`}
                        />
                        {/* Edit badge if mask applied */}
                        {editedMaskData[idx] && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500/80 to-transparent px-1 py-0.5">
                            <span className="text-[8px] text-white font-medium">Editada</span>
                          </div>
                        )}
                        {/* Edit button on hover */}
                        <button
                          onClick={() => setEditingImageIndex(idx)}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Paintbrush className="w-4 h-4 text-white" />
                            <span className="text-[9px] text-white font-medium">Editar</span>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 glass-panel flex flex-col items-center justify-center rounded-lg">
                        {file.type.includes('pdf') ? (
                          <FileText className="w-5 h-5 text-red-400" />
                        ) : (
                          <FileCode className="w-5 h-5 text-blue-400" />
                        )}
                        <span className="text-[8px] text-muted-foreground mt-1 truncate max-w-[50px]">
                          {file.name.split('.').pop()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeUploadedFile(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <X className="w-3 h-3" />
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

          {/* Image Paint Editor */}
          {editingImageIndex !== null && uploadedFiles[editingImageIndex]?.preview && (
            <ImagePaintEditor
              imageUrl={uploadedFiles[editingImageIndex].preview!}
              onSave={(editedImageUrl, maskDataUrl) => {
                // Update the file preview with edited image
                setUploadedFiles(prev => prev.map((file, idx) => 
                  idx === editingImageIndex 
                    ? { ...file, preview: editedImageUrl, data: editedImageUrl }
                    : file
                ));
                // Store mask data for AI processing
                setEditedMaskData(prev => ({ ...prev, [editingImageIndex]: maskDataUrl }));
                setEditingImageIndex(null);
                toast({
                  title: "Imagen editada",
                  description: "Las marcas se enviarán junto con tu mensaje a la IA",
                });
              }}
              onCancel={() => setEditingImageIndex(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
