import { useEffect } from "react";

export default function Toaster() {
  useEffect(() => {
    console.log("Toaster mounted");
  }, []);
  return <div className="fixed bottom-4 right-4">Toaster placeholder</div>;
}