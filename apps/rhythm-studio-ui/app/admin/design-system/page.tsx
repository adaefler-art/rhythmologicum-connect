'use client'

import { useState, type ReactNode } from 'react'
import {
  Alert,
  Button,
  Modal,
  Textarea,
  FormField,
  PageHeader,
  SectionHeader,
} from '@/lib/ui'

type DemoCardProps = {
  header?: ReactNode
  footer?: ReactNode
  interactive?: boolean
  onClick?: () => void
  className?: string
  children: ReactNode
}

type DemoInputProps = React.ComponentProps<'input'> & {
  error?: boolean
  errorMessage?: string
  helperText?: string
}

type DemoSelectProps = React.ComponentProps<'select'> & {
  error?: boolean
  helperText?: string
}

const joinClasses = (...classes: Array<string | null | undefined | false>) =>
  classes.filter(Boolean).join(' ')

function DemoCard({
  header,
  footer,
  interactive = false,
  onClick,
  className,
  children,
}: DemoCardProps) {
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:shadow-lg transition-shadow'
    : ''

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      data-slot="card"
      onClick={onClick}
      className={joinClasses(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border text-left',
        interactiveClasses,
        className,
      )}
    >
      {header && (
        <div
          data-slot="card-header"
          className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6"
        >
          {header}
        </div>
      )}
      <div data-slot="card-content" className="px-6 last:pb-6">
        {children}
      </div>
      {footer && (
        <div data-slot="card-footer" className="flex items-center px-6 pb-6">
          {footer}
        </div>
      )}
    </Component>
  )
}

function DemoInput({
  className,
  type,
  error,
  errorMessage,
  helperText,
  ...props
}: DemoInputProps) {
  return (
    <div className="w-full">
      <input
        type={type}
        data-slot="input"
        aria-invalid={error ? 'true' : undefined}
        className={joinClasses(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className,
        )}
        {...props}
      />
      {error && errorMessage && (
        <p className="text-sm text-destructive mt-2">{errorMessage}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground mt-2">{helperText}</p>
      )}
    </div>
  )
}

function DemoSelect({ className, error, helperText, children, ...props }: DemoSelectProps) {
  return (
    <div className="w-full">
      <select
        data-slot="select-trigger"
        aria-invalid={error ? 'true' : undefined}
        className={joinClasses(
          'border-input data-placeholder:text-muted-foreground [&_svg:not([class*="text-"])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {helperText && !error && (
        <p className="text-sm text-muted-foreground mt-2">{helperText}</p>
      )}
    </div>
  )
}

type DemoTableColumn<T> = { header: string; accessor: (row: T) => ReactNode }

