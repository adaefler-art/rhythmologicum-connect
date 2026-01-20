(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
"[project]/apps/rhythm-patient-ui/app/patient/error.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PatientError
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
function PatientError({ error, reset }) {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PatientError.useEffect": ()=>{
            // Log the error
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logging$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logError"])('Patient route error', {
                type: 'ui_error',
                area: 'patient'
            }, error);
        }
    }["PatientError.useEffect"], [
        error
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full min-h-screen flex items-center justify-center bg-white px-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ui$2f$ErrorState$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ErrorState"], {
            title: "Ein Fehler ist aufgetreten",
            message: "Beim Laden der Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            onRetry: reset,
            centered: true
        }, void 0, false, {
            fileName: "[project]/apps/rhythm-patient-ui/app/patient/error.tsx",
            lineNumber: 27,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/error.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
_s(PatientError, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = PatientError;
var _c;
__turbopack_context__.k.register(_c, "PatientError");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_31f1d3f0._.js.map