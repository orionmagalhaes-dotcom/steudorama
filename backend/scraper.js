/**
 * Scraper de Doramas em Node.js
 * Substitui o scraper Python - não precisa de Python instalado
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados SQLite
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', 'data', 'doramas.db');

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
        FOREIGN KEY (series_id) REFERENCES series(id)
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
            dramaList: 'table.listing td a',
            episodeList: 'table.listing td a',
            videoPlayer: 'iframe#myvideo'
        }
    },
    {
        name: 'KissKH',
        baseUrl: 'https://kisskh.co',
        apiUrl: '/api/DramaList/List?status=1&type=0&sub=0&country=0&order=2&pageSize=50',
        getEpisodes: '/api/DramaList/Drama/',
        selectors: {
            videoPlayer: 'video source'
        }
    },
    {
        name: 'Dramacool',
        baseUrl: 'https://dramacool.pa',
        recentUrl: '/recently-added-drama',
        selectors: {
            dramaList: '.list-star-video .img a',
            episodeList: '.list-episode li a'
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
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * Busca lista de doramas recentes
     */
    async scrapeRecentDramas(site) {
        const page = await this.browser.newPage();
        const dramas = [];

        try {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // KissKH usa API
            if (site.name === 'KissKH') {
                const response = await page.goto(site.baseUrl + site.apiUrl, {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });
                const data = await response.json();

                for (const drama of data.data || []) {
                    dramas.push({
                        title: drama.title,
                        id: drama.id,
                        url: `${site.baseUrl}/Drama/${drama.id}`,
                        episodes: drama.episodesCount
                    });
                }
            } else {
                // HTML scraping para outros sites
                await page.goto(site.baseUrl + (site.recentUrl || site.listUrl), {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });

                const links = await page.$$(site.selectors.dramaList);
                for (const link of links.slice(0, 50)) {
                    const href = await link.getAttribute('href');
                    const text = await link.textContent();
                    if (href && text) {
                        dramas.push({
                            title: text.trim(),
                            url: href.startsWith('http') ? href : site.baseUrl + href
                        });
                    }
                }
            }

            console.log(`✅ ${site.name}: Encontrados ${dramas.length} doramas`);
        } catch (error) {
            console.error(`❌ Erro ao scrape ${site.name}:`, error.message);
        } finally {
            await page.close();
        }

        return dramas;
    }

    /**
     * Busca episódios de um dorama
     */
    async scrapeEpisodes(site, dramaUrl) {
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
                const href = await link.getAttribute('href');
                const text = await link.textContent();
                if (href) {
                    const episodeMatch = text?.match(/Episode\s*(\d+)/i) || href.match(/Episode-?(\d+)/i);
                    episodes.push({
                        number: episodeMatch ? parseInt(episodeMatch[1]) : episodes.length + 1,
                        title: text?.trim() || `Episódio ${episodes.length + 1}`,
                        url: href.startsWith('http') ? href : site.baseUrl + href
                    });
                }
            }

            console.log(`  📺 Encontrados ${episodes.length} episódios`);
        } catch (error) {
            console.error(`  ❌ Erro ao buscar episódios:`, error.message);
        } finally {
            await page.close();
        }

        return episodes;
    }

    /**
     * Salva dorama no banco de dados
     */
    saveDrama(drama, provider) {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO series (title, original_title, source_url, source_provider, last_updated)
            VALUES (?, ?, ?, ?, datetime('now'))
        `);

        const result = stmt.run(drama.title, drama.title, drama.url, provider);
        return result.lastInsertRowid;
    }

    /**
     * Salva episódio no banco de dados
     */
    saveEpisode(seriesId, episode) {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO episodes (series_id, episode_number, title, source_url, last_updated)
            VALUES (?, ?, ?, ?, datetime('now'))
        `);

        stmt.run(seriesId, episode.number, episode.title, episode.url);
    }

    /**
     * Executa scraping completo
     */
    async run() {
        await this.init();

        for (const site of DORAMA_SITES) {
            console.log(`\n📡 Processando ${site.name}...`);

            try {
                const dramas = await this.scrapeRecentDramas(site);

                for (const drama of dramas.slice(0, 20)) {
                    console.log(`  🎬 ${drama.title}`);
                    const seriesId = this.saveDrama(drama, site.name);

                    if (drama.url) {
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
