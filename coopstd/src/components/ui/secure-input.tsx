
import * as React from "react"
import { Input } from "@/components/ui/input"
import { sanitizeNumericInput, validateMonetaryAmount } from "@/utils/security"
import { cn } from "@/lib/utils"

interface SecureInputProps extends React.ComponentProps<"input"> {
  type?: "text" | "number" | "monetary"
  maxLength?: number
  onSecureChange?: (value: string) => void
}

const SecureInput = React.forwardRef<HTMLInputElement, SecureInputProps>(
  ({ className, type = "text", maxLength = 100, onSecureChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      
      // Apply security sanitization based on type
      if (type === "number" || type === "monetary") {
        const numericValue = sanitizeNumericInput(value);
        value = numericValue.toString();
        
        if (type === "monetary" && !validateMonetaryAmount(numericValue)) {
          return; // Don't update if invalid monetary amount
        }
      } else if (type === "text") {
        value = value.replace(/[<>]/g, '').substring(0, maxLength);
      }
      
      // Update the input value
      e.target.value = value;
      
      // Call secure change handler if provided
      if (onSecureChange) {
        onSecureChange(value);
      }
      
      // Call original onChange if provided
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <Input
        type={type === "monetary" ? "number" : type}
        className={cn(className)}
        onChange={handleChange}
        maxLength={type === "text" ? maxLength : undefined}
        min={type === "number" || type === "monetary" ? 0 : undefined}
        step={type === "monetary" ? 0.01 : undefined}
        ref={ref}
        {...props}
      />
    )
  }
)
SecureInput.displayName = "SecureInput"

export { SecureInput }
