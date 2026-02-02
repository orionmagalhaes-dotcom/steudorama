'use client';

import { useEffect, useState } from 'react';

export default function DebugEnvPage() {
    const [status, setStatus] = useState<{
        apiKeySet: boolean;
        apiKeyPrefix: string;
        apiTestResult: string;
        timestamp: string;
    } | null>(null);

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

        async function testApi() {
            let testResult = 'Testing...';
            if (!apiKey) {
                testResult = 'N/A - API Key missing';
            } else {
                try {
                    const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR&page=1`);
                    if (res.ok) {
                        testResult = 'SUCCESS (200 OK)';
                    } else {
                        testResult = `FAILED (${res.status} ${res.statusText})`;
                    }
                } catch (e) {
                    testResult = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
                }
            }

            setStatus({
                apiKeySet: !!apiKey,
                apiKeyPrefix: apiKey ? `${apiKey.substring(0, 4)}***` : 'None',
                apiTestResult: testResult,
                timestamp: new Date().toISOString()
            });
        }

        testApi();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <h1 className="text-2xl font-bold mb-6 text-primary">Diagnóstico de Ambiente (EuDorama)</h1>

            <div className="space-y-4 bg-gray-900 p-6 rounded-lg border border-gray-800">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Variável:</span>
                    <span className="font-bold">NEXT_PUBLIC_TMDB_API_KEY</span>
                </div>

                <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Status:</span>
                    <span className={status?.apiKeySet ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                        {status ? (status.apiKeySet ? "DEFINIDA" : "AUSENTE") : "Carregando..."}
                    </span>
                </div>

                <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Prefixo da Chave:</span>
                    <span className="text-blue-400">{status?.apiKeyPrefix || "..."}</span>
                </div>

                <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">Teste de Conexão TMDB:</span>
                    <span className={status?.apiTestResult.includes('SUCCESS') ? "text-green-500" : "text-yellow-500"}>
                        {status?.apiTestResult || "..."}
                    </span>
                </div>

                <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Horário do Teste:</span>
                    <span className="text-gray-500 text-xs">{status?.timestamp}</span>
                </div>
            </div>

            <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800 rounded text-sm text-blue-200">
                <p className="font-bold mb-2">💡 Instruções:</p>
                <p>Se "Status" for <span className="text-red-500 font-bold">AUSENTE</span>, você precisa adicionar a chave no painel do Netlify (Site Settings {'->'} Build {'&'} deploy {'->'} Environment variables).</p>
                <p className="mt-2 text-gray-400 italic">Esta página é para depuração interna e não deve ser indexada em motores de busca.</p>
            </div>

            <div className="mt-8">
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                >
                    Voltar para Início
                </button>
            </div>
        </div>
    );
}
