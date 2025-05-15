
interface GenerateCodeParams {
  prompt: string;
}

interface GenerateCodeResponse {
  code: string;
  language: string;
  fileName?: string;
}

const API_URL = 'http://192.168.1.42:1234/v1/chat/completions';

export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  try {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      mode: 'cors', // Explicitly set CORS mode
      body: JSON.stringify({
        model: "local-model",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates code based on user descriptions. Return ONLY the code, without any explanations. Output should be a JSON object with 'code', 'language', and optional 'fileName' properties."
          },
          {
            role: "user",
            content: params.prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.choices?.[0]?.message?.content || '';
    
    // Try to extract JSON from the response if possible
    let parsedContent;
    try {
      // Check if the content is already JSON
      parsedContent = JSON.parse(messageContent);
    } catch (e) {
      // If not JSON, try to extract JSON from code blocks
      const jsonMatch = messageContent.match(/```json\n([\s\S]*?)\n```/) || 
                        messageContent.match(/```\n([\s\S]*?)\n```/) ||
                        messageContent.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        try {
          parsedContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e) {
          // If we still can't parse, use the raw text
          parsedContent = {
            code: messageContent,
            language: 'html',
            fileName: 'app.html'
          };
        }
      } else {
        // Fallback if no JSON structure found
        parsedContent = {
          code: messageContent,
          language: 'html',
          fileName: 'app.html'
        };
      }
    }
    
    return {
      code: parsedContent.code || messageContent,
      language: parsedContent.language || 'html',
      fileName: parsedContent.fileName || 'app.html'
    };
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};
