import { cn } from '@/lib/utils'

interface SectionItem {
  key: string
  label: string
}

interface SectionPanelProps {
  items: SectionItem[]
  activeKey: string
  onSelect: (key: string) => void
  children: React.ReactNode
}

export default function SectionPanel({ items, activeKey, onSelect, children }: SectionPanelProps) {
  return (
    <div className="flex gap-0 rounded-lg border bg-card overflow-hidden min-h-[400px]">
      {/* Left sidebar */}
      <div className="w-52 shrink-0 border-r bg-card">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={cn(
              'w-full text-left px-5 py-3 text-sm transition-colors hover:bg-accent',
              activeKey === item.key
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Right content */}
      <div className="flex-1 p-6 overflow-y-auto">{children}</div>
    </div>
  )
}
