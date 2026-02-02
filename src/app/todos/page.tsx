'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Drama } from '@/types/tmdb';
import {
    fetchAllAsianDramas,
    fetchPopularMovies,
    fetchPopularTVShows,
    Movie,
    getImageUrl,
    searchMulti,
} from '@/services/tmdb';

type ContentItem = (Drama | Movie) & { mediaType: 'movie' | 'tv' };

function CatalogoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialFilter = searchParams.get('filtro') || 'todos';

    const [content, setContent] = useState<ContentItem[]>([]);
    const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState(initialFilter);
    const [sortBy, setSortBy] = useState('popularity');

    useEffect(() => {
        async function loadContent() {
            setIsLoading(true);
            try {
                // Fetch MANY more pages for a comprehensive catalog (2000+ titles)
                const moviePages = [];
                const tvPages = [];

                // Fetch 10 pages of popular movies (200 movies)
                for (let i = 1; i <= 10; i++) {
                    moviePages.push(fetchPopularMovies(i));
                }

                // Fetch 10 pages of popular TV shows (200 TV shows)
                for (let i = 1; i <= 10; i++) {
                    tvPages.push(fetchPopularTVShows(i));
                }

                // Fetch Asian dramas - 10 pages per country
                const dramasPromise = fetchAllAsianDramas(10);

                // Execute all in parallel
                const [movieResults, tvResults, dramas] = await Promise.all([
                    Promise.all(moviePages),
                    Promise.all(tvPages),
                    dramasPromise,
                ]);

                // Combine all movies with media type
                const allMovies: ContentItem[] = movieResults
                    .flatMap(page => page.results)
                    .map(m => ({ ...m, mediaType: 'movie' as const }));

                // Combine all TV shows with media type
                const allTV: ContentItem[] = tvResults
                    .flatMap(page => page.results)
                    .map(t => ({ ...t, mediaType: 'tv' as const }));

                // Add doramas
                const allDramas: ContentItem[] = dramas.map(d => ({ ...d, mediaType: 'tv' as const }));

                // Combine and remove duplicates
                const combined = [...allMovies, ...allTV, ...allDramas];
                const unique = Array.from(
                    new Map(combined.map(item => [`${item.mediaType}-${item.id}`, item])).values()
                );

                console.log(`📚 Catálogo carregado: ${unique.length} títulos (${allMovies.length} filmes, ${allTV.length} séries, ${allDramas.length} doramas)`);

                setContent(unique);
                setFilteredContent(unique);
            } catch (error) {
                console.error('Erro ao carregar catálogo:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadContent();
    }, []);

    // Apply filters and sorting
    useEffect(() => {
        let result = [...content];

        // Filter by type
        if (activeFilter === 'filmes') {
            result = result.filter(item => item.mediaType === 'movie');
        } else if (activeFilter === 'series') {
            result = result.filter(item => item.mediaType === 'tv');
        } else if (activeFilter === 'doramas') {
            const asianCountries = ['KR', 'JP', 'CN', 'TH', 'TW', 'HK', 'PH'];
            result = result.filter(item =>
                item.mediaType === 'tv' &&
                'origin_country' in item &&
                item.origin_country?.some(c => asianCountries.includes(c))
            );
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item => {
                const title = 'title' in item ? item.title : item.name;
                return title.toLowerCase().includes(query);
            });
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'popularity') {
                return b.popularity - a.popularity;
            } else if (sortBy === 'rating') {
                return b.vote_average - a.vote_average;
            } else if (sortBy === 'date') {
                const dateA = 'release_date' in a ? a.release_date : a.first_air_date;
                const dateB = 'release_date' in b ? b.release_date : b.first_air_date;
                return (dateB || '').localeCompare(dateA || '');
            } else if (sortBy === 'name') {
                const nameA = 'title' in a ? a.title : a.name;
                const nameB = 'title' in b ? b.title : b.name;
                return nameA.localeCompare(nameB);
            }
            return 0;
        });

        setFilteredContent(result);
    }, [content, activeFilter, searchQuery, sortBy]);

    const handleSearch = useCallback(async () => {
        if (searchQuery.length < 2) return;

        setIsLoading(true);
        try {
            const results = await searchMulti(searchQuery);
            const items: ContentItem[] = results.results.map(item => ({
                ...item,
                mediaType: 'title' in item ? 'movie' as const : 'tv' as const,
            }));
            setFilteredContent(items);
        } catch (error) {
            console.error('Erro na busca:', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    const handleItemClick = (item: ContentItem) => {
        const tipo = item.mediaType === 'movie' ? 'filme' : 'serie';
        router.push(`/assistir/${item.id}?tipo=${tipo}`);
    };

    const getItemTitle = (item: ContentItem) => {
        return 'title' in item ? item.title : item.name;
    };

    const getItemYear = (item: ContentItem) => {
        const date = 'release_date' in item ? item.release_date : item.first_air_date;
        return date?.split('-')[0] || 'N/A';
    };

    return (
        <div className="min-h-screen pt-20 px-4 md:px-8 lg:px-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    📚 Catálogo Completo
                </h1>
                <p className="text-gray-400">
                    {filteredContent.length} título(s) disponível(is)
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-primary outline-none"
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-primary outline-none"
                >
                    <option value="todos">📚 Todos</option>
                    <option value="filmes">🎬 Filmes</option>
                    <option value="series">📺 Séries</option>
                    <option value="doramas">🇰🇷 Doramas</option>
                </select>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-primary outline-none"
                >
                    <option value="popularity">🔥 Populares</option>
                    <option value="rating">⭐ Avaliação</option>
                    <option value="date">📅 Data</option>
                    <option value="name">🔤 Nome (A-Z)</option>
                </select>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['todos', 'filmes', 'series', 'doramas'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter === filter
                            ? 'bg-primary text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        {filter === 'todos' && '📚 Todos'}
                        {filter === 'filmes' && '🎬 Filmes'}
                        {filter === 'series' && '📺 Séries'}
                        {filter === 'doramas' && '🇰🇷 Doramas'}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Carregando catálogo...</p>
                    </div>
                </div>
            ) : filteredContent.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl text-white mb-2">Nenhum resultado</h3>
                    <p className="text-gray-400">Tente ajustar os filtros</p>
                </div>
            ) : (
                /* Content Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-16">
                    {filteredContent.map((item) => (
                        <div
                            key={`${item.mediaType}-${item.id}`}
                            onClick={() => handleItemClick(item)}
                            className="cursor-pointer group"
                        >
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                                <Image
                                    src={getImageUrl(item.poster_path, 'w300')}
                                    alt={getItemTitle(item)}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded ${item.mediaType === 'movie' ? 'bg-blue-600' : 'bg-green-600'
                                    }`}>
                                    {item.mediaType === 'movie' ? '🎬 Filme' : '📺 Série'}
                                </div>
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    ⭐ {item.vote_average.toFixed(1)}
                                </div>
                            </div>
                            <h3 className="text-white text-sm font-medium line-clamp-2">
                                {getItemTitle(item)}
                            </h3>
                            <p className="text-gray-500 text-xs mt-1">
                                {getItemYear(item)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function TodosPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CatalogoContent />
        </Suspense>
    );
}
