
interface GenerateCodeParams {
  prompt: string;
  apiEndpoint?: string;
}

interface GenerateCodeResponse {
  code: string;
  language: string;
  fileName?: string;
}

// Fetch available model without complex parsing
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
    
    if (!data.data || data.data.length === 0) {
      console.warn("No models available from LLM server, using default fallback");
      throw new Error("No models available from LLM server");
    }
    
    const model = data.data[0]?.id;
    console.log("Using model:", model);
    return model;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
};

// Direct code extraction function without complex parsing
const extractCode = (text: string): string => {
  // Look for code blocks
  const codeBlockMatch = text.match(/```(?:jsx?|tsx?|javascript|typescript)?\s*([\s\S]+?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  
  // If it contains import React, it's probably React code
  if (text.includes('import React') || 
      text.includes('function App') || 
      text.includes('const App')) {
    return text;
  }
  
  // If there are HTML-like tags, it's probably JSX
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    return text;
  }
  
  // Basic fallback if the text doesn't appear to be code
  return `
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Simple React Application</h1>
        <p className="text-gray-600 mb-4">Application generated successfully</p>
      </div>
    </div>
  );
}

export default App;`;
}

// Generate code with direct response handling
export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  try {
    const apiEndpoint = params.apiEndpoint || 'http://127.0.0.1:1234/v1/chat/completions';
    console.log("Using API endpoint:", apiEndpoint);
    
    let model;
    try {
      model = await fetchAvailableModel(apiEndpoint);
    } catch (modelError) {
      console.warn("Could not fetch model, will try without specifying model:", modelError);
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
          3. ALWAYS use proper JavaScript or TypeScript if requested.
          4. DO NOT return the code in a JSON format. Just return the raw code directly.
          5. Just provide the raw code directly.
          6. ONLY use React for the frontend.
          7. Use Tailwind CSS for styling.
          
          FORMAT YOUR RESPONSE AS CLEAN CODE WITHOUT ANY WRAPPERS:
          Just provide the complete React application code directly.
          Start with imports and setup code.`
        },
        {
          role: "user",
          content: `Create a modern, production-grade web application based on this description: "${params.prompt}".

          Tech Stack Requirements:
          - Frontend: React (with or without TypeScript)
          - Styling: Tailwind CSS
          
          The application should include:
          - Modern, responsive layout
          - Actual content and functioning components (NOT just placeholders)
          - Well-organized code
          
          IMPORTANT: 
          - Return ONLY the code, not wrapped in markdown or anything else.
          - Start with import statements.
          - End with export default.
          - Use functional components.`
        }
      ],
      temperature: 0.5,
      max_tokens: 4000
    };
    
    if (model) {
      requestBody.model = model;
      console.log("Using model for request:", model);
    } else {
      console.log("No specific model set, using server default");
    }
    
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
    console.log("Response content preview:", messageContent.substring(0, 200) + '...');
    
    // Skip parsing, use direct content extraction
    const extractedCode = extractCode(messageContent);
    
    // Determine language and filename based on content
    let language = 'jsx';
    let fileName = 'App.jsx';
    
    if (extractedCode.includes('tsx') || extractedCode.includes('<React.FC') || extractedCode.includes(': React.FC')) {
      language = 'tsx';
      fileName = 'App.tsx';
    }
    
    return {
      code: extractedCode,
      language,
      fileName
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
      language: 'jsx',
      fileName: 'App.jsx'
    };
  }
};
