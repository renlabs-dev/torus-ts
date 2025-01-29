import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

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
        newestOnTop={true}
        pauseOnFocusLoss
        pauseOnHover
        position="bottom-left"
        rtl={false}
        theme="dark"
        toastStyle={{
          background: "#000",
          color: "#fff",
          border: "1px solid #27272a",
        }}
      />
      {children}
    </>
  );
}

export { ToastProvider };
export { toast } from "react-toastify";
