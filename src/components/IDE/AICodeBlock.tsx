import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, FileCode, Download, Eye, Code, AlertCircle, Sparkles, Terminal, FileText, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AICodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
  onApplyToFile?: (code: string, language: string) => void;
}

export function AICodeBlock({ code, language, fileName, onApplyToFile }: AICodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { toast } = useToast();
  
  const lines = code.split('\n');
  
  // Generar nombre de archivo sugerido basado en el contenido y lenguaje
  const suggestedFileName = useMemo(() => {
    if (fileName) return fileName;
    
    const ext = getFileExtension(language);
    
    // Detectar nombre basado en contenido
    // Clases
    const classMatch = code.match(/class\s+(\w+)/);
    if (classMatch) return `${classMatch[1]}.${ext}`;
    
    // Funciones principales
    const mainFunctionMatch = code.match(/function\s+(\w+)/);
    if (mainFunctionMatch) return `${mainFunctionMatch[1]}.${ext}`;
    
    // React components
    const reactComponentMatch = code.match(/(?:function|const)\s+([A-Z]\w+)\s*[=(]/);
    if (reactComponentMatch) return `${reactComponentMatch[1]}.${ext}`;
    
    // Exports
    const exportMatch = code.match(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/);
    if (exportMatch) return `${exportMatch[1]}.${ext}`;
    
    // Detectar tipo de archivo por contenido
    if (/calculadora|calculator/i.test(code)) return `Calculator.${ext}`;
    if (/menu|navigation/i.test(code)) return `Menu.${ext}`;
    if (/game|juego/i.test(code)) return `Game.${ext}`;
    if (/api|fetch|request/i.test(code)) return `api.${ext}`;
    if (/utils?|helper/i.test(code)) return `utils.${ext}`;
    if (/config/i.test(code)) return `config.${ext}`;
    if (/test|spec/i.test(code)) return `test.${ext}`;
    
    // Default basado en lenguaje
    const defaultNames: Record<string, string> = {
      javascript: 'script.js',
      typescript: 'index.ts',
      python: 'main.py',
      java: 'Main.java',
      c: 'main.c',
      cpp: 'main.cpp',
      html: 'index.html',
      css: 'styles.css',
      json: 'data.json',
      sql: 'query.sql',
    };
    
    return defaultNames[language.toLowerCase()] || `code.${ext}`;
  }, [code, language, fileName]);
  
  // Análisis avanzado de código
  const codeAnalysis = useMemo(() => {
    const analysis = {
      complexity: 'baja',
      functions: 0,
      loops: 0,
      conditionals: 0,
      comments: 0,
      suggestions: [] as string[]
    };

    let functionCount = 0;
    let loopCount = 0;
    let conditionalCount = 0;
    let commentCount = 0;

    lines.forEach(line => {
      if (/function\s+\w+|const\s+\w+\s*=\s*\(.*\)\s*=>|class\s+\w+/.test(line)) {
        functionCount++;
      }
      if (/for\s*\(|while\s*\(|forEach|map\s*\(|filter\s*\(/.test(line)) {
        loopCount++;
      }
      if (/if\s*\(|else|switch\s*\(|case\s+/.test(line)) {
        conditionalCount++;
      }
      if (/\/\/|\/\*|\*\//.test(line)) {
        commentCount++;
      }
    });

    analysis.functions = functionCount;
    analysis.loops = loopCount;
    analysis.conditionals = conditionalCount;
    analysis.comments = commentCount;

    const totalComplexity = functionCount + loopCount * 2 + conditionalCount;
    if (totalComplexity > 20) {
      analysis.complexity = 'muy alta';
      analysis.suggestions.push('Considera dividir en módulos más pequeños');
    } else if (totalComplexity > 10) {
      analysis.complexity = 'alta';
      analysis.suggestions.push('El código es complejo, asegúrate de documentarlo bien');
    } else if (totalComplexity > 5) {
      analysis.complexity = 'media';
    }

    if (commentCount === 0 && lines.length > 20) {
      analysis.suggestions.push('Agrega comentarios para explicar la lógica compleja');
    }
    if (loopCount > 3) {
      analysis.suggestions.push('Revisa si puedes optimizar loops anidados');
    }

    return analysis;
  }, [code, lines]);
  
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
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Código descargado",
      description: `Archivo guardado como ${suggestedFileName}`,
    });
  };

  function getFileExtension(lang: string): string {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      typescriptreact: 'tsx',
      javascriptreact: 'jsx',
      python: 'py',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      csharp: 'cs',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yml',
      markdown: 'md',
      bash: 'sh',
      shell: 'sh',
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
  }

  const getLanguageColor = (lang: string): string => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      typescript: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      python: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      java: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      c: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      cpp: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      html: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      css: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
      json: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      sql: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    };
    return colors[lang.toLowerCase()] || 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  };

  const getLanguageIcon = (lang: string) => {
    if (['bash', 'shell', 'sh'].includes(lang.toLowerCase())) {
      return <Terminal className="w-3 h-3" />;
    }
    if (['json', 'xml', 'yaml', 'yml', 'cfg'].includes(lang.toLowerCase())) {
      return <FileText className="w-3 h-3" />;
    }
    return <Code className="w-3 h-3" />;
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-900 border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300">
      {/* Header - VS Code/Cursor Style */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {/* Window controls */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-500 transition-colors" />
          </div>
          
          {/* File name tab */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-t-lg border-t border-l border-r border-slate-600/30 -mb-2">
            {getLanguageIcon(language)}
            <span className="text-xs font-mono text-slate-300">{suggestedFileName}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={`text-[10px] font-mono px-2 py-0.5 ${getLanguageColor(language)}`}>
            {language.toUpperCase()}
          </Badge>
          <span className="text-[10px] text-slate-500 font-mono ml-2">
            {lines.length} líneas
          </span>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/40 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          {codeAnalysis.complexity !== 'baja' && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
              <AlertCircle className="w-2.5 h-2.5 mr-1" />
              {codeAnalysis.complexity}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-400 border-slate-600/50">
            <Eye className="w-2.5 h-2.5 mr-1" />
            {codeAnalysis.functions} func
          </Badge>
        </div>
        
        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="h-6 px-2 text-[10px] text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Análisis
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-6 px-2 text-[10px] text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
          >
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-6 px-2 text-[10px] text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            <Download className="w-3 h-3 mr-1" />
            Descargar
          </Button>
          {onApplyToFile && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleApply}
              className="h-6 px-2 text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
            >
              <Play className="w-3 h-3 mr-1" />
              Insertar
            </Button>
          )}
        </div>
      </div>

      {/* Code Analysis Panel */}
      {showAnalysis && (
        <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-700/30">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1 text-emerald-400">
            <Sparkles className="w-3 h-3" />
            Análisis de Código
          </h4>
          <div className="grid grid-cols-4 gap-3 mb-2">
            <div className="text-xs">
              <span className="text-slate-500">Funciones:</span>
              <span className="ml-1 font-mono text-slate-300">{codeAnalysis.functions}</span>
            </div>
            <div className="text-xs">
              <span className="text-slate-500">Loops:</span>
              <span className="ml-1 font-mono text-slate-300">{codeAnalysis.loops}</span>
            </div>
            <div className="text-xs">
              <span className="text-slate-500">Condicionales:</span>
              <span className="ml-1 font-mono text-slate-300">{codeAnalysis.conditionals}</span>
            </div>
            <div className="text-xs">
              <span className="text-slate-500">Comentarios:</span>
              <span className="ml-1 font-mono text-slate-300">{codeAnalysis.comments}</span>
            </div>
          </div>
          {codeAnalysis.suggestions.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-slate-400 mb-1">Sugerencias:</p>
              <ul className="text-xs space-y-1">
                {codeAnalysis.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-emerald-400">•</span>
                    <span className="text-slate-400">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Code content with line numbers */}
      <div className="flex bg-slate-900/80">
        {/* Line numbers gutter */}
        <div className="flex flex-col py-3 px-2 bg-slate-800/30 border-r border-slate-700/30 select-none min-w-[3rem]">
          {lines.map((_, index) => (
            <div
              key={index}
              className="text-[11px] text-slate-600 font-mono leading-6 text-right pr-2 hover:text-slate-400 transition-colors"
            >
              {index + 1}
            </div>
          ))}
        </div>
        
        {/* Code */}
        <div className="flex-1 overflow-x-auto">
          <pre className="p-3 text-[12px] leading-6">
            <code className="text-slate-200 font-mono whitespace-pre">
              {code}
            </code>
          </pre>
        </div>
      </div>
      
      {/* Footer status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-800/60 border-t border-slate-700/30 text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-mono">{language.toUpperCase()}</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono">Ln {lines.length}, Col 1</span>
          <span className="text-emerald-400">●</span>
        </div>
      </div>
    </div>
  );
}