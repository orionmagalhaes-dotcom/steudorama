'use client';

import { useRef } from 'react';
import { Drama } from '@/types/tmdb';
import VideoCard from './VideoCard';

interface CarouselProps {
    title: string;
    dramas: Drama[];
    onDramaClick?: (drama: Drama) => void;
}

export default function Carousel({ title, dramas, onDramaClick }: CarouselProps) {
    const trackRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (trackRef.current) {
            const scrollAmount = trackRef.current.clientWidth * 0.8;
            trackRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (!dramas.length) {
        return null;
    }

    return (
        <section className="category-row">
            <h2 className="section-title">{title}</h2>
            <div className="carousel-container">
                <button
                    className="carousel-btn carousel-btn-left"
                    onClick={() => scroll('left')}
                    aria-label="Anterior"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5 8.25 12l7.5-7.5"
                        />
                    </svg>
                </button>
                <div className="carousel-track" ref={trackRef}>
                    {dramas.map((drama) => (
                        <VideoCard key={drama.id} drama={drama} onClick={onDramaClick} />
                    ))}
                </div>
                <button
                    className="carousel-btn carousel-btn-right"
                    onClick={() => scroll('right')}
                    aria-label="Próximo"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                    </svg>
                </button>
            </div>
        </section>
    );
}
