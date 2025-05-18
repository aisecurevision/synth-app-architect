
import { useState, useEffect } from "react";
import Chat from "@/components/Chat";
import Header from "@/components/Header";
import CodePreview from "@/components/CodePreview";
import { toast } from "@/components/ui/sonner";
import { generateCode, getAvailableModels } from "@/services/apiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

// Template definitions
const TEMPLATES = [
  { id: "default", name: "Default (Clean)", description: "A clean, minimalist design" },
  { id: "portfolio", name: "Portfolio", description: "Perfect for showcasing work and projects" },
  { id: "business", name: "Business", description: "Professional design for companies and services" },
  { id: "blog", name: "Blog", description: "Content-focused design for writers and bloggers" },
  { id: "ecommerce", name: "E-Commerce", description: "Online store layout with product displays" },
  { id: "landing", name: "Landing Page", description: "High-conversion design for product launches" },
];

const Index = () => {
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("react-node");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("app.jsx");
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("chat");

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await getAvailableModels();
        setAvailableModels(models.map(model => model.id));
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    };
    
    fetchModels();
  }, []);

  const handleChatSubmit = async (message: string) => {
    setIsLoading(true);

    try {
      // Add template information to the prompt
      const enhancedPrompt = `${message}\n\nPlease create a responsive, modern React application.`;
      
      const response = await generateCode({ 
        prompt: enhancedPrompt,
        templateId: selectedTemplate !== "default" ? selectedTemplate : undefined
      });
      
      setGeneratedCode(response.code);
      setCodeLanguage(response.language || "react-node");
      setFileName(response.fileName || "app.jsx");
      
      // Automatically switch to preview tab after generation
      setActiveTab("preview");
      
      // Notify the user about successful generation
      toast.success("Application generated successfully! Check the preview.");
    } catch (error) {
      console.error("Error generating code:", error);
      
      // Show more specific error messages
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        toast.error("CORS error: Cannot connect to the LLM API. Please ensure your LM Studio is running and configured to allow CORS.");
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error("Connection failed: Is the LLM server running at http://127.0.0.1:1234?");
      } else if (error instanceof Error && error.message.includes('API error: 400')) {
        toast.error("API error: Bad request format. Check the console for details.");
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-1/2 h-full border-r border-border">
          <TabsList className="bg-ai-darkPanel border-b border-border w-full rounded-none justify-start">
            <TabsTrigger value="chat" className="data-[state=active]:bg-ai-darkBg">Chat</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-ai-darkBg">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="h-full m-0 p-0 border-none">
            <Chat onSubmit={handleChatSubmit} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="templates" className="h-full overflow-auto p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Choose a Template</h2>
              <p className="text-gray-400 mb-4">Select a template as the starting point for your application</p>
              
              <Select 
                value={selectedTemplate} 
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {TEMPLATES.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:border-ai-purple ${selectedTemplate === template.id ? 'border-ai-purple bg-ai-darkPanel' : 'border-border bg-ai-darkBg'}`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-400">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
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
