import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";

function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <>
      <ToastContainer
        autoClose={4000}
        closeOnClick
        draggable
        hideProgressBar={false}
        newestOnTop={false}
        pauseOnFocusLoss
        pauseOnHover
        position="top-right"
        rtl={false}
        theme="dark"
      />
      {children}
    </>
  );
}

export { ToastProvider };
export { toast } from "react-toastify";
