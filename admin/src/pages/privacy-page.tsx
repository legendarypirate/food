import { useMemo } from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPage() {
  const policyUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/privacy';
    return `${window.location.origin}/privacy`;
  }, []);

  return (
    <div className="landing-root legal-root">
      <header className="land-nav">
        <div className="land-nav-inner">
          <Link to="/" className="land-logo" style={{ textDecoration: 'none' }}>
            <img src="/logoo.jpeg" alt="foody" className="land-logo-img" />
            <span className="land-logo-text">foody</span>
          </Link>
          <nav className="land-nav-links">
            <Link to="/">Нүүр</Link>
            <Link to="/privacy">Нууцлалын бодлого</Link>
          </nav>
        </div>
      </header>

      <main className="legal-main">
        <p className="legal-kicker">Privacy policy</p>
        <h1 className="legal-title">Нууцлалын бодлого</h1>
        <p className="legal-updated">Сүүлд шинэчилсэн: 2026 оны 10-р сарын 2</p>

        <div className="legal-url-box">
          <span>Privacy policy URL</span>
          <a href={policyUrl}>{policyUrl}</a>
        </div>

        <section className="legal-section">
          <h2>1. Ерөнхий</h2>
          <p>
            Энэхүү бодлого нь foody мобайл апп (Android багцын нэр:{' '}
            <code>com.hbdriver.mongolia</code>) болон холбогдох үйлчилгээг
            ашиглах үед Foody Inc. таны хувийн мэдээллийг хэрхэн цуглуулж,
            ашиглаж, хамгаалж байгааг тайлбарлана.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Цуглуулах мэдээлэл</h2>
          <ul>
            <li>Бүртгэл: нэр, и-мэйл, утасны дугаар (Google нэвтрэлт эсвэл утас)</li>
            <li>Хүргэлт: хаяг, захиалгын түүх, төлбөрийн төлөв</li>
            <li>Байршил: хүргэлтийн хаяг болон жолоочийн байршлыг харуулахад</li>
            <li>Төхөөрөмж: аппын мэдэгдэл (FCM), төхөөрөмжийн токен</li>
            <li>Төлбөр: QPay нэхэмжлэх, төлбөрийн төлөв (картын дугаар хадгалахгүй)</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Хэрхэн ашиглах</h2>
          <ul>
            <li>Захиалга хүлээн авах, бэлтгэх, хүргэх</li>
            <li>QPay-ээр төлбөр баталгаажуулах</li>
            <li>Захиалгын төлөв, урамшуулал, системийн мэдэгдэл илгээх</li>
            <li>Аппын аюулгүй байдал, дэмжлэг, хууль ёсны шаардлага</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Хуваалцах</h2>
          <p>
            Бид мэдээллийг захиалга гүйцэтгэхэд шаардлагатай хамтрагчдад л
            дамжуулна: ресторан, хүргэлтийн жолооч, QPay, Google Sign-In, Firebase
            Cloud Messaging. Бид хувийн мэдээллийг зарж борлуулахгүй.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Хадгалалт ба аюулгүй байдал</h2>
          <p>
            Мэдээллийг захиалга, нягтлан бодох бүртгэл, хуулийн шаардлагын
            хугацаанд хадгална. Холболт, нэвтрэлт, төлбөрийн урсгалд стандарт
            хамгаалалт ашиглана.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Таны эрх</h2>
          <p>
            Та өөрийн бүртгэл, хаяг, захиалгын мэдээллийг апп дотор харах,
            засах боломжтой. Бүртгэл устгах эсвэл мэдээлэлтэй холбоотой хүсэлтийг
            доорх хаягаар илгээнэ үү.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Хүүхэд</h2>
          <p>
            foody нь 13-аас доош насны хүүхдэд зориулаагүй. Хэрэв ийм мэдээлэл
            цугларсан нь тогтоовол бид устгана.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Холбоо барих</h2>
          <p>
            Нууцлалтай холбоотой асуулт:{' '}
            <a href="mailto:admin@foody.mn">admin@foody.mn</a>
          </p>
        </section>
      </main>
    </div>
  );
}
