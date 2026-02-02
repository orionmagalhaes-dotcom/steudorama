import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export type AudioLanguage = 'original' | 'pt-BR' | 'en' | 'es';

export interface VideoSource {
    url: string;
    quality: string;
    type: 'mp4' | 'hls' | 'embed';
    provider?: string;
    hasPortugueseSub?: boolean;
    hasDubbing?: boolean;
    language?: AudioLanguage;
    languageLabel?: string;
}

/**
 * Busca fontes de vídeo usando o TMDB ID
 * Suporta seleção de idioma/dublagem
 */
export async function fetchVideoSourcesByTmdbId(
    tmdbId: number,
    seasonNumber: number = 1,
    episodeNumber: number = 1,
    isMovie: boolean = false,
    preferredLanguage: AudioLanguage = 'original'
): Promise<VideoSource[]> {
    const sources: VideoSource[] = [];
    const mediaType = isMovie ? 'movie' : 'tv';
    const episodePath = isMovie ? '' : `/${seasonNumber}/${episodeNumber}`;
    const episodeQuery = isMovie ? '' : `&s=${seasonNumber}&e=${episodeNumber}`;

    // ============================================
    // FONTES COM DUBLAGEM PORTUGUÊS BRASILEIRO
    // ============================================

    if (preferredLanguage === 'pt-BR' || preferredLanguage === 'original') {
        // VidSrc.cc com preferência para PT-BR
        sources.push({
            url: `https://vidsrc.cc/v2/embed/${mediaType}/${tmdbId}${episodePath}?lang=pt`,
            quality: 'HD',
            type: 'embed',
            provider: 'VidSrc (PT-BR)',
            hasPortugueseSub: true,
            hasDubbing: true,
            language: 'pt-BR',
            languageLabel: '🇧🇷 Português (BR)'
        });

        // SuperEmbed PT-BR
        sources.push({
            url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1${episodeQuery}&lang=pt-br`,
            quality: 'HD',
            type: 'embed',
            provider: 'MultiEmbed (PT-BR)',
            hasPortugueseSub: true,
            hasDubbing: true,
            language: 'pt-BR',
            languageLabel: '🇧🇷 Português (BR)'
        });

        // Embed.su PT-BR
        sources.push({
            url: `https://embed.su/embed/${mediaType}/${tmdbId}${episodePath}?audio=pt`,
            quality: 'HD',
            type: 'embed',
            provider: 'EmbedSU (PT-BR)',
            hasPortugueseSub: true,
            hasDubbing: true,
            language: 'pt-BR',
            languageLabel: '🇧🇷 Português (BR)'
        });
    }

    // ============================================
    // FONTES EM INGLÊS
    // ============================================

    if (preferredLanguage === 'en' || preferredLanguage === 'original') {
        sources.push({
            url: `https://vidsrc.cc/v2/embed/${mediaType}/${tmdbId}${episodePath}`,
            quality: 'HD',
            type: 'embed',
            provider: 'VidSrc (EN)',
            language: 'en',
            languageLabel: '🇺🇸 English'
        });

        sources.push({
            url: `https://vidsrc.pro/embed/${mediaType}/${tmdbId}${episodePath}`,
            quality: 'HD',
            type: 'embed',
            provider: 'VidSrc Pro (EN)',
            language: 'en',
            languageLabel: '🇺🇸 English'
        });
    }

    // ============================================
    // FONTES EM ESPANHOL
    // ============================================

    if (preferredLanguage === 'es' || preferredLanguage === 'original') {
        sources.push({
            url: `https://vidsrc.cc/v2/embed/${mediaType}/${tmdbId}${episodePath}?lang=es`,
            quality: 'HD',
            type: 'embed',
            provider: 'VidSrc (ES)',
            language: 'es',
            languageLabel: '🇪🇸 Español'
        });

        sources.push({
            url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1${episodeQuery}&lang=es`,
            quality: 'HD',
            type: 'embed',
            provider: 'MultiEmbed (ES)',
            language: 'es',
            languageLabel: '🇪🇸 Español'
        });
    }

    // ============================================
    // FONTES ORIGINAIS (Áudio Original + Legendas)
    // ============================================

    // 2Embed
    sources.push({
        url: isMovie
            ? `https://www.2embed.cc/embed/${tmdbId}`
            : `https://www.2embed.cc/embedtv/${tmdbId}&s=${seasonNumber}&e=${episodeNumber}`,
        quality: 'HD',
        type: 'embed',
        provider: '2Embed',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    // VidSrc.icu
    sources.push({
        url: `https://vidsrc.icu/embed/${mediaType}/${tmdbId}${episodePath}`,
        quality: 'HD',
        type: 'embed',
        provider: 'VidSrc Asian',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    // VidLink
    sources.push({
        url: `https://vidlink.pro/${mediaType}/${tmdbId}${episodePath}`,
        quality: 'HD',
        type: 'embed',
        provider: 'VidLink',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    // AutoEmbed
    sources.push({
        url: `https://player.autoembed.cc/embed/${mediaType}/${tmdbId}${episodePath}`,
        quality: 'HD',
        type: 'embed',
        provider: 'AutoEmbed',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    // MoviesAPI
    sources.push({
        url: isMovie
            ? `https://moviesapi.club/movie/${tmdbId}`
            : `https://moviesapi.club/tv/${tmdbId}-${seasonNumber}-${episodeNumber}`,
        quality: 'HD',
        type: 'embed',
        provider: 'MoviesAPI',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    // Smashystream
    sources.push({
        url: isMovie
            ? `https://player.smashy.stream/movie/${tmdbId}`
            : `https://player.smashy.stream/tv/${tmdbId}?s=${seasonNumber}&e=${episodeNumber}`,
        quality: 'HD',
        type: 'embed',
        provider: 'Smashy',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    // NontonGo
    sources.push({
        url: `https://www.NontonGo.win/embed/${mediaType}/${tmdbId}${episodePath}`,
        quality: 'HD',
        type: 'embed',
        provider: 'NontonGo',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    // AnyEmbed
    sources.push({
        url: `https://anyembed.xyz/${mediaType}/${tmdbId}${episodePath}`,
        quality: 'HD',
        type: 'embed',
        provider: 'AnyEmbed',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    return sources;
}

/**
 * Filtra fontes por idioma
 */
export function filterSourcesByLanguage(sources: VideoSource[], language: AudioLanguage): VideoSource[] {
    if (language === 'original') {
        return sources;
    }
    return sources.filter(s => s.language === language || s.language === 'original');
}

/**
 * Agrupa fontes por idioma
 */
export function groupSourcesByLanguage(sources: VideoSource[]): Record<AudioLanguage, VideoSource[]> {
    const grouped: Record<AudioLanguage, VideoSource[]> = {
        'original': [],
        'pt-BR': [],
        'en': [],
        'es': [],
    };

    sources.forEach(source => {
        const lang = source.language || 'original';
        if (grouped[lang]) {
            grouped[lang].push(source);
        }
    });

    return grouped;
}

/**
 * Busca fontes específicas para doramas por nome
 */
export async function fetchDoramaSources(
    dramaName: string,
    episodeNumber: number
): Promise<VideoSource[]> {
    const sources: VideoSource[] = [];
    const slug = dramaName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // KissKH - Especializado em doramas
    sources.push({
        url: `https://kisskh.co/Drama/${slug}/Episode-${episodeNumber}?sub=pt`,
        quality: 'HD',
        type: 'embed',
        provider: 'KissKH',
        hasPortugueseSub: true,
        language: 'original',
        languageLabel: '🌍 Original + Legendas'
    });

    // Dramacool
    sources.push({
        url: `https://dramacool.pa/drama-detail/${slug}/episode-${episodeNumber}`,
        quality: 'HD',
        type: 'embed',
        provider: 'Dramacool',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    // KissAsian
    sources.push({
        url: `https://kissasian.li/Drama/${slug}/Episode-${episodeNumber}`,
        quality: 'HD',
        type: 'embed',
        provider: 'KissAsian',
        language: 'original',
        languageLabel: '🌍 Original'
    });

    return sources;
}

/**
 * Tenta extrair URL direta via backend
 */
export async function extractDirectUrl(pageUrl: string): Promise<VideoSource[]> {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/extract-video`, {
            url: pageUrl
        }, {
            timeout: 15000
        });

        if (response.data.success && response.data.sources) {
            return response.data.sources;
        }
    } catch (error) {
        console.log('Extração direta falhou, usando embeds');
    }

    return [];
}

/**
 * Ordena fontes priorizando as com legendas/dublagem em português
 */
export function sortSourcesByPortuguese(sources: VideoSource[]): VideoSource[] {
    return sources.sort((a, b) => {
        // Prioriza PT-BR
        if (a.language === 'pt-BR' && b.language !== 'pt-BR') return -1;
        if (a.language !== 'pt-BR' && b.language === 'pt-BR') return 1;
        // Depois prioriza com legendas PT
        if (a.hasPortugueseSub && !b.hasPortugueseSub) return -1;
        if (!a.hasPortugueseSub && b.hasPortugueseSub) return 1;
        return 0;
    });
}

/**
 * Labels de idiomas disponíveis
 */
export const LANGUAGE_OPTIONS = [
    { value: 'original' as AudioLanguage, label: '🌍 Original', description: 'Áudio original com legendas' },
    { value: 'pt-BR' as AudioLanguage, label: '🇧🇷 Português', description: 'Dublado em português brasileiro' },
    { value: 'en' as AudioLanguage, label: '🇺🇸 English', description: 'Audio in English' },
    { value: 'es' as AudioLanguage, label: '🇪🇸 Español', description: 'Audio en español' },
];
