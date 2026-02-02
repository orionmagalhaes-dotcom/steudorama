# EuDorama - Plataforma de Streaming de Doramas 🎬

Uma plataforma de streaming estilo Netflix focada em doramas asiáticos (coreanos, japoneses e chineses), com interface totalmente em português brasileiro.

## 🚀 Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Player**: Plyr com suporte a HLS (.m3u8)
- **Backend**: Node.js, Express
- **Scraper**: Python, Playwright
- **Banco de Dados**: SQLite

## 📁 Estrutura do Projeto

```
eudorama/
├── src/                          # Frontend Next.js
│   ├── app/                      # Páginas e layouts
│   ├── components/               # Componentes React
│   │   ├── Header.tsx           # Navegação principal
│   │   ├── VideoCard.tsx        # Card de dorama
│   │   ├── Carousel.tsx         # Carrossel horizontal
│   │   ├── HeroBanner.tsx       # Banner principal
│   │   └── VideoPlayer.tsx      # Player de vídeo customizado
│   ├── services/                 # Serviços e APIs
│   │   └── tmdb.ts              # Integração TMDB
│   └── types/                    # TypeScript types
│       └── tmdb.ts              # Interfaces TMDB
├── backend/                      # Backend Node.js
│   ├── server.js                # Servidor Express
│   └── extractors/              # Extratores de vídeo
│       └── videoExtractor.js    # Lógica de extração
└── scraper/                      # Scraper Python
    ├── kissasian_scraper.py     # Scraper KissAsian
    ├── database.py              # Banco de dados SQLite
    └── run_daily.py             # Agendador diário
```

## 🛠️ Instalação

### 1. Frontend (Next.js)

```bash
cd eudorama
npm install
```

Crie um arquivo `.env.local` com sua chave da API do TMDB:
```
NEXT_PUBLIC_TMDB_API_KEY=sua_chave_aqui
```

### 2. Backend (Node.js)

```bash
cd backend
npm install
```

### 3. Scraper (Python)

```bash
cd scraper
pip install -r requirements.txt
playwright install chromium
```

## 🚀 Execução

### Frontend
```bash
npm run dev
# Acesse http://localhost:3000
```

### Backend
```bash
cd backend
npm start
# API em http://localhost:3001
```

### Scraper
```bash
cd scraper

# Execução única
python kissasian_scraper.py

# Execução agendada (4x ao dia)
python run_daily.py
```

## 🔌 API Endpoints

### Backend

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Status do servidor |
| POST | `/api/extract-video` | Extrai URLs de vídeo |

**Exemplo de uso:**
```bash
curl -X POST http://localhost:3001/api/extract-video \
  -H "Content-Type: application/json" \
  -d '{"url": "https://exemplo.com/video"}'
```

## 📺 Funcionalidades

- ✅ Interface Netflix-like em português
- ✅ Carrosséis de doramas por categoria
- ✅ Busca de doramas coreanos, japoneses e chineses via TMDB
- ✅ Player de vídeo com suporte a MP4 e HLS
- ✅ Extração automática de links de vídeo
- ✅ Scraper de novos episódios do KissAsian
- ✅ Banco de dados local com SQLite

## 🔑 Configuração da API TMDB

1. Crie uma conta em [themoviedb.org](https://www.themoviedb.org/)
2. Vá em Settings > API
3. Solicite uma chave de API
4. Adicione ao arquivo `.env.local`

## ⚠️ Avisos Legais

Este projeto é para fins educacionais. O uso de scrapers pode violar os termos de serviço de alguns sites. Use com responsabilidade.

## 📄 Licença

MIT License
