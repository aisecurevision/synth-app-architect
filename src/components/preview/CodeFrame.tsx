
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
                // Scan for missing type definitions that might cause errors
                const typeErrors = [];
                
                if (code.includes('CalculatorState') && !code.includes('interface CalculatorState') && !code.includes('type CalculatorState')) {
                  typeErrors.push('CalculatorState type is referenced but not defined');
                }
                
                // Add a warning banner if we found type errors
                const typeErrorWarning = typeErrors.length > 0 
                  ? `
                    <div class="component-warning">
                      <h3>Type Definition Issues Detected</h3>
                      <ul>${typeErrors.map(err => `<li>${err}</li>`).join('')}</ul>
                    </div>` 
                  : '';
                
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
        height: 100vh;
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
    ${typeErrorWarning}
    
    <!-- Console logging -->
    <script>
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      console.log = (...args) => {
        originalConsoleLog(...args);
        window.parent.postMessage({ type: 'console-log', message: args.map(arg => String(arg)).join(' ') }, '*');
      };
      
      console.error = (...args) => {
        originalConsoleError(...args);
        window.parent.postMessage({ type: 'console-error', message: args.map(arg => String(arg)).join(' ') }, '*');
      };
      
      console.warn = (...args) => {
        originalConsoleWarn(...args);
        window.parent.postMessage({ type: 'console-warn', message: args.map(arg => String(arg)).join(' ') }, '*');
      };
    </script>

    <!-- Add missing type definitions that might cause errors -->
    <script type="text/babel">
      // Common type definitions that might be missing in generated code
      ${code.includes('CalculatorState') && !code.includes('interface CalculatorState') && !code.includes('type CalculatorState') ? 
        `
        // Auto-generated CalculatorState interface based on usage detection
        interface CalculatorState {
          currentValue: string;
          previousValue: string | null;
          operation: string | null;
          resetInput: boolean;
        }
        ` : ''
      }
      
      // Original app code follows
      ${code}
      
      // Render the App component to the root element
      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      
      try {
        // Multi-step approach to find the main component
        
        // Step 1: Try direct component references first
        const possibleComponents = [
          'App', 
          'default_App', 
          'Main', 
          'DefaultApp', 
          'Root',
          'Dashboard',
          'HomePage'
        ];
        
        let AppComponent = null;
        for (const name of possibleComponents) {
          if (typeof window[name] === 'function') {
            console.log("Found component:", name);
            AppComponent = window[name];
            break;
          }
        }
        
        // Step 2: If no direct components, look for default exports
        if (!AppComponent) {
          console.log("No direct component found, looking for default exports");
          
          // Parse the code for export default statements
          const exportMatch = /export\\s+default\\s+(\\w+)/.exec(${JSON.stringify(code)});
          if (exportMatch && exportMatch[1]) {
            const exportedName = exportMatch[1];
            console.log("Found default export:", exportedName);
            if (typeof window[exportedName] === 'function') {
              AppComponent = window[exportedName];
            }
          }
        }
        
        // Step 3: If all else fails, try to find any React components
        if (!AppComponent) {
          console.log("No default exports found, scanning for component functions");
          
          for (const key in window) {
            if (typeof window[key] === 'function' && 
                /^[A-Z]/.test(key) && 
                window[key].toString().includes('React')) {
              console.log("Found potential React component:", key);
              AppComponent = window[key];
              break;
            }
          }
        }
        
        // Final rendering attempt
        if (AppComponent) {
          console.log("Rendering component");
          root.render(React.createElement(AppComponent));
        } else {
          // Last resort: Create a simple component from the code
          console.log("No components found, attempting to create one from the code");
          
          // Create a wrapper component that will hold our code
          const DynamicComponent = () => {
            return (
              <div className="p-4">
                <div className="mb-4 component-warning">
                  <h2 className="text-lg font-bold mb-2">Preview Mode</h2>
                  <p>Rendering direct React code without a component export</p>
                </div>
                <div className="bg-white shadow rounded p-4">
                  {/* Insert simple UI elements based on code analysis */}
                  <h1 className="text-2xl font-bold">Application Preview</h1>
                  <p className="mt-2">This is a preview of your application. Use proper component exports for full functionality.</p>
                  <div className="mt-4 p-4 bg-gray-100 rounded">
                    <pre className="text-xs overflow-auto max-h-32">
                      {${JSON.stringify(code)}.substring(0, 500) + "..."}
                    </pre>
                  </div>
                </div>
              </div>
            );
          };
          
          root.render(React.createElement(DynamicComponent));
        }
      } catch (e) {
        console.error("Error rendering component:", e);
        rootElement.innerHTML = '<div class="component-error"><h2>Error Rendering Component</h2><pre>' + e.message + '</pre><p>Check the browser console for more details.</p></div>';
        
        // Create a simple fallback UI
        const ErrorComponent = () => (
          <div className="p-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <h2 className="font-bold">Error Rendering Component</h2>
              <p className="mb-2">{e.message}</p>
              <p className="text-sm">Check the browser console for more details.</p>
            </div>
          </div>
        );
        
        try {
          root.render(React.createElement(ErrorComponent));
        } catch {
          // Last resort if React rendering completely fails
        }
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
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Code Preview"
      />
    </div>
  );
};

export default CodeFrame;
