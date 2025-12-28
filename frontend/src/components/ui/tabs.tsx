import * as React from "react"

const Tabs = ({ children, defaultValue, className = "" }: { children: React.ReactNode; defaultValue?: string; className?: string }) => (
  <div className={className}>{children}</div>
)

const TabsList = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className}`}>{children}</div>
)

const TabsTrigger = ({ children, value, className = "" }: { children: React.ReactNode; value: string; className?: string }) => (
  <button className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:bg-white ${className}`}>
    {children}
  </button>
)

const TabsContent = ({ children, value, className = "" }: { children: React.ReactNode; value: string; className?: string }) => (
  <div className={`mt-2 ${className}`}>{children}</div>
)

export { Tabs, TabsList, TabsTrigger, TabsContent }