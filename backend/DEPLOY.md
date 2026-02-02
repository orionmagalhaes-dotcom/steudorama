# EuDorama Backend Deployment Guide

Para que o site funcione completamente para outros usuários, o servidor backend deve estar online 24/7. Recomendo usar o **Render.com** (tem um plano gratuito bom).

### Passos para Hospedagem no Render:

1.  **Crie uma conta** no [Render.com](https://render.com).
2.  **Novo Web Service**: Conecte seu repositório do GitHub.
3.  **Configurações**:
    *   **Root Directory**: `backend`
    *   **Environment**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
4.  **Environment Variables**: Adicione as variáveis:
    *   `TMDB_API_KEY`: Sua chave do TMDB.
    *   `PORT`: `3001` (ou deixe o Render definir).
5.  **No Netlify**:
    *   Vá em **Site Settings > Build & deploy > Environment variables**.
    *   Atualize `NEXT_PUBLIC_BACKEND_URL` com a URL que o Render te der (ex: `https://eudorama-api.onrender.com`).

### O que o Backend faz?
*   **Raspagem Automática**: Busca novos episódios no KissAsian usando Puppeteer.
*   **Extração de Vídeo**: Limpa anúncios e extrai o link direto do player.
*   **Cache TMDB**: Salva dados para carregamento ultra-rápido.