function DemoTable<T extends { id: number }>({
  columns,
  data,
}: {
  columns: Array<DemoTableColumn<T>>
  data: T[]
}) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className="w-full caption-bottom text-sm">
        <thead data-slot="table-header" className="[&_tr]:border-b">
          <tr data-slot="table-row">
            {columns.map((column) => (
              <th
                key={column.header}
                data-slot="table-head"
                className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody data-slot="table-body" className="[&_tr:last-child]:border-0">
          {data.map((row) => (
            <tr
              key={row.id}
              data-slot="table-row"
              className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={`${row.id}-${column.header}`}
                  data-slot="table-cell"
                  className="p-2 align-middle whitespace-nowrap"
                >
                  {column.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Design System Showcase Page
 * 
 * Demonstrates all V0.4 Design System components in action.
 * Useful for:
 * - Visual regression testing
 * - Component documentation
 * - Design review
 * - Development reference
 */
export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [alertVisible, setAlertVisible] = useState(true)

  // Sample data for table
  const sampleData = [
    { id: 1, name: 'Max Mustermann', email: 'max@example.com', status: 'Active' },
    { id: 2, name: 'Anna Schmidt', email: 'anna@example.com', status: 'Active' },
    { id: 3, name: 'Peter Müller', email: 'peter@example.com', status: 'Inactive' },
  ]

  const columns = [
    { header: 'Name', accessor: (row: typeof sampleData[0]) => row.name },
    { header: 'Email', accessor: (row: typeof sampleData[0]) => row.email },
    {
      header: 'Status',
      accessor: (row: typeof sampleData[0]) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            row.status === 'Active'
              ? 'bg-green-100 text-green-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ]

  const handleSubmit = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      alert('Form submitted!')
    }, 2000)
  }

  return (
    <main className="w-full">
      <div className="space-y-12" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title="Design System v0.4"
          description="Comprehensive showcase of UI components and design tokens"
        />

        {/* Buttons Section */}
        <section>
          <DemoCard>
            <SectionHeader title="Buttons" />

            <div className="space-y-6">
              {/* Button Variants */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>

              {/* Button Sizes */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Sizes</h3>
                <div className="flex items-[center] flex-wrap gap-3">
                  <Button variant="primary" size="sm">
                    Small
                  </Button>
                  <Button variant="primary" size="md">
                    Medium
                  </Button>
                  <Button variant="primary" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              {/* Button States */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">States</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" loading>
                    Loading
                  </Button>
                  <Button variant="primary" disabled>
                    Disabled
                  </Button>
                  <Button variant="primary" fullWidth>
                    Full Width
                  </Button>
                </div>
              </div>

              {/* Button with Icon */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">With Icon</h3>
                <Button
                  variant="primary"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  }
                >
                  Add New
                </Button>
              </div>
            </div>
          </DemoCard>
        </section>

        {/* Cards Section */}
        <section>
          <DemoCard>
            <SectionHeader title="Cards" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Card */}
              <DemoCard>
                <h3 className="text-lg font-semibold mb-2">Basic Card</h3>
                <p className="text-slate-600 dark:text-slate-300">
                  This is a basic card with medium shadow and default padding.
                </p>
              </DemoCard>

              {/* Card with Header */}
              <DemoCard header={<h3 className="text-lg font-semibold">Card with Header</h3>}>
                <p className="text-slate-600 dark:text-slate-300">Card content with a header section.</p>
              </DemoCard>

              {/* Card with Footer */}
              <DemoCard
                header={<h3 className="text-lg font-semibold">Card with Footer</h3>}
                footer={
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm">
                      Save
                    </Button>
                  </div>
                }
              >
                <p className="text-slate-600 dark:text-slate-300">Card with both header and footer sections.</p>
              </DemoCard>

              {/* Interactive Card */}
              <DemoCard interactive onClick={() => alert('Card clicked!')}>
                <h3 className="text-lg font-semibold mb-2">Interactive Card</h3>
                <p className="text-slate-600 dark:text-slate-300">Click me! I have hover effects.</p>
              </DemoCard>
            </div>
          </DemoCard>
        </section>

        {/* Form Components Section */}
        <section>
          <DemoCard>
            <SectionHeader title="Form Components" />

            <div className="space-y-6">
              {/* Input */}
              <FormField label="Text Input" required htmlFor="text-input">
                <DemoInput
                  id="text-input"
                  type="text"
                  placeholder="Enter text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="This is helper text"
                />
              </FormField>

              {/* Input with Error */}
              <div>
                <FormField label="Input with Error" htmlFor="error-input">
                  <DemoInput
                    id="error-input"
                    type="email"
                    placeholder="email@example.com"
                    error={hasError}
                    errorMessage="Invalid email address"
                  />
                </FormField>
                <button
                  onClick={() => setHasError(!hasError)}
                  className="text-sm text-sky-600 hover:text-sky-700 mt-2"
                >
                  Toggle Error State
                </button>
              </div>

              {/* Textarea */}
              <FormField
                label="Textarea"
                description="Enter a longer description"
                htmlFor="textarea"
              >
                <Textarea
                  id="textarea"
                  rows={4}
                  placeholder="Enter description..."
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                />
              </FormField>

              {/* Select */}
              <FormField label="Select Dropdown" required htmlFor="select">
                <DemoSelect
                  id="select"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                >
                  <option value="">Choose an option...</option>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                </DemoSelect>
              </FormField>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
                  Submit Form
                </Button>
              </div>
            </div>
          </DemoCard>
        </section>

        {/* Table Section */}
        <section>
          <DemoCard>
            <SectionHeader title="Table" />

            <DemoTable columns={columns} data={sampleData} />
          </DemoCard>
        </section>

        {/* Alert Section */}
        <section>
          <DemoCard>
            <SectionHeader title="Alerts" />

            <div className="space-y-4">
              {/* Info Alert */}
              <Alert variant="info" title="Information">
                This is an informational message using semantic tokens.
              </Alert>

              {/* Success Alert */}
              <Alert variant="success" title="Success!">
                Your changes have been saved successfully.
              </Alert>

              {/* Warning Alert */}
              <Alert variant="warning" title="Warning">
                Your session will expire in 5 minutes.
              </Alert>

              {/* Error Alert */}
              <Alert variant="error" title="Error">
                An error occurred while processing your request.
              </Alert>

              {/* Dismissible Alert */}
              {alertVisible && (
                <Alert
                  variant="info"
                  title="Dismissible Alert"
                  dismissible
                  onDismiss={() => setAlertVisible(false)}
                >
                  Click the X button to dismiss this alert.
                </Alert>
              )}
              {!alertVisible && (
                <button
                  onClick={() => setAlertVisible(true)}
                  className="text-sm text-sky-600 hover:text-sky-700"
                >
                  Show dismissible alert again
                </button>
              )}

              {/* Alert without title */}
              <Alert variant="success">
                Simple alert without a title - just a message.
              </Alert>
            </div>
          </DemoCard>
        </section>

        {/* Modal Section */}
        <section>
          <DemoCard>
            <SectionHeader title="Modal / Dialog" />

            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Modal component with accessibility features, focus management, and semantic tokens.
              </p>

              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Open Modal
              </Button>

              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Example Modal"
                size="md"
                className="bg-background rounded-lg border shadow-lg"
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        alert('Action confirmed!')
                        setIsModalOpen(false)
                      }}
                    >
                      Confirm
                    </Button>
                  </>
                }
              >
                <div className="space-y-4">
                  <p className="text-slate-700 dark:text-slate-300">
                    This is a modal dialog built with semantic design tokens. It includes:
                  </p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                    <li>Proper focus management and keyboard navigation</li>
                    <li>Backdrop click to close</li>
                    <li>Escape key support</li>
                    <li>Body scroll lock when open</li>
                    <li>Configurable sizes (sm, md, lg, xl)</li>
                    <li>Optional header and footer sections</li>
                  </ul>
                </div>
              </Modal>
            </div>
          </DemoCard>
        </section>

        {/* Color Palette Section */}
        <section>
          <DemoCard>
            <SectionHeader title="Color Palette" />

            <div className="space-y-6">
              {/* Primary Colors */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Primary (Sky)</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="text-center">
                      <div
                        className={`h-16 rounded-lg mb-2 border border-slate-200`}
                        style={{ backgroundColor: `var(--color-primary-${shade})` }}
                      />
                      <p className="text-xs text-slate-600">{shade}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Neutral Colors */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Neutral (Slate)</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="text-center">
                      <div
                        className={`h-16 rounded-lg mb-2 border border-slate-200`}
                        style={{ backgroundColor: `var(--color-neutral-${shade})` }}
                      />
                      <p className="text-xs text-slate-600">{shade}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic Colors */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Semantic</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div
                      className="h-16 rounded-lg mb-2 border border-slate-200"
                      style={{ backgroundColor: 'var(--color-success)' }}
                    />
                    <p className="text-xs text-slate-600">Success</p>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-16 rounded-lg mb-2 border border-slate-200"
                      style={{ backgroundColor: 'var(--color-warning)' }}
                    />
                    <p className="text-xs text-slate-600">Warning</p>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-16 rounded-lg mb-2 border border-slate-200"
                      style={{ backgroundColor: 'var(--color-error)' }}
                    />
                    <p className="text-xs text-slate-600">Error</p>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-16 rounded-lg mb-2 border border-slate-200"
                      style={{ backgroundColor: 'var(--color-info)' }}
                    />
                    <p className="text-xs text-slate-600">Info</p>
                  </div>
                </div>
              </div>
            </div>
          </DemoCard>
        </section>

        {/* Typography Section */}
        <section>
          <DemoCard>
            <SectionHeader title="Typography" />

            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">Heading 1 (4xl)</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">font-size: 2.25rem (36px)</p>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Heading 2 (3xl)</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">font-size: 1.875rem (30px)</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Heading 3 (2xl)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">font-size: 1.5rem (24px)</p>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Heading 4 (xl)</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">font-size: 1.25rem (20px)</p>
              </div>
              <div>
                <p className="text-base text-slate-700 dark:text-slate-300">Body text (base) - Default size</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">font-size: 1rem (16px)</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Small text (sm)</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">font-size: 0.875rem (14px)</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Extra small text (xs)</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">font-size: 0.75rem (12px)</p>
              </div>
            </div>
          </DemoCard>
        </section>

        {/* Spacing Section */}
        <section>
          <DemoCard>
            <SectionHeader title="Spacing Scale" />

            <div className="space-y-4">
              {[
                { name: 'xs', value: '0.5rem (8px)' },
                { name: 'sm', value: '0.75rem (12px)' },
                { name: 'md', value: '1rem (16px)' },
                { name: 'lg', value: '1.5rem (24px)' },
                { name: 'xl', value: '2rem (32px)' },
                { name: '2xl', value: '3rem (48px)' },
                { name: '3xl', value: '4rem (64px)' },
              ].map((space) => (
                <div key={space.name} className="flex items-[center] gap-4">
                  <div
                    className="bg-sky-600 h-8"
                    style={{ width: `var(--spacing-${space.name})` }}
                  />
                  <span className="text-sm text-slate-700 font-mono">
                    {space.name}: {space.value}
                  </span>
                </div>
              ))}
            </div>
          </DemoCard>
        </section>
      </div>
    </main>
  )
}
