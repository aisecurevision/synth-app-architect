
interface CodeDisplayProps {
  code: string;
}

const CodeDisplay = ({ code }: CodeDisplayProps) => {
  return (
    <div className="w-full h-full overflow-auto bg-ai-darkBg text-white p-4">
      <pre className="text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeDisplay;
