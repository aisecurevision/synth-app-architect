
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
            iframeDoc.write(code);
            iframeDoc.close();
            setIsRendering(false);
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setIsRendering(true);
    }
  }, [code, isLoading, viewMode]);

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
          <span className="text-xs text-ai-grayText ml-2">Preview</span>
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
