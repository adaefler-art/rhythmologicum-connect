(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/components/MobileHeader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MobileHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-client] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function MobileHeader({ variant = 'with-title', title, subtitle, showBack = true, onBack, actionIcon = 'settings', onAction, className = '' }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            onClick: onAction,
            className: "shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
            style: {
                width: '44px',
                height: '44px'
            },
            "aria-label": actionIcon === 'settings' ? 'Einstellungen' : 'Information',
            children: actionIcon === 'settings' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                ...iconProps,
                className: "text-slate-700 dark:text-slate-300"
            }, void 0, false, {
                fileName: "[project]/app/components/MobileHeader.tsx",
                lineNumber: 124,
                columnNumber: 11
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: `sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors duration-150 ${className}`,
        style: {
            zIndex: 50,
            boxShadow: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shadows"].sm
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3",
            style: {
                padding: `${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].sm} ${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["spacing"].md}`,
                minHeight: '56px'
            },
            children: [
                showBack && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: handleBack,
                    className: "shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
                    style: {
                        width: '44px',
                        height: '44px'
                    },
                    "aria-label": "Zurück",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
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
                (variant === 'with-title' || variant === 'with-action') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 min-w-0",
                    children: [
                        subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wide truncate",
                            style: {
                                fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.xs
                            },
                            children: subtitle
                        }, void 0, false, {
                            fileName: "[project]/app/components/MobileHeader.tsx",
                            lineNumber: 172,
                            columnNumber: 15
                        }, this),
                        title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "font-semibold text-slate-900 dark:text-slate-100 truncate",
                            style: {
                                fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize.lg,
                                lineHeight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].lineHeight.tight
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
_s(MobileHeader, "fN7XvhJ+p5oE6+Xlo0NJmXpxjC8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = MobileHeader;
var _c;
__turbopack_context__.k.register(_c, "MobileHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/DashboardHeader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DashboardHeader",
    ()=>DashboardHeader,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2d$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/design-tokens.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/design/tokens.ts [app-client] (ecmascript)");
'use client';
;
;
function DashboardHeader({ greeting }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "font-bold leading-tight text-slate-900 dark:text-slate-100",
                style: {
                    fontSize: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].fontSize['2xl'],
                    lineHeight: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$design$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typography"].lineHeight.tight
                },
                children: greeting ? `Willkommen zurück, ${greeting}` : 'Willkommen zurück'
            }, void 0, false, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/DashboardHeader.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-slate-600 dark:text-slate-400",
                children: "Ihr persönliches Gesundheits-Dashboard"
            }, void 0, false, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/DashboardHeader.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/DashboardHeader.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
_c = DashboardHeader;
const __TURBOPACK__default__export__ = DashboardHeader;
var _c;
__turbopack_context__.k.register(_c, "DashboardHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYSlot.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AMYSlot",
    ()=>AMYSlot,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Card.tsx [app-client] (ecmascript)");
'use client';
;
;
function AMYSlot() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
        padding: "lg",
        radius: "lg",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start gap-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-2xl",
                        role: "img",
                        "aria-label": "AMY Assistant",
                        children: "🤖"
                    }, void 0, false, {
                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYSlot.tsx",
                        lineNumber: 26,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYSlot.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2",
                            children: "AMY - Ihr persönlicher Assistent"
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYSlot.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-slate-600 dark:text-slate-400",
                            children: "AMY wird bald verfügbar sein, um Ihnen personalisierte Einblicke und Empfehlungen zu bieten."
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYSlot.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYSlot.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYSlot.tsx",
            lineNumber: 24,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYSlot.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
_c = AMYSlot;
const __TURBOPACK__default__export__ = AMYSlot;
var _c;
__turbopack_context__.k.register(_c, "AMYSlot");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/api/contracts/triage/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AGE_RANGE_BUCKET",
    ()=>AGE_RANGE_BUCKET,
    "ConfidenceBandSchema",
    ()=>ConfidenceBandSchema,
    "PatientContextLiteSchema",
    ()=>PatientContextLiteSchema,
    "RED_FLAG_ALLOWLIST",
    ()=>RED_FLAG_ALLOWLIST,
    "TRIAGE_INPUT_MAX_LENGTH",
    ()=>TRIAGE_INPUT_MAX_LENGTH,
    "TRIAGE_INPUT_MIN_LENGTH",
    ()=>TRIAGE_INPUT_MIN_LENGTH,
    "TRIAGE_INPUT_VERY_LARGE_THRESHOLD",
    ()=>TRIAGE_INPUT_VERY_LARGE_THRESHOLD,
    "TRIAGE_NEXT_ACTION",
    ()=>TRIAGE_NEXT_ACTION,
    "TRIAGE_RATIONALE_MAX_BULLETS",
    ()=>TRIAGE_RATIONALE_MAX_BULLETS,
    "TRIAGE_RATIONALE_MAX_LENGTH",
    ()=>TRIAGE_RATIONALE_MAX_LENGTH,
    "TRIAGE_SCHEMA_VERSION",
    ()=>TRIAGE_SCHEMA_VERSION,
    "TRIAGE_TIER",
    ()=>TRIAGE_TIER,
    "TriageErrorResponseSchema",
    ()=>TriageErrorResponseSchema,
    "TriageRequestV1Schema",
    ()=>TriageRequestV1Schema,
    "TriageResponseSchema",
    ()=>TriageResponseSchema,
    "TriageResultV1Schema",
    ()=>TriageResultV1Schema,
    "TriageSuccessResponseSchema",
    ()=>TriageSuccessResponseSchema,
    "boundRationale",
    ()=>boundRationale,
    "getOversizeErrorStatus",
    ()=>getOversizeErrorStatus,
    "safeValidateTriageRequest",
    ()=>safeValidateTriageRequest,
    "safeValidateTriageResult",
    ()=>safeValidateTriageResult,
    "sanitizeRedFlags",
    ()=>sanitizeRedFlags,
    "validateTriageRequest",
    ()=>validateTriageRequest,
    "validateTriageResult",
    ()=>validateTriageResult
]);
/**
 * Triage API Contracts - E6.6.2
 *
 * Versioned schemas for AMY triage endpoints.
 * Stable, testable, governance-ready contracts with strict validation.
 *
 * @module lib/api/contracts/triage
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
;
const TRIAGE_SCHEMA_VERSION = 'v1';
const TRIAGE_TIER = {
    INFO: 'INFO',
    ASSESSMENT: 'ASSESSMENT',
    ESCALATE: 'ESCALATE'
};
const TRIAGE_NEXT_ACTION = {
    SHOW_CONTENT: 'SHOW_CONTENT',
    START_FUNNEL_A: 'START_FUNNEL_A',
    START_FUNNEL_B: 'START_FUNNEL_B',
    RESUME_FUNNEL: 'RESUME_FUNNEL',
    SHOW_ESCALATION: 'SHOW_ESCALATION'
};
const RED_FLAG_ALLOWLIST = [
    'report_risk_level',
    'workup_check',
    'answer_pattern'
];
const AGE_RANGE_BUCKET = {
    UNDER_18: 'UNDER_18',
    AGE_18_30: 'AGE_18_30',
    AGE_31_50: 'AGE_31_50',
    AGE_51_65: 'AGE_51_65',
    OVER_65: 'OVER_65'
};
const TRIAGE_INPUT_MIN_LENGTH = 10;
const TRIAGE_INPUT_MAX_LENGTH = 800;
const TRIAGE_INPUT_VERY_LARGE_THRESHOLD = TRIAGE_INPUT_MAX_LENGTH * 2 // 1600 chars
;
const TRIAGE_RATIONALE_MAX_LENGTH = 280;
const TRIAGE_RATIONALE_MAX_BULLETS = 3;
const PatientContextLiteSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ageRange: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        AGE_RANGE_BUCKET.UNDER_18,
        AGE_RANGE_BUCKET.AGE_18_30,
        AGE_RANGE_BUCKET.AGE_31_50,
        AGE_RANGE_BUCKET.AGE_51_65,
        AGE_RANGE_BUCKET.OVER_65
    ]).optional()
}).optional();
const TriageRequestV1Schema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    inputText: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(TRIAGE_INPUT_MIN_LENGTH, `Input must be at least ${TRIAGE_INPUT_MIN_LENGTH} characters`).max(TRIAGE_INPUT_MAX_LENGTH, `Input must not exceed ${TRIAGE_INPUT_MAX_LENGTH} characters`),
    locale: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    patientContext: PatientContextLiteSchema
});
const ConfidenceBandSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    value: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(1),
    label: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'low',
        'medium',
        'high'
    ]).optional()
}).optional();
/**
 * Custom validation for rationale:
 * - Must be ≤280 characters OR
 * - Must be bullet list with max 3 items
 */ function validateRationale(rationale) {
    // Check if it's a bullet list first
    const bulletPattern = /^[\s]*[-*•]\s+/;
    const lines = rationale.split('\n').filter((line)=>line.trim().length > 0);
    const bulletLines = lines.filter((line)=>bulletPattern.test(line));
    if (bulletLines.length > 0) {
        // It's a bullet list - check max 3 bullets
        if (bulletLines.length > TRIAGE_RATIONALE_MAX_BULLETS) {
            return false;
        }
        // Bullet list with ≤3 items is always valid regardless of length
        return true;
    }
    // Not a bullet list - check simple length bound
    return rationale.length <= TRIAGE_RATIONALE_MAX_LENGTH;
}
const TriageResultV1Schema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    tier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        TRIAGE_TIER.INFO,
        TRIAGE_TIER.ASSESSMENT,
        TRIAGE_TIER.ESCALATE
    ]),
    nextAction: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        TRIAGE_NEXT_ACTION.START_FUNNEL_B,
        TRIAGE_NEXT_ACTION.RESUME_FUNNEL,
        TRIAGE_NEXT_ACTION.SHOW_ESCALATION
    ]),
    redFlags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).refine((flags)=>flags.every((flag)=>RED_FLAG_ALLOWLIST.includes(flag)), {
        message: 'All red flags must be from the allowlist'
    }).default([]),
    rationale: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine(validateRationale, {
        message: `Rationale must be ≤${TRIAGE_RATIONALE_MAX_LENGTH} chars or bullet list with max ${TRIAGE_RATIONALE_MAX_BULLETS} items`
    }),
    confidenceBand: ConfidenceBandSchema,
    version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(TRIAGE_SCHEMA_VERSION),
    correlationId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const TriageSuccessResponseSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    success: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(true),
    data: TriageResultV1Schema
});
const TriageErrorResponseSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    success: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(false),
    error: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        message: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        details: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].unknown()).optional()
    })
});
const TriageResponseSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    TriageSuccessResponseSchema,
    TriageErrorResponseSchema
]);
function validateTriageRequest(data) {
    return TriageRequestV1Schema.parse(data);
}
function safeValidateTriageRequest(data) {
    const result = TriageRequestV1Schema.safeParse(data);
    return result.success ? result.data : null;
}
function validateTriageResult(data) {
    return TriageResultV1Schema.parse(data);
}
function safeValidateTriageResult(data) {
    const result = TriageResultV1Schema.safeParse(data);
    return result.success ? result.data : null;
}
function sanitizeRedFlags(redFlags) {
    return redFlags.filter((flag)=>RED_FLAG_ALLOWLIST.includes(flag));
}
function getOversizeErrorStatus(inputText) {
    if (inputText.length > TRIAGE_INPUT_MAX_LENGTH) {
        // Very large inputs get 413 (Request Entity Too Large)
        // Moderately over limit gets 400 (Bad Request)
        return inputText.length > TRIAGE_INPUT_VERY_LARGE_THRESHOLD ? 413 : 400;
    }
    return null;
}
function boundRationale(rationale) {
    // Check if it's already valid
    if (validateRationale(rationale)) {
        return rationale;
    }
    // Check if it's a bullet list
    const bulletPattern = /^[\s]*[-*•]\s+/;
    const lines = rationale.split('\n');
    const bulletLines = lines.filter((line)=>bulletPattern.test(line));
    if (bulletLines.length > TRIAGE_RATIONALE_MAX_BULLETS) {
        // Take first N bullets and reconstruct with original line breaks preserved
        let bulletCount = 0;
        const boundedLines = [];
        for (const line of lines){
            if (bulletPattern.test(line)) {
                if (bulletCount >= TRIAGE_RATIONALE_MAX_BULLETS) {
                    break;
                }
                bulletCount++;
            }
            boundedLines.push(line);
        }
        return boundedLines.join('\n').trim();
    }
    // Simple truncation to max length
    if (rationale.length > TRIAGE_RATIONALE_MAX_LENGTH) {
        return rationale.slice(0, TRIAGE_RATIONALE_MAX_LENGTH - 3) + '...';
    }
    return rationale;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/triage/router.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * E6.6.5 — Triage Router
 *
 * Maps TriageResultV1.nextAction to concrete navigation routes.
 * This is the "product logic" that converts triage decisions into user journeys.
 *
 * Key Principles:
 * - AC1: Each nextAction maps to exactly one route (deterministic)
 * - AC2: Router actions are pure functions (testable)
 * - AC3: Navigation always initiated from dashboard
 *
 * @module lib/triage/router
 */ __turbopack_context__.s([
    "buildRouteUrl",
    ()=>buildRouteUrl,
    "getNavigationTarget",
    ()=>getNavigationTarget,
    "isRoutableAction",
    ()=>isRoutableAction,
    "mapNextActionToRoute",
    ()=>mapNextActionToRoute
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$contracts$2f$triage$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api/contracts/triage/index.ts [app-client] (ecmascript)");
;
function mapNextActionToRoute(nextAction, triageResult) {
    switch(nextAction){
        case __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$contracts$2f$triage$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRIAGE_NEXT_ACTION"].SHOW_CONTENT:
            // Navigate to content tiles section, optionally highlight first tile
            return {
                path: '/patient/dashboard',
                query: {
                    scrollTo: 'content'
                },
                state: {
                    highlightContent: true,
                    triageTier: triageResult.tier
                },
                description: 'Show content tiles (INFO tier)'
            };
        case __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$contracts$2f$triage$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRIAGE_NEXT_ACTION"].START_FUNNEL_A:
            // Navigate to stress/resilience funnel
            return {
                path: '/patient/funnel/stress-resilience',
                query: {
                    source: 'triage'
                },
                state: {
                    triageRationale: triageResult.rationale,
                    triageTier: triageResult.tier
                },
                description: 'Start Stress & Resilience Assessment (Funnel A)'
            };
        case __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$contracts$2f$triage$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRIAGE_NEXT_ACTION"].START_FUNNEL_B:
            // Navigate to sleep funnel (if implemented)
            return {
                path: '/patient/funnel/sleep',
                query: {
                    source: 'triage'
                },
                state: {
                    triageRationale: triageResult.rationale,
                    triageTier: triageResult.tier
                },
                description: 'Start Sleep Assessment (Funnel B)'
            };
        case __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$contracts$2f$triage$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRIAGE_NEXT_ACTION"].RESUME_FUNNEL:
            // Navigate to dashboard with instruction to resume
            // Dashboard will show "Next Step" card with resume CTA
            return {
                path: '/patient/dashboard',
                query: {
                    action: 'resume'
                },
                state: {
                    triageRationale: triageResult.rationale
                },
                description: 'Resume existing funnel from dashboard'
            };
        case __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$contracts$2f$triage$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRIAGE_NEXT_ACTION"].SHOW_ESCALATION:
            // Navigate to escalation/support page
            return {
                path: '/patient/support',
                query: {
                    source: 'triage',
                    tier: triageResult.tier
                },
                state: {
                    triageRationale: triageResult.rationale,
                    redFlags: triageResult.redFlags,
                    urgent: true
                },
                description: 'Show escalation support (ESCALATE tier)'
            };
        default:
            // Fallback to dashboard (should never happen with proper typing)
            console.warn('[TriageRouter] Unknown nextAction, falling back to dashboard', {
                nextAction
            });
            return {
                path: '/patient/dashboard',
                query: {},
                state: {},
                description: 'Fallback to dashboard (unknown action)'
            };
    }
}
function buildRouteUrl(route) {
    const { path, query } = route;
    if (!query || Object.keys(query).length === 0) {
        return path;
    }
    const queryString = new URLSearchParams(query).toString();
    return `${path}?${queryString}`;
}
function getNavigationTarget(nextAction, triageResult) {
    const route = mapNextActionToRoute(nextAction, triageResult);
    const url = buildRouteUrl(route);
    return {
        url,
        state: route.state || {},
        description: route.description
    };
}
function isRoutableAction(nextAction) {
    return Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$contracts$2f$triage$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TRIAGE_NEXT_ACTION"]).includes(nextAction);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/triage/storage.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearTriageResult",
    ()=>clearTriageResult,
    "getLastTriageResult",
    ()=>getLastTriageResult,
    "hasStoredTriageResult",
    ()=>hasStoredTriageResult,
    "storeTriageResult",
    ()=>storeTriageResult
]);
/**
 * E6.6.5 — Triage Storage Helper
 *
 * Utility for storing and retrieving triage results from sessionStorage.
 * Supports retry/rationale display and debugging.
 *
 * @module lib/triage/storage
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$contracts$2f$triage$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api/contracts/triage/index.ts [app-client] (ecmascript)");
;
/**
 * Storage key for last triage result
 */ const STORAGE_KEY = 'lastTriageResult';
function storeTriageResult(result) {
    if (("TURBOPACK compile-time value", "object") === 'undefined' || !window.sessionStorage) {
        console.warn('[TriageStorage] sessionStorage not available');
        return false;
    }
    try {
        const serialized = JSON.stringify(result);
        window.sessionStorage.setItem(STORAGE_KEY, serialized);
        return true;
    } catch (error) {
        console.error('[TriageStorage] Failed to store triage result', error);
        return false;
    }
}
function getLastTriageResult() {
    if (("TURBOPACK compile-time value", "object") === 'undefined' || !window.sessionStorage) {
        return null;
    }
    try {
        const serialized = window.sessionStorage.getItem(STORAGE_KEY);
        if (!serialized) {
            return null;
        }
        const parsed = JSON.parse(serialized);
        // Validate that it's a proper TriageResultV1
        const validated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$contracts$2f$triage$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["safeValidateTriageResult"])(parsed);
        if (!validated) {
            console.warn('[TriageStorage] Stored result failed validation, clearing');
            clearTriageResult();
            return null;
        }
        return validated;
    } catch (error) {
        console.error('[TriageStorage] Failed to retrieve triage result', error);
        clearTriageResult();
        return null;
    }
}
function clearTriageResult() {
    if (("TURBOPACK compile-time value", "object") === 'undefined' || !window.sessionStorage) {
        return;
    }
    try {
        window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('[TriageStorage] Failed to clear triage result', error);
    }
}
function hasStoredTriageResult() {
    return getLastTriageResult() !== null;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AMYComposer",
    ()=>AMYComposer,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Textarea.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Alert.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$triage$2f$router$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/triage/router.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$triage$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/triage/storage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$safety$2f$disclaimers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/safety/disclaimers.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
/**
 * E6.6.1 + E6.6.5 + E6.6.9 — AMY Composer Component
 * 
 * Bounded, guided mode for patient-initiated AMY interactions.
 * E6.6.5: Integrates triage router for navigation after triage.
 * E6.6.9: Dev harness with quick-fill test inputs (dev-only).
 * 
 * Features:
 * - AC1: Max length enforced client-side (up to 800 chars, recommended 500)
 * - AC2: Single-turn interaction (no chat history)
 * - AC3: Non-emergency disclaimer visible
 * - AC4: Submit triggers triage API call and shows routed result
 * - E6.6.5: Router applies TriageResult → Navigation (Dashboard-first)
 * - E6.6.9: Dev UI quick-fill buttons (non-prod only)
 * 
 * UX:
 * - Character counter
 * - Loading state during API call
 * - Error state handling
 * - Clear result display with navigation CTA
 * - Optional: Suggested chips for guided input
 * - Dev-only: Quick-fill test inputs for deterministic testing
 */ const MAX_LENGTH = 800 // AC1: Client-side validation
;
const RECOMMENDED_LENGTH = 500 // Soft recommendation
;
// Optional: Suggested chips for guided input
const SUGGESTED_CONCERNS = [
    '💤 Schlafprobleme',
    '😰 Stress',
    '💓 Herzklopfen',
    '😟 Sorgen'
];
// E6.6.9: Dev harness - Quick-fill test inputs (deterministic)
// AC2: Only shown in non-production environments
const DEV_QUICK_FILLS = [
    {
        label: '💬 Info',
        text: 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?',
        tier: 'INFO',
        color: 'green'
    },
    {
        label: '📋 Assessment',
        text: 'Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. Es fällt mir schwer, mich zu konzentrieren.',
        tier: 'ASSESSMENT',
        color: 'amber'
    },
    {
        label: '🚨 Escalate',
        text: 'Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.',
        tier: 'ESCALATE',
        color: 'red'
    }
];
// E6.6.9: Helper to get button styles based on tier color
const getQuickFillButtonStyles = (color)=>{
    const baseStyles = 'px-3 py-2 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const colorStyles = {
        green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50',
        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
    };
    return `${baseStyles} ${colorStyles[color]}`;
};
// E6.6.9 AC2: Dev harness visibility configuration
// Set to true only in development/preview environments
// In production, this should be false to hide dev tools from end users
// Note: Can be toggled via browser localStorage for testing:
//   localStorage.setItem('devHarnessEnabled', 'true')
const isDevHarnessEnabled = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Check localStorage override first (for testing in deployed environments)
    // Wrapped in try-catch to handle SecurityError in sandboxed environments
    try {
        const storageOverride = localStorage.getItem('devHarnessEnabled');
        if (storageOverride === 'true') {
            return true;
        }
    } catch (error) {
        // localStorage access failed (sandboxed environment, disabled storage, etc.)
        // Continue to hostname checks
        console.debug('[DevHarness] localStorage access failed, using hostname check only', error);
    }
    // Check hostname to auto-enable on localhost/preview deployments
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('preview') || hostname.includes('dev-');
};
function AMYComposer() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [concern, setConcern] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showDevHarness, setShowDevHarness] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const charCount = concern.length;
    const isOverLimit = charCount > MAX_LENGTH;
    const isNearLimit = charCount > RECOMMENDED_LENGTH && charCount <= MAX_LENGTH;
    const canSubmit = concern.trim().length >= 10 && !isOverLimit && state !== 'loading';
    // E6.6.9: Handler for dev quick-fill buttons
    const handleDevQuickFill = (text)=>{
        setConcern(text);
        setState('idle');
        setResult(null);
        setError(null);
    };
    const handleSubmit = async ()=>{
        if (!canSubmit) return;
        setState('loading');
        setError(null);
        setResult(null);
        try {
            const response = await fetch('/api/amy/triage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    concern: concern.trim()
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Triage request failed');
            }
            if (data.success && data.data) {
                const triageResult = data.data;
                setResult(triageResult);
                setState('success');
                // E6.6.5: Store last triage result for rationale/retry
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$triage$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storeTriageResult"])(triageResult);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('[AMYComposer] Triage failed', err);
            setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten.');
            setState('error');
        }
    };
    // E6.6.5: Handle navigation based on triage result
    const handleNavigate = ()=>{
        if (!result) return;
        // Validate nextAction is routable
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$triage$2f$router$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isRoutableAction"])(result.nextAction)) {
            console.error('[AMYComposer] Invalid nextAction', {
                nextAction: result.nextAction
            });
            setError('Ungültige Triage-Aktion. Bitte versuchen Sie es erneut.');
            return;
        }
        // Get navigation target from router
        const { url, description } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$triage$2f$router$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getNavigationTarget"])(result.nextAction, result);
        console.log('[AMYComposer] Navigating to', {
            url,
            description,
            tier: result.tier
        });
        // Navigate to target
        router.push(url);
    };
    const handleChipClick = (chip)=>{
        // Extract text after emoji (emojis are typically 1-2 chars at start)
        // This preserves German characters (ä, ö, ü, ß)
        const text = chip.slice(2).trim() // Remove emoji and leading space
        ;
        if (concern) {
            setConcern(concern + ', ' + text);
        } else {
            setConcern(text);
        }
    };
    const handleReset = ()=>{
        setConcern('');
        setState('idle');
        setResult(null);
        setError(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
        padding: "lg",
        radius: "lg",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-start gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-2xl",
                                role: "img",
                                "aria-label": "AMY Assistant",
                                children: "🤖"
                            }, void 0, false, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                lineNumber: 221,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 220,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1",
                                    children: "AMY - Ihr persönlicher Assistent"
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 226,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-slate-600 dark:text-slate-400",
                                    children: "Beschreiben Sie Ihr Anliegen in 1–2 Sätzen"
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 229,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 225,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                    lineNumber: 219,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Alert"], {
                    variant: "info",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: [
                                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$safety$2f$disclaimers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NON_EMERGENCY_DISCLAIMER"].title,
                                    ":"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                lineNumber: 238,
                                columnNumber: 13
                            }, this),
                            " ",
                            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$safety$2f$disclaimers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NON_EMERGENCY_DISCLAIMER"].text
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                        lineNumber: 237,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                    lineNumber: 236,
                    columnNumber: 9
                }, this),
                isDevHarnessEnabled() && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between mb-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-lg",
                                            role: "img",
                                            "aria-label": "Developer",
                                            children: "👨‍💻"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                            lineNumber: 247,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                            className: "text-sm font-semibold text-purple-900 dark:text-purple-300",
                                            children: "Dev Harness - Test Inputs"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                            lineNumber: 250,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 246,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setShowDevHarness(!showDevHarness),
                                    className: "text-xs px-2 py-1 rounded bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-300 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors",
                                    children: showDevHarness ? 'Hide' : 'Show'
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 254,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 245,
                            columnNumber: 13
                        }, this),
                        showDevHarness && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-purple-700 dark:text-purple-400 mb-2",
                                    children: "Deterministic test inputs for all router paths (INFO/ASSESSMENT/ESCALATE)"
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 265,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-wrap gap-2",
                                    children: DEV_QUICK_FILLS.map((fill)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>handleDevQuickFill(fill.text),
                                            disabled: state === 'loading',
                                            className: getQuickFillButtonStyles(fill.color),
                                            children: fill.label
                                        }, fill.label, false, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                            lineNumber: 270,
                                            columnNumber: 21
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 268,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-purple-600 dark:text-purple-400 mt-2",
                                    children: "⚠️ Dev-only feature. Hidden in production."
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 281,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 264,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                    lineNumber: 244,
                    columnNumber: 11
                }, this),
                (state === 'idle' || state === 'loading' || state === 'error') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-2",
                            children: SUGGESTED_CONCERNS.map((chip)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>handleChipClick(chip),
                                    disabled: state === 'loading',
                                    className: "px-3 py-1.5 text-sm rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                    children: chip
                                }, chip, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 295,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 293,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Textarea$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Textarea"], {
                                    value: concern,
                                    onChange: (e)=>setConcern(e.target.value),
                                    placeholder: "z.B. Ich habe in letzter Zeit Schlafprobleme und fühle mich gestresst...",
                                    rows: 4,
                                    disabled: state === 'loading',
                                    error: isOverLimit,
                                    errorMessage: isOverLimit ? `Maximal ${MAX_LENGTH} Zeichen erlaubt` : undefined,
                                    helperText: !isOverLimit && isNearLimit ? `Empfohlen: bis zu ${RECOMMENDED_LENGTH} Zeichen` : undefined,
                                    maxLength: MAX_LENGTH + 50
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 309,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center text-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `${isOverLimit ? 'text-red-600 dark:text-red-400 font-medium' : isNearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`,
                                            children: [
                                                charCount,
                                                " / ",
                                                MAX_LENGTH,
                                                " Zeichen"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                            lineNumber: 327,
                                            columnNumber: 17
                                        }, this),
                                        concern.trim().length < 10 && concern.trim().length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-slate-500 dark:text-slate-400 text-xs",
                                            children: "Mindestens 10 Zeichen erforderlich"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                            lineNumber: 339,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 326,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 308,
                            columnNumber: 13
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Alert"], {
                            variant: "error",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                lineNumber: 349,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 348,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "primary",
                            fullWidth: true,
                            onClick: handleSubmit,
                            disabled: !canSubmit,
                            loading: state === 'loading',
                            children: state === 'loading' ? 'Wird analysiert...' : 'Anliegen einreichen'
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 354,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true),
                state === 'success' && result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${result.tier === 'ESCALATE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : result.tier === 'ASSESSMENT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`,
                                children: result.tier === 'ESCALATE' ? '🚨 Dringend' : result.tier === 'ASSESSMENT' ? '📋 Einschätzung empfohlen' : '✅ Information'
                            }, void 0, false, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                lineNumber: 371,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 370,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "prose prose-sm dark:prose-invert max-w-none",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-slate-700 dark:text-slate-300 leading-relaxed",
                                children: result.rationale
                            }, void 0, false, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                lineNumber: 390,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 389,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "primary",
                                    fullWidth: true,
                                    onClick: handleNavigate,
                                    children: [
                                        result.nextAction === 'SHOW_CONTENT' && '📚 Inhalte ansehen',
                                        result.nextAction === 'START_FUNNEL_A' && '📋 Fragebogen starten',
                                        result.nextAction === 'START_FUNNEL_B' && '💤 Schlaf-Assessment starten',
                                        result.nextAction === 'RESUME_FUNNEL' && '▶️ Fragebogen fortsetzen',
                                        result.nextAction === 'SHOW_ESCALATION' && '🆘 Unterstützung erhalten'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 397,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "secondary",
                                    fullWidth: true,
                                    onClick: handleReset,
                                    children: "Neues Anliegen eingeben"
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                    lineNumber: 406,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 396,
                            columnNumber: 13
                        }, this),
                        result.tier === 'ESCALATE' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Alert"], {
                            variant: "error",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-medium",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$safety$2f$disclaimers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STANDARD_EMERGENCY_GUIDANCE"].title,
                                            ":"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                        lineNumber: 415,
                                        columnNumber: 19
                                    }, this),
                                    ' ',
                                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$safety$2f$disclaimers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STANDARD_EMERGENCY_GUIDANCE"].text
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                                lineNumber: 414,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                            lineNumber: 413,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
                    lineNumber: 368,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
            lineNumber: 217,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx",
        lineNumber: 216,
        columnNumber: 5
    }, this);
}
_s(AMYComposer, "w42e6aVQBOhn92lDy/GTd5PT4po=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AMYComposer;
const __TURBOPACK__default__export__ = AMYComposer;
var _c;
__turbopack_context__.k.register(_c, "AMYComposer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NextStepCard",
    ()=>NextStepCard,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Card.tsx [app-client] (ecmascript)");
'use client';
;
;
function NextStepCard({ nextStep, onAction }) {
    // Don't render if type is 'none'
    if (nextStep.type === 'none') {
        return null;
    }
    // Icon mapping based on next step type
    const iconMap = {
        onboarding: '📋',
        funnel: '🎯',
        result: '📊',
        content: '📖',
        none: ''
    };
    const icon = iconMap[nextStep.type];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
        padding: "lg",
        radius: "lg",
        className: "border-2 border-sky-200 dark:border-sky-800",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-2xl",
                                role: "img",
                                "aria-label": "Next step",
                                children: icon
                            }, void 0, false, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx",
                                lineNumber: 58,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx",
                            lineNumber: 57,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-semibold text-slate-900 dark:text-slate-100",
                                    children: "Nächster Schritt"
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx",
                                    lineNumber: 63,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-slate-600 dark:text-slate-400",
                                    children: nextStep.label
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx",
                                    lineNumber: 66,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx",
                            lineNumber: 62,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx",
                    lineNumber: 56,
                    columnNumber: 9
                }, this),
                nextStep.target && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onAction,
                    className: "w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors duration-200",
                    children: nextStep.label
                }, void 0, false, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx",
                    lineNumber: 71,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx",
            lineNumber: 55,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
_c = NextStepCard;
const __TURBOPACK__default__export__ = NextStepCard;
var _c;
__turbopack_context__.k.register(_c, "NextStepCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ContentTilesGrid",
    ()=>ContentTilesGrid,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Card.tsx [app-client] (ecmascript)");
'use client';
;
;
function ContentTilesGrid({ tiles, onTileClick }) {
    // Sort tiles by priority (higher priority first)
    const sortedTiles = [
        ...tiles
    ].sort((a, b)=>b.priority - a.priority);
    // Icon mapping based on tile type
    const iconMap = {
        info: '💡',
        action: '⚡',
        promotion: '🎁'
    };
    // Empty state
    if (tiles.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center py-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-4xl mb-3",
                    children: "📚"
                }, void 0, false, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                    lineNumber: 49,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    className: "text-lg font-medium text-slate-900 dark:text-slate-100 mb-2",
                    children: "Noch keine Inhalte verfügbar"
                }, void 0, false, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                    lineNumber: 50,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-slate-600 dark:text-slate-400",
                    children: "Neue Inhalte werden bald hinzugefügt."
                }, void 0, false, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                    lineNumber: 53,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
            lineNumber: 48,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-lg font-semibold text-slate-900 dark:text-slate-100",
                children: "Empfohlene Inhalte"
            }, void 0, false, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
                children: sortedTiles.map((tile)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                        padding: "md",
                        radius: "lg",
                        interactive: !!tile.actionTarget,
                        onClick: ()=>{
                            if (tile.actionTarget && onTileClick) {
                                onTileClick(tile);
                            }
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-2xl flex-shrink-0",
                                            role: "img",
                                            "aria-label": tile.type,
                                            children: iconMap[tile.type]
                                        }, void 0, false, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                                            lineNumber: 80,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                    className: "font-medium text-slate-900 dark:text-slate-100 mb-1 truncate",
                                                    children: tile.title
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                                                    lineNumber: 84,
                                                    columnNumber: 19
                                                }, this),
                                                tile.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-slate-600 dark:text-slate-400 line-clamp-2",
                                                    children: tile.description
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                                                    lineNumber: 88,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                                            lineNumber: 83,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                                    lineNumber: 79,
                                    columnNumber: 15
                                }, this),
                                tile.actionLabel && tile.actionTarget && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "pt-2 border-t border-slate-200 dark:border-slate-700",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-sky-600 dark:text-sky-400 font-medium",
                                        children: [
                                            tile.actionLabel,
                                            " →"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                                        lineNumber: 96,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                                    lineNumber: 95,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                            lineNumber: 78,
                            columnNumber: 13
                        }, this)
                    }, tile.id, false, {
                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
_c = ContentTilesGrid;
const __TURBOPACK__default__export__ = ContentTilesGrid;
var _c;
__turbopack_context__.k.register(_c, "ContentTilesGrid");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProgressSummary",
    ()=>ProgressSummary,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Badge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Progress$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Progress.tsx [app-client] (ecmascript)");
'use client';
;
;
function ProgressSummary({ funnelSummaries, workupSummary, onFunnelClick }) {
    // Status badge mapping
    const statusVariants = {
        not_started: 'default',
        in_progress: 'warning',
        completed: 'success'
    };
    const statusLabels = {
        not_started: 'Nicht begonnen',
        in_progress: 'In Bearbeitung',
        completed: 'Abgeschlossen'
    };
    // Workup state mapping
    const workupStateLabels = {
        no_data: 'Keine Daten',
        needs_more_data: 'Weitere Daten erforderlich',
        ready_for_review: 'Bereit zur Überprüfung'
    };
    const workupStateColors = {
        no_data: 'text-slate-600 dark:text-slate-400',
        needs_more_data: 'text-amber-600 dark:text-amber-400',
        ready_for_review: 'text-green-600 dark:text-green-400'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-slate-900 dark:text-slate-100",
                        children: "Ihre Assessments"
                    }, void 0, false, {
                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    funnelSummaries.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                        padding: "lg",
                        radius: "lg",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center py-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-4xl mb-3",
                                    children: "📋"
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                    lineNumber: 78,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    className: "text-base font-medium text-slate-900 dark:text-slate-100 mb-2",
                                    children: "Noch keine Assessments"
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                    lineNumber: 79,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-slate-600 dark:text-slate-400",
                                    children: "Starten Sie Ihr erstes Assessment, um Ihren Fortschritt zu verfolgen."
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                    lineNumber: 82,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                            lineNumber: 77,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                        lineNumber: 76,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3",
                        children: funnelSummaries.map((funnel)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                                padding: "md",
                                radius: "lg",
                                interactive: funnel.status === 'in_progress',
                                onClick: ()=>{
                                    if (funnel.status === 'in_progress' && onFunnelClick) {
                                        onFunnelClick(funnel);
                                    }
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-start justify-between gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex-1 min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                            className: "font-medium text-slate-900 dark:text-slate-100 mb-1",
                                                            children: funnel.title
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                            lineNumber: 104,
                                                            columnNumber: 23
                                                        }, this),
                                                        funnel.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-slate-600 dark:text-slate-400 line-clamp-2",
                                                            children: funnel.description
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                            lineNumber: 108,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 103,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                                    variant: statusVariants[funnel.status],
                                                    size: "sm",
                                                    children: statusLabels[funnel.status]
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 113,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                            lineNumber: 102,
                                            columnNumber: 19
                                        }, this),
                                        funnel.progress && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between text-xs text-slate-600 dark:text-slate-400",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: "Fortschritt"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                            lineNumber: 121,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: [
                                                                funnel.progress.current,
                                                                " / ",
                                                                funnel.progress.total
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                            lineNumber: 122,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 120,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Progress$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Progress"], {
                                                    value: funnel.progress.current / funnel.progress.total * 100,
                                                    showPercentage: false,
                                                    showStepText: false
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 126,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                            lineNumber: 119,
                                            columnNumber: 21
                                        }, this),
                                        funnel.completedAt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-slate-500 dark:text-slate-500",
                                            children: [
                                                "Abgeschlossen am ",
                                                new Date(funnel.completedAt).toLocaleDateString('de-DE')
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                            lineNumber: 135,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                    lineNumber: 101,
                                    columnNumber: 17
                                }, this)
                            }, funnel.slug, false, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                lineNumber: 90,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                        lineNumber: 88,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-slate-900 dark:text-slate-100",
                        children: "Workup-Status"
                    }, void 0, false, {
                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                        padding: "md",
                        radius: "lg",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-medium text-slate-700 dark:text-slate-300",
                                            children: "Status:"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                            lineNumber: 154,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `text-sm font-semibold ${workupStateColors[workupSummary.state]}`,
                                            children: workupStateLabels[workupSummary.state]
                                        }, void 0, false, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                            lineNumber: 157,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                    lineNumber: 153,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-3 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-2xl font-bold text-slate-900 dark:text-slate-100",
                                                    children: workupSummary.counts.total
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 164,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-slate-600 dark:text-slate-400 mt-1",
                                                    children: "Gesamt"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 167,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                            lineNumber: 163,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-2xl font-bold text-amber-600 dark:text-amber-400",
                                                    children: workupSummary.counts.needsMoreData
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 170,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-slate-600 dark:text-slate-400 mt-1",
                                                    children: "Weitere Daten"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 173,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                            lineNumber: 169,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-2xl font-bold text-green-600 dark:text-green-400",
                                                    children: workupSummary.counts.readyForReview
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 178,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-slate-600 dark:text-slate-400 mt-1",
                                                    children: "Bereit"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                                    lineNumber: 181,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                            lineNumber: 177,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                                    lineNumber: 162,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                            lineNumber: 152,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                        lineNumber: 151,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
                lineNumber: 147,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx",
        lineNumber: 68,
        columnNumber: 5
    }, this);
}
_c = ProgressSummary;
const __TURBOPACK__default__export__ = ProgressSummary;
var _c;
__turbopack_context__.k.register(_c, "ProgressSummary");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
/**
 * Dashboard Components
 * 
 * E6.5.4 Patient Dashboard Layout Components
 * 
 * This module exports all dashboard section components used
 * to build the patient dashboard UI.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$DashboardHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/DashboardHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$AMYSlot$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYSlot.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$AMYComposer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$NextStepCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$ContentTilesGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$ProgressSummary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx [app-client] (ecmascript)");
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
"[project]/lib/hooks/useDashboardData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDashboardData",
    ()=>useDashboardData
]);
/**
 * useDashboardData Hook - E6.5.9
 *
 * Manages dashboard data fetching with:
 * - Stale-while-revalidate pattern
 * - Error handling with retry
 * - Refresh on demand
 *
 * E6.5.9 AC1: Dashboard reflects new status without hard reload
 * E6.5.9 AC2: Offline/failed fetch shows error state + retry (not blank)
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
const DASHBOARD_API_ENDPOINT = '/api/patient/dashboard';
function useDashboardData(autoFetch = true) {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isStale, setIsStale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Track if a fetch is in progress to prevent race conditions
    const fetchInProgressRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const abortControllerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fetchDashboard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboardData.useCallback[fetchDashboard]": async (options = {})=>{
            // Prevent concurrent fetches
            if (fetchInProgressRef.current) {
                return;
            }
            // Cancel any pending request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            fetchInProgressRef.current = true;
            const abortController = new AbortController();
            abortControllerRef.current = abortController;
            try {
                // If we have stale data, mark as revalidating; otherwise loading
                if (options.isRevalidation && data) {
                    setState('revalidating');
                    setIsStale(true);
                } else {
                    setState('loading');
                }
                setError(null);
                const response = await fetch(DASHBOARD_API_ENDPOINT, {
                    credentials: 'include',
                    signal: abortController.signal
                });
                if (!response.ok) {
                    throw new Error('Failed to load dashboard data');
                }
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error?.message || 'Failed to load dashboard');
                }
                // Update data and clear stale flag
                setData(result.data);
                setState('idle');
                setIsStale(false);
                setError(null);
            } catch (err) {
                // Don't set error state if request was aborted (component unmounted or new request started)
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }
                console.error('[useDashboardData] Error loading data:', err);
                // Only clear data if we don't have stale data to show
                if (!data || !options.isRevalidation) {
                    setData(null);
                }
                setState('error');
                setError(err instanceof Error ? err.message : 'Dashboard konnte nicht geladen werden.');
            } finally{
                fetchInProgressRef.current = false;
                abortControllerRef.current = null;
            }
        }
    }["useDashboardData.useCallback[fetchDashboard]"], [
        data
    ]);
    // Auto-fetch on mount if enabled
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useDashboardData.useEffect": ()=>{
            if (autoFetch && state === 'idle' && !data) {
                fetchDashboard();
            }
        }
    }["useDashboardData.useEffect"], [
        autoFetch,
        state,
        data,
        fetchDashboard
    ]);
    // Cleanup on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useDashboardData.useEffect": ()=>{
            return ({
                "useDashboardData.useEffect": ()=>{
                    if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                    }
                }
            })["useDashboardData.useEffect"];
        }
    }["useDashboardData.useEffect"], []);
    /**
   * Refresh dashboard data
   * Uses stale-while-revalidate: shows old data while fetching new
   */ const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboardData.useCallback[refresh]": async ()=>{
            await fetchDashboard({
                isRevalidation: true
            });
        }
    }["useDashboardData.useCallback[refresh]"], [
        fetchDashboard
    ]);
    /**
   * Retry after error
   * Clears error state and attempts fresh fetch
   */ const retry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboardData.useCallback[retry]": async ()=>{
            await fetchDashboard({
                isRevalidation: false
            });
        }
    }["useDashboardData.useCallback[retry]"], [
        fetchDashboard
    ]);
    return {
        data,
        state,
        error,
        isStale,
        refresh,
        retry
    };
}
_s(useDashboardData, "4DUdhXfjcoMihE3+ymG8oDiRQSI=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/hooks/useAppFocus.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAppFocus",
    ()=>useAppFocus
]);
/**
 * useAppFocus Hook - E6.5.9
 *
 * Detects when the app/browser tab comes into focus.
 * Useful for triggering data refreshes when user returns to the app.
 *
 * Mobile-friendly: Handles both visibilitychange and focus events
 * for maximum compatibility across devices.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function useAppFocus(onFocus, enabled = true) {
    _s();
    const callbackRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(onFocus);
    // Keep callback ref up to date
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAppFocus.useEffect": ()=>{
            callbackRef.current = onFocus;
        }
    }["useAppFocus.useEffect"], [
        onFocus
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAppFocus.useEffect": ()=>{
            if (!enabled) return;
            // Track if we're currently visible to avoid duplicate calls
            let wasVisible = !document.hidden;
            const handleVisibilityChange = {
                "useAppFocus.useEffect.handleVisibilityChange": ()=>{
                    const isVisible = !document.hidden;
                    // Only call callback when transitioning from hidden to visible
                    if (!wasVisible && isVisible) {
                        callbackRef.current();
                    }
                    wasVisible = isVisible;
                }
            }["useAppFocus.useEffect.handleVisibilityChange"];
            const handleFocus = {
                "useAppFocus.useEffect.handleFocus": ()=>{
                    // Only call if document is visible (prevents duplicate calls)
                    if (!document.hidden) {
                        callbackRef.current();
                    }
                }
            }["useAppFocus.useEffect.handleFocus"];
            // Listen for visibility changes (mobile-friendly)
            document.addEventListener('visibilitychange', handleVisibilityChange);
            // Listen for window focus events (desktop)
            window.addEventListener('focus', handleFocus);
            return ({
                "useAppFocus.useEffect": ()=>{
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    window.removeEventListener('focus', handleFocus);
                }
            })["useAppFocus.useEffect"];
        }
    }["useAppFocus.useEffect"], [
        enabled
    ]);
}
_s(useAppFocus, "K/h/7jNaRWXLP/aFqUkOqhPUWKE=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$MobileHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/MobileHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$LoadingSpinner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/LoadingSpinner.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ErrorState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/ErrorState.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$DashboardHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/DashboardHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$AMYComposer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/AMYComposer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$NextStepCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/NextStepCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$ContentTilesGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ContentTilesGrid.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$ProgressSummary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/dashboard/components/ProgressSummary.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useDashboardData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useDashboardData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAppFocus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/useAppFocus.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
function DashboardClient() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    // E6.5.9: Use dashboard data hook with stale-while-revalidate
    const { data: dashboardData, state, error, isStale, refresh, retry } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useDashboardData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardData"])();
    // E6.5.9: Auto-refresh on app focus (mobile-friendly)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAppFocus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppFocus"])({
        "DashboardClient.useAppFocus": ()=>{
            refresh();
        }
    }["DashboardClient.useAppFocus"]);
    // E6.5.9: Refresh when returning from funnel completion or follow-up
    // E6.6.5: Handle scroll-to-content from triage router
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DashboardClient.useEffect": ()=>{
            const refreshTrigger = searchParams.get('refresh');
            const scrollTo = searchParams.get('scrollTo');
            const action = searchParams.get('action');
            if (refreshTrigger === 'funnel' || refreshTrigger === 'followup') {
                // Clear the query param to avoid repeated refreshes
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('refresh');
                router.replace(newUrl.pathname + newUrl.search, {
                    scroll: false
                });
                // Trigger refresh
                refresh();
            }
            // E6.6.5: Handle scroll-to-content from triage SHOW_CONTENT action
            if (scrollTo === 'content') {
                // Scroll to content tiles after a short delay to allow render
                setTimeout({
                    "DashboardClient.useEffect": ()=>{
                        const contentElement = document.getElementById('content-tiles');
                        if (contentElement) {
                            contentElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }
                    }
                }["DashboardClient.useEffect"], 300);
                // Clear the query param
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('scrollTo');
                router.replace(newUrl.pathname + newUrl.search, {
                    scroll: false
                });
            }
            // E6.6.5: Handle resume action from triage RESUME_FUNNEL
            if (action === 'resume' && dashboardData?.nextStep?.target) {
                // Auto-navigate to resume target
                setTimeout({
                    "DashboardClient.useEffect": ()=>{
                        router.push(dashboardData.nextStep.target);
                    }
                }["DashboardClient.useEffect"], 500);
                // Clear the query param
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('action');
                router.replace(newUrl.pathname + newUrl.search, {
                    scroll: false
                });
            }
        }
    }["DashboardClient.useEffect"], [
        searchParams,
        router,
        refresh,
        dashboardData
    ]);
    const handleNextStepAction = ()=>{
        if (dashboardData?.nextStep?.target) {
            router.push(dashboardData.nextStep.target);
        }
    };
    const handleFunnelClick = (funnel)=>{
        router.push(`/patient/funnel/${funnel.slug}`);
    };
    const handleTileClick = (tile)=>{
        if (tile.actionTarget) {
            router.push(tile.actionTarget);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 transition-colors duration-150",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$MobileHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                variant: "with-title",
                title: "Dashboard",
                subtitle: "Rhythmologicum Connect",
                showBack: false
            }, void 0, false, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-1 overflow-y-auto px-4 pt-4 sm:pt-6",
                style: {
                    paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))'
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full max-w-4xl mx-auto space-y-6",
                    children: [
                        state === 'loading' && !dashboardData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "py-12",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$LoadingSpinner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoadingSpinner"], {
                                size: "lg",
                                text: "Dashboard wird geladen...",
                                centered: true
                            }, void 0, false, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                lineNumber: 135,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                            lineNumber: 134,
                            columnNumber: 13
                        }, this),
                        state === 'revalidating' && isStale && dashboardData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-sky-50 border border-sky-200 rounded-lg px-4 py-2 text-sm text-sky-700",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "animate-spin h-4 w-4 border-2 border-sky-600 border-t-transparent rounded-full"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                        lineNumber: 143,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Aktualisiere Dashboard..."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                        lineNumber: 144,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                lineNumber: 142,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                            lineNumber: 141,
                            columnNumber: 13
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ErrorState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ErrorState"], {
                            title: "Fehler beim Laden",
                            message: error,
                            onRetry: retry,
                            centered: !dashboardData
                        }, void 0, false, {
                            fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                            lineNumber: 151,
                            columnNumber: 13
                        }, this),
                        dashboardData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$DashboardHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DashboardHeader"], {}, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                    lineNumber: 164,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$AMYComposer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AMYComposer"], {}, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                    lineNumber: 167,
                                    columnNumber: 15
                                }, this),
                                dashboardData.nextStep && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$NextStepCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NextStepCard"], {
                                    nextStep: dashboardData.nextStep,
                                    onAction: handleNextStepAction
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                    lineNumber: 171,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    id: "content-tiles",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$ContentTilesGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ContentTilesGrid"], {
                                        tiles: dashboardData.contentTiles,
                                        onTileClick: handleTileClick
                                    }, void 0, false, {
                                        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                        lineNumber: 179,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                    lineNumber: 178,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$dashboard$2f$components$2f$ProgressSummary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProgressSummary"], {
                                    funnelSummaries: dashboardData.funnelSummaries,
                                    workupSummary: dashboardData.workupSummary,
                                    onFunnelClick: handleFunnelClick
                                }, void 0, false, {
                                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                                    lineNumber: 186,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                    lineNumber: 131,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
                lineNumber: 127,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/dashboard/client.tsx",
        lineNumber: 119,
        columnNumber: 5
    }, this);
}
_s(DashboardClient, "BaMNhyy78HDYEPGvHn/TTTMr5uM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useDashboardData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardData"],
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$useAppFocus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppFocus"]
    ];
});
_c = DashboardClient;
var _c;
__turbopack_context__.k.register(_c, "DashboardClient");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_5a50a053._.js.map