
import { useState } from "react";
import Chat from "@/components/Chat";
import Header from "@/components/Header";
import CodePreview from "@/components/CodePreview";
import { toast } from "@/components/ui/sonner";
import { generateCode } from "@/services/apiService";

const Index = () => {
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("html");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("app.html");

  const handleChatSubmit = async (message: string) => {
    setIsLoading(true);

    try {
      const response = await generateCode({ prompt: message });
      setGeneratedCode(response.code);
      setCodeLanguage(response.language || "html");
      setFileName(response.fileName || "app.html");
    } catch (error) {
      console.error("Error generating code:", error);
      
      // Show a more specific error message for CORS issues
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        toast.error("CORS error: Cannot connect to the LLM API. Please ensure your LM Studio is running and configured to allow CORS.");
      } else {
        toast.error("Failed to generate code. Please try again.");
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
