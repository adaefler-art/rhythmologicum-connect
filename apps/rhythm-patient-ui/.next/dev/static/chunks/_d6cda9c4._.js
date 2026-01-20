(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/utils/roleLanding.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getLandingForRole",
    ()=>getLandingForRole
]);
function getLandingForRole(role) {
    switch(role){
        case 'patient':
            return '/patient';
        case 'clinician':
        case 'nurse':
            return '/clinician';
        case 'admin':
            return '/admin';
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/utils/authRedirect.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPostLoginRedirect",
    ()=>getPostLoginRedirect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$roleLanding$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/roleLanding.ts [app-client] (ecmascript)");
;
function getPostLoginRedirect({ role, patientOnboardingPath }) {
    let target = '/';
    if (role === 'patient') {
        target = patientOnboardingPath ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$roleLanding$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getLandingForRole"])('patient');
    } else if (role === 'clinician' || role === 'admin' || role === 'nurse') {
        target = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$roleLanding$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getLandingForRole"])(role);
    }
    console.log(`[AUTH_LANDING] role=${role} target=${target}`);
    return target;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/supabaseClient.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$public$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabasePublic__as__supabase$3e$__ = __turbopack_context__.i("[project]/lib/db/supabase.public.ts [app-client] (ecmascript) <export supabasePublic as supabase>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/ThemeToggle.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ui/Input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$authRedirect$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/authRedirect.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
async function syncServerSession() {
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$public$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabasePublic__as__supabase$3e$__["supabase"].auth.getSession();
    const session = data.session;
    if (!session) return;
    await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            event: 'SIGNED_IN',
            session
        })
    });
}
async function resolveRole() {
    try {
        const res = await fetch('/api/auth/resolve-role', {
            method: 'GET'
        });
        if (res.status === 401) return {
            kind: 'unauthenticated'
        };
        if (!res.ok) return {
            kind: 'fallback_patient'
        };
        const json = await res.json();
        if (!json || typeof json !== 'object') return {
            kind: 'fallback_patient'
        };
        const data = json.data;
        if (!data || typeof data !== 'object') return {
            kind: 'fallback_patient'
        };
        const role = data.role;
        const requiresOnboarding = data.requiresOnboarding;
        const reason = data.reason;
        if (role === 'patient' || role === 'clinician' || role === 'admin' || role === 'nurse') {
            return {
                kind: 'ok',
                value: {
                    role,
                    requiresOnboarding: requiresOnboarding === true,
                    reason
                }
            };
        }
        // If the API returns an unexpected role, don't block UX.
        return {
            kind: 'fallback_patient'
        };
    } catch  {
        return {
            kind: 'fallback_patient'
        };
    }
}
async function getPatientRedirectFromOnboardingStatus() {
    try {
        const res = await fetch('/api/patient/onboarding-status', {
            method: 'GET',
            cache: 'no-store'
        });
        if (res.status === 401) return {
            kind: 'unauthenticated'
        };
        if (!res.ok) return {
            kind: 'fallback'
        };
        const json = await res.json();
        if (!json || typeof json !== 'object') return {
            kind: 'fallback'
        };
        const parsed = json;
        if (!('success' in parsed) || parsed.success !== true) return {
            kind: 'fallback'
        };
        if (parsed.data.needsConsent) return {
            kind: 'ok',
            path: '/patient/onboarding/consent'
        };
        if (parsed.data.needsProfile) return {
            kind: 'ok',
            path: '/patient/onboarding/profile'
        };
        return {
            kind: 'fallback'
        };
    } catch  {
        return {
            kind: 'fallback'
        };
    }
}
async function resolvePostLoginRedirect(role) {
    if (role === 'patient') {
        const onboarding = await getPatientRedirectFromOnboardingStatus();
        if (onboarding.kind === 'unauthenticated') return null;
        if (onboarding.kind === 'ok') {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$authRedirect$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPostLoginRedirect"])({
                role,
                patientOnboardingPath: onboarding.path
            });
        }
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$authRedirect$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPostLoginRedirect"])({
        role
    });
}
function LoginPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('login');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [info, setInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null) // neu: Erfolgsmeldungen
    ;
    const [versionInfo, setVersionInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Check if user is already authenticated and redirect to appropriate landing page
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LoginPage.useEffect": ()=>{
            const checkAuthAndRedirect = {
                "LoginPage.useEffect.checkAuthAndRedirect": async ()=>{
                    const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$public$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabasePublic__as__supabase$3e$__["supabase"].auth.getUser();
                    if (user) {
                        await syncServerSession();
                        const resolved = await resolveRole();
                        if (resolved.kind === 'unauthenticated') {
                            return;
                        }
                        const role = resolved.kind === 'fallback_patient' ? 'patient' : resolved.value.role;
                        const target = await resolvePostLoginRedirect(role);
                        if (target) {
                            router.replace(target);
                        }
                    }
                }
            }["LoginPage.useEffect.checkAuthAndRedirect"];
            checkAuthAndRedirect();
        }
    }["LoginPage.useEffect"], [
        router
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LoginPage.useEffect": ()=>{
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$public$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabasePublic__as__supabase$3e$__["supabase"].auth.onAuthStateChange({
                "LoginPage.useEffect": async (event, session)=>{
                    await fetch('/api/auth/callback', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            event,
                            session
                        })
                    });
                }
            }["LoginPage.useEffect"]);
            return ({
                "LoginPage.useEffect": ()=>subscription.unsubscribe()
            })["LoginPage.useEffect"];
        }
    }["LoginPage.useEffect"], []);
    // Fetch version info on component mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LoginPage.useEffect": ()=>{
            fetch('/version.json').then({
                "LoginPage.useEffect": (res)=>{
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                }
            }["LoginPage.useEffect"]).then({
                "LoginPage.useEffect": (data)=>{
                    // Basic validation of the response structure
                    if (data && typeof data.commitHashShort === 'string' && typeof data.commitDate === 'string') {
                        setVersionInfo(data);
                    }
                }
            }["LoginPage.useEffect"]).catch({
                "LoginPage.useEffect": (err)=>console.error('Failed to load version info:', err)
            }["LoginPage.useEffect"]);
        }
    }["LoginPage.useEffect"], []);
    // Check for error/message query parameters from middleware redirect
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LoginPage.useEffect": ()=>{
            const params = new URLSearchParams(window.location.search);
            const errorParam = params.get('error');
            const messageParam = params.get('message');
            if (errorParam && messageParam) {
                setError(messageParam);
                // Clean up URL
                window.history.replaceState({}, '', '/');
            }
        }
    }["LoginPage.useEffect"], []);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setError(null);
        setInfo(null);
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        if (!trimmedEmail || !trimmedPassword) {
            setError('Bitte E-Mail und Passwort eingeben.');
            return;
        }
        setLoading(true);
        try {
            if (mode === 'signup') {
                const { error: signUpError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$public$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabasePublic__as__supabase$3e$__["supabase"].auth.signUp({
                    email: trimmedEmail,
                    password: trimmedPassword
                });
                if (signUpError) throw signUpError;
                // Erfolgsmeldung für Signup
                setInfo('Ihr Konto wurde angelegt. Bitte prüfen Sie Ihre E-Mails, um Ihre Adresse zu bestätigen.');
                return; // kein sofortiger Login → User soll Mail bestätigen
            } else {
                const { error: signInError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$public$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabasePublic__as__supabase$3e$__["supabase"].auth.signInWithPassword({
                    email: trimmedEmail,
                    password: trimmedPassword
                });
                if (signInError) throw signInError;
            }
            // Ensure the server-side cookie session exists before any SSR pages run.
            await syncServerSession();
            // aktuellen User holen
            const { data: { user }, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$public$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabasePublic__as__supabase$3e$__["supabase"].auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('Kein Benutzerprofil gefunden.');
            // Resolve role from auth metadata (metadata-only; no DB/RLS dependency)
            const resolved = await resolveRole();
            if (resolved.kind === 'unauthenticated') {
                setError('Bitte einloggen.');
                return;
            }
            const role = resolved.kind === 'fallback_patient' ? 'patient' : resolved.value.role;
            const target = await resolvePostLoginRedirect(role);
            if (!target) {
                setError('Bitte einloggen.');
                return;
            }
            router.replace(target);
        } catch (err) {
            console.error(err);
            const error = err;
            const message = error?.message ?? error?.error_description ?? 'Es ist ein unerwarteter Fehler aufgetreten.';
            setError(message);
        } finally{
            setLoading(false);
        }
    };
    const canSubmit = email.trim() !== '' && password.trim() !== '' && !loading;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 py-10 transition-colors duration-150 relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 right-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeToggle"], {
                    size: "md"
                }, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 279,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 278,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full max-w-5xl flex flex-col md:flex-row items-stretch gap-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full md:w-[420px] rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur p-8 shadow-lg transition-colors duration-150",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                className: "text-4xl sm:text-5xl font-bold tracking-tight text-sky-600 dark:text-sky-400",
                                                children: "RHYTHM"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 287,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100",
                                                children: "Rhythmologicum Connect"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 288,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 286,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-slate-600 dark:text-slate-300 leading-relaxed",
                                        children: "Willkommen! Dieser Bereich dient dem sicheren Zugang zu Ihrem persönlichen Stress- & Resilienz-Programm."
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 292,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-slate-600 dark:text-slate-300 leading-relaxed",
                                        children: "Ihre Angaben werden vertraulich behandelt und ausschließlich zur Durchführung Ihrer Stress- & Resilienz-Analyse genutzt."
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 296,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "/datenschutz",
                                        className: "inline-flex text-sm font-medium text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300",
                                        children: "Datenschutz & Datennutzung"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 300,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 285,
                                columnNumber: 11
                            }, this),
                            versionInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            "Version: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono",
                                                children: versionInfo.commitHashShort
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 310,
                                                columnNumber: 26
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 309,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: new Date(versionInfo.commitDate).toLocaleString('de-DE', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 312,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 308,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 284,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 rounded-3xl bg-white dark:bg-slate-800 p-8 shadow-lg transition-colors duration-150",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-6 grid grid-cols-2 rounded-full bg-slate-100 dark:bg-slate-700 p-1 text-sm font-medium",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setMode('login'),
                                        className: `rounded-full py-2 transition ${mode === 'login' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`,
                                        children: "Einloggen"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 329,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setMode('signup'),
                                        className: `rounded-full py-2 transition ${mode === 'signup' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`,
                                        children: "Registrieren"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 340,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 328,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: handleSubmit,
                                className: "space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "email",
                                                className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1",
                                                children: "E-Mail"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 357,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                id: "email",
                                                type: "email",
                                                required: true,
                                                autoComplete: "email",
                                                value: email,
                                                onChange: (e)=>setEmail(e.target.value),
                                                inputSize: "md"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 358,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 356,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "password",
                                                className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1",
                                                children: "Passwort"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 371,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$Input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                id: "password",
                                                type: "password",
                                                required: true,
                                                minLength: 6,
                                                autoComplete: mode === 'login' ? 'current-password' : 'new-password',
                                                value: password,
                                                onChange: (e)=>setPassword(e.target.value),
                                                inputSize: "md",
                                                helperText: "Mindestens 6 Zeichen."
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 372,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 370,
                                        columnNumber: 13
                                    }, this),
                                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2",
                                        children: error
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 387,
                                        columnNumber: 15
                                    }, this),
                                    info && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2",
                                        children: info
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 394,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "submit",
                                        disabled: !canSubmit,
                                        className: "w-full rounded-xl bg-sky-600 dark:bg-sky-500 text-white px-4 py-2 font-semibold shadow-sm hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-60 transition",
                                        children: loading ? 'Bitte warten…' : mode === 'signup' ? 'Konto anlegen' : 'Einloggen'
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 400,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 354,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 326,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 282,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 276,
        columnNumber: 5
    }, this);
}
_s(LoginPage, "wp+x35scXgO3+anbVvWvr6ITu1E=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = LoginPage;
var _c;
__turbopack_context__.k.register(_c, "LoginPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_d6cda9c4._.js.map