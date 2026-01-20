module.exports = [
"[project]/app/components/MobileHeader.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MobileHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-ssr] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function MobileHeader({ variant = 'with-title', title, subtitle, showBack = true, onBack, actionIcon = 'settings', onAction, className = '' }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const handleBack = ()=>{
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };
    // Render action icon based on type
    const renderActionIcon = ()=>{
        if (!onAction) return null;
        const iconProps = {
            size: 20,
            strokeWidth: 2,
            'aria-hidden': true
        };
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            onClick: onAction,
            className: "shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
            style: {
                width: '44px',
                height: '44px'
            },
            "aria-label": actionIcon === 'settings' ? 'Einstellungen' : 'Information',
            children: actionIcon === 'settings' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                ...iconProps,
                className: "text-slate-700 dark:text-slate-300"
            }, void 0, false, {
                fileName: "[project]/app/components/MobileHeader.tsx",
                lineNumber: 124,
                columnNumber: 11
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
                ...iconProps,
                className: "text-slate-700 dark:text-slate-300"
            }, void 0, false, {
                fileName: "[project]/app/components/MobileHeader.tsx",
                lineNumber: 126,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/components/MobileHeader.tsx",
            lineNumber: 113,
            columnNumber: 7
        }, this);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: `sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors duration-150 ${className}`,
        style: {
            zIndex: 50,
            boxShadow: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["shadows"].sm
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3",
            style: {
                padding: `${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["spacing"].sm} ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["spacing"].md}`,
                minHeight: '56px'
            },
            children: [
                showBack && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: handleBack,
                    className: "shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
                    style: {
                        width: '44px',
                        height: '44px'
                    },
                    "aria-label": "Zurück",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                        size: 20,
                        strokeWidth: 2,
                        className: "text-slate-700 dark:text-slate-300",
                        "aria-hidden": true
                    }, void 0, false, {
                        fileName: "[project]/app/components/MobileHeader.tsx",
                        lineNumber: 159,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/components/MobileHeader.tsx",
                    lineNumber: 149,
                    columnNumber: 11
                }, this),
                (variant === 'with-title' || variant === 'with-action') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 min-w-0",
                    children: [
                        subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wide truncate",
                            style: {
                                fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize.xs
                            },
                            children: subtitle
                        }, void 0, false, {
                            fileName: "[project]/app/components/MobileHeader.tsx",
                            lineNumber: 172,
                            columnNumber: 15
                        }, this),
                        title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "font-semibold text-slate-900 dark:text-slate-100 truncate",
                            style: {
                                fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize.lg,
                                lineHeight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].lineHeight.tight
                            },
                            children: title
                        }, void 0, false, {
                            fileName: "[project]/app/components/MobileHeader.tsx",
                            lineNumber: 180,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/components/MobileHeader.tsx",
                    lineNumber: 170,
                    columnNumber: 11
                }, this),
                variant === 'with-action' && renderActionIcon()
            ]
        }, void 0, true, {
            fileName: "[project]/app/components/MobileHeader.tsx",
            lineNumber: 140,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/components/MobileHeader.tsx",
        lineNumber: 133,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/components/FunnelCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FunnelCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-ssr] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
