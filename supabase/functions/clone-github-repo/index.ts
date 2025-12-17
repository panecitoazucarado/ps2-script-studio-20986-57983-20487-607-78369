import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { owner, repo } = await req.json();

    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: 'Owner and repo are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Cloning repository: ${owner}/${repo}`);

    // Fetch the zip from GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Athena-IDE-Clone-Tool',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `GitHub error: ${response.status}`,
          details: response.status === 404 ? 'Repositorio no encontrado' : errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the zip as array buffer
    const zipBuffer = await response.arrayBuffer();
    
    // Convert to base64 for safe transmission
    const base64 = btoa(
      new Uint8Array(zipBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log(`Successfully fetched repository: ${owner}/${repo}, size: ${zipBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({ 
        success: true,
        zipData: base64,
        size: zipBuffer.byteLength
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error cloning repository:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al clonar';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
