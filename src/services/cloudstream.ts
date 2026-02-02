import axios from 'axios';

// CloudStream Repository URLs
const CLOUDSTREAM_REPOS = [
    {
        name: 'LietRepo (Brasil)',
        repoUrl: 'https://raw.githubusercontent.com/lawlietbr/lietrepo/refs/heads/main/builds/repo.json',
        pluginsUrl: 'https://github.com/lawlietbr/lietrepo/raw/refs/heads/main/builds/plugins.json',
        language: 'pt-br'
    },
    {
        name: 'Storm-ext',
        repoUrl: 'https://raw.githubusercontent.com/redblacker8/storm-ext/refs/heads/builds/repo.json',
        pluginsUrl: 'https://raw.githubusercontent.com/redblacker8/storm-ext/builds/plugins.json',
        language: 'multi'
    }
];

// Provedores de Doramas conhecidos dos repositórios CloudStream
export const DORAMA_PROVIDERS_CLOUDSTREAM = [
    {
        name: 'Doramogo',
        baseUrl: 'https://www.doramogo.net',
        language: 'pt-br',
        type: 'AsianDrama',
        hasPortugueseSub: true,
        source: 'lietrepo'
    },
    {
        name: 'KissKH',
        baseUrl: 'https://kisskh.co',
        language: 'multi',
        type: 'AsianDrama',
        hasPortugueseSub: true,
        source: 'direct'
    },
    {
        name: 'Dramacool',
        baseUrl: 'https://dramacool.pa',
        language: 'en',
        type: 'AsianDrama',
        hasPortugueseSub: false,
        source: 'direct'
    },
    {
        name: 'KissAsian',
        baseUrl: 'https://kissasian.lu',
        language: 'en',
        type: 'AsianDrama',
        hasPortugueseSub: false,
        source: 'direct'
    },
    {
        name: 'AsianLoad',
        baseUrl: 'https://asianembed.io',
        language: 'en',
        type: 'AsianDrama',
        hasPortugueseSub: false,
        source: 'direct'
    }
];

// Provedores de streaming premium (para referência)
export const PREMIUM_PROVIDERS = [
    {
        name: 'Viki',
        url: 'https://www.viki.com',
        hasPortugueseSub: true,
        requiresSubscription: false // Tem conteúdo gratuito
    },
    {
        name: 'iQIYI',
        url: 'https://www.iq.com',
        hasPortugueseSub: true,
        requiresSubscription: false
    },
    {
        name: 'WeTV',
        url: 'https://wetv.vip',
        hasPortugueseSub: true,
        requiresSubscription: false
    },
    {
        name: 'Kocowa',
        url: 'https://www.kocowa.com',
        hasPortugueseSub: false,
        requiresSubscription: true
    }
];

export interface CloudStreamPlugin {
    name: string;
    internalName: string;
    description: string;
    language: string;
    iconUrl: string;
    url: string;
    tvTypes: string[];
    status: number;
    version: number;
}

export interface CloudStreamRepo {
    name: string;
    plugins: CloudStreamPlugin[];
}

/**
 * Busca plugins de um repositório CloudStream
 */
export async function fetchCloudStreamPlugins(pluginsUrl: string): Promise<CloudStreamPlugin[]> {
    try {
        const response = await axios.get(pluginsUrl, { timeout: 10000 });
        return response.data || [];
    } catch (error) {
        console.error('Erro ao buscar plugins CloudStream:', error);
        return [];
    }
}

/**
 * Busca todos os plugins de doramas dos repositórios
 */
export async function fetchAllDoramaPlugins(): Promise<CloudStreamPlugin[]> {
    const allPlugins: CloudStreamPlugin[] = [];

    for (const repo of CLOUDSTREAM_REPOS) {
        const plugins = await fetchCloudStreamPlugins(repo.pluginsUrl);

        // Filtrar apenas plugins de doramas/asian drama
        const doramaPlugins = plugins.filter(p =>
            p.tvTypes?.some(t =>
                t.toLowerCase().includes('asian') ||
                t.toLowerCase().includes('drama') ||
                t.toLowerCase().includes('dorama')
            ) ||
            p.name.toLowerCase().includes('dorama') ||
            p.name.toLowerCase().includes('drama') ||
            p.name.toLowerCase().includes('kiss')
        );

        allPlugins.push(...doramaPlugins);
    }

    return allPlugins;
}

/**
 * Gera URLs de embed para assistir via CloudStream providers
 */
export function generateCloudStreamEmbeds(
    tmdbId: number,
    dramaTitle: string,
    season: number,
    episode: number
): string[] {
    const slug = dramaTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return [
        // VidSrc (mais confiável)
        `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`,
        `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`,

        // MultiEmbed
        `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,

        // 2Embed
        `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,

        // AutoEmbed
        `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`,

        // VidLink
        `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`,

        // Embed.su
        `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,

        // Smashystream
        `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}`,
    ];
}

/**
 * Busca doramas do Doramogo (site brasileiro)
 * Nota: Isso requer um backend proxy para evitar CORS
 */
export async function searchDoramogo(query: string): Promise<{ title: string, url: string }[]> {
    // Isso precisa ser feito via backend devido a CORS
    try {
        const response = await axios.get(`/api/search-doramogo?q=${encodeURIComponent(query)}`);
        return response.data || [];
    } catch {
        return [];
    }
}
