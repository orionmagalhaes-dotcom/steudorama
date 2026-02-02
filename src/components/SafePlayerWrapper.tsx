'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import VideoPlayer from './VideoPlayer';

interface VideoSource {
    url: string;
    quality: string;
    type: 'mp4' | 'hls' | 'embed';
    provider?: string;
}

interface SafePlayerWrapperProps {
    source: VideoSource;
    onAdBlocked?: () => void;
    onError?: (error: string) => void;
}

/**
 * SafePlayerWrapper - Componente de proteção contra anúncios
 * 
 * Funcionalidades:
 * 1. Sandbox restritivo para iframes (bloqueia popups/redirects)
 * 2. Overlay para capturar cliques maliciosos
 * 3. Bloqueio global de window.open
 * 4. Fallback para VideoPlayer nativo quando disponível
 */
export default function SafePlayerWrapper({
    source,
    onAdBlocked,
    onError,
}: SafePlayerWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [clickCount, setClickCount] = useState(0);
    const [showShield, setShowShield] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Bloqueia window.open globalmente quando o componente monta
    useEffect(() => {
        const originalOpen = window.open;
        
        // Override window.open para bloquear popups
        window.open = function(...args) {
            console.log('[SafePlayer] Popup bloqueado:', args[0]);
            onAdBlocked?.();
            return null;
        };

        // Bloqueia eventos de beforeunload/unload maliciosos
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Permite apenas se o usuário realmente quer sair
            if (document.activeElement?.tagName === 'IFRAME') {
                e.preventDefault();
                e.returnValue = '';
                console.log('[SafePlayer] Tentativa de redirect bloqueada');
                onAdBlocked?.();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.open = originalOpen;
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [onAdBlocked]);

    // Detecta cliques múltiplos rápidos (indicador de clickjacking)
    const handleContainerClick = useCallback((e: React.MouseEvent) => {
        // Se o clique foi no shield, bloqueia
        if ((e.target as HTMLElement).classList.contains('click-shield')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[SafePlayer] Clique em overlay bloqueado');
            onAdBlocked?.();
            return;
        }

        setClickCount(prev => prev + 1);

        // Reset contador após 2 segundos
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }

        clickTimeoutRef.current = setTimeout(() => {
            setClickCount(0);
        }, 2000);

        // Se mais de 5 cliques em 2 segundos, ativa o shield
        if (clickCount > 5) {
            setShowShield(true);
            console.log('[SafePlayer] Clickjacking detectado, shield ativado');
            onAdBlocked?.();

            // Desativa após 3 segundos
            setTimeout(() => {
                setShowShield(false);
                setClickCount(0);
            }, 3000);
        }
    }, [clickCount, onAdBlocked]);

    // Monitora tentativas de navigation do iframe
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            setIsLoaded(true);
            
            // Tenta injetar bloqueador de popups no iframe (limitado pela Same-Origin)
            try {
                const iframeWindow = iframe.contentWindow;
                if (iframeWindow) {
                    // Isso só funciona se for same-origin
                    (iframeWindow as Window).open = () => {
                        onAdBlocked?.();
                        return null;
                    };
                }
            } catch {
                // Cross-origin - não podemos acessar, mas o sandbox já bloqueia
            }
        };

        iframe.addEventListener('load', handleLoad);
        return () => iframe.removeEventListener('load', handleLoad);
    }, [onAdBlocked]);

    // Se é um vídeo direto (MP4/HLS), usa o player nativo sem ads
    if (source.type === 'mp4' || source.type === 'hls') {
        return (
            <div className="safe-player-container absolute inset-0">
                <VideoPlayer
                    src={source.url}
                    type={source.type === 'hls' ? 'hls' : 'mp4'}
                    autoPlay
                />
            </div>
        );
    }

    // Para embeds, usa iframe com sandbox restritivo
    return (
        <div
            ref={containerRef}
            className="safe-player-container absolute inset-0"
            onClick={handleContainerClick}
        >
            {/* Loading indicator */}
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">Carregando player seguro...</p>
                    </div>
                </div>
            )}

            {/* Iframe com sandbox restritivo */}
            <iframe
                ref={iframeRef}
                src={source.url}
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none' }}
                // Sandbox restritivo - BLOQUEIA:
                // - Popups (sem allow-popups)
                // - Navegação do topo (sem allow-top-navigation)
                // - Downloads (sem allow-downloads)
                // PERMITE:
                // - Scripts necessários para o player
                // - Same-origin para APIs do player
                // - Fullscreen para assistir em tela cheia
                // - Presentation para Picture-in-Picture
                sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                referrerPolicy="no-referrer"
                loading="lazy"
            />

            {/* Shield de proteção contra clickjacking */}
            <div
                className={`click-shield absolute inset-0 z-20 transition-opacity duration-200 ${
                    showShield ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold mb-2">Proteção Ativa</h3>
                        <p className="text-gray-400 text-sm">
                            Cliques suspeitos detectados. Aguarde um momento...
                        </p>
                    </div>
                </div>
            </div>

            {/* Indicador de proteção ativa */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-300">Proteção ativa</span>
            </div>
        </div>
    );
}
