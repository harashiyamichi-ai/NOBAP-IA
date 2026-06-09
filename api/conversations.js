import { getSupabaseAdmin } from './supabase.js';

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // suportar POST (listar/criar/atualizar) e GET (listar)
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      // lista conversas do usuário anônimo (por session cookie/simple header)
      const authHeader = req.headers?.authorization || req.headers?.Authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
      if (!token) return res.status(401).json({ error: 'Missing/invalid Authorization token' });

      const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !user) return res.status(401).json({ error: userErr?.message || 'Unauthorized' });

      const userId = user.id;

      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });


      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ conversations: data || [] });
    }

    if (req.method === 'POST') {
      // em alguns runtimes o req.body já vem parseado; em outros precisa parse manual
      let body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        body = await parseJsonBody(req);
      }
      const action = body?.action;

      const authHeader = req.headers?.authorization || req.headers?.Authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

      // debug mínimo (sem vazar token)
      if (!token) {
        return res.status(401).json({ error: 'Missing/invalid Authorization token', gotAuthorizationHeader: !!authHeader });
      }


      const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !user) return res.status(401).json({ error: userErr?.message || 'Unauthorized' });

      const userId = user.id;

      if (action === 'create') {
        const { title } = body || {};
        const { data, error } = await supabase
          .from('conversations')
          .insert({ user_id: userId, title: title || 'Nova conversa' })
          .select('id, title, created_at, updated_at')
          .single();


        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ conversation: data });
      }

      if (action === 'getMessages') {
        const { conversationId } = body || {};
        if (!conversationId) return res.status(400).json({ error: 'Missing conversationId' });

        // valida que a conversa pertence ao usuário logado
        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .maybeSingle();

        if (convErr) return res.status(500).json({ error: convErr.message });
        if (!convData) return res.status(404).json({ error: 'Conversation not found' });

        const { data, error } = await supabase
          .from('messages')
          .select('id, sender, content, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });


        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ messages: data || [] });
      }

      if (action === 'append') {
        const { conversationId, sender, content } = body || {};
        if (!conversationId || !sender || typeof content !== 'string') {
          return res.status(400).json({ error: 'Missing params' });
        }

        // valida que a conversa pertence ao usuário logado
        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .maybeSingle();

        if (convErr) return res.status(500).json({ error: convErr.message });
        if (!convData) return res.status(404).json({ error: 'Conversation not found' });

        const { error: appendErr } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender,
          content,
        });

        if (appendErr) return res.status(500).json({ error: appendErr.message });

        const { error: updateErr } = await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);


        if (updateErr) return res.status(500).json({ error: updateErr.message });

        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

