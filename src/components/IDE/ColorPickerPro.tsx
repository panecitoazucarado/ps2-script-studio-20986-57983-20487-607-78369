import { useState, useRef, useCallback, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pipette, RotateCcw, Copy, Palette } from 'lucide-react';
import type { PS2Color } from '@/lib/ps2-builder/types';

// Preset color palettes for PS2 development
const PS2_PRESETS = {
  'PS2 Classic': [
    { r: 0, g: 0, b: 0, a: 255 },      // Black
    { r: 255, g: 255, b: 255, a: 255 },// White
    { r: 0, g: 71, b: 171, a: 255 },   // PS2 Blue
    { r: 255, g: 0, b: 0, a: 255 },    // Red
    { r: 0, g: 255, b: 0, a: 255 },    // Green
    { r: 255, g: 255, b: 0, a: 255 },  // Yellow
    { r: 255, g: 128, b: 0, a: 255 },  // Orange
    { r: 128, g: 0, b: 255, a: 255 },  // Purple
  ],
  'Neon': [
    { r: 255, g: 0, b: 128, a: 255 },  // Pink
    { r: 0, g: 255, b: 255, a: 255 },  // Cyan
    { r: 255, g: 0, b: 255, a: 255 },  // Magenta
    { r: 0, g: 255, b: 128, a: 255 },  // Spring Green
    { r: 255, g: 128, b: 0, a: 255 },  // Orange
    { r: 128, g: 255, b: 0, a: 255 },  // Lime
    { r: 0, g: 128, b: 255, a: 255 },  // Sky Blue
    { r: 255, g: 0, b: 64, a: 255 },   // Hot Pink
  ],
  'Retro': [
    { r: 41, g: 128, b: 185, a: 255 }, // Retro Blue
    { r: 155, g: 89, b: 182, a: 255 }, // Amethyst
    { r: 26, g: 188, b: 156, a: 255 }, // Turquoise
    { r: 46, g: 204, b: 113, a: 255 }, // Emerald
    { r: 241, g: 196, b: 15, a: 255 }, // Sun Yellow
    { r: 230, g: 126, b: 34, a: 255 }, // Carrot
    { r: 231, g: 76, b: 60, a: 255 },  // Alizarin
    { r: 52, g: 73, b: 94, a: 255 },   // Wet Asphalt
  ],
  'UI Dark': [
    { r: 30, g: 30, b: 50, a: 255 },   // Dark BG
    { r: 45, g: 45, b: 75, a: 255 },   // Panel BG
    { r: 60, g: 60, b: 100, a: 255 },  // Border
    { r: 80, g: 120, b: 200, a: 255 }, // Accent
    { r: 100, g: 200, b: 150, a: 255 },// Success
    { r: 200, g: 100, b: 100, a: 255 },// Error
    { r: 200, g: 180, b: 100, a: 255 },// Warning
    { r: 180, g: 180, b: 200, a: 255 },// Text
  ]
};

interface ColorPickerProProps {
  label: string;
  value: PS2Color;
  onChange: (color: PS2Color) => void;
  showAlpha?: boolean;
}

