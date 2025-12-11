# Performance Testing Guide — E3

This guide provides step-by-step instructions for testing and validating the performance optimizations implemented in E3.

## Quick Start

### 1. Build for Production

```bash
npm run build
npm run start
```

> **Note:** Always test performance with production builds, not development mode. Development mode includes extra debugging overhead.

### 2. Run Lighthouse Audit

1. Open Chrome/Edge DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Configure settings:
   - Mode: "Navigation"
   - Device: "Mobile"
   - Throttling: "Simulated throttling"
   - Categories: Select "Performance"
4. Click "Analyze page load"

**Target URLs to Test:**
- `/patient/funnel/stress-assessment` - Main funnel flow
- `/patient/funnel/stress-assessment/content/intro-stress` - Content page with lazy loading
- `/patient/funnel/stress-assessment/result` - Result page

**Expected Scores:**
- Performance: 85-95 (mobile)
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Total Blocking Time (TBT): < 300ms

### 3. Test Component Re-renders

1. Install React DevTools extension
2. Open DevTools → "Profiler" tab
3. Click "Record"
4. Interact with answer buttons (select different answers)
5. Stop recording
6. Review flame chart for unnecessary re-renders

**What to Look For:**
- MobileAnswerButton should NOT re-render when sibling buttons are clicked
- QuestionCard should only re-render when its own value changes
- Progress bar should only re-render when progress actually changes

### 4. Test Network Performance

1. Open DevTools → "Network" tab
2. Set throttling to "Slow 3G"
3. Reload page and navigate through funnel
4. Check:
   - API response sizes (should be 5-7 KB for funnel definition)
   - Cache headers (look for `Cache-Control` in response headers)
   - Lazy loaded chunks (should see markdown-related chunks load on demand)

## Detailed Testing Scenarios

### Scenario 1: Answer Button Responsiveness

**Steps:**
1. Navigate to any question step in the funnel
2. Open React DevTools Profiler
3. Start recording
4. Click different answer buttons rapidly (5-10 clicks)
5. Stop recording

**Success Criteria:**
- Answer selection feels instant (< 100ms visual feedback)
- No stuttering or lag
- Profiler shows minimal re-renders (only affected components)
- No full-page re-renders

### Scenario 2: Step Navigation Performance

**Steps:**
1. Answer all questions on a step
2. Open Chrome DevTools Performance tab
3. Start recording
4. Click "Weiter →" button
5. Stop recording when next step appears

**Success Criteria:**
- Navigation completes in < 200ms
- No layout shifts (check for red "Layout Shift" markers in Performance timeline)
- Smooth transition animation
- No jank in progress bar update

### Scenario 3: Content Page Lazy Loading

**Steps:**
1. Navigate to funnel intro page (e.g., `/patient/funnel/stress-assessment/intro`)
2. Open DevTools → Network tab
3. Click on an intro/info content link
4. Observe chunk loading

**Success Criteria:**
- Markdown renderer bundle loads only when content page opens
- Suspense fallback displays briefly
- No blocking of main thread during lazy load
- Subsequent content pages reuse the loaded chunk

### Scenario 4: API Caching

**Steps:**
1. Navigate to funnel (first visit)
2. Note the funnel definition API request time
3. Reload the page (within 5 minutes)
4. Check if request is served from cache

**Success Criteria:**
- First request: ~50-200ms (depending on network)
- Subsequent requests: < 10ms (from cache or very fast due to server cache)
- Response headers show `Cache-Control` with appropriate max-age
- Stale-while-revalidate header present

### Scenario 5: Mobile Device Testing

**Real Device Testing:**
1. Deploy to staging/preview environment
2. Test on actual devices:
   - Mid-range Android (e.g., Samsung Galaxy A32, Xiaomi Redmi Note)
   - Mid-range iOS (e.g., iPhone SE 2022, iPhone 11)
3. Use slow/throttled network (can use Chrome Remote Debugging)

**Chrome DevTools Emulation:**
1. Open DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device: "Moto G4" or "Galaxy S5"
4. Set throttling: "Slow 3G"
5. Test funnel navigation

**Success Criteria:**
- Smooth scrolling (60 FPS)
- Instant answer button feedback
- Step transitions feel fluid
- No visual glitches or layout jumps
- Progress bar animates smoothly

## Performance Regression Testing

### Before Deploying Changes

Run these checks before deploying new features:

1. **Bundle Size Check:**
   ```bash
   npm run build
   # Check .next/analyze output or webpack-bundle-analyzer
   ```
   - Ensure JavaScript bundle hasn't grown significantly (< 5% increase)

