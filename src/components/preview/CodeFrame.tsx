
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

  useEffect(() => {
    if (code && !isLoading) {
      // Reset rendering state when code changes
      setIsRendering(true);
      
      // Small delay to simulate rendering
      const timer = setTimeout(() => {
        if (iframeRef.current) {
          const iframeDoc = iframeRef.current.contentDocument || 
            (iframeRef.current.contentWindow?.document);
          
          if (iframeDoc) {
            // For React applications, create a proper HTML structure
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
      
      // Try multiple ways to find the main component
      const AppComponent = typeof App !== 'undefined' ? App : 
                          (typeof default_App !== 'undefined' ? default_App : 
                          (typeof Main !== 'undefined' ? Main :
                          (typeof DefaultApp !== 'undefined' ? DefaultApp :
                          (typeof Root !== 'undefined' ? Root : null))));
      
      if (AppComponent) {
        console.log("Rendering App component");
        try {
          root.render(React.createElement(AppComponent));
        } catch (e) {
          console.error("Error rendering App:", e);
          rootElement.innerHTML = '<div style="color: red; padding: 20px;">Error rendering the component: ' + e.message + '</div>';
        }
      } else {
        console.log("No App component found, looking for default export");
        // Try to find and execute a default export function
        try {
          // Look for default export patterns
          let match = ${code}.match(/export default (\w+)/);
          if (match && match[1]) {
            const ComponentName = match[1];
            const ExportedComponent = eval(ComponentName);
            if (typeof ExportedComponent === 'function') {
              root.render(React.createElement(ExportedComponent));
              console.log("Rendered component:", ComponentName);
            } else {
              rootElement.innerHTML = '<div style="color: red; padding: 20px;">Error: Component found but is not a function</div>';
            }
          } else {
            rootElement.innerHTML = '<div style="color: orange; padding: 20px;">Warning: No App component or default export found. Showing the raw output:</div><div style="padding: 20px;">' + rootElement.innerHTML + '</div>';
          }
        } catch (e) {
          console.error("Error finding or rendering component:", e);
          rootElement.innerHTML = '<div style="color: red; padding: 20px;">Error: ' + e.message + '</div>';
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
