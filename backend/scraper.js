const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuração do banco de dados SQLite
const Database = require('better-sqlite3');
// DB path: Use /data for persistent storage on Render/Railway, or local if developing
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'doramas.db');

// TMDB API KEY (Same as frontend for consistency, or from env)
const TMDB_API_KEY = process.env.TMDB_API_KEY || '4ba96d0b4ac61abdda626a8c9f3f89bb';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Garante que o diretório existe
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Cria tabelas
db.exec(`
    CREATE TABLE IF NOT EXISTS series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tmdb_id INTEGER UNIQUE,
        title TEXT NOT NULL,
        original_title TEXT,
        source_url TEXT,
        source_provider TEXT,
        poster_path TEXT,
        origin_country TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id INTEGER,
        season_number INTEGER DEFAULT 1,
        episode_number INTEGER NOT NULL,
        title TEXT,
        source_url TEXT,
        video_url TEXT,
        has_portuguese_sub BOOLEAN DEFAULT FALSE,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (series_id) REFERENCES series(id),
        UNIQUE(series_id, season_number, episode_number)
    );
`);

// Sites de doramas para scraping
const DORAMA_SITES = [
    {
        name: 'KissAsian',
        baseUrl: 'https://kissasian.cam',
        listUrl: '/DramaList',
        recentUrl: '/Status/Ongoing',
        selectors: {
            dramaList: '.item-drama a, .drama-item a, .list-item a, table.listing td a',
            episodeList: '.episode-list a, .list-episode a, table.listing td a',
            videoPlayer: 'iframe#myvideo'
        }
    }
];

/**
 * Scraper principal
 */
class DoramaScraper {
    constructor() {
        this.browser = null;
    }

