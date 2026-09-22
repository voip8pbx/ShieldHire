'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed. Please check your credentials.');
            }

            // Redirect to dashboard overview on success
            router.push('/');
            router.refresh();
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background grids instead of soft gradients */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

            <div className="w-full max-w-md bg-[#0d0d0d] border-3 border-white rounded-none p-8 shadow-[6px_6px_0px_0px_rgba(250,204,21,1)] relative z-10">
                <div className="flex flex-col items-center mb-8">
                    {/* Security Logo shield */}
                    <div className="w-16 h-16 bg-[#facc15] border-2 border-black rounded-none flex items-center justify-center mb-4 text-black shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-wider uppercase font-mono">
                        SHIELD<span className="text-[#facc15]">HIRE</span>
                    </h1>
                    <p className="text-[10px] text-[#a3a3a3] uppercase tracking-widest mt-1.5 font-mono font-black">
                        [ SECURE_OPS_CONSOLE_V1 ]
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-600 text-white border-2 border-black rounded-none text-sm font-bold flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-shake">
                        <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-mono uppercase text-xs tracking-wider">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black text-white uppercase tracking-widest mb-2 font-mono">
                            // OPERATOR_EMAIL
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#161616] border-2 border-white focus:border-[#facc15] focus:shadow-[2px_2px_0px_0px_#facc15] rounded-none px-4 py-3 text-white text-sm font-mono outline-none transition-all placeholder-white/20"
                                placeholder="operator@shieldhire.com"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-white uppercase tracking-widest mb-2 font-mono">
                            // SECURITY_KEY
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#161616] border-2 border-white focus:border-[#facc15] focus:shadow-[2px_2px_0px_0px_#facc15] rounded-none px-4 py-3 text-white text-sm font-mono outline-none transition-all placeholder-white/20"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#facc15] border-2 border-black hover:bg-[#eab308] text-black font-black text-sm py-3.5 px-4 rounded-none shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-8 uppercase font-mono"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-none animate-spin" />
                        ) : (
                            <>
                                <span>INITIALIZE_AUTH_SESSION</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
