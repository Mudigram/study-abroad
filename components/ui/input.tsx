import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-all outline-none placeholder:text-slate-400 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs",
        className
      )}
      {...props}
    />
  )
}

export { Input }

