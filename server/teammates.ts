import { GoogleGenAI } from '@google/genai';
import { decryptApiKey } from './encryption.ts';

export async function testProviderApiKey(provider: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say hi' }],
          max_tokens: 5
        })
      });
      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error?.message || `HTTP ${res.status}: ${res.statusText}` };
      }
      return { success: true };
    } else if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Say hi'
      });
      return { success: true };
    } else if (provider === 'perplexity') {
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: 'Say hi' }],
          max_tokens: 5
        })
      });
      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error?.message || `HTTP ${res.status}: ${res.statusText}` };
      }
      return { success: true };
    } else if (provider === 'xai') {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'user', content: 'Say hi' }],
          max_tokens: 5
        })
      });
      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error?.message || `HTTP ${res.status}: ${res.statusText}` };
      }
      return { success: true };
    } else if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://aistudio-build.local',
          'X-Title': 'AI Studio Build',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say hi' }],
          max_tokens: 5
        })
      });
      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error?.message || `HTTP ${res.status}: ${res.statusText}` };
      }
      return { success: true };
    }
    return { success: false, error: 'Unknown provider' };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function callProviderModel(provider: string, apiKey: string, prompt: string): Promise<string> {
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });
    if (!res.ok) {
      const errJson: any = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenAI API Error (${res.status})`);
    }
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } else if (provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || '';
  } else if (provider === 'perplexity') {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });
    if (!res.ok) {
      const errJson: any = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Perplexity API Error (${res.status})`);
    }
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } else if (provider === 'xai') {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });
    if (!res.ok) {
      const errJson: any = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `xAI API Error (${res.status})`);
    }
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } else if (provider === 'openrouter') {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://aistudio-build.local',
        'X-Title': 'AI Studio Build',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });
    if (!res.ok) {
      const errJson: any = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenRouter API Error (${res.status})`);
    }
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
  throw new Error(`Unsupported provider: ${provider}`);
}
