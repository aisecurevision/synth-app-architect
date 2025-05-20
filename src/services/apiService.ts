
interface GenerateCodeParams {
  prompt: string;
  apiEndpoint?: string;
}

interface GenerateCodeResponse {
  code: string;
  language: string;
  fileName?: string;
}

// Fetch available models from LM Studio with better error handling
const fetchAvailableModel = async (apiBaseUrl: string): Promise<string> => {
  try {
    const modelsEndpoint = apiBaseUrl.replace('/chat/completions', '/models');
    console.log("Attempting to fetch models from:", modelsEndpoint);
    
    const response = await fetch(modelsEndpoint);
    
    if (!response.ok) {
      console.warn(`Failed to fetch models: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Get the first available model or handle empty response
    if (!data.data || data.data.length === 0) {
      console.warn("No models available from LLM server, using default fallback");
      throw new Error("No models available from LLM server");
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

// Direct extraction of code without JSON parsing 
const extractCodeFromResponse = (text: string): GenerateCodeResponse => {
  console.log("Extracting code directly from response");
  
  try {
    // First attempt: Try direct JSON parsing but with safety features
    try {
      // Remove control characters that might break JSON.parse
      const cleanedText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      const parsed = JSON.parse(cleanedText);
      
      if (parsed && typeof parsed === 'object' && parsed.code) {
        console.log("Successfully parsed JSON directly");
        return {
          code: parsed.code,
          language: parsed.language || 'tsx',
          fileName: parsed.fileName || 'App.tsx'
        };
      }
    } catch (jsonError) {
      console.log("Direct JSON parsing failed, using alternative extraction methods");
    }

    // Method 1: Look for a code block with language marker
    const codeBlockRegex = /```(?:jsx|tsx|javascript|react|js|ts)?\s*([\s\S]*?)\s*```/;
    const codeMatch = text.match(codeBlockRegex);
    
    if (codeMatch && codeMatch[1]) {
      console.log("Found code block with language marker");
      const extractedCode = codeMatch[1].trim();
      
      // Determine language based on content
      const language = 
        extractedCode.includes('interface ') || 
        extractedCode.includes(': React.') || 
        extractedCode.includes('<T>') ? 'tsx' : 'jsx';
      
      return {
        code: extractedCode,
        language,
        fileName: 'App.tsx'
      };
    }
    
    // Method 2: If there are React imports but no code blocks, use the whole response
    if (text.includes('import React') || 
        text.includes('function App') || 
        text.includes('const App')) {
      console.log("Using entire response as code");
      
      return {
        code: text,
        language: text.includes('interface ') || text.includes(': React.') ? 'tsx' : 'jsx',
        fileName: 'App.tsx'
      };
    }
    
    // Method 3: Fallback - create a simple component if no viable code found
    console.log("No usable code found in response, using fallback component");
    return {
      code: `
import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Simple Application</h1>
        <p className="text-gray-600 mb-4">
          The LLM response couldn't be parsed correctly.
        </p>
        <div className="bg-gray-50 rounded p-4 text-sm text-gray-800">
          <p>Try adjusting your prompt to be more specific about what kind of application you want to create.</p>
        </div>
      </div>
    </div>
  );
};

export default App;`,
      language: 'tsx',
      fileName: 'App.tsx'
    };
  } catch (extractionError) {
    console.error("All code extraction methods failed:", extractionError);
    
    // Last resort fallback
    return {
      code: `
import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Error Processing Response</h1>
        <p className="text-gray-600 mb-4">
          There was an error extracting code from the LLM response.
        </p>
        <div className="bg-gray-50 rounded p-4 text-sm text-gray-800">
          <p>Try a different prompt or check your LLM service connection.</p>
        </div>
      </div>
    </div>
  );
};

