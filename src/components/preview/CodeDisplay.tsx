
interface CodeDisplayProps {
  code: string;
}

const CodeDisplay = ({ code }: CodeDisplayProps) => {
  // Function to add syntax highlighting classes
  const highlightSyntax = (code: string): string => {
    // Very basic syntax highlighting for demonstration
    // In a real app, you'd use a library like Prism.js or highlight.js
    return code
      .replace(/import\s+/g, '<span style="color: #c678dd;">import </span>')
      .replace(/from\s+/g, '<span style="color: #c678dd;">from </span>')
      .replace(/export\s+/g, '<span style="color: #c678dd;">export </span>')
      .replace(/const\s+/g, '<span style="color: #c678dd;">const </span>')
      .replace(/function\s+/g, '<span style="color: #c678dd;">function </span>')
      .replace(/return\s+/g, '<span style="color: #c678dd;">return </span>')
      .replace(/(["'`][^"'`]*["'`])/g, '<span style="color: #98c379;">$1</span>')
      .replace(/(\{|\}|\(|\)|\[|\])/g, '<span style="color: #d19a66;">$1</span>');
  };

  return (
    <div className="w-full h-full overflow-auto bg-ai-darkBg text-white p-4">
      <pre className="text-sm">
        <code dangerouslySetInnerHTML={{ __html: highlightSyntax(code) }} />
      </pre>
    </div>
  );
};

export default CodeDisplay;
