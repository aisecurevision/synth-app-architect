
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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

  useEffect(() => {
    if (code && !isLoading) {
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
  }, [code, isLoading]);

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

      <div className="flex-1 relative bg-white rounded-b-lg overflow-hidden">
        {(isLoading || isRendering) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ai-darkBg bg-opacity-90 z-10">
            <LoadingIndicator className="mb-4" />
            <p className="text-sm text-ai-grayText">
              {isLoading ? "Generating your application..." : "Rendering preview..."}
            </p>
          </div>
        )}
        <iframe 
          ref={iframeRef}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Code Preview"
        />
      </div>
    </div>
  );
};

export default CodePreview;
