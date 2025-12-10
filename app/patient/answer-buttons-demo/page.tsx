'use client'

import { useState } from 'react'
import MobileAnswerButton from '@/app/components/MobileAnswerButton'
import ScaleAnswerButtons from '@/app/components/ScaleAnswerButtons'
import BinaryAnswerButtons from '@/app/components/BinaryAnswerButtons'
import SingleChoiceAnswerButtons from '@/app/components/SingleChoiceAnswerButtons'

/**
 * Demo Page: Mobile Answer Buttons Component Library
 * 
 * This page showcases all variants of the mobile answer button components:
 * - Base MobileAnswerButton
 * - ScaleAnswerButtons (0-4 scale)
 * - BinaryAnswerButtons (Yes/No)
 * - SingleChoiceAnswerButtons (vertical and grid layouts)
 * 
 * Path: /patient/answer-buttons-demo
 */
export default function AnswerButtonsDemoPage() {
  const [scaleValue, setScaleValue] = useState<number>()
  const [binaryValue, setBinaryValue] = useState<boolean>()
  const [choiceVerticalValue, setChoiceVerticalValue] = useState<string | number>()
  const [choiceGridValue, setChoiceGridValue] = useState<string | number>()

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Mobile Answer Buttons Demo
          </h1>
          <p className="text-slate-600">
            Showcase of all mobile answer button variants (A3 Component Library)
          </p>
        </header>

        {/* Scale Buttons */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              Scale Answer Buttons (0-4)
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Used for frequency/intensity questions. Dynamically generated from min_value to max_value.
            </p>
            <ScaleAnswerButtons
              questionId="demo-scale"
              minValue={0}
              maxValue={4}
              value={scaleValue}
              onChange={setScaleValue}
            />
            <div className="mt-4 p-3 bg-sky-50 rounded-lg">
              <p className="text-sm text-sky-900">
                <strong>Selected:</strong> {scaleValue !== undefined ? scaleValue : 'None'}
              </p>
            </div>
          </div>
        </section>

        {/* Custom Range Scale */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              Scale Answer Buttons (1-10)
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Example with different range. Good for pain scales or satisfaction ratings.
            </p>
            <ScaleAnswerButtons
              questionId="demo-scale-10"
              minValue={1}
              maxValue={10}
              value={undefined}
              onChange={() => {}}
            />
          </div>
        </section>

        {/* Binary Buttons */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              Binary Answer Buttons (Yes/No)
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Two-option questions with equal-width buttons. Labels and values are customizable.
            </p>
            <BinaryAnswerButtons
              questionId="demo-binary"
              value={binaryValue}
              onChange={(val) => setBinaryValue(val as boolean)}
            />
            <div className="mt-4 p-3 bg-sky-50 rounded-lg">
              <p className="text-sm text-sky-900">
                <strong>Selected:</strong> {binaryValue !== undefined ? (binaryValue ? 'Ja' : 'Nein') : 'None'}
              </p>
            </div>
          </div>
        </section>

        {/* Single Choice - Vertical */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              Single Choice Buttons (Vertical Layout)
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Multiple choice with stacked buttons. Good for 2-4 options.
            </p>
            <SingleChoiceAnswerButtons
              questionId="demo-choice-vertical"
              options={[
                { value: 'fulltime', label: 'Vollzeit' },
                { value: 'parttime', label: 'Teilzeit' },
                { value: 'selfemployed', label: 'Selbstständig' },
                { value: 'unemployed', label: 'Arbeitslos' },
              ]}
              value={choiceVerticalValue}
              onChange={setChoiceVerticalValue}
              layout="vertical"
            />
            <div className="mt-4 p-3 bg-sky-50 rounded-lg">
              <p className="text-sm text-sky-900">
                <strong>Selected:</strong> {choiceVerticalValue || 'None'}
              </p>
            </div>
          </div>
        </section>

        {/* Single Choice - Grid */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              Single Choice Buttons (Grid Layout)
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Multiple choice with 2-column grid. Good for 4+ short options.
            </p>
            <SingleChoiceAnswerButtons
              questionId="demo-choice-grid"
              options={[
                { value: 0, label: 'Nie' },
                { value: 1, label: '1-2x/Woche' },
                { value: 2, label: '3-4x/Woche' },
                { value: 3, label: 'Täglich' },
              ]}
              value={choiceGridValue}
              onChange={setChoiceGridValue}
              layout="grid"
            />
            <div className="mt-4 p-3 bg-sky-50 rounded-lg">
              <p className="text-sm text-sky-900">
                <strong>Selected:</strong> {choiceGridValue !== undefined ? choiceGridValue : 'None'}
              </p>
            </div>
          </div>
        </section>

        {/* Visual States Demo */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              Visual States
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              All buttons support: idle, hover (desktop), active/pressed, and disabled states
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Idle State:</p>
                <div className="flex gap-2">
                  <div className="flex-1 min-w-[70px]">
                    <MobileAnswerButton
                      value={0}
                      label="Idle"
                      checked={false}
                      onChange={() => {}}
                      name="demo-states-idle"
                      variant="scale"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Selected State (with scale animation):</p>
                <div className="flex gap-2">
                  <div className="flex-1 min-w-[70px]">
                    <MobileAnswerButton
                      value={1}
                      label="Selected"
                      checked={true}
                      onChange={() => {}}
                      name="demo-states-selected"
                      variant="scale"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Disabled State:</p>
                <div className="flex gap-2">
                  <div className="flex-1 min-w-[70px]">
                    <MobileAnswerButton
                      value={2}
                      label="Disabled"
                      checked={false}
                      onChange={() => {}}
                      disabled={true}
                      name="demo-states-disabled"
                      variant="scale"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Touch Target Info */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-sky-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              ✅ Accessibility & UX Features
            </h2>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold">•</span>
                <span>All touch targets meet WCAG 44x44px minimum</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold">•</span>
                <span>Micro-animations on tap with spring physics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold">•</span>
                <span>Clear visual distinction between selected/unselected</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold">•</span>
                <span>Smooth color transitions (200ms)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold">•</span>
                <span>Hidden radio inputs for proper form semantics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-600 font-bold">•</span>
                <span>Disabled state with opacity and cursor feedback</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Technical Info */}
        <section className="mb-12">
          <div className="bg-slate-100 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              📋 Component Integration
            </h2>
            <p className="text-sm text-slate-700 mb-3">
              These components are integrated into <code className="bg-white px-2 py-1 rounded">MobileQuestionCard</code> and automatically 
              select the appropriate variant based on:
            </p>
            <ul className="space-y-1 text-sm text-slate-700 ml-4">
              <li><strong>question.question_type</strong> - &apos;scale&apos;, &apos;binary&apos;, &apos;choice&apos;, or &apos;text&apos;</li>
              <li><strong>question.min_value / max_value</strong> - For dynamic scale ranges</li>
              <li><strong>question.key</strong> - For mapping to predefined choice options</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
