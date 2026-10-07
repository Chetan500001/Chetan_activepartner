const languages = {
  hi: 'Hindi',
  pa: 'Punjabi',
  en: 'English',
  tr: 'Turkish',
};

const topics = {
  day: 'the user’s day',
  mood: 'how the user is feeling',
  learn: 'something new the user is curious about',
  listen: 'whatever the user wants to share',
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  },
});

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (request.headers.get('origin') !== url.origin) return json({ error: 'Request origin rejected.' }, 403);
  if (!env.OPENAI_API_KEY || !env.ACTIVE_PARTNER_ACCESS_CODE) return json({ error: 'The voice service is not configured yet.' }, 503);
  if (request.headers.get('x-app-access-code') !== env.ACTIVE_PARTNER_ACCESS_CODE) return json({ error: 'App access code was not accepted.' }, 401);

  const length = Number(request.headers.get('content-length') || 0);
  if (length > 120000) return json({ error: 'Request is too large.' }, 413);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (typeof input?.sdp !== 'string' || input.sdp.length > 110000 || !input.sdp.trim()) return json({ error: 'Microphone connection offer is missing.' }, 400);
  const language = languages[input.language] ? input.language : 'hi';
  const topic = topics[input.topic] ? input.topic : 'listen';
  const instructions = `You are Active Partner, a warm, thoughtful voice companion. Have a natural two-way conversation; do not use canned replies. Listen to the exact meaning and emotion in each thing the person says, remember the context of this session, respond to their specific point, and ask a useful, gentle follow-up when it fits. Be honest when you do not know something. Keep spoken answers clear and fairly concise, with a friendly human rhythm. The chosen conversation starter is ${topics[topic]}. The selected language is ${languages[language]}, but follow the language the person actually speaks and switch naturally if they switch languages. Do not keep returning to the topic if the person changes it. Avoid claiming to be human.`;

  try {
    const upstream = await fetch('https://api.openai.com/v1/live/sessions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          model: 'gpt-live-1',
          instructions,
          delegation: {
            type: 'responses',
            responses: {
              model: 'gpt-5.6-terra',
              instructions: 'Reason carefully about what the person said and the earlier conversation. Return a concise, relevant answer suitable for natural spoken dialogue. Do not invent facts.',
              tool_choice: 'auto',
            },
          },
        },
        transport: { type: 'webrtc', sdp: input.sdp },
      }),
    });

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Live session creation failed:', upstream.status);
      return json({ error: upstream.status === 401 ? 'The voice service key is invalid.' : 'Could not start the live voice service. Check its API access and billing setup.' }, 502);
    }
    return json(result, 201);
  } catch (error) {
    console.error('Live session request failed:', error?.name || 'unknown');
    return json({ error: 'Could not reach the live voice service. Check your internet connection.' }, 502);
  }
}
