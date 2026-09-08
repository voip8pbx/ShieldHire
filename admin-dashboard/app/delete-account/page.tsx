'use client';

import { useState } from 'react';

type Step = 'form' | 'submitted';

export default function DeleteAccountPage() {
    const [step, setStep] = useState<Step>('form');
    const [email, setEmail] = useState('');
    const [accountType, setAccountType] = useState<'CLIENT' | 'BOUNCER'>('CLIENT');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refId, setRefId] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/delete-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, accountType, reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed');
            setRefId(data.refId || '');
            setStep('submitted');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] flex flex-col font-sans">
            {/* Background grid */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 border-b-[3px] border-white bg-[#0d0d0d] px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#facc15] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#fff]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <span className="text-white font-black text-lg tracking-wider uppercase font-mono">
                    SHIELD<span className="text-[#facc15]">HIRE</span>
                </span>
            </header>

            <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-2xl">

                    {/* Page title */}
                    <div className="mb-8 border-b-[3px] border-[#facc15] pb-6">
                        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">
                            Account Deletion<br />
                            <span className="text-[#facc15]">Request</span>
                        </h1>
                        <p className="mt-3 text-[#a1a1aa] font-mono text-sm uppercase tracking-wide">
                            Submit a request to delete your ShieldHire account and personal data
                        </p>
                    </div>

                    {step === 'submitted' ? (
                        <div className="bg-[#0d0d0d] border-[3px] border-[#22c55e] p-8 shadow-[6px_6px_0px_0px_#22c55e]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-[#22c55e] border-2 border-black flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-white font-black text-xl uppercase font-mono">Request Received</h2>
                            </div>
                            <p className="text-[#a1a1aa] font-mono text-sm leading-relaxed">
                                Your deletion request for <span className="text-white font-bold">{email}</span> has been logged.
                                Our team will process it within <span className="text-[#facc15] font-bold">30 days</span> and send a confirmation to your email.
                            </p>
                            {refId && (
                                <p className="mt-4 text-[#71717a] font-mono text-xs uppercase tracking-wide">
                                    Reference ID: <span className="text-white">{refId}</span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Info cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="bg-[#0d0d0d] border-[3px] border-white p-5 shadow-[4px_4px_0px_0px_#000]">
                                    <h3 className="text-[#facc15] font-black text-xs uppercase tracking-widest font-mono mb-3">// Data Deleted</h3>
                                    <ul className="space-y-1.5 text-[#a1a1aa] font-mono text-xs">
                                        <li className="flex gap-2"><span className="text-[#22c55e]">✓</span> Account credentials &amp; profile</li>
                                        <li className="flex gap-2"><span className="text-[#22c55e]">✓</span> Contact number &amp; personal info</li>
                                        <li className="flex gap-2"><span className="text-[#22c55e]">✓</span> Government ID photos</li>
                                        <li className="flex gap-2"><span className="text-[#22c55e]">✓</span> Profile &amp; gallery photos</li>
                                        <li className="flex gap-2"><span className="text-[#22c55e]">✓</span> Location history</li>
                                        <li className="flex gap-2"><span className="text-[#22c55e]">✓</span> Chat messages</li>
                                        <li className="flex gap-2"><span className="text-[#22c55e]">✓</span> Device tokens (FCM)</li>
                                    </ul>
                                </div>
                                <div className="bg-[#0d0d0d] border-[3px] border-white p-5 shadow-[4px_4px_0px_0px_#000]">
                                    <h3 className="text-[#facc15] font-black text-xs uppercase tracking-widest font-mono mb-3">// Data Retained</h3>
                                    <ul className="space-y-1.5 text-[#a1a1aa] font-mono text-xs">
                                        <li className="flex gap-2 items-start">
                                            <span className="text-[#f59e0b] shrink-0">!</span>
                                            <span>Completed booking records — <span className="text-white">7 years</span> (legal/tax compliance)</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <span className="text-[#f59e0b] shrink-0">!</span>
                                            <span>Payment transaction IDs — <span className="text-white">7 years</span> (financial regulations)</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <span className="text-[#f59e0b] shrink-0">!</span>
                                            <span>Anonymised dispute logs — <span className="text-white">3 years</span> (fraud prevention)</span>
                                        </li>
                                    </ul>
                                    <p className="mt-3 text-[#71717a] font-mono text-[10px] uppercase tracking-wide">
                                        Retained data is anonymised and not linked to your identity after deletion.
                                    </p>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="bg-[#0d0d0d] border-[3px] border-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#facc15]">
                                <h2 className="text-white font-black text-sm uppercase tracking-widest font-mono mb-6">
                                    // Submit Deletion Request
                                </h2>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-600 border-2 border-black text-white text-xs font-mono uppercase tracking-wide shadow-[3px_3px_0px_0px_#000]">
                                        ⚠ {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-black text-white uppercase tracking-widest mb-2 font-mono">
                                            // Account Email
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            disabled={loading}
                                            className="w-full bg-[#161616] border-2 border-white focus:border-[#facc15] focus:shadow-[2px_2px_0px_0px_#facc15] px-4 py-3 text-white text-sm font-mono outline-none transition-all placeholder-white/20 rounded-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-white uppercase tracking-widest mb-2 font-mono">
                                            // Account Type
                                        </label>
                                        <div className="flex gap-3">
                                            {(['CLIENT', 'BOUNCER'] as const).map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setAccountType(type)}
                                                    className={`flex-1 py-3 border-2 font-black text-xs uppercase font-mono tracking-widest transition-all ${
                                                        accountType === type
                                                            ? 'bg-[#facc15] border-black text-black shadow-[3px_3px_0px_0px_#fff]'
                                                            : 'bg-[#161616] border-white text-white hover:border-[#facc15]'
                                                    }`}
                                                >
                                                    {type === 'CLIENT' ? '👤 Client' : '🛡️ Bouncer'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-white uppercase tracking-widest mb-2 font-mono">
                                            // Reason (Optional)
                                        </label>
                                        <textarea
                                            value={reason}
                                            onChange={e => setReason(e.target.value)}
                                            placeholder="Tell us why you're leaving..."
                                            rows={3}
                                            disabled={loading}
                                            className="w-full bg-[#161616] border-2 border-white focus:border-[#facc15] focus:shadow-[2px_2px_0px_0px_#facc15] px-4 py-3 text-white text-sm font-mono outline-none transition-all placeholder-white/20 rounded-none resize-none"
                                        />
                                    </div>

                                    <div className="bg-[#161616] border-2 border-[#f59e0b] p-4">
                                        <p className="text-[#f59e0b] font-mono text-xs uppercase tracking-wide font-bold">
                                            ⚠ Warning — This action is irreversible
                                        </p>
                                        <p className="text-[#a1a1aa] font-mono text-xs mt-1">
                                            Once processed, your account and all associated personal data will be permanently deleted. Active bookings must be completed or cancelled before deletion can proceed.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#ef4444] border-2 border-black text-white font-black text-sm py-4 uppercase font-mono tracking-widest shadow-[4px_4px_0px_0px_#fff] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#fff] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin" />
                                        ) : (
                                            '🗑 Submit Deletion Request'
                                        )}
                                    </button>
                                </form>
                            </div>

                            <p className="mt-6 text-center text-[#71717a] font-mono text-xs uppercase tracking-wide">
                                Need help? Contact us at{' '}
                                <a href="mailto:support@shieldhire.com" className="text-[#facc15] hover:underline">
                                    support@shieldhire.com
                                </a>
                            </p>
                        </>
                    )}
                </div>
            </main>

            <footer className="relative z-10 border-t-[3px] border-white bg-[#0d0d0d] px-6 py-4 text-center">
                <p className="text-[#71717a] font-mono text-xs uppercase tracking-widest">
                    © {new Date().getFullYear()} ShieldHire — All rights reserved
                </p>
                <a
                    href="https://doc-hosting.flycricket.io/sos-shieldhire-privacy-policy/ced1d6d0-453d-44e7-81a0-7f7d1d26d250/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#facc15] font-mono text-xs uppercase tracking-widest hover:underline mt-1 inline-block"
                >
                    Privacy Policy →
                </a>
            </footer>
        </div>
    );
}
