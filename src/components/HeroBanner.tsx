'use client';

import { Drama } from '@/types/tmdb';
import { getBackdropUrl } from '@/services/tmdb';

interface HeroBannerProps {
    drama: Drama | null;
    onPlay?: (drama: Drama) => void;
    onInfo?: (drama: Drama) => void;
}

export default function HeroBanner({ drama, onPlay, onInfo }: HeroBannerProps) {
    if (!drama) {
        return (
            <div className="hero-banner skeleton">
                <div className="hero-overlay" />
                <div className="hero-gradient-bottom" />
            </div>
        );
    }

    const backdropUrl = getBackdropUrl(drama.backdrop_path, 'original');
    const year = drama.first_air_date?.split('-')[0] || '';

    return (
        <div
            className="hero-banner"
            style={{
                backgroundImage: `url(${backdropUrl})`,
            }}
        >
            <div className="hero-overlay" />
            <div className="hero-gradient-bottom" />
            <div className="hero-content">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {drama.name}
                </h1>
                {drama.original_name !== drama.name && (
                    <p className="text-lg text-gray-300 mb-2">{drama.original_name}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    {year && <span>{year}</span>}
                    <span className="flex items-center gap-1">
                        <svg
                            className="w-4 h-4 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {drama.vote_average?.toFixed(1)}
                    </span>
                    {drama.origin_country?.[0] && (
                        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">
                            {drama.origin_country[0]}
                        </span>
                    )}
                </div>
                <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-3 md:line-clamp-4">
                    {drama.overview || 'Sinopse não disponível em português.'}
                </p>
                <div className="flex gap-3">
                    <button
                        className="btn-primary"
                        onClick={() => onPlay?.(drama)}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Assistir
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => onInfo?.(drama)}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Mais Informações
                    </button>
                </div>
            </div>
        </div>
    );
}
