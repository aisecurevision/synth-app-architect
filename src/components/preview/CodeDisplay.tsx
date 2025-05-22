
interface CodeDisplayProps {
  code: string;
}

const CodeDisplay = ({ code }: CodeDisplayProps) => {
  // Improved formatting with better spacing, readability and basic syntax highlighting
  const formatCode = (code: string): string => {
    // First, escape HTML special characters
    let formattedCode = code
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\s{2}/g, '&nbsp;&nbsp;');
    
    // Basic syntax highlighting
    // Highlight JSX tags
    formattedCode = formattedCode.replace(/&lt;([\/]?[a-zA-Z][a-zA-Z0-9]*)/g, '<span style="color:#61dafb">&lt;$1</span>');
    
    // Highlight function declarations
    formattedCode = formattedCode.replace(/(function|const|let|var)(\s+)([a-zA-Z][a-zA-Z0-9]*)/g, 
      '<span style="color:#c792ea">$1</span>$2<span style="color:#82aaff">$3</span>');
    
    // Highlight return statements
    formattedCode = formattedCode.replace(/(return)(\s+)/g, '<span style="color:#c792ea">$1</span>$2');
    
    // Highlight strings
    formattedCode = formattedCode.replace(/(".*?"|'.*?'|`.*?`)/g, '<span style="color:#addb67">$1</span>');
    
    return formattedCode;
  };

  return (
    <div className="w-full h-full overflow-auto bg-ai-darkBg text-white p-4">
      <pre className="text-sm font-mono">
        <code dangerouslySetInnerHTML={{ __html: formatCode(code) }} />
      </pre>
    </div>
  );
};

export default CodeDisplay;
