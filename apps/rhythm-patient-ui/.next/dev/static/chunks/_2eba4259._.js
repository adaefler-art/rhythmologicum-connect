(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/ui/theme/themeConfig.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/contexts/ThemeContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider,
    "useTheme",
    ()=>useTheme
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$theme$2f$themeConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/theme/themeConfig.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const ThemeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function ThemeProvider({ children }) {
    _s();
    // IMPORTANT: Keep the initial render deterministic across SSR + hydration.
    // Reading localStorage/matchMedia during the initial client render can cause React hydration
    // error #418 if the server-rendered HTML differs from the client's first render.
    const [theme, setThemeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('light');
    const [accent, setAccentState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('sky');
    const [isInitialized, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
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
        const palette = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$theme$2f$themeConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["accentPalettes"][newAccent].primary;
        const root = document.documentElement;
        // Set CSS custom properties for primary colors
        Object.entries(palette).forEach(([shade, color])=>{
            root.style.setProperty(`--color-primary-${shade}`, color);
        });
        // Store accent as data attribute for potential CSS targeting
        root.setAttribute('data-accent', newAccent);
    };
    // Resolve initial theme after mount (prefer DOM class set by the inline script in app/layout.tsx).
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            try {
                const root = document.documentElement;
                const domTheme = root.classList.contains('dark') ? 'dark' : root.classList.contains('light') ? 'light' : null;
                const stored = localStorage.getItem('theme') || null;
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const resolved = stored || domTheme || (prefersDark ? 'dark' : 'light');
                // Resolve accent
                const storedAccent = localStorage.getItem('theme-accent');
                const resolvedAccent = storedAccent && __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$theme$2f$themeConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["accentColors"].includes(storedAccent) ? storedAccent : 'sky';
                setThemeState(resolved);
                setAccentState(resolvedAccent);
            } catch  {
            // keep default
            } finally{
                setIsInitialized(true);
            }
        }
    }["ThemeProvider.useEffect"], []);
    // Apply theme only after initialization to avoid fighting the pre-hydration inline script.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            if (!isInitialized) return;
            applyTheme(theme);
        }
    }["ThemeProvider.useEffect"], [
        isInitialized,
        theme
    ]);
    // Apply accent after initialization
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            if (!isInitialized) return;
            applyAccent(accent);
        }
    }["ThemeProvider.useEffect"], [
        isInitialized,
        accent
    ]);
    // Listen for system preference changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = {
                "ThemeProvider.useEffect.handleChange": (e)=>{
                    // Only update if user hasn't set an explicit preference
                    const hasStoredPreference = localStorage.getItem('theme');
                    if (!hasStoredPreference) {
                        const newTheme = e.matches ? 'dark' : 'light';
                        setThemeState(newTheme);
                    }
                }
            }["ThemeProvider.useEffect.handleChange"];
            mediaQuery.addEventListener('change', handleChange);
            return ({
                "ThemeProvider.useEffect": ()=>mediaQuery.removeEventListener('change', handleChange)
            })["ThemeProvider.useEffect"];
        }
    }["ThemeProvider.useEffect"], []);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
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
_s(ThemeProvider, "KdSDdjtvGAC6ZgwXXzQIHDOe0nY=");
_c = ThemeProvider;
function useTheme() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ThemeContext);
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
_s1(useTheme, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "ThemeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/design/tokens.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/contexts/DesignTokensContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DesignTokensProvider",
    ()=>DesignTokensProvider,
    "useDesignTokens",
    ()=>useDesignTokens
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * Design Tokens Context
 * 
 * V05-I09.2: Provides design tokens to client components with organization override support.
 * Tokens are loaded server-side and passed to client components via this context.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const DesignTokensContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]);
function DesignTokensProvider({ children, tokens = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"] }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DesignTokensContext.Provider, {
        value: tokens,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/contexts/DesignTokensContext.tsx",
        lineNumber: 44,
        columnNumber: 5
    }, this);
}
_c = DesignTokensProvider;
function useDesignTokens() {
    _s();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(DesignTokensContext);
    if (!context) {
        // Fallback to default tokens if context is not available
        console.warn('[useDesignTokens] Context not found, using default tokens');
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"];
    }
    return context;
}
_s(useDesignTokens, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "DesignTokensProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=_2eba4259._.js.map