import { useState, useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ImageViewer } from './ImageViewer';
import { PS2Preview } from './PS2Preview';
import { IDEHeader } from './IDEHeader';
import { IDEStatusBar } from './IDEStatusBar';
import { FileNode } from '@/types/athena';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function IDELayout() {
  const [selectedFile, setSelectedFile] = useState<FileNode>({
    name: 'main.js',
    type: 'file',
    path: '/main.js',
    content: '// Welcome to ATHENA ENV SDK for PlayStation 2\n// Enhanced JavaScript environment for PS2 homebrew development\n\n// {"name": "My PS2 App", "author": "Developer", "version": "1.0.0", "icon": "icon.png", "file": "main.js"}\n\nconst font = new Font("default");\nlet frameCount = 0;\n\nos.setInterval(() => {\n  Screen.clear(Color.new(0, 32, 64, 255));\n  \n  // Draw title\n  font.print(50, 50, "ATHENA ENV SDK Demo");\n  font.print(50, 80, "Frame: " + frameCount);\n  \n  // Draw some graphics\n  Draw.rect(200, 150, 240, 100, Color.new(128, 0, 255, 255));\n  Draw.circle(320, 200, 30, Color.new(0, 255, 128, 255));\n  \n  font.print(50, 350, "Press buttons on your controller!");\n  \n  frameCount++;\n  Screen.flip();\n}, 16);'
  });
  const [code, setCode] = useState(selectedFile.content || '');
  const [isRunning, setIsRunning] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);

  const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      if (file.content !== undefined) {
        setCode(file.content);
      }
      setIsRunning(false);
    }
  }, []);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    // Update the file content
    if (selectedFile) {
      setSelectedFile(prev => ({ ...prev, content: newCode }));
    }
  }, [selectedFile]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handleToggleRun = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* IDE Header */}
      <IDEHeader 
        showFileExplorer={showFileExplorer}
        showPreview={showPreview}
        onToggleFileExplorer={() => setShowFileExplorer(!showFileExplorer)}
        onTogglePreview={() => setShowPreview(!showPreview)}
      />

      {/* Main IDE Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer - Collapsible */}
          {showFileExplorer && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                <FileExplorer 
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onProjectLoad={setProjectFiles}
                />
              </ResizablePanel>
              <ResizableHandle className="w-1 bg-border hover:bg-accent transition-colors" />
            </>
          )}
          
          {/* Editor + Preview */}
          <ResizablePanel defaultSize={showFileExplorer ? 80 : 100}>
            <ResizablePanelGroup direction="horizontal">
              {/* Code Editor or Image Viewer */}
              <ResizablePanel defaultSize={showPreview ? 50 : 100}>
                {selectedFile && isImageFile(selectedFile.name) ? (
                  <ImageViewer
                    imageData={selectedFile.content || ''}
                    filename={selectedFile.name}
                  />
                ) : (
                  <CodeEditor
                    code={code}
                    onChange={handleCodeChange}
                    onRun={handleRun}
                    filename={selectedFile.name}
                  />
                )}
              </ResizablePanel>
              
              {/* PS2 Preview - Collapsible with Tab */}
              {showPreview && (
                <>
                  <ResizableHandle className="w-1 bg-border hover:bg-accent transition-colors" />
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full flex flex-col">
                      {/* Preview Tab */}
                      <div className="flex items-center justify-between bg-muted/50 border-b border-border px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          <span className="text-xs font-medium">Vista Previa PS2</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                          onClick={() => setShowPreview(false)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      
                      {/* Preview Content */}
                      <div className="flex-1 overflow-hidden">
                        <PS2Preview
                          code={code}
                          isRunning={isRunning}
                          onToggleRun={handleToggleRun}
                          files={projectFiles}
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* IDE Status Bar */}
      <IDEStatusBar 
        selectedFile={selectedFile.name}
        isRunning={isRunning}
        lineCount={code.split('\n').length}
      />
    </div>
  );
}