// Funnel slugs that should display the heart icon instead of emoji
const STRESS_FUNNEL_SLUGS = [
    'stress-assessment',
    'stress'
];
// Heart icon configuration for stress assessment cards
const HEART_ICON_SIZE = 48 // px
;
const HEART_ICON_STROKE_WIDTH = 2.5;
function FunnelCard({ funnel, slug: slugProp, title: titleProp, subtitle: subtitleProp, description: descriptionProp, icon = '📋', useIconComponent = false, theme: themeProp, estimatedDuration, outcomes, version, availability = 'available', onClick }) {
    // Support both funnel object and individual props
    const slug = funnel?.slug ?? slugProp ?? '';
    const title = funnel?.title ?? titleProp ?? '';
    const subtitle = funnel?.subtitle ?? subtitleProp;
    const description = funnel?.description ?? descriptionProp;
    const theme = funnel?.default_theme ?? themeProp;
    // Determine if this funnel should use the heart icon
    const isStressFunnel = STRESS_FUNNEL_SLUGS.includes(slug);
    const shouldUseHeartIcon = useIconComponent || isStressFunnel;
    // V05-FIXOPT-01: Disable card if not available
    const isDisabled = availability === 'coming_soon' || availability === 'not_available';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: onClick,
        disabled: isDisabled,
        className: `w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-left transition-colors duration-150 ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-xl active:scale-[0.98]'}`,
        style: {
            padding: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["spacing"].lg,
            borderRadius: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["radii"].xl,
            boxShadow: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["shadows"].md,
            transition: `all ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].duration.normal} ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].easing.smooth}`
        },
        "aria-label": `${title} Assessment ${isDisabled ? '(In Kürze verfügbar)' : 'starten'}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-center border",
                    style: {
                        width: '80px',
                        height: '80px',
                        borderRadius: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["radii"].xl,
                        background: `linear-gradient(to bottom right, ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["colors"].primary[100]}, ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["colors"].primary[50]})`,
                        borderColor: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["colors"].primary[200]
                    },
                    children: shouldUseHeartIcon ? // Heart icon with pulse animation for stress/resilience assessment
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
                        className: "heartbeat-pulse text-rose-600 dark:text-rose-500",
                        size: HEART_ICON_SIZE,
                        strokeWidth: HEART_ICON_STROKE_WIDTH,
                        fill: "currentColor",
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/app/components/FunnelCard.tsx",
                        lineNumber: 133,
                        columnNumber: 13
                    }, this) : // Default emoji for other funnels
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-5xl",
                        children: icon
                    }, void 0, false, {
                        fileName: "[project]/app/components/FunnelCard.tsx",
                        lineNumber: 142,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/components/FunnelCard.tsx",
                    lineNumber: 121,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/FunnelCard.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this),
            subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "inline-block bg-sky-600 text-white font-semibold uppercase tracking-wide",
                    style: {
                        fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize.xs,
                        padding: `${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["spacing"].xs} ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["spacing"].sm}`,
                        borderRadius: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["radii"].md
                    },
                    children: subtitle
                }, void 0, false, {
                    fileName: "[project]/app/components/FunnelCard.tsx",
                    lineNumber: 150,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/FunnelCard.tsx",
                lineNumber: 149,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "font-bold text-slate-900 dark:text-slate-100 mb-2",
                style: {
                    fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize.xl,
                    lineHeight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].lineHeight.tight
                },
                children: title
            }, void 0, false, {
                fileName: "[project]/app/components/FunnelCard.tsx",
                lineNumber: 164,
                columnNumber: 7
            }, this),
            description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-slate-600 dark:text-slate-300 mb-3",
                style: {
                    fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize.sm,
                    lineHeight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].lineHeight.relaxed
                },
                children: description
            }, void 0, false, {
                fileName: "[project]/app/components/FunnelCard.tsx",
                lineNumber: 176,
                columnNumber: 9
            }, this),
            (estimatedDuration || outcomes || version) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2 mb-3",
                children: [
                    estimatedDuration && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded",
                        style: {
                            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize.xs,
                            borderRadius: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["radii"].sm
                        },
                        children: [
                            "⏱️ ca. ",
                            estimatedDuration,
                            " Min."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/FunnelCard.tsx",
                        lineNumber: 191,
                        columnNumber: 13
                    }, this),
                    version && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded",
                        style: {
                            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize.xs,
                            borderRadius: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["radii"].sm
                        },
                        children: [
                            "v",
                            version
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/components/FunnelCard.tsx",
                        lineNumber: 202,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/FunnelCard.tsx",
                lineNumber: 189,
                columnNumber: 9
            }, this),
            outcomes && outcomes.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "space-y-1",
                    children: outcomes.slice(0, 3).map((outcome, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            className: "text-slate-600 dark:text-slate-400 flex items-start gap-2",
                            style: {
                                fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize.xs
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-sky-500 mt-0.5",
                                    children: "✓"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/FunnelCard.tsx",
                                    lineNumber: 227,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: outcome
                                }, void 0, false, {
                                    fileName: "[project]/app/components/FunnelCard.tsx",
                                    lineNumber: 228,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, idx, true, {
                            fileName: "[project]/app/components/FunnelCard.tsx",
                            lineNumber: 220,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/app/components/FunnelCard.tsx",
                    lineNumber: 218,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/components/FunnelCard.tsx",
                lineNumber: 217,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize.sm
                        },
                        children: isDisabled ? 'In Kürze verfügbar' : 'Assessment starten'
                    }, void 0, false, {
                        fileName: "[project]/app/components/FunnelCard.tsx",
                        lineNumber: 237,
                        columnNumber: 9
                    }, this),
                    !isDisabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "→"
                    }, void 0, false, {
                        fileName: "[project]/app/components/FunnelCard.tsx",
                        lineNumber: 240,
                        columnNumber: 25
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/FunnelCard.tsx",
                lineNumber: 236,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/FunnelCard.tsx",
        lineNumber: 102,
        columnNumber: 5
    }, this);
}
}),
"[project]/lib/contracts/registry.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Contract Registry - Canonical Identifiers
 * 
 * This file serves as the single source of truth for all critical string identifiers
 * used throughout the application. All new identifiers MUST be added here to prevent
 * "fantasy names" and ensure consistency.
 * 
 * **IMPORTANT**: This file is protected by CODEOWNERS. Any changes require review.
 * 
 * Usage:
 * ```typescript
 * import { ASSESSMENT_STATUS, FUNNEL_SLUG, USER_ROLE } from '@/lib/contracts/registry'
 * 
 * const status: AssessmentStatus = ASSESSMENT_STATUS.IN_PROGRESS
 * const funnel: FunnelSlug = FUNNEL_SLUG.STRESS_ASSESSMENT
 * ```
 */ // ============================================================
// Assessment Statuses
// ============================================================
/**
 * Valid statuses for assessments
 */ __turbopack_context__.s([
    "ASSESSMENT_STATUS",
    ()=>ASSESSMENT_STATUS,
    "AUDIT_ACTION",
    ()=>AUDIT_ACTION,
    "AUDIT_ENTITY_TYPE",
    ()=>AUDIT_ENTITY_TYPE,
    "AUDIT_SOURCE",
    ()=>AUDIT_SOURCE,
    "CONTENT_STATUS",
    ()=>CONTENT_STATUS,
    "CURRENT_EXTRACTOR_VERSION",
    ()=>CURRENT_EXTRACTOR_VERSION,
    "EXTRACTOR_VERSION",
    ()=>EXTRACTOR_VERSION,
    "FEATURE_FLAG",
    ()=>FEATURE_FLAG,
    "FUNNEL_SLUG",
    ()=>FUNNEL_SLUG,
    "FUNNEL_SLUG_ALIASES",
    ()=>FUNNEL_SLUG_ALIASES,
    "NODE_TYPE",
    ()=>NODE_TYPE,
    "PATIENT_SEX",
    ()=>PATIENT_SEX,
    "PILLAR_KEY",
    ()=>PILLAR_KEY,
    "PROCESSING_STAGE",
    ()=>PROCESSING_STAGE,
    "PROCESSING_STATUS",
    ()=>PROCESSING_STATUS,
    "PROGRAM_TIER",
    ()=>PROGRAM_TIER,
    "QUESTION_TYPE",
    ()=>QUESTION_TYPE,
    "USER_ROLE",
    ()=>USER_ROLE,
    "getCanonicalFunnelSlug",
    ()=>getCanonicalFunnelSlug,
    "isKnownFunnelSlug",
    ()=>isKnownFunnelSlug,
    "isValidAssessmentStatus",
    ()=>isValidAssessmentStatus,
    "isValidAuditAction",
    ()=>isValidAuditAction,
    "isValidAuditEntityType",
    ()=>isValidAuditEntityType,
    "isValidAuditSource",
    ()=>isValidAuditSource,
    "isValidContentStatus",
    ()=>isValidContentStatus,
    "isValidExtractorVersion",
    ()=>isValidExtractorVersion,
    "isValidNodeType",
    ()=>isValidNodeType,
    "isValidPatientSex",
    ()=>isValidPatientSex,
    "isValidPillarKey",
    ()=>isValidPillarKey,
    "isValidProcessingStage",
    ()=>isValidProcessingStage,
    "isValidProcessingStatus",
    ()=>isValidProcessingStatus,
    "isValidProgramTier",
    ()=>isValidProgramTier,
    "isValidUserRole",
    ()=>isValidUserRole
]);
const ASSESSMENT_STATUS = {
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
};
const CONTENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};
const PILLAR_KEY = {
    NUTRITION: 'nutrition',
    MOVEMENT: 'movement',
    SLEEP: 'sleep',
    MENTAL_HEALTH: 'mental-health',
    SOCIAL: 'social',
    MEANING: 'meaning',
    PREVENTION: 'prevention'
};
const FUNNEL_SLUG = {
    STRESS_ASSESSMENT: 'stress-assessment',
    CARDIOVASCULAR_AGE: 'cardiovascular-age',
    SLEEP_QUALITY: 'sleep-quality',
    HEART_HEALTH_NUTRITION: 'heart-health-nutrition',
    // Legacy aliases - deprecated but maintained for compatibility
    STRESS: 'stress',
    STRESS_CHECK: 'stress-check',
    STRESS_CHECK_V2: 'stress-check-v2'
};
const FUNNEL_SLUG_ALIASES = {
    'stress': FUNNEL_SLUG.STRESS_ASSESSMENT,
    'stress-check': FUNNEL_SLUG.STRESS_ASSESSMENT,
    'stress-check-v2': FUNNEL_SLUG.STRESS_ASSESSMENT
};
function getCanonicalFunnelSlug(slug) {
    const normalized = slug.toLowerCase().trim();
    return FUNNEL_SLUG_ALIASES[normalized] || normalized;
}
function isKnownFunnelSlug(slug) {
    const canonical = getCanonicalFunnelSlug(slug);
    const allSlugs = Object.values(FUNNEL_SLUG);
    return allSlugs.includes(canonical);
}
const NODE_TYPE = {
    QUESTION_STEP: 'question_step',
    FORM: 'form',
    INFO_STEP: 'info_step',
    INFO: 'info',
    CONTENT_PAGE: 'content_page',
    SUMMARY: 'summary',
    OTHER: 'other'
};
const USER_ROLE = {
    PATIENT: 'patient',
    CLINICIAN: 'clinician',
    ADMIN: 'admin',
    NURSE: 'nurse'
};
const QUESTION_TYPE = {
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
    TEXT: 'text',
    TEXTAREA: 'textarea',
    NUMBER: 'number',
    SCALE: 'scale',
    SLIDER: 'slider'
};
const PATIENT_SEX = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
    PREFER_NOT_TO_SAY: 'prefer_not_to_say'
};
const FEATURE_FLAG = {
    AMY_ENABLED: 'AMY_ENABLED',
    CLINICIAN_DASHBOARD_ENABLED: 'CLINICIAN_DASHBOARD_ENABLED',
    CHARTS_ENABLED: 'CHARTS_ENABLED'
};
function isValidAssessmentStatus(value) {
    return typeof value === 'string' && Object.values(ASSESSMENT_STATUS).includes(value);
}
function isValidContentStatus(value) {
    return typeof value === 'string' && Object.values(CONTENT_STATUS).includes(value);
}
function isValidUserRole(value) {
    return typeof value === 'string' && Object.values(USER_ROLE).includes(value);
}
function isValidNodeType(value) {
    return typeof value === 'string' && Object.values(NODE_TYPE).includes(value);
}
function isValidPillarKey(value) {
    return typeof value === 'string' && Object.values(PILLAR_KEY).includes(value);
}
function isValidPatientSex(value) {
    return typeof value === 'string' && Object.values(PATIENT_SEX).includes(value);
}
const AUDIT_ENTITY_TYPE = {
    ASSESSMENT: 'assessment',
    REPORT: 'report',
    TASK: 'task',
    FUNNEL_VERSION: 'funnel_version',
    FUNNEL_CATALOG: 'funnel_catalog',
    CONFIG: 'config',
    CONSENT: 'consent',
    ORGANIZATION: 'organization',
    USER_ORG_MEMBERSHIP: 'user_org_membership',
    CLINICIAN_ASSIGNMENT: 'clinician_assignment',
    DOCUMENT: 'document',
    PROCESSING_JOB: 'processing_job',
    REVIEW_RECORD: 'review_record',
    PRE_SCREENING_CALL: 'pre_screening_call',
    DEVICE_SHIPMENT: 'device_shipment',
    SUPPORT_CASE: 'support_case',
    ACCOUNT: 'account'
};
const AUDIT_ACTION = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    APPROVE: 'approve',
    REJECT: 'reject',
    REQUEST_CHANGES: 'request_changes',
    GENERATE: 'generate',
    FLAG: 'flag',
    ASSIGN: 'assign',
    ACTIVATE: 'activate',
    DEACTIVATE: 'deactivate',
    ROLLOUT: 'rollout',
    COMPLETE: 'complete',
    ESCALATE: 'escalate',
    DELETION_REQUEST: 'deletion_request',
    DELETION_CANCEL: 'deletion_cancel',
    DELETION_EXECUTE: 'deletion_execute',
    ANONYMIZE: 'anonymize'
};
const AUDIT_SOURCE = {
    API: 'api',
    JOB: 'job',
    ADMIN_UI: 'admin-ui',
    SYSTEM: 'system'
};
function isValidAuditEntityType(value) {
    return typeof value === 'string' && Object.values(AUDIT_ENTITY_TYPE).includes(value);
}
function isValidAuditAction(value) {
    return typeof value === 'string' && Object.values(AUDIT_ACTION).includes(value);
}
function isValidAuditSource(value) {
    return typeof value === 'string' && Object.values(AUDIT_SOURCE).includes(value);
}
const PROGRAM_TIER = {
    /**
   * Tier 1 (Essential): Basic stress/resilience assessment
   * Focus: Initial assessment, baseline data collection
   */ TIER_1_ESSENTIAL: 'tier-1-essential',
    /**
   * Tier 2.5 (Enhanced): Extended monitoring with nurse touchpoints
   * Focus: Regular check-ins, progress tracking
   */ TIER_2_5_ENHANCED: 'tier-2-5-enhanced',
    /**
   * Tier 2 (Comprehensive): Full program with intensive support
   * Focus: Comprehensive care, multiple pillars, frequent touchpoints
   */ TIER_2_COMPREHENSIVE: 'tier-2-comprehensive'
};
function isValidProgramTier(value) {
    return typeof value === 'string' && Object.values(PROGRAM_TIER).includes(value);
}
const EXTRACTOR_VERSION = {
    /**
   * v1.0.0: Initial extraction pipeline
   * - Basic lab value extraction
   * - Medication list extraction
   * - Confidence scoring
   */ V1_0_0: 'v1.0.0'
};
const CURRENT_EXTRACTOR_VERSION = EXTRACTOR_VERSION.V1_0_0;
function isValidExtractorVersion(value) {
    return typeof value === 'string' && Object.values(EXTRACTOR_VERSION).includes(value);
}
const PROCESSING_STAGE = {
    PENDING: 'pending',
    RISK: 'risk',
    RANKING: 'ranking',
    CONTENT: 'content',
    VALIDATION: 'validation',
    REVIEW: 'review',
    PDF: 'pdf',
    DELIVERY: 'delivery',
    COMPLETED: 'completed',
    FAILED: 'failed'
};
const PROCESSING_STATUS = {
    QUEUED: 'queued',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};
function isValidProcessingStage(value) {
    return typeof value === 'string' && Object.values(PROCESSING_STAGE).includes(value);
}
function isValidProcessingStatus(value) {
    return typeof value === 'string' && Object.values(PROCESSING_STATUS).includes(value);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FunnelCatalogClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$MobileHeader$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/MobileHeader.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$FunnelCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/FunnelCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ui/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$LoadingSpinner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/LoadingSpinner.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ErrorState$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/ErrorState.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/contracts/registry.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
function FunnelCatalogClient() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [catalog, setCatalog] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [expandedPillars, setExpandedPillars] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const loadCatalog = async ()=>{
            try {
                setLoading(true);
                setError(null);
                const response = await fetch('/api/funnels/catalog');
                if (!response.ok) {
                    throw new Error('Failed to load catalog');
                }
                const data = await response.json();
                if (data.success && data.data) {
                    setCatalog(data.data);
                    // Auto-expand first pillar
                    if (data.data.pillars.length > 0) {
                        setExpandedPillars(new Set([
                            data.data.pillars[0].pillar.id
                        ]));
                    }
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (err) {
                console.error('[catalog] Error loading catalog:', err);
                setError('Katalog konnte nicht geladen werden.');
            } finally{
                setLoading(false);
            }
        };
        loadCatalog();
    }, []);
    const handleFunnelClick = (slug, availability)=>{
        // Only navigate if funnel is available
        if (availability === 'available' || !availability) {
            // Navigate to funnel intro page
            router.push(`/patient/funnel/${slug}/intro`);
        }
    };
    const togglePillar = (pillarId)=>{
        setExpandedPillars((prev)=>{
            const next = new Set(prev);
            if (next.has(pillarId)) {
                next.delete(pillarId);
            } else {
                next.add(pillarId);
            }
            return next;
        });
    };
    // Map pillar keys to icons
    const getPillarIcon = (key)=>{
        const iconMap = {
            [__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PILLAR_KEY"].NUTRITION]: '🥗',
            [__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PILLAR_KEY"].MOVEMENT]: '🏃',
            [__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PILLAR_KEY"].SLEEP]: '😴',
            [__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PILLAR_KEY"].MENTAL_HEALTH]: '🧘‍♀️',
            [__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PILLAR_KEY"].SOCIAL]: '👥',
            [__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PILLAR_KEY"].MEANING]: '🌟',
            [__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PILLAR_KEY"].PREVENTION]: '🛡️'
        };
        return iconMap[key] || '📋';
    };
    // Map funnel slugs to icons (fallback if needed)
    const getFunnelIcon = (slug)=>{
        const iconMap = {
            'stress-assessment': '🧘‍♀️',
            'stress': '🧘‍♀️',
            'sleep': '😴',
            'sleep-assessment': '😴',
            'resilience': '💪'
        };
        return iconMap[slug] || '📋';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 transition-colors duration-150",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$MobileHeader$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                variant: "with-title",
                title: "Funnel Katalog",
                subtitle: "Rhythmologicum Connect",
                showBack: true
            }, void 0, false, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-1 overflow-y-auto px-4 pt-4 sm:pt-6",
                style: {
                    paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))'
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full max-w-6xl mx-auto flex flex-col gap-6 lg:flex-row",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 min-w-0 space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "font-bold leading-tight text-slate-900 dark:text-slate-100",
                                        style: {
                                            fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].fontSize['2xl'],
                                            lineHeight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["typography"].lineHeight.tight
                                        },
                                        children: "Verfügbare Assessments"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                        lineNumber: 121,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-slate-600 dark:text-slate-400",
                                        children: "Wählen Sie ein Assessment aus, um zu starten"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                        lineNumber: 130,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                lineNumber: 120,
                                columnNumber: 13
                            }, this),
                            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$LoadingSpinner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LoadingSpinner"], {
                                size: "lg",
                                centered: true
                            }, void 0, false, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                lineNumber: 135,
                                columnNumber: 25
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ErrorState$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ErrorState"], {
                                message: error
                            }, void 0, false, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                lineNumber: 137,
                                columnNumber: 23
                            }, this),
                            !loading && !error && catalog && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-6",
                                children: [
                                    catalog.pillars.map((pillarData)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
                                                    padding: "md",
                                                    radius: "lg",
                                                    interactive: true,
                                                    onClick: ()=>togglePillar(pillarData.pillar.id),
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-2xl",
                                                                children: getPillarIcon(pillarData.pillar.key)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                                lineNumber: 152,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex-1 text-left",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                        className: "font-semibold text-slate-900 dark:text-slate-100",
                                                                        children: pillarData.pillar.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                                        lineNumber: 154,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    pillarData.pillar.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm text-slate-600 dark:text-slate-400",
                                                                        children: pillarData.pillar.description
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                                        lineNumber: 158,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                                lineNumber: 153,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                className: `w-5 h-5 text-slate-400 transition-transform ${expandedPillars.has(pillarData.pillar.id) ? 'rotate-180' : ''}`,
                                                                fill: "none",
                                                                viewBox: "0 0 24 24",
                                                                stroke: "currentColor",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    strokeWidth: 2,
                                                                    d: "M19 9l-7 7-7-7"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                                    lineNumber: 171,
                                                                    columnNumber: 27
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                                lineNumber: 163,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                        lineNumber: 151,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                    lineNumber: 145,
                                                    columnNumber: 21
                                                }, this),
                                                expandedPillars.has(pillarData.pillar.id) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid gap-4 md:grid-cols-2",
                                                    children: pillarData.funnels.map((funnel)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$FunnelCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                            funnel: {
                                                                id: funnel.id,
                                                                slug: funnel.slug,
                                                                title: funnel.title,
                                                                subtitle: funnel.subtitle,
                                                                description: funnel.description,
                                                                default_theme: null
                                                            },
                                                            icon: getFunnelIcon(funnel.slug),
                                                            onClick: ()=>handleFunnelClick(funnel.slug, funnel.availability),
                                                            estimatedDuration: funnel.est_duration_min,
                                                            outcomes: funnel.outcomes,
                                                            version: funnel.default_version,
                                                            availability: funnel.availability
                                                        }, funnel.id, false, {
                                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                            lineNumber: 185,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                    lineNumber: 183,
                                                    columnNumber: 23
                                                }, this),
                                                expandedPillars.has(pillarData.pillar.id) && pillarData.funnels.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-center py-8 text-slate-500 dark:text-slate-400",
                                                    children: "Keine Assessments in dieser Kategorie verfügbar"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                    lineNumber: 209,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, pillarData.pillar.id, true, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                            lineNumber: 143,
                                            columnNumber: 19
                                        }, this)),
                                    catalog.uncategorized_funnels.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "font-semibold text-slate-900 dark:text-slate-100",
                                                children: "Weitere Assessments"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                lineNumber: 219,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid gap-4 md:grid-cols-2",
                                                children: catalog.uncategorized_funnels.map((funnel)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$FunnelCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        funnel: {
                                                            id: funnel.id,
                                                            slug: funnel.slug,
                                                            title: funnel.title,
                                                            subtitle: funnel.subtitle,
                                                            description: funnel.description,
                                                            default_theme: null
                                                        },
                                                        icon: getFunnelIcon(funnel.slug),
                                                        onClick: ()=>handleFunnelClick(funnel.slug, funnel.availability),
                                                        estimatedDuration: funnel.est_duration_min,
                                                        outcomes: funnel.outcomes,
                                                        version: funnel.default_version,
                                                        availability: funnel.availability
                                                    }, funnel.id, false, {
                                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                        lineNumber: 224,
                                                        columnNumber: 25
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                                lineNumber: 222,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                        lineNumber: 218,
                                        columnNumber: 19
                                    }, this),
                                    catalog.pillars.length === 0 && catalog.uncategorized_funnels.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-center py-12",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-slate-500 dark:text-slate-400",
                                            children: "Derzeit sind keine Assessments verfügbar"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                            lineNumber: 249,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                        lineNumber: 248,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                                lineNumber: 140,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                        lineNumber: 119,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                    lineNumber: 118,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
                lineNumber: 114,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx",
        lineNumber: 106,
        columnNumber: 5
    }, this);
}
}),
"[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>ArrowLeft
]);
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "m12 19-7-7 7-7",
            key: "1l729n"
        }
    ],
    [
        "path",
        {
            d: "M19 12H5",
            key: "x3x0zl"
        }
    ]
];
const ArrowLeft = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("arrow-left", __iconNode);
;
 //# sourceMappingURL=arrow-left.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-ssr] (ecmascript) <export default as ArrowLeft>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ArrowLeft",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-ssr] (ecmascript)");
}),
"[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Settings
]);
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
            key: "1i5ecw"
        }
    ],
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "3",
            key: "1v7zrd"
        }
    ]
];
const Settings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("settings", __iconNode);
;
 //# sourceMappingURL=settings.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Settings",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript)");
}),
"[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Heart
]);
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
            key: "mvr1a0"
        }
    ]
];
const Heart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("heart", __iconNode);
;
 //# sourceMappingURL=heart.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-ssr] (ecmascript) <export default as Heart>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Heart",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-ssr] (ecmascript)");
}),
];

//# sourceMappingURL=_0a5de870._.js.map