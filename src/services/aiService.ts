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
    id: 'google',
    name: 'Google AI (Direct)',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Free) - Recommended' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite (Free, Fast)' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Free, Best Quality)' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Free)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Free)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ],
  },
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
const GOOGLE_AI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function synthesizeContent(
  request: SynthesisRequest,
  apiKey: string,
  model: string = 'gemini-2.5-flash',
  provider: string = 'google'
): Promise<SynthesisResponse> {
  const { sources, coachName, clientName } = request;

  // Check for environment variable API key first
  const envApiKey = provider === 'google' 
    ? import.meta.env.VITE_GOOGLE_API_KEY 
    : import.meta.env.VITE_OPENROUTER_API_KEY;
  const finalApiKey = apiKey || envApiKey;

  if (!finalApiKey) {
    const keyName = provider === 'google' ? 'Google AI' : 'OpenRouter';
    return {
      article: '',
      error: `No API key provided. Please enter a ${keyName} API key.`,
    };
  }

  const systemPrompt = `You are a professional health content synthesizer for Youngevity health coaches. Your task is to create comprehensive, detailed health articles.

IMPORTANT INSTRUCTIONS:
1. Write a COMPLETE, DETAILED article - do not truncate or summarize prematurely
2. Analyze the linguistic style and tone of the provided research sources
3. Synthesize ALL information into a cohesive, professional article
4. Focus on explaining the "why" behind health recommendations
5. When products are mentioned in the sources, reference them by their EXACT product names
6. Include specific dosage recommendations when mentioned in sources
7. Write at least 800-1200 words for a thorough article

FORMAT:
# Health Recommendations for ${clientName}
## Prepared by ${coachName}

[Personalized introduction addressing ${clientName} by name]

## [Topic Section 1]
[Detailed content with explanations]

## [Topic Section 2]
[Detailed content with explanations]

## Recommended Products
[List specific products mentioned in the research with brief explanations of why each is recommended]

## Summary & Next Steps
[Key takeaways and action items for ${clientName}]

CRITICAL: Write the FULL article. Do not stop early or summarize. Include ALL relevant information from the sources.`;

  const userPrompt = `Please synthesize the following ${sources.length} research sources into a COMPLETE, DETAILED health article for my client ${clientName}.

IMPORTANT: Write a thorough, comprehensive article of at least 800 words. Do not truncate or stop early.

${sources.map((source, i) => `--- SOURCE ${i + 1} ---\n${source}\n`).join('\n')}

Create a professional, personalized health article that:
1. Covers ALL topics from the sources in detail
2. Explains the science and reasoning behind recommendations
3. Lists specific product recommendations with their exact names
4. Provides actionable next steps for the client

Write the COMPLETE article now:`;

  try {
    // Create abort controller with 90 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let article: string;

    if (provider === 'google') {
      // Google AI API (Gemini)
      const googleUrl = `${GOOGLE_AI_API_URL}/${model}:generateContent?key=${finalApiKey}`;
      
      const response = await fetch(googleUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\n${userPrompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Google AI request failed: ${response.status}`
        );
      }

      const data = await response.json();
      article = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!article) {
        throw new Error('No content generated from Google AI');
      }
    } else {
      // OpenRouter API
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
          max_tokens: 8000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API request failed: ${response.status}`
        );
      }

      const data = await response.json();
      article = data.choices?.[0]?.message?.content;

      if (!article) {
        throw new Error('No content generated');
      }
    }

    return { article };
  } catch (error) {
    console.error('AI synthesis error:', error);
    
    // Handle abort/timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        article: '',
        error: 'Request timed out after 90 seconds. Try a faster model like Gemini Flash.',
      };
    }
    
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
