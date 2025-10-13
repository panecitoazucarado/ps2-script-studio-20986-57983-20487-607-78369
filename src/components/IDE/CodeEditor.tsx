import { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Save, Download, X, FileCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileNode } from '@/types/athena';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  openTabs: FileNode[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  onTabClose: (index: number) => void;
  onFileRename: (index: number, newName: string) => void;
}

export function CodeEditor({ 
  code, 
  onChange, 
  onRun, 
  openTabs, 
  activeTabIndex, 
  onTabChange, 
  onTabClose,
  onFileRename 
}: CodeEditorProps) {
  const [lineCount, setLineCount] = useState(1);
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentFile = openTabs[activeTabIndex];

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
      description: `${currentFile.name} has been saved successfully`,
    });
  }, [currentFile.name, toast]);

  const handleExport = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File exported",
      description: `${currentFile.name} has been exported successfully`,
    });
  }, [code, currentFile.name, toast]);

  const handleDoubleClick = useCallback((index: number) => {
    setEditingTabIndex(index);
    setEditingName(openTabs[index].name);
  }, [openTabs]);

  const handleNameChange = useCallback(() => {
    if (editingTabIndex !== null && editingName.trim()) {
      onFileRename(editingTabIndex, editingName.trim());
    }
    setEditingTabIndex(null);
  }, [editingTabIndex, editingName, onFileRename]);

  useEffect(() => {
    if (editingTabIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabIndex]);

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
      {/* Professional Header - VS Code Style */}
      <div className="flex flex-col border-b border-border bg-[hsl(var(--ide-tab))]">
        {/* Tabs Row */}
        <div className="flex items-center gap-0.5 px-2 pt-1 overflow-x-auto scrollbar-thin">
          {openTabs.map((tab, index) => (
            <div
              key={tab.path}
              className={`
                group flex items-center gap-2 px-3 py-1.5 min-w-[120px] max-w-[200px]
                border-t-2 transition-all cursor-pointer
                ${index === activeTabIndex 
                  ? 'bg-[hsl(var(--ide-editor))] border-[hsl(var(--ps2-blue))] text-foreground' 
                  : 'bg-transparent border-transparent text-muted-foreground hover:bg-[hsl(var(--ide-editor))]/50'
                }
              `}
              onClick={() => onTabChange(index)}
            >
              <FileCode className="w-3.5 h-3.5 shrink-0" />
              
              {editingTabIndex === index ? (
                <Input
                  ref={inputRef}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleNameChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameChange();
                    if (e.key === 'Escape') setEditingTabIndex(null);
                  }}
                  className="h-5 px-1 py-0 text-xs border-[hsl(var(--ps2-blue))] bg-background"
                />
              ) : (
                <span 
                  className="text-xs font-medium truncate flex-1"
                  onDoubleClick={() => handleDoubleClick(index)}
                >
                  {tab.name}
                </span>
              )}
              
              {openTabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(index);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between px-3 py-2 bg-[hsl(var(--ide-editor))]/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{currentFile.name}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {getLanguage(currentFile.name).toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2.5 text-xs hover:bg-muted"
              onClick={handleSave}
              title="Save file (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save
            </Button>
            
            <Button 
              onClick={onRun} 
              size="sm" 
              className="h-7 px-2.5 text-xs bg-[hsl(var(--ps2-purple))] hover:bg-[hsl(var(--ps2-purple))]/80 text-primary-foreground"
              title="Run script (F5)"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Run
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2.5 text-xs hover:bg-muted"
              onClick={handleExport}
              title="Export current file"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={getLanguage(currentFile.name)}
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
      <div className="ide-statusbar flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">{getLanguage(currentFile.name).toUpperCase()}</span>
          <span className="text-muted-foreground">UTF-8</span>
          <span className="text-muted-foreground">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Ln {getCursorPosition().line}, Col {getCursorPosition().column}
          </span>
          <span className="text-muted-foreground">Spaces: 2</span>
        </div>
      </div>
    </Card>
  );
}