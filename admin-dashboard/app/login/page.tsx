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
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background decorations */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#facc15] opacity-5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#eab308] opacity-5 blur-[120px] rounded-full" />

            <div className="w-full max-w-md bg-[#161616] border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-8">
                    {/* Security Logo shield */}
                    <div className="w-16 h-16 bg-[#facc15]/10 border border-[#facc15]/20 rounded-2xl flex items-center justify-center mb-4 text-[#facc15] shadow-lg">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                        Shield<span className="text-[#facc15]">Hire</span>
                    </h1>
                    <p className="text-xs text-[#a3a3a3] uppercase tracking-widest mt-1.5 font-semibold">
                        Control Center Login
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-shake">
                        <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-2">
                            Admin Email Address
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#202020] border border-white/5 focus:border-[#facc15]/50 focus:ring-1 focus:ring-[#facc15]/30 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-white/20"
                                placeholder="admin@shieldhire.com"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-2">
                            Security Key / Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#202020] border border-white/5 focus:border-[#facc15]/50 focus:ring-1 focus:ring-[#facc15]/30 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-white/20"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#facc15] hover:bg-[#eab308] text-black font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-lg hover:shadow-[#facc15]/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-8"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Sign In Securely</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
