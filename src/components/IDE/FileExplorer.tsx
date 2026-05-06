import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FolderOpen, 
  Folder,
  File, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Settings,
  Plus,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Scissors,
  Download,
  Save,
  X,
  SearchX,
  Trash2,
  Edit3,
  Info,
  History,
  MessageSquare,
  Sparkles,
  FolderPlus,
  Upload,
  FileCode,
  FileJson,
  FileType,
  Code2,
  Package,
  MoreVertical,
  Copy,
  ClipboardPaste,
  Eye,
  FilePlus2,
  GitBranch,
  Loader2,
  Terminal,
  Database,
  Shield,
  Lock,
  Key,
  Braces,
  Hash,
  Cpu,
  Cog,
  BookOpen,
  FileVideo,
  Type,
  Palette,
  Globe,
  Server,
  Puzzle,
  Box,
  Layers,
  Zap,
  FileArchive,
  FileSpreadsheet,
  Scroll,
  Binary,
  Wrench,
  Bug,
  TestTube,
  Container,
  Cloud,
  Link,
  FileQuestion,
  ExternalLink,
  Archive,
  CopyPlus,
  Pen,
} from 'lucide-react';
import JSZip from 'jszip';
import { FileNode } from '@/types/athena';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
  onProjectLoad?: (files: FileNode[]) => void;
  onFileSystemUpdate?: (files: FileNode[]) => void;
  onAIConsult?: (file: FileNode, action: 'consult' | 'analyze' | 'improve') => void;
  onFileDelete?: (filePath: string) => void;
  onFileRename?: (oldPath: string, newPath: string, newName: string) => void;
  externalFileSystem?: FileNode[];
  onCloneRepository?: () => void;
  onProjectClear?: () => void;
}

interface FileMetadata {
  size: number;
  created: Date;
  modified: Date;
  type: string;
  lines?: number;
  encoding?: string;
}

interface FileHistory {
  timestamp: Date;
  action: string;
  size: number;
  user?: string;
}

// PS2 Development File Templates - Organized by Category
interface FileTemplate {
  content: string;
  description: string;
  icon?: string;
  category: 'ps2' | 'code' | 'config' | 'web' | 'data' | 'shader' | 'script' | 'docs';
}

