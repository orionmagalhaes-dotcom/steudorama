'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Drama } from '@/types/tmdb';
import {
    fetchKoreanDramas,
    fetchJapaneseDramas,
    fetchChineseDramas,
    fetchThaiDramas,
    fetchTaiwaneseDramas,
    fetchTrendingDramas,
    fetchRecentDramas,
    fetchTopRatedDramas,
    getImageUrl,
} from '@/services/tmdb';
import Carousel from '@/components/Carousel';

export default function DoramasPage() {
    const router = useRouter();
    const [trendingDramas, setTrendingDramas] = useState<Drama[]>([]);
    const [recentDramas, setRecentDramas] = useState<Drama[]>([]);
    const [topRatedDramas, setTopRatedDramas] = useState<Drama[]>([]);
    const [koreanDramas, setKoreanDramas] = useState<Drama[]>([]);
    const [japaneseDramas, setJapaneseDramas] = useState<Drama[]>([]);
    const [chineseDramas, setChineseDramas] = useState<Drama[]>([]);
    const [thaiDramas, setThaiDramas] = useState<Drama[]>([]);
    const [taiwaneseDramas, setTaiwaneseDramas] = useState<Drama[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadDramas() {
            try {
                const [trending, recent, topRated, korean, japanese, chinese, thai, taiwanese] = await Promise.all([
                    fetchTrendingDramas(),
                    fetchRecentDramas(),
                    fetchTopRatedDramas(),
                    fetchKoreanDramas(1),
                    fetchJapaneseDramas(1),
                    fetchChineseDramas(1),
                    fetchThaiDramas(1),
                    fetchTaiwaneseDramas(1),
                ]);

                setTrendingDramas(trending);
                setRecentDramas(recent);
                setTopRatedDramas(topRated);
                setKoreanDramas(korean.results);
                setJapaneseDramas(japanese.results);
                setChineseDramas(chinese.results);
                setThaiDramas(thai.results);
                setTaiwaneseDramas(taiwanese.results);
            } catch (error) {
                console.error('Erro ao carregar doramas:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadDramas();
    }, []);

    const handleDramaClick = (drama: Drama) => {
        router.push(`/assistir/${drama.id}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Carregando doramas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-16">
            <div className="px-4 md:px-8 mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">🇰🇷 Doramas Asiáticos</h1>
                <p className="text-gray-400">K-Dramas, J-Dramas, C-Dramas e muito mais</p>
            </div>

            {trendingDramas.length > 0 && (
                <Carousel
                    title="🔥 Doramas em Alta"
                    dramas={trendingDramas}
                    onDramaClick={handleDramaClick}
                />
            )}

            {recentDramas.length > 0 && (
                <Carousel
                    title="🆕 Lançamentos Recentes"
                    dramas={recentDramas}
                    onDramaClick={handleDramaClick}
                />
            )}

            {topRatedDramas.length > 0 && (
                <Carousel
                    title="⭐ Mais Bem Avaliados"
                    dramas={topRatedDramas}
                    onDramaClick={handleDramaClick}
                />
            )}

            {koreanDramas.length > 0 && (
                <Carousel
                    title="🇰🇷 K-Dramas Coreanos"
                    dramas={koreanDramas}
                    onDramaClick={handleDramaClick}
                />
            )}

            {japaneseDramas.length > 0 && (
                <Carousel
                    title="🇯🇵 J-Dramas Japoneses"
                    dramas={japaneseDramas}
                    onDramaClick={handleDramaClick}
                />
            )}

            {chineseDramas.length > 0 && (
                <Carousel
                    title="🇨🇳 C-Dramas Chineses"
                    dramas={chineseDramas}
                    onDramaClick={handleDramaClick}
                />
            )}

            {thaiDramas.length > 0 && (
                <Carousel
                    title="🇹🇭 Thai Dramas"
                    dramas={thaiDramas}
                    onDramaClick={handleDramaClick}
                />
            )}

            {taiwaneseDramas.length > 0 && (
                <Carousel
                    title="🇹🇼 Taiwan Dramas"
                    dramas={taiwaneseDramas}
                    onDramaClick={handleDramaClick}
                />
            )}

            {/* Link to All Dramas */}
            <div className="text-center mt-8">
                <button
                    onClick={() => router.push('/todos?filtro=doramas')}
                    className="btn-primary text-lg px-8 py-4"
                >
                    Ver Todos os Doramas
                </button>
            </div>
        </div>
    );
}