export default App;`,
      language: 'tsx',
      fileName: 'App.tsx'
    };
  }
};

export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  try {
    // Use the provided API endpoint or fall back to default
    const apiEndpoint = params.apiEndpoint || 'http://127.0.0.1:1234/v1/chat/completions';
    console.log("Using API endpoint:", apiEndpoint);
    
    // Get available model but with better error handling if not available
    let model;
    try {
      model = await fetchAvailableModel(apiEndpoint);
    } catch (modelError) {
      console.warn("Could not fetch model, will try without specifying model:", modelError);
      // We'll proceed without a specific model
    }
    
    const requestBody: any = {
      messages: [
        {
          role: "system",
          content: `You are an expert React developer specializing in creating modern, production-ready React applications.
          You'll be generating complete code for a responsive application based on the user's description.
          
          IMPORTANT GUIDELINES:
          1. Return fully functional React code with actual UI components and content, not just placeholder text.
          2. The code must render properly when evaluated in a browser environment.
          3. ALWAYS use proper TypeScript types.
          4. NEVER use undefined variables like 'CalculatorState' without defining them first.
          5. DO NOT include type imports that don't exist in the codebase.
          6. When creating state management, always define all types and interfaces used.
          7. DO NOT use @material-ui/core or other libraries that aren't available.
          8. Use Tailwind CSS for styling.
          
          FORMAT YOUR RESPONSE AS CLEAN CODE WITHOUT JSON:
          Just provide the complete React application code directly, without any JSON wrapper or explanation.
          Start with imports and end with export default statement.
          
          DO NOT include any explanations or markdown formatting, ONLY the code.`
        },
        {
          role: "user",
          content: `Create a modern, production-grade web application based on this description: "${params.prompt}".

          Tech Stack Requirements:
          - Frontend: React with TypeScript
          - Styling: Tailwind CSS
          
          The application should include:
          - Modern, responsive layout
          - Actual content and functioning components (NOT just placeholders or lorem ipsum)
          - Well-organized code with proper TypeScript types
          
          IMPORTANT: 
          - Make sure all state types and interfaces are properly defined.
          - Include ALL type definitions needed.
          - DO NOT use external libraries like Material UI, only use React and Tailwind CSS.
          - Return ONLY the code, not wrapped in JSON or markdown.`
        }
      ],
      temperature: 0.5,
      max_tokens: 4000
    };
    
    // Only add model to the request if we have one
    if (model) {
      requestBody.model = model;
      console.log("Using model for request:", model);
    } else {
      console.log("No specific model set, using server default");
    }
    
    // Make request to the LLM API
    console.log("Sending request to LLM API...");
    const response = await fetch(apiEndpoint, {
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
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid API response structure:", data);
      throw new Error("Invalid API response structure");
    }
    
    const messageContent = data.choices[0].message.content;
    console.log("Response content length:", messageContent.length);
    
    // Log a preview of the content for debugging
    console.log("Response content preview:", messageContent.substring(0, 200) + "...");
    
    // Use our enhanced direct code extraction function
    const result = extractCodeFromResponse(messageContent);
    
    // Validate the extracted content
    if (!result.code || typeof result.code !== 'string') {
      console.error("Generated code is missing or invalid");
      throw new Error("Generated code is missing or invalid");
    }

    if (result.code.trim().length < 50) {
      console.warn("Generated code is suspiciously short:", result.code);
      throw new Error("Generated application code is too short to be valid");
    }
    
    return result;
  } catch (error) {
    console.error('Error generating code:', error);
    
    // Return a simple fallback component on error
    return {
      code: `
import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Error Generating Application</h1>
        <p className="text-gray-600 mb-4">
          ${error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred'}
        </p>
        <div className="bg-gray-50 rounded p-4 text-sm text-gray-800">
          <p className="font-medium mb-2">Troubleshooting tips:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Check your LLM server connection</li>
            <li>Verify your API endpoint configuration</li>
            <li>Try a simpler or more specific prompt</li>
            <li>Ensure your LLM model is properly loaded</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;`,
      language: 'tsx',
      fileName: 'App.tsx'
    };
  }
};
