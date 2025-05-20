
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

// Enhanced JSON extraction with multiple fallback methods
const extractJsonFromText = (text: string): any => {
  console.log("Attempting to extract JSON from response text");
  
  try {
    // Method 1: Try direct JSON parsing
    return JSON.parse(text);
  } catch (e) {
    console.log("Direct JSON parsing failed, trying extraction methods");
    
    try {
      // Method 2: Find content between ```json and ``` markers
      const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        const jsonContent = jsonBlockMatch[1].trim();
        console.log("Found JSON block:", jsonContent.substring(0, 100) + "...");
        return JSON.parse(jsonContent);
      }
      
      // Method 3: Look for { ... } pattern that spans multiple lines
      const jsonMatch = text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const jsonContent = jsonMatch[0].trim();
        console.log("Found JSON object:", jsonContent.substring(0, 100) + "...");
        return JSON.parse(jsonContent);
      }
      
      // Method 4: Extract code from a code block if JSON extraction failed
      const codeBlockMatch = text.match(/```(?:tsx|jsx|javascript|react|ts)\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        console.log("Found code block, using as fallback");
        return {
          code: codeBlockMatch[1],
          language: 'tsx',
          fileName: 'App.tsx'
        };
      }
      
      // Method 5: Check if the entire response might be React code
      if (text.includes('import React') || text.includes('function App') || text.includes('const App')) {
        console.log("Response appears to be React code, using as fallback");
        return {
          code: text,
          language: text.includes('interface') || text.includes(': React.') ? 'tsx' : 'jsx',
          fileName: 'App.tsx'
        };
      }

      // Method 6: Last resort - extract any usable code and create a simple component
      console.log("All extraction methods failed, creating a simple component as fallback");
      return {
        code: `
import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Simple Application</h1>
        <p className="text-gray-600 mb-4">
          This is a fallback component. The LLM response couldn't be parsed correctly.
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
      console.error("All JSON extraction methods failed:", extractionError);
      // Provide a very simple fallback component instead of throwing
      return {
        code: `
import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Error Processing Response</h1>
        <p className="text-gray-600 mb-4">
          There was an error processing the response from the LLM.
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
          
          FORMAT YOUR RESPONSE AS A JSON OBJECT:
          {
            "code": "// Your complete React application code here with ALL necessary types defined",
            "language": "tsx",
            "fileName": "App.tsx"
          }
          
          DO NOT include any explanations or markdown formatting, ONLY the JSON object.`
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
          
          Return your response as a JSON object with these properties:
          {
            "code": "// Your complete React application code here",
            "language": "tsx",
            "fileName": "App.tsx"
          }
          
          IMPORTANT: Make sure all state types and interfaces are properly defined. Include ALL type definitions needed.
          Do not include any explanations or markdown, just the JSON object with the complete application code.`
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
    
    // Use our enhanced JSON extraction function
    const parsedContent = extractJsonFromText(messageContent);
    
    // Validate the extracted content
    if (!parsedContent.code || typeof parsedContent.code !== 'string') {
      console.error("Generated code is missing or invalid");
      throw new Error("Generated code is missing or invalid");
    }

    if (parsedContent.code.trim().length < 50) {
      console.warn("Generated code is suspiciously short:", parsedContent.code);
      throw new Error("Generated application code is too short to be valid");
    }
    
    // Set appropriate language based on content
    if (!parsedContent.language) {
      if (parsedContent.code.includes('interface ') || 
          parsedContent.code.includes(': React.') || 
          parsedContent.code.includes(': FC<')) {
        parsedContent.language = 'tsx';
      } else {
        parsedContent.language = 'jsx';
      }
    }
    
    return {
      code: parsedContent.code,
      language: parsedContent.language,
      fileName: 'App.tsx'  // Always use App.tsx
    };
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
