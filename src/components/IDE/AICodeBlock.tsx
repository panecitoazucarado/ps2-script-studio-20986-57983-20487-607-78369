import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, FileCode, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AICodeBlockProps {
  code: string;
  language: string;
  onApplyToFile?: (code: string, language: string) => void;
}

export function AICodeBlock({ code, language, onApplyToFile }: AICodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const lines = code.split('\n');
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Código copiado",
        description: "El código ha sido copiado al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el código",
        variant: "destructive"
      });
    }
  };

  const handleApply = () => {
    if (onApplyToFile) {
      onApplyToFile(code, language);
      toast({
        title: "Código aplicado",
        description: "El código ha sido insertado en el archivo",
      });
    }
  };

  const handleDownload = () => {
    const extension = getFileExtension(language);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Código descargado",
      description: `Archivo guardado como code.${extension}`,
    });
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      csharp: 'cs',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      markdown: 'md',
      bash: 'sh',
      sql: 'sql',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt',
      elf: 'elf',
      cfg: 'cfg',
      cnf: 'cnf',
      h: 'h',
      o: 'o'
    };
    return extensions[lang.toLowerCase()] || 'txt';
  };

  const getLanguageColor = (lang: string): string => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      typescript: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      python: 'bg-green-500/10 text-green-500 border-green-500/30',
      java: 'bg-red-500/10 text-red-500 border-red-500/30',
      c: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
      cpp: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
      html: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      css: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
      json: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
    };
    return colors[lang.toLowerCase()] || 'bg-ps2-cyan/10 text-ps2-cyan border-ps2-cyan/30';
  };

  return (
    <div className="rounded-lg bg-ide-editor-bg border border-border overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs font-mono ${getLanguageColor(language)}`}>
            {language}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {lines.length} líneas
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 px-2 text-xs hover:bg-ps2-purple/20 hover:text-ps2-purple"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-7 px-2 text-xs hover:bg-ps2-cyan/20 hover:text-ps2-cyan"
          >
            <Download className="w-3 h-3 mr-1" />
            Descargar
          </Button>
          {onApplyToFile && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleApply}
              className="h-7 px-2 text-xs bg-ps2-purple/20 text-ps2-purple hover:bg-ps2-purple/30 border border-ps2-purple/30"
            >
              <FileCode className="w-3 h-3 mr-1" />
              Aplicar al archivo
            </Button>
          )}
        </div>
      </div>
      
      {/* Code content with line numbers */}
      <div className="flex bg-ide-editor-bg">
        {/* Line numbers */}
        <div className="flex flex-col py-3 px-3 bg-muted/30 border-r border-border select-none">
          {lines.map((_, index) => (
            <div
              key={index}
              className="text-xs text-muted-foreground font-mono leading-6 text-right min-w-[2.5rem]"
            >
              {index + 1}
            </div>
          ))}
        </div>
        
        {/* Code */}
        <div className="flex-1 overflow-x-auto">
          <pre className="p-3 text-xs leading-6">
            <code className="text-foreground font-mono whitespace-pre">
              {code}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
