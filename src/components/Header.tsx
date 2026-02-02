'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { searchMulti, getImageUrl, Movie } from '@/services/tmdb';
import { Drama } from '@/types/tmdb';
import { useAuth } from '@/context/AuthContext';

// Genre IDs from TMDB
const GENRES = {
    aventura: { id: 12, tvId: 10759, name: 'Aventura', emoji: '🗺️' },
    terror: { id: 27, tvId: 9648, name: 'Terror', emoji: '👻' },
    drama: { id: 18, tvId: 18, name: 'Drama', emoji: '🎭' },
    comedia: { id: 35, tvId: 35, name: 'Comédia', emoji: '😂' },
    animacao: { id: 16, tvId: 16, name: 'Animação', emoji: '🎨' },
    acao: { id: 28, tvId: 10759, name: 'Ação', emoji: '💥' },
    romance: { id: 10749, tvId: 10749, name: 'Romance', emoji: '💕' },
    ficcao: { id: 878, tvId: 10765, name: 'Ficção', emoji: '🚀' },
};

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<(Drama | Movie)[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showExploreMenu, setShowExploreMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const exploreRef = useRef<HTMLLIElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Click outside to close menus
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearch(false);
                setSearchResults([]);
            }
            if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
                setShowExploreMenu(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    const handleSearchInput = (value: string) => {
        setSearchQuery(value);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (value.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchMulti(value);
                setSearchResults(results.results.slice(0, 8));
            } catch (error) {
                console.error('Erro na busca:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/buscar?q=${encodeURIComponent(searchQuery)}`);
            setShowSearch(false);
            setSearchResults([]);
        }
    };

    const handleResultClick = (item: Drama | Movie) => {
        const mediaType = 'title' in item ? 'filme' : 'serie';
        router.push(`/assistir/${item.id}?tipo=${mediaType}`);
        setShowSearch(false);
        setSearchResults([]);
        setSearchQuery('');
    };

    const getItemTitle = (item: Drama | Movie) => {
        return 'title' in item ? item.title : item.name;
    };

    const getItemYear = (item: Drama | Movie) => {
        const date = 'release_date' in item ? item.release_date : item.first_air_date;
        return date?.split('-')[0] || 'N/A';
    };

    const getItemPoster = (item: Drama | Movie) => {
        return getImageUrl(item.poster_path, 'w200');
    };

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        router.push('/login');
    };

    // Don't show header on login page
    if (pathname === '/login') {
        return null;
    }

    return (
        <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
            <div className="header-nav">
                <Link href="/" className="header-logo">
                    EuDorama
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:block">
                    <ul className="nav-links">
                        <li>
                            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                                Início
                            </Link>
                        </li>
                        <li>
                            <Link href="/filmes" className={`nav-link ${pathname === '/filmes' ? 'active' : ''}`}>
                                🎬 Filmes
                            </Link>
                        </li>
                        <li>
                            <Link href="/series" className={`nav-link ${pathname === '/series' ? 'active' : ''}`}>
                                📺 Séries
                            </Link>
                        </li>
                        <li>
                            <Link href="/doramas" className={`nav-link ${pathname === '/doramas' ? 'active' : ''}`}>
                                🇰🇷 Doramas
                            </Link>
                        </li>

                        {/* Explorar Mega Menu */}
                        <li className="relative" ref={exploreRef}>
                            <button
                                onClick={() => setShowExploreMenu(!showExploreMenu)}
                                className="nav-link flex items-center gap-1"
                            >
                                🎯 Explorar
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showExploreMenu && (
                                <div className="absolute top-full right-0 mt-2 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 py-5 px-6 z-50 min-w-[450px]">
                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Tipos de Conteúdo */}
                                        <div>
                                            <h4 className="text-primary font-bold mb-4 text-sm uppercase tracking-wider">📚 Todo Conteúdo</h4>
                                            <div className="space-y-3">
                                                <Link href="/todos" className="flex items-center gap-2 text-white hover:text-primary transition-colors font-semibold text-lg" onClick={() => setShowExploreMenu(false)}>
                                                    <span className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">📚</span>
                                                    Ver Todo Catálogo
                                                </Link>
                                                <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                                                    <Link href="/filmes" className="block text-gray-300 hover:text-white transition-colors" onClick={() => setShowExploreMenu(false)}>
                                                        🎬 Todos os Filmes
                                                    </Link>
                                                    <Link href="/series" className="block text-gray-300 hover:text-white transition-colors" onClick={() => setShowExploreMenu(false)}>
                                                        📺 Todas as Séries
                                                    </Link>
                                                    <Link href="/doramas" className="block text-gray-300 hover:text-white transition-colors" onClick={() => setShowExploreMenu(false)}>
                                                        🇰🇷 Doramas Asiáticos
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Gêneros */}
                                        <div>
                                            <h4 className="text-primary font-bold mb-4 text-sm uppercase tracking-wider">🎭 Por Gênero</h4>
                                            <div className="space-y-2">
                                                {Object.entries(GENRES).map(([key, genre]) => (
                                                    <Link
                                                        key={key}
                                                        href={`/genero/${key}`}
                                                        className="block text-gray-300 hover:text-white transition-colors"
                                                        onClick={() => setShowExploreMenu(false)}
                                                    >
                                                        {genre.emoji} {genre.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-5 pt-4 border-t border-gray-700 text-center">
                                        <Link
                                            href="/todos"
                                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-full font-semibold transition-colors"
                                            onClick={() => setShowExploreMenu(false)}
                                        >
                                            📚 Explorar Todo o Catálogo
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </li>
                    </ul>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showMobileMenu ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Search Area */}
            <div className="flex items-center gap-4" ref={searchRef}>
                {showSearch ? (
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchInput(e.target.value)}
                            placeholder="Buscar filmes, séries..."
                            className="w-48 md:w-64 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-primary outline-none text-sm"
                            autoFocus
                        />

                        {/* Search Results Dropdown */}
                        {(searchResults.length > 0 || isSearching) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 max-h-96 overflow-y-auto z-50">
                                {isSearching ? (
                                    <div className="p-4 text-center text-gray-400">
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                                    </div>
                                ) : (
                                    searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleResultClick(item)}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer transition-colors"
                                        >
                                            <img
                                                src={getItemPoster(item)}
                                                alt={getItemTitle(item)}
                                                className="w-10 h-14 object-cover rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-medium truncate">
                                                    {getItemTitle(item)}
                                                </p>
                                                <p className="text-gray-400 text-xs">
                                                    {'title' in item ? '🎬 Filme' : '📺 Série'} • {getItemYear(item)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </form>
                ) : (
                    <button
                        onClick={() => setShowSearch(true)}
                        className="text-white hover:text-gray-300 transition-colors p-2"
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
                                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                            />
                        </svg>
                    </button>
                )}

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-sm hover:bg-primary/80 transition-colors"
                            >
                                {user ? user.username.charAt(0).toUpperCase() : 'A'}
                            </button>

                            {showUserMenu && (
                                <div className="absolute top-full right-0 mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[180px] z-50">
                                    <div className="px-4 py-2 border-b border-gray-700">
                                        <p className="text-white font-medium">{user?.username}</p>
                                        <p className="text-gray-400 text-xs">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
                                    </div>

                                    {user?.role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Painel Admin
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sair
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Entrar
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-sm md:hidden border-t border-gray-800">
                    <nav className="p-4">
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="block py-2 text-white hover:text-primary transition-colors" onClick={() => setShowMobileMenu(false)}>
                                    🏠 Início
                                </Link>
                            </li>
                            <li className="border-t border-gray-800 pt-2 mt-2">
                                <Link href="/todos" className="block py-2 text-white hover:text-primary transition-colors font-bold text-lg" onClick={() => setShowMobileMenu(false)}>
                                    📚 VER TODO O CATÁLOGO
                                </Link>
                            </li>
                            <li className="border-t border-gray-800 pt-2 mt-2">
                                <span className="text-gray-500 text-sm">Conteúdo:</span>
                            </li>
                            <li>
                                <Link href="/filmes" className="block py-2 text-white hover:text-primary transition-colors" onClick={() => setShowMobileMenu(false)}>
                                    🎬 Filmes
                                </Link>
                            </li>
                            <li>
                                <Link href="/series" className="block py-2 text-white hover:text-primary transition-colors" onClick={() => setShowMobileMenu(false)}>
                                    📺 Séries
                                </Link>
                            </li>
                            <li>
                                <Link href="/doramas" className="block py-2 text-white hover:text-primary transition-colors" onClick={() => setShowMobileMenu(false)}>
                                    🇰🇷 Doramas
                                </Link>
                            </li>
                            <li className="border-t border-gray-800 pt-2 mt-2">
                                <span className="text-gray-500 text-sm">Gêneros:</span>
                            </li>
                            {Object.entries(GENRES).map(([key, genre]) => (
                                <li key={key}>
                                    <Link href={`/genero/${key}`} className="block py-2 text-white hover:text-primary transition-colors pl-4" onClick={() => setShowMobileMenu(false)}>
                                        {genre.emoji} {genre.name}
                                    </Link>
                                </li>
                            ))}

                            {/* Admin and Logout in Mobile Menu */}
                            {/* Admin and Logout in Mobile Menu */}
                            {isAuthenticated ? (
                                <>
                                    <li className="border-t border-gray-800 pt-2 mt-2">
                                        <span className="text-gray-500 text-sm">Conta:</span>
                                    </li>
                                    {user?.role === 'admin' && (
                                        <li>
                                            <Link href="/admin" className="block py-2 text-white hover:text-primary transition-colors" onClick={() => setShowMobileMenu(false)}>
                                                ⚙️ Painel Admin
                                            </Link>
                                        </li>
                                    )}
                                    <li>
                                        <button
                                            onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                                            className="block py-2 text-red-400 hover:text-red-300 transition-colors w-full text-left"
                                        >
                                            🚪 Sair
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="border-t border-gray-800 pt-2 mt-2">
                                        <span className="text-gray-500 text-sm">Conta:</span>
                                    </li>
                                    <li>
                                        <Link
                                            href="/login"
                                            className="block py-2 text-white hover:text-primary transition-colors font-medium"
                                            onClick={() => setShowMobileMenu(false)}
                                        >
                                            🔐 Entrar
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>
                </div>
            )}
        </header>
    );
}

