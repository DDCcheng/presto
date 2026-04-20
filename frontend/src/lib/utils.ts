import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeInput(value: string) {
  return value.trim()
}

export function isBlank(value: string) {
  return normalizeInput(value).length === 0
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeInput(value))
}

export function buildVideoSrc(src: string, autoplay: boolean) {
  const trimmedSrc = normalizeInput(src)

  if (!autoplay || trimmedSrc.length === 0) {
    return trimmedSrc
  }

  try {
    const url = new URL(trimmedSrc)
    url.searchParams.set("autoplay", "1")
    return url.toString()
  } catch {
    const separator = trimmedSrc.includes("?") ? "&" : "?"
    return `${trimmedSrc}${separator}autoplay=1`
  }
}
