'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types
interface Session {
    id: string;
    device: string;
    browser: string;
    ip: string;
    loginTime: string;
    lastActivity: string;
}

interface User {
    username: string;
    role: 'admin' | 'user';
}

interface AuthStats {
    totalAccounts: number;
    activeSessions: number;
    totalDevices: number;
    sessions: Session[];
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    stats: AuthStats;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate a unique session ID
const generateSessionId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Get device info from user agent
const getDeviceInfo = (): { device: string; browser: string } => {
    if (typeof window === 'undefined') {
        return { device: 'Unknown', browser: 'Unknown' };
    }

    const ua = navigator.userAgent;

    // Detect device
    let device = 'Desktop';
    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet|ipad/i.test(ua)) device = 'Tablet';
    else if (/windows/i.test(ua)) device = 'Windows PC';
    else if (/macintosh/i.test(ua)) device = 'Mac';
    else if (/linux/i.test(ua)) device = 'Linux';

    // Detect browser
    let browser = 'Unknown';
    if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/edg/i.test(ua)) browser = 'Edge';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';

    return { device, browser };
};

// Valid credentials (hardcoded for localhost development)
const VALID_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<AuthStats>({
        totalAccounts: 1,
        activeSessions: 0,
        totalDevices: 0,
        sessions: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Load auth state from localStorage
    useEffect(() => {
        const storedAuth = localStorage.getItem('eudorama_auth');
        const storedSessions = localStorage.getItem('eudorama_sessions');
        const storedSessionId = localStorage.getItem('eudorama_session_id');

        if (storedAuth) {
            try {
                const authData = JSON.parse(storedAuth);
                setIsAuthenticated(true);
                setUser(authData.user);
                setCurrentSessionId(storedSessionId);
            } catch {
                localStorage.removeItem('eudorama_auth');
            }
        }

        if (storedSessions) {
            try {
                const sessionsData = JSON.parse(storedSessions);
                // Filter out sessions older than 24 hours
                const now = Date.now();
                const activeSessions = sessionsData.filter((s: Session) => {
                    const sessionTime = new Date(s.lastActivity).getTime();
                    return now - sessionTime < 24 * 60 * 60 * 1000;
                });

                // Count unique devices
                const uniqueDevices = new Set(activeSessions.map((s: Session) => `${s.device}-${s.browser}`));

                setStats({
                    totalAccounts: 1,
                    activeSessions: activeSessions.length,
                    totalDevices: uniqueDevices.size,
                    sessions: activeSessions
                });

                // Save cleaned sessions
                localStorage.setItem('eudorama_sessions', JSON.stringify(activeSessions));
            } catch {
                localStorage.removeItem('eudorama_sessions');
            }
        }

        setIsLoading(false);
    }, []);

    // Update last activity periodically
    useEffect(() => {
        if (!isAuthenticated || !currentSessionId) return;

        const updateActivity = () => {
            const storedSessions = localStorage.getItem('eudorama_sessions');
            if (storedSessions) {
                try {
                    const sessions: Session[] = JSON.parse(storedSessions);
                    const updatedSessions = sessions.map(s =>
                        s.id === currentSessionId
                            ? { ...s, lastActivity: new Date().toISOString() }
                            : s
                    );
                    localStorage.setItem('eudorama_sessions', JSON.stringify(updatedSessions));
                } catch {
                    // Ignore errors
                }
            }
        };

        const interval = setInterval(updateActivity, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [isAuthenticated, currentSessionId]);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        // Validate credentials
        if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
            const userData: User = { username, role: 'admin' };

            // Create new session
            const sessionId = generateSessionId();
            const { device, browser } = getDeviceInfo();
            const newSession: Session = {
                id: sessionId,
                device,
                browser,
                ip: 'localhost',
                loginTime: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            };

            // Get existing sessions and add new one
            const storedSessions = localStorage.getItem('eudorama_sessions');
            let sessions: Session[] = [];
            if (storedSessions) {
                try {
                    sessions = JSON.parse(storedSessions);
                } catch {
                    sessions = [];
                }
            }
            sessions.push(newSession);

            // Count unique devices
            const uniqueDevices = new Set(sessions.map(s => `${s.device}-${s.browser}`));

            // Save to localStorage
            localStorage.setItem('eudorama_auth', JSON.stringify({ user: userData }));
            localStorage.setItem('eudorama_sessions', JSON.stringify(sessions));
            localStorage.setItem('eudorama_session_id', sessionId);

            // Update state
            setIsAuthenticated(true);
            setUser(userData);
            setCurrentSessionId(sessionId);
            setStats({
                totalAccounts: 1,
                activeSessions: sessions.length,
                totalDevices: uniqueDevices.size,
                sessions
            });

            return true;
        }

        return false;
    }, []);

    const logout = useCallback(() => {
        // Remove current session from sessions list
        if (currentSessionId) {
            const storedSessions = localStorage.getItem('eudorama_sessions');
            if (storedSessions) {
                try {
                    const sessions: Session[] = JSON.parse(storedSessions);
                    const updatedSessions = sessions.filter(s => s.id !== currentSessionId);
                    localStorage.setItem('eudorama_sessions', JSON.stringify(updatedSessions));

                    const uniqueDevices = new Set(updatedSessions.map(s => `${s.device}-${s.browser}`));
                    setStats({
                        totalAccounts: 1,
                        activeSessions: updatedSessions.length,
                        totalDevices: uniqueDevices.size,
                        sessions: updatedSessions
                    });
                } catch {
                    // Ignore errors
                }
            }
        }

        localStorage.removeItem('eudorama_auth');
        localStorage.removeItem('eudorama_session_id');
        setIsAuthenticated(false);
        setUser(null);
        setCurrentSessionId(null);
    }, [currentSessionId]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, stats, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
