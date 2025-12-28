import * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "success";
}

const Alert = ({ className = "", variant = "default", children, ...props }: AlertProps) => {
  const variants = {
    default: "bg-gray-100 border-gray-200 text-gray-900",
    destructive: "bg-red-50 border-red-200 text-red-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
    success: "bg-green-50 border-green-200 text-green-900",
  };

  return (
    <div
      className={`relative w-full rounded-lg border p-4 ${variants[variant]} ${className}`}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

const AlertTitle = ({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props} />
)

const AlertDescription = ({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <div className={`text-sm ${className}`} {...props} />
)

export { Alert, AlertTitle, AlertDescription }