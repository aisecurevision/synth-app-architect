
import { useEffect, useRef, useState } from "react";
import LoadingIndicator from "@/components/LoadingIndicator";

interface CodeFrameProps {
  code: string;
  language: string;
  isLoading: boolean;
}

const CodeFrame = ({ code, language, isLoading }: CodeFrameProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (code && !isLoading) {
      // Reset rendering state when code changes
      setIsRendering(true);
      setRenderError(null);
      
      // Small delay to simulate rendering
      const timer = setTimeout(() => {
        if (iframeRef.current) {
          const iframeDoc = iframeRef.current.contentDocument || 
            (iframeRef.current.contentWindow?.document);
          
          if (iframeDoc) {
            try {
              // Create HTML content for direct React preview without module exports
              const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App Preview</title>
  <!-- React -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <!-- Babel for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- TailwindCSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      line-height: 1.5;
    }
    #root {
      width: 100%;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="text/babel">
    ${code}
  </script>
</body>
</html>`;

              iframeDoc.open();
              iframeDoc.write(htmlContent);
              iframeDoc.close();
              setIsRendering(false);
            } catch (error) {
              console.error("Error rendering iframe content:", error);
              setRenderError(error instanceof Error ? error.message : "Unknown error rendering content");
              setIsRendering(false);
            }
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [code, isLoading, language]);

  return (
    <div className="w-full h-full relative">
      {isRendering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ai-darkBg bg-opacity-90 z-10">
          <LoadingIndicator className="mb-4" />
          <p className="text-sm text-ai-grayText">Rendering preview...</p>
        </div>
      )}
      
      {renderError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ai-darkBg bg-opacity-90 z-10">
          <div className="bg-red-900/50 p-4 rounded-md max-w-md">
            <h3 className="text-red-300 font-medium mb-2">Error Rendering Preview</h3>
            <p className="text-sm text-ai-grayText">{renderError}</p>
          </div>
        </div>
      )}
      
      <iframe 
        ref={iframeRef}
        className="w-full h-full border-none bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Code Preview"
      />
    </div>
  );
};

export default CodeFrame;
