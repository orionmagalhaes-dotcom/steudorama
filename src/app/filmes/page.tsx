'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    fetchPopularMovies,
    fetchTopRatedMovies,
    fetchNowPlayingMovies,
    fetchUpcomingMovies,
    fetchTrendingMovies,
    Movie,
    getImageUrl,
} from '@/services/tmdb';

export default function FilmesPage() {
    const router = useRouter();
    const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
    const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
    const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
    const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadMovies() {
            try {
                const [trending, popular, topRated, nowPlaying, upcoming] = await Promise.all([
                    fetchTrendingMovies(),
                    fetchPopularMovies(1),
                    fetchTopRatedMovies(1),
                    fetchNowPlayingMovies(1),
                    fetchUpcomingMovies(1),
                ]);

                setTrendingMovies(trending);
                setPopularMovies(popular.results);
                setTopRatedMovies(topRated.results);
                setNowPlayingMovies(nowPlaying.results);
                setUpcomingMovies(upcoming.results);
            } catch (error) {
                console.error('Erro ao carregar filmes:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadMovies();
    }, []);

    const handleMovieClick = (movie: Movie) => {
        router.push(`/assistir/${movie.id}?tipo=filme`);
    };

    const MovieCard = ({ movie }: { movie: Movie }) => (
        <div
            onClick={() => handleMovieClick(movie)}
            className="video-card cursor-pointer group"
        >
            <div className="relative">
                <Image
                    src={getImageUrl(movie.poster_path, 'w300')}
                    alt={movie.title}
                    width={200}
                    height={300}
                    className="video-card-image"
                    unoptimized
                />
                <div className="video-card-info">
                    <h3 className="text-white text-sm font-semibold line-clamp-2">{movie.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-500 text-xs">⭐ {movie.vote_average.toFixed(1)}</span>
                        <span className="text-gray-400 text-xs">{movie.release_date?.split('-')[0]}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const MovieRow = ({ title, movies }: { title: string; movies: Movie[] }) => (
        <section className="category-row">
            <h2 className="section-title">{title}</h2>
            <div className="carousel-container">
                <div className="carousel-track">
                    {movies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            </div>
        </section>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Carregando filmes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="px-4 md:px-8 mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">🎬 Filmes</h1>
                <p className="text-gray-400">Todos os filmes disponíveis no catálogo</p>
            </div>

            {trendingMovies.length > 0 && (
                <MovieRow title="🔥 Filmes em Alta" movies={trendingMovies} />
            )}

            {nowPlayingMovies.length > 0 && (
                <MovieRow title="🎦 Em Cartaz" movies={nowPlayingMovies} />
            )}

            {popularMovies.length > 0 && (
                <MovieRow title="⭐ Populares" movies={popularMovies} />
            )}

            {topRatedMovies.length > 0 && (
                <MovieRow title="🏆 Mais Bem Avaliados" movies={topRatedMovies} />
            )}

            {upcomingMovies.length > 0 && (
                <MovieRow title="📅 Em Breve" movies={upcomingMovies} />
            )}
        </div>
    );
}
