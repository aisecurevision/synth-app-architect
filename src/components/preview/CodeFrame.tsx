
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
              // For React applications, create a proper HTML structure
              const isReactApp = language === 'jsx' || language === 'tsx';
              
              let htmlContent = code;

              // If it's a React app but the code doesn't include full HTML structure
              if (isReactApp && !code.includes('<!DOCTYPE html>')) {
                // Preprocess the code to fix potential issues
                const processedCode = code
                  // Define missing types automatically
                  .replace(/\bimport\s+{\s*Button\s*}\s+from\s+['"]@material-ui\/core['"]/g, 
                    "// Using Tailwind button instead of Material UI\n")
                  // Replace Material UI components with basic HTML + Tailwind
                  .replace(/<Button/g, '<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"')
                  .replace(/<\/Button>/g, '</button>')
                  .replace(/color="primary"/g, 'className="text-blue-500"')
                  .replace(/variant="contained"/g, 'className="bg-blue-500 text-white px-4 py-2 rounded"');
                
                // Auto-generate common TypeScript interfaces based on usage
                let typeDefinitions = '';
                
                // Detect and add missing interfaces
                if (code.includes('CalculatorState') && 
                   !code.includes('interface CalculatorState') && 
                   !code.includes('type CalculatorState')) {
                  typeDefinitions += `
                    interface CalculatorState {
                      currentValue: string;
                      previousValue: string | null;
                      operation: string | null;
                      resetInput: boolean;
                    }
                  `;
                }
                
                // Add interface for common components
                if (code.includes('AppProps') && 
                   !code.includes('interface AppProps') && 
                   !code.includes('type AppProps')) {
                  typeDefinitions += `
                    interface AppProps {}
                  `;
                }
                
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
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              primary: '#9b87f5',
              secondary: '#7E69AB',
              background: '#f8fafc',
              foreground: '#1f2937',
              muted: '#f1f5f9',
              'muted-foreground': '#64748b',
              border: '#e2e8f0',
              input: '#e2e8f0',
              card: '#ffffff',
              'card-foreground': '#1f2937',
            }
          }
        },
        plugins: [],
      }
    </script>
    <style>
      body {
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
      }
      #root {
        width: 100%;
        min-height: 100vh;
      }
      .component-error {
        padding: 20px;
        color: #e53e3e;
        background-color: #fff5f5;
        border: 1px solid #fed7d7;
        border-radius: 0.375rem;
        margin: 20px;
      }
      .component-warning {
        padding: 20px;
        color: #dd6b20;
        background-color: #fffaf0;
        border: 1px solid #feebc8;
        border-radius: 0.375rem;
        margin: 20px;
      }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script type="text/babel">
      // Auto-generated type definitions
      ${typeDefinitions}
      
      // Process imports to compatibility with in-browser React
      ${processedCode}

      // Render the App component to the root element
      try {
        const rootElement = document.getElementById('root');
        const root = ReactDOM.createRoot(rootElement);
        
        // Find the component to render
        let AppComponent = null;
        
        // Try different ways to find the main component
        if (typeof App !== 'undefined') {
          AppComponent = App;
        } else if (typeof default_App !== 'undefined') {
          AppComponent = default_App;
        } else {
          // Look for any exported component
          for (const key in window) {
            if (typeof window[key] === 'function' && 
                /^[A-Z]/.test(key) && // Component names start with capital letter
                key !== 'React' && 
                key !== 'ReactDOM') {
              AppComponent = window[key];
              break;
            }
          }
        }
        
        if (AppComponent) {
          root.render(React.createElement(AppComponent));
        } else {
          rootElement.innerHTML = '<div class="component-error"><h2>Error: No React component found</h2><p>Make sure your code exports a React component.</p></div>';
        }
      } catch (error) {
        document.getElementById('root').innerHTML = '<div class="component-error"><h2>Error Rendering Component</h2><pre>' + error.message + '</pre></div>';
        console.error("Error rendering component:", error);
      }
    </script>
</body>
</html>`;
              }

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