    async init() {
        console.log('🚀 Iniciando scraper de doramas...');
        try {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            });
        } catch (e) {
            console.error('❌ Erro ao iniciar Puppeteer:', e.message);
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * Busca informações no TMDB
     */
    async searchTmdb(title) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
                params: {
                    api_key: TMDB_API_KEY,
                    query: title,
                    language: 'pt-BR'
                }
            });

            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                return {
                    tmdb_id: result.id,
                    poster_path: result.poster_path,
                    origin_country: result.origin_country ? result.origin_country[0] : 'KR'
                };
            }
        } catch (error) {
            console.error(`  ⚠️ Erro TMDB para "${title}":`, error.message);
        }
        return null;
    }

    /**
     * Busca lista de doramas recentes
     */
    async scrapeRecentDramas(site) {
        if (!this.browser) return [];
        const page = await this.browser.newPage();
        const dramas = [];

        try {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Bloqueia imagens e outros recursos pesados
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            console.log(`  🌐 Acessando ${site.name}...`);
            await page.goto(site.baseUrl + (site.recentUrl || ''), {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            const links = await page.$$(site.selectors.dramaList);
            const seen = new Set();

            for (const link of links.slice(0, 30)) {
                const href = await page.evaluate(el => el.getAttribute('href'), link);
                const text = await page.evaluate(el => el.textContent, link);

                if (href && text && text.trim().length > 2 && !seen.has(href)) {
                    seen.add(href);
                    dramas.push({
                        title: text.trim(),
                        url: href.startsWith('http') ? href : site.baseUrl + href
                    });
                }
            }

            console.log(`  ✅ ${site.name}: Encontrados ${dramas.length} doramas`);
        } catch (error) {
            console.error(`  ❌ Erro ao scrape ${site.name}:`, error.message);
        } finally {
            await page.close();
        }

        return dramas;
    }

    /**
     * Busca episódios de um dorama
     */
    async scrapeEpisodes(site, dramaUrl) {
        if (!this.browser) return [];
        const page = await this.browser.newPage();
        const episodes = [];

        try {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await page.goto(dramaUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            const links = await page.$$(site.selectors.episodeList || 'a[href*="Episode"]');
            for (const link of links) {
                const href = await page.evaluate(el => el.getAttribute('href'), link);
                const text = await page.evaluate(el => el.textContent, link);

                if (href) {
                    const episodeMatch = text?.match(/Episode\s*(\d+)/i) || href.match(/Episode-?(\d+)/i);
                    episodes.push({
                        number: episodeMatch ? parseInt(episodeMatch[1]) : episodes.length + 1,
                        title: text?.trim() || `Episódio ${episodes.length + 1}`,
                        url: href.startsWith('http') ? href : site.baseUrl + href
                    });
                }
            }

            console.log(`    📺 Encontrados ${episodes.length} episódios`);
        } catch (error) {
            console.error(`    ❌ Erro ao buscar episódios:`, error.message);
        } finally {
            await page.close();
        }

        return episodes;
    }

    /**
     * Salva dorama no banco de dados
     */
    async saveDrama(drama, provider) {
        // Tenta buscar no TMDB primeiro
        const tmdbData = await this.searchTmdb(drama.title);

        const stmt = db.prepare(`
            INSERT INTO series (title, tmdb_id, poster_path, origin_country, source_url, source_provider, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(tmdb_id) DO UPDATE SET
                last_updated = datetime('now'),
                source_url = excluded.source_url
        `);

        try {
            const result = stmt.run(
                drama.title,
                tmdbData?.tmdb_id || null,
                tmdbData?.poster_path || null,
                tmdbData?.origin_country || 'KR',
                drama.url,
                provider
            );

            if (result.lastInsertRowid > 0) return result.lastInsertRowid;

            // Se não inseriu, pega o ID existente
            const existing = db.prepare('SELECT id FROM series WHERE tmdb_id = ? OR source_url = ?').get(tmdbData?.tmdb_id, drama.url);
            return existing ? existing.id : -1;
        } catch (e) {
            const existing = db.prepare('SELECT id FROM series WHERE source_url = ?').get(drama.url);
            return existing ? existing.id : -1;
        }
    }

    /**
     * Salva episódio no banco de dados
     */
    saveEpisode(seriesId, episode) {
        if (seriesId <= 0) return;

        const stmt = db.prepare(`
            INSERT OR IGNORE INTO episodes (series_id, episode_number, title, source_url, last_updated)
            VALUES (?, ?, ?, ?, datetime('now'))
        `);

        stmt.run(seriesId, episode.number, episode.title, episode.url);
    }

    /**
     * Executa scraping completo
     */
    async run() {
        await this.init();
        if (!this.browser) return;

        for (const site of DORAMA_SITES) {
            console.log(`\n📡 Processando ${site.name}...`);

            try {
                const dramas = await this.scrapeRecentDramas(site);

                for (const drama of dramas.slice(0, 15)) {
                    console.log(`  🎬 ${drama.title}`);
                    const seriesId = await this.saveDrama(drama, site.name);

                    if (seriesId > 0 && drama.url) {
                        const episodes = await this.scrapeEpisodes(site, drama.url);
                        for (const episode of episodes) {
                            this.saveEpisode(seriesId, episode);
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Erro em ${site.name}:`, error.message);
            }
        }

        await this.close();
        console.log('\n✅ Scraping concluído!');
    }
}

// API endpoints para o servidor Express
function setupScraperRoutes(app) {
    // Lista doramas do banco de dados
    app.get('/api/doramas', (req, res) => {
        const dramas = db.prepare('SELECT * FROM series ORDER BY last_updated DESC LIMIT 100').all();
        res.json(dramas);
    });

    // Lista episódios de um dorama
    app.get('/api/doramas/:id/episodes', (req, res) => {
        const episodes = db.prepare(
            'SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number'
        ).all(req.params.id);
        res.json(episodes);
    });

    // Executa scraping manualmente
    app.post('/api/scraper/run', async (req, res) => {
        const scraper = new DoramaScraper();
        try {
            await scraper.run();
            res.json({ success: true, message: 'Scraping concluído' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Busca dorama por nome
    app.get('/api/doramas/search', (req, res) => {
        const query = req.query.q || '';
        const dramas = db.prepare(
            'SELECT * FROM series WHERE title LIKE ? ORDER BY last_updated DESC LIMIT 20'
        ).all(`%${query}%`);
        res.json(dramas);
    });
}

module.exports = { DoramaScraper, setupScraperRoutes };

// Executa se chamado diretamente
if (require.main === module) {
    const scraper = new DoramaScraper();
    scraper.run().catch(console.error);
}
