import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const inputSizes = {
    sm: 'h-8 text-sm px-3 rounded-md',
    md: 'h-10 text-sm px-3 rounded-lg',
    lg: 'h-12 text-base px-4 rounded-lg',
} as const

export type InputSize = keyof typeof inputSizes

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    inputSize?: InputSize
    error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, inputSize = 'md', error, type = 'text', ...props }, ref) => {
        return (
            <input
                ref={ref}
                type={type}
                className={cn(
                    'w-full border bg-transparent font-medium transition-colors',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                    error
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600',
                    inputSizes[inputSize],
                    className
                )}
                {...props}
            />
        )
    }
)

Input.displayName = 'Input'

export { Input, inputSizes }
