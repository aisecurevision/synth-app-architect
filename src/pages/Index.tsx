
import { useState } from "react";
import Chat from "@/components/Chat";
import Header from "@/components/Header";
import CodePreview from "@/components/CodePreview";
import { toast } from "@/components/ui/sonner";
import { generateCode } from "@/services/apiService";

const Index = () => {
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("tsx");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("App.tsx");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleChatSubmit = async (message: string) => {
    setIsLoading(true);
    setErrorDetails(null);

    try {
      // Add a template hint to help guide the LLM
      const enhancedPrompt = `${message}\n\nPlease create a modern React application with TypeScript, Tailwind CSS, and a clean design. Include ACTUAL CONTENT in the application, not just placeholder text. The application must render properly and have visual elements.`;
      
      console.log("Submitting request to generate code...");
      const response = await generateCode({ prompt: enhancedPrompt });
      setGeneratedCode(response.code);
      setCodeLanguage(response.language || "tsx");
      setFileName("App.tsx"); // Always use App.tsx 
      
      // Notify the user about successful generation
      toast.success("Application generated successfully! Check the preview.");
    } catch (error) {
      console.error("Error generating code:", error);
      
      // Store error details for possible debugging
      setErrorDetails(error instanceof Error ? error.message : "Unknown error");
      
      // Show more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          toast.error("Connection failed: Is the LLM server running at http://127.0.0.1:1234?");
        } else if (error.message.includes('API error: 400')) {
          toast.error("API error: Bad request format. Check the console for details.");
        } else if (error.message.includes('No models available')) {
          toast.error("No models available from LM Studio. Please ensure you have a model like Qwen2.5-coder-7b-instruct loaded.");
        } else if (error.message.includes('Generated application code is invalid')) {
          toast.error("The model generated incomplete code. Try a more specific prompt or check your LM Studio settings.");
        } else if (error.message.includes('Failed to parse API response')) {
          toast.error("Failed to parse the API response. The model output may be in an incorrect format.");
        } else {
          toast.error(`Error: ${error.message}`);
        }
      } else {
        toast.error("Failed to generate application. Please try a different prompt.");
      }
      
      // Set a fallback simple React component so the preview isn't blank
      setGeneratedCode(`
import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Error Generating Application</h2>
        <p className="text-gray-600 mb-4 text-center">
          ${errorDetails || "There was an error generating your application. Please try again with a different prompt."}
        </p>
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <h3 className="font-medium text-sm text-gray-700 mb-1">Troubleshooting Tips:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Check if LM Studio is running at http://127.0.0.1:1234</li>
            <li>Ensure Qwen2.5-coder-7b-instruct model is loaded</li>
            <li>Try a shorter, more specific prompt</li>
            <li>Check console logs for more details</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
      `);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-ai-darkBg text-white">
      <Header />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div className="w-full lg:w-1/2 h-full border-r border-border">
          <Chat onSubmit={handleChatSubmit} isLoading={isLoading} />
        </div>
        
        {/* Code Preview */}
        <div className="hidden lg:block lg:w-1/2 h-full p-4">
          <CodePreview 
            code={generatedCode} 
            language={codeLanguage}
            fileName={fileName}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Mobile View for Preview */}
      <div className="lg:hidden w-full p-4 border-t border-border">
        <h2 className="text-lg font-medium mb-2 text-gradient">Preview</h2>
        <div className="h-64">
          <CodePreview 
            code={generatedCode} 
            language={codeLanguage}
            fileName={fileName}
            isLoading={isLoading} 
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