2. **Component Profiling:**
   - Profile the most complex components (FunnelClient, MobileQuestionCard)
   - Ensure render times haven't increased

3. **Lighthouse CI:**
   ```bash
   # Run Lighthouse in CI/CD
   npx @lhci/cli@latest autorun
   ```

4. **Visual Regression:**
   - Screenshot comparison (manual or automated)
   - Check for layout shifts

### Performance Monitoring in Production

**Key Metrics to Track:**

1. **Real User Monitoring (RUM):**
   - Time to Interactive (TTI)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)
   - Use: Vercel Analytics, Google Analytics 4, or Sentry

2. **API Performance:**
   - Average response time for `/api/funnels/[slug]/definition`
   - Cache hit rate
   - 95th percentile response time

3. **Client-Side Metrics:**
   - JavaScript bundle size (track over time)
   - Number of React component renders per interaction
   - Memory usage (Chrome DevTools Memory profiler)

## Troubleshooting Performance Issues

### Issue: Slow Answer Button Response

**Diagnosis:**
1. Open React DevTools Profiler
2. Record interaction
3. Check for excessive re-renders

**Possible Causes:**
- Missing `memo()` on component
- Unstable callback passed as prop
- Parent component re-rendering unnecessarily

**Solution:**
```typescript
// Add memo
const Component = memo(function Component({ ... }) { ... })

// Stabilize callbacks
const handleClick = useCallback(() => { ... }, [deps])
```

### Issue: Large Bundle Size

**Diagnosis:**
```bash
npm run build
# Check .next/static/chunks/ sizes
```

**Possible Causes:**
- Heavy dependencies imported but not lazy loaded
- Duplicate dependencies (check package-lock.json)
- Large inline data

**Solution:**
- Lazy load heavy components
- Use dynamic imports for route-level code splitting
- Check for duplicate dependencies and dedupe

### Issue: Slow API Responses

**Diagnosis:**
1. Open Network tab
2. Check response times
3. Check payload sizes

**Possible Causes:**
- Over-fetching data (selecting all fields)
- Missing database indexes
- No caching headers

**Solution:**
```typescript
// Use selective queries
.select('id, name, title') // instead of .select('*')

// Add caching
return NextResponse.json(data, {
  headers: { 'Cache-Control': 'public, s-maxage=300' }
})
```

### Issue: Layout Shifts

**Diagnosis:**
1. Run Lighthouse audit
2. Check Cumulative Layout Shift (CLS) score
3. Use DevTools Performance tab to identify shifts

**Possible Causes:**
- Images without dimensions
- Dynamic content without space reservation
- Fonts causing text reflow (FOUT/FOIT)

**Solution:**
- Use Next.js Image component with width/height
- Add skeleton loaders for dynamic content
- Preload critical fonts

## Useful Commands

```bash
# Build and analyze bundle
npm run build

# Run tests
npm run test

# Start production server locally
npm run start

# Run Lighthouse from CLI
npx lighthouse http://localhost:3000/patient/funnel/stress-assessment --view

# Profile React app with production build
NODE_ENV=production npm run dev -- --profile

# Check bundle size
du -sh .next/static/chunks/*
```

## Recommended Tools

### Browser Extensions
- React Developer Tools - Component profiling
- Lighthouse - Performance audits
- Redux DevTools - State debugging (if using Redux)

### Online Tools
- [WebPageTest](https://www.webpagetest.org/) - Real device testing
- [PageSpeed Insights](https://pagespeed.web.dev/) - Google's performance tool
- [GTmetrix](https://gtmetrix.com/) - Performance analysis

### CLI Tools
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --config=lighthouserc.json

# Bundle analyzer
npm install -g webpack-bundle-analyzer
# Next.js has built-in bundle analyzer
```

## Performance Checklist for New Features

When adding new features, check these:

- [ ] Added `memo()` to frequently rendered components
- [ ] Used `useMemo`/`useCallback` for expensive computations
- [ ] Lazy loaded heavy dependencies
- [ ] Added selective field queries to API calls
- [ ] Set appropriate cache headers
- [ ] Tested with React DevTools Profiler
- [ ] Ran Lighthouse audit
- [ ] Tested on slow 3G network
- [ ] Checked bundle size impact
- [ ] No layout shifts introduced

## Resources

- [React DevTools Profiler](https://react.dev/learn/react-developer-tools#profiler)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [E3 Performance Optimization Docs](./E3_PERFORMANCE_OPTIMIZATION.md)
