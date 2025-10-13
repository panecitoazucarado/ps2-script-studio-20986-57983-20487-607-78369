import { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Save, FileText, Settings, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  onClose?: () => void;
  filename?: string;
}

export function CodeEditor({ code, onChange, onRun, onClose, filename = "main.js" }: CodeEditorProps) {
  const [lineCount, setLineCount] = useState(1);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure Monaco Editor for PS2 development
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontLigatures: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      parameterHints: {
        enabled: true,
      },
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoIndent: 'full',
      bracketPairColorization: {
        enabled: true,
      },
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyCode.F5, () => {
      onRun();
    });
  }, [onRun]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  const handleSave = useCallback(() => {
    toast({
      title: "File saved",
      description: `${filename} has been saved successfully`,
    });
  }, [filename, toast]);

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      default:
        return 'javascript';
    }
  };

  const getCursorPosition = () => {
    if (!editorRef.current) return { line: 1, column: 1 };
    const position = editorRef.current.getPosition();
    return {
      line: position?.lineNumber || 1,
      column: position?.column || 1,
    };
  };

  return (
    <Card className="h-full flex flex-col bg-ide-editor border-border">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-ide-tab">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-ps2-blue" />
          <span className="text-sm font-medium">{filename}</span>
          <Badge variant="secondary" className="text-xs">
            {getLanguage(filename).toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-3"
            onClick={handleSave}
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button 
            onClick={onRun} 
            size="sm" 
            className="h-8 px-3 bg-[hsl(var(--ps2-purple))] hover:bg-[hsl(var(--ps2-purple))]/80 text-primary-foreground"
            title="Run (F5)"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onClose}
              title="Close Editor"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={getLanguage(filename)}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: {
              enabled: true,
            },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            bracketPairColorization: {
              enabled: true,
            },
          }}
        />
      </div>

      {/* Editor Status Bar */}
      <div className="ide-statusbar flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">{getLanguage(filename).toUpperCase()}</span>
          <span className="text-muted-foreground">UTF-8</span>
          <span className="text-muted-foreground">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Ln {getCursorPosition().line}
          </span>
          <span className="text-muted-foreground">
            Col {getCursorPosition().column}
          </span>
          <span className="text-muted-foreground">Spaces: 2</span>
          <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
        </div>
      </div>
    </Card>
  );
}