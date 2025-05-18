
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Code, Eye } from "lucide-react";
import LoadingIndicator from "./LoadingIndicator";
import { toast } from "@/components/ui/sonner";

interface CodePreviewProps {
  code: string;
  language: string;
  fileName?: string;
  isLoading?: boolean;
}

const CodePreview = ({ code, language, fileName = "generated-app.html", isLoading = false }: CodePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  useEffect(() => {
    if (code && !isLoading && viewMode === "preview") {
      // Small delay to simulate rendering
      const timer = setTimeout(() => {
        if (iframeRef.current) {
          const iframeDoc = iframeRef.current.contentDocument || 
            (iframeRef.current.contentWindow?.document);
          
          if (iframeDoc) {
            iframeDoc.open();
            
            // Determine how to render based on language
            if (language === "html") {
              // For HTML, just write the code directly
              iframeDoc.write(code);
            } else if (language === "react-node" || language === "react") {
              // For React code, create a preview with Babel standalone
              iframeDoc.write(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>React App Preview</title>
                  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
                  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
                  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                  <style>
                    body {
                      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      line-height: 1.6;
                      color: #333;
                      margin: 0;
                      padding: 0;
                    }
                    .container {
                      width: 100%;
                      max-width: 1200px;
                      margin: 0 auto;
                      padding: 2rem;
                    }
                    .app-preview {
                      padding: 20px;
                      background: #f5f5f5;
                      border-radius: 8px;
                    }
                    .app-preview h1 {
                      margin-top: 0;
                    }
                    .app-info {
                      background: #e9f7fe;
                      padding: 15px;
                      border-radius: 6px;
                      margin-bottom: 20px;
                      border-left: 4px solid #3b82f6;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="app-info">
                      <h2>React Application Preview</h2>
                      <p>This is a simplified preview. In a full environment, this would be a complete React application.</p>
                    </div>
                    <div class="app-preview">
                      <div id="root"></div>
                    </div>
                  </div>
                  <script type="text/babel">
                    // Extract React component code
                    ${code}
                    
                    // Try to find and render a component
                    try {
                      // Look for exported components or functions that might be components
                      const componentNames = Object.keys(window).filter(key => 
                        typeof window[key] === 'function' && 
                        /^[A-Z]/.test(key) &&
                        !['React', 'ReactDOM'].includes(key)
                      );
                      
                      if (componentNames.length > 0) {
                        // Use the first component found
                        const ComponentToRender = window[componentNames[0]];
                        ReactDOM.createRoot(document.getElementById('root')).render(<ComponentToRender />);
                      } else {
                        // Fallback message
                        ReactDOM.createRoot(document.getElementById('root')).render(
                          <div>
                            <h1>React Application</h1>
                            <p>This is a preview of your React application.</p>
                            <p>See the code view for the full source code.</p>
                          </div>
                        );
                      }
                    } catch (error) {
                      // Handle errors gracefully
                      ReactDOM.createRoot(document.getElementById('root')).render(
                        <div>
                          <h1>Preview Error</h1>
                          <p>There was an error rendering the preview:</p>
                          <pre style={{ background: '#fff3f3', padding: '10px', borderRadius: '4px' }}>
                            {error.message}
                          </pre>
                          <p>See the code view for the full source.</p>
                        </div>
                      );
                    }
                  </script>
                </body>
                </html>
              `);
            }
            
            iframeDoc.close();
            setIsRendering(false);
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setIsRendering(true);
    }
  }, [code, isLoading, viewMode, language]);

  const handleDownload = () => {
    try {
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Code downloaded successfully!");
    } catch (error) {
      console.error("Failed to download code:", error);
      toast.error("Failed to download code.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between bg-ai-darkPanel p-3 rounded-t-lg border-b border-border">
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-red-500 opacity-75 mr-2"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500 opacity-75 mr-2"></div>
          <div className="h-3 w-3 rounded-full bg-green-500 opacity-75 mr-2"></div>
          <span className="text-xs text-ai-grayText ml-2">
            {language === "react-node" ? "React + Node.js" : language.charAt(0).toUpperCase() + language.slice(1)}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="bg-ai-darkBg rounded-md overflow-hidden flex">
            <Button 
              variant={viewMode === "preview" ? "default" : "outline"}
              size="sm" 
              className={`rounded-r-none ${viewMode === "preview" ? "" : "bg-transparent border-white/10 hover:bg-white/5"}`}
              onClick={() => setViewMode("preview")}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant={viewMode === "code" ? "default" : "outline"}
              size="sm" 
              className={`rounded-l-none ${viewMode === "code" ? "" : "bg-transparent border-white/10 hover:bg-white/5"}`}
              onClick={() => setViewMode("code")}
            >
              <Code className="h-4 w-4 mr-2" />
              Code
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-transparent border-white/10 hover:bg-white/5"
            onClick={handleDownload}
            disabled={!code || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-white rounded-b-lg overflow-hidden">
        {(isLoading || (isRendering && viewMode === "preview")) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ai-darkBg bg-opacity-90 z-10">
            <LoadingIndicator className="mb-4" />
            <p className="text-sm text-ai-grayText">
              {isLoading ? "Generating your application..." : "Rendering preview..."}
            </p>
          </div>
        )}
        
        {viewMode === "preview" ? (
          <iframe 
            ref={iframeRef}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Code Preview"
          />
        ) : (
          <div className="w-full h-full overflow-auto bg-ai-darkBg text-white p-4">
            <pre className="text-sm">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePreview;
