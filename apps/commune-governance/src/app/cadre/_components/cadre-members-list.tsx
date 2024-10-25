const people = [
  {
    name: 'timo33',
    role: '12/08/2024',
  },
  {
    name: '__honza__',
    role: '12/08/2024',
  },
  {
    name: 'steinerkelvin',
    role: '12/08/2024',
  },
  {
    name: 'jairo.mp4',
    role: '12/08/2024',
  },
  {
    name: '  fam7925',
    role: '12/08/2024',
  }
]

export const CadreMembersList = () => {
  return (
    <div id="teste" className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      {people.map((person) => (
        <div
          key={person.name}
          className="relative flex items-center  w-auto space-x-3 border border-white/20 bg-[#898989]/5 px-6 py-5"
        >
          <div className="w-auto">
            <p className="text-sm font-medium text-gray-100">{person.name}</p>
            <p className="truncate text-sm text-gray-400">{person.role}</p>
          </div>
        </div>
      ))}
    </div>
  )
}