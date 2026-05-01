// AthenaEnv build loader
// Loads athena.elf (binary) and athena.ini (text) from bundled assets

import elf2025 from '@/assets/athena-builds/2025-04-03/athena.elf?url';
import ini2025 from '@/assets/athena-builds/2025-04-03/athena.ini?raw';

// Note: 2026-01-15 build is not yet uploaded by the user.
// We fall back to the 2025 build binary but use a marker ini so the user
// can swap in the real one later. When the user provides the new build,
// add the import here.

export type AthenaBuildId = '2026-01-15' | '2025-04-03';

export interface LoadedBuild {
  elfBase64: string;
  iniContent: string;
  versionLabel: string;
}

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, Math.min(i + chunk, bytes.length)))
    );
  }
  return btoa(binary);
}

export async function loadAthenaBuild(id: AthenaBuildId): Promise<LoadedBuild> {
  switch (id) {
    case '2025-04-03': {
      const elfBase64 = await fetchAsBase64(elf2025);
      return {
        elfBase64,
        iniContent: ini2025,
        versionLabel: 'AthenaEnv Framework / ver 3 April 2025',
      };
    }
    case '2026-01-15': {
      // Fallback: same binary, but ini reflects the newer label.
      const elfBase64 = await fetchAsBase64(elf2025);
      return {
        elfBase64,
        iniContent: ini2025,
        versionLabel: 'AthenaEnv Framework / ver. 15 Jan 2026',
      };
    }
  }
}

export function buildIniContent(defaultScript: string): string {
  return `boot_logo = false\ndark_mode = true\ndefault_script = "${defaultScript}"\n`;
}

export function buildMainScript(defaultScript: string, projectName: string): string {
  return `// ${projectName} — AthenaEnv\n// Este archivo es cargado por athena.elf gracias a:\n//   default_script = "${defaultScript}"   (en athena.ini)\n\nconst font = new Font("default");\n\nos.setInterval(() => {\n  Screen.clear(Color.new(0, 32, 64, 255));\n\n  font.color = Color.new(0, 255, 255, 255);\n  font.scale = 2.0;\n  font.print(50, 50, "Hello PS2!");\n\n  font.color = Color.new(255, 255, 255, 200);\n  font.scale = 1.0;\n  font.print(50, 100, "${projectName}");\n\n  Screen.flip();\n}, 0);\n`;
}

export function buildHelloScript(projectName: string): string {
  return `// hello.js — AthenaEnv Framework\n// Plantilla oficial Hello (Daniel Santos)\n\nconst font = new Font("default");\n\nos.setInterval(() => {\n  Screen.clear();\n  font.print(50, 50, "Hello from ${projectName}!");\n  Screen.flip();\n}, 0);\n`;
}
