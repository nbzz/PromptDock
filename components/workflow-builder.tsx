'use client';

import { useMemo } from 'react';

import { ParsedTemplate, StoredTemplate, WorkflowStep } from '@/lib/types';
import { parseTemplate, renderPrompt, renderPromptSegments } from '@/lib/template-parser';

interface WorkflowBuilderProps {
  templates: StoredTemplate[];
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
}

function parseTemplateSafe(
  template: StoredTemplate,
  overrideMarkdown?: string
): ParsedTemplate | null {
  try {
    return parseTemplate({
      ...template,
      rawMarkdown: overrideMarkdown ?? template.rawMarkdown
    });
  } catch {
    return null;
  }
}

export function WorkflowBuilder({ templates, steps, onChange }: WorkflowBuilderProps) {
  function updateStep(index: number, patch: Partial<WorkflowStep>) {
    const next = steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  }

  function addStep() {
    if (steps.length >= 5) return;
    const firstTemplate = templates[0];
    if (!firstTemplate) return;
    onChange([...steps, { templateId: firstTemplate.id, values: {} }]);
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  function handleCopyAll() {
    const allPrompts = steps
      .map((step) => {
        const template = templates.find((t) => t.id === step.templateId);
        if (!template) return '';
        const parsed = parseTemplateSafe(template);
        if (!parsed) return '';
        return renderPrompt(parsed.content, step.values);
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    void navigator.clipboard.writeText(allPrompts);
  }

  const renderedSteps = useMemo(() => {
    return steps.map((step) => {
      const template = templates.find((t) => t.id === step.templateId);
      if (!template) return null;
      const parsed = parseTemplateSafe(template);
      if (!parsed) return null;
      const content = renderPrompt(parsed.content, step.values);
      const segments = renderPromptSegments(parsed.content, step.values);
      return { step, template, parsed, content, segments };
    }).filter(Boolean) as Array<{
      step: WorkflowStep;
      template: StoredTemplate;
      parsed: ParsedTemplate;
      content: string;
      segments: Array<{ text: string; isFilled: boolean }>;
    }>;
  }, [steps, templates]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">工作流构建器</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{steps.length}/5 步</span>
          {steps.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAll}
              className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100"
            >
              复制全部
            </button>
          )}
        </div>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
          <p className="text-sm text-slate-500">点击下方按钮添加模板到工作流</p>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => {
            const template = templates.find((t) => t.id === step.templateId);
            const parsed = template ? parseTemplateSafe(template) : null;
            const allTemplateVars = parsed?.variables ?? [];

            return (
              <div key={index} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                {/* Step indicator */}
                <div className="absolute -top-2.5 left-3 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-medium text-white">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {template?.title ?? '未知模板'}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="absolute right-2 top-2 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                >
                  ✕
                </button>

                {/* Template selector */}
                <div className="mb-3 mt-2">
                  <select
                    value={step.templateId}
                    onChange={(e) => {
                      updateStep(index, { templateId: e.target.value, values: {} });
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variable inputs */}
                {allTemplateVars.length > 0 ? (
                  <div className="space-y-2">
                    {allTemplateVars.map((variable) => (
                      <div key={variable.id} className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">
                          {variable.name}
                          {variable.required ? ' *' : ''}
                        </label>
                        {variable.type === 'textarea' ? (
                          <textarea
                            rows={2}
                            value={step.values[variable.name] ?? ''}
                            placeholder={variable.placeholder}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none transition focus:border-teal-500"
                            onChange={(e) =>
                              updateStep(index, {
                                values: { ...step.values, [variable.name]: e.target.value }
                              })
                            }
                          />
                        ) : (
                          <input
                            type={variable.type === 'date' ? 'date' : variable.type === 'number' ? 'number' : 'text'}
                            value={step.values[variable.name] ?? ''}
                            placeholder={variable.placeholder}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none transition focus:border-teal-500"
                            onChange={(e) =>
                              updateStep(index, {
                                values: { ...step.values, [variable.name]: e.target.value }
                              })
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">此模板无变量</p>
                )}

                {/* Preview */}
                {parsed && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="mb-1.5 text-xs font-medium text-slate-500">预览</p>
                    <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">
                      {renderedSteps[index]?.segments.map((seg, i) =>
                        seg.isFilled ? (
                          <span key={i} className="rounded bg-teal-100 px-0.5 text-teal-800">
                            {seg.text}
                          </span>
                        ) : (
                          <span key={i}>{seg.text}</span>
                        )
                      )}
                    </pre>
                  </div>
                )}

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="pointer-events-none absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center justify-center">
                    <span className="text-lg text-teal-500">↓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {steps.length < 5 && templates.length > 0 && (
        <button
          type="button"
          onClick={addStep}
          className="mt-4 w-full rounded-xl border border-dashed border-teal-300 py-3 text-sm text-teal-600 transition hover:border-teal-500 hover:bg-teal-50"
        >
          + 添加下一步
        </button>
      )}
    </section>
  );
}
