'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Drama } from '@/types/tmdb';
import {
    fetchPopularTVShows,
    fetchTopRatedTVShows,
    fetchAiringTodayTVShows,
    fetchOnTheAirTVShows,
    fetchTrendingTVShows,
    getImageUrl,
} from '@/services/tmdb';

export default function SeriesPage() {
    const router = useRouter();
    const [trendingShows, setTrendingShows] = useState<Drama[]>([]);
    const [popularShows, setPopularShows] = useState<Drama[]>([]);
    const [topRatedShows, setTopRatedShows] = useState<Drama[]>([]);
    const [airingToday, setAiringToday] = useState<Drama[]>([]);
    const [onTheAir, setOnTheAir] = useState<Drama[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadSeries() {
            try {
                const [trending, popular, topRated, airing, onAir] = await Promise.all([
                    fetchTrendingTVShows(),
                    fetchPopularTVShows(1),
                    fetchTopRatedTVShows(1),
                    fetchAiringTodayTVShows(1),
                    fetchOnTheAirTVShows(1),
                ]);

                setTrendingShows(trending);
                setPopularShows(popular.results);
                setTopRatedShows(topRated.results);
                setAiringToday(airing.results);
                setOnTheAir(onAir.results);
            } catch (error) {
                console.error('Erro ao carregar séries:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadSeries();
    }, []);

    const handleShowClick = (show: Drama) => {
        router.push(`/assistir/${show.id}?tipo=serie`);
    };

    const ShowCard = ({ show }: { show: Drama }) => (
        <div
            onClick={() => handleShowClick(show)}
            className="video-card cursor-pointer group"
        >
            <div className="relative">
                <Image
                    src={getImageUrl(show.poster_path, 'w300')}
                    alt={show.name}
                    width={200}
                    height={300}
                    className="video-card-image"
                    unoptimized
                />
                <div className="video-card-info">
                    <h3 className="text-white text-sm font-semibold line-clamp-2">{show.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-500 text-xs">⭐ {show.vote_average.toFixed(1)}</span>
                        <span className="text-gray-400 text-xs">{show.first_air_date?.split('-')[0]}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const ShowRow = ({ title, shows }: { title: string; shows: Drama[] }) => (
        <section className="category-row">
            <h2 className="section-title">{title}</h2>
            <div className="carousel-container">
                <div className="carousel-track">
                    {shows.map((show) => (
                        <ShowCard key={show.id} show={show} />
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
                    <p className="text-gray-400">Carregando séries...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="px-4 md:px-8 mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">📺 Séries</h1>
                <p className="text-gray-400">Todas as séries disponíveis no catálogo</p>
            </div>

            {trendingShows.length > 0 && (
                <ShowRow title="🔥 Séries em Alta" shows={trendingShows} />
            )}

            {airingToday.length > 0 && (
                <ShowRow title="📡 No Ar Hoje" shows={airingToday} />
            )}

            {onTheAir.length > 0 && (
                <ShowRow title="🎬 Em Exibição" shows={onTheAir} />
            )}

            {popularShows.length > 0 && (
                <ShowRow title="⭐ Populares" shows={popularShows} />
            )}

            {topRatedShows.length > 0 && (
                <ShowRow title="🏆 Mais Bem Avaliadas" shows={topRatedShows} />
            )}
        </div>
    );
}
