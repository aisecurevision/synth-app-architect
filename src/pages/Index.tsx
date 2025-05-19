
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

  const handleChatSubmit = async (message: string) => {
    setIsLoading(true);

    try {
      // Add a template hint to help guide the LLM
      const enhancedPrompt = `${message}\n\nPlease create a modern React application with TypeScript, Tailwind CSS, and a clean design.`;
      
      console.log("Submitting request to generate code...");
      const response = await generateCode({ prompt: enhancedPrompt });
      setGeneratedCode(response.code);
      setCodeLanguage(response.language || "tsx");
      setFileName("App.tsx"); // Always use App.tsx 
      
      // Notify the user about successful generation
      toast.success("Application generated successfully! Check the preview.");
    } catch (error) {
      console.error("Error generating code:", error);
      
      // Show more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          toast.error("Connection failed: Is the LLM server running at http://127.0.0.1:1234?");
        } else if (error.message.includes('API error: 400')) {
          toast.error("API error: Bad request format. Check the console for details.");
        } else if (error.message.includes('No models available')) {
          toast.error("No models available from LM Studio. Please ensure you have the Qwen2.5-coder-7b-instruct model loaded.");
        } else if (error.message.includes('Generated application code is invalid')) {
          toast.error("The model generated incomplete code. Try a more specific prompt or check if Qwen2.5-coder-7b-instruct is properly loaded.");
        } else {
          toast.error(`Error: ${error.message}`);
        }
      } else {
        toast.error("Failed to generate application. Please try a different prompt.");
      }
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
