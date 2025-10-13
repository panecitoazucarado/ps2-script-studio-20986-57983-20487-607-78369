import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image, Info, Save, ZoomIn, ZoomOut, X, PanelRightOpen, Grid3x3, Eye, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ImageViewerProps {
  imageData: string;
  filename: string;
}

interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  size: number;
  colorDepth: number;
  aspectRatio: string;
}

export function ImageViewer({ imageData, filename }: ImageViewerProps) {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showAlpha, setShowAlpha] = useState(true);

  useEffect(() => {
    const img = new window.Image();
    img.src = imageData;
    
    img.onload = () => {
      const format = filename.split('.').pop()?.toUpperCase() || 'UNKNOWN';
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(width, height);
      const aspectRatio = `${width / divisor}:${height / divisor}`;
      
      // Estimar tamaño (base64 length / 1.37 aproximadamente)
      const sizeBytes = Math.round((imageData.length - imageData.indexOf(',') - 1) * 0.75);
      
      setMetadata({
        format,
        width,
        height,
        size: sizeBytes,
        colorDepth: 24, // Típicamente 24-bit para RGB
        aspectRatio
      });
      setLoading(false);
    };
  }, [imageData, filename]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleReset = () => setZoom(1);

  const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;
  const nextPowerOfTwo = (n: number) => Math.pow(2, Math.ceil(Math.log2(n)));
  
  const getPS2Compatibility = () => {
    if (!metadata) return null;
    
    const isPOT = isPowerOfTwo(metadata.width) && isPowerOfTwo(metadata.height);
    const isWithinLimits = metadata.width <= 1024 && metadata.height <= 1024;
    const recommendedWidth = isPowerOfTwo(metadata.width) ? metadata.width : nextPowerOfTwo(metadata.width);
    const recommendedHeight = isPowerOfTwo(metadata.height) ? metadata.height : nextPowerOfTwo(metadata.height);
    
    return {
      compatible: isPOT && isWithinLimits,
      isPowerOfTwo: isPOT,
      isWithinLimits,
      recommendedWidth,
      recommendedHeight,
      needsResize: !isPOT || !isWithinLimits
    };
  };

  const ps2Compat = getPS2Compatibility();

  return (
    <Card className="h-full flex flex-col bg-ide-editor border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-ide-tab">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-ps2-cyan" />
          <span className="text-sm font-medium">{filename}</span>
          <Badge variant="secondary" className="text-xs">IMAGE</Badge>
          {ps2Compat && (
            <Badge 
              variant={ps2Compat.compatible ? "default" : "destructive"} 
              className="text-xs"
            >
              {ps2Compat.compatible ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
              {ps2Compat.compatible ? "PS2 Ready" : "Needs Optimization"}
            </Badge>
          )}
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export Image</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={showGrid ? "default" : "ghost"}
                  size="sm" 
                  className="h-8 px-2"
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Grid</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={showAlpha ? "default" : "ghost"}
                  size="sm" 
                  className="h-8 px-2"
                  onClick={() => setShowAlpha(!showAlpha)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Alpha Channel</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={handleZoomOut}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={handleZoomIn}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={handleReset}
              >
                1:1
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={showProperties ? "default" : "ghost"}
                  size="sm" 
                  className="h-8 px-2"
                  onClick={() => setShowProperties(!showProperties)}
                >
                  <PanelRightOpen className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Properties Panel</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image Display */}
        <div className="flex-1 overflow-auto bg-[hsl(var(--editor-bg))] p-4 relative">
          <div 
            className="flex items-center justify-center min-h-full"
            style={{
              backgroundImage: showGrid ? 
                'repeating-linear-gradient(0deg, hsl(var(--border)) 0px, hsl(var(--border)) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, hsl(var(--border)) 0px, hsl(var(--border)) 1px, transparent 1px, transparent 32px)' 
                : undefined,
              backgroundSize: showGrid ? '32px 32px' : undefined
            }}
          >
            {loading ? (
              <div className="text-muted-foreground">Loading image...</div>
            ) : (
              <div 
                className="relative"
                style={{
                  backgroundImage: !showAlpha ? 'none' : 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--muted-foreground) / 0.1) 0% 50%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px'
                }}
              >
                <img
                  src={imageData}
                  alt={filename}
                  style={{ 
                    transform: `scale(${zoom})`,
                    transition: 'transform 0.2s ease',
                    maxWidth: '100%',
                    height: 'auto',
                    imageRendering: zoom > 2 ? 'pixelated' : 'auto',
                    display: 'block'
                  }}
                  className="shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>

        {/* Metadata Panel */}
        {showProperties && (
          <div className="w-80 border-l border-border bg-ide-sidebar overflow-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-3 border-b border-border bg-ide-sidebar">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-ps2-purple" />
                <h3 className="text-sm font-semibold">Image Properties</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setShowProperties(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {metadata && (
                <>
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Basic Information
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Format</span>
                        <span className="text-sm font-mono">{metadata.format}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Dimensions</span>
                        <span className="text-sm font-mono">
                          {metadata.width} × {metadata.height}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Aspect Ratio</span>
                        <span className="text-sm font-mono">{metadata.aspectRatio}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">File Size</span>
                        <span className="text-sm font-mono">{formatBytes(metadata.size)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Color Mode</span>
                        <span className="text-sm font-mono">RGB</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Bit Depth</span>
                        <span className="text-sm font-mono">{metadata.colorDepth}-bit</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* PS2 Compatibility */}
                  {ps2Compat && (
                    <>
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          PS2 Compatibility
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Status</span>
                            <Badge variant={ps2Compat.compatible ? "default" : "destructive"} className="text-xs">
                              {ps2Compat.compatible ? "Compatible" : "Not Compatible"}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Power of Two</span>
                            <span className={`text-sm ${ps2Compat.isPowerOfTwo ? 'text-ps2-green' : 'text-destructive'}`}>
                              {ps2Compat.isPowerOfTwo ? "✓ Yes" : "✗ No"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Size Limits</span>
                            <span className={`text-sm ${ps2Compat.isWithinLimits ? 'text-ps2-green' : 'text-destructive'}`}>
                              {ps2Compat.isWithinLimits ? "✓ OK" : "✗ Too Large"}
                            </span>
                          </div>

                          {ps2Compat.needsResize && (
                            <div className="mt-2 p-2 bg-muted rounded-md">
                              <div className="text-xs text-muted-foreground mb-1">Recommended Size:</div>
                              <div className="text-sm font-mono text-ps2-cyan">
                                {ps2Compat.recommendedWidth} × {ps2Compat.recommendedHeight}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* PS2 Technical Info */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      PS2 Memory & Performance
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">VRAM (Uncompressed)</span>
                        <span className="text-sm font-mono">
                          {Math.round((metadata.width * metadata.height * 4) / 1024)} KB
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">VRAM (16-bit)</span>
                        <span className="text-sm font-mono text-ps2-green">
                          {Math.round((metadata.width * metadata.height * 2) / 1024)} KB
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">VRAM (8-bit Indexed)</span>
                        <span className="text-sm font-mono text-ps2-green">
                          {Math.round((metadata.width * metadata.height) / 1024)} KB
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Max Texture Size</span>
                        <span className="text-sm font-mono">1024 × 1024</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Transfer Rate</span>
                        <span className="text-sm font-mono">
                          {((metadata.width * metadata.height * 4) / (1024 * 1024) * 60).toFixed(2)} MB/s @60fps
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Optimization Tips
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-muted rounded-md">
                        <div className="font-medium mb-1">💡 Texture Format</div>
                        <div className="text-muted-foreground">
                          {metadata.width <= 256 && metadata.height <= 256
                            ? "Good for UI elements and sprites"
                            : metadata.width <= 512 && metadata.height <= 512
                            ? "Ideal for character textures"
                            : "Consider for backgrounds/environments"}
                        </div>
                      </div>

                      <div className="p-2 bg-muted rounded-md">
                        <div className="font-medium mb-1">🎨 Color Depth</div>
                        <div className="text-muted-foreground">
                          Use 16-bit (RGBA5551/RGB565) for better performance. 
                          8-bit indexed for UI elements.
                        </div>
                      </div>

                      <div className="p-2 bg-muted rounded-md">
                        <div className="font-medium mb-1">⚡ Swizzling</div>
                        <div className="text-muted-foreground">
                          Enable texture swizzling for better cache performance on PS2.
                        </div>
                      </div>

                      {!ps2Compat?.isPowerOfTwo && (
                        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                          <div className="font-medium mb-1 text-destructive">⚠️ Not Power-of-Two</div>
                          <div className="text-muted-foreground">
                            Resize to {ps2Compat?.recommendedWidth} × {ps2Compat?.recommendedHeight} for optimal PS2 compatibility.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
