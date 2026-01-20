(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/ui/Alert.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Alert",
    ()=>Alert,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * Alert Component
 * 
 * A notification component for displaying important messages to users.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Multiple variants for different message types (info, success, warning, error)
 * - Optional title and description
 * - Optional dismiss button
 * - Uses semantic design tokens for consistent styling
 * - Accessible with proper ARIA attributes
 * 
 * @example
 * // Info alert
 * <Alert variant="info" title="New Feature">
 *   Check out our new assessment features!
 * </Alert>
 * 
 * @example
 * // Warning with dismiss
 * <Alert variant="warning" dismissible onDismiss={handleDismiss}>
 *   Your session will expire soon.
 * </Alert>
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-client] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
;
var _s = __turbopack_context__.k.signature();
;
;
function Alert({ variant = 'info', title, children, dismissible = false, onDismiss, className = '' }) {
    _s();
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const handleDismiss = ()=>{
        setIsVisible(false);
        onDismiss?.();
    };
    if (!isVisible) {
        return null;
    }
    // Variant configurations
    const variantConfig = {
        info: {
            container: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
            title: 'text-sky-900 dark:text-sky-100',
            text: 'text-sky-800 dark:text-sky-200',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"],
            iconColor: 'text-sky-600 dark:text-sky-400'
        },
        success: {
            container: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
            title: 'text-emerald-900 dark:text-emerald-100',
            text: 'text-emerald-800 dark:text-emerald-200',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"],
            iconColor: 'text-emerald-600 dark:text-emerald-400'
        },
        warning: {
            container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
            title: 'text-amber-900 dark:text-amber-100',
            text: 'text-amber-800 dark:text-amber-200',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
            iconColor: 'text-amber-600 dark:text-amber-400'
        },
        error: {
            container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            title: 'text-red-900 dark:text-red-100',
            text: 'text-red-800 dark:text-red-200',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"],
            iconColor: 'text-red-600 dark:text-red-400'
        }
    };
    const config = variantConfig[variant];
    const Icon = config.icon;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `
        relative flex gap-3 p-4 border rounded-lg
        ${config.container}
        ${className}
      `,
        role: "alert",
        "aria-live": "polite",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-shrink-0",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                    className: `w-5 h-5 ${config.iconColor}`,
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/lib/ui/Alert.tsx",
                    lineNumber: 135,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/lib/ui/Alert.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-w-0",
                children: [
                    title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: `text-sm font-semibold mb-1 ${config.title}`,
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Alert.tsx",
                        lineNumber: 141,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `text-sm ${config.text}`,
                        children: children
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Alert.tsx",
                        lineNumber: 145,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/Alert.tsx",
                lineNumber: 139,
                columnNumber: 7
            }, this),
            dismissible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: handleDismiss,
                className: `
            flex-shrink-0 inline-flex rounded-md p-1.5
            hover:bg-black/5 dark:hover:bg-white/10
            focus:outline-none focus:ring-2 focus:ring-offset-2
            focus:ring-${variant === 'info' ? 'sky' : variant === 'success' ? 'emerald' : variant === 'warning' ? 'amber' : 'red'}-500
            transition-colors duration-200
            ${config.text}
          `,
                "aria-label": "Dismiss alert",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                    className: "w-5 h-5",
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/lib/ui/Alert.tsx",
                    lineNumber: 165,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/lib/ui/Alert.tsx",
                lineNumber: 152,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/Alert.tsx",
        lineNumber: 124,
        columnNumber: 5
    }, this);
}
_s(Alert, "C45KFF5iQHXNkju7O/pllv86QL4=");
_c = Alert;
const __TURBOPACK__default__export__ = Alert;
var _c;
__turbopack_context__.k.register(_c, "Alert");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Badge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Badge Component
 * 
 * A small, colored label component for displaying status, categories, or tags.
 * Supports multiple variants with semantic colors from the v0.4 design system.
 * 
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="danger">High Risk</Badge>
 * ```
 */ __turbopack_context__.s([
    "Badge",
    ()=>Badge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function Badge({ variant = 'default', size = 'md', children, className = '' }) {
    // Variant styles
    const variantStyles = {
        default: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
        success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700',
        warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-700',
        danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700',
        info: 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border-sky-200 dark:border-sky-700',
        secondary: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    };
    // Size styles
    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm'
    };
    const variantClass = variantStyles[variant];
    const sizeClass = sizeStyles[size];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `
        inline-flex items-center justify-center
        rounded-full border font-medium
        whitespace-nowrap
        ${variantClass}
        ${sizeClass}
        ${className}
      `,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/ui/Badge.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, this);
}
_c = Badge;
var _c;
__turbopack_context__.k.register(_c, "Badge");
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
"[project]/lib/ui/Button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
;
;
const Button = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ variant = 'primary', size = 'md', fullWidth = false, icon, loading = false, disabled = false, className = '', children, type = 'button', onClick, onMouseDown, onMouseUp, onTouchStart, onTouchEnd, onKeyDown, onKeyUp, onFocus, onBlur, ...otherProps }, ref)=>{
    // Size configurations
    const sizeConfig = {
        sm: {
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            minHeight: '36px'
        },
        md: {
            padding: '0.625rem 1.5rem',
            fontSize: '1rem',
            minHeight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["componentTokens"].navigationButton.minHeight
        },
        lg: {
            padding: '0.875rem 2rem',
            fontSize: '1.125rem',
            minHeight: '56px'
        }
    };
    // Variant styles
    const variantStyles = {
        primary: `
        bg-sky-600 dark:bg-sky-500 text-white 
        hover:bg-sky-700 dark:hover:bg-sky-600
        active:bg-sky-800 dark:active:bg-sky-700
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400
        shadow-md hover:shadow-lg
      `,
        secondary: `
        bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100
        hover:bg-slate-200 dark:hover:bg-slate-600
        active:bg-slate-300 dark:active:bg-slate-500
        disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600
        border-2 border-slate-200 dark:border-slate-600
      `,
        outline: `
        bg-transparent text-sky-600 dark:text-sky-400
        border-2 border-sky-600 dark:border-sky-500
        hover:bg-sky-50 dark:hover:bg-sky-900/30
        active:bg-sky-100 dark:active:bg-sky-900/50
        disabled:border-slate-300 dark:disabled:border-slate-600 disabled:text-slate-400 dark:disabled:text-slate-500
      `,
        ghost: `
        bg-transparent text-slate-700 dark:text-slate-300
        hover:bg-slate-100 dark:hover:bg-slate-700
        active:bg-slate-200 dark:active:bg-slate-600
        disabled:text-slate-400 dark:disabled:text-slate-500
      `,
        destructive: `
        bg-red-600 dark:bg-red-500 text-white
        hover:bg-red-700 dark:hover:bg-red-600
        active:bg-red-800 dark:active:bg-red-700
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400
        shadow-md hover:shadow-lg
      `,
        // Deprecated: Use 'destructive' instead
        danger: `
        bg-red-600 dark:bg-red-500 text-white
        hover:bg-red-700 dark:hover:bg-red-600
        active:bg-red-800 dark:active:bg-red-700
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400
        shadow-md hover:shadow-lg
      `
    };
    const config = sizeConfig[size];
    const variantClass = variantStyles[variant];
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-60
      active:scale-[0.98]
      touch-manipulation
      ${fullWidth ? 'w-full' : ''}
      ${variantClass}
      ${className}
    `;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        ref: ref,
        type: type,
        disabled: disabled || loading,
        className: baseStyles,
        style: {
            padding: config.padding,
            fontSize: config.fontSize,
            minHeight: config.minHeight
        },
        onClick: onClick,
        onMouseDown: onMouseDown,
        onMouseUp: onMouseUp,
        onTouchStart: onTouchStart,
        onTouchEnd: onTouchEnd,
        onKeyDown: onKeyDown,
        onKeyUp: onKeyUp,
        onFocus: onFocus,
        onBlur: onBlur,
        "aria-busy": loading,
        ...otherProps,
        children: [
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "animate-spin h-4 w-4",
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                "aria-hidden": "true",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        className: "opacity-25",
                        cx: "12",
                        cy: "12",
                        r: "10",
                        stroke: "currentColor",
                        strokeWidth: "4"
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Button.tsx",
                        lineNumber: 192,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        className: "opacity-75",
                        fill: "currentColor",
                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Button.tsx",
                        lineNumber: 200,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/Button.tsx",
                lineNumber: 185,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            !loading && icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "flex-shrink-0",
                children: icon
            }, void 0, false, {
                fileName: "[project]/lib/ui/Button.tsx",
                lineNumber: 207,
                columnNumber: 30
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: children
            }, void 0, false, {
                fileName: "[project]/lib/ui/Button.tsx",
                lineNumber: 208,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/Button.tsx",
        lineNumber: 162,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Button;
Button.displayName = 'Button';
const __TURBOPACK__default__export__ = Button;
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Card.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
;
function Card({ header, footer, children, padding = 'lg', radius: radiusVariant = 'xl', shadow: shadowVariant = 'sm', interactive = false, border = true, onClick, className = '', ...props }) {
    // Padding configurations
    const paddingConfig = {
        none: '0',
        sm: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].md,
        md: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg,
        lg: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xl
    };
    // Shadow configurations
    const shadowConfig = {
        none: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shadows"].none,
        sm: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shadows"].sm,
        md: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shadows"].md,
        lg: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shadows"].lg
    };
    // Radius configurations
    const radiusConfig = {
        md: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["radii"].md,
        lg: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["radii"].lg,
        xl: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["radii"].xl,
        '2xl': __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["radii"]['2xl']
    };
    const paddingValue = paddingConfig[padding];
    const shadowValue = shadowConfig[shadowVariant];
    const radiusValue = radiusConfig[radiusVariant];
    // Base styles
    const baseClasses = `bg-white dark:bg-slate-800 ${border ? 'border border-slate-200 dark:border-slate-700' : ''} transition-colors duration-150`;
    // Interactive styles
    const interactiveClasses = interactive ? 'cursor-pointer hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg active:scale-[0.99] transition-all duration-200' : '';
    if (onClick) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            className: `${baseClasses} ${interactiveClasses} ${className}`,
            style: {
                borderRadius: radiusValue,
                boxShadow: shadowValue
            },
            onClick: onClick,
            onKeyDown: (e)=>{
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            },
            children: [
                header && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border-b border-slate-200 dark:border-slate-700",
                    style: {
                        padding: paddingValue
                    },
                    children: header
                }, void 0, false, {
                    fileName: "[project]/lib/ui/Card.tsx",
                    lineNumber: 126,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        padding: paddingValue
                    },
                    children: children
                }, void 0, false, {
                    fileName: "[project]/lib/ui/Card.tsx",
                    lineNumber: 135,
                    columnNumber: 9
                }, this),
                footer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border-t border-slate-200 dark:border-slate-700",
                    style: {
                        padding: paddingValue
                    },
                    children: footer
                }, void 0, false, {
                    fileName: "[project]/lib/ui/Card.tsx",
                    lineNumber: 143,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/lib/ui/Card.tsx",
            lineNumber: 110,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${baseClasses} ${interactiveClasses} ${className}`,
        style: {
            borderRadius: radiusValue,
            boxShadow: shadowValue
        },
        ...props,
        children: [
            header && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-b border-slate-200 dark:border-slate-700",
                style: {
                    padding: paddingValue
                },
                children: header
            }, void 0, false, {
                fileName: "[project]/lib/ui/Card.tsx",
                lineNumber: 166,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: paddingValue
                },
                children: children
            }, void 0, false, {
                fileName: "[project]/lib/ui/Card.tsx",
                lineNumber: 175,
                columnNumber: 7
            }, this),
            footer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-t border-slate-200 dark:border-slate-700",
                style: {
                    padding: paddingValue
                },
                children: footer
            }, void 0, false, {
                fileName: "[project]/lib/ui/Card.tsx",
                lineNumber: 183,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/Card.tsx",
        lineNumber: 157,
        columnNumber: 5
    }, this);
}
_c = Card;
const __TURBOPACK__default__export__ = Card;
var _c;
__turbopack_context__.k.register(_c, "Card");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Input.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
const Input = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = _s(({ error = false, errorMessage, helperText, inputSize = 'md', className = '', disabled = false, ...props }, ref)=>{
    _s();
    // Size configurations
    const sizeConfig = {
        sm: {
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            minHeight: '36px'
        },
        md: {
            padding: '0.625rem 0.875rem',
            fontSize: '1rem',
            minHeight: '44px'
        },
        lg: {
            padding: '0.75rem 1rem',
            fontSize: '1.125rem',
            minHeight: '52px'
        }
    };
    const config = sizeConfig[inputSize];
    const baseClasses = `
      w-full
      border-2
      rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1
      disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60
    `;
    const stateClasses = error ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 placeholder-red-400 dark:placeholder-red-300' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-sky-500';
    const generatedId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    const inputId = props.id || generatedId;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ref: ref,
                id: inputId,
                disabled: disabled,
                className: `${baseClasses} ${stateClasses} ${className}`,
                style: {
                    padding: config.padding,
                    fontSize: config.fontSize,
                    minHeight: config.minHeight,
                    borderRadius: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["radii"].lg
                },
                "aria-invalid": error,
                "aria-describedby": errorMessage ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined,
                ...props
            }, void 0, false, {
                fileName: "[project]/lib/ui/Input.tsx",
                lineNumber: 88,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            errorMessage && error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: `${inputId}-error`,
                className: "text-sm text-red-600 dark:text-red-400 mt-1.5",
                style: {
                    marginLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
                },
                children: errorMessage
            }, void 0, false, {
                fileName: "[project]/lib/ui/Input.tsx",
                lineNumber: 106,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            helperText && !error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: `${inputId}-helper`,
                className: "text-sm text-slate-500 dark:text-slate-400 mt-1.5",
                style: {
                    marginLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
                },
                children: helperText
            }, void 0, false, {
                fileName: "[project]/lib/ui/Input.tsx",
                lineNumber: 115,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/Input.tsx",
        lineNumber: 87,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
}, "P3bvVUypbBAHy0F8g4TFKgtieUM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
})), "P3bvVUypbBAHy0F8g4TFKgtieUM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c1 = Input;
Input.displayName = 'Input';
const __TURBOPACK__default__export__ = Input;
var _c, _c1;
__turbopack_context__.k.register(_c, "Input$forwardRef");
__turbopack_context__.k.register(_c1, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Textarea.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Textarea",
    ()=>Textarea,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
const Textarea = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = _s(({ error = false, errorMessage, helperText, textareaSize = 'md', className = '', disabled = false, rows = 4, ...props }, ref)=>{
    _s();
    // Size configurations
    const sizeConfig = {
        sm: {
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem'
        },
        md: {
            padding: '0.625rem 0.875rem',
            fontSize: '1rem'
        },
        lg: {
            padding: '0.75rem 1rem',
            fontSize: '1.125rem'
        }
    };
    const config = sizeConfig[textareaSize];
    const baseClasses = `
      w-full
      border-2
      rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1
      disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60
      resize-y
    `;
    const stateClasses = error ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 placeholder-red-400 dark:placeholder-red-300' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-sky-500';
    const generatedId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    const textareaId = props.id || generatedId;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                ref: ref,
                id: textareaId,
                disabled: disabled,
                rows: rows,
                className: `${baseClasses} ${stateClasses} ${className}`,
                style: {
                    padding: config.padding,
                    fontSize: config.fontSize,
                    borderRadius: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["radii"].lg
                },
                "aria-invalid": error,
                "aria-describedby": errorMessage ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined,
                ...props
            }, void 0, false, {
                fileName: "[project]/lib/ui/Textarea.tsx",
                lineNumber: 87,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            errorMessage && error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: `${textareaId}-error`,
                className: "text-sm text-red-600 dark:text-red-400 mt-1.5",
                style: {
                    marginLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
                },
                children: errorMessage
            }, void 0, false, {
                fileName: "[project]/lib/ui/Textarea.tsx",
                lineNumber: 105,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            helperText && !error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: `${textareaId}-helper`,
                className: "text-sm text-slate-500 dark:text-slate-400 mt-1.5",
                style: {
                    marginLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
                },
                children: helperText
            }, void 0, false, {
                fileName: "[project]/lib/ui/Textarea.tsx",
                lineNumber: 114,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/Textarea.tsx",
        lineNumber: 86,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
}, "P3bvVUypbBAHy0F8g4TFKgtieUM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
})), "P3bvVUypbBAHy0F8g4TFKgtieUM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c1 = Textarea;
Textarea.displayName = 'Textarea';
const __TURBOPACK__default__export__ = Textarea;
var _c, _c1;
__turbopack_context__.k.register(_c, "Textarea$forwardRef");
__turbopack_context__.k.register(_c1, "Textarea");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Select.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Select",
    ()=>Select,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
const Select = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = _s(({ error = false, errorMessage, helperText, selectSize = 'md', className = '', disabled = false, children, ...props }, ref)=>{
    _s();
    // Size configurations
    const sizeConfig = {
        sm: {
            padding: '0.5rem 2rem 0.5rem 0.75rem',
            fontSize: '0.875rem',
            minHeight: '36px'
        },
        md: {
            padding: '0.625rem 2.5rem 0.625rem 0.875rem',
            fontSize: '1rem',
            minHeight: '44px'
        },
        lg: {
            padding: '0.75rem 3rem 0.75rem 1rem',
            fontSize: '1.125rem',
            minHeight: '52px'
        }
    };
    const config = sizeConfig[selectSize];
    const baseClasses = `
      w-full
      border-2
      rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1
      disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60
      appearance-none
      bg-no-repeat
      cursor-pointer
    `;
    const stateClasses = error ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-sky-500';
    // Custom dropdown arrow
    // Note: SVG data URLs cannot use CSS classes, so we use a mid-tone that works in both themes
    // For error state, use red; for normal state, use a neutral gray
    const backgroundImage = error ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23dc2626' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")` : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`;
    // Alternative: Use CSS background-image with currentColor via mask-image
    // This would require refactoring to use mask-image property instead
    const generatedId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    const selectId = props.id || generatedId;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                ref: ref,
                id: selectId,
                disabled: disabled,
                className: `${baseClasses} ${stateClasses} ${className}`,
                style: {
                    padding: config.padding,
                    fontSize: config.fontSize,
                    minHeight: config.minHeight,
                    borderRadius: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["radii"].lg,
                    backgroundImage,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5rem 1.5rem'
                },
                "aria-invalid": error,
                "aria-describedby": errorMessage ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined,
                ...props,
                children: children
            }, void 0, false, {
                fileName: "[project]/lib/ui/Select.tsx",
                lineNumber: 101,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            errorMessage && error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: `${selectId}-error`,
                className: "text-sm text-red-600 dark:text-red-400 mt-1.5",
                style: {
                    marginLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
                },
                children: errorMessage
            }, void 0, false, {
                fileName: "[project]/lib/ui/Select.tsx",
                lineNumber: 124,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            helperText && !error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: `${selectId}-helper`,
                className: "text-sm text-slate-500 dark:text-slate-400 mt-1.5",
                style: {
                    marginLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
                },
                children: helperText
            }, void 0, false, {
                fileName: "[project]/lib/ui/Select.tsx",
                lineNumber: 133,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/Select.tsx",
        lineNumber: 100,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
}, "P3bvVUypbBAHy0F8g4TFKgtieUM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
})), "P3bvVUypbBAHy0F8g4TFKgtieUM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c1 = Select;
Select.displayName = 'Select';
const __TURBOPACK__default__export__ = Select;
var _c, _c1;
__turbopack_context__.k.register(_c, "Select$forwardRef");
__turbopack_context__.k.register(_c1, "Select");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Label.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Label",
    ()=>Label,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
;
function Label({ required = false, children, size = 'md', className = '', ...props }) {
    const sizeConfig = {
        sm: {
            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.sm,
            marginBottom: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
        },
        md: {
            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.base,
            marginBottom: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].sm
        },
        lg: {
            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.lg,
            marginBottom: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].sm
        }
    };
    const config = sizeConfig[size];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: `block font-medium text-slate-700 dark:text-slate-300 ${className}`,
        style: {
            fontSize: config.fontSize,
            marginBottom: config.marginBottom
        },
        ...props,
        children: [
            children,
            required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-red-600 dark:text-red-400 ml-1",
                "aria-label": "required",
                children: "*"
            }, void 0, false, {
                fileName: "[project]/lib/ui/Label.tsx",
                lineNumber: 66,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/Label.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_c = Label;
const __TURBOPACK__default__export__ = Label;
var _c;
__turbopack_context__.k.register(_c, "Label");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/FormField.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FormField",
    ()=>FormField,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Label.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
;
;
function FormField({ label, required = false, children, description, htmlFor }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        style: {
            marginBottom: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg
        },
        children: [
            label && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                htmlFor: htmlFor,
                required: required,
                children: label
            }, void 0, false, {
                fileName: "[project]/lib/ui/FormField.tsx",
                lineNumber: 57,
                columnNumber: 9
            }, this),
            description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-slate-600 mb-2",
                style: {
                    marginLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
                },
                children: description
            }, void 0, false, {
                fileName: "[project]/lib/ui/FormField.tsx",
                lineNumber: 62,
                columnNumber: 9
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/FormField.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_c = FormField;
const __TURBOPACK__default__export__ = FormField;
var _c;
__turbopack_context__.k.register(_c, "FormField");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Table.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Table",
    ()=>Table,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
;
function Table({ columns, data, keyExtractor = (_, index)=>index, bordered = true, hoverable = true, striped = false, emptyMessage = 'Keine Daten vorhanden', loading = false, onRowClick, className = '', ...props }) {
    const containerClasses = `overflow-x-auto bg-white dark:bg-slate-800 transition-colors duration-150 ${bordered ? 'border border-slate-200 dark:border-slate-700 rounded-xl' : ''}`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${containerClasses} ${className}`,
        style: {
            borderRadius: bordered ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["radii"].xl : undefined,
            boxShadow: bordered ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shadows"].sm : undefined
        },
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full text-sm",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    className: "bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        children: columns.map((column, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: `px-4 py-4 font-semibold text-slate-700 dark:text-slate-300 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`,
                                style: {
                                    width: column.width
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: column.header
                                        }, void 0, false, {
                                            fileName: "[project]/lib/ui/Table.tsx",
                                            lineNumber: 107,
                                            columnNumber: 19
                                        }, this),
                                        column.sortable && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-4 h-4 text-slate-400",
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            "aria-hidden": "true",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                            }, void 0, false, {
                                                fileName: "[project]/lib/ui/Table.tsx",
                                                lineNumber: 116,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/lib/ui/Table.tsx",
                                            lineNumber: 109,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/lib/ui/Table.tsx",
                                    lineNumber: 106,
                                    columnNumber: 17
                                }, this)
                            }, index, false, {
                                fileName: "[project]/lib/ui/Table.tsx",
                                lineNumber: 95,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Table.tsx",
                        lineNumber: 93,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/lib/ui/Table.tsx",
                    lineNumber: 92,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            colSpan: columns.length,
                            className: "px-4 py-12 text-center text-slate-500 dark:text-slate-400",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "animate-spin h-5 w-5 text-sky-600 dark:text-sky-400",
                                        xmlns: "http://www.w3.org/2000/svg",
                                        fill: "none",
                                        viewBox: "0 0 24 24",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                className: "opacity-25",
                                                cx: "12",
                                                cy: "12",
                                                r: "10",
                                                stroke: "currentColor",
                                                strokeWidth: "4"
                                            }, void 0, false, {
                                                fileName: "[project]/lib/ui/Table.tsx",
                                                lineNumber: 140,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                className: "opacity-75",
                                                fill: "currentColor",
                                                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            }, void 0, false, {
                                                fileName: "[project]/lib/ui/Table.tsx",
                                                lineNumber: 148,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/lib/ui/Table.tsx",
                                        lineNumber: 134,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Laden..."
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/Table.tsx",
                                        lineNumber: 154,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/lib/ui/Table.tsx",
                                lineNumber: 133,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/lib/ui/Table.tsx",
                            lineNumber: 132,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Table.tsx",
                        lineNumber: 131,
                        columnNumber: 13
                    }, this) : data.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            colSpan: columns.length,
                            className: "px-4 py-12 text-center text-slate-500 dark:text-slate-400",
                            children: emptyMessage
                        }, void 0, false, {
                            fileName: "[project]/lib/ui/Table.tsx",
                            lineNumber: 160,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Table.tsx",
                        lineNumber: 159,
                        columnNumber: 13
                    }, this) : data.map((row, rowIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: `
                  ${striped && rowIndex % 2 === 1 ? 'bg-slate-50 dark:bg-slate-700/30' : ''}
                  ${hoverable ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${rowIndex !== data.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}
                `,
                            onClick: ()=>onRowClick?.(row, rowIndex),
                            role: onRowClick ? 'button' : undefined,
                            tabIndex: onRowClick ? 0 : undefined,
                            onKeyDown: onRowClick ? (e)=>{
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onRowClick(row, rowIndex);
                                }
                            } : undefined,
                            children: columns.map((column, colIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: `px-4 py-4 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`,
                                    children: column.accessor(row)
                                }, colIndex, false, {
                                    fileName: "[project]/lib/ui/Table.tsx",
                                    lineNumber: 189,
                                    columnNumber: 19
                                }, this))
                        }, keyExtractor(row, rowIndex), false, {
                            fileName: "[project]/lib/ui/Table.tsx",
                            lineNumber: 166,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/lib/ui/Table.tsx",
                    lineNumber: 129,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/lib/ui/Table.tsx",
            lineNumber: 91,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/lib/ui/Table.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
_c = Table;
const __TURBOPACK__default__export__ = Table;
var _c;
__turbopack_context__.k.register(_c, "Table");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/AppShell.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AppShell",
    ()=>AppShell,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
'use client';
;
;
;
function AppShell({ appTitle = 'Rhythmologicum Connect', subtitle, userEmail, onSignOut, navItems = [], children, footerContent }) {
    const currentYear = new Date().getFullYear();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-150",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-150",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-5",
                    style: {
                        paddingLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg,
                        paddingRight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs sm:text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400",
                                        children: appTitle
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/AppShell.tsx",
                                        lineNumber: 76,
                                        columnNumber: 15
                                    }, this),
                                    subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm md:text-base font-medium text-slate-900 dark:text-slate-100 mt-0.5",
                                        children: subtitle
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/AppShell.tsx",
                                        lineNumber: 80,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/lib/ui/AppShell.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 md:gap-4",
                                children: [
                                    userEmail && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs sm:text-sm text-slate-600 dark:text-slate-300 hidden sm:inline",
                                        children: userEmail
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/AppShell.tsx",
                                        lineNumber: 87,
                                        columnNumber: 17
                                    }, this),
                                    onSignOut && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: onSignOut,
                                        className: "px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 touch-manipulation",
                                        children: "Abmelden"
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/AppShell.tsx",
                                        lineNumber: 92,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/lib/ui/AppShell.tsx",
                                lineNumber: 85,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/lib/ui/AppShell.tsx",
                        lineNumber: 74,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/lib/ui/AppShell.tsx",
                    lineNumber: 70,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/lib/ui/AppShell.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            navItems.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-150",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6",
                    style: {
                        paddingLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg,
                        paddingRight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1 overflow-x-auto",
                        children: navItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: item.href,
                                className: `
                    px-4 py-3 text-sm font-medium
                    transition-all duration-200
                    border-b-2
                    whitespace-nowrap
                    ${item.active ? 'text-sky-600 dark:text-sky-400 border-sky-600 dark:border-sky-400' : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
                  `,
                                children: item.label
                            }, item.href, false, {
                                fileName: "[project]/lib/ui/AppShell.tsx",
                                lineNumber: 113,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/AppShell.tsx",
                        lineNumber: 111,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/lib/ui/AppShell.tsx",
                    lineNumber: 107,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/lib/ui/AppShell.tsx",
                lineNumber: 106,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-1",
                style: {
                    padding: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/lib/ui/AppShell.tsx",
                    lineNumber: 138,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/lib/ui/AppShell.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-auto transition-colors duration-150",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-5",
                    style: {
                        paddingLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg,
                        paddingRight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg
                    },
                    children: footerContent ? footerContent : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row items-center justify-between gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col sm:flex-row items-center gap-2 sm:gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[11px] sm:text-xs text-slate-500 text-center sm:text-left",
                                        children: [
                                            appTitle,
                                            " – Frühe Testversion, nicht für den klinischen Einsatz."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/lib/ui/AppShell.tsx",
                                        lineNumber: 152,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/datenschutz",
                                        className: "text-[11px] sm:text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors",
                                        children: "Datenschutz"
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/AppShell.tsx",
                                        lineNumber: 155,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/lib/ui/AppShell.tsx",
                                lineNumber: 151,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] sm:text-xs text-slate-400",
                                children: [
                                    "© ",
                                    currentYear,
                                    " Rhythmologicum"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/lib/ui/AppShell.tsx",
                                lineNumber: 162,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/lib/ui/AppShell.tsx",
                        lineNumber: 150,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/lib/ui/AppShell.tsx",
                    lineNumber: 143,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/lib/ui/AppShell.tsx",
                lineNumber: 142,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/AppShell.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
_c = AppShell;
const __TURBOPACK__default__export__ = AppShell;
var _c;
__turbopack_context__.k.register(_c, "AppShell");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/HelperText.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HelperText",
    ()=>HelperText,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
;
function HelperText({ size = 'sm', className = '', children, ...props }) {
    const sizeConfig = {
        sm: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.sm,
        md: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.base
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: `text-slate-500 dark:text-slate-400 ${className}`,
        style: {
            fontSize: sizeConfig[size],
            marginTop: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs,
            marginLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
        },
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/ui/HelperText.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
_c = HelperText;
const __TURBOPACK__default__export__ = HelperText;
var _c;
__turbopack_context__.k.register(_c, "HelperText");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/ErrorText.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ErrorText",
    ()=>ErrorText,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
;
function ErrorText({ size = 'sm', className = '', children, ...props }) {
    const sizeConfig = {
        sm: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.sm,
        md: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.base
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: `text-red-600 dark:text-red-400 ${className}`,
        role: "alert",
        style: {
            fontSize: sizeConfig[size],
            marginTop: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs,
            marginLeft: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xs
        },
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/ui/ErrorText.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}
_c = ErrorText;
const __TURBOPACK__default__export__ = ErrorText;
var _c;
__turbopack_context__.k.register(_c, "ErrorText");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Progress.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Progress",
    ()=>Progress,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
;
function Progress({ value, showPercentage = true, showStepText = true, currentStep, totalSteps, color = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["colors"].primary[500], variant = 'bar', size = 'md', className = '', ...props }) {
    const progressTokens = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["componentTokens"].progressBar;
    // Size configurations
    const sizeConfig = {
        sm: {
            height: '0.375rem',
            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.xs
        },
        md: {
            height: progressTokens.height,
            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.sm
        },
        lg: {
            height: '0.75rem',
            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.base
        }
    };
    const config = sizeConfig[size];
    // Clamp value between 0-100
    const clampedValue = Math.min(Math.max(value, 0), 100);
    // Calculate step display text
    const stepText = currentStep && totalSteps ? `Schritt ${currentStep} von ${totalSteps}` : showStepText && totalSteps ? `Frage ${Math.ceil(clampedValue / 100 * totalSteps)} von ${totalSteps}` : null;
    if (variant === 'steps' && totalSteps) {
        // Step indicator variant
        const currentStepIndex = currentStep ? currentStep - 1 : Math.floor(clampedValue / 100 * totalSteps);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: className,
            ...props,
            children: [
                (showStepText || showPercentage) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between text-slate-700 mb-2",
                    style: {
                        fontSize: config.fontSize
                    },
                    children: [
                        stepText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "font-medium",
                            children: stepText
                        }, void 0, false, {
                            fileName: "[project]/lib/ui/Progress.tsx",
                            lineNumber: 114,
                            columnNumber: 26
                        }, this),
                        showPercentage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-slate-500",
                            style: {
                                fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.xs
                            },
                            children: [
                                Math.round(clampedValue),
                                "%"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/lib/ui/Progress.tsx",
                            lineNumber: 116,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/lib/ui/Progress.tsx",
                    lineNumber: 110,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-2",
                    children: Array.from({
                        length: totalSteps
                    }, (_, i)=>{
                        const isCompleted = i < currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        const isPending = i > currentStepIndex;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 overflow-hidden",
                            style: {
                                height: config.height,
                                borderRadius: progressTokens.borderRadius,
                                backgroundColor: isPending ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["colors"].neutral[200] : color,
                                opacity: isCompleted ? 1 : isCurrent ? 0.8 : 0.3,
                                transition: progressTokens.transition
                            },
                            "aria-label": `Schritt ${i + 1}${isCompleted ? ' abgeschlossen' : isCurrent ? ' aktuell' : ''}`
                        }, i, false, {
                            fileName: "[project]/lib/ui/Progress.tsx",
                            lineNumber: 129,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/lib/ui/Progress.tsx",
                    lineNumber: 122,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/lib/ui/Progress.tsx",
            lineNumber: 108,
            columnNumber: 7
        }, this);
    }
    // Bar variant (default)
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: className,
        ...props,
        children: [
            (showStepText || showPercentage) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between text-slate-700 mb-2",
                style: {
                    fontSize: config.fontSize
                },
                children: [
                    stepText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-medium",
                        children: stepText
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Progress.tsx",
                        lineNumber: 156,
                        columnNumber: 24
                    }, this),
                    showPercentage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-slate-500",
                        style: {
                            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.xs
                        },
                        children: [
                            Math.round(clampedValue),
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/lib/ui/Progress.tsx",
                        lineNumber: 158,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/Progress.tsx",
                lineNumber: 152,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full bg-slate-200 overflow-hidden",
                style: {
                    height: config.height,
                    borderRadius: progressTokens.borderRadius
                },
                role: "progressbar",
                "aria-valuenow": clampedValue,
                "aria-valuemin": 0,
                "aria-valuemax": 100,
                "aria-label": `Fortschritt: ${Math.round(clampedValue)}%`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: `${clampedValue}%`,
                        height: config.height,
                        borderRadius: progressTokens.borderRadius,
                        backgroundColor: color,
                        transition: progressTokens.transition
                    }
                }, void 0, false, {
                    fileName: "[project]/lib/ui/Progress.tsx",
                    lineNumber: 176,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/lib/ui/Progress.tsx",
                lineNumber: 164,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/Progress.tsx",
        lineNumber: 150,
        columnNumber: 5
    }, this);
}
_c = Progress;
const __TURBOPACK__default__export__ = Progress;
var _c;
__turbopack_context__.k.register(_c, "Progress");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
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
"[project]/lib/ui/ThemeToggle.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeToggle",
    ()=>ThemeToggle,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contexts$2f$ThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/contexts/ThemeContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function ThemeToggle({ size = 'md', showLabel = false, className = '' }) {
    _s();
    const themeContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contexts$2f$ThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"])();
    const theme = themeContext?.theme || 'light';
    const toggleTheme = themeContext?.toggleTheme || (()=>{});
    const sizeClasses = {
        sm: 'p-1.5 min-h-[36px] min-w-[36px]',
        md: 'p-2 min-h-[44px] min-w-[44px]',
        lg: 'p-2.5 min-h-[48px] min-w-[48px]'
    };
    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };
    const isDark = theme === 'dark';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: toggleTheme,
        className: `
        ${sizeClasses[size]}
        inline-flex items-center justify-center gap-2
        rounded-lg
        bg-slate-100 dark:bg-slate-800
        text-slate-700 dark:text-slate-200
        hover:bg-slate-200 dark:hover:bg-slate-700
        active:bg-slate-300 dark:active:bg-slate-600
        transition-all duration-150 ease-in-out
        touch-manipulation
        ${className}
      `,
        "aria-label": isDark ? 'Switch to light mode' : 'Switch to dark mode',
        title: isDark ? 'Light Mode' : 'Dark Mode',
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: false,
                animate: {
                    scale: [
                        0.8,
                        1.1,
                        1
                    ],
                    rotate: isDark ? 0 : 180
                },
                transition: {
                    duration: 0.15
                },
                className: "flex items-center",
                children: isDark ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                    className: iconSizes[size]
                }, void 0, false, {
                    fileName: "[project]/lib/ui/ThemeToggle.tsx",
                    lineNumber: 88,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                    className: iconSizes[size]
                }, void 0, false, {
                    fileName: "[project]/lib/ui/ThemeToggle.tsx",
                    lineNumber: 90,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/lib/ui/ThemeToggle.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this),
            showLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-sm font-medium whitespace-nowrap",
                children: isDark ? 'Dark' : 'Light'
            }, void 0, false, {
                fileName: "[project]/lib/ui/ThemeToggle.tsx",
                lineNumber: 94,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/ThemeToggle.tsx",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
_s(ThemeToggle, "QKpyrxz1huyqA3B/4s/ZCIrtbNA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contexts$2f$ThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"]
    ];
});
_c = ThemeToggle;
const __TURBOPACK__default__export__ = ThemeToggle;
var _c;
__turbopack_context__.k.register(_c, "ThemeToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/DesktopLayout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DesktopLayout",
    ()=>DesktopLayout,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.js [app-client] (ecmascript) <export default as LayoutDashboard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$workflow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Workflow$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/workflow.js [app-client] (ecmascript) <export default as Workflow>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/ThemeToggle.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function DesktopLayout({ appTitle = 'Rhythmologicum Connect', userEmail, onSignOut, navItems = [], children }) {
    _s();
    const [sidebarCollapsed, setSidebarCollapsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    // Icon mapping for common routes
    const getDefaultIcon = (href)=>{
        if (href === '/clinician' || href.endsWith('dashboard')) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__["LayoutDashboard"], {
                className: "w-5 h-5"
            }, void 0, false, {
                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                lineNumber: 69,
                columnNumber: 14
            }, this);
        }
        if (href.includes('funnel')) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$workflow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Workflow$3e$__["Workflow"], {
                className: "w-5 h-5"
            }, void 0, false, {
                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                lineNumber: 72,
                columnNumber: 14
            }, this);
        }
        if (href.includes('content')) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                className: "w-5 h-5"
            }, void 0, false, {
                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                lineNumber: 75,
                columnNumber: 14
            }, this);
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
            className: "w-5 h-5"
        }, void 0, false, {
            fileName: "[project]/lib/ui/DesktopLayout.tsx",
            lineNumber: 77,
            columnNumber: 12
        }, this);
    };
    // Determine active state if not explicitly set
    const getNavItems = ()=>{
        return navItems.map((item)=>({
                ...item,
                active: item.active !== undefined ? item.active : pathname === item.href || item.href !== '/clinician' && pathname?.startsWith(item.href),
                icon: item.icon || getDefaultIcon(item.href)
            }));
    };
    const processedNavItems = getNavItems();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-[#f7f9fa] dark:bg-slate-900 flex transition-colors duration-150",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: `
          fixed left-0 top-0 bottom-0 z-40 h-dvh bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
          hidden lg:flex flex-col shrink-0
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
        `,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700",
                        children: [
                            !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-sm font-semibold text-slate-900 dark:text-slate-100 truncate",
                                        children: appTitle
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                        lineNumber: 108,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-slate-500 dark:text-slate-400 truncate",
                                        children: "Clinician"
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                        lineNumber: 111,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                lineNumber: 107,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSidebarCollapsed(!sidebarCollapsed),
                                className: "p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0",
                                "aria-label": sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                    className: `w-5 h-5 text-slate-600 dark:text-slate-300 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`
                                }, void 0, false, {
                                    fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                    lineNumber: 119,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                lineNumber: 114,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "flex-1 overflow-y-auto py-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "space-y-1 px-2",
                            children: processedNavItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: item.href,
                                        className: `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${item.active ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'}
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `,
                                        title: sidebarCollapsed ? item.label : undefined,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: item.active ? 'text-sky-600' : 'text-slate-500',
                                                children: item.icon
                                            }, void 0, false, {
                                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                                lineNumber: 146,
                                                columnNumber: 19
                                            }, this),
                                            !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "flex-1 text-sm",
                                                children: item.label
                                            }, void 0, false, {
                                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                                lineNumber: 150,
                                                columnNumber: 21
                                            }, this),
                                            !sidebarCollapsed && item.active && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400"
                                            }, void 0, false, {
                                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                                lineNumber: 153,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                        lineNumber: 132,
                                        columnNumber: 17
                                    }, this)
                                }, item.href, false, {
                                    fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                    lineNumber: 131,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/lib/ui/DesktopLayout.tsx",
                            lineNumber: 129,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    userEmail && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-t border-slate-200 dark:border-slate-700 p-4 space-y-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                            className: "w-4 h-4 text-slate-600 dark:text-slate-300"
                                        }, void 0, false, {
                                            fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                            lineNumber: 170,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                        lineNumber: 169,
                                        columnNumber: 15
                                    }, this),
                                    !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-medium text-slate-900 dark:text-slate-100 truncate",
                                                children: userEmail.split('@')[0]
                                            }, void 0, false, {
                                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                                lineNumber: 174,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-slate-500 dark:text-slate-400 truncate",
                                                children: userEmail
                                            }, void 0, false, {
                                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                                lineNumber: 177,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                        lineNumber: 173,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                lineNumber: 164,
                                columnNumber: 13
                            }, this),
                            !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeToggle"], {
                                    size: "sm",
                                    showLabel: true
                                }, void 0, false, {
                                    fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                    lineNumber: 183,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                lineNumber: 182,
                                columnNumber: 15
                            }, this),
                            onSignOut && !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onSignOut,
                                className: "w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                        className: "w-4 h-4"
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                        lineNumber: 191,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Abmelden"
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                        lineNumber: 192,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                lineNumber: 187,
                                columnNumber: 15
                            }, this),
                            sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeToggle"], {
                                    size: "sm"
                                }, void 0, false, {
                                    fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                    lineNumber: 197,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                lineNumber: 196,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                        lineNumber: 163,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `
          flex-1 min-w-0
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
          min-h-dvh
        `,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "sticky top-0 z-30 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 lg:px-8 transition-colors duration-150",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between w-full",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-semibold text-slate-900 dark:text-slate-100",
                                children: processedNavItems.find((item)=>item.active)?.label || 'Dashboard'
                            }, void 0, false, {
                                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                                lineNumber: 219,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/lib/ui/DesktopLayout.tsx",
                            lineNumber: 217,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                        lineNumber: 216,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "p-4 lg:p-8 w-full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full mx-auto",
                            style: {
                                maxWidth: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["layout"].contentMaxWidth
                            },
                            children: children
                        }, void 0, false, {
                            fileName: "[project]/lib/ui/DesktopLayout.tsx",
                            lineNumber: 227,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/DesktopLayout.tsx",
                        lineNumber: 226,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/DesktopLayout.tsx",
                lineNumber: 207,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/DesktopLayout.tsx",
        lineNumber: 94,
        columnNumber: 5
    }, this);
}
_s(DesktopLayout, "ST1+jRscLFqQXbuEjJH/tgEPrik=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = DesktopLayout;
const __TURBOPACK__default__export__ = DesktopLayout;
var _c;
__turbopack_context__.k.register(_c, "DesktopLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Tabs.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TabContent",
    ()=>TabContent,
    "TabTrigger",
    ()=>TabTrigger,
    "Tabs",
    ()=>Tabs,
    "TabsList",
    ()=>TabsList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * Tabs Component
 * 
 * A tabbed navigation component for organizing content into separate views.
 * Part of the V0.4 Design System.
 * 
 * @example
 * ```tsx
 * <Tabs defaultTab="overview">
 *   <TabsList>
 *     <TabTrigger value="overview">Overview</TabTrigger>
 *     <TabTrigger value="history">History</TabTrigger>
 *   </TabsList>
 *   <TabContent value="overview">
 *     <p>Overview content</p>
 *   </TabContent>
 *   <TabContent value="history">
 *     <p>History content</p>
 *   </TabContent>
 * </Tabs>
 * ```
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
;
const TabsContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function useTabsContext() {
    _s();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(TabsContext);
    if (!context) {
        throw new Error('Tabs components must be used within a Tabs provider');
    }
    return context;
}
_s(useTabsContext, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
function Tabs({ defaultTab, children, className = '' }) {
    _s1();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(defaultTab);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TabsContext.Provider, {
        value: {
            activeTab,
            setActiveTab
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `w-full ${className}`,
            children: children
        }, void 0, false, {
            fileName: "[project]/lib/ui/Tabs.tsx",
            lineNumber: 58,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/lib/ui/Tabs.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
_s1(Tabs, "9WmCEOvw9OrQO0Lak90Gk/ssVsU=");
_c = Tabs;
function TabsList({ children, className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `flex border-b border-slate-200 gap-1 overflow-x-auto ${className}`,
        role: "tablist",
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/ui/Tabs.tsx",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
_c1 = TabsList;
function TabTrigger({ value, children, className = '' }) {
    _s2();
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        role: "tab",
        "aria-selected": isActive,
        onClick: ()=>setActiveTab(value),
        className: `
        px-4 py-3 text-sm md:text-base font-medium
        border-b-2 transition-all duration-200
        whitespace-nowrap touch-manipulation min-h-[44px]
        ${isActive ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}
        focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
        ${className}
      `,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/ui/Tabs.tsx",
        lineNumber: 101,
        columnNumber: 5
    }, this);
}
_s2(TabTrigger, "V2p0gOjlGA5ullrkerezY3nrpUY=", false, function() {
    return [
        useTabsContext
    ];
});
_c2 = TabTrigger;
function TabContent({ value, children, className = '' }) {
    _s3();
    const { activeTab } = useTabsContext();
    if (activeTab !== value) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "tabpanel",
        className: `py-6 ${className}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/ui/Tabs.tsx",
        lineNumber: 144,
        columnNumber: 5
    }, this);
}
_s3(TabContent, "koXCz7Z0REWiwHaC1uZ/wm+gIXg=", false, function() {
    return [
        useTabsContext
    ];
});
_c3 = TabContent;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "Tabs");
__turbopack_context__.k.register(_c1, "TabsList");
__turbopack_context__.k.register(_c2, "TabTrigger");
__turbopack_context__.k.register(_c3, "TabContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/LoadingSpinner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LoadingSpinner",
    ()=>LoadingSpinner,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function LoadingSpinner({ size = 'md', text, centered = false, className = '', ...props }) {
    // Size configurations
    const sizeConfig = {
        sm: {
            spinner: 'h-4 w-4',
            text: 'text-xs'
        },
        md: {
            spinner: 'h-8 w-8',
            text: 'text-sm'
        },
        lg: {
            spinner: 'h-12 w-12',
            text: 'text-base'
        },
        xl: {
            spinner: 'h-16 w-16',
            text: 'text-lg'
        }
    };
    const config = sizeConfig[size];
    const containerClasses = `
    ${centered ? 'flex flex-col items-center justify-center min-h-[200px]' : 'inline-flex flex-col items-center'}
    ${className}
  `;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: containerClasses,
        role: "status",
        "aria-live": "polite",
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: `animate-spin text-sky-600 ${config.spinner}`,
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                "aria-hidden": "true",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        className: "opacity-25",
                        cx: "12",
                        cy: "12",
                        r: "10",
                        stroke: "currentColor",
                        strokeWidth: "4"
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/LoadingSpinner.tsx",
                        lineNumber: 82,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        className: "opacity-75",
                        fill: "currentColor",
                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/LoadingSpinner.tsx",
                        lineNumber: 90,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/LoadingSpinner.tsx",
                lineNumber: 75,
                columnNumber: 7
            }, this),
            text && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: `mt-3 text-slate-600 font-medium ${config.text}`,
                children: text
            }, void 0, false, {
                fileName: "[project]/lib/ui/LoadingSpinner.tsx",
                lineNumber: 97,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "sr-only",
                children: text || 'Laden...'
            }, void 0, false, {
                fileName: "[project]/lib/ui/LoadingSpinner.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/LoadingSpinner.tsx",
        lineNumber: 74,
        columnNumber: 5
    }, this);
}
_c = LoadingSpinner;
const __TURBOPACK__default__export__ = LoadingSpinner;
var _c;
__turbopack_context__.k.register(_c, "LoadingSpinner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/Modal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Modal",
    ()=>Modal,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * Modal Component
 * 
 * A dialog overlay component for displaying content above the main page.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Accessible with proper ARIA attributes and focus management
 * - Backdrop click and Escape key to close
 * - Optional header and footer sections
 * - Configurable sizes
 * - Uses semantic design tokens
 * - Smooth animations
 * - Body scroll lock when open
 * 
 * @example
 * // Basic modal
 * <Modal isOpen={isOpen} onClose={handleClose} title="Confirm Action">
 *   Are you sure you want to proceed?
 * </Modal>
 * 
 * @example
 * // Modal with footer actions
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Delete Assessment"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={handleClose}>Cancel</Button>
 *       <Button variant="destructive" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   This action cannot be undone.
 * </Modal>
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
;
;
function Modal({ isOpen, onClose, title, children, footer, size = 'md', closeOnBackdropClick = true, closeOnEscape = true, className = '' }) {
    _s();
    const modalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const previousActiveElement = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Size configurations
    const sizeConfig = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };
    // Handle escape key
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Modal.useEffect": ()=>{
            if (!isOpen || !closeOnEscape) return;
            const handleEscape = {
                "Modal.useEffect.handleEscape": (event)=>{
                    if (event.key === 'Escape') {
                        onClose();
                    }
                }
            }["Modal.useEffect.handleEscape"];
            document.addEventListener('keydown', handleEscape);
            return ({
                "Modal.useEffect": ()=>document.removeEventListener('keydown', handleEscape)
            })["Modal.useEffect"];
        }
    }["Modal.useEffect"], [
        isOpen,
        closeOnEscape,
        onClose
    ]);
    // Handle focus trap and body scroll lock
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Modal.useEffect": ()=>{
            if (!isOpen) return;
            // Store the currently focused element
            previousActiveElement.current = document.activeElement;
            // Lock body scroll
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            // Focus the modal
            modalRef.current?.focus();
            return ({
                "Modal.useEffect": ()=>{
                    // Restore body scroll
                    document.body.style.overflow = originalOverflow;
                    // Restore focus to previous element
                    previousActiveElement.current?.focus();
                }
            })["Modal.useEffect"];
        }
    }["Modal.useEffect"], [
        isOpen
    ]);
    if (!isOpen) {
        return null;
    }
    const handleBackdropClick = (event)=>{
        if (closeOnBackdropClick && event.target === event.currentTarget) {
            onClose();
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
        onClick: handleBackdropClick,
        "aria-modal": "true",
        role: "dialog",
        "aria-labelledby": title ? 'modal-title' : undefined,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-200",
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/lib/ui/Modal.tsx",
                lineNumber: 175,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: modalRef,
                tabIndex: -1,
                className: `
          relative w-full ${sizeConfig[size]}
          bg-white dark:bg-slate-800
          rounded-xl shadow-xl
          max-h-[90vh] flex flex-col
          transition-all duration-200
          ${className}
        `,
                style: {
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-2xl)'
                },
                children: [
                    title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700",
                        style: {
                            padding: 'var(--spacing-xl)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                id: "modal-title",
                                className: "text-xl font-semibold text-slate-900 dark:text-slate-100",
                                style: {
                                    fontSize: 'var(--font-size-xl)'
                                },
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/lib/ui/Modal.tsx",
                                lineNumber: 203,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: onClose,
                                className: " rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200 ",
                                "aria-label": "Close modal",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "w-5 h-5",
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/lib/ui/Modal.tsx",
                                    lineNumber: 222,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/lib/ui/Modal.tsx",
                                lineNumber: 210,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/lib/ui/Modal.tsx",
                        lineNumber: 199,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 overflow-y-auto p-6",
                        style: {
                            padding: 'var(--spacing-xl)'
                        },
                        children: children
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Modal.tsx",
                        lineNumber: 228,
                        columnNumber: 9
                    }, this),
                    footer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700",
                        style: {
                            padding: 'var(--spacing-xl)',
                            gap: 'var(--spacing-md)'
                        },
                        children: footer
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Modal.tsx",
                        lineNumber: 237,
                        columnNumber: 11
                    }, this),
                    !title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: onClose,
                        className: " absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors duration-200 ",
                        "aria-label": "Close modal",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            className: "w-5 h-5",
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/lib/ui/Modal.tsx",
                            lineNumber: 263,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/Modal.tsx",
                        lineNumber: 250,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/Modal.tsx",
                lineNumber: 181,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/Modal.tsx",
        lineNumber: 167,
        columnNumber: 5
    }, this);
}
_s(Modal, "6+ymxbc78AAZOIolDu7q65cLeFc=");
_c = Modal;
const __TURBOPACK__default__export__ = Modal;
var _c;
__turbopack_context__.k.register(_c, "Modal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/ErrorState.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ErrorState",
    ()=>ErrorState,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Button.tsx [app-client] (ecmascript)");
;
;
function ErrorState({ title = 'Ein Fehler ist aufgetreten', message = 'Bitte versuchen Sie es später erneut.', onRetry, retryText = 'Erneut versuchen', centered = false, icon, className = '', ...props }) {
    const containerClasses = `
    ${centered ? 'flex flex-col items-center justify-center min-h-[300px] text-center' : 'flex flex-col items-center text-center'}
    ${className}
  `;
    const defaultIcon = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        className: "h-16 w-16 text-red-500",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        "aria-hidden": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        }, void 0, false, {
            fileName: "[project]/lib/ui/ErrorState.tsx",
            lineNumber: 71,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/lib/ui/ErrorState.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: containerClasses,
        role: "alert",
        "aria-live": "assertive",
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4",
                children: icon || defaultIcon
            }, void 0, false, {
                fileName: "[project]/lib/ui/ErrorState.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-xl md:text-2xl font-semibold text-slate-900 mb-2",
                children: title
            }, void 0, false, {
                fileName: "[project]/lib/ui/ErrorState.tsx",
                lineNumber: 86,
                columnNumber: 7
            }, this),
            typeof message === 'string' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm md:text-base text-slate-600 mb-6 max-w-md",
                children: message
            }, void 0, false, {
                fileName: "[project]/lib/ui/ErrorState.tsx",
                lineNumber: 91,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-sm md:text-base text-slate-600 mb-6 max-w-md",
                children: message
            }, void 0, false, {
                fileName: "[project]/lib/ui/ErrorState.tsx",
                lineNumber: 95,
                columnNumber: 9
            }, this),
            onRetry && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                variant: "primary",
                onClick: onRetry,
                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "h-4 w-4",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    stroke: "currentColor",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/ErrorState.tsx",
                        lineNumber: 111,
                        columnNumber: 15
                    }, void 0)
                }, void 0, false, {
                    fileName: "[project]/lib/ui/ErrorState.tsx",
                    lineNumber: 105,
                    columnNumber: 13
                }, void 0),
                children: retryText
            }, void 0, false, {
                fileName: "[project]/lib/ui/ErrorState.tsx",
                lineNumber: 101,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/ErrorState.tsx",
        lineNumber: 81,
        columnNumber: 5
    }, this);
}
_c = ErrorState;
const __TURBOPACK__default__export__ = ErrorState;
var _c;
__turbopack_context__.k.register(_c, "ErrorState");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/PageHeader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageHeader",
    ()=>PageHeader,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
