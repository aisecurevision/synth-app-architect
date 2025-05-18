
interface GenerateCodeParams {
  prompt: string;
}

interface GenerateCodeResponse {
  code: string;
  language: string;
  fileName?: string;
}

const API_URL = 'http://127.0.0.1:1234/v1/chat/completions';

export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  try {
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "mistral-7b-instruct-v0.3",
        messages: [
          {
            role: "user", // Changed from system to user as you mentioned
            content: `Create a modern, responsive website based on this description: "${params.prompt}". 
            Return ONLY valid HTML, CSS, and JavaScript code in a single HTML file. 
            Make sure the website looks professional, with a clean layout, modern design elements, and responsive behavior.
            Structure your response as a JSON object with 'code', 'language', and 'fileName' properties.
            Do not include any explanations, just the JSON object.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status}`, errorText);
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
          // If we still can't parse, extract HTML directly
          const htmlMatch = messageContent.match(/```html\n([\s\S]*?)\n```/) ||
                           messageContent.match(/<!DOCTYPE html>[\s\S]*/);
          
          if (htmlMatch) {
            // If we find HTML, use it directly
            parsedContent = {
              code: htmlMatch[0] || htmlMatch[1] || messageContent,
              language: 'html',
              fileName: 'website.html'
            };
          } else {
            // Fallback if no HTML structure found
            parsedContent = {
              code: messageContent,
              language: 'html',
              fileName: 'website.html'
            };
          }
        }
      } else {
        // Fallback if no JSON structure found
        parsedContent = {
          code: messageContent,
          language: 'html',
          fileName: 'website.html'
        };
      }
    }
    
    // Ensure the code has HTML structure if it's HTML
    if (parsedContent.language === 'html' && !parsedContent.code.includes('<!DOCTYPE html>')) {
      parsedContent.code = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Synth Generated Website</title>
    <style>
        /* Modern defaults */
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        ${parsedContent.code}
    </div>
</body>
</html>`;
    }
    
    return {
      code: parsedContent.code || messageContent,
      language: parsedContent.language || 'html',
      fileName: parsedContent.fileName || 'website.html'
    };
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};
