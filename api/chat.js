// api/chat.js - Roda direto no servidor da Vercel (Totalmente Blindex)
export default async function handler(req, res) {
    // Só aceita requisições do tipo POST (segurança)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { text } = req.body;
    
    // Aqui está o cofre: ele busca a chave salva de forma oculta na Vercel
    const apiKey = process.env.GROQ_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ error: 'Erro de configuração: Chave GROQ_API_KEY não encontrada no servidor.' });
    }

    try {
        // Conexão direta e ultra-rápida com a IA gratuita da Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Modelo rápido e gratuito
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
        return res.status(200).json(data);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Falha interna ao conectar com a matriz da IA.' });
    }
}