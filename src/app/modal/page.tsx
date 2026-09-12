"use client";

import { useState } from "react";

const ModalComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  console.log(isOpen);
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-700">
      <button onClick={() => setIsOpen(true)} className="cursor-pointer">
        modal
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/15 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-[200px] w-[250px] bg-red-500"
          ></div>
        </div>
      )}
    </div>
  );
};

export default ModalComponent;
