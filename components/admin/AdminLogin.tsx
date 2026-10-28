'use client';

import React, { useState } from 'react';
import { DalLogo } from '@/components/DalLogo';
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('لطفاً نام کاربری و رمز عبور را وارد نمایید.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('dall_admin_token', data.token);
        }
        onLoginSuccess();
      } else {
        setError(data.message || 'نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch {
      setError('خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-[#051A15] text-[#F6F4EE] px-4 py-8 relative overflow-hidden"
      dir="rtl"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-[#DFBA87]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-[#1A443A]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 mb-3 drop-shadow-md">
            <DalLogo size="md" showText={false} circular={true} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#DFBA87] tracking-tight">
            کافه دال
          </h1>
          <p className="text-xs sm:text-sm text-[#A8BCB5] mt-1 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#DFBA87]" />
            ورود به پنل مدیریت یکپارچه منو
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-[#08221D]/90 backdrop-blur-md border border-[#1A443A] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-500/40 rounded-xl text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-[#DFBA87] mb-1.5">
                نام کاربری
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#7D9990]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="نام کاربری مدیریت"
                  className="w-full bg-[#051A15] border border-[#1A443A] focus:border-[#DFBA87] focus:ring-1 focus:ring-[#DFBA87] rounded-xl pr-10 pl-3.5 py-3 text-sm text-[#F6F4EE] placeholder:text-[#527067] outline-hidden transition-all text-left dir-ltr"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-[#DFBA87] mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#7D9990]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور"
                  className="w-full bg-[#051A15] border border-[#1A443A] focus:border-[#DFBA87] focus:ring-1 focus:ring-[#DFBA87] rounded-xl pr-10 pl-11 py-3 text-sm text-[#F6F4EE] placeholder:text-[#527067] outline-hidden transition-all text-left dir-ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7D9990] hover:text-[#DFBA87] transition-colors"
                  aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 min-h-12 bg-linear-to-r from-[#DFBA87] to-[#C99C63] hover:from-[#E5C79A] hover:to-[#D5A971] text-[#1E170F] font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-[#DFBA87]/15 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1E170F] border-t-transparent rounded-full animate-spin" />
                  <span>در حال بررسی...</span>
                </>
              ) : (
                <>
                  <span>ورود به پنل</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Quick info */}
          <div className="mt-6 pt-5 border-t border-[#1A443A]/60 flex items-center justify-between text-xs text-[#7D9990]">
            <span>دسترسی اختصاصی مدیریت</span>
            <Link
              href="/"
              className="text-[#DFBA87] hover:underline flex items-center gap-1 font-medium"
            >
              بازگشت به منوی کافه
            </Link>
          </div>
        </div>

        {/* Security watermark */}
        <p className="text-center text-[11px] text-[#527067] mt-6 font-mono">
          DALL CAFE MANAGEMENT SYSTEM &bull; v2.0
        </p>
      </div>
    </div>
  );
}
