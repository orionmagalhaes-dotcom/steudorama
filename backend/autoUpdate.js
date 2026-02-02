/**
 * Content Auto-Update Service
 * Automatically syncs new content from TMDB and other sources
 */

const express = require('express');
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');
const cron = require('node-cron');

// Initialize database for caching
const dbPath = path.join(__dirname, 'content_cache.db');
let db;

function initDatabase() {
    db = new Database(dbPath);

    // Create tables for caching content
    db.exec(`
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY,
            title TEXT,
            original_title TEXT,
            overview TEXT,
            poster_path TEXT,
            backdrop_path TEXT,
            release_date TEXT,
            vote_average REAL,
            vote_count INTEGER,
            popularity REAL,
            genre_ids TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS tv_shows (
            id INTEGER PRIMARY KEY,
            name TEXT,
            original_name TEXT,
            overview TEXT,
            poster_path TEXT,
            backdrop_path TEXT,
            first_air_date TEXT,
            vote_average REAL,
            vote_count INTEGER,
            popularity REAL,
            origin_country TEXT,
            genre_ids TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sync_type TEXT,
            items_synced INTEGER,
            started_at DATETIME,
            completed_at DATETIME,
            status TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_movies_popularity ON movies(popularity DESC);
        CREATE INDEX IF NOT EXISTS idx_tv_popularity ON tv_shows(popularity DESC);
        CREATE INDEX IF NOT EXISTS idx_movies_vote ON movies(vote_average DESC);
        CREATE INDEX IF NOT EXISTS idx_tv_vote ON tv_shows(vote_average DESC);
    `);

    console.log('[AutoUpdate] Database initialized');
}

// TMDB API
const TMDB_API_KEY = process.env.TMDB_API_KEY || '4ba96d0b4ac61abdda626a8c9f3f89bb';
const tmdb = axios.create({
    baseURL: 'https://api.themoviedb.org/3',
    params: {
        api_key: TMDB_API_KEY,
        language: 'pt-BR',
    },
});

/**
 * Sync popular movies from TMDB
 */
