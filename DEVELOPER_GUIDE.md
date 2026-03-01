# School Management System - Developer Documentation

## 📋 Project Overview

A comprehensive school administration system built with React, TypeScript, and Metronic template covering all aspects of school management from students to staff, academics to finances.

---

## 🏗️ Architecture & Structure

### Directory Structure

```
src/
├── app/
│   ├── modules/              # All feature modules
│   │   ├── academic/         # Academic management (7 pages)
│   │   ├── communication/    # Communication system (4 pages)
│   │   ├── examination/      # Exam management (5 pages)
│   │   ├── fees/             # Fee management (6 pages)
│   │   ├── hostel/           # Hostel management (4 pages)
│   │   ├── inventory/        # Inventory & assets (4 pages)
│   │   ├── library/          # Library system (4 pages)
│   │   ├── payroll/          # HR & Payroll (5 pages)
│   │   ├── reports/          # Reports & analytics (6 pages)
│   │   ├── settings/         # System settings (5 pages)
│   │   ├── staff/            # Staff management (12 pages)
│   │   ├── students/         # Student management (5 pages)
│   │   ├── timetable/        # Timetable management (6 pages)
│   │   └── transport/        # Transport management (5 pages)
│   │
│   ├── routing/
│   │   ├── PrivateRoutes.tsx    # Main routing configuration
│   │   └── RouteConfig.ts       # Centralized route definitions
│   │
│   └── pages/
│       └── dashboard/           # Dashboard page
│
└── _metronic/
    └── layout/
        └── components/
            └── sidebar/
                └── sidebar-menu/
                    └── SidebarMenuMain.tsx  # Sidebar menu structure
```

---

## 🔄 Development Workflow

### 1. Adding a New Module

**Step 1: Create Module Directory**
```bash
mkdir -p src/app/modules/your-module
```

**Step 2: Create Page Component**
```tsx
// src/app/modules/your-module/YourPage.tsx
import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const YourPage: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Your Page Title</h3>
        </div>
        <div className='card-body'>
          {/* Your content here */}
        </div>
      </div>
    </Content>
  </>
)

const YourPageWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Your Page Title</PageTitle>
      <YourPage />
    </>
  )
}

export { YourPageWrapper }
```

**Step 3: Add Route Configuration**
```typescript
// src/app/routing/RouteConfig.ts
export const yourModuleRoutes = {
  yourPage: lazyLoad(() => import('../modules/your-module/YourPage'), 'YourPageWrapper'),
}
```

**Step 4: Add Route to PrivateRoutes**
```tsx
// src/app/routing/PrivateRoutes.tsx
<Route 
  path='your-module/your-page' 
  element={<SuspensedView><RouteConfig.yourModuleRoutes.yourPage /></SuspensedView>} 
/>
```

**Step 5: Add to Sidebar Menu**
```tsx
// src/_metronic/layout/components/sidebar/sidebar-menu/SidebarMenuMain.tsx
<SidebarMenuItem
  to='/your-module/your-page'
  icon='your-icon'
  title='Your Page'
  fontIcon='bi-icon'
/>
```

---

### 2. Adding a Sub-menu Item

**For existing module with submenu:**
```tsx
<SidebarMenuItemWithSub
  to='/existing-module'
  title='Existing Module'
  icon='icon-name'
  fontIcon='bi-icon'
>
  {/* Add new item */}
  <SidebarMenuItem to='/existing-module/new-page' title='New Page' hasBullet={true} />
</SidebarMenuItemWithSub>
```

---

## 📦 Module Structure Pattern

Each module follows this pattern:

```
module-name/
├── PageName.tsx          # Individual pages
├── components/           # Module-specific components
│   ├── forms/
│   ├── tables/
│   └── modals/
├── models/               # TypeScript interfaces
├── services/             # API calls
└── utils/                # Helper functions
```

---

## 🎨 UI Components

### Page Layout Structure
```tsx
<>
  <ToolbarWrapper />      {/* Top toolbar with buttons */}
  <Content>               {/* Main content area */}
    <div className='card'>
      <div className='card-header'>
        <h3 className='card-title'>Title</h3>
      </div>
      <div className='card-body'>
        {/* Content */}
      </div>
    </div>
  </Content>
</>
```

### Common Components
- `<ToolbarWrapper />` - Top action bar
- `<Content>` - Main content wrapper
- `<PageTitle>` - Page title with breadcrumbs
- `<SidebarMenuItem>` - Menu item
- `<SidebarMenuItemWithSub>` - Menu with submenu

---

## 🔗 Routing System

### Route Configuration Pattern
```typescript
// RouteConfig.ts - Centralized lazy loading
const lazyLoad = (importFn: () => Promise<any>, wrapperName: string) =>
  lazy(() => importFn().then(m => ({ default: m[wrapperName] })))

export const moduleRoutes = {
  page1: lazyLoad(() => import('../modules/module/Page1'), 'Page1Wrapper'),
  page2: lazyLoad(() => import('../modules/module/Page2'), 'Page2Wrapper'),
}
```

