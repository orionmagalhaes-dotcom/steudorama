'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Drama } from '@/types/tmdb';
import { searchMulti, Movie, getImageUrl } from '@/services/tmdb';

type SearchResult = (Drama | Movie) & { media_type?: string };

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(query);

    useEffect(() => {
        async function performSearch() {
            if (!query) return;

            setIsLoading(true);
            try {
                // Search ALL content (movies + TV shows)
                const response = await searchMulti(query);
                setResults(response.results);
            } catch (error) {
                console.error('Erro na busca:', error);
            } finally {
                setIsLoading(false);
            }
        }

        performSearch();
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            router.push(`/buscar?q=${encodeURIComponent(searchInput)}`);
        }
    };

    const handleResultClick = (item: SearchResult) => {
        const isMovie = 'title' in item || item.media_type === 'movie';
        const tipo = isMovie ? 'filme' : 'serie';
        router.push(`/assistir/${item.id}?tipo=${tipo}`);
    };

    const getItemTitle = (item: SearchResult) => {
        return 'title' in item ? item.title : item.name;
    };

    const getItemYear = (item: SearchResult) => {
        const date = 'release_date' in item ? item.release_date : item.first_air_date;
        return date?.split('-')[0] || 'N/A';
    };

    const getItemType = (item: SearchResult) => {
        return 'title' in item || item.media_type === 'movie' ? 'movie' : 'tv';
    };

    return (
        <div className="min-h-screen pt-20 px-4 md:px-8 lg:px-12">
            {/* Search Header */}
            <div className="mb-8">
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Buscar filmes, séries, doramas..."
                            className="flex-1 bg-gray-800 text-white px-6 py-4 rounded-lg border border-gray-700 focus:border-primary outline-none text-lg"
                        />
                        <button
                            type="submit"
                            className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-lg font-semibold transition-colors"
                        >
                            Buscar
                        </button>
                    </div>
                </form>

                {query && (
                    <div className="text-center">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Resultados para &ldquo;{query}&rdquo;
                        </h1>
                        <p className="text-gray-400">
                            {results.length} resultado(s) encontrado(s)
                        </p>
                    </div>
                )}
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Buscando...</p>
                    </div>
                </div>
            ) : !query ? (
                /* No Query */
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl text-white mb-2">Pesquise algo</h3>
                    <p className="text-gray-400">Digite um termo para buscar filmes, séries e doramas</p>
                </div>
            ) : results.length === 0 ? (
                /* No Results */
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl text-white mb-2">Nenhum resultado encontrado</h3>
                    <p className="text-gray-400">Tente buscar com outros termos</p>
                </div>
            ) : (
                /* Results Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-16">
                    {results.map((item) => {
                        const type = getItemType(item);
                        return (
                            <div
                                key={`${type}-${item.id}`}
                                onClick={() => handleResultClick(item)}
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
                                    <div className={`absolute top-2 left-2 text-white text-xs px-2 py-1 rounded ${type === 'movie' ? 'bg-blue-600' : 'bg-green-600'
                                        }`}>
                                        {type === 'movie' ? '🎬 Filme' : '📺 Série'}
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                        ⭐ {item.vote_average?.toFixed(1) || 'N/A'}
                                    </div>
                                </div>
                                <h3 className="text-white text-sm font-medium line-clamp-2">
                                    {getItemTitle(item)}
                                </h3>
                                <p className="text-gray-500 text-xs mt-1">
                                    {getItemYear(item)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function BuscarPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
