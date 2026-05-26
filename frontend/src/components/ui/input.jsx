import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-outline-variant/60 bg-white/50 px-3 py-2 text-sm text-foreground shadow-inner transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
