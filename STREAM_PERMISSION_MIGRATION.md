# Torus Portal Migration: Emission → Stream Permissions

## 🚨 Critical Issues (Fix First)

### 1. **Hypergraph Components - Multi-Recipient Support**

**Priority: CRITICAL** - Prevents display of stream permissions

- [x] **`graph-sheet-details-link-buttons.tsx:42-47`** - Fixed to handle multiple recipients
  - Updated interface to accept `recipients?: string[] | string | null`
  - Shows single recipient for Namespace/Curator, "X Recipients" for Stream permissions
  - Moved component outside render to fix React warnings
- [x] **`graph-sheet-details-card.tsx`** - ✅ Fixed to extract recipients by permission type
  - Added `extractRecipients()` helper function to handle Stream vs Namespace permissions
  - Updated both `GraphSheetDetailsLinkButtons` calls to use `recipients` parameter
- [x] **`permission-graph-command.tsx`** - ✅ Fixed multi-recipient filtering and terminology
  - Updated emission → stream permission processing
  - Added support for multiple recipients in search/display
  - Shows "X Recipients" for multi-recipient permissions with all names in search
  - Updated command group heading from "Emission" to "Stream" permissions
- [x] **`force-graph-utils.ts`** - ✅ Fixed graph building and capability permission display
  - Fixed capability permissions not appearing due to recipient field location change
  - Updated to use `namespace_permissions.recipient` instead of main `granteeAccountId` for capability permissions
  - Stream permissions continue using existing distribution target structure
  - Both permission types now display correctly in hypergraph

### 2. **Form API Calls - Wrong Function**

**Priority: CRITICAL** - Forms will fail to submit

- [x] **Check for `delegateEmissionPermission` calls** - ✅ Forms already updated to use `delegateStreamPermission`
- [x] **Update function signatures** - ✅ Already using correct parameter order and structure
- [x] **Add missing parameters** - ✅ Forms already handle recipients correctly

## 🔄 Terminology & UI Updates (Medium Priority)

### 3. **Replace "Targets" with "Recipients"**

**Files to update:**

- [x] **`targets-field.tsx`** → ✅ Renamed to `recipients-field.tsx`
- [x] **`create-emission-permission-form-schema.ts:141,154`** - ✅ Changed `targets` to `recipients`
- [x] **`create-emission-permission-form.tsx:50`** - ✅ Updated default values field name
- [x] **`create-emission-permission-form-utils.ts:28-34`** - ✅ Updated transform function
- [x] **`edit-permission-fields/targets-field.tsx`** - ✅ Updated component and logic
- [x] **`edit-permission-schema.ts`** - ✅ Schema field names updated
- [x] **All form labels and UI text** - ✅ "Targets" → "Recipients"

### 4. **Replace "Emission" with "Stream"**

**Directory structure:**

- [x] **`/permissions/create-permission/emission/`** → `/permissions/create-permission/stream/` - ✅ Complete directory migration
- [x] **`create-emission-permission-form*`** → `create-stream-permission-form*` - ✅ All component files renamed
- [x] **`create-emission-fields/`** → `create-stream-fields/` - ✅ Field directory renamed

**Files to rename/update:**

- [x] **UI text updates** - ✅ Updated page titles, navigation, transaction types
- [x] **Permission type display** - ✅ Updated from "Emission" to "Stream" in UI
- [x] **Command group headings** - ✅ Updated permission selector and search
- [x] **Component imports** - ✅ All import paths updated to new structure
- [x] **Route references** - ✅ Sidebar navigation updated to /stream route
- [x] **Type definitions** - ✅ All TypeScript types renamed and updated

### 5. **Add New Form Fields**

**Priority: MEDIUM** - Enhanced functionality

- [ ] **`create-emission-permission-form-schema.ts`** - Add optional fields:
  - `recipientManager?: SS58Address`
  - `weightSetter?: SS58Address`
- [ ] **Create new form components:**
  - `recipient-manager-field.tsx`
  - `weight-setter-field.tsx`
- [ ] **Update form utils** - Handle new optional parameters

## 🔧 Logic & Data Handling (High Priority)

### 6. **Multi-Recipient Form Support**

**Files to update:**

