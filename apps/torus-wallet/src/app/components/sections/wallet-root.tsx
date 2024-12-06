interface WalletRootProps {
  children: React.ReactNode;
}

export function WalletRoot(props: WalletRootProps) {
  return (
    <div className="flex w-full max-w-4xl animate-fade-up flex-col items-center justify-center divide-y divide-white/20 border border-white/20 bg-[#898989]/5 p-6">
      {props.children}
    </div>
  );
}