### Benefits
- ✅ Code splitting for better performance
- ✅ Lazy loading reduces initial bundle size
- ✅ Centralized configuration
- ✅ Type-safe routing

---

## 🎯 Current Module Status

### ✅ Completed (Structure Only)
- All 92 pages created with placeholder content
- Routing configured for all modules
- Sidebar menu with complete hierarchy
- Lazy loading implemented

### 🚧 To Be Implemented
Each module needs:
1. **Data Models** - TypeScript interfaces
2. **API Services** - Backend integration
3. **Forms** - Data entry forms
4. **Tables** - Data display with pagination
5. **Modals** - Dialogs for actions
6. **Validation** - Form validation
7. **State Management** - Redux/Context API

---

## 📝 Development Guidelines

### 1. Naming Conventions
- **Files**: PascalCase (e.g., `StudentList.tsx`)
- **Components**: PascalCase (e.g., `StudentForm`)
- **Functions**: camelCase (e.g., `fetchStudents`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### 2. Component Structure
```tsx
// 1. Imports
import { FC } from 'react'
import { PageTitle } from '...'

// 2. Interfaces
interface Props {
  // ...
}

// 3. Main Component
const ComponentName: FC<Props> = ({ prop1, prop2 }) => {
  // Logic
  return (
    // JSX
  )
}

// 4. Wrapper (if needed)
const ComponentWrapper: FC = () => {
  return (
    <>
      <PageTitle>Title</PageTitle>
      <ComponentName />
    </>
  )
}

// 5. Export
export { ComponentWrapper }
```

### 3. State Management
```tsx
// Local state
const [data, setData] = useState([])

// API calls
useEffect(() => {
  fetchData()
}, [])

// For global state, use Redux or Context API
```

---

## 🔧 Common Tasks

### Add a Form
```tsx
import { useState } from 'react'

const MyForm: FC = () => {
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle submission
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className='mb-3'>
        <label className='form-label'>Field 1</label>
        <input 
          type='text' 
          className='form-control'
          value={formData.field1}
          onChange={(e) => setFormData({...formData, field1: e.target.value})}
        />
      </div>
      <button type='submit' className='btn btn-primary'>Submit</button>
    </form>
  )
}
```

### Add a Table
```tsx
const MyTable: FC = () => {
  const [data, setData] = useState([])

  return (
    <div className='table-responsive'>
      <table className='table table-row-bordered'>
        <thead>
          <tr>
            <th>Column 1</th>
            <th>Column 2</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.field1}</td>
              <td>{item.field2}</td>
              <td>
                <button className='btn btn-sm btn-primary'>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 🎨 Styling

### Color Scheme
- **Primary**: `#347f9e` (Teal Blue)
- **Success**: `#378e55` (Green)
- **Sidebar**: `#0d576f` (Deep Teal)
- **Font**: 'Lexend Deca'

### CSS Classes (Bootstrap + Metronic)
- `card` - Card container
- `card-header` - Card header
- `card-body` - Card body
- `btn btn-primary` - Primary button
- `table table-row-bordered` - Bordered table
- `form-control` - Form input
- `mb-3` - Margin bottom 3

---

## 🚀 Next Steps for Development

### Phase 2: Student Management
1. Create student data model
2. Build student list with table
3. Add student form (add/edit)
4. Implement admission workflow
5. Add attendance tracking
6. Create performance/grades system

### Phase 3: Staff Management
1. Teacher profiles
2. Staff attendance system
3. Leave management
4. Performance evaluations

### Phase 4: Academic Management
1. Class and section management
2. Subject allocation
3. Teacher-subject mapping
4. Academic calendar

---

## 📚 Resources

- **Metronic Docs**: Template documentation
- **React Router**: Routing library
- **TypeScript**: Type safety
- **Bootstrap**: UI framework

---

## 🐛 Troubleshooting

### Route not working?
1. Check `RouteConfig.ts` - Is route defined?
2. Check `PrivateRoutes.tsx` - Is route added?
3. Check component export - Using correct wrapper name?

### Sidebar menu not showing?
1. Check `SidebarMenuMain.tsx`
2. Verify icon names
3. Check route paths match

### Page not loading?
1. Check lazy loading syntax
2. Verify component exports
3. Check browser console for errors

---

## 💡 Tips

1. **Always use lazy loading** for better performance
2. **Keep components small** and focused
3. **Use TypeScript interfaces** for type safety
4. **Follow the existing patterns** for consistency
5. **Test routes** after adding them
6. **Keep sidebar menu organized** by module

---

**Last Updated**: January 25, 2026
**Total Pages**: 92
**Total Modules**: 13
**Status**: Structure Complete, Ready for Development
