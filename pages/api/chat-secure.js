// pages/api/chat-secure.js
// Endpoint para o Vercel (Next.js). Exige token para bloquear chamadas diretas.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authHeader = req.headers.authorization || '';
  const token = process.env.CHAT_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Erro de configuração: CHAT_TOKEN não definido.' });
  }

  // Espera: Authorization: Bearer <token>
  const expected = `Bearer ${token}`;
  if (authHeader !== expected) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Texto inválido' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'Erro de configuração: Chave GROQ_API_KEY não encontrada no servidor.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content:
              'Você é o Jarvis, uma inteligência artificial séria, altamente tecnológica, de elite e prestativa desenvolvida pela Nobap. Suas respostas devem ser precisas, diretas e manter uma postura corporativa avançada, sem gírias excessivas.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : 500).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Falha interna ao conectar com a matriz da IA.' });
  }
}

