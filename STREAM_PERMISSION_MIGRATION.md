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

- [x] **`create-stream-permission-form-schema.ts`** - ✅ Added optional fields:
  - `recipientManager?: SS58Address`
  - `weightSetter?: SS58Address`
- [x] **Create new form components:** - ✅ Successfully implemented
  - `recipient-manager-field.tsx`
  - `weight-setter-field.tsx`
- [x] **Update form utils** - ✅ Handle new optional parameters with conditional inclusion
- [x] **Form integration** - ✅ New fields added to CreateStreamPermissionForm
- [x] **Type safety** - ✅ All TypeScript compilation errors resolved
- [x] **Code quality** - ✅ ESLint passes with no warnings

## 🔧 Logic & Data Handling (High Priority)

### 6. **Multi-Recipient Form Support**

**Files to update:**

- [x] **`recipients-field.tsx`** - ✅ DONE - Multiple recipient support complete in both create and edit forms
- [x] **Form validation** - ✅ DONE - Weight distribution validation working with `createRecipientWeightValidator`
- [ ] **`edit-permission-utils.ts:19,22,34-35`** - ❌ NEEDS WORK - Still uses "emission" terminology, should be "stream"
- [x] **Permission display components** - ✅ DONE - Multi-recipient display completed in hypergraph components

### 7. **Permission Type Detection**

**Files to update:**

- [ ] **`edit-permission-utils.ts:19,22,34-35`** - ❌ NEEDS WORK - Change `"emission"` to `"stream"` in type definitions and logic
- [ ] **`permission-type-info.tsx:10,36`** - ❌ NEEDS WORK - Interface and conditional logic updates for "stream" terminology

### 8. **Graph Visualization Updates**

**Files to update:**

- [x] **`force-graph-constants.ts`** - ✅ DONE - Color schemes and node types already clean
- [x] **`force-graph-utils.ts`** - ✅ DONE - Multi-recipient permissions fully implemented
- [x] **`node-color-legend-dropdown.tsx`** - ✅ DONE - "Emission Permission" updated to "Stream Permission"
- [ ] **`permission-graph-types.ts:29`** - ❌ NEEDS WORK - Update `permissionType: "emission" | "capability"` to use "stream"

## 🗄️ Data & Integration (Lower Priority)

### 9. **Hook Updates**

- [x] **`use-multiple-account-streams.ts`** - ✅ DONE - New stream-specific hook implemented
- [x] **`use-tokens-per-week.ts`** - ✅ DONE - No emission references in user-facing content
- [x] **`use-can-create-signal.ts`** - ✅ DONE - Uses appropriate backend data structure references

### 10. **Utility Functions**

- [ ] **`calculate-emission-value.ts`** - ❌ NEEDS WORK - Rename file and functions to "stream" terminology
- [x] **Permission selector logic** - ✅ DONE - Multi-recipient handling completed in `permission-selector.tsx`

## ✅ **MIGRATION STATUS: ~85% COMPLETE**

### **🎉 Completed Sections:**

- **✅ Critical Issues (Sections 1-2)** - Hypergraph components and form API calls working
- **✅ Terminology Updates (Sections 3-4)** - Complete directory migration and UI text updates
- **✅ New Form Fields (Section 5)** - Optional recipientManager and weightSetter fields added
- **✅ Core Multi-Recipient Support (Section 6)** - Form components and validation working
- **✅ Graph Visualization (Section 8)** - Multi-recipient display and legend updates complete
- **✅ Most Hook Updates (Section 9)** - Stream-specific hooks implemented

### **⚠️ Remaining Work (High Priority):**

1. **`edit-permission-utils.ts`** - Lines 19,22,34-35: Change "emission" → "stream" terminology
2. **`permission-type-info.tsx`** - Lines 10,36: Update interface and logic for "stream"
3. **`permission-graph-types.ts`** - Line 29: Update type definition to use "stream"
4. **`calculate-emission-value.ts`** - Rename file and functions to use "stream" terminology

### **🔄 Optional Cleanup:**

- Consider deprecating `use-multiple-account-emissions.ts` in favor of streams version

## 📋 Original Implementation Order _(Reference)_

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
