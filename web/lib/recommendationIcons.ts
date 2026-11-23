import {
  Baby, Dumbbell, Flag, Flame, Flower2, Footprints, Gem, Goal, Heart, HeartPulse, KeyRound, Leaf,
  MapPin, Palette, PenLine, Printer, Rainbow, Shirt, Skull, Sparkles, Tag, TreePine, Trophy, Wine, Wrench,
  type LucideIcon,
} from 'lucide-react'

// Lista blanca de iconos de las Recomendaciones. Debe coincidir con src/lib/recommendationIcons.ts (admin).
const ICONS: Record<string, LucideIcon> = {
  Baby, Dumbbell, Flag, Flame, Flower2, Footprints, Gem, Goal, Heart, HeartPulse, KeyRound, Leaf,
  MapPin, Palette, PenLine, Printer, Rainbow, Shirt, Skull, Sparkles, Tag, TreePine, Trophy, Wine, Wrench,
}

export const iconFor = (name?: string | null): LucideIcon => (name && ICONS[name]) || Tag
