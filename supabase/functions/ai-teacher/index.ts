import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseKey!);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, bookId, imageData, userId } = await req.json();

    console.log('[AI-TEACHER] Request received:', { 
      hasMessage: !!message, 
      hasBookId: !!bookId, 
      hasImage: !!imageData,
      userId 
    });

    // Prepare the request body for Gemini
    const requestBody: any = {
      contents: [
        {
          parts: []
        }
      ]
    };

    // Add text message
    if (message) {
      requestBody.contents[0].parts.push({
        text: `Você é uma professora de leitura especializada e amigável. 
        ${bookId ? `O usuário está lendo um livro (ID: ${bookId}).` : ''}
        
        Responda de forma educativa, encorajadora e sempre relacione ao contexto de leitura e aprendizado.
        Seja prática nas suas explicações e ofereça dicas úteis de leitura.
        
        Pergunta/comentário do usuário: ${message}`
      });
    }

    // Add image if provided
    if (imageData) {
      // Remove data URL prefix if present
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      requestBody.contents[0].parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Image
        }
      });

      // Add context for image analysis
      if (!message) {
        requestBody.contents[0].parts.push({
          text: "Analise esta imagem do livro e explique o conteúdo de forma didática. Ofereça insights educativos sobre o que você vê."
        });
      }
    }

    console.log('[AI-TEACHER] Calling Gemini API...');

    // Call Gemini API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey!,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[AI-TEACHER] Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('[AI-TEACHER] Gemini response received');

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'Desculpe, não consegui processar sua solicitação no momento.';

    // Save to chat history if user is authenticated
    if (userId) {
      try {
        await supabase
          .from('ai_chat_history')
          .insert({
            user_id: userId,
            book_id: bookId || null,
            message: message || 'Análise de imagem',
            response: aiResponse,
            image_url: imageData ? 'uploaded' : null
          });
        
        console.log('[AI-TEACHER] Chat history saved');
      } catch (error) {
        console.error('[AI-TEACHER] Error saving chat history:', error);
        // Don't fail the request if chat history fails
      }
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI-TEACHER] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});