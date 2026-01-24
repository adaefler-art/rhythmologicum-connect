module.exports=[8184,a=>{"use strict";var b=a.i(87924),c=a.i(72131);a.i(14240);var d=a.i(76756);let e=(0,c.forwardRef)(({variant:a="primary",size:c="md",fullWidth:e=!1,icon:f,loading:g=!1,disabled:h=!1,className:i="",children:j,type:k="button",onClick:l,onMouseDown:m,onMouseUp:n,onTouchStart:o,onTouchEnd:p,onKeyDown:q,onKeyUp:r,onFocus:s,onBlur:t,...u},v)=>{let w={sm:{padding:"0.5rem 1rem",fontSize:"0.875rem",minHeight:"36px"},md:{padding:"0.625rem 1.5rem",fontSize:"1rem",minHeight:d.componentTokens.navigationButton.minHeight},lg:{padding:"0.875rem 2rem",fontSize:"1.125rem",minHeight:"56px"}},x={primary:`
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
      `},y=w[c],z=x[a],A=`
      inline-flex items-center justify-center gap-2
      font-semibold rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-60
      active:scale-[0.98]
      touch-manipulation
      ${e?"w-full":""}
      ${z}
      ${i}
    `;return(0,b.jsxs)("button",{ref:v,type:k,disabled:h||g,className:A,style:{padding:y.padding,fontSize:y.fontSize,minHeight:y.minHeight},onClick:l,onMouseDown:m,onMouseUp:n,onTouchStart:o,onTouchEnd:p,onKeyDown:q,onKeyUp:r,onFocus:s,onBlur:t,"aria-busy":g,...u,children:[g&&(0,b.jsxs)("svg",{className:"animate-spin h-4 w-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","aria-hidden":"true",children:[(0,b.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,b.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),!g&&f&&(0,b.jsx)("span",{className:"flex-shrink-0",children:f}),(0,b.jsx)("span",{children:j})]})});e.displayName="Button",a.s(["Button",0,e])},63548,a=>{"use strict";var b=a.i(87924);a.i(14240);var c=a.i(76756);function d({header:a,footer:d,children:e,padding:f="lg",radius:g="xl",shadow:h="sm",interactive:i=!1,border:j=!0,onClick:k,className:l="",...m}){let n={none:"0",sm:c.spacing.md,md:c.spacing.lg,lg:c.spacing.xl},o={none:c.shadows.none,sm:c.shadows.sm,md:c.shadows.md,lg:c.shadows.lg},p={md:c.radii.md,lg:c.radii.lg,xl:c.radii.xl,"2xl":c.radii["2xl"]},q=n[f],r=o[h],s=p[g],t=`bg-white dark:bg-slate-800 ${j?"border border-slate-200 dark:border-slate-700":""} transition-colors duration-150`,u=i?"cursor-pointer hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg active:scale-[0.99] transition-all duration-200":"";return k?(0,b.jsxs)("button",{type:"button",className:`${t} ${u} ${l}`,style:{borderRadius:s,boxShadow:r},onClick:k,onKeyDown:a=>{("Enter"===a.key||" "===a.key)&&(a.preventDefault(),k())},children:[a&&(0,b.jsx)("div",{className:"border-b border-slate-200 dark:border-slate-700",style:{padding:q},children:a}),(0,b.jsx)("div",{style:{padding:q},children:e}),d&&(0,b.jsx)("div",{className:"border-t border-slate-200 dark:border-slate-700",style:{padding:q},children:d})]}):(0,b.jsxs)("div",{className:`${t} ${u} ${l}`,style:{borderRadius:s,boxShadow:r},...m,children:[a&&(0,b.jsx)("div",{className:"border-b border-slate-200 dark:border-slate-700",style:{padding:q},children:a}),(0,b.jsx)("div",{style:{padding:q},children:e}),d&&(0,b.jsx)("div",{className:"border-t border-slate-200 dark:border-slate-700",style:{padding:q},children:d})]})}a.s(["Card",()=>d])},86071,63156,a=>{"use strict";var b=a.i(87924);function c({size:a="md",text:c,centered:d=!1,className:e="",...f}){let g={sm:{spinner:"h-4 w-4",text:"text-xs"},md:{spinner:"h-8 w-8",text:"text-sm"},lg:{spinner:"h-12 w-12",text:"text-base"},xl:{spinner:"h-16 w-16",text:"text-lg"}}[a],h=`
    ${d?"flex flex-col items-center justify-center min-h-[200px]":"inline-flex flex-col items-center"}
    ${e}
  `;return(0,b.jsxs)("div",{className:h,role:"status","aria-live":"polite",...f,children:[(0,b.jsxs)("svg",{className:`animate-spin text-sky-600 ${g.spinner}`,xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24","aria-hidden":"true",children:[(0,b.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,b.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),c&&(0,b.jsx)("p",{className:`mt-3 text-slate-600 font-medium ${g.text}`,children:c}),(0,b.jsx)("span",{className:"sr-only",children:c||"Laden..."})]})}a.s(["LoadingSpinner",()=>c],86071);var d=a.i(8184);function e({title:a="Ein Fehler ist aufgetreten",message:c="Bitte versuchen Sie es später erneut.",onRetry:e,retryText:f="Erneut versuchen",centered:g=!1,icon:h,className:i="",...j}){let k=`
    ${g?"flex flex-col items-center justify-center min-h-[300px] text-center":"flex flex-col items-center text-center"}
    ${i}
  `,l=(0,b.jsx)("svg",{className:"h-16 w-16 text-red-500",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","aria-hidden":"true",children:(0,b.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"})});return(0,b.jsxs)("div",{className:k,role:"alert","aria-live":"assertive",...j,children:[(0,b.jsx)("div",{className:"mb-4",children:h||l}),(0,b.jsx)("h2",{className:"text-xl md:text-2xl font-semibold text-slate-900 mb-2",children:a}),"string"==typeof c?(0,b.jsx)("p",{className:"text-sm md:text-base text-slate-600 mb-6 max-w-md",children:c}):(0,b.jsx)("div",{className:"text-sm md:text-base text-slate-600 mb-6 max-w-md",children:c}),e&&(0,b.jsx)(d.Button,{variant:"primary",onClick:e,icon:(0,b.jsx)("svg",{className:"h-4 w-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,b.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"})}),children:f})]})}a.s(["ErrorState",()=>e],63156)},3706,24415,a=>{"use strict";var b=a.i(87924);function c({variant:a="default",size:c="md",children:d,className:e=""}){return(0,b.jsx)("span",{className:`
        inline-flex items-center justify-center
        rounded-full border font-medium
        whitespace-nowrap
        ${{default:"bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600",success:"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",warning:"bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-700",danger:"bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700",info:"bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border-sky-200 dark:border-sky-700",secondary:"bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"}[a]}
        ${{sm:"px-2 py-0.5 text-xs",md:"px-3 py-1 text-sm"}[c]}
        ${e}
      `,children:d})}a.s(["Badge",()=>c],3706),a.i(14240);var d=a.i(76756);function e({title:a,description:c,actions:e,className:f=""}){return(0,b.jsxs)("div",{className:`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${f}`,style:{marginBottom:d.spacing.xl},children:[(0,b.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,b.jsx)("h1",{className:"text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2",children:a}),c&&(0,b.jsx)("p",{className:"text-base text-slate-600 dark:text-slate-300",children:c})]}),e&&(0,b.jsx)("div",{className:"flex flex-wrap gap-3 items-start shrink-0",children:e})]})}a.s(["PageHeader",()=>e],24415)},69012,a=>{"use strict";let b=(0,a.i(70106).default)("funnel",[["path",{d:"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",key:"sc7q7i"}]]);a.s(["Filter",()=>b],69012)},15618,a=>{"use strict";let b=(0,a.i(70106).default)("plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);a.s(["Plus",()=>b],15618)},69520,a=>{"use strict";let b=(0,a.i(70106).default)("refresh-cw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);a.s(["RefreshCw",()=>b],69520)},83497,a=>{"use strict";let b=(0,a.i(70106).default)("package",[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]]);a.s(["Package",()=>b],83497)},23312,a=>{"use strict";let b=(0,a.i(70106).default)("bell",[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]]);a.s(["Bell",()=>b],23312)}];

//# sourceMappingURL=_e86f1594._.js.map