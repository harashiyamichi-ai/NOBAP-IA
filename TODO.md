# TODO (Jarvis Google Login + API Auth)

- [x] Entender estrutura do projeto (frontend index.html e handlers em api/).
- [x] Proteger `/api/chat` com validação de Authorization Bearer (Supabase token).
- [x] Proteger `/api/conversations` removendo `x-user-id` e usando `supabase.auth.getUser(token)`.
- [x] Validar ownership de conversationId em `getMessages` e `append`.
- [x] Atualizar `index.html` para:
  - [x] Inicializar Supabase client via `window.SUPABASE_URL` e `window.SUPABASE_ANON_KEY`.
  - [x] Botão Login Google e logout.
  - [x] Enviar Authorization Bearer para `/api/chat` e `/api/conversations`.
  - [x] Registrar mensagens do usuário no endpoint `/api/conversations`.
- [ ] (Próximo passo obrigatório) Sincronizar conversas do Supabase no frontend (listar/criar conversations e carregar messages) para substituir localStorage como fonte principal.
- [ ] Criar fallback: se não houver conversationId, criar via `/api/conversations` (action create) e usar o id retornado.
- [ ] Validar fluxo completo em ambiente real (configurar env vars e redirect URL do Google/Supabase).

