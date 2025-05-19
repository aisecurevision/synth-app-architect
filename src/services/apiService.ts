
interface GenerateCodeParams {
  prompt: string;
}

interface GenerateCodeResponse {
  code: string;
  language: string;
  fileName?: string;
}

// Available templates that will be selected based on prompt context
const TEMPLATES = {
  default: "modern-dashboard",
  dashboard: "analytics-dashboard",
  ecommerce: "ecommerce-dashboard",
  portfolio: "portfolio-site"
};

const API_URL = 'http://127.0.0.1:1234/v1/chat/completions';

// Function to determine the best template based on user prompt
const determineTemplate = (prompt: string): string => {
  prompt = prompt.toLowerCase();
  
  if (prompt.includes('ecommerce') || prompt.includes('shop') || prompt.includes('store')) {
    return TEMPLATES.ecommerce;
  } else if (prompt.includes('dashboard') || prompt.includes('analytics') || prompt.includes('admin')) {
    return TEMPLATES.dashboard;
  } else if (prompt.includes('portfolio') || prompt.includes('personal') || prompt.includes('resume')) {
    return TEMPLATES.portfolio;
  }
  
  return TEMPLATES.default;
};

// Fetch available models from LM Studio
const fetchAvailableModel = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_URL.replace('/chat/completions', '/models')}`);
    if (!response.ok) {
      console.warn("Could not fetch available models, using fallback model");
      return "mistral-7b-instruct-v0.3";
    }
    
    const data = await response.json();
    // Get the first available model (or use fallback)
    const model = data.data?.[0]?.id || "mistral-7b-instruct-v0.3";
    console.log("Detected model:", model);
    return model;
  } catch (error) {
    console.error("Error fetching models:", error);
    return "mistral-7b-instruct-v0.3"; // Fallback
  }
};

export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  try {
    // Determine the best template based on user prompt
    const template = determineTemplate(params.prompt);
    console.log(`Selected template: ${template} based on prompt`);
    
    // Get available model
    const model = await fetchAvailableModel();
    
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: `Create a modern, production-grade ${template} web application based on this description: "${params.prompt}".

            Tech Stack Requirements:
            - Frontend: React (Vite) with TypeScript
            - Styling: Tailwind CSS with ShadCN UI components and DaisyUI for theming
            - Routing: React Router DOM v6+
            
            The application should include:
            - Modern, responsive layout with sidebar navigation
            - Dashboard cards/grids (if applicable)
            - Data visualization components (if applicable)
            - Dark/light mode toggle
            - Proper TypeScript interfaces and types
            - Well-organized folder structure (src/components, src/hooks, src/pages)
            
            Return your response as a JSON object with these properties:
            1. "code": Complete React+TypeScript+Vite application code
            2. "language": "jsx" or "tsx"
            3. "fileName": "App.tsx"
            
            Make the application as complete and functional as possible, with realistic dummy data if needed.
            Do not include any explanations, just the JSON object.`
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
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
          // If we still can't parse JSON, extract React code directly
          const reactMatch = messageContent.match(/```tsx\n([\s\S]*?)\n```/) ||
                            messageContent.match(/```jsx\n([\s\S]*?)\n```/) ||
                            messageContent.match(/```javascript\n([\s\S]*?)\n```/) ||
                            messageContent.match(/import React from ['"]react['"];[\s\S]*/);
          
          if (reactMatch) {
            // If we find React code, use it directly
            parsedContent = {
              code: reactMatch[1] || reactMatch[0],
              language: 'tsx',
              fileName: 'App.tsx'
            };
          } else {
            // Fallback if no React structure found
            parsedContent = {
              code: messageContent,
              language: 'tsx',
              fileName: 'App.tsx'
            };
          }
        }
      } else {
        // Fallback if no JSON structure found
        parsedContent = {
          code: messageContent,
          language: 'tsx',
          fileName: 'App.tsx'
        };
      }
    }
    
    // Set appropriate language based on content
    if (parsedContent.code.includes('TypeScript') || 
        parsedContent.code.includes('typescript') ||
        parsedContent.code.includes('<React.FC') ||
        parsedContent.code.includes(': React.') ||
        parsedContent.code.includes(': FC<') ||
        parsedContent.code.includes('interface ')) {
      parsedContent.language = 'tsx';
    } else if (parsedContent.code.includes('import React') || 
              parsedContent.code.includes('React.') ||
              parsedContent.code.includes('useState') ||
              parsedContent.code.includes('useEffect')) {
      parsedContent.language = 'jsx';
    }
    
    return {
      code: parsedContent.code || messageContent,
      language: parsedContent.language || 'tsx',
      fileName: parsedContent.fileName || 'App.tsx'
    };
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};
