
interface CodeDisplayProps {
  code: string;
}

const CodeDisplay = ({ code }: CodeDisplayProps) => {
  // Direct display without complex syntax highlighting
  const formatCode = (code: string): string => {
    return code
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\s{2}/g, '&nbsp;&nbsp;');
  };

  return (
    <div className="w-full h-full overflow-auto bg-ai-darkBg text-white p-4">
      <pre className="text-sm">
        <code dangerouslySetInnerHTML={{ __html: formatCode(code) }} />
      </pre>
    </div>
  );
};

export default CodeDisplay;
