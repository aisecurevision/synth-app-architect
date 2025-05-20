
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
        return JSON.parse(jsonBlockMatch[1]);
      }
      
      // Method 3: Look for { ... } pattern that spans multiple lines
      const jsonMatch = text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Method 4: Extract code from a code block if JSON extraction failed
      const codeBlockMatch = text.match(/```(?:tsx|jsx|javascript|react|ts)\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        return {
          code: codeBlockMatch[1],
          language: 'tsx',
          fileName: 'App.tsx'
        };
      }
      
      // Method 5: Check if the entire response is React code
      if (text.includes('import React') || text.includes('function App') || text.includes('const App')) {
        return {
          code: text,
          language: text.includes('interface') || text.includes(': React.') ? 'tsx' : 'jsx',
          fileName: 'App.tsx'
        };
      }

      throw new Error("Could not extract valid JSON or code from the response");
    } catch (extractionError) {
      console.error("All JSON extraction methods failed:", extractionError);
      throw new Error("Failed to parse API response: " + extractionError.message);
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
          content: `You are an expert React developer specializing in creating modern, production-ready web applications.
          You'll be generating complete code for a responsive application based on the user's description.
          IMPORTANT: Always return fully functional React code with actual UI components and content, not just placeholder text.
          The code must render properly when evaluated in a browser environment.`
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
          
          Do not include any explanations or markdown, just the JSON object with the complete application code.`
        }
      ],
      temperature: 0.5,
      max_tokens: 4000 // Reduced to avoid very large responses that might cause parsing issues
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
    
    // Use our enhanced JSON extraction function
    const parsedContent = extractJsonFromText(messageContent);
    
    // Validate the extracted content
    if (!parsedContent.code || typeof parsedContent.code !== 'string') {
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
    throw error;
  }
};
