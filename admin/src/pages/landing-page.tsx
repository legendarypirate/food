import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Download,
  Star,
  Clock,
  Shield,
  Zap,
  ChevronRight,
  MapPin,
  TrendingUp,
  Award,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      {/* ── NAV ── */}
      <header className="land-nav">
        <div className="land-nav-inner">
          <div className="land-logo">
            <img src="/logoo.jpeg" alt="foody" className="land-logo-img" />
            <span className="land-logo-text">foody</span>
          </div>
          <nav className="land-nav-links">
            <a href="#features">Онцлог</a>
            <a href="#how">Хэрхэн ажилладаг</a>
            <a href="#download">Татаж авах</a>
          </nav>
          <button
            id="login-btn"
            className="land-login-btn"
            onClick={() => navigate('/login')}
          >
            Нэвтрэх
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="land-hero">
        <div className="land-hero-bg-blobs">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        <div className="land-hero-inner">
          <div className="land-hero-left">
            <div className="land-badge">
              <Smartphone size={14} />
              <span>Зөвхөн мобайл апп</span>
            </div>
            <h1 className="land-hero-title">
              Жинхэнэ амтыг
              <br />
              <span className="land-hero-accent">Түргэн. Шуурхай</span>
              <br />
              Таны гарт, Хурдан. Тасралтгүй.
            </h1>
            <p className="land-hero-sub">
              Монголын шилдэг рестораны хоолыг 25–35 минутад хаана ч хүргэнэ.
              Захиалга зөвхөн мобайл апп-аар — ямар ч нэмэлт төлбөргүй.
            </p>

            <div className="land-hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-num">170+</span>
                <span className="hero-stat-label">Ресторан</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-num">4.9★</span>
                <span className="hero-stat-label">Үнэлгээ</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-num">100%</span>
                <span className="hero-stat-label">Баталгаа</span>
              </div>
            </div>

            <div className="land-app-btns">
              <a className="app-btn app-btn-primary" href="#download">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                App Store
              </a>
              <a className="app-btn app-btn-secondary" href="#download">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6-3.24-3.24L3.18 23.76zm16.7-10.37l-2.74-1.55-3.63 3.63 3.63 3.62 2.74-1.55c.78-.44.78-1.71 0-2.15zM3.01.48C2.7.92 2.53 1.53 2.53 2.28v19.48c0 .75.17 1.36.48 1.8L15.6 11.4 3.01.48zm9.15 10.92l3.24-3.24L3.18.24c-.35-.04-.69.03-.99.2l10.97 10.96z" />
                </svg>
                Google Play
              </a>
            </div>

            <div className="land-mobile-only-badge">
              <Shield size={16} />
              <span>Захиалга зөвхөн мобайл апп-аар хийгдэнэ — вэб захиалга байхгүй</span>
            </div>
          </div>

          <div className="land-hero-right">
            <div className="land-phone-wrap">
              <img
                src="/app_mockup.jpg"
                alt="Foody мобайл апп"
                className="land-phone-img"
              />
              <div className="land-floating-card card-top">
                <div className="float-card-icon">🔥</div>
                <div>
                  <p className="float-card-title">Шинэ захиалга</p>
                  <p className="float-card-sub">Бибимбаб × 2 • 28,000₮</p>
                </div>
              </div>
              <div className="land-floating-card card-bottom">
                <MapPin size={16} className="float-pin-icon" />
                <div>
                  <p className="float-card-title">Хүргэлт</p>
                  <p className="float-card-sub">27 минут • Чингэлтэй</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="land-how">
        <div className="land-section-inner">
          <div className="land-section-tag">
            <Zap size={14} />
            <span>Хэрхэн ажилладаг</span>
          </div>
          <h2 className="land-section-title">3 алхамд захиална</h2>
          <p className="land-section-sub">Мобайл аппыг татаж, 2 товшилтоор хоолоо захиалаарай.</p>

          <div className="land-steps">
            <div className="land-step">
              <div className="step-num">01</div>
              <div className="step-icon-wrap"><Download size={28} /></div>
              <h3>Апп татна</h3>
              <p>App Store эсвэл Google Play-с foody аппыг үнэгүй татаж авна уу.</p>
            </div>
            <div className="land-step-arrow"><ChevronRight size={24} /></div>
            <div className="land-step">
              <div className="step-num">02</div>
              <div className="step-icon-wrap"><Star size={28} /></div>
              <h3>Сонгоно</h3>
              <p>170+ ресторанаас дуртай хоолоо сонгоорой. Шүүлтүүр, үнэлгээ ашиглаарай.</p>
            </div>
            <div className="land-step-arrow"><ChevronRight size={24} /></div>
            <div className="land-step">
              <div className="step-num">03</div>
              <div className="step-icon-wrap"><Clock size={28} /></div>
              <h3>Хүлээнэ</h3>
              <p>25–35 минутад хаана ч байсан хүргэж өгнө. Дэлгэцнээсээ бодит цагаар хянана.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="land-features">
        <div className="land-section-inner">
          <div className="land-section-tag">
            <Award size={14} />
            <span>Онцлог давуу тал</span>
          </div>
          <h2 className="land-section-title">Яагаад foody?</h2>

          <div className="land-features-grid">
            <div className="land-feat-card feat-accent">
              <div className="feat-img-wrap">
                <img src="/food_hero.jpg" alt="Хоолны сонголт" className="feat-img" />
                <div className="feat-img-overlay" />
              </div>
              <div className="feat-content">
                <TrendingUp size={22} className="feat-icon" />
                <h3>170+ Ресторан</h3>
                <p>Монголын шилдэг рестораны хоолнуудаас сонгох боломжтой. Өдөр тутам шинэ газрууд нэмэгдэнэ.</p>
              </div>
            </div>

            <div className="land-feat-cards-right">
              <div className="land-feat-small">
                <div className="feat-small-icon"><Clock size={20} /></div>
                <div>
                  <h4>25–35 минут</h4>
                  <p>Монгол улсын хамгийн хурдан хүргэлт</p>
                </div>
              </div>
              <div className="land-feat-small">
                <div className="feat-small-icon"><Shield size={20} /></div>
                <div>
                  <h4>100% Баталгаа</h4>
                  <p>Хоол ирэхгүй бол бүтэн мөнгийг буцаана</p>
                </div>
              </div>
              <div className="land-feat-small">
                <div className="feat-small-icon"><Star size={20} /></div>
                <div>
                  <h4>4.9 Оноо</h4>
                  <p>96,000+ хэрэглэгчийн дундаж үнэлгээ</p>
                </div>
              </div>
              <div className="land-feat-small">
                <div className="feat-small-icon"><Zap size={20} /></div>
                <div>
                  <h4>Бодит цаг</h4>
                  <p>GPS-ээр хүргэлтийн явцыг шалгана</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA DARK ── */}
      <section id="download" className="land-cta">
        <div className="land-cta-bg">
          <div className="cta-blob cta-blob-1" />
          <div className="cta-blob cta-blob-2" />
        </div>
        <div className="land-section-inner land-cta-inner">
          <div className="land-cta-left">
            <span className="land-cta-tag">📱 Мобайл апп</span>
            <h2 className="land-cta-title">
              Жинхэнэ foody-г
              <br />
              <span>татаж туршаарай.</span>
            </h2>
            <p className="land-cta-sub">
              Захиалга бүрийн дараа оноо хуримтлуулаарай.
              Мобайл аппаар захиалахад онцгой урамшуулал авна.
            </p>
            <div className="land-app-btns land-app-btns-cta">
              <a className="app-btn app-btn-white" href="#download">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                App Store
              </a>
              <a className="app-btn app-btn-outline-white" href="#download">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6-3.24-3.24L3.18 23.76zm16.7-10.37l-2.74-1.55-3.63 3.63 3.63 3.62 2.74-1.55c.78-.44.78-1.71 0-2.15zM3.01.48C2.7.92 2.53 1.53 2.53 2.28v19.48c0 .75.17 1.36.48 1.8L15.6 11.4 3.01.48zm9.15 10.92l3.24-3.24L3.18.24c-.35-.04-.69.03-.99.2l10.97 10.96z" />
                </svg>
                Google Play
              </a>
            </div>
          </div>
          <div className="land-cta-right">
            <img src="/app_mockup.jpg" alt="foody апп" className="land-cta-phone" />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="land-footer-left">
            <div className="land-logo">
              <img src="/logoo.jpeg" alt="foody" className="land-logo-img" />
              <span className="land-logo-text">foody</span>
            </div>
            <p className="land-footer-copy">© 2024 Foody Inc. Бүх эрх хуулиар хамгаалагдсан.</p>
            <p className="land-footer-note">Захиалга зөвхөн iOS болон Android аппаар хийгдэнэ.</p>
          </div>
          <div className="land-footer-links">
            <a href="#">Туршлага</a>
            <a href="#">Цэсний урьдчилан харах</a>
            <a href="#">Онцлог</a>
            <a href="#">Апп татах</a>
            <a href="#">Хамтрагч рестораны нэвтрэх</a>
            <a href="#">Нууцлалын бодлого</a>
          </div>
          <div className="land-footer-right">
            <button
              className="land-footer-login"
              onClick={() => navigate('/login')}
            >
              Нэвтрэх →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
