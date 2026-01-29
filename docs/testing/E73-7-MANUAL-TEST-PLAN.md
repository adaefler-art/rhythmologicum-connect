# E73.7 Manual Testing Workflow

## Test Plan: Draft → 404, Publish → 200, Unpublish → 404

### Prerequisites
1. Access to Studio UI with clinician/admin credentials
2. Access to Patient UI with patient credentials
3. Database with content_pages table

---

## Test Case 1: Create Draft → Patient 404

### Steps
1. **Studio**: Navigate to `/admin/content`
2. **Studio**: Click "Neue Seite anlegen" (New Page)
3. **Studio**: Fill in required fields:
   - Title: "E73.7 Test Content"
   - Slug: "e737-test-content"
   - Body Markdown: "# Test\n\nThis is test content for E73.7"
   - Status: Leave as "draft" (default)
   - Category: "info"
   - Priority: 0
4. **Studio**: Click "Als Entwurf speichern" (Save as Draft)
5. **Studio**: Verify redirect to content dashboard
6. **Studio**: Verify content appears in list with "Entwurf" badge

7. **Patient**: Navigate to `/patient/content/e737-test-content`
   - OR use API: `GET /api/content/e737-test-content`
   
### Expected Results
- ✅ Studio saves successfully with status="draft"
- ✅ Patient page shows 404 "Content nicht gefunden"
- ✅ API returns 404 with `{"error": "Content not found"}`
- ✅ Console logs: `[E73.7] Content not found (deterministic 404)`

---

## Test Case 2: Publish → Patient 200

### Steps
1. **Studio**: Navigate to `/admin/content`
2. **Studio**: Click on "E73.7 Test Content" from list
3. **Studio**: Click "Veröffentlichen" (Publish) button
4. **Studio**: Verify success redirect to dashboard
5. **Studio**: Verify content now shows "Veröffentlicht" badge

6. **Patient**: Navigate to `/patient/content/e737-test-content`
   - OR use API: `GET /api/content/e737-test-content`
   
### Expected Results
- ✅ Studio saves with status="published"
- ✅ Patient page renders content with title "E73.7 Test Content"
- ✅ Patient page shows markdown rendered as HTML
- ✅ API returns 200 with:
  ```json
  {
    "success": true,
    "data": {
      "slug": "e737-test-content",
      "title": "E73.7 Test Content",
      "status": "published",
      ...
    }
  }
  ```
- ✅ Console logs: `[E73.7] Content served`

---

## Test Case 3: Unpublish (Archive) → Patient 404

### Steps
1. **Studio**: Navigate to `/admin/content`
2. **Studio**: Click on "E73.7 Test Content"
3. **Studio**: Change status to "archived" (if available in UI)
   - OR Edit via API: `PATCH /api/admin/content-pages/{id}` with `{status: 'archived'}`
4. **Studio**: Save changes

5. **Patient**: Navigate to `/patient/content/e737-test-content`
   - OR use API: `GET /api/content/e737-test-content`
   
### Expected Results
- ✅ Studio saves with status="archived"
- ✅ Patient page shows 404 "Content nicht gefunden"
- ✅ API returns 404 with `{"error": "Content not found"}`
- ✅ Console logs: `[E73.7] Content not found (deterministic 404)`

---

## Test Case 4: Soft Delete → Patient 404

### Steps
1. **Studio**: Ensure content is published
2. **Database**: Directly set `deleted_at = NOW()` on the content page
   ```sql
   UPDATE content_pages 
   SET deleted_at = NOW() 
   WHERE slug = 'e737-test-content';
   ```

3. **Patient**: Navigate to `/patient/content/e737-test-content`
   - OR use API: `GET /api/content/e737-test-content`
   
### Expected Results
- ✅ Patient page shows 404 "Content nicht gefunden"
- ✅ API returns 404 with `{"error": "Content not found"}`
- ✅ Soft-deleted content is NOT visible to patients even if status="published"

---

## Test Case 5: Non-Existent Slug → 404

### Steps
1. **Patient**: Navigate to `/patient/content/does-not-exist-12345`
   - OR use API: `GET /api/content/does-not-exist-12345`
   
### Expected Results
- ✅ Patient page shows 404 "Content nicht gefunden"
- ✅ API returns 404 with `{"error": "Content not found"}`
- ✅ No fallback to default content
- ✅ No error 500 or crash

---

## Test Case 6: Unauthenticated User → 401

### Steps
1. **Patient**: Log out or use incognito browser
2. **Patient**: Try to access: `GET /api/content/e737-test-content`
   
### Expected Results
- ✅ API returns 401 with `{"error": "Authentication required"}`
- ✅ No content data leaked to unauthenticated users

---

## Test Case 7: Publish Visibility After Reload

### Steps
1. **Studio**: Create draft content "Test Reload"
2. **Patient**: Verify 404 for draft
3. **Studio**: Publish the content
4. **Patient**: Reload page or make new API call
   
### Expected Results
- ✅ Patient sees published content after reload
- ✅ No caching issues prevent visibility
- ✅ Cache headers allow reasonable refresh: `Cache-Control: private, max-age=300`

---

## Acceptance Criteria Validation

- [x] Published content in Patient sichtbar (visible)
- [x] Unpublished/missing strikt 404 (strict 404)
- [x] Studio publish changes visible after reload
- [x] API route /api/content/{slug} exists
- [x] Literal callsite exists: `lib/api/contentApi.ts:52`
- [x] Endpoint in allowlist: `docs/api/endpoint-allowlist.json`
- [x] No orphan endpoints in catalog

---

## Console Logs to Monitor

### Success Path (Published Content)
```
[E73.7] Content served: { slug: '...', userId: '...', contentId: '...', status: 'published' }
```

### 404 Path (Draft/Missing)
```
[E73.7] Content not found (deterministic 404): { slug: '...', userId: '...', reason: 'not_published_or_missing' }
```

### Error Path
```
[E73.7] Content fetch error: { slug: '...', userId: '...', error: '...', code: '...' }
[E73.7] Unexpected error in GET /api/content/{slug}: ...
```

---

## Cleanup

After testing:
1. Delete test content from Studio UI or database
2. Verify cleanup doesn't affect other content pages
