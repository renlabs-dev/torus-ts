import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import {
  ChevronDownIcon,
} from '@heroicons/react/20/solid'

interface DropdownButton {
  title: string | JSX.Element,
  actionsList: {
    title: string,
    handle: () => void
  }[]
}

export const Dropdown = (props: DropdownButton) => {
  const { actionsList, title } = props;

  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <div>
        <MenuButton className="inline-flex w-full justify-center gap-x-1.5 px-4 py-1.5 text-sm font-semibold shadow-sm border-white/20 border bg-white/5
        animate-fade-down p-4 text-white transition hover:border-green-500 hover:bg-green-500/10 hover:text-green-500
        ">
          {title}
          <ChevronDownIcon aria-hidden="true" className="w-5 h-5 -mr-1 text-gray-400" />
        </MenuButton>
      </div>

      <MenuItems
        transition
        className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white/5 border border-white/20 backdrop-blur-md shadow-lg transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="p-0.5">
          {actionsList.map((action) => {
            return (
              <MenuItem key={action.title}>
                <button
                  onClick={() => action.handle()}
                  className="group w-full flex items-center px-4 py-2 text-sm text-white data-[focus]:bg-white/5 data-[focus]:text-green-500"
                >
                  {action.title}
                </ button>
              </MenuItem>
            )
          })}
        </div>
      </MenuItems>
    </Menu>
  )
}
