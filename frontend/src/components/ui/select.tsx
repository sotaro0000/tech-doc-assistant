'use client';

import * as React from "react"
import { useState, createContext, useContext } from "react"

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType>({
  open: false,
  setOpen: () => {},
});

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Select = ({ children, value, onValueChange }: SelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

const SelectTrigger = ({ className = "", children }: { className?: string; children?: React.ReactNode }) => {
  const { open, setOpen } = useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${className}`}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = useContext(SelectContext);
  return <span>{value || placeholder}</span>;
}

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  const { open } = useContext(SelectContext);

  if (!open) return null;

  return (
    <div className="absolute mt-1 w-full rounded-md border bg-white shadow-lg z-50 max-h-60 overflow-auto">
      {children}
    </div>
  );
}

const SelectItem = ({ children, value }: { children: React.ReactNode; value: string }) => {
  const { onValueChange, setOpen, value: selectedValue } = useContext(SelectContext);

  return (
    <div
      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${selectedValue === value ? 'bg-gray-100' : ''}`}
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
    >
      {children}
    </div>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }