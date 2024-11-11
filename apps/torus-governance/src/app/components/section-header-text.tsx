export function SectionHeaderText({ text }: { text: string }) {
  return (
    <div className="w-full pb-1 mb-4 text-gray-400 border-b border-gray-500 border-white/20">
      <h2 className="font-semibold text-start">{text}</h2>
    </div>
  );
}
