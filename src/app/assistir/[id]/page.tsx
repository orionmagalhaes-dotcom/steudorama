'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Drama, DramaDetails, Episode } from '@/types/tmdb';
import {
    fetchDramaDetails,
    fetchMovieDetails,
    fetchSeasonEpisodes,
    fetchSimilarDramas,
    fetchSimilarMovies,
    Movie,
    getImageUrl,
    getBackdropUrl,
} from '@/services/tmdb';
import {
    fetchVideoSourcesByTmdbId,
    VideoSource,
    AudioLanguage,
    LANGUAGE_OPTIONS,
    sortSourcesByPortuguese,
} from '@/services/videoSources';

// Extended movie details type
interface MovieDetails extends Movie {
    runtime?: number;
    genres?: { id: number; name: string }[];
    tagline?: string;
    budget?: number;
    revenue?: number;
}

function WatchContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const contentId = Number(params.id);
    const contentType = searchParams.get('tipo') || 'serie';
    const isMovie = contentType === 'filme';

    const [content, setContent] = useState<DramaDetails | MovieDetails | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [similar, setSimilar] = useState<(Drama | Movie)[]>([]);
    const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [showPlayer, setShowPlayer] = useState(false);
    const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
    const [selectedSource, setSelectedSource] = useState(0);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<AudioLanguage>('original');
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);

    useEffect(() => {
        async function loadContent() {
            setIsLoading(true);
            try {
                if (isMovie) {
                    const [movieDetails, similarMovies] = await Promise.all([
                        fetchMovieDetails(contentId),
                        fetchSimilarMovies(contentId),
                    ]);
                    setContent(movieDetails as MovieDetails);
                    setSimilar(similarMovies);
                } else {
                    const [dramaDetails, similarDramas] = await Promise.all([
                        fetchDramaDetails(contentId),
                        fetchSimilarDramas(contentId),
                    ]);

                    setContent(dramaDetails);
                    setSimilar(similarDramas);

                    if (dramaDetails && dramaDetails.seasons?.length > 0) {
                        const firstSeason = dramaDetails.seasons.find(s => s.season_number > 0);
                        if (firstSeason) {
                            setSelectedSeason(firstSeason.season_number);
                            const eps = await fetchSeasonEpisodes(contentId, firstSeason.season_number);
                            setEpisodes(eps);
                        }
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar conteúdo:', error);
            } finally {
                setIsLoading(false);
            }
        }

        if (contentId) {
            loadContent();
        }
    }, [contentId, isMovie]);

    const handleSeasonChange = async (seasonNumber: number) => {
        setSelectedSeason(seasonNumber);
        const eps = await fetchSeasonEpisodes(contentId, seasonNumber);
        setEpisodes(eps);
    };

    const loadVideoSources = async (language: AudioLanguage) => {
        setIsLoadingVideo(true);
        setSelectedSource(0);

        const sources = await fetchVideoSourcesByTmdbId(
            contentId,
            selectedSeason,
            selectedEpisode?.episode_number || 1,
            isMovie,
            language
        );

        // Sort sources prioritizing the selected language
        const sortedSources = sortSourcesByPortuguese(sources);
        setVideoSources(sortedSources);
        setIsLoadingVideo(false);
    };

    const handlePlayMovie = async () => {
        setShowPlayer(true);
        setIsLoadingVideo(true);
        setSelectedSource(0);

        const sources = await fetchVideoSourcesByTmdbId(contentId, 0, 0, true, selectedLanguage);
        const sortedSources = sortSourcesByPortuguese(sources);
        setVideoSources(sortedSources);
        setIsLoadingVideo(false);
    };

    const handlePlayEpisode = async (episode: Episode) => {
        setSelectedEpisode(episode);
        setShowPlayer(true);
        setIsLoadingVideo(true);
        setSelectedSource(0);

        const sources = await fetchVideoSourcesByTmdbId(
            contentId,
            selectedSeason,
            episode.episode_number,
            false,
            selectedLanguage
        );
        const sortedSources = sortSourcesByPortuguese(sources);
        setVideoSources(sortedSources);
        setIsLoadingVideo(false);
    };

    const handleLanguageChange = async (language: AudioLanguage) => {
        setSelectedLanguage(language);
        setShowLanguageMenu(false);

        if (showPlayer) {
            await loadVideoSources(language);
        }
    };

    const handleSimilarClick = (item: Drama | Movie) => {
        const tipo = 'title' in item ? 'filme' : 'serie';
        router.push(`/assistir/${item.id}?tipo=${tipo}`);
    };

    const handleClosePlayer = () => {
        setShowPlayer(false);
        setSelectedEpisode(null);
        setVideoSources([]);
    };

    const getTitle = () => {
        if (!content) return '';
        return 'title' in content ? content.title : content.name;
    };

    const getOriginalTitle = () => {
        if (!content) return '';
        return 'original_title' in content ? content.original_title : content.original_name;
    };

    const getReleaseDate = () => {
        if (!content) return '';
        return 'release_date' in content ? content.release_date : content.first_air_date;
    };

    const getCurrentLanguageLabel = () => {
        const option = LANGUAGE_OPTIONS.find(o => o.value === selectedLanguage);
        return option?.label || '🌍 Original';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">
                        {isMovie ? 'Filme' : 'Série'} não encontrado(a)
                    </h1>
                    <button
                        onClick={() => router.push('/')}
                        className="btn-primary"
                    >
                        Voltar ao início
                    </button>
                </div>
            </div>
        );
    }

    const drama = content as DramaDetails;
    const movie = content as MovieDetails;

    return (
        <div className="min-h-screen pt-16">
            {/* Video Player Modal */}
            {showPlayer && (
                <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
                    {/* Click overlay to close language menu */}
                    {showLanguageMenu && (
                        <div
                            className="fixed inset-0 z-[150]"
                            onClick={() => setShowLanguageMenu(false)}
                        />
                    )}

                    {/* Header - Higher z-index to be above iframe */}
                    <div className="relative z-[200] bg-black p-4 shrink-0 border-b border-gray-800">
                        <div className="flex items-center justify-between max-w-7xl mx-auto flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleClosePlayer}
                                    className="text-white hover:text-primary transition-colors p-2 hover:bg-gray-800 rounded-lg"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <div>
                                    <h2 className="text-white font-semibold">{getTitle()}</h2>
                                    <p className="text-gray-400 text-sm">
                                        {isMovie ? '🎬 Filme' : selectedEpisode ? `T${selectedSeason} E${selectedEpisode.episode_number} - ${selectedEpisode.name}` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Language Selector - Button style with modal */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
                                    >
                                        <span className="text-lg">🔊</span>
                                        <span>{getCurrentLanguageLabel()}</span>
                                        <svg className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showLanguageMenu && (
                                        <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-600 py-2 min-w-[240px] z-[300]">
                                            <div className="px-4 py-3 border-b border-gray-700 bg-gray-900 rounded-t-xl">
                                                <p className="text-white text-sm font-bold">🔊 Selecionar Áudio</p>
                                                <p className="text-gray-400 text-xs mt-1">Escolha o idioma de dublagem</p>
                                            </div>
                                            <div className="py-1">
                                                {LANGUAGE_OPTIONS.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => handleLanguageChange(option.value)}
                                                        className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between ${selectedLanguage === option.value ? 'bg-primary/30' : ''
                                                            }`}
                                                    >
                                                        <div>
                                                            <span className="text-white font-medium">{option.label}</span>
                                                            <p className="text-gray-400 text-xs mt-0.5">{option.description}</p>
                                                        </div>
                                                        {selectedLanguage === option.value && (
                                                            <span className="text-primary text-xl">✓</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Source Selector */}
                                {videoSources.length > 1 && (
                                    <select
                                        value={selectedSource}
                                        onChange={(e) => setSelectedSource(Number(e.target.value))}
                                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg border-0 text-sm cursor-pointer font-medium appearance-none"
                                        style={{ minWidth: '180px' }}
                                    >
                                        {videoSources.map((source, index) => (
                                            <option key={index} value={index}>
                                                📺 {source.provider || `Fonte ${index + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Video Container - Below header, pointer events disabled when menu open */}
                    <div className={`flex-1 relative ${showLanguageMenu ? 'pointer-events-none' : ''}`}>
                        {isLoadingVideo ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-gray-400">Carregando fontes de vídeo...</p>
                                </div>
                            </div>
                        ) : videoSources.length > 0 ? (
                            <iframe
                                src={videoSources[selectedSource]?.url}
                                className="absolute inset-0 w-full h-full"
                                allowFullScreen
                                allow="autoplay; fullscreen; picture-in-picture"
                                style={{ border: 'none' }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl text-white mb-2">Nenhuma fonte encontrada</h3>
                                    <p className="text-gray-400">Tente mudar o idioma ou a fonte</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Episode Navigator (only for TV shows) - Fixed at bottom */}
                    {!isMovie && selectedEpisode && (
                        <div className="relative z-[200] bg-black p-4 shrink-0 border-t border-gray-800">
                            <div className="flex justify-center gap-4">
                                {selectedEpisode.episode_number > 1 && (
                                    <button
                                        onClick={() => {
                                            const prevEp = episodes.find(e => e.episode_number === selectedEpisode.episode_number - 1);
                                            if (prevEp) handlePlayEpisode(prevEp);
                                        }}
                                        className="btn-secondary"
                                    >
                                        ← Episódio Anterior
                                    </button>
                                )}
                                {selectedEpisode.episode_number < episodes.length && (
                                    <button
                                        onClick={() => {
                                            const nextEp = episodes.find(e => e.episode_number === selectedEpisode.episode_number + 1);
                                            if (nextEp) handlePlayEpisode(nextEp);
                                        }}
                                        className="btn-primary"
                                    >
                                        Próximo Episódio →
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Backdrop Header */}
            <div
                className="relative h-[50vh] bg-cover bg-center"
                style={{
                    backgroundImage: `url(${getBackdropUrl(content.backdrop_path, 'original')})`,
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-6xl mx-auto flex gap-8">
                        <Image
                            src={getImageUrl(content.poster_path, 'w300')}
                            alt={getTitle()}
                            width={200}
                            height={300}
                            className="rounded-lg shadow-2xl hidden md:block"
                            unoptimized
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${isMovie ? 'bg-blue-600' : 'bg-green-600'}`}>
                                    {isMovie ? '🎬 Filme' : '📺 Série'}
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2">{getTitle()}</h1>
                            {getOriginalTitle() !== getTitle() && (
                                <p className="text-gray-400 mb-4">{getOriginalTitle()}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                <span>{getReleaseDate()?.split('-')[0]}</span>
                                {isMovie && movie.runtime && (
                                    <span>{movie.runtime} min</span>
                                )}
                                {!isMovie && drama.number_of_seasons && (
                                    <>
                                        <span>{drama.number_of_seasons} temporada(s)</span>
                                        <span>{drama.number_of_episodes} episódio(s)</span>
                                    </>
                                )}
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {content.vote_average?.toFixed(1)}
                                </span>
                            </div>
                            <p className="text-gray-300 line-clamp-4 mb-6">
                                {content.overview || 'Sinopse não disponível em português.'}
                            </p>

                            {/* Play Button with Language Selector */}
                            <div className="flex items-center gap-4 flex-wrap">
                                {isMovie ? (
                                    <button
                                        onClick={handlePlayMovie}
                                        className="btn-primary text-lg"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                        Assistir Filme
                                    </button>
                                ) : episodes.length > 0 && (
                                    <button
                                        onClick={() => handlePlayEpisode(episodes[0])}
                                        className="btn-primary text-lg"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                        Assistir Episódio 1
                                    </button>
                                )}

                                {/* Pre-select language */}
                                <div className="relative">
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value as AudioLanguage)}
                                        className="bg-gray-800/80 text-white px-4 py-3 rounded-lg border border-gray-600 appearance-none cursor-pointer pr-10"
                                    >
                                        {LANGUAGE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Episodes (only for TV shows) */}
                {!isMovie && (
                    <>
                        {/* Seasons Selector */}
                        {drama.seasons && drama.seasons.filter(s => s.season_number > 0).length > 1 && (
                            <div className="mb-6">
                                <select
                                    value={selectedSeason}
                                    onChange={(e) => handleSeasonChange(Number(e.target.value))}
                                    className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-primary outline-none"
                                >
                                    {drama.seasons
                                        .filter(s => s.season_number > 0)
                                        .map(season => (
                                            <option key={season.id} value={season.season_number}>
                                                {season.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}

                        {/* Episodes Grid */}
                        <h2 className="text-xl font-semibold text-white mb-4">Episódios</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                            {episodes.map(episode => (
                                <div
                                    key={episode.id}
                                    onClick={() => handlePlayEpisode(episode)}
                                    className="bg-gray-800/50 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700/50 transition-colors group"
                                >
                                    <div className="relative aspect-video bg-gray-900">
                                        {episode.still_path && (
                                            <Image
                                                src={getImageUrl(episode.still_path, 'w500')}
                                                alt={episode.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-white font-medium text-sm">
                                            {episode.episode_number}. {episode.name}
                                        </h3>
                                        {episode.runtime && (
                                            <p className="text-gray-500 text-xs mt-1">{episode.runtime} min</p>
                                        )}
                                        {episode.overview && (
                                            <p className="text-gray-400 text-xs mt-2 line-clamp-2">
                                                {episode.overview}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Similar Content */}
                {similar.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            {isMovie ? '🎬 Filmes Similares' : '📺 Séries Similares'}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {similar.slice(0, 12).map((item) => {
                                const title = 'title' in item ? item.title : item.name;
                                const date = 'release_date' in item ? item.release_date : item.first_air_date;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSimilarClick(item)}
                                        className="cursor-pointer group"
                                    >
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                                            <Image
                                                src={getImageUrl(item.poster_path, 'w300')}
                                                alt={title}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                                        </div>
                                        <h3 className="text-white text-sm font-medium mt-2 line-clamp-2">
                                            {title}
                                        </h3>
                                        <p className="text-gray-500 text-xs">
                                            {date?.split('-')[0]}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WatchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <WatchContent />
        </Suspense>
    );
}
