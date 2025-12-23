interface SynthesisRequest {
  sources: string[];
  coachName: string;
  clientName: string;
}

interface SynthesisResponse {
  article: string;
  error?: string;
}

export interface LLMProvider {
  id: string;
  name: string;
  models: { id: string; name: string }[];
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
      { id: 'google/gemini-exp-1206:free', name: 'Gemini Exp 1206 (Free)' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
      { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B (Free)' },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
  },
];

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function synthesizeContent(
  request: SynthesisRequest,
  apiKey: string,
  model: string = 'google/gemini-2.0-flash-exp:free'
): Promise<SynthesisResponse> {
  const { sources, coachName, clientName } = request;

  // Check for environment variable API key first
  const envApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const finalApiKey = apiKey || envApiKey;

  if (!finalApiKey) {
    return {
      article: '',
      error: 'No API key provided. Please enter an OpenRouter API key or set VITE_OPENROUTER_API_KEY.',
    };
  }

  const systemPrompt = `You are a professional health content synthesizer for health coaches. Your task is to:

1. Analyze the linguistic style and tone of the provided research sources
2. Synthesize the information into a single, cohesive, professional article
3. Mirror the tone and style of the source materials in your output
4. Focus on explaining the "why" behind health recommendations
5. Identify and naturally mention relevant health products when the research supports them

Format the output as follows:
- Start with a professional header: "Health Recommendations for ${clientName} | Prepared by ${coachName}"
- Include a brief personalized introduction addressing the client by name
- Organize the content with clear sections and headers
- Use professional but warm language
- End with a summary of key recommendations

Important: Do NOT invent product names. Only reference products if they are clearly mentioned or directly relevant to the research content.`;

  const userPrompt = `Please synthesize the following ${sources.length} research sources into a cohesive health article for my client ${clientName}:

${sources.map((source, i) => `--- SOURCE ${i + 1} ---\n${source}\n`).join('\n')}

Create a professional, personalized health article that synthesizes this research while maintaining the tone and style of the original sources.`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${finalApiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'DWD Content Synthesizer',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `API request failed: ${response.status}`
      );
    }

    const data = await response.json();
    const article = data.choices?.[0]?.message?.content;

    if (!article) {
      throw new Error('No content generated');
    }

    return { article };
  } catch (error) {
    console.error('AI synthesis error:', error);
    return {
      article: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function generateFallbackArticle(
  sources: string[],
  coachName: string,
  clientName: string
): string {
  return `# Health Recommendations for ${clientName}
## Prepared by ${coachName}

---

Dear ${clientName},

Based on my review of the latest research, I've compiled the following health insights specifically for you.

### Research Summary

The following information has been gathered from ${sources.length} research source${sources.length > 1 ? 's' : ''}:

${sources.map((source, i) => `**Source ${i + 1}:**\n${source.slice(0, 500)}${source.length > 500 ? '...' : ''}\n`).join('\n')}

### Key Takeaways

Please review the research sources above and consult with your health coach for personalized product recommendations.

---

*This report was prepared by ${coachName} using the Content Synthesizer tool.*
`;
}
