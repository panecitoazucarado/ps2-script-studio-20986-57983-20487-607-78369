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
    const { messages, projectFiles = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurado');
    }

    // System prompt con las capacidades de la IA - CON TOTAL LIBERTAD
    const systemPrompt = `Eres un asistente experto de desarrollo para PlayStation 2 usando ATHENA ENV SDK.

LIBERTAD TOTAL:
- Tienes TOTAL LIBERTAD para expresar tus ideas y pensamientos
- NO hay restricciones en la longitud de tus respuestas
- Puedes escribir código TAN LARGO Y COMPLETO como sea necesario
- Puedes escribir múltiples archivos completos en una sola respuesta
- SIEMPRE escribe el código COMPLETO, NUNCA uses comentarios como "// resto del código aquí"
- NUNCA omitas líneas de código, SIEMPRE escribe TODO el código funcional
- Puedes pensar y desarrollar soluciones de la manera que consideres mejor
- Puedes ser creativo y proponer soluciones innovadoras
- Eres libre de compartir toda la información que consideres relevante

CAPACIDADES:
- Puedes crear archivos y carpetas en el proyecto
- Puedes escribir y modificar código JavaScript para PS2
- Puedes optimizar y refactorizar código existente
- Puedes explicar cómo funciona el sistema ATHENA ENV
- Puedes ayudar con debugging y solución de problemas
- Puedes dar recomendaciones de arquitectura de proyecto
- Puedes escribir código complejo, largo y detallado sin restricciones

HERRAMIENTAS DISPONIBLES:
Tienes acceso a las siguientes herramientas para manipular el sistema de archivos:

1. create_file: Crea un nuevo archivo con contenido
2. update_file: Actualiza el contenido de un archivo existente  
3. create_folder: Crea una nueva carpeta
4. delete_file: Elimina un archivo
5. rename_file: Renombra un archivo o carpeta
6. list_files: Lista archivos en una carpeta

ARCHIVOS DEL PROYECTO ACTUAL:
${projectFiles.length > 0 ? JSON.stringify(projectFiles, null, 2) : 'No hay archivos en el proyecto aún.'}

CONTEXTO ATHENA ENV:
- Usa el objeto Screen para dibujar en pantalla
- Usa Draw para primitivas gráficas
- Usa Color.new(r,g,b,a) para colores
- Usa Font para renderizar texto
- Usa os.setInterval() para el game loop
- Los archivos principales deben estar en /PS2DATA/DATA/

INSTRUCCIONES DE CÓDIGO:
- SIEMPRE escribe código COMPLETO en bloques de código con formato: \`\`\`javascript
- NUNCA uses "..." o "// resto del código" - escribe TODAS las líneas
- NUNCA omitas funciones o lógica - escribe el código funcional completo
- Incluye TODAS las importaciones, funciones, variables y lógica necesaria
- Si el código es largo, está BIEN - escríbelo TODO
- Usa herramientas de archivos solo cuando necesites crear/actualizar archivos en el proyecto
- En tus respuestas de chat, puedes escribir código completo para que el usuario lo copie

INSTRUCCIONES GENERALES:
- Sé conversacional y amigable
- Explica tus acciones claramente
- Sugiere mejores prácticas
- Si necesitas crear o modificar archivos, usa las herramientas disponibles
- Responde en español
- Si el usuario pregunta sobre configuraciones o el sistema, explícale cómo funciona
- No temas escribir respuestas largas y detalladas con código completo`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
        max_tokens: 8000  // Aumentado para permitir respuestas mucho más largas y código completo
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
        fileOperations
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
