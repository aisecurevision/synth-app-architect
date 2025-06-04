
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
  // Look for code blocks first
  const codeBlockMatch = text.match(/```(?:jsx?|tsx?|javascript|typescript)?\s*([\s\S]+?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  
  // If it contains function App or const App, it's probably React code
  if (text.includes('function App') || text.includes('const App')) {
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
  // Remove import statements as they're not needed in browser
  code = code.replace(/import\s+.*from\s+['"].*['"]\s*;?\s*\n?/g, '');
  
  // Remove export default statements
  code = code.replace(/export\s+default\s+\w+\s*;?\s*\n?/g, '');
  
  // Remove any remaining export statements
  code = code.replace(/export\s+\{[^}]*\}\s*;?\s*\n?/g, '');
  
  // Ensure we have a proper App function
  if (!code.includes('function App') && !code.includes('const App')) {
    // If no App function, wrap the JSX in one
    if (code.includes('<') && code.includes('>')) {
      code = `function App() {\n  return (\n    ${code}\n  );\n}`;
    }
  }
  
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
          content: `You are an expert React developer creating React applications that run directly in the browser.

CRITICAL REQUIREMENTS:
1. Generate ONLY React JSX code that works with Babel in-browser compilation
2. DO NOT include any import or export statements
3. Define a function named "App" that returns JSX
4. End with: const root = ReactDOM.createRoot(document.getElementById('root')); root.render(<App />);
5. Use modern React patterns (hooks, functional components)
6. Use Tailwind CSS for styling (it's available)
7. Create REAL, functional UI with actual content and interactivity
8. NO placeholder text - build actual working features

EXAMPLE FORMAT:
function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Counter App</h1>
        <p className="mb-4">Count: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Increment
        </button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

Return ONLY the code, no explanations or markdown.`
        },
        {
          role: "user",
          content: `Create a React application based on: "${params.prompt}". 

Requirements:
- NO imports/exports 
- Function named App
- Use React hooks with React.useState, React.useEffect syntax
- End with ReactDOM.createRoot and render
- Use Tailwind CSS classes
- Build actual working features, not placeholders
- Make it visually appealing and functional

Return only the code that will run in browser with Babel.`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    };
    
    if (model) {
      requestBody.model = model;
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
    
    if (!data?.choices?.[0]?.message?.content) {
      console.error("Invalid API response structure:", data);
      throw new Error("Invalid API response structure");
    }
    
    const messageContent = data.choices[0].message.content;
    console.log("Generated code preview:", messageContent.substring(0, 200));
    
    // Extract and format the code
    let extractedCode = extractCode(messageContent);
    extractedCode = formatCodeForBrowserExecution(extractedCode);
    
    console.log("Final formatted code preview:", extractedCode.substring(0, 200));
    
    return {
      code: extractedCode,
      language: 'jsx',
      fileName: 'App.jsx'
    };
  } catch (error) {
    console.error('Error generating code:', error);
    
    // Return a working fallback component
    return {
      code: `function App() {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-red-200">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-red-600 text-xl">⚠</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Generation Error</h1>
        </div>
        <p className="text-gray-600 mb-4">
          ${error instanceof Error ? error.message.replace(/"/g, '\\"') : 'Failed to generate application'}
        </p>
        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
          <p className="font-medium mb-2">Troubleshooting:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Check LLM server connection</li>
            <li>Verify API endpoint is correct</li>
            <li>Try a simpler prompt</li>
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
