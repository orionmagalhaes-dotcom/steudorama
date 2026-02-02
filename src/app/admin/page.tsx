'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user, stats, logout } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p>Carregando painel...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeSinceActivity = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m atrás`;
        if (hours < 24) return `${hours}h atrás`;
        return `${Math.floor(hours / 24)}d atrás`;
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-header-content">
                    <div>
                        <h1 className="admin-title">Painel Administrativo</h1>
                        <p className="admin-subtitle">Bem-vindo, {user?.username}</p>
                    </div>
                    <div className="admin-header-actions">
                        <button onClick={() => router.push('/')} className="admin-btn-secondary">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Voltar ao Site
                        </button>
                        <button onClick={logout} className="admin-btn-logout">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="admin-main">
                {/* Stats Cards */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-blue">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="admin-stat-content">
                            <h3 className="admin-stat-value">{stats.totalAccounts}</h3>
                            <p className="admin-stat-label">Conta Criada</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-green">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="admin-stat-content">
                            <h3 className="admin-stat-value">{stats.activeSessions}</h3>
                            <p className="admin-stat-label">Sessões Ativas</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-purple">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="admin-stat-content">
                            <h3 className="admin-stat-value">{stats.totalDevices}</h3>
                            <p className="admin-stat-label">Dispositivos</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon-orange">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="admin-stat-content">
                            <h3 className="admin-stat-value">24h</h3>
                            <p className="admin-stat-label">Sessão Máxima</p>
                        </div>
                    </div>
                </div>

                {/* Sessions Table */}
                <div className="admin-section">
                    <h2 className="admin-section-title">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Sessões Ativas
                    </h2>

                    {stats.sessions.length === 0 ? (
                        <div className="admin-empty-state">
                            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p>Nenhuma sessão ativa no momento</p>
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Dispositivo</th>
                                        <th>Navegador</th>
                                        <th>IP</th>
                                        <th>Login</th>
                                        <th>Última Atividade</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.sessions.map((session) => (
                                        <tr key={session.id}>
                                            <td>
                                                <div className="admin-device-cell">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        {session.device.includes('Mobile') ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        ) : (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        )}
                                                    </svg>
                                                    <span>{session.device}</span>
                                                </div>
                                            </td>
                                            <td>{session.browser}</td>
                                            <td><code>{session.ip}</code></td>
                                            <td>{formatDate(session.loginTime)}</td>
                                            <td>{getTimeSinceActivity(session.lastActivity)}</td>
                                            <td>
                                                <span className="admin-status-badge admin-status-active">
                                                    Ativo
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* System Info */}
                <div className="admin-section">
                    <h2 className="admin-section-title">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Informações do Sistema
                    </h2>
                    <div className="admin-info-grid">
                        <div className="admin-info-item">
                            <span className="admin-info-label">Versão</span>
                            <span className="admin-info-value">1.0.0</span>
                        </div>
                        <div className="admin-info-item">
                            <span className="admin-info-label">Ambiente</span>
                            <span className="admin-info-value">Desenvolvimento (localhost)</span>
                        </div>
                        <div className="admin-info-item">
                            <span className="admin-info-label">Autenticação</span>
                            <span className="admin-info-value">Local Storage</span>
                        </div>
                        <div className="admin-info-item">
                            <span className="admin-info-label">Expiração de Sessão</span>
                            <span className="admin-info-value">24 horas</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
