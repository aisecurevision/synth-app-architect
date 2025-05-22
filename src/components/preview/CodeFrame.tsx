
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
              // Create HTML content for React preview
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
    #app {
      width: 100%;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  
  <script type="text/babel">
    ${code}
    
    // Function to check if App is a function or an object/component
    const renderApp = () => {
      if (typeof App === 'function') {
        ReactDOM.createRoot(document.getElementById('app')).render(<App />);
      } else if (App && typeof App === 'object' && App.default && typeof App.default === 'function') {
        // For ES modules format
        ReactDOM.createRoot(document.getElementById('app')).render(<App.default />);
      } else {
        document.getElementById('app').innerHTML = '<div style="color: #e53e3e; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 0.375rem; padding: 20px; margin: 20px;"><h2>Error: Could not render App component</h2><p>The code does not export a valid React component.</p></div>';
      }
    };
    
    try {
      renderApp();
    } catch (error) {
      document.getElementById('app').innerHTML = '<div style="color: #e53e3e; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 0.375rem; padding: 20px; margin: 20px;"><h2>Error Rendering Component</h2><pre>' + error.message + '</pre></div>';
      console.error("Error rendering React component:", error);
    }
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
