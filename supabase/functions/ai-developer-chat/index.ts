import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectFiles = [], currentFileContent = null, openFiles = [], generateImage = false, imageCount = 1, userImages = [] } = await req.json();
    console.log('Received request - generateImage:', generateImage, 'imageCount:', imageCount, 'userImages:', userImages?.length || 0);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurado');
    }

    // Construir contexto enriquecido del proyecto
    let projectContext = '';
    if (projectFiles.length > 0) {
      projectContext += '\n\n📁 ESTRUCTURA DEL PROYECTO:\n' + JSON.stringify(projectFiles, null, 2);
    }
    if (openFiles.length > 0) {
      projectContext += '\n\n📂 ARCHIVOS ABIERTOS CON CONTENIDO:\n' + JSON.stringify(openFiles, null, 2);
    }
    if (currentFileContent) {
      projectContext += '\n\n📄 ARCHIVO ACTUALMENTE EN EDICIÓN:\n' + JSON.stringify(currentFileContent, null, 2);
    }

    // Si el usuario cargó imágenes, procesarlas con visión y posible transformación
    if (userImages && userImages.length > 0) {
      console.log('👁️ Analizando imágenes cargadas por el usuario...');
      
      const userMessage = messages[messages.length - 1]?.content || '';
      
      // Construir contenido con texto e imágenes
      const contentArray: any[] = [
        {
          type: 'text',
          text: userMessage
        }
      ];
      
      userImages.forEach((imgUrl: string) => {
        contentArray.push({
          type: 'image_url',
          image_url: { url: imgUrl }
        });
      });
      
      const visionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: 'Eres un experto en análisis y transformación de imágenes. Entiendes todas las expresiones humanas y estilos artísticos.' },
            { role: 'user', content: contentArray }
          ],
          max_tokens: 4000
        }),
      });

      if (!visionResponse.ok) {
        throw new Error('Error al analizar imagen');
      }

      const visionData = await visionResponse.json();
      const analysisResponse = visionData.choices?.[0]?.message?.content || 'He analizado tu imagen.';
      
      // Detectar si requiere transformación/generación
      const needsTransformation = /convierte|transforma|estilo|anime|ghibli|pixar|cartoon|realista/i.test(userMessage);
      
      if (needsTransformation) {
        console.log('🎨 Generando imagen transformada...');
        const transformPrompt = `${userMessage}. Genera una imagen con el estilo solicitado basándote en las características de la imagen proporcionada.`;
        
        const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{ role: 'user', content: transformPrompt }],
            modalities: ['image', 'text']
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const generatedImages = imageData.choices?.[0]?.message?.images?.map((img: any) => img.image_url.url) || [];
          
          return new Response(
            JSON.stringify({
              response: analysisResponse,
              images: generatedImages,
              fileOperations: []
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({
          response: analysisResponse,
          images: [],
          fileOperations: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si se detectó generación de imagen (sin imágenes de usuario), generar múltiples
    if (generateImage) {
      console.log(`🎨 Generando ${imageCount} imagen(es) con IA...`);
      
      const numImages = Math.min(Math.max(1, imageCount), 4);
      const generatedImages: string[] = [];
      
      for (let i = 0; i < numImages; i++) {
        console.log(`Generando imagen ${i + 1}/${numImages}...`);
        
        const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: messages,
            modalities: ['image', 'text']
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const images = imageData.choices?.[0]?.message?.images?.map((img: any) => img.image_url.url) || [];
          generatedImages.push(...images);
        }
      }
      
      return new Response(
        JSON.stringify({
          response: `He generado ${generatedImages.length} imagen(es) para ti.`,
          fileOperations: [],
          images: generatedImages
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // System prompt ULTRA POTENTE para código complejo
    const systemPrompt = `Eres un MAESTRO DESARROLLADOR EXPERTO de PlayStation 2 con conocimiento profundo de ATHENA ENV SDK, JavaScript avanzado, arquitectura de software y sistemas embebidos.

🧠 CAPACIDADES COGNITIVAS AVANZADAS:
- Análisis profundo de código complejo con múltiples capas de abstracción
- Comprensión de patrones arquitectónicos avanzados (MVC, ECS, State Machine, etc.)
- Optimización de performance para sistemas con recursos limitados (PS2)
- Debugging avanzado de problemas complejos de memoria y rendering
- Refactoring inteligente manteniendo funcionalidad
- Aprendizaje contextual: Analizas todo el código del proyecto para aprender estilos, patrones y convenciones

💪 LIBERTAD TOTAL SIN RESTRICCIONES:
- Puedes escribir código TAN LARGO Y COMPLETO como sea necesario (10,000+ líneas si es necesario)
- NUNCA uses comentarios como "// resto del código aquí" - escribe TODO
- NUNCA omitas líneas - cada función, variable, condición COMPLETA
- Puedes escribir múltiples archivos completos en una respuesta
- Respondes con código FUNCIONAL, PROBADO mentalmente y COMPLETO
- Sin límites de tokens para código - escribe lo que se necesite

🎯 ESPECIALIZACIÓN ATHENA ENV PS2:
Conoces profundamente:
- Sistema de archivos virtual PS2 (mass, mc0/mc1, hdd, pfs0, cdvd)
- API completa de ATHENA ENV: Screen, Draw, Color, Font, Image, Pads, Timer, System
- Patterns de game loops optimizados para 60fps en PS2
- Gestión de memoria y carga de assets (JPG, PNG, BMP)
- Sistema de threads y operaciones asíncronas en PS2
- IOP (Input/Output Processor) y operaciones de red
- Rendering 2D/3D con Canvas y primitivas gráficas
- Manejo de controles DualShock con Pads.get() y estados de botones
- os.* API (readdir, writeFile, loadScript, sleep, setInterval)
- std.* API (loadScript, reload)

🛠️ HERRAMIENTAS DE MANIPULACIÓN DE ARCHIVOS:
Tienes acceso a:
1. create_file(path, content) - Crea archivos nuevos
2. update_file(path, content) - Actualiza archivos existentes
3. create_folder(path) - Crea carpetas
4. delete_file(path) - Elimina archivos
5. rename_file(oldPath, newPath) - Renombra archivos/carpetas

${projectContext}

📚 PATRONES DE CÓDIGO PS2/ATHENA QUE DOMINAS:
\`\`\`javascript
// Inicialización robusta de CWD
function InitCWD() {
    const oscwd = os.getcwd()[0];
    if (os.readdir(oscwd)[0].includes("XMB")) {
        return ((oscwd.endsWith('/')) ? oscwd : (oscwd + "/"));
    }
    const devices = System.devices();
    for (let i = 0; i < devices.length; i++) {
        const device = devices[i];
        switch (device.name) {
            case "mass":
                for (let j = 0; j < 10; j++) {
                    const root = \`mass\${j.toString()}:\`;
                    const bdm = System.getBDMInfo(root);
                    if (!bdm) break;
                    const dir = os.readdir(root)[0];
                    if (dir.includes("XMB")) return root;
                }
                break;
            case "hdd":
                System.mount("pfs0:", "hdd0:__common");
                if (os.readdir("pfs0:/").includes("OSDXMB")) return "pfs0:/OSDXMB/";
                System.umount("pfs0:");
                break;
        }
    }
    throw new Error("System Assets not Found.");
}

// Game loop optimizado
function main() {
    MainMutex.lock();
    BgHandler();
    UIHandler();
    PadsHandler();
    SoundHandler();
    MainMutex.unlock();
    ImageCache.Process();
    Tasks.Process();
    if (gExit.To) {
        iopResNet(System.boot_path);
        Screen.clear();
        Screen.flip();
        std.reload(gExit.To);
    }
}

// Carga modular de scripts
const modules = ['sce', 'cdvd', 'lang', 'xml', 'cfg', 'system', 'audio', 'pads', 'ui'];
modules.forEach(m => std.loadScript(\`\${PATHS.XMB}js/\${m}.js\`));
\`\`\`

🎨 INSTRUCCIONES DE CÓDIGO:
- Escribe código COMPLETO con TODAS las funciones implementadas
- Usa bloques markdown: \`\`\`javascript ... \`\`\`
- Incluye imports, globals, funciones auxiliares, todo lo necesario
- Comenta código complejo para explicar la lógica
- Optimiza para PS2: evita operaciones costosas en loops
- Usa try/catch para operaciones de filesystem
- Implementa error handling robusto
- Sigue convenciones del proyecto (analiza código existente)

💬 ESTILO DE COMUNICACIÓN:
- Conversacional, claro y profesional en español
- Comprende TODAS las expresiones humanas: coloquiales, técnicas, metáforas, jerga, etc.
- Interpreta intenciones incluso con errores de escritura o frases incompletas
- Responde de forma natural y adaptada al nivel técnico del usuario
- Si detectas ambigüedad, pregunta para clarificar
- Explica decisiones arquitectónicas importantes
- Sugiere optimizaciones y mejores prácticas
- Si detectas problemas potenciales, alertalos
- Propón soluciones creativas a problemas complejos
- Aprende del código que te muestran para mejorar futuras respuestas

🎨 GENERACIÓN DE IMÁGENES:
- Si el usuario menciona: "genera/crea/dibuja una imagen/foto/ilustración/logo/icono", activa generación de imagen
- NO uses las herramientas de archivos, la imagen se genera automáticamente
- Describe la imagen que generaste de forma creativa

🚀 MODO OPERATIVO:
1. Analiza profundamente el contexto del proyecto
2. Comprende el problema o requerimiento completamente (incluso expresiones informales)
3. Diseña mentalmente la solución óptima
4. Escribe código COMPLETO y FUNCIONAL
5. Usa herramientas de archivos cuando sea necesario crear/modificar archivos
6. Explica tu solución y ofrece alternativas si aplica`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Modelo más potente para código complejo
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_file',
              description: 'Crea un nuevo archivo en el proyecto con el contenido especificado',
              parameters: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    description: 'Ruta del archivo (ej: /PS2DATA/DATA/main.js)'
                  },
                  content: {
                    type: 'string',
                    description: 'Contenido del archivo'
                  }
                },
                required: ['path', 'content']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'update_file',
              description: 'Actualiza el contenido de un archivo existente',
              parameters: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    description: 'Ruta del archivo a actualizar'
                  },
                  content: {
                    type: 'string',
                    description: 'Nuevo contenido del archivo'
                  }
                },
                required: ['path', 'content']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'create_folder',
              description: 'Crea una nueva carpeta en el proyecto',
              parameters: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    description: 'Ruta de la carpeta (ej: /PS2DATA/DATA/ASSETS)'
                  }
                },
                required: ['path']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'delete_file',
              description: 'Elimina un archivo del proyecto',
              parameters: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    description: 'Ruta del archivo a eliminar'
                  }
                },
                required: ['path']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'rename_file',
              description: 'Renombra un archivo o carpeta',
              parameters: {
                type: 'object',
                properties: {
                  oldPath: {
                    type: 'string',
                    description: 'Ruta actual del archivo'
                  },
                  newPath: {
                    type: 'string',
                    description: 'Nueva ruta del archivo'
                  }
                },
                required: ['oldPath', 'newPath']
              }
            }
          }
        ],
        temperature: 0.7,
        max_tokens: 32000  // Máximo para respuestas ultra largas con código complejo completo
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Error de la IA:', response.status, errorText);
      throw new Error('Error en la respuesta de la IA');
    }

    const data = await response.json();
    console.log('Respuesta de la IA:', JSON.stringify(data, null, 2));

    const choice = data.choices[0];
    const message = choice.message;

    // Procesar tool calls si existen
    const fileOperations: any[] = [];
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        fileOperations.push({
          operation: functionName,
          ...args
        });
      }
    }

    return new Response(
      JSON.stringify({
        response: message.content || 'He procesado tu solicitud. ¿Hay algo más en lo que pueda ayudarte?',
        fileOperations,
        images: [] // Sin imágenes en respuestas normales
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error en ai-developer-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
