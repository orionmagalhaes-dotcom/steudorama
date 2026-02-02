'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Drama } from '@/types/tmdb';
import {
    fetchKoreanDramas,
    fetchJapaneseDramas,
    fetchChineseDramas,
    fetchThaiDramas,
    fetchTaiwaneseDramas,
    getImageUrl,
} from '@/services/tmdb';

const CATEGORY_CONFIG: Record<string, {
    title: string;
    flag: string;
    fetchFn: (page: number) => Promise<{ results: Drama[] }>;
}> = {
    'coreanos': {
        title: 'Doramas Coreanos',
        flag: '🇰🇷',
        fetchFn: fetchKoreanDramas
    },
    'japoneses': {
        title: 'Doramas Japoneses',
        flag: '🇯🇵',
        fetchFn: fetchJapaneseDramas
    },
    'chineses': {
        title: 'Doramas Chineses',
        flag: '🇨🇳',
        fetchFn: fetchChineseDramas
    },
    'tailandeses': {
        title: 'Doramas Tailandeses',
        flag: '🇹🇭',
        fetchFn: fetchThaiDramas
    },
    'taiwaneses': {
        title: 'Doramas Taiwaneses',
        flag: '🇹🇼',
        fetchFn: fetchTaiwaneseDramas
    }
};

export default function CategoryPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [dramas, setDramas] = useState<Drama[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const config = CATEGORY_CONFIG[slug];

    useEffect(() => {
        async function loadDramas() {
            if (!config) return;

            setIsLoading(true);
            try {
                // Load multiple pages
                const results: Drama[] = [];
                for (let page = 1; page <= 3; page++) {
                    const response = await config.fetchFn(page);
                    results.push(...response.results);
                }
                setDramas(results);
            } catch (error) {
                console.error('Erro ao carregar categoria:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadDramas();
    }, [slug, config]);

    const handleDramaClick = (drama: Drama) => {
        router.push(`/assistir/${drama.id}`);
    };

    if (!config) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl text-white mb-4">Categoria não encontrada</h1>
                    <button onClick={() => router.push('/')} className="btn-primary">
                        Voltar ao início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 px-4 md:px-8 lg:px-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {config.flag} {config.title}
                </h1>
                <p className="text-gray-400">
                    {dramas.length} dorama(s) disponível(is)
                </p>
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
                /* Dramas Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {dramas.map((drama) => (
                        <div
                            key={drama.id}
                            onClick={() => handleDramaClick(drama)}
                            className="cursor-pointer group"
                        >
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                                <Image
                                    src={getImageUrl(drama.poster_path, 'w300')}
                                    alt={drama.name}
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
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {drama.vote_average.toFixed(1)}
                                </div>
                            </div>
                            <h3 className="text-white text-sm font-medium line-clamp-2">
                                {drama.name}
                            </h3>
                            <p className="text-gray-500 text-xs mt-1">
                                {drama.first_air_date?.split('-')[0] || 'N/A'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
