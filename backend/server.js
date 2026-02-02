const express = require('express');
const cors = require('cors');
const { extractVideoUrl } = require('./extractors/videoExtractor');
const { setupScraperRoutes } = require('./scraper');
const { setupAutoUpdateRoutes, fullSync } = require('./autoUpdate');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'EuDorama Backend está funcionando!',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/extract-video
 * Body: { url: string }
 * Response: { success: boolean, sources: VideoSource[], error?: string }
 */
app.post('/api/extract-video', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL é obrigatória',
            });
        }

        console.log(`[Extração] Processando URL: ${url}`);

        const sources = await extractVideoUrl(url);

        if (sources.length === 0) {
            return res.json({
                success: false,
                sources: [],
                error: 'Nenhuma fonte de vídeo encontrada',
            });
        }

        console.log(`[Extração] Encontradas ${sources.length} fonte(s)`);

        res.json({
            success: true,
            sources,
        });
    } catch (error) {
        console.error('[Extração] Erro:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao extrair vídeo',
        });
    }
});

// Setup scraper routes
try {
    setupScraperRoutes(app);
    console.log('[Scraper] Rotas do scraper carregadas');
} catch (error) {
    console.log('[Scraper] Não foi possível carregar o scraper:', error.message);
}

// Setup auto-update routes
try {
    setupAutoUpdateRoutes(app);
    console.log('[AutoUpdate] Rotas de auto-update carregadas');

    // Run initial sync if database is empty
    setTimeout(() => {
        console.log('[AutoUpdate] Verificando se é necessário sync inicial...');
    }, 5000);
} catch (error) {
    console.log('[AutoUpdate] Não foi possível carregar o auto-update:', error.message);
}

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║      EuDorama Backend - Full Catalog Server    ║
╠════════════════════════════════════════════════╣
║  Servidor rodando em:                          ║
║  http://localhost:${PORT}                           ║
║                                                ║
║  Endpoints:                                    ║
║  - POST /api/extract-video                     ║
║  - GET  /api/doramas                           ║
║  - GET  /api/doramas/:id/episodes              ║
║  - POST /api/scraper/run                       ║
║                                                ║
║  Auto-Update:                                  ║
║  - GET  /api/cache/movies                      ║
║  - GET  /api/cache/tv                          ║
║  - GET  /api/cache/dramas                      ║
║  - POST /api/sync/full                         ║
║  - POST /api/sync/changes                      ║
║  - GET  /api/sync/status                       ║
╚════════════════════════════════════════════════╝
  `);
});
