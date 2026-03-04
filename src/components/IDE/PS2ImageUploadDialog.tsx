import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Upload, Image as ImageIcon, FolderOpen, FolderPlus, Check,
  X, Monitor, Smartphone, Gamepad2, Sparkles, HardDrive,
  Cpu, ArrowRight, ChevronRight, Info, Maximize2, Star
} from 'lucide-react';

// PS2 valid image dimension presets
const PS2_DIMENSION_PRESETS = [
  { label: '16×16', w: 16, h: 16, desc: 'Micro icono', category: 'icon' },
  { label: '32×32', w: 32, h: 32, desc: 'Icono pequeño', category: 'icon' },
  { label: '64×64', w: 64, h: 64, desc: 'Icono / Sprite', category: 'icon' },
  { label: '128×128', w: 128, h: 128, desc: 'Sprite grande', category: 'sprite' },
  { label: '256×256', w: 256, h: 256, desc: 'Textura estándar', category: 'texture' },
  { label: '512×512', w: 512, h: 512, desc: 'Textura HD', category: 'texture' },
  { label: '128×64', w: 128, h: 64, desc: 'Banner pequeño', category: 'banner' },
  { label: '256×64', w: 256, h: 64, desc: 'Banner medio', category: 'banner' },
  { label: '512×128', w: 512, h: 128, desc: 'Banner grande', category: 'banner' },
  { label: '200×80', w: 200, h: 80, desc: 'Logo estándar', category: 'logo' },
  { label: '300×100', w: 300, h: 100, desc: 'Logo grande', category: 'logo' },
  { label: '640×448', w: 640, h: 448, desc: 'Pantalla completa PS2', category: 'background' },
  { label: '512×448', w: 512, h: 448, desc: 'Fondo NTSC', category: 'background' },
  { label: '640×512', w: 640, h: 512, desc: 'Fondo PAL', category: 'background' },
];

const IMAGE_TYPES = [
  { id: 'icon', label: 'Icono', icon: Star, desc: 'Iconos de UI pequeños' },
  { id: 'sprite', label: 'Sprite', icon: Gamepad2, desc: 'Sprites de juego / atlas' },
  { id: 'logo', label: 'Logo', icon: Sparkles, desc: 'Logo / marca' },
  { id: 'banner', label: 'Banner', icon: Monitor, desc: 'Banners horizontales' },
  { id: 'texture', label: 'Textura', icon: Maximize2, desc: 'Texturas para 3D/2D' },
  { id: 'background', label: 'Fondo', icon: Monitor, desc: 'Fondo de pantalla' },
];

const VRAM_OPTIONS = [
  { id: 'VRAM', label: 'VRAM', desc: 'Carga en memoria de video (rápido, limitado a 4MB)', recommended: true },
  { id: 'RAM', label: 'RAM', desc: 'Carga en memoria principal (más espacio, 32MB)', recommended: false },
  { id: 'NONE', label: 'Auto', desc: 'Sin especificar destino — AthenaEnv decide automáticamente', recommended: false },
];

const FILTER_OPTIONS = [
  { id: 'NEAREST', label: 'Nearest', desc: 'Píxeles nítidos, ideal para pixel art' },
  { id: 'LINEAR', label: 'Linear', desc: 'Suavizado bilinear, ideal para fotos/logos' },
];

interface PS2ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageReady: (config: PS2ImageConfig) => void;
  existingFolders?: string[];
}

export interface PS2ImageConfig {
  fileName: string;
  folderPath: string;
  width: number;
  height: number;
  imageType: string;
  memoryTarget: string;
  filter: string;
  imageDataUrl: string;
}

