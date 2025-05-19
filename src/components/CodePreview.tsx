
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Code, Eye, Copy, Check } from "lucide-react";
import LoadingIndicator from "./LoadingIndicator";
import { toast } from "@/components/ui/sonner";

interface CodePreviewProps {
  code: string;
  language: string;
  fileName?: string;
  isLoading?: boolean;
}

const CodePreview = ({ code, language, fileName = "App.tsx", isLoading = false }: CodePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (code && !isLoading && viewMode === "preview") {
      // Small delay to simulate rendering
      const timer = setTimeout(() => {
        if (iframeRef.current) {
          const iframeDoc = iframeRef.current.contentDocument || 
            (iframeRef.current.contentWindow?.document);
          
          if (iframeDoc) {
            // For React applications, we need to create a proper HTML structure
            // that includes required scripts and root element
            const isReactApp = language === 'jsx' || language === 'tsx';
            
            let htmlContent = code;

            // If it's a React app but the code doesn't include full HTML structure
            if (isReactApp && !code.includes('<!DOCTYPE html>')) {
              htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App Preview</title>
    <!-- React dependencies -->
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <!-- Babel for JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- TailwindCSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#9b87f5',
              secondary: '#7E69AB',
            }
          }
        },
        plugins: [
          // DaisyUI-like utility classes
          function({ addComponents }) {
            addComponents({
              '.card': {
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              '.btn': {
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              '.btn-primary': {
                backgroundColor: '#9b87f5',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#7E69AB',
                },
              },
            })
          }
        ]
      }
    </script>
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
      }
      #root {
        width: 100%;
      }
    </style>
</head>
<body>
    <div id="root"></div>
    <!-- React component script -->
    <script type="text/babel">
      ${code}
      
      // Render the App component to the root element
      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      root.render(<App />);
    </script>
</body>
</html>`;
            }

            iframeDoc.open();
            iframeDoc.write(htmlContent);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Code copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy code:", err);
        toast.error("Failed to copy code.");
      });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between bg-ai-darkPanel p-3 rounded-t-lg border-b border-border">
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-red-500 opacity-75 mr-2"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500 opacity-75 mr-2"></div>
          <div className="h-3 w-3 rounded-full bg-green-500 opacity-75 mr-2"></div>
          <span className="text-xs text-ai-grayText ml-2">{fileName}</span>
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
            onClick={handleCopy}
            disabled={!code || isLoading}
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
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
