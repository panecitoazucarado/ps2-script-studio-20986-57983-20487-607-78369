import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code2,
  FileCode,
  Cpu,
  Layers,
  Cog,
  FileText,
  Database,
  Zap,
  Box,
  Search,
  Plus,
  FolderOpen,
  Sparkles,
  Terminal,
  Binary,
  Braces,
  Hash,
  Palette,
  Globe,
  Server,
  Shield,
  BookOpen,
  FileArchive,
  Wrench,
  X,
  Check,
  Info,
  ChevronRight
} from 'lucide-react';

interface QuickCreateTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFile: (extension: string, content: string) => void;
  targetFolder: string;
}

interface FileTemplate {
  extension: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  content: string;
  tags: string[];
}

interface TemplateCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  templates: FileTemplate[];
}

const templateCategories: TemplateCategory[] = [
  {
    id: 'ps2-native',
    name: 'PS2 Nativo',
    icon: <Cpu className="w-4 h-4" />,
    description: 'Archivos nativos para desarrollo PS2',
    templates: [
      {
        extension: 'c',
        name: 'C Source',
        description: 'Código fuente C para PS2 con PS2SDK',
        icon: <Code2 className="w-5 h-5" />,
        iconBg: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        tags: ['PS2SDK', 'EE Core', 'Native'],
        content: `/*
 * ATHENA ENV - PlayStation 2 Development
 * C Source File
 * 
 * Target: EE Core (Emotion Engine)
 * Compiler: ee-gcc
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <kernel.h>
#include <sifrpc.h>
#include <loadfile.h>
#include <tamtypes.h>
#include <graph.h>

// PS2 Hardware registers
#define GS_CSR     ((volatile u64*)0x12001000)
#define GS_BGCOLOR ((volatile u64*)0x120000E0)

int main(int argc, char *argv[])
{
    // Initialize SIF (Sub-system Interface)
    SifInitRpc(0);
    
    printf("ATHENA ENV - PS2 Application Started\\n");
    
    // Main loop
    while(1) {
        // Update logic
        
        // Render
        
        // VSync
        graph_wait_vsync();
    }
    
    return 0;
}
`
      },
      {
        extension: 'cpp',
        name: 'C++ Source',
        description: 'Código fuente C++ orientado a objetos para PS2',
        icon: <Code2 className="w-5 h-5" />,
        iconBg: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
        tags: ['PS2SDK', 'OOP', 'EE Core'],
        content: `/*
 * ATHENA ENV - PlayStation 2 Development
 * C++ Source File
 * 
 * Target: EE Core (Emotion Engine)
 * Compiler: ee-g++
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <kernel.h>
#include <sifrpc.h>
#include <tamtypes.h>

#include <iostream>

class PS2Application {
public:
    PS2Application() : m_running(true), m_frameCount(0) {
        init();
    }
    
    ~PS2Application() {
        shutdown();
    }
    
    void run() {
        std::cout << "ATHENA ENV - PS2 Application Running" << std::endl;
        
        while(m_running) {
            update();
            render();
            m_frameCount++;
        }
    }
    
private:
    bool m_running;
    u32 m_frameCount;
    
    void init() {
        SifInitRpc(0);
        std::cout << "PS2 Application Initialized" << std::endl;
    }
    
    void shutdown() {
        std::cout << "PS2 Application Shutdown" << std::endl;
    }
    
    void update() {
        // Update game logic
    }
    
    void render() {
        // Render graphics
    }
};

int main(int argc, char *argv[])
{
    PS2Application app;
    app.run();
    return 0;
}
`
      },
      {
        extension: 'h',
        name: 'C Header',
        description: 'Header C con definiciones y prototipos',
        icon: <Braces className="w-5 h-5" />,
        iconBg: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30',
        tags: ['Header', 'Declarations', 'Types'],
        content: `/*
 * ATHENA ENV - PlayStation 2 Development
 * C Header File
 */

#ifndef _MODULE_H_
#define _MODULE_H_

#include <tamtypes.h>

#ifdef __cplusplus
extern "C" {
#endif

/*===========================================================================*/
/* Type Definitions                                                           */
/*===========================================================================*/

typedef unsigned int   u32;
typedef unsigned short u16;
typedef unsigned char  u8;
typedef signed int     s32;
typedef signed short   s16;
typedef signed char    s8;

typedef float          f32;
typedef double         f64;

/*===========================================================================*/
/* Constants                                                                  */
/*===========================================================================*/

#define MODULE_VERSION_MAJOR    1
#define MODULE_VERSION_MINOR    0
#define MODULE_VERSION_PATCH    0

/*===========================================================================*/
/* Structures                                                                 */
/*===========================================================================*/

typedef struct {
    s32 x, y, z;
} Vec3i;

typedef struct {
    f32 x, y, z;
} Vec3f;

typedef struct {
    f32 x, y, z, w;
} Vec4f;

/*===========================================================================*/
/* Function Prototypes                                                        */
/*===========================================================================*/

int  module_init(void);
void module_shutdown(void);
void module_update(void);

/*===========================================================================*/

#ifdef __cplusplus
}
#endif

#endif /* _MODULE_H_ */
`
      },
      {
        extension: 'hpp',
        name: 'C++ Header',
        description: 'Header C++ con clases y templates',
        icon: <Braces className="w-5 h-5" />,
        iconBg: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
        tags: ['Header', 'Classes', 'Templates'],
        content: `/*
 * ATHENA ENV - PlayStation 2 Development
 * C++ Header File
 */

#ifndef _MODULE_HPP_
#define _MODULE_HPP_

#include <tamtypes.h>

/*===========================================================================*/
/* PS2 Component Base Class                                                   */
/*===========================================================================*/

class IPS2Component {
public:
    virtual ~IPS2Component() = default;
    
    virtual bool init() = 0;
    virtual void shutdown() = 0;
    virtual void update(float deltaTime) = 0;
    virtual void render() = 0;
    
    virtual const char* getName() const = 0;
};

/*===========================================================================*/
/* PS2 Module Implementation                                                  */
/*===========================================================================*/

class PS2Module : public IPS2Component {
public:
    PS2Module();
    virtual ~PS2Module();
    
    // IPS2Component interface
    bool init() override;
    void shutdown() override;
    void update(float deltaTime) override;
    void render() override;
    const char* getName() const override { return "PS2Module"; }
    
    // Module-specific methods
    bool isInitialized() const { return m_initialized; }
    u32  getFrameCount() const { return m_frameCount; }
    
protected:
    bool m_initialized;
    u32  m_frameCount;
    
private:
    void processInput();
    void updateLogic(float dt);
    void renderScene();
};

/*===========================================================================*/
/* Template Utilities                                                         */
/*===========================================================================*/

template<typename T>
class PS2Ptr {
public:
    PS2Ptr() : m_ptr(nullptr) {}
    explicit PS2Ptr(T* ptr) : m_ptr(ptr) {}
    ~PS2Ptr() { delete m_ptr; }
    
    T* get() const { return m_ptr; }
    T& operator*() const { return *m_ptr; }
    T* operator->() const { return m_ptr; }
    
private:
    T* m_ptr;
};

#endif /* _MODULE_HPP_ */
`
      }
    ]
  },
  {
    id: 'ps2-asm',
    name: 'Ensamblador',
    icon: <Binary className="w-4 h-4" />,
    description: 'Código ensamblador para EE, IOP y VU',
    templates: [
      {
        extension: 's',
        name: 'MIPS Assembly',
        description: 'Ensamblador MIPS R5900 para EE Core',
        icon: <Cpu className="w-5 h-5" />,
        iconBg: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        tags: ['EE Core', 'R5900', 'MIPS'],
        content: `# ATHENA ENV - PlayStation 2 Development
# MIPS R5900 Assembly (EE Core)
#
# Registers:
#   $zero (r0)  - Always zero
#   $at   (r1)  - Assembler temporary
#   $v0-$v1     - Return values
#   $a0-$a3     - Function arguments
#   $t0-$t9     - Temporaries
#   $s0-$s7     - Saved registers
#   $sp   (r29) - Stack pointer
#   $ra   (r31) - Return address

.set noreorder
.set noat

.global _start
.global main

#===========================================================================
# Text Section (Code)
#===========================================================================
.section .text

_start:
    # Initialize stack pointer
    la      $sp, _stack_end
    
    # Clear BSS section
    la      $a0, _bss_start
    la      $a1, _bss_end
    
.clear_bss:
    beq     $a0, $a1, .bss_done
    nop
    sw      $zero, 0($a0)
    addiu   $a0, $a0, 4
    j       .clear_bss
    nop
    
.bss_done:
    # Call main function
    jal     main
    nop
    
    # Exit syscall
    li      $v0, 0x04
    syscall

#===========================================================================
# Data Section
#===========================================================================
.section .data

msg_hello:
    .asciiz "Hello from EE Core Assembly!"

#===========================================================================
# BSS Section (Uninitialized Data)
#===========================================================================
.section .bss

buffer:
    .space 1024
`
      },
      {
        extension: 'asm',
        name: 'IOP Assembly',
        description: 'Ensamblador MIPS R3000 para IOP',
        icon: <Terminal className="w-5 h-5" />,
        iconBg: 'from-orange-500/20 to-amber-500/20 border-orange-500/30',
        tags: ['IOP', 'R3000', 'Drivers'],
        content: `; ATHENA ENV - PlayStation 2 Development
; IOP Assembly File (MIPS R3000)
;
; The IOP (I/O Processor) handles:
;   - CD/DVD access
;   - Memory card operations
;   - Controller/Pad input
;   - Sound processing (SPU2)
;   - USB/Network

.set noreorder

.global _start
.global iop_main

;===========================================================================
; Text Section
;===========================================================================
.section .text

_start:
    ; IOP initialization
    nop
    nop
    
    ; Jump to main
    jal     iop_main
    nop
    
    ; Return
    jr      $ra
    nop

iop_main:
    ; Save return address
    addiu   $sp, $sp, -16
    sw      $ra, 0($sp)
    
    ; IOP module code here
    nop
    
    ; Restore and return
    lw      $ra, 0($sp)
    addiu   $sp, $sp, 16
    jr      $ra
    nop

;===========================================================================
; Data Section
;===========================================================================
.section .data

module_name:
    .asciiz "ATHENA_IOP_MODULE"
    
module_version:
    .word   0x00010000  ; v1.0.0

;===========================================================================
; BSS Section
;===========================================================================
.section .bss

iop_buffer:
    .space  256
`
      },
      {
        extension: 'vcl',
        name: 'VU1 Microcode',
        description: 'Código VU1 para transformaciones 3D',
        icon: <Layers className="w-5 h-5" />,
        iconBg: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
        tags: ['VU1', 'Vector', '3D Graphics'],
        content: `; ATHENA ENV - PlayStation 2 Development
; VU1 Microcode (Vector Unit 1)
;
; VU1 is used for:
;   - Vertex transformations
;   - Lighting calculations
;   - Clipping
;   - Perspective projection

.syntax new
.name VU1_Transform
.vu
.init_vf_all
.init_vi_all

;===========================================================================
; Constants
;===========================================================================
; VF00 = (0, 0, 0, 1) - Always
; VI00 = 0 - Always

;===========================================================================
; Entry Point
;===========================================================================
--enter
--endenter

START:
    ; Load transformation matrix from VU1 memory
    ; VF01-VF04 = Model-View-Projection Matrix
    LQ.xyzw     VF01, 0(VI00)
    LQ.xyzw     VF02, 1(VI00)
    LQ.xyzw     VF03, 2(VI00)
    LQ.xyzw     VF04, 3(VI00)
    
    ; Load vertex count
    IADDIU      VI02, VI00, 256     ; Max vertices
    IADDIU      VI01, VI00, 0       ; Current vertex
    
TRANSFORM_LOOP:
    ; Load vertex position (VF05)
    LQ.xyzw     VF05, 4(VI01)
    
    ; Matrix * Vertex transformation
    MULAx.xyzw  ACC, VF01, VF05x    ; ACC = M.col0 * V.x
    MADDAy.xyzw ACC, VF02, VF05y    ; ACC += M.col1 * V.y
    MADDAz.xyzw ACC, VF03, VF05z    ; ACC += M.col2 * V.z
    MADDw.xyzw  VF06, VF04, VF05w   ; VF06 = ACC + M.col3 * V.w
    
    ; Perspective divide
    DIV         Q, VF00w, VF06w     ; Q = 1 / W
    WAITQ
    MULq.xyz    VF06, VF06, Q       ; Divide X,Y,Z by W
    
    ; Store transformed vertex
    SQ.xyzw     VF06, 260(VI01)
    
    ; Next vertex
    IADDIU      VI01, VI01, 1
    IBNE        VI01, VI02, TRANSFORM_LOOP
    NOP

;===========================================================================
; Exit
;===========================================================================
--exit
--endexit
`
      },
      {
        extension: 'dsm',
        name: 'DMA Script',
        description: 'Script DMA/GIF para transferencias',
        icon: <Zap className="w-5 h-5" />,
        iconBg: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
        tags: ['DMA', 'GIF', 'Transfer'],
        content: `; ATHENA ENV - PlayStation 2 Development
; DMA/GIF Script
;
; DMA Channels:
;   - VIF0 (Channel 0): VU0 data
;   - VIF1 (Channel 1): VU1 data
;   - GIF  (Channel 2): GS primitives
;   - IPU  (Channel 3): Image Processing
;   - SIF0 (Channel 5): IOP -> EE
;   - SIF1 (Channel 6): EE -> IOP
;   - SPR  (Channel 8/9): Scratchpad

;===========================================================================
; GIF Tag Definitions
;===========================================================================
; NLOOP: Number of loops (15 bits)
; EOP:   End of packet (1 bit)
; PRE:   Prim field enable (1 bit)
; PRIM:  Primitive type (11 bits)
; FLG:   Data format (2 bits)
; NREG:  Number of registers (4 bits)
; REGS:  Register descriptors (64 bits)

.align 16

;===========================================================================
; GIF Packet: Draw Sprite
;===========================================================================
gif_sprite_packet:
    ; GIF Tag
    .dword  0x0000000000008001  ; NLOOP=1, EOP=1
    .dword  0x0000000000000051  ; REGS: ST, RGBAQ, XYZ2
    
    ; Texture coords (S,T)
    .float  0.0     ; S
    .float  0.0     ; T
    .float  1.0     ; Q (unused)
    .word   0       ; Padding
    
    ; Color (RGBAQ)
    .byte   128     ; R
    .byte   128     ; G
    .byte   128     ; B
    .byte   128     ; A
    .float  1.0     ; Q
    
    ; Position (XYZ2)
    .word   1024    ; X (fixed 12.4)
    .word   1024    ; Y (fixed 12.4)
    .word   0       ; Z
    .word   0       ; ADC flag

;===========================================================================
; VIF Code Definitions
;===========================================================================
; VIF1 Commands:
;   NOP     = 0x00
;   STCYCL  = 0x01 (Set CYCLE register)
;   OFFSET  = 0x02 (Set OFFSET)
;   BASE    = 0x03 (Set BASE)
;   ITOP    = 0x04 (Set ITOP)
;   STMOD   = 0x05 (Set MODE)
;   MSKPATH3= 0x06
;   MARK    = 0x07
;   FLUSH   = 0x10 / 0x11
;   DIRECT  = 0x50 (Send to GIF)
;   UNPACK  = 0x60-0x7F

vif_packet:
    .word   0x01000101  ; STCYCL cl=1, wl=1
    .word   0x00000000  ; NOP
    .word   0x6C000004  ; UNPACK V4-32, 4 qwords
    ; Data follows...
`
      }
    ]
  },
  {
    id: 'config',
    name: 'Configuración',
    icon: <Cog className="w-4 h-4" />,
    description: 'Archivos de configuración del proyecto',
    templates: [
      {
        extension: 'mak',
        name: 'Makefile',
        description: 'Script de compilación PS2SDK',
        icon: <Wrench className="w-5 h-5" />,
        iconBg: 'from-slate-500/20 to-gray-500/20 border-slate-500/30',
        tags: ['Build', 'PS2SDK', 'ee-gcc'],
        content: `# ATHENA ENV - PlayStation 2 Makefile
# PS2SDK Build System

#===========================================================================
# Project Configuration
#===========================================================================
EE_BIN = game.elf
EE_OBJS = main.o graphics.o input.o audio.o

#===========================================================================
# PS2SDK Configuration
#===========================================================================
EE_INCS += -I$(PS2SDK)/ee/include -I$(PS2SDK)/common/include
EE_LDFLAGS += -L$(PS2SDK)/ee/lib
EE_LIBS += -lkernel -ldma -lgraph -lpad -lmc

#===========================================================================
# Compiler Flags
#===========================================================================
EE_CFLAGS += -O2 -G0 -Wall
EE_CXXFLAGS += -O2 -G0 -Wall -fno-exceptions -fno-rtti

#===========================================================================
# Debug Flags (uncomment for debug build)
#===========================================================================
# EE_CFLAGS += -g -DDEBUG
# EE_CXXFLAGS += -g -DDEBUG

#===========================================================================
# Include PS2SDK Rules
#===========================================================================
include $(PS2SDK)/samples/Makefile.pref
include $(PS2SDK)/samples/Makefile.eeglobal

#===========================================================================
# Custom Targets
#===========================================================================
.PHONY: clean run iso

run: $(EE_BIN)
\tps2client -h $(PS2_IP) execee host:$(EE_BIN)

iso: $(EE_BIN)
\tmkisofs -o game.iso $(EE_BIN)

clean:
\trm -f $(EE_OBJS) $(EE_BIN)
`
      },
      {
        extension: 'ld',
        name: 'Linker Script',
        description: 'Script del linker para PS2',
        icon: <FileCode className="w-5 h-5" />,
        iconBg: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
        tags: ['Linker', 'Memory Layout', 'Sections'],
        content: `/* ATHENA ENV - PlayStation 2 Linker Script */

/* PS2 EE Memory Map:
 *   0x00000000 - 0x00100000: Kernel (1MB)
 *   0x00100000 - 0x02000000: User memory (31MB)
 *   0x70000000 - 0x70004000: Scratchpad (16KB)
 *   0x10000000 - 0x12000000: Hardware registers
 */

OUTPUT_FORMAT("elf32-littlemips")
OUTPUT_ARCH(mips:5900)
ENTRY(_start)

MEMORY
{
    /* Main EE RAM */
    ram (rwx) : ORIGIN = 0x00100000, LENGTH = 31M
    
    /* Scratchpad RAM */
    scratchpad (rw) : ORIGIN = 0x70000000, LENGTH = 16K
}

SECTIONS
{
    /* Code section */
    .text : {
        _text_start = .;
        *(.text .text.*)
        *(.gnu.linkonce.t.*)
        _text_end = .;
    } > ram

    /* Read-only data */
    .rodata : {
        *(.rodata .rodata.*)
        *(.gnu.linkonce.r.*)
    } > ram

    /* Initialized data */
    .data : {
        _data_start = .;
        *(.data .data.*)
        *(.gnu.linkonce.d.*)
        _data_end = .;
    } > ram

    /* Uninitialized data (BSS) */
    .bss : {
        _bss_start = .;
        *(.bss .bss.*)
        *(.gnu.linkonce.b.*)
        *(COMMON)
        _bss_end = .;
    } > ram

    /* Stack */
    .stack (NOLOAD) : {
        . = ALIGN(128);
        _stack_start = .;
        . += 0x10000; /* 64KB stack */
        _stack_end = .;
    } > ram

    /* Discard unnecessary sections */
    /DISCARD/ : {
        *(.comment)
        *(.note.*)
    }
}
`
      },
      {
        extension: 'cnf',
        name: 'System Config',
        description: 'Configuración SYSTEM.CNF para PS2',
        icon: <Cog className="w-5 h-5" />,
        iconBg: 'from-gray-500/20 to-zinc-500/20 border-gray-500/30',
        tags: ['Boot', 'System', 'ISO'],
        content: `# ATHENA ENV - PlayStation 2 SYSTEM.CNF
# This file is required for PS2 disc boot

BOOT2 = cdrom0:\\SLXX_XXX.XX;1
VER = 1.00
VMODE = NTSC
`
      },
      {
        extension: 'ini',
        name: 'INI Config',
        description: 'Archivo de configuración INI',
        icon: <FileText className="w-5 h-5" />,
        iconBg: 'from-neutral-500/20 to-stone-500/20 border-neutral-500/30',
        tags: ['Config', 'Settings', 'Parameters'],
        content: `; ATHENA ENV - Configuration File
; PlayStation 2 Project Settings

[Project]
Name=MyPS2Game
Version=1.0.0
Author=Developer
Description=PS2 Homebrew Game

[Display]
Width=640
Height=448
Interlace=true
FieldMode=frame
PAL=false

[Audio]
Enabled=true
SampleRate=48000
Channels=2
Volume=100

[Input]
Port1=controller
Port2=controller
Analog=true
Vibration=true

[Debug]
Enabled=false
LogLevel=info
ShowFPS=false
`
      }
    ]
  },
  {
    id: 'scripts',
    name: 'Scripts',
    icon: <Terminal className="w-4 h-4" />,
    description: 'Scripts de utilidad y automatización',
    templates: [
      {
        extension: 'js',
        name: 'Athena Script',
        description: 'Script JavaScript para Athena ENV',
        icon: <FileCode className="w-5 h-5" />,
        iconBg: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
        tags: ['Athena', 'JavaScript', 'Runtime'],
        content: `// ATHENA ENV - JavaScript Runtime Script
// High-level scripting for PS2 homebrew

// Game Configuration
const config = {
    name: "My PS2 Game",
    author: "Developer",
    version: "1.0.0",
    resolution: { width: 640, height: 448 }
};

// Initialize resources
const font = new Font("default");
let frameCount = 0;
let lastTime = Timer.getTime();

// Color palette
const colors = {
    background: Color.new(0, 32, 64, 255),
    primary: Color.new(128, 0, 255, 255),
    secondary: Color.new(0, 255, 128, 255),
    text: Color.new(255, 255, 255, 255)
};

// Game state
const state = {
    running: true,
    paused: false,
    score: 0
};

// Initialize
function init() {
    console.log(\`Starting \${config.name} v\${config.version}\`);
    Screen.setMode(config.resolution.width, config.resolution.height, 32, Screen.NTSC);
}

// Update game logic
function update(deltaTime) {
    // Handle input
    const pad = Pads.get(0);
    
    if (pad.pressed & Pads.START) {
        state.paused = !state.paused;
    }
    
    if (!state.paused) {
        // Update game logic here
        state.score++;
    }
}

// Render frame
function render() {
    Screen.clear(colors.background);
    
    // Draw title
    font.scale = 2.0;
    font.color = colors.text;
    font.print(50, 50, config.name);
    
    // Draw info
    font.scale = 1.0;
    font.print(50, 100, \`Frame: \${frameCount}\`);
    font.print(50, 120, \`Score: \${state.score}\`);
    
    // Draw shapes
    Draw.rect(200, 200, 100, 100, colors.primary);
    Draw.circle(400, 250, 50, colors.secondary);
    
    if (state.paused) {
        font.scale = 3.0;
        font.print(250, 200, "PAUSED");
    }
    
    Screen.flip();
}

// Main loop
init();

os.setInterval(() => {
    const currentTime = Timer.getTime();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    update(deltaTime);
    render();
    
    frameCount++;
}, 16); // ~60 FPS
`
      },
      {
        extension: 'lua',
        name: 'Lua Script',
        description: 'Script Lua embebido',
        icon: <Globe className="w-5 h-5" />,
        iconBg: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
        tags: ['Lua', 'Scripting', 'Embedded'],
        content: `-- ATHENA ENV - Lua Script
-- Embedded scripting for PS2 homebrew

-- Configuration
local config = {
    title = "PS2 Lua Game",
    version = "1.0.0",
    debug = false
}

-- Game state
local game = {
    running = true,
    score = 0,
    level = 1,
    player = {
        x = 320,
        y = 224,
        speed = 5
    }
}

-- Initialize
function game.init()
    print(string.format("Initializing %s v%s", config.title, config.version))
    -- Load resources
    -- Initialize subsystems
end

-- Update
function game.update(dt)
    -- Handle input
    local pad = Pads.get(0)
    
    if pad:pressed(Pads.LEFT) then
        game.player.x = game.player.x - game.player.speed
    end
    if pad:pressed(Pads.RIGHT) then
        game.player.x = game.player.x + game.player.speed
    end
    if pad:pressed(Pads.UP) then
        game.player.y = game.player.y - game.player.speed
    end
    if pad:pressed(Pads.DOWN) then
        game.player.y = game.player.y + game.player.speed
    end
    
    -- Clamp position
    game.player.x = math.max(0, math.min(640, game.player.x))
    game.player.y = math.max(0, math.min(448, game.player.y))
end

-- Render
function game.render()
    Screen.clear(Color.new(16, 24, 48))
    
    -- Draw player
    Draw.rect(
        game.player.x - 16,
        game.player.y - 16,
        32, 32,
        Color.new(0, 255, 128)
    )
    
    -- Draw UI
    Font.print(10, 10, string.format("Score: %d", game.score))
    Font.print(10, 30, string.format("Level: %d", game.level))
    
    Screen.flip()
end

-- Main
game.init()
return game
`
      },
      {
        extension: 'sh',
        name: 'Shell Script',
        description: 'Script Bash para automatización',
        icon: <Terminal className="w-5 h-5" />,
        iconBg: 'from-green-500/20 to-teal-500/20 border-green-500/30',
        tags: ['Bash', 'Build', 'Automation'],
        content: `#!/bin/bash
# ATHENA ENV - Build Script
# PlayStation 2 Development Automation

#===========================================================================
# Configuration
#===========================================================================
PROJECT_NAME="MyPS2Game"
BUILD_DIR="build"
OUTPUT_ELF="\${PROJECT_NAME}.elf"
OUTPUT_ISO="\${PROJECT_NAME}.iso"

# PS2SDK paths
export PS2SDK="/usr/local/ps2sdk"
export PS2DEV="/usr/local/ps2dev"
export PATH="\$PATH:\$PS2DEV/ee/bin:\$PS2DEV/iop/bin:\$PS2DEV/dvp/bin"

#===========================================================================
# Functions
#===========================================================================
log_info() {
    echo -e "\\033[1;34m[INFO]\\033[0m \$1"
}

log_success() {
    echo -e "\\033[1;32m[SUCCESS]\\033[0m \$1"
}

log_error() {
    echo -e "\\033[1;31m[ERROR]\\033[0m \$1"
}

clean() {
    log_info "Cleaning build directory..."
    rm -rf "\$BUILD_DIR"
    mkdir -p "\$BUILD_DIR"
}

build() {
    log_info "Building \$PROJECT_NAME..."
    
    cd "\$BUILD_DIR" || exit 1
    
    make -C .. all
    
    if [ \$? -eq 0 ]; then
        log_success "Build completed: \$OUTPUT_ELF"
    else
        log_error "Build failed!"
        exit 1
    fi
}

create_iso() {
    log_info "Creating ISO image..."
    
    mkisofs -o "\$OUTPUT_ISO" \\
        -sysid "PLAYSTATION" \\
        -V "\$PROJECT_NAME" \\
        -input-charset iso8859-1 \\
        "\$BUILD_DIR/"
    
    log_success "ISO created: \$OUTPUT_ISO"
}

run_emulator() {
    log_info "Launching in PCSX2..."
    pcsx2 "\$BUILD_DIR/\$OUTPUT_ELF" &
}

#===========================================================================
# Main
#===========================================================================
case "\$1" in
    clean)
        clean
        ;;
    build)
        build
        ;;
    iso)
        create_iso
        ;;
    run)
        run_emulator
        ;;
    all)
        clean
        build
        create_iso
        ;;
    *)
        echo "Usage: \$0 {clean|build|iso|run|all}"
        exit 1
        ;;
esac

exit 0
`
      }
    ]
  },
  {
    id: 'data',
    name: 'Datos',
    icon: <Database className="w-4 h-4" />,
    description: 'Archivos de datos y recursos',
    templates: [
      {
        extension: 'json',
        name: 'JSON Data',
        description: 'Datos estructurados en JSON',
        icon: <Braces className="w-5 h-5" />,
        iconBg: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
        tags: ['Data', 'Config', 'JSON'],
        content: `{
  "project": {
    "name": "PS2 Game Project",
    "version": "1.0.0",
    "author": "Developer",
    "description": "A PlayStation 2 homebrew game"
  },
  "display": {
    "width": 640,
    "height": 448,
    "interlace": true,
    "mode": "NTSC"
  },
  "levels": [
    {
      "id": 1,
      "name": "Level 1",
      "file": "level1.dat",
      "music": "bgm_level1.adp"
    },
    {
      "id": 2,
      "name": "Level 2",
      "file": "level2.dat",
      "music": "bgm_level2.adp"
    }
  ],
  "assets": {
    "textures": "data/textures/",
    "models": "data/models/",
    "audio": "data/audio/",
    "scripts": "data/scripts/"
  }
}
`
      },
      {
        extension: 'xml',
        name: 'XML Data',
        description: 'Datos estructurados en XML',
        icon: <FileText className="w-5 h-5" />,
        iconBg: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
        tags: ['Data', 'Config', 'XML'],
        content: `<?xml version="1.0" encoding="UTF-8"?>
<!-- ATHENA ENV - PS2 Project Configuration -->
<project>
    <info>
        <name>PS2 Game Project</name>
        <version>1.0.0</version>
        <author>Developer</author>
        <description>A PlayStation 2 homebrew game</description>
    </info>
    
    <display>
        <width>640</width>
        <height>448</height>
        <interlace>true</interlace>
        <mode>NTSC</mode>
    </display>
    
    <levels>
        <level id="1">
            <name>Level 1</name>
            <file>level1.dat</file>
            <music>bgm_level1.adp</music>
        </level>
        <level id="2">
            <name>Level 2</name>
            <file>level2.dat</file>
            <music>bgm_level2.adp</music>
        </level>
    </levels>
    
    <assets>
        <path type="textures">data/textures/</path>
        <path type="models">data/models/</path>
        <path type="audio">data/audio/</path>
        <path type="scripts">data/scripts/</path>
    </assets>
</project>
`
      },
      {
        extension: 'yaml',
        name: 'YAML Config',
        description: 'Configuración en formato YAML',
        icon: <FileCode className="w-5 h-5" />,
        iconBg: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
        tags: ['Data', 'Config', 'YAML'],
        content: `# ATHENA ENV - PS2 Project Configuration

project:
  name: PS2 Game Project
  version: 1.0.0
  author: Developer
  description: A PlayStation 2 homebrew game

display:
  width: 640
  height: 448
  interlace: true
  mode: NTSC

levels:
  - id: 1
    name: Level 1
    file: level1.dat
    music: bgm_level1.adp
  - id: 2
    name: Level 2
    file: level2.dat
    music: bgm_level2.adp

assets:
  textures: data/textures/
  models: data/models/
  audio: data/audio/
  scripts: data/scripts/

build:
  target: ee
  optimization: 2
  debug: false
  
memory:
  heap_size: 0x100000
  stack_size: 0x10000
`
      }
    ]
  },
  {
    id: 'docs',
    name: 'Documentación',
    icon: <BookOpen className="w-4 h-4" />,
    description: 'Archivos de documentación',
    templates: [
      {
        extension: 'md',
        name: 'Markdown',
        description: 'Documentación en Markdown',
        icon: <FileText className="w-5 h-5" />,
        iconBg: 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
        tags: ['Docs', 'Markdown', 'README'],
        content: `# PS2 Project

## Overview

A PlayStation 2 homebrew project built with ATHENA ENV.

## Requirements

- PS2SDK
- ee-gcc (MIPS R5900 compiler)
- iop-gcc (MIPS R3000 compiler)

## Building

\`\`\`bash
# Set up environment
export PS2SDK=/usr/local/ps2sdk
export PATH=$PATH:$PS2SDK/bin

# Build the project
make clean
make all
\`\`\`

## Project Structure

\`\`\`
project/
├── src/           # Source files
│   ├── main.c     # Entry point
│   ├── graphics.c # Graphics module
│   └── input.c    # Input handling
├── include/       # Header files
├── data/          # Game assets
├── Makefile       # Build script
└── README.md      # This file
\`\`\`

## License

MIT License - See LICENSE file for details.
`
      },
      {
        extension: 'txt',
        name: 'Text File',
        description: 'Archivo de texto plano',
        icon: <FileText className="w-5 h-5" />,
        iconBg: 'from-neutral-500/20 to-zinc-500/20 border-neutral-500/30',
        tags: ['Text', 'Notes', 'Plain'],
        content: `================================================================================
                     ATHENA ENV - PS2 Development Notes
================================================================================

Project: My PS2 Game
Author: Developer
Date: 2024

--------------------------------------------------------------------------------
TODO:
--------------------------------------------------------------------------------
[ ] Implement main menu
[ ] Add sound effects
[ ] Create level loader
[ ] Optimize VU1 microcode
[ ] Test on real hardware

--------------------------------------------------------------------------------
NOTES:
--------------------------------------------------------------------------------
- EE Core runs at 294.912 MHz (MIPS R5900)
- 32 MB main RAM
- 4 MB Video RAM (GS)
- VU0: 4KB micro memory, 4KB data memory
- VU1: 16KB micro memory, 16KB data memory

--------------------------------------------------------------------------------
RESOURCES:
--------------------------------------------------------------------------------
- PS2SDK Documentation
- PS2DEV Wiki
- PCSX2 Emulator for testing

================================================================================
`
      }
    ]
  }
];

