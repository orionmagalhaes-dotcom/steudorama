'use client';

import Image from 'next/image';
import { Drama } from '@/types/tmdb';
import { getImageUrl } from '@/services/tmdb';

interface VideoCardProps {
    drama: Drama;
    onClick?: (drama: Drama) => void;
}

export default function VideoCard({ drama, onClick }: VideoCardProps) {
    const posterUrl = getImageUrl(drama.poster_path, 'w300');
    const year = drama.first_air_date?.split('-')[0] || '';
    const rating = drama.vote_average?.toFixed(1) || 'N/A';

    return (
        <div
            className="video-card group"
            onClick={() => onClick?.(drama)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick?.(drama);
                }
            }}
        >
            <Image
                src={posterUrl}
                alt={drama.name}
                width={200}
                height={300}
                className="video-card-image"
                unoptimized={posterUrl.includes('tmdb')}
            />
            <div className="video-card-info">
                <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                    {drama.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    {year && <span>{year}</span>}
                    <span className="flex items-center gap-1">
                        <svg
                            className="w-3 h-3 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {rating}
                    </span>
                </div>
                <div className="mt-2 flex gap-2">
                    <button className="bg-white text-black px-3 py-1 rounded text-xs font-semibold hover:bg-gray-200 transition-colors flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Assistir
                    </button>
                    <button className="bg-gray-600/70 text-white px-2 py-1 rounded text-xs hover:bg-gray-500/70 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
