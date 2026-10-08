import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Share2, Smartphone, Download } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const APP_PUBLIC_URL = (
  import.meta.env.VITE_APP_PUBLIC_URL || 'https://food.teensclub.mn'
).replace(/\/$/, '');
const ANDROID_STORE =
  import.meta.env.VITE_ANDROID_STORE_URL ||
  'https://play.google.com/store/apps/details?id=com.hbdriver.mongolia';
const IOS_STORE =
  import.meta.env.VITE_IOS_STORE_URL ||
  'https://apps.apple.com/us/app/foody-mgl/id6478805106';

type ReferralInfo = {
  valid: boolean;
  referralCode: string;
  appName: string;
  inviteMessage: string;
};

function detectPlatform(): 'android' | 'ios' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'desktop';
}

function clickStorageKey(code: string) {
  return `foody_referral_click_${code.toUpperCase()}`;
}

function buildPlayStoreUrl(referralCode: string, clickId: string) {
  const referrerPayload = `referral_code=${encodeURIComponent(referralCode)}&click_id=${encodeURIComponent(clickId)}`;
  const referrerParam = encodeURIComponent(referrerPayload);
  const base = ANDROID_STORE.includes('?') ? `${ANDROID_STORE}&` : `${ANDROID_STORE}?`;
  return `${base}referrer=${referrerParam}`;
}

export function InvitePage() {
  const { referralCode: rawCode = '' } = useParams();
  const code = rawCode.trim().toUpperCase();
  const platform = useMemo(() => detectPlatform(), []);

  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [clickId, setClickId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const referralUrl = `${APP_PUBLIC_URL}/invite/${encodeURIComponent(code)}`;

  const recordClick = useCallback(async () => {
    const stored = localStorage.getItem(clickStorageKey(code));
    let existingClickId: string | null = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { clickId?: string };
        existingClickId = parsed.clickId || null;
      } catch {
        existingClickId = stored;
      }
    }

    const res = await fetch(`${API}/referrals/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode: code,
        clickId: existingClickId,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Урилга бүртгэхэд алдаа гарлаа');
    }
    const data = (await res.json()) as { clickId: string };
    setClickId(data.clickId);
    localStorage.setItem(
      clickStorageKey(code),
      JSON.stringify({ clickId: data.clickId, at: Date.now() }),
    );
    return data.clickId;
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const validateRes = await fetch(`${API}/referrals/${encodeURIComponent(code)}`);
        if (!validateRes.ok) {
          const err = await validateRes.json().catch(() => ({}));
          throw new Error(err.error || 'Урилгын код олдсонгүй');
        }
        const validated = (await validateRes.json()) as ReferralInfo;
        if (cancelled) return;
        setInfo(validated);

        const id = await recordClick();
        if (cancelled) return;

        redirectTimeout = setTimeout(() => {
          if (platform === 'android' && id) {
            setRedirecting(true);
            window.location.href = buildPlayStoreUrl(code, id);
          } else if (platform === 'ios') {
            setRedirecting(true);
            window.location.href = IOS_STORE;
          }
        }, 800);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Алдаа гарлаа');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!code) {
      setError('Урилгын код олдсонгүй');
      setLoading(false);
      return () => {};
    }

    load();
    return () => {
      cancelled = true;
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [code, platform, recordClick]);

  const share = async () => {
    const text = `Сайн уу! Манай Foody аппыг ашиглаад үзээрэй. Энэ холбоосоор орж апп татаж бүртгүүлээрэй: ${referralUrl}`;
    if (navigator.share) {
      await navigator.share({ title: 'Foody урилга', text, url: referralUrl });
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const openAndroid = () => {
    if (!clickId) return;
    window.location.href = buildPlayStoreUrl(code, clickId);
  };

  return (
    <div className="invite-root">
      <header className="invite-header">
        <Link to="/" className="invite-logo">
          <img src="/logoo.jpeg" alt="Foody" className="invite-logo-img" />
          <span>Foody</span>
        </Link>
      </header>

      <main className="invite-main">
        {loading && <p className="invite-status">Урилгыг шалгаж байна...</p>}
        {error && (
          <div className="invite-card invite-error">
            <h1>Уучлаарай</h1>
            <p>{error}</p>
            <Link to="/" className="invite-btn invite-btn-secondary">
              Нүүр хуудас
            </Link>
          </div>
        )}

        {!loading && !error && info && (
          <div className="invite-card">
            <div className="invite-badge">
              <Smartphone size={16} />
              <span>Найзын урилга</span>
            </div>
            <h1>{info.inviteMessage}</h1>
            <p className="invite-lead">
              Foody апп-аар Монголын шилдэг хоолыг хурдан захиалаарай. Доорх товчоор апп татаж,
              бүртгүүлэхдээ урилга автоматаар холбогдоно (Android). iOS дээр кодоо гараар оруулах
              боломжтой.
            </p>

            {redirecting && (
              <p className="invite-status">
                {platform === 'android' ? 'Google Play руу шилжиж байна...' : 'App Store руу шилжиж байна...'}
              </p>
            )}

            <div className="invite-store-row">
              <a
                className="invite-store-btn"
                href={clickId ? buildPlayStoreUrl(code, clickId) : ANDROID_STORE}
                onClick={(e) => {
                  if (!clickId) {
                    e.preventDefault();
                  }
                }}
              >
                <Download size={18} />
                Google Play
              </a>
              <a className="invite-store-btn invite-store-ios" href={IOS_STORE}>
                <Download size={18} />
                App Store
              </a>
            </div>

            {platform === 'android' && clickId && (
              <button type="button" className="invite-btn" onClick={openAndroid}>
                Play Store нээх
              </button>
            )}

            <div className="invite-actions">
              <button type="button" className="invite-btn invite-btn-secondary" onClick={copyLink}>
                <Copy size={16} />
                {copied ? 'Хуулсан!' : 'Холбоос хуулах'}
              </button>
              <button type="button" className="invite-btn" onClick={share}>
                <Share2 size={16} />
                Хуваалцах
              </button>
            </div>

            <p className="invite-code-label">Урилгын код</p>
            <p className="invite-code">{info.referralCode}</p>
          </div>
        )}
      </main>
    </div>
  );
}
