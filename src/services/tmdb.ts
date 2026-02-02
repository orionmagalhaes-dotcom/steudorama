import axios from 'axios';
import { Drama, DramaDetails, TMDBResponse, Episode } from '@/types/tmdb';

// TMDB API Configuration
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

if (!TMDB_API_KEY && typeof window !== 'undefined') {
    console.warn('[TMDB Service] NEXT_PUBLIC_TMDB_API_KEY is not defined. Please check your environment variables.');
}

// Image URL helpers
export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500'): string => {
    if (!path) return '/placeholder-poster.png';
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string => {
    if (!path) return '/placeholder-backdrop.png';
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

// API client with Portuguese language
const tmdbClient = axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
        api_key: TMDB_API_KEY,
        language: 'pt-BR',
    },
});

// ================================
// MOVIES - FILMES
// ================================

export interface Movie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    adult: boolean;
    popularity: number;
    media_type?: 'movie';
}

/**
 * Busca filmes populares
 */
export async function fetchPopularMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Movie>>('/movie/popular', {
            params: { page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar filmes populares:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca filmes em cartaz
 */
export async function fetchNowPlayingMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Movie>>('/movie/now_playing', {
            params: { page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar filmes em cartaz:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca filmes mais bem avaliados
 */
export async function fetchTopRatedMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Movie>>('/movie/top_rated', {
            params: { page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar filmes top rated:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca filmes por lançar
 */
export async function fetchUpcomingMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Movie>>('/movie/upcoming', {
            params: { page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar próximos filmes:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca filmes por gênero
 */
export async function fetchMoviesByGenre(genreId: number, page: number = 1): Promise<TMDBResponse<Movie>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Movie>>('/discover/movie', {
            params: {
                with_genres: genreId,
                sort_by: 'popularity.desc',
                page,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar filmes do gênero ${genreId}:`, error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca detalhes de um filme
 */
export async function fetchMovieDetails(id: number): Promise<Movie | null> {
    try {
        const response = await tmdbClient.get<Movie>(`/movie/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar detalhes do filme ${id}:`, error);
        return null;
    }
}

/**
 * Busca filmes trending
 */
export async function fetchTrendingMovies(): Promise<Movie[]> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Movie>>('/trending/movie/week');
        return response.data.results;
    } catch (error) {
        console.error('Erro ao buscar filmes trending:', error);
        return [];
    }
}

// ================================
// TV SHOWS - SÉRIES (TODAS)
// ================================

/**
 * Busca séries populares (todas, não apenas asiáticas)
 */
export async function fetchPopularTVShows(page: number = 1): Promise<TMDBResponse<Drama>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/tv/popular', {
            params: { page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar séries populares:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca séries no ar (airing today)
 */
export async function fetchAiringTodayTVShows(page: number = 1): Promise<TMDBResponse<Drama>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/tv/airing_today', {
            params: { page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar séries no ar:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca séries on the air (em exibição)
 */
export async function fetchOnTheAirTVShows(page: number = 1): Promise<TMDBResponse<Drama>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/tv/on_the_air', {
            params: { page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar séries em exibição:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca séries top rated
 */
export async function fetchTopRatedTVShows(page: number = 1): Promise<TMDBResponse<Drama>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/tv/top_rated', {
            params: { page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar séries top rated:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca séries por gênero
 */
export async function fetchTVShowsByGenre(genreId: number, page: number = 1): Promise<TMDBResponse<Drama>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/discover/tv', {
            params: {
                with_genres: genreId,
                sort_by: 'popularity.desc',
                page,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar séries do gênero ${genreId}:`, error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca séries trending
 */
export async function fetchTrendingTVShows(): Promise<Drama[]> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/trending/tv/week');
        return response.data.results;
    } catch (error) {
        console.error('Erro ao buscar séries trending:', error);
        return [];
    }
}

// ================================
// ASIAN DRAMAS - DORAMAS
// ================================

const ASIAN_COUNTRIES = ['KR', 'JP', 'CN', 'TW', 'TH', 'HK', 'PH', 'VN', 'ID', 'MY', 'SG'];

/**
 * Busca doramas de um país específico
 */
export async function fetchDramasByCountry(country: string, page: number = 1): Promise<TMDBResponse<Drama>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/discover/tv', {
            params: {
                with_origin_country: country,
                sort_by: 'popularity.desc',
                page,
                'vote_count.gte': 1,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar doramas de ${country}:`, error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

// Aliases for backwards compatibility
export const fetchKoreanDramas = (page: number = 1) => fetchDramasByCountry('KR', page);
export const fetchJapaneseDramas = (page: number = 1) => fetchDramasByCountry('JP', page);
export const fetchChineseDramas = (page: number = 1) => fetchDramasByCountry('CN', page);
export const fetchThaiDramas = (page: number = 1) => fetchDramasByCountry('TH', page);
export const fetchTaiwaneseDramas = (page: number = 1) => fetchDramasByCountry('TW', page);

/**
 * Busca todos os doramas asiáticos disponíveis
 */
export async function fetchAllAsianDramas(pagesPerCountry: number = 10): Promise<Drama[]> {
    const allDramas: Drama[] = [];
    const seenIds = new Set<number>();

    const countries = [
        { code: 'KR', pages: pagesPerCountry },
        { code: 'CN', pages: pagesPerCountry },
        { code: 'JP', pages: pagesPerCountry },
        { code: 'TH', pages: pagesPerCountry - 2 },
        { code: 'TW', pages: pagesPerCountry - 2 },
        { code: 'HK', pages: 3 },
        { code: 'PH', pages: 3 },
    ];

    for (const country of countries) {
        for (let page = 1; page <= country.pages; page++) {
            try {
                const response = await fetchDramasByCountry(country.code, page);
                for (const drama of response.results) {
                    if (!seenIds.has(drama.id)) {
                        seenIds.add(drama.id);
                        allDramas.push(drama);
                    }
                }
            } catch {
                // Continue with next page
            }
        }
    }

    return allDramas.sort((a, b) => b.vote_average - a.vote_average);
}

// ================================
// GENRE SPECIFIC FETCHERS
// ================================

export const fetchRomanceDramas = () => fetchTVShowsByGenre(10749);
export const fetchActionDramas = () => fetchTVShowsByGenre(10759);
export const fetchComedyDramas = () => fetchTVShowsByGenre(35);
export const fetchMysteryDramas = () => fetchTVShowsByGenre(9648);
export const fetchFantasyDramas = () => fetchTVShowsByGenre(10765);
export const fetchCrimeDramas = () => fetchTVShowsByGenre(80);
export const fetchFamilyDramas = () => fetchTVShowsByGenre(10751);

// ================================
// TRENDING & DISCOVER
// ================================

/**
 * Busca todo o conteúdo trending (filmes + séries)
 */
export async function fetchAllTrending(): Promise<(Drama | Movie)[]> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama | Movie>>('/trending/all/week');
        return response.data.results;
    } catch (error) {
        console.error('Erro ao buscar trending:', error);
        return [];
    }
}

/**
 * Busca doramas em alta (apenas asiáticos)
 */
export async function fetchTrendingDramas(): Promise<Drama[]> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/trending/tv/week');
        return response.data.results.filter(drama =>
            drama.origin_country?.some(country => ASIAN_COUNTRIES.includes(country))
        );
    } catch (error) {
        console.error('Erro ao buscar doramas em alta:', error);
        return [];
    }
}

/**
 * Busca doramas recentes
 */
export async function fetchRecentDramas(): Promise<Drama[]> {
    try {
        const today = new Date().toISOString().split('T')[0];
        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

        const response = await tmdbClient.get<TMDBResponse<Drama>>('/discover/tv', {
            params: {
                with_origin_country: 'KR|JP|CN|TH|TW',
                sort_by: 'first_air_date.desc',
                'first_air_date.lte': today,
                'first_air_date.gte': sixMonthsAgo,
            },
        });
        return response.data.results;
    } catch (error) {
        console.error('Erro ao buscar doramas recentes:', error);
        return [];
    }
}

/**
 * Busca doramas mais bem avaliados
 */
export async function fetchTopRatedDramas(): Promise<Drama[]> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/discover/tv', {
            params: {
                with_origin_country: 'KR|JP|CN',
                sort_by: 'vote_average.desc',
                'vote_count.gte': 50,
            },
        });
        return response.data.results;
    } catch (error) {
        console.error('Erro ao buscar doramas top rated:', error);
        return [];
    }
}

// ================================
// DETAILS & EPISODES
// ================================

/**
 * Busca detalhes de um dorama/série
 */
export async function fetchDramaDetails(id: number): Promise<DramaDetails | null> {
    try {
        const response = await tmdbClient.get<DramaDetails>(`/tv/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar detalhes do dorama ${id}:`, error);
        return null;
    }
}

/**
 * Busca episódios de uma temporada
 */
export async function fetchSeasonEpisodes(
    dramaId: number,
    seasonNumber: number
): Promise<Episode[]> {
    try {
        const response = await tmdbClient.get(`/tv/${dramaId}/season/${seasonNumber}`);
        return response.data.episodes || [];
    } catch (error) {
        console.error(`Erro ao buscar episódios da temporada ${seasonNumber}:`, error);
        return [];
    }
}

// ================================
// SEARCH
// ================================

/**
 * Busca multi (filmes + séries + pessoas)
 */
export async function searchMulti(query: string, page: number = 1): Promise<TMDBResponse<Drama | Movie>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama | Movie>>('/search/multi', {
            params: { query, page },
        });
        // Filtrar apenas filmes e séries
        return {
            ...response.data,
            results: response.data.results.filter(item =>
                'media_type' in item && (item.media_type === 'movie' || item.media_type === 'tv')
            ),
        };
    } catch (error) {
        console.error('Erro ao pesquisar:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca doramas por termo de pesquisa (apenas asiáticos)
 */
export async function searchDramas(query: string, page: number = 1): Promise<TMDBResponse<Drama>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/search/tv', {
            params: { query, page },
        });

        const filteredResults = response.data.results.filter(drama =>
            drama.origin_country?.some(country => ASIAN_COUNTRIES.includes(country))
        );

        return {
            ...response.data,
            results: filteredResults,
        };
    } catch (error) {
        console.error('Erro ao pesquisar doramas:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca filmes por termo
 */
export async function searchMovies(query: string, page: number = 1): Promise<TMDBResponse<Movie>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Movie>>('/search/movie', {
            params: { query, page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao pesquisar filmes:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

/**
 * Busca séries por termo
 */
export async function searchTVShows(query: string, page: number = 1): Promise<TMDBResponse<Drama>> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>('/search/tv', {
            params: { query, page },
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao pesquisar séries:', error);
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
}

// ================================
// SIMILAR & RECOMMENDATIONS
// ================================

export async function fetchSimilarDramas(dramaId: number): Promise<Drama[]> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Drama>>(`/tv/${dramaId}/similar`);
        return response.data.results.slice(0, 20);
    } catch (error) {
        console.error(`Erro ao buscar doramas similares a ${dramaId}:`, error);
        return [];
    }
}

export async function fetchSimilarMovies(movieId: number): Promise<Movie[]> {
    try {
        const response = await tmdbClient.get<TMDBResponse<Movie>>(`/movie/${movieId}/similar`);
        return response.data.results.slice(0, 20);
    } catch (error) {
        console.error(`Erro ao buscar filmes similares a ${movieId}:`, error);
        return [];
    }
}

// ================================
// GENRES LIST
// ================================

export interface Genre {
    id: number;
    name: string;
}

export async function fetchTVGenres(): Promise<Genre[]> {
    try {
        const response = await tmdbClient.get<{ genres: Genre[] }>('/genre/tv/list');
        return response.data.genres;
    } catch (error) {
        console.error('Erro ao buscar gêneros de TV:', error);
        return [];
    }
}

export async function fetchMovieGenres(): Promise<Genre[]> {
    try {
        const response = await tmdbClient.get<{ genres: Genre[] }>('/genre/movie/list');
        return response.data.genres;
    } catch (error) {
        console.error('Erro ao buscar gêneros de filmes:', error);
        return [];
    }
}

// ================================
// LATEST UPDATES (for auto-update)
// ================================

/**
 * Busca as últimas atualizações de séries (para sync automático)
 */
export async function fetchLatestTVChanges(page: number = 1): Promise<number[]> {
    try {
        const response = await tmdbClient.get<{ results: { id: number }[] }>('/tv/changes', {
            params: { page },
        });
        return response.data.results.map(item => item.id);
    } catch (error) {
        console.error('Erro ao buscar mudanças de TV:', error);
        return [];
    }
}

/**
 * Busca as últimas atualizações de filmes (para sync automático)
 */
export async function fetchLatestMovieChanges(page: number = 1): Promise<number[]> {
    try {
        const response = await tmdbClient.get<{ results: { id: number }[] }>('/movie/changes', {
            params: { page },
        });
        return response.data.results.map(item => item.id);
    } catch (error) {
        console.error('Erro ao buscar mudanças de filmes:', error);
        return [];
    }
}
