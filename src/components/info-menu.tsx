import { useEffect, useRef, useState } from 'react'
import { Info, Link2, Code2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LINKEDIN_URL = 'https://www.linkedin.com/in/cesar-sobrino-arribas-1b887021b/'
const GITHUB_URL = 'https://github.com/Zetasab'

export function InfoMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const items = [
    {
      label: 'Ver LinkedIn',
      icon: Link2,
      onClick: () => window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer'),
    },
    {
      label: 'Ver GitHub',
      icon: Code2,
      onClick: () => window.open(GITHUB_URL, '_blank', 'noopener,noreferrer'),
    },
    {
      label: 'Política de privacidad',
      icon: ShieldCheck,
      onClick: () => {
        window.location.href = '/politica-de-privacidad'
      },
    },
  ]

  return (
    <div ref={containerRef} className="fixed right-4 bottom-4 z-50">
      {open && (
        <div
          className={cn(
            'absolute right-0 bottom-full mb-2 flex w-56 flex-col gap-1 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md',
            'duration-150 animate-in fade-in slide-in-from-bottom-2'
          )}
        >
          {items.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false)
                onClick()
              }}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}
      <Button
        onClick={() => setOpen((v) => !v)}
        variant="outline"
        size="icon"
        title="Información"
        aria-expanded={open}
        className="size-10 cursor-pointer rounded-full shadow-sm"
      >
        <Info className="size-4" />
      </Button>
    </div>
  )
}
