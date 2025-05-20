
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Code, Eye, Copy, Check } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface PreviewHeaderProps {
  fileName: string;
  viewMode: "preview" | "code";
  setViewMode: (mode: "preview" | "code") => void;
  code: string;
  isLoading: boolean;
}

const PreviewHeader = ({ 
  fileName, 
  viewMode, 
  setViewMode, 
  code, 
  isLoading 
}: PreviewHeaderProps) => {
  const [copied, setCopied] = useState(false);
  
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
          className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
          onClick={handleCopy}
          disabled={!code || isLoading}
        >
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="bg-ai-purple hover:bg-ai-purple/90"
          onClick={handleDownload}
          disabled={!code || isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default PreviewHeader;
