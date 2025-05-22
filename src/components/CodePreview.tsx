
import { useState } from "react";
import PreviewHeader from "./preview/PreviewHeader";
import CodeFrame from "./preview/CodeFrame";
import CodeDisplay from "./preview/CodeDisplay";
import LoadingOverlay from "./preview/LoadingOverlay";

interface CodePreviewProps {
  code: string;
  language: string;
  fileName?: string;
  isLoading?: boolean;
}

const CodePreview = ({ 
  code, 
  language, 
  fileName = "App.jsx", 
  isLoading = false 
}: CodePreviewProps) => {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden shadow-lg">
      <PreviewHeader 
        fileName={fileName}
        viewMode={viewMode}
        setViewMode={setViewMode}
        code={code}
        isLoading={isLoading}
      />

      <div className="flex-1 relative bg-white rounded-b-lg overflow-hidden">
        {isLoading && (
          <LoadingOverlay 
            message="Generating your application..." 
            subMessage="Please wait while we communicate with your LLM model..."
          />
        )}
        
        {viewMode === "preview" ? (
          <CodeFrame 
            code={code}
            language={language}
            isLoading={isLoading}
          />
        ) : (
          <CodeDisplay code={code} />
        )}
      </div>
    </div>
  );
};

export default CodePreview;
