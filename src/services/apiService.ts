
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

// Fetch available models from LM Studio with better error handling
const fetchAvailableModel = async (): Promise<string> => {
  try {
    console.log("Attempting to fetch models from LM Studio...");
    const response = await fetch(`${API_URL.replace('/chat/completions', '/models')}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch models: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Get the first available model or handle empty response
    if (!data.data || data.data.length === 0) {
      console.warn("No models available from LM Studio, using default fallback");
      throw new Error("No models available from LM Studio");
    }
    
    const model = data.data[0]?.id;
    console.log("Using model:", model);
    return model;
  } catch (error) {
    console.error("Error fetching models:", error);
    // Don't use a hardcoded fallback - instead let the error propagate
    throw error;
  }
};

export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  try {
    // Determine the best template based on user prompt
    const template = determineTemplate(params.prompt);
    console.log(`Selected template: ${template} based on prompt`);
    
    // Get available model - but handle errors better
    let model;
    try {
      model = await fetchAvailableModel();
    } catch (error) {
      console.error("Could not fetch model, attempting to use API without explicit model name");
      // We'll let the API decide which model to use by not specifying one
      model = ""; // This will be handled below
    }
    
    const requestBody: any = {
      messages: [
        {
          role: "system",
          content: `You are an expert React developer specializing in creating modern, production-ready web applications.
          You'll be generating complete code for a ${template} application based on the user's description.
          IMPORTANT: Always return fully functional React code that has actual UI components, not just placeholder text.`
        },
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
          2. "language": "tsx" 
          3. "fileName": "App.tsx"
          
          Make the application as complete and functional as possible, with realistic dummy data if needed.
          Use modern design principles with proper components, not just placeholder text.
          Focus on creating an actual working UI with proper HTML structure.
          Do not include any explanations, just the JSON object.`
        }
      ],
      temperature: 0.5,
      max_tokens: 8000
    };
    
    // Only add model to the request if we have one
    if (model) {
      requestBody.model = model;
    }
    
    // Make request to the LM Studio API
    console.log("Sending request to LM Studio API...");
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status}`, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received response from API");
    const messageContent = data.choices?.[0]?.message?.content || '';
    
    // Enhanced JSON extraction for better reliability
    let parsedContent;
    try {
      // Try parsing directly first
      parsedContent = JSON.parse(messageContent);
      console.log("Successfully parsed JSON directly");
    } catch (e) {
      console.log("Could not parse as direct JSON, trying to extract JSON from content...");
      try {
        // Try to find JSON in a code block
        const jsonMatch = messageContent.match(/```json\n([\s\S]*?)\n```/) || 
                          messageContent.match(/```\n([\s\S]*?)\n```/) ||
                          messageContent.match(/{[\s\S]*?}/);
        
        if (jsonMatch) {
          const extractedJson = jsonMatch[1] || jsonMatch[0];
          parsedContent = JSON.parse(extractedJson.replace(/^```json\n|^```\n|```$/g, ''));
          console.log("Extracted JSON from code block");
        } else {
          // Look for React code directly if no JSON
          const reactMatch = messageContent.match(/```tsx\n([\s\S]*?)\n```/) ||
                            messageContent.match(/```jsx\n([\s\S]*?)\n```/) ||
                            messageContent.match(/```javascript\n([\s\S]*?)\n```/);
          
          if (reactMatch) {
            const extractedCode = reactMatch[1] || reactMatch[0];
            parsedContent = {
              code: extractedCode.replace(/^```tsx\n|^```jsx\n|^```javascript\n|```$/g, ''),
              language: 'tsx',
              fileName: 'App.tsx'
            };
            console.log("Extracted React code directly from code block");
          } else if (messageContent.includes('import React') || messageContent.includes('import {')) {
            // Last resort - use entire message as code if it looks like React
            parsedContent = {
              code: messageContent,
              language: 'tsx',
              fileName: 'App.tsx'
            };
            console.log("Using entire message as React code");
          } else {
            // If we still can't find anything useful
            throw new Error("Could not extract usable code from API response");
          }
        }
      } catch (innerError) {
        console.error("Error extracting code:", innerError);
        throw new Error("Failed to parse API response");
      }
    }
    
    // Handle case where code might be empty or invalid
    if (!parsedContent.code || parsedContent.code.trim().length < 50) {
      console.error("Generated code is too short or empty");
      throw new Error("Generated application code is invalid or too short");
    }
    
    // Set appropriate language based on content
    if (parsedContent.code.includes('interface ') || 
        parsedContent.code.includes(': React.') || 
        parsedContent.code.includes(': FC<')) {
      parsedContent.language = 'tsx';
    } else if (parsedContent.code.includes('import React')) {
      parsedContent.language = 'jsx';
    }
    
    return {
      code: parsedContent.code,
      language: parsedContent.language || 'tsx',
      fileName: 'App.tsx'  // Always use App.tsx
    };
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};
