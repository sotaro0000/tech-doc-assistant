import * as React from "react"

const Label = ({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={`text-sm font-medium leading-none ${className}`}
    {...props}
  />
)

export { Label }