export function PS2ImageUploadDialog({
  open, onOpenChange, onImageReady, existingFolders = []
}: PS2ImageUploadDialogProps) {
  // Steps: 1=type, 2=dimensions, 3=upload, 4=folder/save
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('sprite');
  const [selectedPreset, setSelectedPreset] = useState<{ w: number; h: number } | null>(null);
  const [customW, setCustomW] = useState(128);
  const [customH, setCustomH] = useState(128);
  const [useCustom, setUseCustom] = useState(false);
  const [memoryTarget, setMemoryTarget] = useState('VRAM');
  const [filter, setFilter] = useState('NEAREST');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [fileName, setFileName] = useState('');
  const [folderName, setFolderName] = useState('assets');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const targetW = useCustom ? customW : (selectedPreset?.w || 128);
  const targetH = useCustom ? customH : (selectedPreset?.h || 128);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedType('sprite');
      setSelectedPreset(null);
      setUseCustom(false);
      setImagePreview(null);
      setOriginalFileName('');
      setFileName('');
      setFolderName('assets');
      setSelectedFolder(null);
    }
  }, [open]);

  // Filter presets by selected type
  const filteredPresets = PS2_DIMENSION_PRESETS.filter(p => p.category === selectedType);

  // Auto-select first preset when type changes
  useEffect(() => {
    const presets = PS2_DIMENSION_PRESETS.filter(p => p.category === selectedType);
    if (presets.length > 0 && !useCustom) {
      setSelectedPreset({ w: presets[0].w, h: presets[0].h });
    }
  }, [selectedType, useCustom]);

  // Process uploaded image - resize to target dimensions
  const processImage = useCallback((file: File) => {
    setOriginalFileName(file.name);
    const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/\s+/g, '_');
    setFileName(baseName);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High quality resize
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        setImagePreview(canvas.toDataURL('image/png'));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [targetW, targetH]);

  // Re-process when dimensions change and we have an image
  useEffect(() => {
    if (imagePreview && originalFileName) {
      // Re-render from the existing preview won't work cleanly,
      // but the user can re-upload. For now we show the current preview.
    }
  }, [targetW, targetH]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  }, [processImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  }, [processImage]);

  const handleSave = useCallback(() => {
    if (!imagePreview) return;

    const folder = selectedFolder || folderName || 'assets';
    const finalFileName = fileName || 'image';

    onImageReady({
      fileName: `${finalFileName}.png`,
      folderPath: folder,
      width: targetW,
      height: targetH,
      imageType: selectedType,
      memoryTarget,
      filter,
      imageDataUrl: imagePreview
    });

    onOpenChange(false);
  }, [imagePreview, selectedFolder, folderName, fileName, targetW, targetH, selectedType, memoryTarget, filter, onImageReady, onOpenChange]);

  // Detect folders from file explorer via window API
  const [detectedFolders, setDetectedFolders] = useState<string[]>([]);
  useEffect(() => {
    if (!open) return;
    const fs = (window as any).__athenaFS;
    if (fs && typeof fs.getFiles === 'function') {
      try {
        const files = fs.getFiles();
        const folders = new Set<string>();
        files.forEach((f: any) => {
          const path = typeof f === 'string' ? f : f.path || f.name || '';
          const parts = path.split('/');
          if (parts.length > 1) {
            folders.add(parts[0]);
          }
        });
        setDetectedFolders(Array.from(folders));
      } catch { setDetectedFolders([]); }
    } else {
      setDetectedFolders(existingFolders);
    }
  }, [open, existingFolders]);

  const allFolders = [...new Set([...detectedFolders, ...existingFolders])].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0d0d20] border-white/[0.08] text-white p-0 overflow-hidden gap-0">
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/bmp" className="hidden" onChange={handleFileSelect} />

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-purple-400" />
              </div>
              Importar Imagen — PlayStation 2
            </DialogTitle>
            <DialogDescription className="text-[11px] text-gray-500 mt-1">
              Configura y carga una imagen optimizada para AthenaEnv con dimensiones válidas para PS2.
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-3">
            {['Tipo', 'Dimensiones', 'Imagen', 'Guardar'].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <button
                  onClick={() => { if (i + 1 < step) setStep(i + 1); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                    step === i + 1
                      ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                      : step > i + 1
                        ? 'bg-green-500/15 text-green-400 border border-green-500/20 cursor-pointer'
                        : 'bg-white/[0.03] text-gray-600 border border-white/[0.06]'
                  }`}
                >
                  {step > i + 1 ? <Check className="w-3 h-3" /> : <span className="w-3 text-center">{i + 1}</span>}
                  {s}
                </button>
                {i < 3 && <ChevronRight className="w-3 h-3 text-gray-700" />}
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-white/[0.06]" />

        {/* Content area */}
        <div className="px-5 py-4 min-h-[320px]">

          {/* Step 1: Image Type */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-400">¿Qué tipo de imagen vas a cargar?</p>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_TYPES.map(t => {
                  const Icon = t.icon;
                  const active = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-center ${
                        active
                          ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                          : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/[0.12] hover:text-gray-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        active ? 'bg-purple-500/25 text-purple-300' : 'bg-white/[0.04] text-gray-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold">{t.label}</span>
                      <span className="text-[9px] text-gray-600 leading-tight">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Dimensions */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-400">Selecciona las dimensiones para tu imagen</p>
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] text-gray-500">Personalizado</Label>
                  <Switch checked={useCustom} onCheckedChange={setUseCustom} className="scale-75" />
                </div>
              </div>

              {!useCustom ? (
                <div className="grid grid-cols-2 gap-2">
                  {filteredPresets.map(p => {
                    const active = selectedPreset?.w === p.w && selectedPreset?.h === p.h;
                    return (
                      <button
                        key={p.label}
                        onClick={() => setSelectedPreset({ w: p.w, h: p.h })}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                          active
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                            : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:border-white/[0.12] hover:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded border flex items-center justify-center text-[8px] font-mono ${
                            active ? 'border-cyan-500/50 text-cyan-300' : 'border-white/[0.1] text-gray-600'
                          }`} style={{
                            width: Math.max(16, Math.min(24, p.w / 20)),
                            height: Math.max(12, Math.min(24, p.h / 20)),
                          }} />
                          <div className="text-left">
                            <div className="text-[11px] font-semibold font-mono">{p.label}</div>
                            <div className="text-[9px] text-gray-600">{p.desc}</div>
                          </div>
                        </div>
                        {active && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    );
                  })}
                  {filteredPresets.length === 0 && (
                    <div className="col-span-2 text-center py-6 text-gray-600 text-[11px]">
                      No hay presets para este tipo. Usa dimensiones personalizadas.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-gray-500">Ancho (px)</Label>
                      <Input
                        type="number" min={8} max={1024} step={8} value={customW}
                        onChange={(e) => setCustomW(Number(e.target.value))}
                        className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white font-mono"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-gray-500">Alto (px)</Label>
                      <Input
                        type="number" min={8} max={1024} step={8} value={customH}
                        onChange={(e) => setCustomH(Number(e.target.value))}
                        className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Info className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <p className="text-[10px] text-yellow-300/80">
                      PS2 soporta texturas en potencias de 2 (8, 16, 32, 64, 128, 256, 512). Máximo recomendado: 512×512 para VRAM.
                    </p>
                  </div>
                </div>
              )}

              {/* Memory & Filter options */}
              <Separator className="bg-white/[0.06]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-gray-500 flex items-center gap-1">
                    <HardDrive className="w-3 h-3" /> Memoria destino
                  </Label>
                  <div className="flex gap-1.5">
                    {VRAM_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setMemoryTarget(opt.id)}
                        className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold border transition-all ${
                          memoryTarget === opt.id
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                            : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {opt.id}
                        {opt.recommended && memoryTarget === opt.id && (
                          <span className="ml-1 text-[8px] text-green-400">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-600">{VRAM_OPTIONS.find(o => o.id === memoryTarget)?.desc}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> Filtro de imagen
                  </Label>
                  <div className="flex gap-1.5">
                    {FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setFilter(opt.id)}
                        className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold border transition-all ${
                          filter === opt.id
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-600">{FILTER_OPTIONS.find(o => o.id === filter)?.desc}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Upload Image */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  Carga tu imagen — se redimensionará a <span className="font-mono text-cyan-400">{targetW}×{targetH}px</span>
                </p>
                <Badge variant="outline" className="text-[9px] border-white/[0.1] text-gray-500">
                  {memoryTarget} · Image.{filter}
                </Badge>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[180px] ${
                  isDraggingFile
                    ? 'border-purple-400/60 bg-purple-500/10'
                    : imagePreview
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-white/[0.1] bg-white/[0.02] hover:border-purple-500/30 hover:bg-purple-500/5'
                }`}
              >
                {imagePreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative rounded-lg overflow-hidden border border-white/[0.1] shadow-lg" style={{
                      backgroundImage: 'repeating-conic-gradient(#1a1a2e 0% 25%, #0d0d20 0% 50%)',
                      backgroundSize: '12px 12px',
                    }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="block"
                        style={{
                          width: Math.min(targetW, 280),
                          height: Math.min(targetH, 180),
                          imageRendering: filter === 'NEAREST' ? 'pixelated' : 'auto',
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Imagen cargada correctamente
                      </p>
                      <p className="text-[9px] text-gray-500 mt-0.5">
                        {originalFileName} → {targetW}×{targetH}px · Click para cambiar
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                      <Upload className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-300 font-medium">
                        Arrastra tu imagen aquí o haz click para buscar
                      </p>
                      <p className="text-[9px] text-gray-600 mt-0.5">
                        Formatos: PNG, JPEG, BMP · Se redimensionará a {targetW}×{targetH}px
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dimension preview box */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-cyan-500/15 flex items-center justify-center">
                    <Monitor className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-[10px] text-gray-400">Resolución:</span>
                  <span className="text-[11px] font-mono font-bold text-white">{targetW} × {targetH}</span>
                </div>
                <div className="w-px h-4 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] text-purple-300 font-semibold">{memoryTarget}</span>
                </div>
                <div className="w-px h-4 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">Filtro:</span>
                  <span className="text-[10px] text-cyan-300 font-semibold">{filter}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Folder & Save */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-400">
                Configura dónde guardar <span className="font-mono text-white">{fileName || 'image'}.png</span> en el proyecto
              </p>

              {/* File name */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-gray-500">Nombre del archivo</Label>
                <div className="flex gap-2">
                  <Input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="image"
                    className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white font-mono flex-1"
                  />
                  <div className="flex items-center px-2 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-gray-500 font-mono">
                    .png
                  </div>
                </div>
              </div>

              {/* Folder selection */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-gray-500 flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" /> Carpeta de destino
                </Label>

                {allFolders.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-600">Carpetas existentes:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allFolders.map(f => (
                        <button
                          key={f}
                          onClick={() => { setSelectedFolder(f); setFolderName(f); }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border transition-all ${
                            selectedFolder === f
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                              : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/[0.12]'
                          }`}
                        >
                          <FolderOpen className="w-3 h-3" />
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <FolderPlus className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <Input
                      value={folderName}
                      onChange={(e) => { setFolderName(e.target.value); setSelectedFolder(null); }}
                      placeholder="assets"
                      className="h-8 pl-7 text-xs bg-white/[0.03] border-white/[0.08] text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Final path preview */}
              <div className="rounded-lg bg-[#0a0a18] border border-white/[0.06] px-3 py-2.5 space-y-2">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Ruta final</p>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-300">{selectedFolder || folderName || 'assets'}</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-white">{fileName || 'image'}.png</span>
                </div>
                <Separator className="bg-white/[0.04]" />
                <p className="text-[9px] text-gray-500">
                  Código generado:{' '}
                  <code className="text-cyan-400 bg-white/[0.03] px-1 py-0.5 rounded">
                    const img = new Image("{selectedFolder || folderName || 'assets'}/{fileName || 'image'}.png"{memoryTarget === 'VRAM' ? ', VRAM' : memoryTarget === 'RAM' ? ', RAM' : ''});
                  </code>
                </p>
              </div>

              {/* Preview thumbnail */}
              {imagePreview && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <img
                    src={imagePreview}
                    alt="thumb"
                    className="w-10 h-10 rounded border border-white/[0.1] object-cover"
                    style={{ imageRendering: filter === 'NEAREST' ? 'pixelated' : 'auto' }}
                  />
                  <div>
                    <p className="text-[10px] text-gray-300 font-medium">{targetW}×{targetH}px</p>
                    <p className="text-[9px] text-gray-600">{memoryTarget} · {filter}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <Separator className="bg-white/[0.06]" />
        <div className="flex items-center justify-between px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
            className="text-[11px] text-gray-400 hover:text-white h-8"
          >
            {step === 1 ? 'Cancelar' : '← Atrás'}
          </Button>

          {step < 4 ? (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              disabled={step === 3 && !imagePreview}
              className="text-[11px] h-8 bg-purple-600 hover:bg-purple-500 text-white gap-1"
            >
              Siguiente <ArrowRight className="w-3 h-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!imagePreview}
              className="text-[11px] h-8 bg-green-600 hover:bg-green-500 text-white gap-1"
            >
              <Check className="w-3 h-3" /> Insertar en Canvas
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
