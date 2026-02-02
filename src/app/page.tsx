'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Drama } from '@/types/tmdb';
import {
  fetchKoreanDramas,
  fetchJapaneseDramas,
  fetchChineseDramas,
  fetchTrendingDramas,
  fetchThaiDramas,
  fetchTaiwaneseDramas,
  fetchRecentDramas,
  fetchTopRatedDramas,
  fetchRomanceDramas,
  fetchActionDramas,
  fetchComedyDramas,
  fetchMysteryDramas,
  fetchFantasyDramas,
  fetchCrimeDramas,
} from '@/services/tmdb';
import HeroBanner from '@/components/HeroBanner';
import Carousel from '@/components/Carousel';
export default function Home() {
  const router = useRouter();
  const [featuredDrama, setFeaturedDrama] = useState<Drama | null>(null);
  const [trendingDramas, setTrendingDramas] = useState<Drama[]>([]);
  const [recentDramas, setRecentDramas] = useState<Drama[]>([]);
  const [topRatedDramas, setTopRatedDramas] = useState<Drama[]>([]);
  const [koreanDramas, setKoreanDramas] = useState<Drama[]>([]);
  const [koreanDramasPage2, setKoreanDramasPage2] = useState<Drama[]>([]);
  const [koreanDramasPage3, setKoreanDramasPage3] = useState<Drama[]>([]);
  const [japaneseDramas, setJapaneseDramas] = useState<Drama[]>([]);
  const [japaneseDramasPage2, setJapaneseDramasPage2] = useState<Drama[]>([]);
  const [chineseDramas, setChineseDramas] = useState<Drama[]>([]);
  const [chineseDramasPage2, setChineseDramasPage2] = useState<Drama[]>([]);
  const [thaiDramas, setThaiDramas] = useState<Drama[]>([]);
  const [taiwaneseDramas, setTaiwaneseDramas] = useState<Drama[]>([]);
  const [romanceDramas, setRomanceDramas] = useState<Drama[]>([]);
  const [actionDramas, setActionDramas] = useState<Drama[]>([]);
  const [comedyDramas, setComedyDramas] = useState<Drama[]>([]);
  const [mysteryDramas, setMysteryDramas] = useState<Drama[]>([]);
  const [fantasyDramas, setFantasyDramas] = useState<Drama[]>([]);
  const [crimeDramas, setCrimeDramas] = useState<Drama[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    async function loadDramas() {
      try {
        // Primeira leva - mais importantes (carregar rápido)
        const [trending, korean1, korean2, korean3, japanese1, chinese1] = await Promise.all([
          fetchTrendingDramas(),
          fetchKoreanDramas(1),
          fetchKoreanDramas(2),
          fetchKoreanDramas(3),
          fetchJapaneseDramas(1),
          fetchChineseDramas(1),
        ]);

        setTrendingDramas(trending);
        setKoreanDramas(korean1.results);
        setKoreanDramasPage2(korean2.results);
        setKoreanDramasPage3(korean3.results);
        setJapaneseDramas(japanese1.results);
        setChineseDramas(chinese1.results);

        // Set featured drama from trending or Korean
        const featured = trending[0] || korean1.results[0];
        setFeaturedDrama(featured);
        setIsLoading(false);

        // Segunda leva - mais conteúdo em background
        const [japanese2, chinese2, thai, taiwanese, recent, topRated] = await Promise.all([
          fetchJapaneseDramas(2),
          fetchChineseDramas(2),
          fetchThaiDramas(1),
          fetchTaiwaneseDramas(1),
          fetchRecentDramas(),
          fetchTopRatedDramas(),
        ]);

        setJapaneseDramasPage2(japanese2.results);
        setChineseDramasPage2(chinese2.results);
        setThaiDramas(thai.results);
        setTaiwaneseDramas(taiwanese.results);
        setRecentDramas(recent);
        setTopRatedDramas(topRated);

        // Terceira leva - gêneros
        const [romance, action, comedy, mystery, fantasy, crime] = await Promise.all([
          fetchRomanceDramas(),
          fetchActionDramas(),
          fetchComedyDramas(),
          fetchMysteryDramas(),
          fetchFantasyDramas(),
          fetchCrimeDramas(),
        ]);

        setRomanceDramas(romance.results);
        setActionDramas(action.results);
        setComedyDramas(comedy.results);
        setMysteryDramas(mystery.results);
        setFantasyDramas(fantasy.results);
        setCrimeDramas(crime.results);

      } catch (error) {
        console.error('Erro ao carregar doramas:', error);
        setIsLoading(false);
      }
    }

    loadDramas();
  }, []);

  const handleDramaClick = (drama: Drama) => {
    router.push(`/assistir/${drama.id}`);
  };

  const handlePlay = (drama: Drama) => {
    router.push(`/assistir/${drama.id}`);
  };

  const handleInfo = (drama: Drama) => {
    router.push(`/assistir/${drama.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando doramas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeroBanner
        drama={featuredDrama}
        onPlay={handlePlay}
        onInfo={handleInfo}
      />

      <div className="relative -mt-32 z-10 pb-16">
        {trendingDramas.length > 0 && (
          <Carousel
            title="🔥 Em Alta Esta Semana"
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
            title="🇰🇷 K-Dramas Populares"
            dramas={koreanDramas}
            onDramaClick={handleDramaClick}
          />
        )}

        {romanceDramas.length > 0 && (
          <Carousel
            title="💕 Romance"
            dramas={romanceDramas}
            onDramaClick={handleDramaClick}
          />
        )}

        {koreanDramasPage2.length > 0 && (
          <Carousel
            title="🇰🇷 Mais K-Dramas"
            dramas={koreanDramasPage2}
            onDramaClick={handleDramaClick}
          />
        )}

        {mysteryDramas.length > 0 && (
          <Carousel
            title="🔍 Mistério & Suspense"
            dramas={mysteryDramas}
            onDramaClick={handleDramaClick}
          />
        )}

        {japaneseDramas.length > 0 && (
          <Carousel
            title="🇯🇵 J-Dramas"
            dramas={japaneseDramas}
            onDramaClick={handleDramaClick}
          />
        )}

        {fantasyDramas.length > 0 && (
          <Carousel
            title="✨ Fantasia & Ficção"
            dramas={fantasyDramas}
            onDramaClick={handleDramaClick}
          />
        )}

        {chineseDramas.length > 0 && (
          <Carousel
            title="🇨🇳 C-Dramas"
            dramas={chineseDramas}
            onDramaClick={handleDramaClick}
          />
        )}

        {actionDramas.length > 0 && (
          <Carousel
            title="⚔️ Ação & Aventura"
            dramas={actionDramas}
            onDramaClick={handleDramaClick}
          />
        )}

        {crimeDramas.length > 0 && (
          <Carousel
            title="🕵️ Crime & Investigação"
            dramas={crimeDramas}
            onDramaClick={handleDramaClick}
          />
        )}

        {koreanDramasPage3.length > 0 && (
          <Carousel
            title="🇰🇷 K-Dramas - Descubra Mais"
            dramas={koreanDramasPage3}
            onDramaClick={handleDramaClick}
          />
        )}

        {comedyDramas.length > 0 && (
          <Carousel
            title="😂 Comédia"
            dramas={comedyDramas}
            onDramaClick={handleDramaClick}
          />
        )}

        {japaneseDramasPage2.length > 0 && (
          <Carousel
            title="🇯🇵 Mais J-Dramas"
            dramas={japaneseDramasPage2}
            onDramaClick={handleDramaClick}
          />
        )}

        {chineseDramasPage2.length > 0 && (
          <Carousel
            title="🇨🇳 Mais C-Dramas"
            dramas={chineseDramasPage2}
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
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/todos')}
            className="btn-primary text-lg px-8 py-4"
          >
            🎬 Ver Todos os Doramas
          </button>
        </div>
      </div>
    </div>
  );
}