export function ColorPickerPro({ label, value, onChange, showAlpha = true }: ColorPickerProProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('PS2 Classic');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gradientRef = useRef<HTMLCanvasElement>(null);
  
  // Convert color to hex
  const colorToHex = (color: PS2Color) => 
    `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
  
  // Convert hex to color
  const hexToColor = (hex: string): Partial<PS2Color> => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  });

  // HSV to RGB conversion
  const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  // RGB to HSV conversion
  const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, v };
  };

  // Draw color picker canvas
  const drawColorPicker = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { h } = rgbToHsv(value.r, value.g, value.b);
    
    // Draw saturation-value gradient
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const s = x / canvas.width;
        const v = 1 - y / canvas.height;
        const { r, g, b } = hsvToRgb(h, s, v);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [value.r, value.g, value.b]);

  // Draw hue gradient
  const drawHueGradient = useCallback(() => {
    const canvas = gradientRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    for (let i = 0; i <= 1; i += 0.1) {
      const { r, g, b } = hsvToRgb(i, 1, 1);
      gradient.addColorStop(i, `rgb(${r},${g},${b})`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (isOpen) {
      drawColorPicker();
      drawHueGradient();
    }
  }, [isOpen, drawColorPicker, drawHueGradient]);

  // Handle color picker click
  const handlePickerClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const s = x / canvas.width;
    const v = 1 - y / canvas.height;
    
    const { h } = rgbToHsv(value.r, value.g, value.b);
    const { r, g, b } = hsvToRgb(h, s, v);
    
    onChange({ r, g, b, a: value.a });
  };

  // Handle hue slider click
  const handleHueClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = gradientRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const h = x / canvas.width;
    
    const { s, v } = rgbToHsv(value.r, value.g, value.b);
    const { r, g, b } = hsvToRgb(h, s, v);
    
    onChange({ r, g, b, a: value.a });
  };

  // Handle preset color click
  const handlePresetClick = (color: PS2Color) => {
    onChange({ ...color, a: value.a });
  };

  // Copy color code
  const handleCopyColor = () => {
    const code = `Color.new(${value.r}, ${value.g}, ${value.b}, ${value.a})`;
    navigator.clipboard.writeText(code);
  };

  // Reset to white
  const handleReset = () => {
    onChange({ r: 255, g: 255, b: 255, a: 255 });
  };

  return (
    <div className="flex items-center gap-2">
      <Label className="text-[10px] text-muted-foreground w-20 truncate">{label}</Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button 
            className="w-8 h-6 rounded border border-[#3a3a5a] cursor-pointer flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
            style={{ 
              background: `linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%), 
                           linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%)`,
              backgroundSize: '6px 6px',
              backgroundPosition: '0 0, 3px 3px'
            }}
          >
            <div 
              className="w-full h-full"
              style={{ 
                backgroundColor: `rgba(${value.r}, ${value.g}, ${value.b}, ${value.a / 255})`
              }}
            />
          </button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0 bg-[#0d0d1a] border-[#2a2a4a]" align="start">
          <Tabs defaultValue="picker" className="w-full">
            <TabsList className="w-full bg-[#1a1a3a] rounded-none">
              <TabsTrigger value="picker" className="flex-1 text-[10px]">
                <Pipette className="w-3 h-3 mr-1" /> Selector
              </TabsTrigger>
              <TabsTrigger value="sliders" className="flex-1 text-[10px]">
                <Palette className="w-3 h-3 mr-1" /> RGB/A
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex-1 text-[10px]">
                <Palette className="w-3 h-3 mr-1" /> Presets
              </TabsTrigger>
            </TabsList>
            
            {/* Color Picker Tab */}
            <TabsContent value="picker" className="p-3 space-y-3">
              {/* Saturation/Value Canvas */}
              <canvas
                ref={canvasRef}
                width={260}
                height={140}
                className="w-full h-[140px] cursor-crosshair rounded border border-[#3a3a5a]"
                onClick={handlePickerClick}
              />
              
              {/* Hue Slider */}
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground">Tono (Hue)</Label>
                <canvas
                  ref={gradientRef}
                  width={260}
                  height={16}
                  className="w-full h-4 cursor-pointer rounded border border-[#3a3a5a]"
                  onClick={handleHueClick}
                />
              </div>
              
              {/* Alpha Slider */}
              {showAlpha && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-[9px] text-muted-foreground">Alpha (Transparencia)</Label>
                    <span className="text-[9px] text-muted-foreground font-mono">{value.a}</span>
                  </div>
                  <Slider
                    value={[value.a]}
                    min={0}
                    max={255}
                    step={1}
                    onValueChange={([a]) => onChange({ ...value, a })}
                    className="w-full"
                  />
                </div>
              )}
            </TabsContent>
            
            {/* Sliders Tab */}
            <TabsContent value="sliders" className="p-3 space-y-3">
              {/* R Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-[9px] text-red-400 font-semibold">R (Rojo)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={value.r}
                    onChange={(e) => onChange({ ...value, r: Math.min(255, Math.max(0, Number(e.target.value))) })}
                    className="w-14 h-5 text-[10px] text-center bg-[#1a1a3a] border-[#3a3a5a] p-1"
                  />
                </div>
                <Slider
                  value={[value.r]}
                  min={0}
                  max={255}
                  step={1}
                  onValueChange={([r]) => onChange({ ...value, r })}
                  className="w-full [&_.bg-primary]:bg-red-500"
                />
              </div>
              
              {/* G Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-[9px] text-green-400 font-semibold">G (Verde)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={value.g}
                    onChange={(e) => onChange({ ...value, g: Math.min(255, Math.max(0, Number(e.target.value))) })}
                    className="w-14 h-5 text-[10px] text-center bg-[#1a1a3a] border-[#3a3a5a] p-1"
                  />
                </div>
                <Slider
                  value={[value.g]}
                  min={0}
                  max={255}
                  step={1}
                  onValueChange={([g]) => onChange({ ...value, g })}
                  className="w-full [&_.bg-primary]:bg-green-500"
                />
              </div>
              
              {/* B Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-[9px] text-blue-400 font-semibold">B (Azul)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={value.b}
                    onChange={(e) => onChange({ ...value, b: Math.min(255, Math.max(0, Number(e.target.value))) })}
                    className="w-14 h-5 text-[10px] text-center bg-[#1a1a3a] border-[#3a3a5a] p-1"
                  />
                </div>
                <Slider
                  value={[value.b]}
                  min={0}
                  max={255}
                  step={1}
                  onValueChange={([b]) => onChange({ ...value, b })}
                  className="w-full [&_.bg-primary]:bg-blue-500"
                />
              </div>
              
              {/* A Slider */}
              {showAlpha && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-[9px] text-gray-400 font-semibold">A (Alpha)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={255}
                      value={value.a}
                      onChange={(e) => onChange({ ...value, a: Math.min(255, Math.max(0, Number(e.target.value))) })}
                      className="w-14 h-5 text-[10px] text-center bg-[#1a1a3a] border-[#3a3a5a] p-1"
                    />
                  </div>
                  <Slider
                    value={[value.a]}
                    min={0}
                    max={255}
                    step={1}
                    onValueChange={([a]) => onChange({ ...value, a })}
                    className="w-full"
                  />
                </div>
              )}
              
              {/* Hex Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#2a2a4a]">
                <Label className="text-[9px] text-muted-foreground">HEX</Label>
                <Input
                  value={colorToHex(value)}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      const { r, g, b } = hexToColor(e.target.value);
                      onChange({ r: r!, g: g!, b: b!, a: value.a });
                    }
                  }}
                  className="flex-1 h-6 text-[10px] font-mono bg-[#1a1a3a] border-[#3a3a5a]"
                />
              </div>
            </TabsContent>
            
            {/* Presets Tab */}
            <TabsContent value="presets" className="p-3 space-y-3">
              {/* Preset Selector */}
              <div className="flex gap-1 flex-wrap">
                {Object.keys(PS2_PRESETS).map((presetName) => (
                  <button
                    key={presetName}
                    onClick={() => setActivePreset(presetName)}
                    className={`px-2 py-1 text-[9px] rounded transition-colors ${
                      activePreset === presetName 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-[#1a1a3a] text-muted-foreground hover:bg-[#2a2a4a]'
                    }`}
                  >
                    {presetName}
                  </button>
                ))}
              </div>
              
              {/* Color Grid */}
              <div className="grid grid-cols-8 gap-1.5">
                {PS2_PRESETS[activePreset as keyof typeof PS2_PRESETS].map((color, i) => (
                  <button
                    key={i}
                    onClick={() => handlePresetClick(color)}
                    className="w-7 h-7 rounded border border-[#3a3a5a] hover:ring-2 hover:ring-primary/50 transition-all"
                    style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                    title={`RGB(${color.r}, ${color.g}, ${color.b})`}
                  />
                ))}
              </div>
              
              {/* Recent/Custom section could be added here */}
            </TabsContent>
          </Tabs>
          
          {/* Footer with preview and actions */}
          <div className="flex items-center justify-between p-2 border-t border-[#2a2a4a] bg-[#0a0a15]">
            {/* Color Preview */}
            <div className="flex items-center gap-2">
              <div 
                className="w-10 h-6 rounded border border-[#3a3a5a]"
                style={{ 
                  backgroundColor: `rgba(${value.r}, ${value.g}, ${value.b}, ${value.a / 255})`
                }}
              />
              <span className="text-[9px] font-mono text-muted-foreground">
                {value.r}, {value.g}, {value.b}, {value.a}
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={handleCopyColor}
                title="Copiar código Color.new()"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={handleReset}
                title="Resetear a blanco"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Compact RGB Display */}
      <span className="text-[9px] text-muted-foreground font-mono">
        {value.r},{value.g},{value.b}
        {showAlpha && `,${value.a}`}
      </span>
    </div>
  );
}
