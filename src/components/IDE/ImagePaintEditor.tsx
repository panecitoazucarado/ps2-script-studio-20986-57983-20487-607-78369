import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  X, Check, Paintbrush, Eraser, RotateCcw, 
  ZoomIn, ZoomOut, Sparkles, Palette, Move
} from 'lucide-react';

interface ImagePaintEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string, maskDataUrl: string) => void;
  onCancel: () => void;
}

export function ImagePaintEditor({ imageUrl, onSave, onCancel }: ImagePaintEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushColor, setBrushColor] = useState('#ff6b6b');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const presetColors = [
    '#ff6b6b', // Red
    '#4ecdc4', // Cyan
    '#45b7d1', // Blue
    '#96ceb4', // Green
    '#ffeaa7', // Yellow
    '#dfe6e9', // Light gray
    '#ff9ff3', // Pink
    '#54a0ff', // Bright blue
  ];

  // Load image and setup canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!canvas || !maskCanvas) return;

      // Calculate size to fit in container while maintaining aspect ratio
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.6;
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      maskCanvas.width = width;
      maskCanvas.height = height;
      
      setCanvasSize({ width, height });

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Initialize mask canvas with transparent background
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.clearRect(0, 0, width, height);
      }

      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isPanning) return;

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : brushColor;
    ctx.globalAlpha = tool === 'eraser' ? 1 : 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }, [isDrawing, isPanning, tool, brushSize, brushColor, getCanvasCoordinates]);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === 'mousedown' && (e as React.MouseEvent).button === 1) {
      // Middle click for panning
      setIsPanning(true);
      const event = e as React.MouseEvent;
      setLastPanPoint({ x: event.clientX, y: event.clientY });
      return;
    }

    if ((e as React.MouseEvent).altKey) {
      setIsPanning(true);
      const event = e as React.MouseEvent;
      setLastPanPoint({ x: event.clientX, y: event.clientY });
      return;
    }

    setIsDrawing(true);
    draw(e);
  }, [draw]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setIsPanning(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    draw(e);
  }, [isPanning, lastPanPoint, draw]);

  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
  }, []);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    // Create combined image (original + mask overlay)
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = canvas.width;
    combinedCanvas.height = canvas.height;
    const combinedCtx = combinedCanvas.getContext('2d');
    
    if (combinedCtx) {
      combinedCtx.drawImage(canvas, 0, 0);
      combinedCtx.globalAlpha = 0.5;
      combinedCtx.drawImage(maskCanvas, 0, 0);
    }

    const editedImageUrl = combinedCanvas.toDataURL('image/png');
    const maskDataUrl = maskCanvas.toDataURL('image/png');

    onSave(editedImageUrl, maskDataUrl);
  }, [onSave]);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-gradient-to-r from-slate-900/90 to-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-200">Editor Mágico</span>
          </div>
          <span className="text-xs text-muted-foreground hidden md:block">
            Pinta las áreas que deseas modificar
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
          >
            <Check className="w-4 h-4 mr-1" />
            Aplicar
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-2 border-b border-white/10 bg-slate-900/50">
        {/* Tool Selection */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 border border-white/10">
          <Button
            size="sm"
            variant={tool === 'brush' ? 'default' : 'ghost'}
            onClick={() => setTool('brush')}
            className={`h-8 px-3 rounded-lg ${tool === 'brush' ? 'bg-blue-500 text-white' : 'text-muted-foreground'}`}
          >
            <Paintbrush className="w-4 h-4 mr-1" />
            Pincel
          </Button>
          <Button
            size="sm"
            variant={tool === 'eraser' ? 'default' : 'ghost'}
            onClick={() => setTool('eraser')}
            className={`h-8 px-3 rounded-lg ${tool === 'eraser' ? 'bg-red-500 text-white' : 'text-muted-foreground'}`}
          >
            <Eraser className="w-4 h-4 mr-1" />
            Borrar
          </Button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-muted-foreground">Tamaño:</span>
          <Slider
            value={[brushSize]}
            onValueChange={(v) => setBrushSize(v[0])}
            min={5}
            max={100}
            step={1}
            className="w-24"
          />
          <span className="text-xs text-foreground w-6">{brushSize}</span>
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10">
          <Palette className="w-4 h-4 text-muted-foreground" />
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                brushColor === color 
                  ? 'border-white scale-110 shadow-lg' 
                  : 'border-transparent hover:border-white/50'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 border border-white/10">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleZoom(-0.25)}
            className="h-8 w-8"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleZoom(0.25)}
            className="h-8 w-8"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Clear Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={clearMask}
          className="h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Limpiar
        </Button>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-black"
      >
        <div 
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: isPanning || isDrawing ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          {/* Checkerboard background for transparency */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #333 25%, transparent 25%),
                linear-gradient(-45deg, #333 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #333 75%),
                linear-gradient(-45deg, transparent 75%, #333 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          />
          
          {/* Original Image Canvas */}
          <canvas
            ref={canvasRef}
            className="relative"
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          
          {/* Mask Canvas (overlay) */}
          <canvas
            ref={maskCanvasRef}
            className="absolute inset-0 cursor-crosshair"
            style={{ display: imageLoaded ? 'block' : 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={(e) => draw(e)}
            onTouchEnd={stopDrawing}
          />

          {/* Brush Preview */}
          <div 
            className="pointer-events-none fixed rounded-full border-2 border-white/50 mix-blend-difference"
            style={{
              width: brushSize * zoom,
              height: brushSize * zoom,
              transform: 'translate(-50%, -50%)',
              display: 'none' // Will be shown with mouse tracking
            }}
          />

          {!imageLoaded && (
            <div className="flex items-center justify-center w-64 h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="flex items-center justify-center gap-4 p-2 border-t border-white/10 bg-slate-900/50 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Paintbrush className="w-3 h-3" />
          Click + arrastrar para pintar
        </span>
        <span className="hidden md:flex items-center gap-1">
          <Move className="w-3 h-3" />
          Alt + arrastrar para mover
        </span>
        <span>Scroll para zoom</span>
      </div>
    </div>
  );
}