- [ ] **`targets-field.tsx`** - Already supports multiple, just rename
- [ ] **Form validation** - Ensure weight distribution validation works
- [ ] **`edit-permission-utils.ts:49-56`** - Multi-recipient extraction logic
- [ ] **Permission display components** - Show all recipients

### 7. **Permission Type Detection**

**Files to update:**

- [ ] **`edit-permission-utils.ts:19`** - Change `"emission"` to `"stream"`
- [ ] **`edit-permission-utils.ts:22,35`** - Update database field checks
- [ ] **`permission-type-info.tsx`** - Display logic updates

### 8. **Graph Visualization Updates**

**Files to update:**

- [ ] **`force-graph-constants.ts`** - Color schemes, node types
- [ ] **`force-graph-utils.ts`** - Node creation for multi-recipient permissions
- [ ] **`node-color-legend-dropdown.tsx`** - Legend updates
- [ ] **`permission-graph-types.ts`** - Type definitions

## 🗄️ Data & Integration (Lower Priority)

### 9. **Hook Updates**

- [ ] **`use-multiple-account-emissions.ts`** → `use-multiple-account-streams.ts`
- [ ] **`use-tokens-per-week.ts`** - Calculation logic updates
- [ ] **`use-can-create-signal.ts`** - Permission checking logic

### 10. **Utility Functions**

- [ ] **`calculate-emission-value.ts`** → `calculate-stream-value.ts`
- [ ] **Permission selector logic** - Multi-recipient handling

## 📋 Suggested Implementation Order

1. **Fix Critical Hypergraph Issues** (Items 1-2) - Enables basic functionality
2. **Update Form API Calls** - Ensures forms work
3. **Add New Form Fields** (Item 5) - Enhanced UX
4. **Terminology Updates** (Items 3-4) - Consistency
5. **Logic Updates** (Items 6-8) - Full functionality
6. **Data Integration** (Items 9-10) - Polish

## 🔍 Key Technical Changes Needed

- **Multi-recipient handling**: Components expecting single grantee need refactoring
- **Parameter mapping**: `targets` → `recipients`, added `recipientManager`/`weightSetter`
- **Form validation**: Weight distribution across multiple recipients
- **Graph visualization**: Nodes with multiple outbound connections
- **Database queries**: Updated field names and structure

## 📁 Affected File Locations

### Critical Components

```
apps/torus-portal/src/app/(pages)/(permission-graph)/_components/
├── graph-sheet/graph-sheet-details/graph-sheet-details-link-buttons.tsx
├── graph-sheet/graph-sheet-details/graph-sheet-details-card.tsx
├── permission-graph-command.tsx
└── force-graph/force-graph-utils.ts
```

### Forms & Schemas

```
apps/torus-portal/src/app/(pages)/permissions/create-permission/emission/
├── _components/create-emission-permission-form.tsx
├── _components/create-emission-permission-form-schema.ts
├── _components/create-emission-permission-form-utils.ts
└── _components/create-emission-fields/targets-field.tsx

apps/torus-portal/src/app/(pages)/permissions/manage-permission/_components/
├── edit-permission-utils.ts
├── edit-permission-form.tsx
└── edit-permission-fields/targets-field.tsx
```

### Hooks & Utils

```
apps/torus-portal/src/hooks/
├── use-multiple-account-emissions.ts
├── use-tokens-per-week.ts
└── use-can-create-signal.ts

apps/torus-portal/src/utils/
└── calculate-emission-value.ts
```

## 🔄 SDK Changes Reference

### Function Signature Changes

```typescript
// OLD (main branch)
delegateEmissionPermission({
  recipient: string,
  allocation: EmissionAllocation,
  targets: [SS58Address, number][],
  // ...other params
})

// NEW (dev branch)
delegateStreamPermission({
  recipients: [SS58Address, number][], // formerly "targets"
  allocation: StreamAllocation,
  // ...other params
  recipientManager?: SS58Address,     // new
  weightSetter?: SS58Address,         // new
})
```

### Type Changes

- `EmissionContract` → `StreamContract`
- `EmissionAllocation` → `StreamAllocation`
- `queryEmissionPermissions()` → `queryStreamPermissions()`
- `updateEmissionPermission()` → `updateStreamPermission()`

### Schema Changes

- Single `recipient: SS58Address` → `recipients: Map<SS58Address, bigint>`
- Added `recipientManagers: SS58Address[]`
- Added `weightSetters: SS58Address[]`
