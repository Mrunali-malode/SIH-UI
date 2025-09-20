"use client"

import { Button } from "@/components/ui/button"
import { Palette } from "lucide-react"
import { useTheme } from "./theme-context"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: "light" as const, label: "Light", emoji: "☀️" },
    { value: "dark" as const, label: "Dark", emoji: "🌙" },
    { value: "friendly" as const, label: "Friendly", emoji: "🌈" },
  ]

  const nextTheme = () => {
    const currentIndex = themes.findIndex((t) => t.value === theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex].value)
  }

  const currentTheme = themes.find((t) => t.value === theme)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={nextTheme}
      className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-muted-foreground hover:text-foreground"
    >
      <Palette className="h-5 w-5" />
      <span className="text-xs">{currentTheme?.label}</span>
    </Button>
  )
}
