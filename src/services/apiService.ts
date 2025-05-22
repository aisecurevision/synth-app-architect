
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
  if (text.includes('function App') || 
      text.includes('const App')) {
    return text;
  }
  
  // If there are HTML-like tags, it's probably JSX
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    return text;
  }
  
  // Basic fallback if the text doesn't appear to be code
  return `
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;
}

// Process code to make it ready for browser execution
const formatCodeForBrowserExecution = (code: string): string => {
  // Remove import statements as they're not needed
  code = code.replace(/import\s+.*from\s+['"].*['"]\s*;?\s*\n?/g, '');
  
  // Remove export default statements as they're not needed
  code = code.replace(/export\s+default\s+\w+\s*;?\s*\n?/g, '');
  
  // If no render call exists, add one for App component
  if (!code.includes('ReactDOM.createRoot') && !code.includes('ReactDOM.render')) {
    code += `\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;
  }
  
  return code;
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
          1. Write React code that can run directly in the browser with Babel.
          2. DO NOT include any import or export statements.
          3. DO NOT use modules - the code must work directly in a browser environment.
          4. Define a component named App and render it with ReactDOM.createRoot().
          5. Use proper JavaScript or TypeScript for the component.
          6. Always end your code with: const root = ReactDOM.createRoot(document.getElementById('root')); root.render(<App />);
          7. Use Tailwind CSS for styling (available in the browser).
          8. Return fully functional React code with actual UI components and content, not placeholders.
          9. The code must render in a browser without any build step.
          
          FORMAT YOUR RESPONSE AS CLEAN CODE WITHOUT ANY WRAPPERS:
          Just provide the complete React code that can run directly in the browser.`
        },
        {
          role: "user",
          content: `Create a modern, responsive React application that can run directly in the browser based on this description: "${params.prompt}".

          Technical Requirements:
          - NO import statements
          - NO export statements
          - Define a component named App
          - End with ReactDOM.createRoot and render call
          - Use Tailwind CSS for styling (it's available)
          - Implement actual functionality, not just placeholders
          - DO NOT use any external libraries that would need to be imported
          
          IMPORTANT: 
          - Return ONLY the code, not wrapped in markdown or anything else.
          - Must run directly in browser with Babel transform.
          - Include the root.render(<App />) line at the end.`
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
    let extractedCode = extractCode(messageContent);
    
    // Format the code for direct browser execution
    extractedCode = formatCodeForBrowserExecution(extractedCode);
    
    // Determine language and filename based on content
    let language = 'jsx';
    let fileName = 'App.jsx';
    
    if (extractedCode.includes(':') && extractedCode.includes('React.FC')) {
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
function App() {
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
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,
      language: 'jsx',
      fileName: 'App.jsx'
    };
  }
};
