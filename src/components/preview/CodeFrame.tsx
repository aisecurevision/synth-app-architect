
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
              // Directly render HTML content based on language
              let htmlContent = code;

              // If it's Vue.js code
              if (language === 'vue' || code.includes('<template>')) {
                htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vue App Preview</title>
    <!-- Vue.js 3 -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
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
    
    <script>
    const appCode = \`${code.replace(/`/g, '\\`')}\`;
    
    // Create and mount app
    try {
      // For component style code
      if (appCode.includes('<template>')) {
        const app = Vue.createApp({
          template: appCode.match(/<template>([\s\S]*?)<\/template>/)?.[1] || '<div>Failed to extract template</div>',
          setup() {
            return {};
          }
        });
        app.mount('#app');
      } 
      // For setup API style code
      else {
        const app = Vue.createApp(eval('(' + appCode + ')'));
        app.mount('#app');
      }
    } catch (error) {
      document.getElementById('app').innerHTML = 
        '<div style="color: #e53e3e; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 0.375rem; padding: 20px; margin: 20px;">' +
        '<h2>Error Rendering Component</h2><pre>' + error.message + '</pre></div>';
      console.error("Error rendering Vue component:", error);
    }
    </script>
</body>
</html>`;
              } 
              // If it's JavaScript/TypeScript code (not React)
              else if (!code.includes('import React')) {
                htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Preview</title>
    <!-- TailwindCSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        line-height: 1.5;
        margin: 0;
        padding: 0;
      }
    </style>
</head>
<body>
    <div id="app" class="min-h-screen"></div>
    
    <script>
    // Direct rendering without parsing
    try {
      ${code}
      
      // Call initialize function if exists
      if (typeof init === 'function') {
        init(document.getElementById('app'));
      } else if (typeof main === 'function') {
        main(document.getElementById('app'));
      }
    } catch (error) {
      document.getElementById('app').innerHTML = 
        '<div style="color: #e53e3e; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 0.375rem; padding: 20px; margin: 20px;">' +
        '<h2>Error Rendering Application</h2><pre>' + error.message + '</pre></div>';
      console.error("Error rendering application:", error);
    }
    </script>
</body>
</html>`;
              }
              // Default case (for React code - fallback)
              else {
                htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        margin: 0;
        font-family: 'Inter', system-ui, sans-serif;
      }
    </style>
</head>
<body>
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-lg font-semibold text-red-600 mb-2">Preview Unavailable</h2>
        <p class="text-gray-700">
          The generated code appears to be React-based, but the preview is configured for Vue.js applications.
        </p>
        <p class="text-sm mt-3 text-gray-500">
          Try asking for a Vue.js application in your prompt.
        </p>
      </div>
    </div>
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
