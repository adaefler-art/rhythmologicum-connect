module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/ui/theme/themeConfig.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Theme Configuration for Rhythmologicum Connect
 *
 * Defines the available theme modes (light/dark) and accent colors.
 * This configuration serves as the single source of truth for theme options.
 *
 * Usage:
 * @example
 * import { themeConfig, isValidThemeMode, isValidAccentColor } from '@/lib/ui/theme/themeConfig'
 *
 * if (isValidThemeMode('dark')) {
 *   // Apply dark mode
 * }
 */ /**
 * Available theme modes
 */ __turbopack_context__.s([
    "accentColors",
    ()=>accentColors,
    "accentPalettes",
    ()=>accentPalettes,
    "getAccentPalette",
    ()=>getAccentPalette,
    "isValidAccentColor",
    ()=>isValidAccentColor,
    "isValidThemeMode",
    ()=>isValidThemeMode,
    "themeConfig",
    ()=>themeConfig,
    "themeModes",
    ()=>themeModes
]);
const themeModes = [
    'light',
    'dark'
];
const accentColors = [
    'sky',
    'emerald',
    'violet',
    'amber'
];
const accentPalettes = {
    sky: {
        name: 'Sky Blue',
        description: 'Default calm, medical theme',
        primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e'
        }
    },
    emerald: {
        name: 'Emerald Green',
        description: 'Growth and wellness theme',
        primary: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b'
        }
    },
    violet: {
        name: 'Violet Purple',
        description: 'Focus and mindfulness theme',
        primary: {
            50: '#f5f3ff',
            100: '#ede9fe',
            200: '#ddd6fe',
            300: '#c4b5fd',
            400: '#a78bfa',
            500: '#8b5cf6',
            600: '#7c3aed',
            700: '#6d28d9',
            800: '#5b21b6',
            900: '#4c1d95'
        }
    },
    amber: {
        name: 'Amber Gold',
        description: 'Energy and warmth theme',
        primary: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
        }
    }
};
const themeConfig = {
    /**
   * Default theme mode
   * If not set in localStorage, will fallback to system preference
   */ defaultMode: 'light',
    /**
   * Default accent color
   */ defaultAccent: 'sky',
    /**
   * Whether to respect system color scheme preference
   * If true, will use system preference when no user preference is stored
   */ respectSystemPreference: true,
    /**
   * localStorage key for theme mode
   */ storageKeyMode: 'theme',
    /**
   * localStorage key for accent color
   */ storageKeyAccent: 'theme-accent'
};
function isValidThemeMode(value) {
    return typeof value === 'string' && themeModes.includes(value);
}
function isValidAccentColor(value) {
    return typeof value === 'string' && accentColors.includes(value);
}
function getAccentPalette(accent) {
    return accentPalettes[accent];
}
}),
"[project]/lib/contexts/ThemeContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider,
    "useTheme",
    ()=>useTheme
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$theme$2f$themeConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/theme/themeConfig.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const ThemeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function ThemeProvider({ children }) {
    // IMPORTANT: Keep the initial render deterministic across SSR + hydration.
    // Reading localStorage/matchMedia during the initial client render can cause React hydration
    // error #418 if the server-rendered HTML differs from the client's first render.
    const [theme, setThemeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('light');
    const [accent, setAccentState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('sky');
    const [isInitialized, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const applyTheme = (newTheme)=>{
        const root = document.documentElement;
        if (newTheme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    };
    const applyAccent = (newAccent)=>{
        const palette = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$theme$2f$themeConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["accentPalettes"][newAccent].primary;
        const root = document.documentElement;
        // Set CSS custom properties for primary colors
        Object.entries(palette).forEach(([shade, color])=>{
            root.style.setProperty(`--color-primary-${shade}`, color);
        });
        // Store accent as data attribute for potential CSS targeting
        root.setAttribute('data-accent', newAccent);
    };
    // Resolve initial theme after mount (prefer DOM class set by the inline script in app/layout.tsx).
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        try {
            const root = document.documentElement;
            const domTheme = root.classList.contains('dark') ? 'dark' : root.classList.contains('light') ? 'light' : null;
            const stored = localStorage.getItem('theme') || null;
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const resolved = stored || domTheme || (prefersDark ? 'dark' : 'light');
            // Resolve accent
            const storedAccent = localStorage.getItem('theme-accent');
            const resolvedAccent = storedAccent && __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$theme$2f$themeConfig$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["accentColors"].includes(storedAccent) ? storedAccent : 'sky';
            setThemeState(resolved);
            setAccentState(resolvedAccent);
        } catch  {
        // keep default
        } finally{
            setIsInitialized(true);
        }
    }, []);
    // Apply theme only after initialization to avoid fighting the pre-hydration inline script.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isInitialized) return;
        applyTheme(theme);
    }, [
        isInitialized,
        theme
    ]);
    // Apply accent after initialization
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isInitialized) return;
        applyAccent(accent);
    }, [
        isInitialized,
        accent
    ]);
    // Listen for system preference changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e)=>{
            // Only update if user hasn't set an explicit preference
            const hasStoredPreference = localStorage.getItem('theme');
            if (!hasStoredPreference) {
                const newTheme = e.matches ? 'dark' : 'light';
                setThemeState(newTheme);
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return ()=>mediaQuery.removeEventListener('change', handleChange);
    }, []);
    const setTheme = (newTheme)=>{
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };
    const setAccent = (newAccent)=>{
        setAccentState(newAccent);
        localStorage.setItem('theme-accent', newAccent);
    };
    const toggleTheme = ()=>{
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
        value: {
            theme,
            setTheme,
            toggleTheme,
            accent,
            setAccent
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/contexts/ThemeContext.tsx",
        lineNumber: 130,
        columnNumber: 5
    }, this);
}
function useTheme() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ThemeContext);
    // Return a default context if used outside provider (e.g., during SSR)
    if (context === undefined) {
        return {
            theme: 'light',
            setTheme: ()=>{},
            toggleTheme: ()=>{},
            accent: 'sky',
            setAccent: ()=>{}
        };
    }
    return context;
}
}),
"[project]/lib/design/tokens.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Design Tokens for Rhythmologicum Connect
 * 
 * Centralized design system tokens for spacing, typography, motion, and theming.
 * This file serves as the single source of truth for all design values used
 * across the funnel UI components.
 * 
 * Token Categories:
 * - Spacing: Consistent spacing scale for margins, padding, and gaps
 * - Typography: Font sizes, line heights, and font weights
 * - Radii: Border radius values for different component sizes
 * - Shadows: Box shadow definitions for depth and elevation
 * - Motion: Animation durations and easing functions
 * - Colors: Theme-aware color system (supports future theme variants)
 * 
 * Usage:
 * Import and use these tokens in your components instead of hardcoded values:
 * 
 * @example
 * import { spacing, typography, motion } from '@/lib/design-tokens'
 * 
 * <div className="px-4 py-3"> // Before
 * <div style={{ padding: `${spacing.md} ${spacing.lg}` }}> // After
 */ /**
 * Spacing Scale
 * 
 * Consistent spacing values following a logical scale.
 * Maps to common Tailwind spacing values but defined explicitly.
 */ __turbopack_context__.s([
    "colors",
    ()=>colors,
    "componentTokens",
    ()=>componentTokens,
    "default",
    ()=>__TURBOPACK__default__export__,
    "designTokens",
    ()=>designTokens,
    "getThemeColors",
    ()=>getThemeColors,
    "layout",
    ()=>layout,
    "motion",
    ()=>motion,
    "radii",
    ()=>radii,
    "shadows",
    ()=>shadows,
    "spacing",
    ()=>spacing,
    "typography",
    ()=>typography
]);
const spacing = {
    // Extra small - tight spacing
    xs: '0.5rem',
    // Small - compact spacing
    sm: '0.75rem',
    // Medium - standard spacing
    md: '1rem',
    // Large - comfortable spacing
    lg: '1.5rem',
    // Extra large - generous spacing
    xl: '2rem',
    // 2X large - spacious layout
    '2xl': '3rem',
    // 3X large - maximum spacing
    '3xl': '4rem'
};
const typography = {
    fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
    },
    lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2'
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
    }
};
const radii = {
    none: '0',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px'
};
const shadows = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
};
const motion = {
    duration: {
        instant: '0ms',
        fast: '150ms',
        normal: '200ms',
        moderate: '300ms',
        slow: '500ms'
    },
    easing: {
        // Standard easing curves
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        // Custom cubic-bezier curves
        smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        snappy: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    // Framer Motion spring configurations
    spring: {
        default: {
            type: 'spring',
            stiffness: 300,
            damping: 20
        },
        gentle: {
            type: 'spring',
            stiffness: 200,
            damping: 25
        },
        bouncy: {
            type: 'spring',
            stiffness: 400,
            damping: 15
        }
    }
};
const layout = {
    // Maximum width for clinician content areas (data-heavy, tables)
    contentMaxWidth: '1600px',
    // Maximum width for patient content areas (readability-focused)
    patientMaxWidth: '1152px',
    // Maximum width for article-style content
    articleMaxWidth: '896px'
};
const colors = {
    // Primary brand colors
    primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e'
    },
    // Neutral colors (slate)
    neutral: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
    },
    // Semantic colors
    semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },
    // Background colors
    background: {
        light: '#ffffff',
        lightGradientFrom: '#f0f9ff',
        lightGradientTo: '#ffffff',
        dark: '#0a0a0a',
        darkGradientFrom: '#1e293b',
        darkGradientTo: '#0f172a'
    }
};
const componentTokens = {
    // Mobile Question Card
    mobileQuestionCard: {
        borderRadius: radii['2xl'],
        padding: spacing.lg,
        shadow: shadows.lg,
        headerPaddingX: spacing.md,
        headerPaddingY: spacing.md,
        contentPaddingX: spacing.lg,
        contentPaddingY: spacing.lg
    },
    // Desktop Question Card
    desktopQuestionCard: {
        borderRadius: radii['2xl'],
        padding: '2rem',
        shadow: shadows.lg,
        headerPaddingX: spacing.lg,
        headerPaddingY: '1.25rem'
    },
    // Answer Buttons
    answerButton: {
        borderRadius: radii.xl,
        paddingX: spacing.md,
        paddingY: spacing.md,
        minHeight: '44px',
        minWidth: '44px',
        gap: '0.25rem',
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        transition: `all ${motion.duration.normal} ${motion.easing.smooth}`
    },
    // Navigation Buttons
    navigationButton: {
        borderRadius: radii.xl,
        paddingX: spacing.lg,
        paddingY: spacing.md,
        minHeight: '56px',
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        shadow: shadows.md,
        transition: `all ${motion.duration.normal} ${motion.easing.smooth}`
    },
    // Progress Bar
    progressBar: {
        height: '0.5rem',
        borderRadius: radii.full,
        transition: `width ${motion.duration.moderate} ${motion.easing.easeOut}`
    },
    // Helper Text / Info Boxes
    infoBox: {
        borderRadius: radii.lg,
        padding: spacing.md,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.relaxed
    }
};
function getThemeColors(variant) {
    // Future enhancement: Load different color schemes based on variant
    // For now, return default colors (stress theme)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unusedVariant = variant;
    return colors;
}
const designTokens = {
    spacing,
    typography,
    radii,
    shadows,
    motion,
    colors,
    componentTokens
};
const __TURBOPACK__default__export__ = designTokens;
}),
"[project]/lib/design-tokens.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
/**
 * Design Tokens for Rhythmologicum Connect
 * 
 * @deprecated This file is maintained for backward compatibility only.
 * New code should import from '@/lib/design/tokens' instead.
 * 
 * @see /lib/design/tokens.ts - Canonical source of truth
 * @see /docs/design/TOKENS.md - Canonical specification
 * 
 * Usage:
 * @example
 * // Old (still works)
 * import { spacing, typography, motion } from '@/lib/design-tokens'
 * 
 * // New (recommended)
 * import { spacing, typography, motion } from '@/lib/design/tokens'
 */ // Re-export everything from canonical location
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-ssr] (ecmascript)");
;
;
}),
"[project]/lib/contexts/DesignTokensContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DesignTokensProvider",
    ()=>DesignTokensProvider,
    "useDesignTokens",
    ()=>useDesignTokens
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
/**
 * Design Tokens Context
 * 
 * V05-I09.2: Provides design tokens to client components with organization override support.
 * Tokens are loaded server-side and passed to client components via this context.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const DesignTokensContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]);
function DesignTokensProvider({ children, tokens = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"] }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DesignTokensContext.Provider, {
        value: tokens,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/contexts/DesignTokensContext.tsx",
        lineNumber: 44,
        columnNumber: 5
    }, this);
}
function useDesignTokens() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(DesignTokensContext);
    if (!context) {
        // Fallback to default tokens if context is not available
        console.warn('[useDesignTokens] Context not found, using default tokens');
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"];
    }
    return context;
}
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d760ba83._.js.map