export function QuickCreateTemplates({ 
  open, 
  onOpenChange, 
  onCreateFile, 
  targetFolder 
}: QuickCreateTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('ps2-native');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const handleCreateFile = useCallback((template: FileTemplate) => {
    onCreateFile(template.extension, template.content);
    onOpenChange(false);
  }, [onCreateFile, onOpenChange]);

  const filteredTemplates = templateCategories.map(category => ({
    ...category,
    templates: category.templates.filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.templates.length > 0);

  const currentCategory = filteredTemplates.find(c => c.id === selectedCategory) || filteredTemplates[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-border/50 bg-gradient-to-r from-ps2-purple/5 via-transparent to-ps2-cyan/5">
          <DialogHeader className="gap-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-ps2-purple/20 to-ps2-cyan/20 border border-ps2-purple/30">
                <Sparkles className="w-5 h-5 text-ps2-purple" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold bg-gradient-to-r from-ps2-purple to-ps2-cyan bg-clip-text text-transparent">
                  Creación Rápida de Plantillas
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Selecciona una plantilla para crear un nuevo archivo PS2
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar plantillas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/30 border-border/50 focus:border-ps2-purple/50"
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Categories */}
          <div className="w-48 border-r border-border/50 bg-muted/20 overflow-y-auto">
            <div className="p-2 space-y-1">
              {templateCategories.map((category) => {
                const isActive = category.id === selectedCategory;
                const templateCount = category.templates.length;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-ps2-purple/20 to-ps2-cyan/10 border border-ps2-purple/30 text-foreground shadow-sm' 
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${isActive ? 'bg-ps2-purple/20' : 'bg-muted/50'}`}>
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{category.name}</div>
                      <div className="text-[10px] text-muted-foreground">{templateCount} plantillas</div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-ps2-purple" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {currentCategory && (
              <>
                {/* Category Header */}
                <div className="px-4 py-3 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-2">
                    {currentCategory.icon}
                    <span className="font-medium text-sm">{currentCategory.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {currentCategory.templates.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{currentCategory.description}</p>
                </div>

                {/* Templates */}
                <ScrollArea className="flex-1">
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {currentCategory.templates.map((template) => (
                      <Card
                        key={template.extension}
                        className={`group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg border-border/50 ${
                          hoveredTemplate === template.extension 
                            ? 'border-ps2-purple/50 shadow-ps2-purple/10' 
                            : 'hover:border-ps2-purple/30'
                        }`}
                        onMouseEnter={() => setHoveredTemplate(template.extension)}
                        onMouseLeave={() => setHoveredTemplate(null)}
                        onClick={() => handleCreateFile(template)}
                      >
                        {/* Hover Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${template.iconBg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        
                        <div className="relative p-4">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${template.iconBg} border shrink-0`}>
                              {template.icon}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{template.name}</span>
                                <Badge 
                                  variant="secondary" 
                                  className="text-[10px] px-1.5 py-0 h-4 font-mono bg-muted/50"
                                >
                                  .{template.extension}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {template.description}
                              </p>
                              
                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {template.tags.map((tag) => (
                                  <span 
                                    key={tag}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Create Button (visible on hover) */}
                          <div className={`absolute right-3 top-3 transition-opacity ${
                            hoveredTemplate === template.extension ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <Button size="sm" className="h-7 px-2 gap-1.5 bg-ps2-purple hover:bg-ps2-purple/90">
                              <Plus className="w-3.5 h-3.5" />
                              <span className="text-xs">Crear</span>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Destino:</span>
              <code className="px-1.5 py-0.5 rounded bg-muted text-ps2-cyan font-mono text-[10px]">
                {targetFolder || '/'}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-7">
                <X className="w-3.5 h-3.5 mr-1.5" />
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
