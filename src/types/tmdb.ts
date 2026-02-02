// TMDB Drama Types
export interface Drama {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  origin_country: string[];
  popularity: number;
}

export interface DramaDetails extends Drama {
  number_of_episodes: number;
  number_of_seasons: number;
  status: string;
  tagline: string;
  homepage: string;
  networks: Network[];
  production_companies: ProductionCompany[];
  seasons: Season[];
}

export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string;
  vote_average: number;
  runtime: number;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

// Video Source Types
export interface VideoSource {
  url: string;
  quality: string;
  type: 'mp4' | 'hls' | 'm3u8';
}

export interface EpisodeSource {
  episodeId: number;
  tmdbId: number;
  sources: VideoSource[];
  addedAt: string;
}

// Category types
export type DramaCategory = 'korean' | 'japanese' | 'chinese';

export interface CategoryConfig {
  id: DramaCategory;
  title: string;
  originCountry: string;
}

export const DRAMA_CATEGORIES: CategoryConfig[] = [
  { id: 'korean', title: 'Doramas Coreanos', originCountry: 'KR' },
  { id: 'japanese', title: 'Doramas Japoneses', originCountry: 'JP' },
  { id: 'chinese', title: 'Doramas Chineses', originCountry: 'CN' },
];
