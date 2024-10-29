"use client"
import { X } from "lucide-react";

export const Modal = (props: { title: string, children: React.ReactNode, handleModal: () => void, modalOpen: boolean }) => {
  const { title, handleModal, modalOpen, children } = props;

  return (
    <div
      className={`relative z-50 ${modalOpen ? "visible" : "hidden"} -mr-2`}
      role="dialog"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 transition-opacity bg-black/5 bg-opacity-60 backdrop-blur-lg" />

      {/* Modal */}
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto animate-fade-in-down">
        <div className="flex items-center justify-center min-h-full p-4 text-center">
          <div className="relative w-[100%] max-w-screen-2xl transform overflow-hidden border border-white/20 bg-[#111713] px-5 py-3 text-left text-white backdrop-blur-md md:w-[80%]">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 p-6 bg-center bg-no-repeat bg-cover border-b border-gray-500 md:flex-row">
              <div className="flex flex-col items-center md:flex-row">
                <h3
                  className="pl-2 text-xl font-bold leading-6"
                  id="modal-title"
                >
                  {title}
                </h3>
              </div>

              <button
                className="p-2 transition duration-200"
                onClick={() => handleModal()}
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 pb-4 divide-y divide-white/20">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
