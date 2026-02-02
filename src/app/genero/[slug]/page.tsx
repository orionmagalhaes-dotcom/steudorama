'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Drama } from '@/types/tmdb';
import {
    fetchMoviesByGenre,
    fetchTVShowsByGenre,
    Movie,
    getImageUrl,
} from '@/services/tmdb';

// Genre configurations
const GENRES: Record<string, {
    movieId: number;
    tvId: number;
    name: string;
    emoji: string;
    description: string;
}> = {
    'aventura': { movieId: 12, tvId: 10759, name: 'Aventura', emoji: '🗺️', description: 'Viagens épicas e explorações emocionantes' },
    'terror': { movieId: 27, tvId: 9648, name: 'Terror', emoji: '👻', description: 'Sustos, mistérios e histórias assustadoras' },
    'drama': { movieId: 18, tvId: 18, name: 'Drama', emoji: '🎭', description: 'Histórias emocionantes e profundas' },
    'comedia': { movieId: 35, tvId: 35, name: 'Comédia', emoji: '😂', description: 'Diversão e risadas garantidas' },
    'animacao': { movieId: 16, tvId: 16, name: 'Animação', emoji: '🎨', description: 'Desenhos e animações para todos' },
    'acao': { movieId: 28, tvId: 10759, name: 'Ação', emoji: '💥', description: 'Adrenalina e emoção' },
    'romance': { movieId: 10749, tvId: 10749, name: 'Romance', emoji: '💕', description: 'Histórias de amor' },
    'ficcao': { movieId: 878, tvId: 10765, name: 'Ficção Científica', emoji: '🚀', description: 'Exploração espacial e tecnologia' },
    'crime': { movieId: 80, tvId: 80, name: 'Crime', emoji: '🔍', description: 'Investigações e mistérios criminais' },
    'documentario': { movieId: 99, tvId: 99, name: 'Documentário', emoji: '📹', description: 'Histórias reais e educativas' },
};

export default function GeneroPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [movies, setMovies] = useState<Movie[]>([]);
    const [tvShows, setTvShows] = useState<Drama[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'series'>('all');

    const genre = GENRES[slug];

    useEffect(() => {
        async function loadContent() {
            if (!genre) return;

            setIsLoading(true);
            try {
                // Load multiple pages for more content
                const [movies1, movies2, tv1, tv2] = await Promise.all([
                    fetchMoviesByGenre(genre.movieId, 1),
                    fetchMoviesByGenre(genre.movieId, 2),
                    fetchTVShowsByGenre(genre.tvId, 1),
                    fetchTVShowsByGenre(genre.tvId, 2),
                ]);

                setMovies([...movies1.results, ...movies2.results]);
                setTvShows([...tv1.results, ...tv2.results]);
            } catch (error) {
                console.error('Erro ao carregar gênero:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadContent();
    }, [slug, genre]);

    const handleItemClick = (item: Movie | Drama, type: 'movie' | 'tv') => {
        router.push(`/assistir/${item.id}?tipo=${type === 'movie' ? 'filme' : 'serie'}`);
    };

    if (!genre) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-white mb-4">Gênero não encontrado</h1>
                    <button onClick={() => router.push('/')} className="btn-primary">
                        Voltar ao início
                    </button>
                </div>
            </div>
        );
    }

    const filteredMovies = activeTab === 'series' ? [] : movies;
    const filteredShows = activeTab === 'movies' ? [] : tvShows;

    return (
        <div className="min-h-screen pt-20 px-4 md:px-8 lg:px-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {genre.emoji} {genre.name}
                </h1>
                <p className="text-gray-400 mb-4">{genre.description}</p>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'all'
                                ? 'bg-primary text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        Todos ({movies.length + tvShows.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('movies')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'movies'
                                ? 'bg-primary text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        🎬 Filmes ({movies.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('series')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'series'
                                ? 'bg-primary text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        📺 Séries ({tvShows.length})
                    </button>
                </div>
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Carregando...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-16">
                    {/* Movies */}
                    {filteredMovies.map((movie) => (
                        <div
                            key={`movie-${movie.id}`}
                            onClick={() => handleItemClick(movie, 'movie')}
                            className="cursor-pointer group"
                        >
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                                <Image
                                    src={getImageUrl(movie.poster_path, 'w300')}
                                    alt={movie.title}
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
                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                    🎬 Filme
                                </div>
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    ⭐ {movie.vote_average.toFixed(1)}
                                </div>
                            </div>
                            <h3 className="text-white text-sm font-medium line-clamp-2">
                                {movie.title}
                            </h3>
                            <p className="text-gray-500 text-xs mt-1">
                                {movie.release_date?.split('-')[0] || 'N/A'}
                            </p>
                        </div>
                    ))}

                    {/* TV Shows */}
                    {filteredShows.map((show) => (
                        <div
                            key={`tv-${show.id}`}
                            onClick={() => handleItemClick(show, 'tv')}
                            className="cursor-pointer group"
                        >
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                                <Image
                                    src={getImageUrl(show.poster_path, 'w300')}
                                    alt={show.name}
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
                                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                    📺 Série
                                </div>
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    ⭐ {show.vote_average.toFixed(1)}
                                </div>
                            </div>
                            <h3 className="text-white text-sm font-medium line-clamp-2">
                                {show.name}
                            </h3>
                            <p className="text-gray-500 text-xs mt-1">
                                {show.first_air_date?.split('-')[0] || 'N/A'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