const fileTemplates: Record<string, FileTemplate> = {
  // === PS2 SPECIFIC ===
  'c': { 
    content: `/*
 * ATHENA ENV - PlayStation 2 Development
 * File: main.c
 * Description: PS2 Application Entry Point
 */

#include <tamtypes.h>
#include <kernel.h>
#include <sifrpc.h>
#include <loadfile.h>
#include <stdio.h>

// PS2 SDK Headers
#include <graph.h>
#include <dma.h>
#include <packet.h>

int main(int argc, char *argv[])
{
    // Initialize SIF RPC
    SifInitRpc(0);
    
    // Initialize graphics
    graph_initialize(0, 0, 0, 0, 0);
    
    printf("Hello, PlayStation 2!\\n");
    
    // Main loop
    while(1) {
        // Game logic here
    }
    
    return 0;
}
`, 
    description: 'PS2 C Source', 
    category: 'ps2' 
  },
  'cpp': { 
    content: `/*
 * ATHENA ENV - PlayStation 2 Development
 * File: main.cpp
 * Description: PS2 C++ Application
 */

#include <tamtypes.h>
#include <kernel.h>
#include <sifrpc.h>
#include <iostream>

class PS2Application {
public:
    PS2Application() {
        SifInitRpc(0);
    }
    
    ~PS2Application() {
        // Cleanup
    }
    
    void run() {
        std::cout << "Hello, PlayStation 2!" << std::endl;
        
        while(true) {
            update();
            render();
        }
    }
    
private:
    void update() {
        // Update logic
    }
    
    void render() {
        // Render logic
    }
};

int main(int argc, char *argv[])
{
    PS2Application app;
    app.run();
    return 0;
}
`, 
    description: 'PS2 C++ Source', 
    category: 'ps2' 
  },
  'h': { 
    content: `/*
 * ATHENA ENV - PlayStation 2 Development
 * Header File
 */

#ifndef _HEADER_H_
#define _HEADER_H_

#include <tamtypes.h>

#ifdef __cplusplus
extern "C" {
#endif

// Type definitions
typedef unsigned int u32;
typedef unsigned short u16;
typedef unsigned char u8;
typedef signed int s32;
typedef signed short s16;
typedef signed char s8;

// Function declarations


#ifdef __cplusplus
}
#endif

#endif /* _HEADER_H_ */
`, 
    description: 'PS2 C/C++ Header', 
    category: 'ps2' 
  },
  'hpp': { 
    content: `/*
 * ATHENA ENV - PlayStation 2 Development
 * C++ Header File
 */

#ifndef _HEADER_HPP_
#define _HEADER_HPP_

#include <tamtypes.h>

class PS2Component {
public:
    PS2Component();
    virtual ~PS2Component();
    
    virtual void init() = 0;
    virtual void update() = 0;
    virtual void render() = 0;
    
protected:
    bool m_initialized;
};

#endif /* _HEADER_HPP_ */
`, 
    description: 'PS2 C++ Header', 
    category: 'ps2' 
  },
  's': { 
    content: `# ATHENA ENV - PlayStation 2 Development
# MIPS R5900 Assembly File
# EE Core Assembly

.set noreorder
.set noat

.global _start

.section .text

_start:
    # Initialize stack pointer
    la      $sp, _stack_end
    
    # Clear BSS section
    la      $a0, _bss_start
    la      $a1, _bss_end
    
clear_bss:
    beq     $a0, $a1, bss_done
    nop
    sw      $zero, 0($a0)
    addiu   $a0, $a0, 4
    j       clear_bss
    nop
    
bss_done:
    # Jump to main
    jal     main
    nop
    
    # Exit
    li      $v0, 0x04
    syscall
    
.section .data

.section .bss
`, 
    description: 'PS2 MIPS Assembly', 
    category: 'ps2' 
  },
  'asm': { 
    content: `; ATHENA ENV - PlayStation 2 Development
; IOP Assembly File (MIPS R3000)

.set noreorder

.global _start

.section .text

_start:
    ; IOP initialization code
    nop
    nop
    
    ; Return
    jr      $ra
    nop

.section .data

.section .bss
`, 
    description: 'PS2 IOP Assembly', 
    category: 'ps2' 
  },
  'vcl': { 
    content: `; ATHENA ENV - PlayStation 2 Development
; VU1 Microcode (Vector Unit)

.syntax new
.name VU1_Program
.vu
.init_vf_all
.init_vi_all

--enter
--endenter

; VU1 Program Start
START:
    NOP                     LOI 1.0
    NOP                     IADDIU VI01, VI00, 0
    
LOOP:
    ; Transform vertex
    MULAx.xyzw  ACC, VF01, VF05x
    MADDAy.xyzw ACC, VF02, VF05y
    MADDAz.xyzw ACC, VF03, VF05z
    MADDw.xyzw  VF06, VF04, VF05w
    
    ; Perspective divide
    DIV Q, VF00w, VF06w
    WAITQ
    MULq.xyz    VF06, VF06, Q
    
    NOP                     IADDIU VI01, VI01, 1
    NOP                     IBNE VI01, VI02, LOOP
    NOP                     NOP

--exit
--endexit
`, 
    description: 'VU1 Microcode', 
    category: 'ps2' 
  },
  'dsm': { 
    content: `; ATHENA ENV - PlayStation 2 Development
; DMA Script / GIF Tag Data

.align 4

; GIF Tag for primitive rendering
gif_tag:
    .dword 0x0000000000008001  ; NLOOP=1, EOP=1, PRE=0, PRIM=0, FLG=0, NREG=0
    .dword 0x0000000000000000
    
; Primitive data
prim_data:
    .dword 0x0000000000000046  ; PRIM: Triangle, Gouraud, Texture
    .dword 0x0000000000000000

; Vertex data (X, Y, Z, Q)
vertex1:
    .float 100.0, 100.0, 0.0, 1.0
vertex2:
    .float 200.0, 100.0, 0.0, 1.0
vertex3:
    .float 150.0, 200.0, 0.0, 1.0
`, 
    description: 'DMA/GIF Script', 
    category: 'ps2' 
  },

  // === PS2 CONFIG FILES ===
  'cfg': { 
    content: `# ATHENA ENV Configuration File
# PlayStation 2 Development Settings

[General]
ProjectName = MyPS2Game
Version = 1.0.0
Author = Developer
Description = PS2 Game Project

[Build]
Target = EE
Optimization = -O2
Debug = true
OutputFormat = ELF

[Memory]
StackSize = 0x10000
HeapSize = 0x100000

[Graphics]
Width = 640
Height = 448
Interlaced = true
FrameBuffer = 0

[Audio]
SampleRate = 48000
Channels = 2
`, 
    description: 'PS2 Config', 
    category: 'config' 
  },
  'cnf': { 
    content: `# PCSX2/PS2 System Configuration
# Boot Configuration File

BOOT2 = cdrom0:\\SLXX_XXX.XX;1
VER = 1.00
VMODE = NTSC
HDDUNITPOWER = NICHDD

# Memory Card Settings
ICON_FILE = mc0:/BADATA-SYSTEM/icon00.ico

# Debug Settings
DEBUG = 0
LOGGING = 0
`, 
    description: 'PS2 Boot Config', 
    category: 'config' 
  },
  'ini': { 
    content: `; ATHENA ENV INI Configuration
; Game Settings File

[Video]
Resolution = 640x448
Aspect = 4:3
VSync = 1
Interlace = 1
FieldMode = Frame

[Audio]
Volume = 100
SFXVolume = 100
MusicVolume = 80
Channels = Stereo

[Controls]
Pad1 = Standard
Vibration = 1
Sensitivity = 50

[Game]
Difficulty = Normal
Language = English
Subtitles = 1
`, 
    description: 'INI Config', 
    category: 'config' 
  },
  'mak': { 
    content: `# ATHENA ENV Makefile
# PlayStation 2 Build Configuration

EE_BIN = game.elf
EE_OBJS = main.o graphics.o audio.o input.o

# PS2SDK paths
PS2SDK = /usr/local/ps2dev/ps2sdk
PS2DEV = /usr/local/ps2dev

# Compiler flags
EE_CFLAGS = -G0 -O2 -Wall
EE_CXXFLAGS = $(EE_CFLAGS)
EE_LDFLAGS = -L$(PS2SDK)/ee/lib -L$(PS2SDK)/common/lib

# Libraries
EE_LIBS = -ldma -lgraph -ldraw -lkernel -lc -lpacket

# Include PS2SDK rules
include $(PS2SDK)/samples/Makefile.pref
include $(PS2SDK)/samples/Makefile.eeglobal

all: $(EE_BIN)

clean:
	rm -f $(EE_OBJS) $(EE_BIN)

run: $(EE_BIN)
	ps2client execee host:$(EE_BIN)

.PHONY: all clean run
`, 
    description: 'PS2 Makefile', 
    category: 'config' 
  },
  'ld': { 
    content: `/* ATHENA ENV Linker Script
 * PlayStation 2 EE Core Memory Layout
 */

OUTPUT_FORMAT("elf32-littlemips")
OUTPUT_ARCH(mips:5900)
ENTRY(_start)

MEMORY
{
    /* EE Memory Map */
    ram (rwx)    : ORIGIN = 0x00100000, LENGTH = 32M
    scratchpad   : ORIGIN = 0x70000000, LENGTH = 16K
}

SECTIONS
{
    .text : {
        _text_start = .;
        *(.text)
        *(.text.*)
        _text_end = .;
    } > ram

    .rodata : {
        *(.rodata)
        *(.rodata.*)
    } > ram

    .data : {
        _data_start = .;
        *(.data)
        *(.data.*)
        _data_end = .;
    } > ram

    .bss : {
        _bss_start = .;
        *(.bss)
        *(.bss.*)
        *(COMMON)
        _bss_end = .;
    } > ram

    _end = .;
    
    /* Stack */
    _stack_size = 0x10000;
    _stack_end = 0x02000000 - 0x10;
    _stack = _stack_end - _stack_size;
}
`, 
    description: 'Linker Script', 
    category: 'config' 
  },

  // === SCRIPTING ===
  'js': { 
    content: `// ATHENA ENV JavaScript
// PS2 Homebrew Script

/**
 * Main entry point
 */
function main() {
    console.log("ATHENA ENV Initialized");
    
    // Initialize graphics
    Screen.setMode(NTSC, 640, 448);
    
    // Main game loop
    while (true) {
        // Clear screen
        Screen.clear(Color.new(0, 0, 0));
        
        // Update game logic
        update();
        
        // Render
        render();
        
        // Wait for VSync
        Screen.waitVblankStart();
        Screen.flip();
    }
}

function update() {
    // Game update logic
}

function render() {
    // Render graphics
}

// Start application
main();
`, 
    description: 'ATHENA JavaScript', 
    category: 'script' 
  },
  'lua': { 
    content: `-- ATHENA ENV Lua Script
-- PlayStation 2 Development

-- Initialize
local running = true

-- Main function
function main()
    print("ATHENA ENV Lua Script Started")
    
    -- Setup graphics
    Screen.setMode(NTSC, 640, 448)
    
    -- Main loop
    while running do
        -- Clear
        Screen.clear(Color.new(0, 0, 64))
        
        -- Update
        update()
        
        -- Render
        render()
        
        -- Flip buffers
        Screen.waitVblankStart()
        Screen.flip()
    end
end

function update()
    -- Read controller
    local pad = Pads.get()
    
    if pad.btns & Pads.START then
        running = false
    end
end

function render()
    -- Draw text
    Font.print(10, 10, "Hello PS2!", Color.new(255, 255, 255))
end

-- Run
main()
`, 
    description: 'ATHENA Lua Script', 
    category: 'script' 
  },
  'py': { 
    content: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ATHENA ENV - Python Tool Script
PS2 Development Utility
"""

import os
import struct
import sys

def main():
    """Main entry point"""
    print("ATHENA ENV Python Tool")
    print("=" * 40)
    
    # Your tool logic here
    
if __name__ == "__main__":
    main()
`, 
    description: 'Python Script', 
    category: 'script' 
  },
  'sh': { 
    content: `#!/bin/bash
# ATHENA ENV Build Script
# PlayStation 2 Development

set -e

echo "==================================="
echo "ATHENA ENV Build System"
echo "==================================="

# Environment
export PS2DEV=/usr/local/ps2dev
export PS2SDK=$PS2DEV/ps2sdk
export PATH=$PATH:$PS2DEV/bin:$PS2DEV/ee/bin:$PS2DEV/iop/bin

# Build
echo "Building project..."
make clean
make all

echo "Build complete!"
`, 
    description: 'Shell Script', 
    category: 'script' 
  },

  // === WEB ===
  'html': { 
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ATHENA ENV</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main>
        <h1>ATHENA ENV</h1>
        <p>PlayStation 2 Development</p>
    </main>
    <script src="main.js"></script>
</body>
</html>
`, 
    description: 'HTML Document', 
    category: 'web' 
  },
  'css': { 
    content: `/* ATHENA ENV Stylesheet */

:root {
    --primary: #6366f1;
    --background: #0f0f23;
    --foreground: #e2e8f0;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: system-ui, sans-serif;
    background: var(--background);
    color: var(--foreground);
    min-height: 100vh;
}
`, 
    description: 'CSS Stylesheet', 
    category: 'web' 
  },
  'ts': { 
    content: `// ATHENA ENV TypeScript

interface PS2Config {
    width: number;
    height: number;
    interlaced: boolean;
}

const config: PS2Config = {
    width: 640,
    height: 448,
    interlaced: true
};

export default config;
`, 
    description: 'TypeScript', 
    category: 'code' 
  },

  // === DATA ===
  'json': { 
    content: `{
    "name": "athena-project",
    "version": "1.0.0",
    "description": "PlayStation 2 Project",
    "author": "Developer",
    "settings": {
        "video": {
            "width": 640,
            "height": 448,
            "interlaced": true
        },
        "audio": {
            "sampleRate": 48000,
            "channels": 2
        }
    }
}
`, 
    description: 'JSON Data', 
    category: 'data' 
  },
  'xml': { 
    content: `<?xml version="1.0" encoding="UTF-8"?>
<!-- ATHENA ENV XML Configuration -->
<project name="athena-project" version="1.0">
    <settings>
        <video width="640" height="448" interlaced="true"/>
        <audio sampleRate="48000" channels="2"/>
    </settings>
    <assets>
        <!-- Asset definitions -->
    </assets>
</project>
`, 
    description: 'XML Document', 
    category: 'data' 
  },
  'yaml': { 
    content: `# ATHENA ENV YAML Configuration
name: athena-project
version: 1.0.0

settings:
  video:
    width: 640
    height: 448
    interlaced: true
  audio:
    sampleRate: 48000
    channels: 2

build:
  target: EE
  optimization: O2
  debug: false
`, 
    description: 'YAML Config', 
    category: 'data' 
  },

  // === SHADERS ===
  'glsl': { 
    content: `// ATHENA ENV GLSL Shader
#version 330 core

void main() {
    // Shader code
}
`, 
    description: 'GLSL Shader', 
    category: 'shader' 
  },
  'vert': { 
    content: `// ATHENA ENV Vertex Shader
#version 330 core

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec2 vTexCoord;
out vec3 vNormal;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
    vTexCoord = aTexCoord;
    vNormal = mat3(transpose(inverse(uModel))) * aNormal;
}
`, 
    description: 'Vertex Shader', 
    category: 'shader' 
  },
  'frag': { 
    content: `// ATHENA ENV Fragment Shader
#version 330 core

in vec2 vTexCoord;
in vec3 vNormal;

uniform sampler2D uTexture;
uniform vec3 uLightDir;

out vec4 fragColor;

void main() {
    vec4 texColor = texture(uTexture, vTexCoord);
    float diffuse = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
    fragColor = texColor * (0.3 + 0.7 * diffuse);
}
`, 
    description: 'Fragment Shader', 
    category: 'shader' 
  },

  // === DOCS ===
  'md': { 
    content: `# ATHENA ENV Project

## Description

PlayStation 2 development project using ATHENA ENV.

## Requirements

- PS2SDK
- ATHENA ENV Runtime

## Build

\`\`\`bash
make clean && make all
\`\`\`

## License

MIT License
`, 
    description: 'Markdown', 
    category: 'docs' 
  },
  'txt': { 
    content: '', 
    description: 'Text File', 
    category: 'docs' 
  },

  // === BINARY PLACEHOLDERS ===
  'elf': { content: '', description: 'ELF Executable', category: 'ps2' },
  'irx': { content: '', description: 'IOP Module', category: 'ps2' },
};

// Template categories for quick create
const templateCategories = [
  {
    id: 'ps2',
    name: 'PS2 Development',
    icon: '🎮',
    templates: ['c', 'cpp', 'h', 'hpp', 's', 'asm', 'vcl', 'dsm']
  },
  {
    id: 'config',
    name: 'Configuración',
    icon: '⚙️',
    templates: ['cfg', 'cnf', 'ini', 'mak', 'ld', 'yaml']
  },
  {
    id: 'script',
    name: 'Scripts',
    icon: '📜',
    templates: ['js', 'lua', 'py', 'sh']
  },
  {
    id: 'shader',
    name: 'Shaders',
    icon: '🎨',
    templates: ['glsl', 'vert', 'frag', 'vcl']
  },
  {
    id: 'data',
    name: 'Datos',
    icon: '📦',
    templates: ['json', 'xml', 'yaml']
  },
  {
    id: 'web',
    name: 'Web',
    icon: '🌐',
    templates: ['html', 'css', 'ts']
  },
  {
    id: 'docs',
    name: 'Documentación',
    icon: '📄',
    templates: ['md', 'txt']
  }
];

export function FileExplorer({ 
  onFileSelect, 
  selectedFile, 
  onProjectLoad, 
  onFileSystemUpdate, 
  onAIConsult,
  onFileDelete,
  onFileRename,
  externalFileSystem,
  onCloneRepository,
  onProjectClear
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([]));
  const [searchTerm, setSearchTerm] = useState('');
  const [fileSystem, setFileSystem] = useState<FileNode[]>([]);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateCategory, setQuickCreateCategory] = useState<string>('ps2');
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('/');
  const [isDragging, setIsDragging] = useState(false);
  
  // Context menu & rename states
  const [renamingFile, setRenamingFile] = useState<FileNode | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenuFile, setContextMenuFile] = useState<FileNode | null>(null);
  const [clipboard, setClipboard] = useState<{ node: FileNode; operation: 'copy' | 'cut' } | null>(null);
  
  // Dialog states
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [fileHistory, setFileHistory] = useState<FileHistory[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Double click detection
  const lastClickTime = useRef<number>(0);
  const lastClickedFile = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync with external file system
  useEffect(() => {
    if (!externalFileSystem) return;

    setFileSystem(externalFileSystem);

    // Auto-expand a single root folder (typical after cloning a repo)
    if (externalFileSystem.length === 1 && externalFileSystem[0]?.type === 'folder') {
      const rootPath = externalFileSystem[0].path;
      setExpandedFolders(prev => (prev.size === 0 || !prev.has(rootPath) ? new Set([rootPath]) : prev));
      setSelectedFolderPath(prev => (prev === '/' ? rootPath : prev));
    }
  }, [externalFileSystem]);

  // Get all files recursively for AI reading
  const getAllFilesContent = useCallback((): Array<{ path: string; content: string; type: string }> => {
    const files: Array<{ path: string; content: string; type: string }> = [];
    
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.content) {
          files.push({
            path: node.path,
            content: node.content,
            type: node.name.split('.').pop() || 'txt'
          });
        } else if (node.type === 'folder' && node.children) {
          traverse(node.children);
        }
      }
    };
    
    traverse(fileSystem);
    return files;
  }, [fileSystem]);

  // Expose to parent for AI access
  useEffect(() => {
    (window as any).__athenaFS = {
      getFiles: getAllFilesContent,
      createFile: (path: string, content: string) => handleAICreateFile(path, content),
      createFolder: (path: string) => handleAICreateFolder(path),
      updateFile: (path: string, content: string) => handleAIUpdateFile(path, content),
      deleteFile: (path: string) => handleAIDeleteFile(path),
      renameFile: (oldPath: string, newPath: string) => handleAIRenameFile(oldPath, newPath),
      readFile: (path: string) => handleAIReadFile(path),
      fileSystem: fileSystem
    };
  }, [fileSystem, getAllFilesContent]);

  // AI File Operations
  const handleAICreateFile = (path: string, content: string = '') => {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop() || 'newfile.txt';
    const folderPath = '/' + parts.join('/');
    
    const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'txt';
    const template = fileTemplates[ext || 'txt'];
    
    const newFile: FileNode = {
      name: fileName,
      type: 'file',
      path: path.startsWith('/') ? path : `/${path}`,
      content: content || template?.content || ''
    };

    // Create folders if they don't exist
    let updatedFS = [...fileSystem];
    if (folderPath && folderPath !== '/') {
      updatedFS = ensureFolderExists(updatedFS, folderPath);
    }

    updatedFS = addFileToTree(updatedFS, newFile, folderPath || '/');
    updateFileSystem(updatedFS);
    
    toast({
      title: "Archivo creado",
      description: `${fileName} creado por IA`,
    });
    
    return newFile;
  };

  const handleAICreateFolder = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    const folderName = parts.pop() || 'newfolder';
    const parentPath = '/' + parts.join('/');
    
    const newFolder: FileNode = {
      name: folderName,
      type: 'folder',
      path: path.startsWith('/') ? path : `/${path}`,
      children: []
    };

    let updatedFS = [...fileSystem];
    if (parentPath && parentPath !== '/') {
      updatedFS = ensureFolderExists(updatedFS, parentPath);
    }

    updatedFS = addFileToTree(updatedFS, newFolder, parentPath || '/');
    updateFileSystem(updatedFS);
    setExpandedFolders(prev => new Set([...prev, newFolder.path]));
    
    toast({
      title: "Carpeta creada",
      description: `${folderName} creada por IA`,
    });
    
    return newFolder;
  };

  const handleAIUpdateFile = (path: string, content: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const updatedFS = updateFileContentInTree(fileSystem, normalizedPath, content);
    updateFileSystem(updatedFS);
    
    toast({
      title: "Archivo actualizado",
      description: `${path.split('/').pop()} modificado por IA`,
    });
  };

  const handleAIDeleteFile = (path: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const updatedFS = deleteFileFromTree(fileSystem, normalizedPath);
    updateFileSystem(updatedFS);
    
    toast({
      title: "Archivo eliminado",
      description: `${path.split('/').pop()} eliminado por IA`,
    });
  };

  const handleAIRenameFile = (oldPath: string, newPath: string) => {
    const normalizedOldPath = oldPath.startsWith('/') ? oldPath : `/${oldPath}`;
    const normalizedNewPath = newPath.startsWith('/') ? newPath : `/${newPath}`;
    const newName = normalizedNewPath.split('/').pop() || '';
    
    const updatedFS = renameFileInTree(fileSystem, normalizedOldPath, newName, normalizedNewPath);
    updateFileSystem(updatedFS);
    
    toast({
      title: "Archivo renombrado",
      description: `Renombrado por IA`,
    });
  };

  const handleAIReadFile = (path: string): string | null => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const file = findFileByPath(fileSystem, normalizedPath);
    return file?.content || null;
  };

  const findFileByPath = (nodes: FileNode[], path: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.type === 'folder' && node.children) {
        const found = findFileByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const ensureFolderExists = (tree: FileNode[], folderPath: string): FileNode[] => {
    const parts = folderPath.split('/').filter(Boolean);
    let currentTree = tree;
    let currentPath = '';

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
      const existingFolder = currentTree.find(n => n.path === currentPath && n.type === 'folder');
      
      if (!existingFolder) {
        const newFolder: FileNode = {
          name: part,
          type: 'folder',
          path: currentPath,
          children: []
        };
        currentTree.push(newFolder);
        currentTree = newFolder.children!;
      } else {
        currentTree = existingFolder.children!;
      }
    }

    return tree;
  };

  const updateFileContentInTree = (tree: FileNode[], path: string, content: string): FileNode[] => {
    return tree.map(node => {
      if (node.path === path) {
        return { ...node, content };
      }
      if (node.type === 'folder' && node.children) {
        return { ...node, children: updateFileContentInTree(node.children, path, content) };
      }
      return node;
    });
  };

  const handleFolderImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (!files || files.length === 0) return;
      
      toast({
        title: "Importando proyecto...",
        description: `Cargando ${files.length} archivos`,
      });
      
      const fileTree = await buildFileTree(files);
      setFileSystem(fileTree);
      onProjectLoad?.(fileTree);
      
      const rootFolders = fileTree
        .filter(node => node.type === 'folder')
        .map(node => node.path);
      setExpandedFolders(new Set(rootFolders));
      
      toast({
        title: "Proyecto importado",
        description: `${files.length} archivos cargados exitosamente`,
      });
    };
    
    input.click();
  };

  const handleFilesImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (!files || files.length === 0) return;
      let workingFS = fileSystem;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await readFileContent(file);
        const newFile: FileNode = {
          name: file.name,
          type: 'file',
          path: selectedFolderPath === '/' ? `/${file.name}` : `${selectedFolderPath}/${file.name}`,
          content
        };
        workingFS = addFileToTree(workingFS, newFile, selectedFolderPath);
      }
      updateFileSystem(workingFS);
      toast({
        title: "Archivos importados",
        description: `${files.length} archivo(s) agregado(s)`,
      });
    };
    
    input.click();
  };

  const readFileContent = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    // Binary/image files
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tga', 'dds', 'tif', 'tiff'].includes(ext || '')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    
    // Text files
    return file.text();
  };

  const handleExportProject = async () => {
    if (fileSystem.length === 0) {
      toast({
        title: "Sin archivos",
        description: "No hay archivos para exportar",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Exportando...",
      description: "Preparando archivo ZIP",
    });

    const zip = new JSZip();
    
    const addFilesToZip = (nodes: FileNode[], folder?: JSZip) => {
      nodes.forEach(node => {
        if (node.type === 'folder' && node.children) {
          const newFolder = folder ? folder.folder(node.name) : zip.folder(node.name);
          if (newFolder) {
            addFilesToZip(node.children, newFolder);
          }
        } else if (node.type === 'file' && node.content) {
          const targetFolder = folder || zip;
          
          if (node.content.startsWith('data:')) {
            const base64Data = node.content.split(',')[1];
            targetFolder.file(node.name, base64Data, { base64: true });
          } else if (node.content.startsWith('__BASE64__:')) {
            const base64Data = node.content.slice('__BASE64__:'.length);
            targetFolder.file(node.name, base64Data, { base64: true });
          } else {
            targetFolder.file(node.name, node.content);
          }
        }
      });
    };

    addFilesToZip(fileSystem);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'athena-project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Proyecto exportado",
      description: "ZIP descargado exitosamente",
    });
  };

  const buildFileTree = async (files: FileList): Promise<FileNode[]> => {
    const tree: { [key: string]: FileNode } = {};
    const rootNodes: FileNode[] = [];
    const fileDataMap = new Map<string, File>();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pathParts = file.webkitRelativePath.split('/');
      
      let currentPath = '';
      
      for (let j = 0; j < pathParts.length; j++) {
        const part = pathParts[j];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
        
        const isFile = j === pathParts.length - 1;
        
        if (!tree[currentPath]) {
          const node: FileNode = {
            name: part,
            type: isFile ? 'file' : 'folder',
            path: currentPath,
            children: isFile ? undefined : []
          };
          
          tree[currentPath] = node;
          
          if (isFile) {
            fileDataMap.set(currentPath, file);
          }
          
          if (parentPath && tree[parentPath]) {
            tree[parentPath].children?.push(node);
          } else if (j === 0) {
            rootNodes.push(node);
          }
        }
      }
    }
    
    const readPromises: Promise<void>[] = [];
    const textExtensions = ['js', 'ts', 'jsx', 'tsx', 'txt', 'ini', 'cnf', 'cfg', 'json', 'lua', 'md', 'xml', 'css', 'html', 'c', 'cpp', 'h', 'hpp', 'glsl', 'vert', 'frag', 'py', 'sh', 'bat', 'ps1', 'yaml', 'yml', 'toml', 'makefile', 'dockerfile'];
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tga', 'dds', 'tif', 'tiff'];
    
    for (const [path, file] of fileDataMap.entries()) {
      const node = tree[path];
      if (!node) continue;
      
      const ext = node.name.split('.').pop()?.toLowerCase() || '';
      
      if (textExtensions.includes(ext) || node.name.toLowerCase() === 'makefile' || node.name.toLowerCase() === 'dockerfile') {
        readPromises.push(
          file.text()
            .then(content => { node.content = content; })
            .catch(err => console.error('Error reading:', node.name, err))
        );
      } else if (imageExtensions.includes(ext)) {
        readPromises.push(
          new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => { node.content = e.target?.result as string; resolve(); };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }).catch(err => console.error('Error reading image:', node.name, err))
        );
      }
    }
    
    await Promise.all(readPromises);
    return rootNodes;
  };

  const updateFileSystem = (newFileSystem: FileNode[]) => {
    setFileSystem(newFileSystem);
    onFileSystemUpdate?.(newFileSystem);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const extension = newFileName.includes('.') ? newFileName.split('.').pop()?.toLowerCase() : 'txt';
    const filePath = selectedFolderPath === '/' ? `/${newFileName}` : `${selectedFolderPath}/${newFileName}`;
    const template = fileTemplates[extension || 'txt'];
    
    const newFile: FileNode = {
      name: newFileName,
      type: 'file',
      path: filePath,
      content: template?.content || ''
    };

    const updatedFileSystem = addFileToTree(fileSystem, newFile, selectedFolderPath);
    updateFileSystem(updatedFileSystem);
    setNewFileName('');
    setShowNewFileDialog(false);
    setShowQuickCreate(false);
    
    // Select the new file
    onFileSelect(newFile);
    
    toast({
      title: "Archivo creado",
      description: newFileName,
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const folderPath = selectedFolderPath === '/' ? `/${newFolderName}` : `${selectedFolderPath}/${newFolderName}`;
    
    const newFolder: FileNode = {
      name: newFolderName,
      type: 'folder',
      path: folderPath,
      children: []
    };

    const updatedFileSystem = addFileToTree(fileSystem, newFolder, selectedFolderPath);
    updateFileSystem(updatedFileSystem);
    setExpandedFolders(prev => new Set([...prev, folderPath]));
    setNewFolderName('');
    setShowNewFolderDialog(false);
    setShowQuickCreate(false);
    
    toast({
      title: "Carpeta creada",
      description: newFolderName,
    });
  };

  const handleQuickCreateFile = (extension: string) => {
    const ext = extension.replace('.', '');
    const template = fileTemplates[ext];
    const fileName = `untitled.${ext}`;
    const filePath = selectedFolderPath === '/' ? `/${fileName}` : `${selectedFolderPath}/${fileName}`;
    
    const newFile: FileNode = {
      name: fileName,
      type: 'file',
      path: filePath,
      content: template?.content || ''
    };

    const updatedFileSystem = addFileToTree(fileSystem, newFile, selectedFolderPath);
    updateFileSystem(updatedFileSystem);
    setShowQuickCreate(false);
    
    // Start renaming immediately
    setRenamingFile(newFile);
    setRenameValue(fileName);
    onFileSelect(newFile);
  };

  const addFileToTree = (tree: FileNode[], newNode: FileNode, targetPath: string): FileNode[] => {
    if (targetPath === '/' || targetPath === '') {
      const uniqueName = makeUniqueName(tree, newNode.name, newNode.type);
      const finalNode = reparentNode({ ...newNode, name: uniqueName }, '/');
      if (uniqueName !== newNode.name) {
        toast({
          title: 'Nombre duplicado',
          description: `Ya existía "${newNode.name}". Renombrado a "${uniqueName}".`,
        });
      }
      return [...tree, finalNode];
    }

    return tree.map(node => {
      if (node.type === 'folder' && node.path === targetPath) {
        const children = node.children || [];
        const uniqueName = makeUniqueName(children, newNode.name, newNode.type);
        const finalNode = reparentNode({ ...newNode, name: uniqueName }, targetPath);
        if (uniqueName !== newNode.name) {
          toast({
            title: 'Nombre duplicado',
            description: `Ya existía "${newNode.name}" en esta carpeta. Renombrado a "${uniqueName}".`,
          });
        }
        return {
          ...node,
          children: [...children, finalNode]
        };
      } else if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: addFileToTree(node.children, newNode, targetPath)
        };
      }
      return node;
    });
  };

  // ===== Unique-name helpers (Windows/macOS-style: no duplicates in same folder) =====
  const makeUniqueName = (
    siblings: FileNode[],
    name: string,
    type: 'file' | 'folder'
  ): string => {
    const exists = (candidate: string) =>
      siblings.some(
        s => s.type === type && s.name.toLowerCase() === candidate.toLowerCase()
      );
    if (!exists(name)) return name;

    let base = name;
    let ext = '';
    if (type === 'file' && name.includes('.')) {
      const i = name.lastIndexOf('.');
      base = name.slice(0, i);
      ext = name.slice(i);
    }
    // Strip an existing _N suffix to keep numbering tidy
    const m = base.match(/^(.*)_(\d+)$/);
    if (m) base = m[1];

    let n = 2;
    while (exists(`${base}_${n}${ext}`)) n++;
    return `${base}_${n}${ext}`;
  };

  const reparentNode = (node: FileNode, parentPath: string): FileNode => {
    const newPath =
      parentPath === '/' || parentPath === ''
        ? `/${node.name}`
        : `${parentPath}/${node.name}`;
    const cloned: FileNode = { ...node, path: newPath };
    if (node.type === 'folder' && node.children) {
      cloned.children = node.children.map(c => reparentNode(c, newPath));
    }
    return cloned;
  };

  const findFolderByPath = (tree: FileNode[], path: string): FileNode | null => {
    for (const n of tree) {
      if (n.path === path && n.type === 'folder') return n;
      if (n.type === 'folder' && n.children) {
        const f = findFolderByPath(n.children, path);
        if (f) return f;
      }
    }
    return null;
  };

  const getSiblingsAtPath = (tree: FileNode[], parentPath: string): FileNode[] => {
    if (parentPath === '/' || parentPath === '') return tree;
    const folder = findFolderByPath(tree, parentPath);
    return folder?.children || [];
  };

  // Handle double click to rename
  const handleFileClick = (node: FileNode) => {
    const now = Date.now();
    const timeDiff = now - lastClickTime.current;
    
    if (timeDiff < 300 && lastClickedFile.current === node.path) {
      if (node.type === 'file') {
        setRenamingFile(node);
        setRenameValue(node.name);
      }
    } else {
      if (node.type === 'folder') {
        toggleFolder(node.path);
        setSelectedFolderPath(node.path);
      } else {
        onFileSelect(node);
      }
    }
    
    lastClickTime.current = now;
    lastClickedFile.current = node.path;
  };

  const handleDelete = (node: FileNode) => {
    const updatedFileSystem = deleteFileFromTree(fileSystem, node.path);
    updateFileSystem(updatedFileSystem);
    // Notify parent to close any open tab for this file
    if (onFileDelete) {
      if (node.type === 'file') {
        onFileDelete(node.path);
      } else if (node.type === 'folder') {
        // For folders, we need to close all tabs of files inside the folder
        const closeFolderFiles = (children: FileNode[]) => {
          for (const child of children) {
            if (child.type === 'file') {
              onFileDelete(child.path);
            } else if (child.type === 'folder' && child.children) {
              closeFolderFiles(child.children);
            }
          }
        };
        if (node.children) {
          closeFolderFiles(node.children);
        }
      }
    }
    toast({
      title: "Eliminado",
      description: node.name,
    });
  };

  const deleteFileFromTree = (tree: FileNode[], targetPath: string): FileNode[] => {
    return tree.filter(node => {
      if (node.path === targetPath) return false;
      if (node.type === 'folder' && node.children) {
        node.children = deleteFileFromTree(node.children, targetPath);
      }
      return true;
    });
  };

  const handleRename = (oldNode: FileNode, newName: string) => {
    if (!newName.trim() || newName === oldNode.name) {
      setRenamingFile(null);
      return;
    }

    const parentPath = oldNode.path.split('/').slice(0, -1).join('/') || '/';
    const siblings = getSiblingsAtPath(fileSystem, parentPath).filter(
      s => s.path !== oldNode.path
    );
    const uniqueName = makeUniqueName(siblings, newName.trim(), oldNode.type);
    if (uniqueName !== newName.trim()) {
      toast({
        title: 'Nombre duplicado',
        description: `Ya existe "${newName}" en esta carpeta. Renombrado a "${uniqueName}".`,
      });
    }
    const newPath = parentPath === '/' ? `/${uniqueName}` : `${parentPath}/${uniqueName}`;

    const updatedFileSystem = renameFileInTree(fileSystem, oldNode.path, uniqueName, newPath);
    updateFileSystem(updatedFileSystem);
    
    // Notify parent to update tab names
    if (onFileRename) {
      onFileRename(oldNode.path, newPath, uniqueName);
    }
    
    setRenamingFile(null);
  };

  const renameFileInTree = (tree: FileNode[], oldPath: string, newName: string, newPath: string): FileNode[] => {
    return tree.map(node => {
      if (node.path === oldPath) {
        return { ...node, name: newName, path: newPath };
      }
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: renameFileInTree(node.children, oldPath, newName, newPath)
        };
      }
      return node;
    });
  };

  const handleCopy = (node: FileNode) => {
    setClipboard({ node, operation: 'copy' });
    toast({ title: "Copiado al portapapeles", description: node.name });
  };

  const handleCut = (node: FileNode) => {
    setClipboard({ node, operation: 'cut' });
    toast({ title: "Cortado al portapapeles", description: node.name });
  };

  const handlePasteAt = (targetNode: FileNode) => {
    if (!clipboard) return;

    // Determine the target folder
    const targetFolder = targetNode.type === 'folder' 
      ? targetNode.path 
      : targetNode.path.split('/').slice(0, -1).join('/') || '/';

    // Avoid pasting into itself
    if (clipboard.node.path === targetFolder || targetFolder.startsWith(clipboard.node.path + '/')) {
      toast({ title: "Error", description: "No se puede pegar un elemento dentro de sí mismo" });
      return;
    }

    // Check for name collision and generate unique name
    let finalName = clipboard.node.name;
    const newPath = targetFolder === '/' 
      ? `/${finalName}` 
      : `${targetFolder}/${finalName}`;

    const newNode: FileNode = {
      ...clipboard.node,
      path: newPath,
      name: finalName,
    };

    let updatedFS = addFileToTree(fileSystem, newNode, targetFolder);
    
    if (clipboard.operation === 'cut') {
      updatedFS = deleteFileFromTree(updatedFS, clipboard.node.path);
      // Close tab of cut file
      if (onFileDelete && clipboard.node.type === 'file') {
        onFileDelete(clipboard.node.path);
      }
      setClipboard(null);
    }

    updateFileSystem(updatedFS);
    toast({ title: "Pegado", description: `${finalName} en ${targetFolder}` });
  };

  // Legacy paste for toolbar/keyboard
  const handlePaste = () => {
    if (!clipboard) return;
    const newPath = selectedFolderPath === '/' 
      ? `/${clipboard.node.name}` 
      : `${selectedFolderPath}/${clipboard.node.name}`;

    const newNode: FileNode = {
      ...clipboard.node,
      path: newPath
    };

    let updatedFS = addFileToTree(fileSystem, newNode, selectedFolderPath);
    
    if (clipboard.operation === 'cut') {
      updatedFS = deleteFileFromTree(updatedFS, clipboard.node.path);
      if (onFileDelete && clipboard.node.type === 'file') {
        onFileDelete(clipboard.node.path);
      }
      setClipboard(null);
    }

    updateFileSystem(updatedFS);
    toast({ title: "Pegado", description: newNode.name });
  };

  const getFileMetadata = (node: FileNode): FileMetadata => {
    const content = node.content || '';
    const size = new Blob([content]).size;
    const lines = content.split('\n').length;
    const extension = node.name.split('.').pop()?.toLowerCase() || '';
    
    return {
      size,
      created: new Date(),
      modified: new Date(),
      type: extension,
      lines: node.type === 'file' ? lines : undefined,
      encoding: 'UTF-8'
    };
  };

  const handleShowInfo = (node: FileNode) => {
    setContextMenuFile(node);
    setFileMetadata(getFileMetadata(node));
    setShowInfoDialog(true);
  };

  const handleShowHistory = (node: FileNode) => {
    setContextMenuFile(node);
    setFileHistory([
      { timestamp: new Date(), action: 'Modificado', size: getFileMetadata(node).size, user: 'Usuario' },
      { timestamp: new Date(Date.now() - 3600000), action: 'Creado', size: getFileMetadata(node).size - 100, user: 'IA Developer' },
    ]);
    setShowHistoryDialog(true);
  };

  const handleShowPreview = (node: FileNode) => {
    setContextMenuFile(node);
    setShowPreviewDialog(true);
  };

  const handleAIAction = (node: FileNode, action: 'consult' | 'analyze' | 'improve') => {
    onAIConsult?.(node, action);
  };

  // === DUPLICATE ===
  const handleDuplicate = (node: FileNode) => {
    const ext = node.name.includes('.') ? '.' + node.name.split('.').pop() : '';
    const baseName = ext ? node.name.slice(0, -ext.length) : node.name;
    const newName = `${baseName} copia${ext}`;
    const parentPath = node.path.split('/').slice(0, -1).join('/') || '/';
    const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;

    const deepClone = (n: FileNode, newBasePath: string): FileNode => {
      const cloned: FileNode = { ...n, name: n === node ? newName : n.name, path: n === node ? newPath : newBasePath + '/' + n.name };
      if (n.type === 'folder' && n.children) {
        cloned.children = n.children.map(c => deepClone(c, cloned.path));
      }
      return cloned;
    };

    const clonedNode = deepClone(node, parentPath);
    const updatedFS = addFileToTree(fileSystem, clonedNode, parentPath);
    updateFileSystem(updatedFS);
    toast({ title: "Duplicado", description: `${newName}` });
  };

  // === COMPRESS TO ZIP ===
  const handleCompress = async (node: FileNode) => {
    const zip = new JSZip();

    const addToZip = (n: FileNode, folder: JSZip) => {
      if (n.type === 'folder' && n.children) {
        const sub = folder.folder(n.name);
        if (sub) n.children.forEach(c => addToZip(c, sub));
      } else if (n.type === 'file' && n.content) {
        if (n.content.startsWith('data:')) {
          const base64Data = n.content.split(',')[1];
          folder.file(n.name, base64Data, { base64: true });
        } else if (n.content.startsWith('__BASE64__:')) {
          folder.file(n.name, n.content.slice('__BASE64__:'.length), { base64: true });
        } else {
          folder.file(n.name, n.content);
        }
      }
    };

    if (node.type === 'folder') {
      const sub = zip.folder(node.name);
      if (sub && node.children) node.children.forEach(c => addToZip(c, sub));
    } else if (node.content) {
      if (node.content.startsWith('data:')) {
        zip.file(node.name, node.content.split(',')[1], { base64: true });
      } else if (node.content.startsWith('__BASE64__:')) {
        zip.file(node.name, node.content.slice('__BASE64__:'.length), { base64: true });
      } else {
        zip.file(node.name, node.content);
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${node.name.split('.')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Comprimido", description: `${node.name}.zip descargado` });
  };

  // === MOVE TO TRASH (temporary folder) ===
  const handleMoveToTrash = (node: FileNode) => {
    // Ensure .Basurero folder exists
    let updatedFS = [...fileSystem];
    const trashFolder = updatedFS.find(n => n.name === '.Basurero' && n.type === 'folder');
    if (!trashFolder) {
      const newTrash: FileNode = {
        name: '.Basurero',
        type: 'folder',
        path: '/.Basurero',
        children: []
      };
      updatedFS = [...updatedFS, newTrash];
    }

    // Move node to trash
    const trashedNode: FileNode = {
      ...node,
      path: `/.Basurero/${node.name}`,
    };
    if (trashedNode.type === 'folder' && trashedNode.children) {
      const rebasePaths = (children: FileNode[], basePath: string): FileNode[] =>
        children.map(c => ({
          ...c,
          path: `${basePath}/${c.name}`,
          children: c.children ? rebasePaths(c.children, `${basePath}/${c.name}`) : undefined
        }));
      trashedNode.children = rebasePaths(trashedNode.children, trashedNode.path);
    }

    // Remove from original location
    updatedFS = deleteFileFromTree(updatedFS, node.path);
    // Add to trash
    updatedFS = addFileToTree(updatedFS, trashedNode, '/.Basurero');
    updateFileSystem(updatedFS);

    // Close tabs
    if (onFileDelete) {
      if (node.type === 'file') {
        onFileDelete(node.path);
      } else if (node.type === 'folder' && node.children) {
        const closeFolderFiles = (children: FileNode[]) => {
          children.forEach(c => {
            if (c.type === 'file') onFileDelete(c.path);
            else if (c.children) closeFolderFiles(c.children);
          });
        };
        closeFolderFiles(node.children);
      }
    }
    toast({ title: "Movido al Basurero", description: node.name });
  };

  // === OPEN WITH specific tool ===
  const isImageFile = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tga', 'dds'].includes(ext);
  };

  const isCodeFile = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['js', 'ts', 'jsx', 'tsx', 'c', 'cpp', 'h', 'hpp', 's', 'asm', 'py', 'lua', 'sh', 'json', 'xml', 'html', 'css', 'glsl', 'vert', 'frag', 'vcl', 'dsm', 'md', 'txt', 'yaml', 'yml', 'ini', 'cfg', 'cnf', 'mak', 'ld', 'toml'].includes(ext);
  };

  const isAudioFile = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['mp3', 'wav', 'ogg', 'flac', 'aac', 'adp'].includes(ext);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      return newSet;
    });
  };

  const getFileIcon = (file: FileNode, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    
    if (file.type === 'folder') {
      // Special folder icons based on folder name
      const folderName = file.name.toLowerCase();
      if (folderName === 'src' || folderName === 'source') {
        return <FolderOpen className={`${sizeClass} text-blue-400`} />;
      }
      if (folderName === 'node_modules' || folderName === 'vendor') {
        return <Folder className={`${sizeClass} text-yellow-600/70`} />;
      }
      if (folderName === 'dist' || folderName === 'build' || folderName === 'out') {
        return <FolderOpen className={`${sizeClass} text-green-500`} />;
      }
      if (folderName === 'test' || folderName === 'tests' || folderName === '__tests__') {
        return <FolderOpen className={`${sizeClass} text-yellow-400`} />;
      }
      if (folderName === 'public' || folderName === 'static' || folderName === 'assets') {
        return <FolderOpen className={`${sizeClass} text-purple-400`} />;
      }
      if (folderName === '.git' || folderName === '.github') {
        return <FolderOpen className={`${sizeClass} text-orange-400`} />;
      }
      if (folderName === 'components' || folderName === 'ui') {
        return <FolderOpen className={`${sizeClass} text-cyan-400`} />;
      }
      if (folderName === 'hooks' || folderName === 'utils' || folderName === 'lib') {
        return <FolderOpen className={`${sizeClass} text-pink-400`} />;
      }
      if (folderName === 'api' || folderName === 'services') {
        return <FolderOpen className={`${sizeClass} text-emerald-400`} />;
      }
      if (folderName === 'types' || folderName === 'interfaces') {
        return <FolderOpen className={`${sizeClass} text-indigo-400`} />;
      }
      if (folderName === 'config' || folderName === 'configs') {
        return <FolderOpen className={`${sizeClass} text-gray-400`} />;
      }
      if (folderName === 'docs' || folderName === 'documentation') {
        return <FolderOpen className={`${sizeClass} text-blue-300`} />;
      }
      return <FolderOpen className={`${sizeClass} text-ps2-blue`} />;
    }
    
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // === SPECIAL FILES (by full name) ===
    // Git files
    if (fileName === '.gitignore') {
      return <GitBranch className={`${sizeClass} text-orange-400`} />;
    }
    if (fileName === '.gitattributes' || fileName === '.gitmodules') {
      return <GitBranch className={`${sizeClass} text-orange-300`} />;
    }
    
    // Build & Config files
    if (fileName === 'makefile' || fileName === 'gnumakefile') {
      return <Wrench className={`${sizeClass} text-orange-500`} />;
    }
    if (fileName === 'cmakelists.txt') {
      return <Wrench className={`${sizeClass} text-green-400`} />;
    }
    if (fileName === 'dockerfile') {
      return <Container className={`${sizeClass} text-blue-400`} />;
    }
    if (fileName === 'docker-compose.yml' || fileName === 'docker-compose.yaml') {
      return <Container className={`${sizeClass} text-blue-300`} />;
    }
    if (fileName === '.dockerignore') {
      return <Container className={`${sizeClass} text-gray-400`} />;
    }
    
    // Package managers
    if (fileName === 'package.json') {
      return <Package className={`${sizeClass} text-green-500`} />;
    }
    if (fileName === 'package-lock.json' || fileName === 'yarn.lock' || fileName === 'pnpm-lock.yaml' || fileName === 'bun.lockb') {
      return <Lock className={`${sizeClass} text-yellow-600`} />;
    }
    if (fileName === 'cargo.toml') {
      return <Package className={`${sizeClass} text-orange-400`} />;
    }
    if (fileName === 'cargo.lock') {
      return <Lock className={`${sizeClass} text-orange-300`} />;
    }
    if (fileName === 'requirements.txt' || fileName === 'pipfile') {
      return <Package className={`${sizeClass} text-blue-400`} />;
    }
    if (fileName === 'gemfile') {
      return <Package className={`${sizeClass} text-red-400`} />;
    }
    if (fileName === 'go.mod' || fileName === 'go.sum') {
      return <Package className={`${sizeClass} text-cyan-400`} />;
    }
    
    // Config files
    if (fileName === 'tsconfig.json' || fileName === 'jsconfig.json') {
      return <Cog className={`${sizeClass} text-blue-400`} />;
    }
    if (fileName === 'vite.config.ts' || fileName === 'vite.config.js') {
      return <Zap className={`${sizeClass} text-purple-400`} />;
    }
    if (fileName === 'webpack.config.js' || fileName === 'webpack.config.ts') {
      return <Box className={`${sizeClass} text-blue-300`} />;
    }
    if (fileName === 'rollup.config.js' || fileName === 'rollup.config.ts') {
      return <Box className={`${sizeClass} text-red-400`} />;
    }
    if (fileName === 'esbuild.config.js' || fileName === 'esbuild.config.ts') {
      return <Zap className={`${sizeClass} text-yellow-400`} />;
    }
    if (fileName === 'babel.config.js' || fileName === '.babelrc') {
      return <Cog className={`${sizeClass} text-yellow-500`} />;
    }
    if (fileName === '.eslintrc' || fileName === '.eslintrc.js' || fileName === '.eslintrc.json' || fileName === 'eslint.config.js') {
      return <Shield className={`${sizeClass} text-purple-400`} />;
    }
    if (fileName === '.prettierrc' || fileName === '.prettierrc.js' || fileName === 'prettier.config.js') {
      return <Palette className={`${sizeClass} text-pink-400`} />;
    }
    if (fileName === 'tailwind.config.js' || fileName === 'tailwind.config.ts') {
      return <Palette className={`${sizeClass} text-cyan-400`} />;
    }
    if (fileName === 'postcss.config.js' || fileName === 'postcss.config.cjs') {
      return <Cog className={`${sizeClass} text-red-400`} />;
    }
    if (fileName === '.editorconfig') {
      return <Settings className={`${sizeClass} text-gray-400`} />;
    }
    if (fileName === '.env' || fileName.startsWith('.env.')) {
      return <Key className={`${sizeClass} text-yellow-400`} />;
    }
    if (fileName === '.npmrc' || fileName === '.yarnrc') {
      return <Settings className={`${sizeClass} text-red-400`} />;
    }
    
    // Documentation
    if (fileName === 'readme.md' || fileName === 'readme') {
      return <BookOpen className={`${sizeClass} text-blue-400`} />;
    }
    if (fileName === 'license' || fileName === 'license.md' || fileName === 'license.txt') {
      return <Scroll className={`${sizeClass} text-yellow-400`} />;
    }
    if (fileName === 'changelog.md' || fileName === 'history.md') {
      return <History className={`${sizeClass} text-green-400`} />;
    }
    if (fileName === 'contributing.md') {
      return <MessageSquare className={`${sizeClass} text-purple-400`} />;
    }
    
    // CI/CD
    if (fileName === '.travis.yml') {
      return <Cloud className={`${sizeClass} text-red-400`} />;
    }
    if (fileName === 'jenkinsfile') {
      return <Server className={`${sizeClass} text-red-500`} />;
    }
    
    // Test files
    if (fileName.includes('.test.') || fileName.includes('.spec.') || fileName.includes('_test.')) {
      return <TestTube className={`${sizeClass} text-green-400`} />;
    }

    // === BY EXTENSION ===
    switch (extension) {
      // JavaScript/TypeScript
      case 'js':
        return <FileCode className={`${sizeClass} text-yellow-400`} />;
      case 'jsx':
        return <FileCode className={`${sizeClass} text-cyan-400`} />;
      case 'ts':
        return <FileCode className={`${sizeClass} text-blue-400`} />;
      case 'tsx':
        return <FileCode className={`${sizeClass} text-blue-500`} />;
      case 'mjs':
      case 'cjs':
        return <FileCode className={`${sizeClass} text-yellow-300`} />;
      
      // C/C++ Family (PS2 Development)
      case 'c':
        return <Code2 className={`${sizeClass} text-blue-500`} />;
      case 'cpp':
      case 'cc':
      case 'cxx':
        return <Code2 className={`${sizeClass} text-pink-500`} />;
      case 'h':
        return <Hash className={`${sizeClass} text-purple-400`} />;
      case 'hpp':
      case 'hxx':
        return <Hash className={`${sizeClass} text-pink-400`} />;
      
      // Assembly (PS2)
      case 's':
      case 'asm':
        return <Cpu className={`${sizeClass} text-red-400`} />;
      
      // Other Programming Languages
      case 'py':
        return <FileCode className={`${sizeClass} text-yellow-500`} />;
      case 'rb':
        return <FileCode className={`${sizeClass} text-red-500`} />;
      case 'go':
        return <FileCode className={`${sizeClass} text-cyan-400`} />;
      case 'rs':
        return <FileCode className={`${sizeClass} text-orange-400`} />;
      case 'java':
        return <FileCode className={`${sizeClass} text-red-400`} />;
      case 'kt':
      case 'kts':
        return <FileCode className={`${sizeClass} text-purple-500`} />;
      case 'swift':
        return <FileCode className={`${sizeClass} text-orange-500`} />;
      case 'php':
        return <FileCode className={`${sizeClass} text-indigo-400`} />;
      case 'lua':
        return <FileCode className={`${sizeClass} text-blue-600`} />;
      case 'sh':
      case 'bash':
      case 'zsh':
        return <Terminal className={`${sizeClass} text-green-400`} />;
      case 'ps1':
      case 'psm1':
        return <Terminal className={`${sizeClass} text-blue-400`} />;
      case 'bat':
      case 'cmd':
        return <Terminal className={`${sizeClass} text-gray-400`} />;
      
      // Data & Config
      case 'json':
        return <Braces className={`${sizeClass} text-yellow-500`} />;
      case 'json5':
        return <Braces className={`${sizeClass} text-yellow-400`} />;
      case 'yaml':
      case 'yml':
        return <FileText className={`${sizeClass} text-red-400`} />;
      case 'toml':
        return <FileText className={`${sizeClass} text-gray-400`} />;
      case 'xml':
        return <FileCode className={`${sizeClass} text-orange-400`} />;
      case 'ini':
      case 'cfg':
      case 'conf':
        return <Settings className={`${sizeClass} text-gray-400`} />;
      case 'env':
        return <Key className={`${sizeClass} text-yellow-400`} />;
      
      // Web
      case 'html':
      case 'htm':
        return <Globe className={`${sizeClass} text-orange-500`} />;
      case 'css':
        return <Palette className={`${sizeClass} text-blue-500`} />;
      case 'scss':
      case 'sass':
        return <Palette className={`${sizeClass} text-pink-400`} />;
      case 'less':
        return <Palette className={`${sizeClass} text-indigo-400`} />;
      case 'vue':
        return <FileCode className={`${sizeClass} text-green-500`} />;
      case 'svelte':
        return <FileCode className={`${sizeClass} text-orange-500`} />;
      
      // Documentation
      case 'md':
      case 'mdx':
        return <BookOpen className={`${sizeClass} text-blue-300`} />;
      case 'txt':
        return <FileText className={`${sizeClass} text-gray-400`} />;
      case 'rst':
        return <FileText className={`${sizeClass} text-gray-500`} />;
      case 'pdf':
        return <FileText className={`${sizeClass} text-red-500`} />;
      case 'doc':
      case 'docx':
        return <FileText className={`${sizeClass} text-blue-500`} />;
      
      // Images
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'bmp':
      case 'webp':
        return <ImageIcon className={`${sizeClass} text-green-400`} />;
      case 'svg':
        return <ImageIcon className={`${sizeClass} text-orange-400`} />;
      case 'ico':
        return <ImageIcon className={`${sizeClass} text-yellow-400`} />;
      case 'psd':
        return <ImageIcon className={`${sizeClass} text-blue-400`} />;
      case 'ai':
        return <ImageIcon className={`${sizeClass} text-orange-500`} />;
      
      // Fonts
      case 'ttf':
      case 'otf':
      case 'woff':
      case 'woff2':
      case 'eot':
        return <Type className={`${sizeClass} text-red-400`} />;
      
      // Audio
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'flac':
      case 'aac':
      case 'm4a':
        return <Music className={`${sizeClass} text-pink-400`} />;
      
      // Video
      case 'mp4':
      case 'webm':
      case 'avi':
      case 'mov':
      case 'mkv':
        return <FileVideo className={`${sizeClass} text-purple-400`} />;
      
      // Archives
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
      case 'bz2':
      case 'xz':
        return <FileArchive className={`${sizeClass} text-yellow-500`} />;
      
      // Database
      case 'sql':
        return <Database className={`${sizeClass} text-blue-400`} />;
      case 'sqlite':
      case 'db':
        return <Database className={`${sizeClass} text-green-400`} />;
      case 'csv':
        return <FileSpreadsheet className={`${sizeClass} text-green-500`} />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className={`${sizeClass} text-green-600`} />;
      
      // Shaders (PS2 & Graphics)
      case 'glsl':
      case 'vert':
      case 'frag':
      case 'hlsl':
      case 'shader':
        return <Layers className={`${sizeClass} text-purple-500`} />;
      case 'vcl':  // PS2 VU microcode (VCL preprocessor)
      case 'vsm':  // PS2 VU Shader Microcode (Vector Unit assembly)
      case 'dsm':  // PS2 VIF/DMA microcode
        return <Cpu className={`${sizeClass} text-fuchsia-500`} />;
      case 'vu':   // Raw VU assembly
      case 'vum':  // VU microprogram
        return <Cpu className={`${sizeClass} text-violet-400`} />;
      
      // PS2 Specific
      case 'elf':
        return <Cpu className={`${sizeClass} text-green-500`} />;
      case 'irx':
        return <Puzzle className={`${sizeClass} text-blue-400`} />;
      case 'cnf':
        return <Settings className={`${sizeClass} text-cyan-400`} />;
      case 'bup':
      case 'psu':
        return <Database className={`${sizeClass} text-orange-400`} />;
      case 'iso':
      case 'bin':
      case 'cue':
        return <Binary className={`${sizeClass} text-gray-500`} />;
      
      // Object/Binary files
      case 'o':
      case 'obj':
      case 'a':
      case 'so':
      case 'dll':
      case 'dylib':
        return <Binary className={`${sizeClass} text-gray-400`} />;
      case 'exe':
        return <Zap className={`${sizeClass} text-blue-400`} />;
      
      // Lock files
      case 'lock':
        return <Lock className={`${sizeClass} text-yellow-500`} />;
      
      // Log files
      case 'log':
        return <Scroll className={`${sizeClass} text-gray-500`} />;
      
      // GraphQL
      case 'graphql':
      case 'gql':
        return <Link className={`${sizeClass} text-pink-500`} />;
      
      // Prisma
      case 'prisma':
        return <Database className={`${sizeClass} text-indigo-400`} />;
      
      // Map files
      case 'map':
        return <FileQuestion className={`${sizeClass} text-gray-400`} />;
      
      default:
        return <File className={`${sizeClass} text-muted-foreground`} />;
    }
  };

  const countFiles = (nodes: FileNode[]): { files: number; folders: number } => {
    let files = 0, folders = 0;
    for (const node of nodes) {
      if (node.type === 'file') files++;
      else {
        folders++;
        if (node.children) {
          const counts = countFiles(node.children);
          files += counts.files;
          folders += counts.folders;
        }
      }
    }
    return { files, folders };
  };

  const filterFiles = (nodes: FileNode[], term: string): FileNode[] => {
    if (!term) return nodes;
    return nodes.filter(node => {
      if (node.name.toLowerCase().includes(term.toLowerCase())) return true;
      if (node.type === 'folder' && node.children) {
        return filterFiles(node.children, term).length > 0;
      }
      return false;
    });
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      let workingFS = fileSystem;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await readFileContent(file);
        const newFile: FileNode = {
          name: file.name,
          type: 'file',
          path: selectedFolderPath === '/' ? `/${file.name}` : `${selectedFolderPath}/${file.name}`,
          content
        };
        workingFS = addFileToTree(workingFS, newFile, selectedFolderPath);
      }
      updateFileSystem(workingFS);
      toast({
        title: "Archivos agregados",
        description: `${files.length} archivo(s)`,
      });
    }
  };

  const filteredFiles = filterFiles(fileSystem, searchTerm);
  const { files: totalFiles, folders: totalFolders } = countFiles(fileSystem);

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => {
      const isRenaming = renamingFile?.path === node.path;
      const isSelected = selectedFile?.path === node.path;
      
      return (
        <div key={node.path}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-all group ${
                  isSelected 
                    ? 'bg-ps2-purple/20 text-foreground border-l-2 border-ps2-purple' 
                    : 'hover:bg-accent/50 border-l-2 border-transparent'
                }`}
                style={{ paddingLeft: `${8 + depth * 12}px` }}
                onClick={() => handleFileClick(node)}
              >
                {node.type === 'folder' && (
                  <button className="p-0 h-auto opacity-60 hover:opacity-100 transition-opacity">
                    {expandedFolders.has(node.path) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                )}
                {getFileIcon(node)}
                
                {isRenaming ? (
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(node, renameValue)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(node, renameValue);
                      else if (e.key === 'Escape') setRenamingFile(null);
                    }}
                    className="h-5 text-xs flex-1 px-1 py-0 bg-background"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm truncate flex-1">{node.name}</span>
                )}
                
                {/* Quick actions on hover */}
                <div className="hidden group-hover:flex items-center gap-0.5">
                  {node.type === 'folder' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFolderPath(node.path);
                        setShowNewFileDialog(true);
                      }}
                    >
                      <FilePlus2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent className="w-52 p-0.5 rounded-lg bg-[hsl(var(--background)/0.78)] backdrop-blur-2xl border border-white/[0.10] shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset]">
              
              {/* === ABRIR === */}
              {node.type === 'file' && (
                <>
                  <ContextMenuItem onClick={() => onFileSelect(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                    <ExternalLink className="w-3 h-3 text-blue-400" />
                    Abrir
                  </ContextMenuItem>
                  
                  <ContextMenuSub>
                    <ContextMenuSubTrigger className="gap-2 rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors pl-7">
                      Abrir con
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44 p-0.5 rounded-lg bg-[hsl(var(--background)/0.78)] backdrop-blur-2xl border border-white/[0.10] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                      {isCodeFile(node.name) && (
                        <ContextMenuItem onClick={() => onFileSelect(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10]">
                          <Code2 className="w-3 h-3 text-blue-400" />
                          Editor de Código
                        </ContextMenuItem>
                      )}
                      {node.name.toLowerCase().endsWith('.js') && (
                        <ContextMenuItem
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('athena:open-in-visual-builder', {
                              detail: { path: node.path, name: node.name, content: node.content || '' }
                            }));
                          }}
                          className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10]"
                        >
                          <Layers className="w-3 h-3 text-purple-400" />
                          Visual UI Builder
                        </ContextMenuItem>
                      )}
                      {isImageFile(node.name) && (
                        <ContextMenuItem onClick={() => onFileSelect(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10]">
                          <ImageIcon className="w-3 h-3 text-green-400" />
                          Visor de Imágenes
                        </ContextMenuItem>
                      )}
                      {isAudioFile(node.name) && (
                        <ContextMenuItem onClick={() => onFileSelect(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10]">
                          <Music className="w-3 h-3 text-pink-400" />
                          Reproductor Audio
                        </ContextMenuItem>
                      )}
                      <ContextMenuItem onClick={() => handleShowPreview(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10]">
                        <Eye className="w-3 h-3 text-emerald-400" />
                        Vista Rápida
                      </ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                  
                  <div className="my-0.5 mx-2 h-px bg-white/[0.07]" />
                </>
              )}

              <ContextMenuItem onClick={() => handleMoveToTrash(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                <Trash2 className="w-3 h-3 text-gray-400" />
                Transferir al basurero
              </ContextMenuItem>

              <ContextMenuItem onClick={() => handleDelete(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/[0.10] focus:bg-red-500/[0.12] focus:text-red-400 transition-colors">
                <X className="w-3 h-3" />
                Borrar permanente
                <span className="ml-auto text-[9px] text-red-400/40 font-mono">⌫</span>
              </ContextMenuItem>
              
              <div className="my-0.5 mx-2 h-px bg-white/[0.07]" />

              <ContextMenuItem onClick={() => handleShowInfo(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                <Info className="w-3 h-3 text-blue-400" />
                Obtener información
                <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">⌘I</span>
              </ContextMenuItem>

              <ContextMenuItem onClick={() => { setRenamingFile(node); setRenameValue(node.name); }} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                <Pen className="w-3 h-3 text-gray-400" />
                Renombrar
                <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">F2</span>
              </ContextMenuItem>

              <ContextMenuItem onClick={() => handleCompress(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                <Archive className="w-3 h-3 text-gray-400" />
                Comprimir "{node.name}"
              </ContextMenuItem>

              <ContextMenuItem onClick={() => handleDuplicate(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                <CopyPlus className="w-3 h-3 text-gray-400" />
                Duplicar
              </ContextMenuItem>

              {node.type === 'file' && (
                <ContextMenuItem onClick={() => handleShowPreview(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                  <Eye className="w-3 h-3 text-gray-400" />
                  Vista rápida
                </ContextMenuItem>
              )}
              
              <div className="my-0.5 mx-2 h-px bg-white/[0.07]" />

              <ContextMenuItem onClick={() => handleCopy(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                <Copy className="w-3 h-3 text-gray-400" />
                Copiar
                <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">⌘C</span>
              </ContextMenuItem>
              
              <ContextMenuItem onClick={() => handleCut(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                <Scissors className="w-3 h-3 text-gray-400" />
                Cortar
                <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">⌘X</span>
              </ContextMenuItem>

              {clipboard && (
                <ContextMenuItem onClick={() => handlePasteAt(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                  <ClipboardPaste className="w-3 h-3 text-gray-400" />
                  Pegar
                  <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">⌘V</span>
                </ContextMenuItem>
              )}

              <div className="my-0.5 mx-2 h-px bg-white/[0.07]" />
              
              <ContextMenuItem onClick={() => handleShowHistory(node)} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                <History className="w-3 h-3 text-gray-400" />
                Historial
              </ContextMenuItem>

              {node.type === 'file' && (
                <>
                  <div className="my-0.5 mx-2 h-px bg-white/[0.07]" />
                  <ContextMenuSub>
                    <ContextMenuSubTrigger className="gap-2 rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                      <Sparkles className="w-3 h-3 text-orange-400" />
                      Acciones IA
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-40 p-0.5 rounded-lg bg-[hsl(var(--background)/0.78)] backdrop-blur-2xl border border-white/[0.10] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                      <ContextMenuItem onClick={() => handleAIAction(node, 'consult')} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10]">
                        <MessageSquare className="w-3 h-3 text-green-400" />
                        Consultar
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleAIAction(node, 'analyze')} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10]">
                        <Sparkles className="w-3 h-3 text-orange-400" />
                        Analizar
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleAIAction(node, 'improve')} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10]">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        Mejorar
                      </ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </>
              )}

              {node.type === 'folder' && (
                <>
                  <div className="my-0.5 mx-2 h-px bg-white/[0.07]" />
                  <ContextMenuItem onClick={(e) => { e.stopPropagation(); setSelectedFolderPath(node.path); setShowNewFileDialog(true); }} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                    <FilePlus2 className="w-3 h-3 text-cyan-400" />
                    Nuevo archivo
                  </ContextMenuItem>
                  <ContextMenuItem onClick={(e) => { e.stopPropagation(); setSelectedFolderPath(node.path); setShowNewFolderDialog(true); }} className="gap-2 cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/[0.08] focus:bg-white/[0.10] transition-colors">
                    <FolderPlus className="w-3 h-3 text-orange-400" />
                    Nueva carpeta
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
          
          {node.type === 'folder' && 
           expandedFolders.has(node.path) && 
           node.children && 
           renderFileTree(node.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <Card 
      className={`h-full flex flex-col ide-sidebar overflow-hidden transition-all ${
        isDragging ? 'ring-2 ring-ps2-purple ring-inset' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-2 border-b border-border bg-gradient-to-r from-background to-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explorer</h3>
          <div className="flex gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowNewFileDialog(true)} className="gap-2">
                  <File className="w-4 h-4" />
                  Nuevo Archivo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)} className="gap-2">
                  <FolderPlus className="w-4 h-4" />
                  Nueva Carpeta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowQuickCreate(true)} className="gap-2">
                  <Sparkles className="w-4 h-4 text-ps2-purple" />
                  Creación Rápida
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-44 p-1 rounded-lg border border-white/10 bg-popover/95 backdrop-blur-xl shadow-2xl"
              >
                <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Proyecto
                </div>
                <DropdownMenuItem
                  onClick={handleFolderImport}
                  className="gap-2 h-7 px-2 text-[11px] rounded-md cursor-pointer focus:bg-white/[0.07]"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  Importar carpeta
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleFilesImport}
                  className="gap-2 h-7 px-2 text-[11px] rounded-md cursor-pointer focus:bg-white/[0.07]"
                >
                  <FilePlus2 className="w-3.5 h-3.5 text-emerald-400" />
                  Importar archivos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportProject}
                  disabled={fileSystem.length === 0}
                  className="gap-2 h-7 px-2 text-[11px] rounded-md cursor-pointer focus:bg-white/[0.07]"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  Exportar .zip
                </DropdownMenuItem>
                <div className="my-1 h-px bg-white/[0.06]" />
                <DropdownMenuItem
                  onClick={() => setShowClearConfirm(true)}
                  disabled={fileSystem.length === 0}
                  className="gap-2 h-7 px-2 text-[11px] rounded-md cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar proyecto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar archivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 pl-7 text-xs bg-background/50"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Create Panel - PS2 Development Templates */}
      {showQuickCreate && (
        <div className="border-b border-border bg-gradient-to-b from-muted/50 to-background animate-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-ps2-purple to-ps2-cyan flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold">Creación Rápida</span>
                <p className="text-[10px] text-muted-foreground">Plantillas PS2 Development</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-destructive/20" onClick={() => setShowQuickCreate(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Category Tabs */}
          <ScrollArea className="w-full">
            <div className="flex gap-1 p-2 pb-1">
              {templateCategories.map(cat => (
                <Button
                  key={cat.id}
                  variant={quickCreateCategory === cat.id ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 px-2 text-xs shrink-0 gap-1.5 ${
                    quickCreateCategory === cat.id 
                      ? 'bg-ps2-purple hover:bg-ps2-purple/90' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setQuickCreateCategory(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Templates Grid */}
          <div className="p-2 pt-1">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {templateCategories
                .find(c => c.id === quickCreateCategory)
                ?.templates.map(ext => {
                  const template = fileTemplates[ext];
                  return (
                    <Button
                      key={ext}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 px-2 flex flex-col items-center gap-1 hover:bg-ps2-purple/10 hover:border-ps2-purple/50 transition-all group"
                      onClick={() => handleQuickCreateFile(ext)}
                    >
                      <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center group-hover:bg-ps2-purple/20 transition-colors">
                        <span className="text-lg font-mono font-bold text-muted-foreground group-hover:text-ps2-purple">
                          {ext === 'cpp' ? 'C++' : ext === 'hpp' ? 'H++' : ext.toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-medium">.{ext}</span>
                        <p className="text-[8px] text-muted-foreground truncate max-w-[60px]">
                          {template?.description || ext}
                        </p>
                      </div>
                    </Button>
                  );
                })}
            </div>
          </div>

          {/* Info Footer */}
          <div className="px-2 pb-2">
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30 text-[10px] text-muted-foreground">
              <Info className="w-3 h-3 shrink-0" />
              <span>Carpeta destino: <code className="text-ps2-cyan">{selectedFolderPath}</code></span>
            </div>
          </div>
        </div>
      )}

      {/* New File Dialog Inline */}
      {showNewFileDialog && (
        <div className="p-2 border-b border-border bg-muted/30 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2">
            <File className="w-4 h-4 text-ps2-cyan" />
            <span className="text-xs font-medium">Nuevo Archivo</span>
          </div>
          <div className="flex gap-1">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="nombre.extensión"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') { setShowNewFileDialog(false); setNewFileName(''); }
              }}
              autoFocus
            />
            <Button size="sm" className="h-7 px-2" onClick={handleCreateFile}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setShowNewFileDialog(false); setNewFileName(''); }}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Carpeta: {selectedFolderPath}
          </p>
        </div>
      )}

      {/* New Folder Dialog Inline */}
      {showNewFolderDialog && (
        <div className="p-2 border-b border-border bg-muted/30 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2">
            <FolderPlus className="w-4 h-4 text-ps2-blue" />
            <span className="text-xs font-medium">Nueva Carpeta</span>
          </div>
          <div className="flex gap-1">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="nombre-carpeta"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') { setShowNewFolderDialog(false); setNewFolderName(''); }
              }}
              autoFocus
            />
            <Button size="sm" className="h-7 px-2" onClick={handleCreateFolder}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setShowNewFolderDialog(false); setNewFolderName(''); }}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {fileSystem.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ps2-purple/20 to-ps2-cyan/20 flex items-center justify-center mb-3 border border-ps2-purple/30">
                <FolderOpen className="w-8 h-8 text-ps2-purple/70" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Sin proyecto</p>
              <p className="text-xs text-muted-foreground mb-4">
                Clona un repositorio, importa o crea archivos
              </p>
              <div className="flex flex-col gap-2 w-full max-w-[180px]">
                <Button 
                  size="sm" 
                  className="gap-2 bg-gradient-to-r from-ps2-purple to-ps2-cyan hover:from-ps2-purple/90 hover:to-ps2-cyan/90 text-white" 
                  onClick={onCloneRepository}
                >
                  <GitBranch className="w-3 h-3" />
                  Clonar Repositorio
                </Button>
                <Button size="sm" variant="outline" className="gap-2 border-ps2-purple/30 hover:border-ps2-purple/50 hover:bg-ps2-purple/10" onClick={handleFolderImport}>
                  <Upload className="w-3 h-3" />
                  Importar Proyecto
                </Button>
                <Button size="sm" variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => setShowNewFileDialog(true)}>
                  <Plus className="w-3 h-3" />
                  Crear Archivo
                </Button>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <SearchX className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Sin resultados</p>
            </div>
          ) : (
            renderFileTree(filteredFiles)
          )}
        </div>
      </ScrollArea>

      {/* Footer Status */}
      {fileSystem.length > 0 && (
        <div className="p-2 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{totalFiles} archivos, {totalFolders} carpetas</span>
            {clipboard && (
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {clipboard.operation === 'copy' ? 'Copiado' : 'Cortado'}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-ps2-purple/10 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center">
            <Upload className="w-12 h-12 text-ps2-purple mx-auto mb-2" />
            <p className="text-sm font-medium">Soltar archivos aquí</p>
          </div>
        </div>
      )}

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {contextMenuFile && getFileIcon(contextMenuFile, 'md')}
              {contextMenuFile?.name}
            </DialogTitle>
            <DialogDescription>Información del archivo</DialogDescription>
          </DialogHeader>
          {fileMetadata && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Tipo</span>
                <span>{fileMetadata.type.toUpperCase() || 'Desconocido'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Tamaño</span>
                <span>{formatBytes(fileMetadata.size)}</span>
              </div>
              {fileMetadata.lines !== undefined && (
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Líneas</span>
                  <span>{fileMetadata.lines}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Codificación</span>
                <span>{fileMetadata.encoding}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Ruta</span>
                <span className="text-xs truncate max-w-[150px]">{contextMenuFile?.path}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-ps2-purple" />
              Historial
            </DialogTitle>
            <DialogDescription>{contextMenuFile?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {fileHistory.map((entry, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-ps2-purple/20 flex items-center justify-center">
                  {entry.user === 'IA Developer' ? (
                    <Sparkles className="w-4 h-4 text-ps2-purple" />
                  ) : (
                    <Edit3 className="w-4 h-4 text-ps2-cyan" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.user} • {entry.timestamp.toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{formatBytes(entry.size)}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {contextMenuFile && getFileIcon(contextMenuFile, 'md')}
              {contextMenuFile?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/30">
            {contextMenuFile?.content?.startsWith('data:image') ? (
              <img src={contextMenuFile.content} alt={contextMenuFile.name} className="max-w-full h-auto" />
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap">{contextMenuFile?.content || 'Sin contenido'}</pre>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Clear Project Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="border-white/10 bg-popover/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Limpiar proyecto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Se eliminarán <strong>todos los archivos y carpetas</strong> del explorador y se cerrarán todas las pestañas abiertas.
              <br />
              Esta acción <strong>no se puede deshacer</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setFileSystem([]);
                updateFileSystem([]);
                onProjectClear?.();
                setShowClearConfirm(false);
                toast({ title: 'Proyecto limpiado', description: 'Se eliminaron todos los archivos y se cerraron las pestañas.' });
              }}
              className="h-8 text-xs bg-destructive hover:bg-destructive/90"
            >
              Sí, limpiar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
