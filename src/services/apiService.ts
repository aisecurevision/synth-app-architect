
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
  // Simple extraction without JSON parsing
  if (text.includes('import React') || text.includes('function App') || text.includes('const App')) {
    // If it looks like code, return it directly
    return text;
  }
  
  // Basic fallback if the text doesn't appear to be code
  return `
import { createApp, ref } from 'vue';

export default {
  setup() {
    const message = ref('Application generated successfully');
    
    return {
      message
    }
  },
  template: \`
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Simple Application</h1>
        <p class="text-gray-600 mb-4">{{ message }}</p>
      </div>
    </div>
  \`
}`;
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
          content: `You are an expert Vue.js developer specializing in creating modern, production-ready Vue applications.
          You'll be generating complete code for a responsive application based on the user's description.
          
          IMPORTANT GUIDELINES:
          1. Return fully functional Vue.js code with actual UI components and content, not just placeholder text.
          2. The code must render properly when evaluated in a browser environment.
          3. ALWAYS use proper TypeScript types if applicable.
          4. DO NOT return the code in a JSON format, markdown, or wrapped in code blocks.
          5. Just provide the raw code directly.
          6. DO NOT use React, Angular, or any other framework, ONLY Vue.js.
          7. Use Tailwind CSS for styling.
          
          FORMAT YOUR RESPONSE AS CLEAN CODE WITHOUT ANY WRAPPERS:
          Just provide the complete Vue.js application code directly.
          Start with imports and setup code.`
        },
        {
          role: "user",
          content: `Create a modern, production-grade web application based on this description: "${params.prompt}".

          Tech Stack Requirements:
          - Frontend: Vue.js (version 3) with TypeScript
          - Styling: Tailwind CSS
          
          The application should include:
          - Modern, responsive layout
          - Actual content and functioning components (NOT just placeholders)
          - Well-organized code
          
          IMPORTANT: 
          - Return ONLY the code, not wrapped in JSON or markdown.`
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
    
    // Skip parsing, use direct content extraction
    const extractedCode = extractCode(messageContent);
    
    // Determine language based on content
    const language = extractedCode.includes('<script lang="ts">') ? 'ts' : 'js';
    const fileName = language === 'ts' ? 'App.vue' : 'App.vue';
    
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
<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">Error Generating Application</h1>
      <p class="text-gray-600 mb-4">
        ${error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred'}
      </p>
      <div class="bg-gray-50 rounded p-4 text-sm text-gray-800">
        <p class="font-medium mb-2">Troubleshooting tips:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Check your LLM server connection</li>
          <li>Verify your API endpoint configuration</li>
          <li>Try a simpler or more specific prompt</li>
          <li>Ensure your LLM model is properly loaded</li>
        </ul>
      </div>
    </div>
  </div>
</template>`,
      language: 'vue',
      fileName: 'App.vue'
    };
  }
};
