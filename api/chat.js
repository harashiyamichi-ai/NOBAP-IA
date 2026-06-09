// api/chat.js - Roda direto no servidor da Vercel (Totalmente Blindex)
import { getSupabaseAdmin } from './supabase.js';

export default async function handler(req, res) {
    // Só aceita requisições do tipo POST (segurança)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) return res.status(401).json({ error: 'Missing/invalid Authorization token', gotAuthorizationHeader: !!authHeader });


    try {
        const supabase = getSupabaseAdmin();
        const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !user) return res.status(401).json({ error: userErr?.message || 'Unauthorized' });

        const { text } = req.body;

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Erro de configuração: Chave GROQ_API_KEY não encontrada no servidor.' });
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    {
                        role: "system",
                        content: "Você é o Jarvis, uma inteligência artificial séria, altamente tecnológica, de elite e prestativa desenvolvida pela Nobap. Suas respostas devem ser precisas, diretas e manter uma postura corporativa avançada, sem gírias excessivas."
                    },
                    { role: "user", content: text }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        const content =
            data?.choices?.[0]?.message?.content ??
            data?.choices?.[0]?.text ??
            null;

        return res.status(200).json({
            content,
            raw: data,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Falha interna ao conectar com a matriz da IA.' });
    }
}
