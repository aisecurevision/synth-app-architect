
interface GenerateCodeParams {
  prompt: string;
  templateId?: string;
}

interface GenerateCodeResponse {
  code: string;
  language: string;
  fileName?: string;
}

interface LMStudioModel {
  id: string;
  name: string;
  provider?: string;
}

const API_URL = 'http://127.0.0.1:1234/v1/chat/completions';
const MODELS_API_URL = 'http://127.0.0.1:1234/v1/models';

// Function to get available models from LM Studio
export const getAvailableModels = async (): Promise<LMStudioModel[]> => {
  try {
    const response = await fetch(MODELS_API_URL);
    
    if (!response.ok) {
      console.error(`Failed to fetch models: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching available models:', error);
    return [];
  }
};

// Function to get the first available model or use a fallback
export const getFirstAvailableModel = async (): Promise<string> => {
  try {
    const models = await getAvailableModels();
    if (models && models.length > 0) {
      return models[0].id;
    }
  } catch (error) {
    console.error('Error getting first available model:', error);
  }
  
  // Fallback model
  return "mistral-7b-instruct-v0.3";
};

export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  try {
    // Dynamically get the model name
    const modelName = await getFirstAvailableModel();
    
    // Determine if a template was selected
    const templatePrompt = params.templateId 
      ? `Use template ID ${params.templateId} as a starting point.` 
      : "Use a modern, clean template design.";
    
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: `Create a modern, responsive web application based on this description: "${params.prompt}". 
            ${templatePrompt}
            
            Return a complete React application with a Node.js Express backend.
            Structure the code with proper file organization:
            - Include a package.json with all necessary dependencies
            - Create a React frontend with components, hooks, and styling
            - Set up a simple Express backend API
            - Implement responsive design using modern CSS approaches
            
            The code should be production-ready, following best practices for React and Node.js development.
            Structure your response as a JSON object with 'code', 'language', and 'fileName' properties.
            Set language to "react-node" to indicate this is a React/Node.js project.
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
          // Extract React code directly if JSON parsing fails
          const reactMatch = messageContent.match(/```jsx\n([\s\S]*?)\n```/) ||
                           messageContent.match(/```tsx\n([\s\S]*?)\n```/) ||
                           messageContent.match(/```javascript\n([\s\S]*?)\n```/) ||
                           messageContent.match(/import React[\s\S]*/);
          
          if (reactMatch) {
            // If we find React code, use it directly
            parsedContent = {
              code: reactMatch[0] || reactMatch[1] || messageContent,
              language: 'react-node',
              fileName: 'app.jsx'
            };
          } else {
            // Fallback
            parsedContent = {
              code: messageContent,
              language: 'react-node',
              fileName: 'app.jsx'
            };
          }
        }
      } else {
        // Fallback if no structure found
        parsedContent = {
          code: messageContent,
          language: 'react-node',
          fileName: 'app.jsx'
        };
      }
    }
    
    // Ensure the code has proper React structure if it's React
    if ((parsedContent.language === 'react-node' || parsedContent.language === 'react') 
         && !parsedContent.code.includes('import React')) {
      parsedContent.code = `// React Application
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

${parsedContent.code}

// Express Backend
// server.js
/*
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
*/`;
    }
    
    return {
      code: parsedContent.code || messageContent,
      language: parsedContent.language || 'react-node',
      fileName: parsedContent.fileName || 'app.jsx'
    };
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
};