'use client';
;
;
function PageHeader({ title, description, actions, className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${className}`,
        style: {
            marginBottom: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].xl
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-w-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/PageHeader.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-base text-slate-600 dark:text-slate-300",
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/PageHeader.tsx",
                        lineNumber: 41,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/PageHeader.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            actions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-3 items-start shrink-0",
                children: actions
            }, void 0, false, {
                fileName: "[project]/lib/ui/PageHeader.tsx",
                lineNumber: 47,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/PageHeader.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_c = PageHeader;
const __TURBOPACK__default__export__ = PageHeader;
var _c;
__turbopack_context__.k.register(_c, "PageHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/SectionHeader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SectionHeader",
    ()=>SectionHeader,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
'use client';
;
;
function SectionHeader({ title, description, actions, className = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `flex items-start justify-between gap-4 ${className}`,
        style: {
            marginBottom: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].lg
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-w-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-xl font-semibold text-slate-900 dark:text-slate-50",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/SectionHeader.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-slate-600 dark:text-slate-300 mt-1",
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/SectionHeader.tsx",
                        lineNumber: 41,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/SectionHeader.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            actions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2 items-start shrink-0",
                children: actions
            }, void 0, false, {
                fileName: "[project]/lib/ui/SectionHeader.tsx",
                lineNumber: 47,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/SectionHeader.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_c = SectionHeader;
const __TURBOPACK__default__export__ = SectionHeader;
var _c;
__turbopack_context__.k.register(_c, "SectionHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/safety/disclaimers.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * E6.6.8 — Safety Copy: Centralized Disclaimers & Emergency Guidance
 *
 * Single source of truth for all patient-facing disclaimers and emergency contact information.
 * Ensures consistent safety messaging across dashboard, triage, and escalation paths.
 *
 * Key Principles:
 * - Clear, concise language (German)
 * - Consistent emergency numbers across all contexts
 * - Non-emergency disclaimers prevent misuse
 * - Red flag escalations use stronger, more urgent language
 */ /**
 * Emergency contact numbers for Germany
 * These should be displayed consistently throughout the app
 */ __turbopack_context__.s([
    "EMERGENCY_CONTACTS",
    ()=>EMERGENCY_CONTACTS,
    "ESCALATION_DISCLAIMER",
    ()=>ESCALATION_DISCLAIMER,
    "NON_EMERGENCY_DISCLAIMER",
    ()=>NON_EMERGENCY_DISCLAIMER,
    "RED_FLAG_EMERGENCY_WARNING",
    ()=>RED_FLAG_EMERGENCY_WARNING,
    "STANDARD_EMERGENCY_GUIDANCE",
    ()=>STANDARD_EMERGENCY_GUIDANCE,
    "getEmergencyContactsList",
    ()=>getEmergencyContactsList,
    "getNonEmergencyDisclaimerText",
    ()=>getNonEmergencyDisclaimerText,
    "getRedFlagEmergencyWarningText",
    ()=>getRedFlagEmergencyWarningText
]);
const EMERGENCY_CONTACTS = {
    /** Emergency services (ambulance, fire, police) */ EMERGENCY: {
        number: '112',
        label: 'Notarzt / Rettungsdienst'
    },
    /** Medical on-call service (non-emergency) */ ON_CALL_DOCTOR: {
        number: '116 117',
        label: 'Ärztlicher Bereitschaftsdienst'
    },
    /** Suicide prevention hotline (24/7) */ SUICIDE_PREVENTION: {
        number: '0800 111 0 111',
        label: 'Telefonseelsorge (kostenfrei, 24/7)'
    }
};
const NON_EMERGENCY_DISCLAIMER = {
    title: 'Hinweis',
    text: 'Dies ist kein Notfalldienst. Bei akuten medizinischen Notfällen wählen Sie bitte 112.'
};
const STANDARD_EMERGENCY_GUIDANCE = {
    title: 'Bei akuten Notfällen',
    text: 'Wählen Sie bitte sofort 112 oder wenden Sie sich an Ihren Arzt.'
};
const RED_FLAG_EMERGENCY_WARNING = {
    title: 'Bei akuter Gefahr',
    text: 'Wenden Sie sich bitte umgehend an:',
    urgentAction: 'Wählen Sie bitte umgehend den Notruf 112 oder wenden Sie sich an die nächste Notaufnahme.'
};
const ESCALATION_DISCLAIMER = {
    title: 'Bitte beachten Sie',
    intro: 'Basierend auf Ihren Antworten empfehlen wir eine persönliche Rücksprache.'
};
function getEmergencyContactsList() {
    return Object.values(EMERGENCY_CONTACTS);
}
function getNonEmergencyDisclaimerText() {
    return `${NON_EMERGENCY_DISCLAIMER.title}: ${NON_EMERGENCY_DISCLAIMER.text}`;
}
function getRedFlagEmergencyWarningText() {
    return `${RED_FLAG_EMERGENCY_WARNING.title}: ${RED_FLAG_EMERGENCY_WARNING.urgentAction}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/components/EmergencyContactInfo.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EmergencyContactInfo",
    ()=>EmergencyContactInfo,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * E6.6.8 — Emergency Contact Info Component
 *
 * Reusable component for displaying emergency contact information.
 * Ensures consistent styling and content across all escalation paths.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/phone.js [app-client] (ecmascript) <export default as Phone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$safety$2f$disclaimers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/safety/disclaimers.ts [app-client] (ecmascript)");
;
;
;
function EmergencyContactInfo({ variant = 'default', title = 'Bei akuter Gefahr', description, showAll = true }) {
    const contacts = showAll ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$safety$2f$disclaimers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEmergencyContactsList"])() : [
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$safety$2f$disclaimers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EMERGENCY_CONTACTS"].EMERGENCY
    ];
    if (variant === 'compact') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start gap-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"], {
                    className: "w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                }, void 0, false, {
                    fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                    lineNumber: 54,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-semibold text-red-900 dark:text-red-100",
                        children: [
                            title,
                            ': ',
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-mono font-bold",
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$safety$2f$disclaimers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EMERGENCY_CONTACTS"].EMERGENCY.number
                            }, void 0, false, {
                                fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                                lineNumber: 59,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                        lineNumber: 56,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                    lineNumber: 55,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
            lineNumber: 53,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-start gap-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"], {
                className: "w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0"
            }, void 0, false, {
                fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "font-semibold text-red-900 dark:text-red-100 mb-2",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this),
                    description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-red-800 dark:text-red-200 mb-3",
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "space-y-2 text-sm text-red-800 dark:text-red-200",
                        children: contacts.map((contact)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-mono font-bold",
                                        children: contact.number
                                    }, void 0, false, {
                                        fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                                        lineNumber: 77,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "— ",
                                            contact.label
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                                        lineNumber: 78,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, contact.number, true, {
                                fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                                lineNumber: 76,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/ui/components/EmergencyContactInfo.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
_c = EmergencyContactInfo;
const __TURBOPACK__default__export__ = EmergencyContactInfo;
var _c;
__turbopack_context__.k.register(_c, "EmergencyContactInfo");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/ui/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
/**
 * UI Component Library
 * 
 * V0.4 Design System Components
 * 
 * This module exports all reusable UI components that make up the
 * Rhythmologicum Connect design system.
 * 
 * Components:
 * - Alert: Notification and callout messages
 * - Badge: Status and category labels
 * - Button: Primary action component with multiple variants
 * - Card: Content container with header/footer support
 * - Input: Text input with error states
 * - Textarea: Multi-line text input
 * - Select: Dropdown selection
 * - Label: Form field labels
 * - FormField: Complete form field wrapper
 * - Modal: Dialog overlay component
 * - Table: Data display table with sorting
 * - Tabs: Tabbed navigation component
 * 
 * Usage:
 * ```tsx
 * import { Button, Card, Input, FormField, Badge, Alert, Modal } from '@/lib/ui'
 * 
 * <FormField label="Email" required>
 *   <Input type="email" />
 * </FormField>
 * 
 * <Button variant="primary">Save</Button>
 * <Badge variant="success">Active</Badge>
 * <Alert variant="info">Important message</Alert>
 * ```
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Alert.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Badge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Textarea.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Select.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Label.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$FormField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/FormField.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Table$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Table.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$AppShell$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/AppShell.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$HelperText$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/HelperText.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ErrorText$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/ErrorText.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Progress$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Progress.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$DesktopLayout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/DesktopLayout.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/ThemeToggle.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$LoadingSpinner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/LoadingSpinner.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Modal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ErrorState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/ErrorState.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$PageHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/PageHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$SectionHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/SectionHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$components$2f$EmergencyContactInfo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/components/EmergencyContactInfo.tsx [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/logging/logger.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * B8: Structured Logging Utility
 * 
 * Provides consistent, structured logging across the application.
 * Supports multiple log levels and JSON formatting for better monitoring.
 * 
 * TODO: Integrate with production error tracking service (Sentry recommended)
 * See: docs/MONITORING_INTEGRATION.md for integration guide
 */ __turbopack_context__.s([
    "LogLevel",
    ()=>LogLevel,
    "logApiRequest",
    ()=>logApiRequest,
    "logAssessmentCompleted",
    ()=>logAssessmentCompleted,
    "logAssessmentError",
    ()=>logAssessmentError,
    "logAssessmentStarted",
    ()=>logAssessmentStarted,
    "logClinicianFlowError",
    ()=>logClinicianFlowError,
    "logDatabaseError",
    ()=>logDatabaseError,
    "logError",
    ()=>logError,
    "logForbidden",
    ()=>logForbidden,
    "logIncompleteAssessmentAccess",
    ()=>logIncompleteAssessmentAccess,
    "logInfo",
    ()=>logInfo,
    "logNotFound",
    ()=>logNotFound,
    "logPatientFlowError",
    ()=>logPatientFlowError,
    "logStepSkipping",
    ()=>logStepSkipping,
    "logUnauthorized",
    ()=>logUnauthorized,
    "logValidationFailure",
    ()=>logValidationFailure,
    "logWarn",
    ()=>logWarn
]);
var LogLevel = /*#__PURE__*/ function(LogLevel) {
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    return LogLevel;
}({});
const SENSITIVE_ERROR_KEYS = new Set([
    'authorization',
    'cookie',
    'set-cookie',
    'token',
    'accessToken',
    'refreshToken',
    'password',
    'secret',
    'body',
    'request',
    'headers'
]);
function safeStringifyCause(cause) {
    if (cause === undefined || cause === null) return undefined;
    if (cause instanceof Error) return cause.message;
    if (typeof cause === 'string') return cause;
    try {
        return JSON.stringify(cause, (key, value)=>{
            if (SENSITIVE_ERROR_KEYS.has(key)) return '[REDACTED]';
            return value;
        });
    } catch  {
        return undefined;
    }
}
/**
 * Core logging function with structured output
 * 
 * TODO: Integrate with Sentry for production error tracking
 * See: docs/MONITORING_INTEGRATION.md
 */ function log(level, message, context, error) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message
    };
    if (context) {
        entry.context = context;
    }
    if (error) {
        const normalizedError = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
            digest: typeof error.digest === 'string' ? error.digest : undefined,
            cause: safeStringifyCause(error.cause)
        } : {
            message: typeof error === 'string' ? error : JSON.stringify(error)
        };
        entry.error = normalizedError;
    }
    // Output as JSON for structured logging
    const logOutput = JSON.stringify(entry);
    // Route to appropriate console method
    switch(level){
        case "error":
            console.error(logOutput);
            break;
        case "warn":
            console.warn(logOutput);
            break;
        case "info":
        default:
            console.log(logOutput);
            break;
    }
}
function logInfo(message, context) {
    log("info", message, context);
}
function logWarn(message, context) {
    log("warn", message, context);
}
function logError(message, context, error) {
    log("error", message, context, error);
}
function logUnauthorized(context) {
    logWarn('Unauthorized access attempt', {
        ...context,
        type: 'unauthorized'
    });
}
function logForbidden(context, reason) {
    logWarn(`Forbidden access attempt: ${reason}`, {
        ...context,
        type: 'forbidden',
        reason
    });
}
function logStepSkipping(context, attemptedStepId) {
    logWarn('Step-skipping attempt detected', {
        ...context,
        type: 'step_skipping',
        attemptedStepId
    });
}
function logValidationFailure(context, missingQuestions) {
    logInfo('Validation failed', {
        ...context,
        type: 'validation_failure',
        missingCount: missingQuestions.length,
        missingQuestions: missingQuestions.map((q)=>q.questionKey)
    });
}
function logDatabaseError(context, error) {
    logError('Database error', context, error);
}
function logNotFound(resource, context) {
    logWarn(`${resource} not found`, {
        ...context,
        type: 'not_found',
        resource
    });
}
function logApiRequest(endpoint, method, context) {
    logInfo(`API Request: ${method} ${endpoint}`, {
        ...context,
        endpoint,
        method,
        type: 'api_request'
    });
}
function logAssessmentStarted(context) {
    logInfo('Assessment started', {
        ...context,
        type: 'assessment_started'
    });
}
function logAssessmentCompleted(context) {
    logInfo('Assessment completed', {
        ...context,
        type: 'assessment_completed'
    });
}
function logIncompleteAssessmentAccess(context, status) {
    logWarn('Access to incomplete assessment result', {
        ...context,
        type: 'incomplete_assessment_access',
        status
    });
}
function logAssessmentError(context, error) {
    logError('Assessment error', context, error);
}
function logClinicianFlowError(context, error) {
    logError('Clinician flow error', {
        ...context,
        area: 'clinician'
    }, error);
}
function logPatientFlowError(context, error) {
    logError('Patient flow error', {
        ...context,
        area: 'patient'
    }, error);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/rhythm-patient-ui/app/global-error.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GlobalError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ErrorState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/ErrorState.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logging$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/logging/logger.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function GlobalError({ error, reset }) {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GlobalError.useEffect": ()=>{
            // Log the error
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logging$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logError"])('Global application error', {
                type: 'ui_error',
                area: 'global'
            }, error);
        }
    }["GlobalError.useEffect"], [
        error
    ]);
    const message = error?.message?.startsWith('Missing env:') ? error.message : 'Beim Laden der Anwendung ist ein Fehler aufgetreten. Bitte laden Sie die Seite neu.';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("html", {
        lang: "de",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("body", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full min-h-screen flex items-center justify-center bg-white px-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ErrorState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ErrorState"], {
                    title: "Ein Fehler ist aufgetreten",
                    message: message,
                    onRetry: reset,
                    centered: true
                }, void 0, false, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/global-error.tsx",
                    lineNumber: 33,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/rhythm-patient-ui/app/global-error.tsx",
                lineNumber: 32,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/rhythm-patient-ui/app/global-error.tsx",
            lineNumber: 31,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/rhythm-patient-ui/app/global-error.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
_s(GlobalError, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = GlobalError;
var _c;
__turbopack_context__.k.register(_c, "GlobalError");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_67cd8d02._.js.map