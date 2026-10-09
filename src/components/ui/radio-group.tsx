"use client"

import * as React from "react"
import { cn } from "cn"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

// `variant="card"` turns each item into a selectable bordered card (plan /
// option pickers): put a RadioGroupItemTitle and an optional
// RadioGroupItemDescription inside RadioGroupItem. The checked card takes the
// primary border and tint, and keeps a radio dot so the selection doesn't
// rely on colour alone.
type RadioGroupVariant = "default" | "card"

const RadioGroupContext = React.createContext<{ variant: RadioGroupVariant }>({
  variant: "default",
})

const RadioGroupItemContext = React.createContext<{
  titleId?: string
  descriptionId?: string
  setHasTitle?: (v: boolean) => void
  setHasDescription?: (v: boolean) => void
}>({})

function RadioGroup({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  variant?: RadioGroupVariant
}) {
  return (
    <RadioGroupContext.Provider value={{ variant }}>
      <RadioGroupPrimitive.Root
        data-slot="radio-group"
        data-variant={variant}
        className={cn("group/radio-group grid w-full gap-2", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
}

const radioDotClassName =
  "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary"

function RadioGroupItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  const { variant } = React.useContext(RadioGroupContext)
  const titleId = React.useId()
  const descriptionId = React.useId()
  const [hasTitle, setHasTitle] = React.useState(false)
  const [hasDescription, setHasDescription] = React.useState(false)

  if (variant === "card") {
    return (
      <RadioGroupItemContext.Provider
        value={{ titleId, descriptionId, setHasTitle, setHasDescription }}
      >
        <RadioGroupPrimitive.Item
          data-slot="radio-group-item"
          data-variant="card"
          aria-labelledby={hasTitle ? titleId : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          className={cn(
            "group/radio-group-item relative flex min-h-14 w-full items-start gap-3 rounded-2xl border border-input bg-card px-4 py-3 text-left transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-card aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-checked:border-primary data-checked:bg-primary/10 data-checked:hover:bg-primary/10 dark:bg-input/30 dark:data-checked:bg-primary/10",
            className
          )}
          {...props}
        >
          <span
            data-slot="radio-group-card-dot"
            aria-hidden="true"
            className="relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input group-data-checked/radio-group-item:border-primary group-data-checked/radio-group-item:bg-primary"
          >
            <RadioGroupPrimitive.Indicator
              data-slot="radio-group-indicator"
              className="size-2 rounded-full bg-primary-foreground"
            />
          </span>
          <span
            data-slot="radio-group-item-content"
            className="flex min-w-0 flex-1 flex-col gap-0.5"
          >
            {children}
          </span>
        </RadioGroupPrimitive.Item>
      </RadioGroupItemContext.Provider>
    )
  }

  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(radioDotClassName, className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

function RadioGroupItemTitle({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { titleId, setHasTitle } = React.useContext(RadioGroupItemContext)
  React.useEffect(() => {
    setHasTitle?.(true)
    return () => setHasTitle?.(false)
  }, [setHasTitle])
  return (
    <span
      data-slot="radio-group-item-title"
      id={titleId}
      className={cn("text-sm font-bold text-foreground", className)}
      {...props}
    />
  )
}

function RadioGroupItemDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { descriptionId, setHasDescription } = React.useContext(
    RadioGroupItemContext
  )
  React.useEffect(() => {
    setHasDescription?.(true)
    return () => setHasDescription?.(false)
  }, [setHasDescription])
  return (
    <span
      data-slot="radio-group-item-description"
      id={descriptionId}
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemTitle,
  RadioGroupItemDescription,
  type RadioGroupVariant,
}
