# Health App Design System & Component Library

A complete, production-ready component library for health and wellness applications. Built with React, TypeScript, and Tailwind CSS.

## 🎯 Overview

This design system provides a comprehensive set of reusable components extracted from a professional health assessment application. All components are fully responsive, accessible, and ready for GitHub implementation.

## 📦 What's Included

### Core UI Components (`/components/ui/`)
- **Button** - Multiple variants (primary, secondary, outline, ghost, success, warning, danger)
- **Card** - Flexible container with customizable padding and shadows
- **Badge** - Status indicators and labels
- **ProgressBar** - Progress indicators with labels
- **Radio** - Enhanced radio buttons with icons and descriptions
- **Input** - Form inputs with icons and validation states

### Health-Specific Components (`/components/health/`)
- **StatCard** - Display health metrics with icons
- **AssessmentCard** - Health assessment questions with categories
- **ActionCard** - Action items with icons and CTAs
- **WeeklyChart** - Bar chart for weekly activity data
- **QuickAction** - Quick access navigation items
- **AppointmentCard** - Appointment scheduling cards
- **AIAssistant** - AI chatbot interface card
- **HealthScore** - Circular progress health score widget

### Layout Components (`/components/layout/`)
- **Header** - App header with navigation
- **Sidebar** - Collapsible navigation sidebar

### Design Tokens (`/lib/`)
- **types.ts** - TypeScript type definitions
- **constants.ts** - Color palette, gradients, shadows, spacing

## 🎨 Design System

### Color Palette
```typescript
Primary: #4a90e2 to #6c63ff (gradient)
Success: #5cb85c
Warning: #f0ad4e
Danger: #d9534f
Neutral: #f7f9fc to #111827
```

### Typography
- Font Family: Inter
- Sizes: 12px - 48px
- Weights: Regular (400), Medium (500), Semi Bold (600), Bold (700)

### Spacing
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px

### Border Radius
- sm: 8px
- md: 12px
- lg: 16px
- full: 9999px

## 🚀 Usage Examples

### Button Component
```tsx
import { Button } from './components/ui/Button';
import { Heart } from 'lucide-react';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button 
  variant="success" 
  icon={<Heart className="w-4 h-4" />}
  iconPosition="left"
>
  Save
</Button>
```

### StatCard Component
```tsx
import { StatCard } from './components/health/StatCard';

const metric = {
  id: '1',
  label: 'Heart Rate',
  value: '72',
  unit: 'bpm',
  icon: '❤️',
  color: 'green',
  trend: 'neutral'
};

<StatCard metric={metric} onClick={() => console.log('Clicked')} />
```

### Radio Component
```tsx
import { Radio } from './components/ui/Radio';

<Radio
  id="option1"
  name="energy"
  value="excellent"
  checked={selected === 'excellent'}
  onChange={setSelected}
  label="Excellent"
  description="Full of energy and vitality"
  icon={<span>💚</span>}
  iconBg="bg-[#dcfce7]"
/>
```

### ProgressBar Component
```tsx
import { ProgressBar } from './components/ui/ProgressBar';

<ProgressBar value={30} max={100} showLabel />
<ProgressBar value={75} color="success" />
```

## 📱 Demo Views

The demo app includes three main views:

1. **Component Library** - Showcases all available components
2. **Dashboard** - Example health dashboard implementation
3. **Assessment** - Example health assessment flow

## 🛠 Technical Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons
- **Responsive Design** - Mobile-first approach

## 📂 File Structure

```
/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Radio.tsx
│   │   └── Input.tsx
│   ├── health/
│   │   ├── StatCard.tsx
│   │   ├── AssessmentCard.tsx
│   │   ├── ActionCard.tsx
│   │   ├── WeeklyChart.tsx
│   │   ├── QuickAction.tsx
│   │   ├── AppointmentCard.tsx
│   │   ├── AIAssistant.tsx
│   │   └── HealthScore.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── types.ts
│   └── constants.ts
├── App.tsx
└── README.md
```

## 🎯 Key Features

- ✅ Fully typed with TypeScript
- ✅ Responsive and mobile-friendly
- ✅ Accessible (ARIA compliant)
- ✅ Consistent design language
- ✅ Reusable and composable
- ✅ Production-ready code
- ✅ Clean and maintainable
- ✅ Well-documented

## 🎨 Customization

All components accept `className` props for custom styling. Design tokens in `/lib/constants.ts` can be modified to match your brand.

## 📄 License

This component library is ready for implementation in your projects.

## 🤝 Contributing

Feel free to extend or modify components as needed for your specific use case.

---

**Built with ❤️ for health and wellness applications**
