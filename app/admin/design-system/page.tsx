'use client'

import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Textarea,
  Select,
  FormField,
  Table,
} from '@/lib/ui'

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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Design System v0.4</h1>
          <p className="text-lg text-slate-600">
            Comprehensive showcase of UI components and design tokens
          </p>
        </div>

        {/* Buttons Section */}
        <section>
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Buttons</h2>

            <div className="space-y-6">
              {/* Button Variants */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Variants</h3>
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
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Sizes</h3>
                <div className="flex items-center flex-wrap gap-3">
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
                <h3 className="text-lg font-semibold text-slate-700 mb-4">States</h3>
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
                <h3 className="text-lg font-semibold text-slate-700 mb-4">With Icon</h3>
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
          </Card>
        </section>

        {/* Cards Section */}
        <section>
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Cards</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Card */}
              <Card shadow="md">
                <h3 className="text-lg font-semibold mb-2">Basic Card</h3>
                <p className="text-slate-600">
                  This is a basic card with medium shadow and default padding.
                </p>
              </Card>

              {/* Card with Header */}
              <Card
                header={<h3 className="text-lg font-semibold">Card with Header</h3>}
                shadow="md"
              >
                <p className="text-slate-600">Card content with a header section.</p>
              </Card>

              {/* Card with Footer */}
              <Card
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
                shadow="md"
              >
                <p className="text-slate-600">Card with both header and footer sections.</p>
              </Card>

              {/* Interactive Card */}
              <Card interactive onClick={() => alert('Card clicked!')} shadow="lg">
                <h3 className="text-lg font-semibold mb-2">Interactive Card</h3>
                <p className="text-slate-600">Click me! I have hover effects.</p>
              </Card>
            </div>
          </Card>
        </section>

        {/* Form Components Section */}
        <section>
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Form Components</h2>

            <div className="space-y-6">
              {/* Input */}
              <FormField label="Text Input" required htmlFor="text-input">
                <Input
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
                  <Input
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
                <Select
                  id="select"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                >
                  <option value="">Choose an option...</option>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                  <option value="3">Option 3</option>
                </Select>
              </FormField>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
                  Submit Form
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Table Section */}
        <section>
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Table</h2>

            <Table
              columns={columns}
              data={sampleData}
              hoverable
              onRowClick={(row) => alert(`Clicked: ${row.name}`)}
            />
          </Card>
        </section>

        {/* Alert Section */}
        <section>
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Alerts</h2>

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
          </Card>
        </section>

        {/* Modal Section */}
        <section>
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Modal / Dialog</h2>

            <div className="space-y-4">
              <p className="text-slate-600 mb-4">
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
                  <p className="text-slate-700">
                    This is a modal dialog built with semantic design tokens. It includes:
                  </p>
                  <ul className="list-disc list-inside text-slate-600 space-y-2">
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
          </Card>
        </section>

        {/* Color Palette Section */}
        <section>
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Color Palette</h2>

            <div className="space-y-6">
              {/* Primary Colors */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Primary (Sky)</h3>
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
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Neutral (Slate)</h3>
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
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Semantic</h3>
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
          </Card>
        </section>

        {/* Typography Section */}
        <section>
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Typography</h2>

            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Heading 1 (4xl)</h1>
                <p className="text-sm text-slate-500">font-size: 2.25rem (36px)</p>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Heading 2 (3xl)</h2>
                <p className="text-sm text-slate-500">font-size: 1.875rem (30px)</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Heading 3 (2xl)</h3>
                <p className="text-sm text-slate-500">font-size: 1.5rem (24px)</p>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-slate-900">Heading 4 (xl)</h4>
                <p className="text-sm text-slate-500">font-size: 1.25rem (20px)</p>
              </div>
              <div>
                <p className="text-base text-slate-700">Body text (base) - Default size</p>
                <p className="text-sm text-slate-500">font-size: 1rem (16px)</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Small text (sm)</p>
                <p className="text-sm text-slate-500">font-size: 0.875rem (14px)</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Extra small text (xs)</p>
                <p className="text-sm text-slate-500">font-size: 0.75rem (12px)</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Spacing Section */}
        <section>
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Spacing Scale</h2>

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
                <div key={space.name} className="flex items-center gap-4">
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
          </Card>
        </section>
      </div>
    </main>
  )
}
