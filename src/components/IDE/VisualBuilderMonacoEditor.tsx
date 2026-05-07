import { useCallback, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  filename: string;
  value: string;
  onChange: (v: string) => void;
  language?: 'javascript' | 'xml' | 'json';
}

/**
 * Real Monaco editor for the Visual Builder right panel.
 * Editable, with PS2/AthenaEnv aware completions.
 */
export function VisualBuilderMonacoEditor({ filename, value, onChange, language = 'javascript' }: Props) {
  const editorRef = useRef<any>(null);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Light AthenaEnv globals for autocomplete
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const suggestions = [
          'Screen.clear', 'Screen.flip', 'Color.new', 'Font', 'Image',
          'Pads.get', 'Draw.rect', 'Draw.circle', 'Draw.line', 'os.setInterval'
        ].map(label => ({
          label, kind: monaco.languages.CompletionItemKind.Function,
          insertText: label, range
        }));
        return { suggestions };
      }
    });

    editor.updateOptions({
      fontSize: 12,
      fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      tabSize: 2,
      wordWrap: 'off',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      bracketPairColorization: { enabled: true },
      guides: { indentation: true, bracketPairs: true },
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d1a]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a2e] border-b border-[#2a2a4a] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-[10px] text-gray-400 font-mono truncate max-w-[160px]">{filename}</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-emerald-500/50 text-emerald-400">
            {language === 'xml' ? 'XML' : 'JavaScript'}
          </Badge>
          <Button
            variant="ghost" size="sm" className="h-5 w-5 p-0"
            onClick={() => { navigator.clipboard.writeText(value); toast.success('Copiado'); }}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          onMount={handleMount}
          options={{ automaticLayout: true }}
        />
      </div>
    </div>
  );
}
