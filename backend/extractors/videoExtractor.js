const axios = require('axios');
const cheerio = require('cheerio');

// Padrões de anúncios e trackers a serem removidos
const AD_PATTERNS = [
    /googlesyndication/i,
    /googleadservices/i,
    /doubleclick/i,
    /adservice/i,
    /adsense/i,
    /popads/i,
    /pop\.(js|php)/i,
    /ads\./i,
    /tracker/i,
    /analytics/i,
    /facebook\.net/i,
    /fbcdn/i,
    /advertisement/i,
    /popup/i,
    /banner/i,
];

// Padrões para encontrar URLs de vídeo
const VIDEO_PATTERNS = {
    mp4: /https?:\/\/[^\s"'<>]+\.mp4(\?[^\s"'<>]*)?/gi,
    m3u8: /https?:\/\/[^\s"'<>]+\.m3u8(\?[^\s"'<>]*)?/gi,
    directMp4: /["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
    directM3u8: /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
};

/**
 * Remove scripts de anúncios do HTML
 * @param {string} html 
 * @returns {string}
 */
function removeAdScripts(html) {
    const $ = cheerio.load(html);

    // Remove scripts de anúncios
    $('script').each((_, element) => {
        const src = $(element).attr('src') || '';
        const content = $(element).html() || '';

        const isAd = AD_PATTERNS.some(pattern =>
            pattern.test(src) || pattern.test(content)
        );

        if (isAd) {
            $(element).remove();
        }
    });

    // Remove iframes de anúncios
    $('iframe').each((_, element) => {
        const src = $(element).attr('src') || '';
        const isAd = AD_PATTERNS.some(pattern => pattern.test(src));

        if (isAd) {
            $(element).remove();
        }
    });

    return $.html();
}

/**
 * Detecta o tipo de vídeo
 * @param {string} url 
 * @returns {'mp4' | 'hls' | 'm3u8'}
 */
function detectVideoType(url) {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mp4')) return 'mp4';
    return 'mp4';
}

/**
 * Extrai URLs de vídeo de uma página
 * @param {string} pageUrl 
 * @returns {Promise<Array<{url: string, quality: string, type: string}>>}
 */
async function extractVideoUrl(pageUrl) {
    const sources = [];
    const foundUrls = new Set();

    try {
        // Busca o conteúdo da página
        const response = await axios.get(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': new URL(pageUrl).origin,
            },
            timeout: 15000,
        });

        // Remove scripts de anúncios
        const cleanHtml = removeAdScripts(response.data);
        const $ = cheerio.load(cleanHtml);

        // Método 1: Busca em tags <source>
        $('source').each((_, element) => {
            const src = $(element).attr('src');
            if (src && (src.includes('.mp4') || src.includes('.m3u8'))) {
                if (!foundUrls.has(src) && !isAdUrl(src)) {
                    foundUrls.add(src);
                    sources.push({
                        url: resolveUrl(src, pageUrl),
                        quality: detectQuality(src),
                        type: detectVideoType(src),
                    });
                }
            }
        });

        // Método 2: Busca em tags <video>
        $('video').each((_, element) => {
            const src = $(element).attr('src');
            if (src && (src.includes('.mp4') || src.includes('.m3u8'))) {
                if (!foundUrls.has(src) && !isAdUrl(src)) {
                    foundUrls.add(src);
                    sources.push({
                        url: resolveUrl(src, pageUrl),
                        quality: detectQuality(src),
                        type: detectVideoType(src),
                    });
                }
            }
        });

        // Método 3: Busca em scripts inline
        const htmlContent = response.data;

        // Busca padrões de M3U8
        const m3u8Matches = htmlContent.matchAll(VIDEO_PATTERNS.directM3u8);
        for (const match of m3u8Matches) {
            const url = match[1];
            if (!foundUrls.has(url) && !isAdUrl(url)) {
                foundUrls.add(url);
                sources.push({
                    url: resolveUrl(url, pageUrl),
                    quality: detectQuality(url),
                    type: 'hls',
                });
            }
        }

        // Busca padrões de MP4
        const mp4Matches = htmlContent.matchAll(VIDEO_PATTERNS.directMp4);
        for (const match of mp4Matches) {
            const url = match[1];
            if (!foundUrls.has(url) && !isAdUrl(url)) {
                foundUrls.add(url);
                sources.push({
                    url: resolveUrl(url, pageUrl),
                    quality: detectQuality(url),
                    type: 'mp4',
                });
            }
        }

        // Método 4: Busca em iframes (fontes embutidas)
        const iframeSrcs = [];
        $('iframe').each((_, element) => {
            const src = $(element).attr('src');
            if (src && !isAdUrl(src)) {
                iframeSrcs.push(resolveUrl(src, pageUrl));
            }
        });

        // Processa iframes em paralelo
        for (const iframeSrc of iframeSrcs.slice(0, 3)) { // Limita a 3 iframes
            try {
                const iframeSources = await extractFromIframe(iframeSrc, pageUrl);
                for (const source of iframeSources) {
                    if (!foundUrls.has(source.url)) {
                        foundUrls.add(source.url);
                        sources.push(source);
                    }
                }
            } catch (err) {
                console.log(`[Iframe] Erro ao processar: ${iframeSrc}`);
            }
        }

    } catch (error) {
        console.error(`[Extração] Erro na URL ${pageUrl}:`, error.message);
        throw error;
    }

    // Ordena por qualidade (maior primeiro)
    sources.sort((a, b) => {
        const qualityOrder = { '1080p': 4, '720p': 3, '480p': 2, '360p': 1, 'auto': 0 };
        return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
    });

    return sources;
}

/**
 * Extrai vídeos de um iframe
 * @param {string} iframeSrc 
 * @param {string} referer 
 * @returns {Promise<Array>}
 */
async function extractFromIframe(iframeSrc, referer) {
    const sources = [];

    try {
        const response = await axios.get(iframeSrc, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': referer,
            },
            timeout: 10000,
        });

        const html = response.data;

        // Busca M3U8
        const m3u8Matches = html.matchAll(VIDEO_PATTERNS.directM3u8);
        for (const match of m3u8Matches) {
            const url = match[1];
            if (!isAdUrl(url)) {
                sources.push({
                    url: resolveUrl(url, iframeSrc),
                    quality: detectQuality(url),
                    type: 'hls',
                });
            }
        }

        // Busca MP4
        const mp4Matches = html.matchAll(VIDEO_PATTERNS.directMp4);
        for (const match of mp4Matches) {
            const url = match[1];
            if (!isAdUrl(url)) {
                sources.push({
                    url: resolveUrl(url, iframeSrc),
                    quality: detectQuality(url),
                    type: 'mp4',
                });
            }
        }
    } catch (error) {
        // Silently fail for iframe extraction
    }

    return sources;
}

/**
 * Verifica se URL é de anúncio
 * @param {string} url 
 * @returns {boolean}
 */
function isAdUrl(url) {
    return AD_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Resolve URL relativa
 * @param {string} url 
 * @param {string} base 
 * @returns {string}
 */
function resolveUrl(url, base) {
    try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return new URL(url, base).href;
    } catch {
        return url;
    }
}

/**
 * Detecta qualidade do vídeo pela URL
 * @param {string} url 
 * @returns {string}
 */
function detectQuality(url) {
    if (/1080p|1080\./.test(url)) return '1080p';
    if (/720p|720\./.test(url)) return '720p';
    if (/480p|480\./.test(url)) return '480p';
    if (/360p|360\./.test(url)) return '360p';
    return 'auto';
}

module.exports = { extractVideoUrl };