async function syncPopularMovies(pages = 10) {
    console.log(`[AutoUpdate] Syncing popular movies (${pages} pages)...`);
    let totalSynced = 0;

    const insertMovie = db.prepare(`
        INSERT OR REPLACE INTO movies (id, title, original_title, overview, poster_path, backdrop_path, release_date, vote_average, vote_count, popularity, genre_ids, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (let page = 1; page <= pages; page++) {
        try {
            const response = await tmdb.get('/movie/popular', { params: { page } });

            for (const movie of response.data.results) {
                insertMovie.run(
                    movie.id,
                    movie.title,
                    movie.original_title,
                    movie.overview,
                    movie.poster_path,
                    movie.backdrop_path,
                    movie.release_date,
                    movie.vote_average,
                    movie.vote_count,
                    movie.popularity,
                    JSON.stringify(movie.genre_ids)
                );
                totalSynced++;
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 250));
        } catch (error) {
            console.error(`[AutoUpdate] Error syncing movies page ${page}:`, error.message);
        }
    }

    console.log(`[AutoUpdate] Synced ${totalSynced} movies`);
    return totalSynced;
}

/**
 * Sync popular TV shows from TMDB
 */
async function syncPopularTVShows(pages = 10) {
    console.log(`[AutoUpdate] Syncing popular TV shows (${pages} pages)...`);
    let totalSynced = 0;

    const insertShow = db.prepare(`
        INSERT OR REPLACE INTO tv_shows (id, name, original_name, overview, poster_path, backdrop_path, first_air_date, vote_average, vote_count, popularity, origin_country, genre_ids, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (let page = 1; page <= pages; page++) {
        try {
            const response = await tmdb.get('/tv/popular', { params: { page } });

            for (const show of response.data.results) {
                insertShow.run(
                    show.id,
                    show.name,
                    show.original_name,
                    show.overview,
                    show.poster_path,
                    show.backdrop_path,
                    show.first_air_date,
                    show.vote_average,
                    show.vote_count,
                    show.popularity,
                    JSON.stringify(show.origin_country),
                    JSON.stringify(show.genre_ids)
                );
                totalSynced++;
            }

            await new Promise(resolve => setTimeout(resolve, 250));
        } catch (error) {
            console.error(`[AutoUpdate] Error syncing TV page ${page}:`, error.message);
        }
    }

    console.log(`[AutoUpdate] Synced ${totalSynced} TV shows`);
    return totalSynced;
}

/**
 * Sync Asian dramas specifically
 */
async function syncAsianDramas(pagesPerCountry = 10) {
    console.log('[AutoUpdate] Syncing Asian dramas...');
    let totalSynced = 0;

    const countries = ['KR', 'JP', 'CN', 'TH', 'TW', 'HK', 'PH'];

    const insertShow = db.prepare(`
        INSERT OR REPLACE INTO tv_shows (id, name, original_name, overview, poster_path, backdrop_path, first_air_date, vote_average, vote_count, popularity, origin_country, genre_ids, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (const country of countries) {
        for (let page = 1; page <= pagesPerCountry; page++) {
            try {
                const response = await tmdb.get('/discover/tv', {
                    params: {
                        with_origin_country: country,
                        sort_by: 'popularity.desc',
                        page,
                    }
                });

                for (const show of response.data.results) {
                    insertShow.run(
                        show.id,
                        show.name,
                        show.original_name,
                        show.overview,
                        show.poster_path,
                        show.backdrop_path,
                        show.first_air_date,
                        show.vote_average,
                        show.vote_count,
                        show.popularity,
                        JSON.stringify(show.origin_country),
                        JSON.stringify(show.genre_ids)
                    );
                    totalSynced++;
                }

                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (error) {
                console.error(`[AutoUpdate] Error syncing ${country} page ${page}:`, error.message);
            }
        }
    }

    console.log(`[AutoUpdate] Synced ${totalSynced} Asian dramas`);
    return totalSynced;
}

/**
 * Sync latest changes from TMDB
 */
async function syncLatestChanges() {
    console.log('[AutoUpdate] Checking for latest changes...');

    try {
        // Get TV changes
        const tvChanges = await tmdb.get('/tv/changes', { params: { page: 1 } });
        const changedTVIds = tvChanges.data.results.map(r => r.id).slice(0, 50);

        // Get Movie changes
        const movieChanges = await tmdb.get('/movie/changes', { params: { page: 1 } });
        const changedMovieIds = movieChanges.data.results.map(r => r.id).slice(0, 50);

        console.log(`[AutoUpdate] Found ${changedTVIds.length} TV changes, ${changedMovieIds.length} movie changes`);

        // Update changed items
        for (const id of changedTVIds) {
            try {
                const response = await tmdb.get(`/tv/${id}`);
                const show = response.data;

                db.prepare(`
                    INSERT OR REPLACE INTO tv_shows (id, name, original_name, overview, poster_path, backdrop_path, first_air_date, vote_average, vote_count, popularity, origin_country, genre_ids, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `).run(
                    show.id,
                    show.name,
                    show.original_name,
                    show.overview,
                    show.poster_path,
                    show.backdrop_path,
                    show.first_air_date,
                    show.vote_average,
                    show.vote_count,
                    show.popularity,
                    JSON.stringify(show.origin_country || []),
                    JSON.stringify(show.genres?.map(g => g.id) || [])
                );

                await new Promise(resolve => setTimeout(resolve, 100));
            } catch {
                // Skip invalid IDs
            }
        }

        console.log('[AutoUpdate] Changes synced successfully');
    } catch (error) {
        console.error('[AutoUpdate] Error syncing changes:', error.message);
    }
}

/**
 * Full sync - runs all sync operations
 */
async function fullSync() {
    const startTime = new Date();
    console.log('[AutoUpdate] Starting full sync...');

    db.prepare(`
        INSERT INTO sync_log (sync_type, items_synced, started_at, status)
        VALUES ('full', 0, ?, 'running')
    `).run(startTime.toISOString());

    const syncId = db.prepare('SELECT last_insert_rowid() as id').get().id;

    try {
        let totalItems = 0;

        totalItems += await syncPopularMovies(20);
        totalItems += await syncPopularTVShows(20);
        totalItems += await syncAsianDramas(15);

        db.prepare(`
            UPDATE sync_log SET items_synced = ?, completed_at = ?, status = 'completed'
            WHERE id = ?
        `).run(totalItems, new Date().toISOString(), syncId);

        console.log(`[AutoUpdate] Full sync completed! ${totalItems} items synced.`);
    } catch (error) {
        db.prepare(`
            UPDATE sync_log SET completed_at = ?, status = 'failed'
            WHERE id = ?
        `).run(new Date().toISOString(), syncId);

        console.error('[AutoUpdate] Full sync failed:', error.message);
    }
}

/**
 * Setup auto-update routes
 */
function setupAutoUpdateRoutes(app) {
    initDatabase();

    // Get cached movies
    app.get('/api/cache/movies', (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const sortBy = req.query.sort || 'popularity';

        try {
            const movies = db.prepare(`
                SELECT * FROM movies ORDER BY ${sortBy} DESC LIMIT ? OFFSET ?
            `).all(limit, offset);

            const total = db.prepare('SELECT COUNT(*) as count FROM movies').get().count;

            res.json({ results: movies, total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get cached TV shows
    app.get('/api/cache/tv', (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const sortBy = req.query.sort || 'popularity';

        try {
            const shows = db.prepare(`
                SELECT * FROM tv_shows ORDER BY ${sortBy} DESC LIMIT ? OFFSET ?
            `).all(limit, offset);

            const total = db.prepare('SELECT COUNT(*) as count FROM tv_shows').get().count;

            res.json({ results: shows, total });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get cached Asian dramas
    app.get('/api/cache/dramas', (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const country = req.query.country;

        try {
            let query = 'SELECT * FROM tv_shows WHERE origin_country LIKE ?';
            const params = ['%"KR"%'];

            if (country) {
                params[0] = `%"${country}"%`;
            } else {
                // All Asian countries
                query = `SELECT * FROM tv_shows WHERE 
                    origin_country LIKE '%"KR"%' OR
                    origin_country LIKE '%"JP"%' OR
                    origin_country LIKE '%"CN"%' OR
                    origin_country LIKE '%"TH"%' OR
                    origin_country LIKE '%"TW"%'`;
            }

            query += ` ORDER BY popularity DESC LIMIT ${limit} OFFSET ${offset}`;

            const dramas = country
                ? db.prepare(query).all(...params)
                : db.prepare(query).all();

            res.json({ results: dramas, total: dramas.length });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Trigger manual sync (supports GET for browser and POST for API)
    app.get('/api/sync/full', async (req, res) => {
        res.json({ message: 'Full sync started in background. Check /api/sync/status for progress.' });
        fullSync();
    });

    app.post('/api/sync/full', async (req, res) => {
        res.json({ message: 'Full sync started in background' });
        fullSync();
    });

    // Trigger changes sync (supports GET for browser and POST for API)
    app.get('/api/sync/changes', async (req, res) => {
        res.json({ message: 'Changes sync started' });
        syncLatestChanges();
    });

    app.post('/api/sync/changes', async (req, res) => {
        res.json({ message: 'Changes sync started' });
        syncLatestChanges();
    });

    // Get sync status
    app.get('/api/sync/status', (req, res) => {
        try {
            const lastSync = db.prepare(`
                SELECT * FROM sync_log ORDER BY id DESC LIMIT 1
            `).get();

            const movieCount = db.prepare('SELECT COUNT(*) as count FROM movies').get().count;
            const tvCount = db.prepare('SELECT COUNT(*) as count FROM tv_shows').get().count;

            res.json({
                lastSync,
                counts: {
                    movies: movieCount,
                    tv_shows: tvCount,
                    total: movieCount + tvCount,
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Schedule automatic sync every 6 hours
    if (typeof cron !== 'undefined') {
        cron.schedule('0 */6 * * *', () => {
            console.log('[AutoUpdate] Running scheduled sync...');
            syncLatestChanges();
        });

        // Full sync every day at 3 AM
        cron.schedule('0 3 * * *', () => {
            console.log('[AutoUpdate] Running scheduled full sync...');
            fullSync();
        });
    }

    console.log('[AutoUpdate] Auto-update service initialized');
    console.log('[AutoUpdate] Scheduled: Changes sync every 6 hours, Full sync daily at 3 AM');
}

module.exports = { setupAutoUpdateRoutes, fullSync, syncLatestChanges };
