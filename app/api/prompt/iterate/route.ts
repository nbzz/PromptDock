import { NextRequest, NextResponse } from 'next/server';
import { StoredTemplate, IterationState } from '@/lib/types';
import { parseTemplate, renderPrompt, parseIterationConfig, parseStructuredOutput } from '@/lib/template-parser';

const ITERATION_XML_RE = /<result>([\s\S]*?)<\/result>/i;
const FIELD_RE = /<(\w+)>(.*?)<\/\1>/gs;

function parseXmlResult(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of xml.matchAll(FIELD_RE)) {
    const [, key, value] = match;
    result[key] = value.trim();
  }
  return result;
}

function extractContinueField(parsed: Record<string, string>): { continue: boolean; next_focus?: string; confidence?: '高' | '中' | '低'; stage?: string; analysis?: string } {
  const continueStr = parsed.continue?.toLowerCase();
  const isContinue = continueStr === 'true';
  return {
    continue: isContinue,
    next_focus: isContinue ? parsed.next_focus : undefined,
    confidence: parsed.confidence as '高' | '中' | '低' | undefined,
    stage: parsed.stage,
    analysis: parsed.analysis,
  };
}

// POST /api/prompt/iterate — 多轮迭代填充
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, values, iteration_state } = body as {
      id: string;
      values: Record<string, string>;
      iteration_state?: IterationState;
    };

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Fetch builtin templates
    const builtinRes = await fetch(new URL('/api/builtin-templates', request.url), {
      cache: 'no-store',
    });
    const { items: builtinTemplates } = await builtinRes.json() as { items: StoredTemplate[] };

    // Find template
    const template = builtinTemplates.find(
      (t) => t.id === id || t.title === id || t.id === `builtin:${id}` || t.title === id,
    );
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const parsed = parseTemplate(template);
    const iterationConfig = parseIterationConfig(parsed.frontmatter);

    // Determine current round
    const currentRound = iteration_state ? iteration_state.round + 1 : 1;

    // Check if should stop
    if (iterationConfig && iteration_state) {
      const maxRounds = iterationConfig.max_rounds;
      if (currentRound > maxRounds) {
        return NextResponse.json({
          done: true,
          reason: 'max_rounds_exceeded',
          rendered: iteration_state.last_output || '',
          iteration: {
            round: currentRound,
            is_continue: false,
          },
        });
      }
    }

    // Prepare values with iteration context
    const enrichedValues: Record<string, string> = {
      ...values,
      __iteration_round__: String(currentRound),
      __iteration_context__: iteration_state
        ? iteration_state.history.map((h) => `[Round ${h.round}] ${h.output}`).join('\n\n')
        : '',
    };

    // If continuing from previous output, inject it
    if (iteration_state?.last_output && iterationConfig) {
      enrichedValues.__previous_output__ = iteration_state.last_output;
    }

    // Render prompt
    const rendered = renderPrompt(parsed.content, enrichedValues);

    // If no structured output is defined, just return the rendered prompt
    const outputSchema = parseStructuredOutput(parsed.content);
    if (!outputSchema) {
      return NextResponse.json({
        rendered,
        iteration: {
          round: currentRound,
          is_continue: false,
        },
        template: {
          id: parsed.id,
          title: parsed.title,
        },
      });
    }

    // Return with iteration metadata so AI knows to output structured format
    return NextResponse.json({
      rendered,
      iteration: {
        round: currentRound,
        is_continue: true,
        output_schema: outputSchema,
        max_rounds: iterationConfig?.max_rounds || 5,
      },
      template: {
        id: parsed.id,
        title: parsed.title,
      },
    });
  } catch (err) {
    console.error('[iterate] Error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET /api/prompt/iterate/extract — 从 AI 输出中提取结构化数据
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const output = searchParams.get('output');

  if (!output) {
    return NextResponse.json({ error: 'Missing output parameter' }, { status: 400 });
  }

  const match = output.match(ITERATION_XML_RE);
  if (!match) {
    return NextResponse.json({ error: 'No <result> tag found in output' }, { status: 400 });
  }

  const xmlContent = match[1];
  const parsed = parseXmlResult(xmlContent);
  const { continue: isContinue, next_focus, confidence, stage, analysis } = extractContinueField(parsed);

  return NextResponse.json({
    continue: isContinue,
    next_focus,
    confidence,
    stage,
    analysis,
    raw: parsed,
  });
}
