

export const CadreSectionContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex w-full flex-col mb-6">
      <div className="flex h-full w-full flex-col lg:w-full">
        <div className="m-2 flex h-full animate-fade-down flex-col border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-100 md:max-h-[60vh] md:min-h-auto">
          {children}
        </div>
      </div>
    </div>
  )
}