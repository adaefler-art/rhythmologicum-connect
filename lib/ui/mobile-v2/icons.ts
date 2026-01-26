/**
 * Mobile UI v2 Icons
 * 
 * Centralized icon exports for the v2 design system.
 * 
 * Current implementation uses lucide-react as the icon provider,
 * but this abstraction allows for future migration to custom SVGs
 * or other icon libraries without changing consuming components.
 * 
 * Usage:
 *   import { ChevronDown, ChevronUp } from '@/lib/ui/mobile-v2/icons'
 */

// Re-export commonly used icons from lucide-react
// This provides a single source of truth for v2 icons
export {
  // Navigation
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  
  // Actions
  Check,
  X,
  Plus,
  Minus,
  
  // Status
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  
  // Health & Activity
  Heart,
  Activity,
  Moon,
  Zap,
  Brain,
  
  // Documents & Data
  ClipboardCheck,
  FileText,
  Download,
  Calendar,
  ClipboardList,
  
  // UI Elements
  Bot,
  MessageCircle,
  Sparkles,
  Shield,
  TrendingUp,
  TrendingDown,
  
  // Type
  type LucideIcon,
} from 'lucide-react'
