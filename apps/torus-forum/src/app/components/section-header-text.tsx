export function SectionHeaderText({ text }: { text: string }) {
  return (
    <div className="mb-4 w-full border-b border-gray-500 border-white/20 pb-1 text-gray-400">
      <h2 className="text-start font-semibold">{text}</h2>
    </div>
  );
}
