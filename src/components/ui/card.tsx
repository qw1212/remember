import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const cardVariants = {
    default: 'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900',
    elevated: 'bg-white shadow-md dark:bg-gray-900 dark:shadow-gray-900/50',
    outlined: 'border-2 border-gray-300 bg-transparent dark:border-gray-600',
} as const

export type CardVariant = keyof typeof cardVariants

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('rounded-xl p-6', cardVariants[variant], className)}
                {...props}
            />
        )
    }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('flex flex-col space-y-1.5', className)}
                {...props}
            />
        )
    }
)

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => {
        return (
            <h3
                ref={ref}
                className={cn('text-lg font-semibold leading-none tracking-tight', className)}
                {...props}
            />
        )
    }
)

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => {
        return (
            <p
                ref={ref}
                className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
                {...props}
            />
        )
    }
)

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('pt-4', className)}
                {...props}
            />
        )
    }
)

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('flex items-center pt-4', className)}
                {...props}
            />
        )
    }
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants }
