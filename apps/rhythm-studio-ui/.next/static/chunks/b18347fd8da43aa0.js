(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,67488,e=>{"use strict";var t=e.i(18050),r=e.i(71645);e.i(180);var s=e.i(53012);let a=(0,r.forwardRef)(({variant:e="primary",size:r="md",fullWidth:a=!1,icon:d,loading:i=!1,disabled:l=!1,className:n="",children:o,type:c="button",onClick:m,onMouseDown:x,onMouseUp:b,onTouchStart:g,onTouchEnd:h,onKeyDown:k,onKeyUp:u,onFocus:p,onBlur:v,...f},y)=>{let w={sm:{padding:"0.5rem 1rem",fontSize:"0.875rem",minHeight:"36px"},md:{padding:"0.625rem 1.5rem",fontSize:"1rem",minHeight:s.componentTokens.navigationButton.minHeight},lg:{padding:"0.875rem 2rem",fontSize:"1.125rem",minHeight:"56px"}},j={primary:`
        bg-sky-600 dark:bg-sky-500 text-white 
        hover:bg-sky-700 dark:hover:bg-sky-600
        active:bg-sky-800 dark:active:bg-sky-700
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400
        shadow-md hover:shadow-lg
      `,secondary:`
        bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100
        hover:bg-slate-200 dark:hover:bg-slate-600
        active:bg-slate-300 dark:active:bg-slate-500
        disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600
        border-2 border-slate-200 dark:border-slate-600
      `,outline:`
        bg-transparent text-sky-600 dark:text-sky-400
        border-2 border-sky-600 dark:border-sky-500
        hover:bg-sky-50 dark:hover:bg-sky-900/30
        active:bg-sky-100 dark:active:bg-sky-900/50
        disabled:border-slate-300 dark:disabled:border-slate-600 disabled:text-slate-400 dark:disabled:text-slate-500
      `,ghost:`
        bg-transparent text-slate-700 dark:text-slate-300
        hover:bg-slate-100 dark:hover:bg-slate-700
        active:bg-slate-200 dark:active:bg-slate-600
        disabled:text-slate-400 dark:disabled:text-slate-500
      `,destructive:`
        bg-red-600 dark:bg-red-500 text-white
        hover:bg-red-700 dark:hover:bg-red-600
        active:bg-red-800 dark:active:bg-red-700
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400
        shadow-md hover:shadow-lg
      `,danger:`
        bg-red-600 dark:bg-red-500 text-white
        hover:bg-red-700 dark:hover:bg-red-600
        active:bg-red-800 dark:active:bg-red-700
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400
        shadow-md hover:shadow-lg
      `},N=w[r],S=j[e],$=`
      inline-flex items-center justify-center gap-2
      font-semibold rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-60
      active:scale-[0.98]
      touch-manipulation
      ${a?"w-full":""}
      ${S}
      ${n}
    `;return(0,t.jsxs)("button",{ref:y,type:c,disabled:l||i,className:$,style:{padding:N.padding,fontSize:N.fontSize,minHeight:N.minHeight},onClick:m,onMouseDown:x,onMouseUp:b,onTouchStart:g,onTouchEnd:h,onKeyDown:k,onKeyUp:u,onFocus:p,onBlur:v,"aria-busy":i,...f,children:[i&&(0,t.jsxs)("svg",{className:"animate-spin h-4 w-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","aria-hidden":"true",children:[(0,t.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,t.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),!i&&d&&(0,t.jsx)("span",{className:"flex-shrink-0",children:d}),(0,t.jsx)("span",{children:o})]})});a.displayName="Button",e.s(["Button",0,a])},12911,e=>{"use strict";var t=e.i(18050);e.i(180);var r=e.i(53012);function s({header:e,footer:s,children:a,padding:d="lg",radius:i="xl",shadow:l="sm",interactive:n=!1,border:o=!0,onClick:c,className:m="",...x}){let b={none:"0",sm:r.spacing.md,md:r.spacing.lg,lg:r.spacing.xl},g={none:r.shadows.none,sm:r.shadows.sm,md:r.shadows.md,lg:r.shadows.lg},h={md:r.radii.md,lg:r.radii.lg,xl:r.radii.xl,"2xl":r.radii["2xl"]},k=b[d],u=g[l],p=h[i],v=`bg-white dark:bg-slate-800 ${o?"border border-slate-200 dark:border-slate-700":""} transition-colors duration-150`,f=n?"cursor-pointer hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg active:scale-[0.99] transition-all duration-200":"";return c?(0,t.jsxs)("button",{type:"button",className:`${v} ${f} ${m}`,style:{borderRadius:p,boxShadow:u},onClick:c,onKeyDown:e=>{("Enter"===e.key||" "===e.key)&&(e.preventDefault(),c())},children:[e&&(0,t.jsx)("div",{className:"border-b border-slate-200 dark:border-slate-700",style:{padding:k},children:e}),(0,t.jsx)("div",{style:{padding:k},children:a}),s&&(0,t.jsx)("div",{className:"border-t border-slate-200 dark:border-slate-700",style:{padding:k},children:s})]}):(0,t.jsxs)("div",{className:`${v} ${f} ${m}`,style:{borderRadius:p,boxShadow:u},...x,children:[e&&(0,t.jsx)("div",{className:"border-b border-slate-200 dark:border-slate-700",style:{padding:k},children:e}),(0,t.jsx)("div",{style:{padding:k},children:a}),s&&(0,t.jsx)("div",{className:"border-t border-slate-200 dark:border-slate-700",style:{padding:k},children:s})]})}e.s(["Card",()=>s])},84584,52220,e=>{"use strict";var t=e.i(18050);function r({size:e="md",text:r,centered:s=!1,className:a="",...d}){let i={sm:{spinner:"h-4 w-4",text:"text-xs"},md:{spinner:"h-8 w-8",text:"text-sm"},lg:{spinner:"h-12 w-12",text:"text-base"},xl:{spinner:"h-16 w-16",text:"text-lg"}}[e],l=`
    ${s?"flex flex-col items-center justify-center min-h-[200px]":"inline-flex flex-col items-center"}
    ${a}
  `;return(0,t.jsxs)("div",{className:l,role:"status","aria-live":"polite",...d,children:[(0,t.jsxs)("svg",{className:`animate-spin text-sky-600 ${i.spinner}`,xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","aria-hidden":"true",children:[(0,t.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,t.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),r&&(0,t.jsx)("p",{className:`mt-3 text-slate-600 font-medium ${i.text}`,children:r}),(0,t.jsx)("span",{className:"sr-only",children:r||"Laden..."})]})}e.s(["LoadingSpinner",()=>r],84584);var s=e.i(67488);function a({title:e="Ein Fehler ist aufgetreten",message:r="Bitte versuchen Sie es später erneut.",onRetry:a,retryText:d="Erneut versuchen",centered:i=!1,icon:l,className:n="",...o}){let c=`
    ${i?"flex flex-col items-center justify-center min-h-[300px] text-center":"flex flex-col items-center text-center"}
    ${n}
  `,m=(0,t.jsx)("svg",{className:"h-16 w-16 text-red-500",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","aria-hidden":"true",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"})});return(0,t.jsxs)("div",{className:c,role:"alert","aria-live":"assertive",...o,children:[(0,t.jsx)("div",{className:"mb-4",children:l||m}),(0,t.jsx)("h2",{className:"text-xl md:text-2xl font-semibold text-slate-900 mb-2",children:e}),"string"==typeof r?(0,t.jsx)("p",{className:"text-sm md:text-base text-slate-600 mb-6 max-w-md",children:r}):(0,t.jsx)("div",{className:"text-sm md:text-base text-slate-600 mb-6 max-w-md",children:r}),a&&(0,t.jsx)(s.Button,{variant:"primary",onClick:a,icon:(0,t.jsx)("svg",{className:"h-4 w-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"})}),children:d})]})}e.s(["ErrorState",()=>a],52220)},32796,76107,e=>{"use strict";var t=e.i(18050);function r({variant:e="default",size:r="md",children:s,className:a=""}){return(0,t.jsx)("span",{className:`
        inline-flex items-center justify-center
        rounded-full border font-medium
        whitespace-nowrap
        ${{default:"bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600",success:"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",warning:"bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-700",danger:"bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700",info:"bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border-sky-200 dark:border-sky-700",secondary:"bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"}[e]}
        ${{sm:"px-2 py-0.5 text-xs",md:"px-3 py-1 text-sm"}[r]}
        ${a}
      `,children:s})}e.s(["Badge",()=>r],32796),e.i(180);var s=e.i(53012);function a({title:e,description:r,actions:a,className:d=""}){return(0,t.jsxs)("div",{className:`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${d}`,style:{marginBottom:s.spacing.xl},children:[(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsx)("h1",{className:"text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2",children:e}),r&&(0,t.jsx)("p",{className:"text-base text-slate-600 dark:text-slate-300",children:r})]}),a&&(0,t.jsx)("div",{className:"flex flex-wrap gap-3 items-start shrink-0",children:a})]})}e.s(["PageHeader",()=>a],76107)},53367,e=>{"use strict";let t=new Set(["authorization","cookie","set-cookie","token","accessToken","refreshToken","password","secret","body","request","headers"]);function r(e,r,s){var a="error";let d={timestamp:new Date().toISOString(),level:a,message:e};r&&(d.context=r),s&&(d.error=s instanceof Error?{message:s.message,stack:s.stack,name:s.name,digest:"string"==typeof s.digest?s.digest:void 0,cause:function(e){if(null!=e){if(e instanceof Error)return e.message;if("string"==typeof e)return e;try{return JSON.stringify(e,(e,r)=>t.has(e)?"[REDACTED]":r)}catch{return}}}(s.cause)}:{message:"string"==typeof s?s:JSON.stringify(s)});let i=JSON.stringify(d);switch(a){case"error":console.error(i);break;case"warn":console.warn(i)}}e.s(["logError",()=>r])},94166,e=>{"use strict";var t=e.i(18050),r=e.i(22016);e.i(47446);var s=e.i(52220),a=e.i(71645),d=e.i(53367);function i({error:e,reset:i}){return(0,a.useEffect)(()=>{(0,d.logError)("Admin route error",{type:"ui_error",area:"admin"},e)},[e]),(0,t.jsx)("div",{className:"p-6",children:(0,t.jsxs)("div",{className:"rounded-lg border border-slate-200 bg-white p-6",children:[(0,t.jsx)(s.ErrorState,{title:"Ein Fehler ist aufgetreten",message:"Beim Laden der Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",onRetry:i}),(0,t.jsx)("div",{className:"mt-4",children:(0,t.jsx)(r.default,{href:"/admin",className:"inline-flex gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 transition",children:"Zurück zur Übersicht"})})]})})}e.s(["default",()=>i])}]);

//# sourceMappingURL=ae6dfff7fd879d30.js.map