import React, { useState } from 'react';
import {
  HeartHandshakeIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  CheckIcon,
  PersonAvatarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  WhatsAppIcon
} from './icons';
import {
  SERVICES_DATA,
  PSYCHOLOGISTS_DATA,
  THERAPISTS_DATA,
  IT_TEAM_DATA,
  CREATOR_TEAM_DATA,
  FAQS_DATA
} from '../lib/constants';

export default function PublicLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const waNumber = '6282298585310';
  const waMessage = encodeURIComponent('Halo Benang Merah, saya ingin berkonsultasi mengenai layanan konseling.');
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans selection:bg-[#701A24]/20 selection:text-[#701A24] overflow-x-hidden">
      
      {/* NAVBAR GLASSMORPHISM */}
      <nav className="sticky top-0 z-50 bg-[#FAF8F5]/85 backdrop-blur-md border-b border-[#EADFD5] transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* LOGO RESMI */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <img
              src="/logo.png"
              alt="Logo Benang Merah"
              className="w-10 h-10 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.jpeg';
              }}
            />
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#701A24] block leading-none">
                Benang Merah
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                Layanan Psikologi & Tumbuh Kembang
              </span>
            </div>
          </div>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475569]">
            <a
              href="#layanan"
              className="hover:text-[#701A24] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#701A24] hover:after:w-full after:transition-all"
            >
              Layanan
            </a>
            <a
              href="#proposal"
              className="hover:text-[#701A24] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#701A24] hover:after:w-full after:transition-all"
            >
              Proposal
            </a>
            <a
              href="#psikolog"
              className="hover:text-[#701A24] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#701A24] hover:after:w-full after:transition-all"
            >
              Tim Profesional
            </a>
            <a
              href="#faq"
              className="hover:text-[#701A24] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#701A24] hover:after:w-full after:transition-all"
            >
              FAQ
            </a>
          </div>

          {/* DESKTOP CTA BUTTONS */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[#701A24] hover:bg-[#54121B] text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>Konsultasi WhatsApp</span>
            </a>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 font-bold"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* MOBILE DROPDOWN */}
        {isMenuOpen && (
          <div className="md:hidden border-b border-[#EADFD5] bg-[#FAF8F5] px-6 py-4 flex flex-col gap-3.5 text-sm font-medium animate-fade-up">
            <a href="#layanan" onClick={() => setIsMenuOpen(false)}>Layanan</a>
            <a href="#proposal" onClick={() => setIsMenuOpen(false)}>Proposal</a>
            <a href="#psikolog" onClick={() => setIsMenuOpen(false)}>Tim Profesional</a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[#701A24] text-white text-center py-2.5 rounded-xl font-semibold shadow-xs flex items-center justify-center gap-2"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Konsultasi WhatsApp
            </a>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative py-16 md:py-24 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#701A24]/10 text-[#701A24] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border border-[#701A24]/20 backdrop-blur-sm shadow-xs">
              <ShieldCheckIcon className="w-4 h-4 text-[#701A24]" />
              <span>100% Kerahasiaan Terjamin Sesuai Kode Etik</span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.18] text-[#1E293B]">
              Ruang Aman untuk Mendengar, Memahami, & Menyembuhkan.
            </h1>

            <p className="text-[#64748B] text-base md:text-lg leading-relaxed font-light">
              Temukan kembali keseimbangan emosi dan potensi terbaik Anda bersama layanan psikologi klinis serta pendampingan terapis profesional di Klinik Benang Merah.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#701A24] hover:bg-[#54121B] text-white px-7 py-3.5 rounded-full font-semibold text-center transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Jadwalkan Sesi Konseling</span>
              </a>

              <a
                href="#proposal"
                className="border border-[#CBD5E1] hover:border-[#701A24]/40 text-[#334155] hover:text-[#701A24] px-7 py-3.5 rounded-full font-semibold text-center transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-xs flex items-center justify-center gap-2"
              >
                <FileTextIcon className="w-4 h-4 text-gray-500" />
                <span>Pelajari Proposal</span>
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-[#EADFD5] group">
              <img
                src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1000"
                alt="Suasana Ruang Konseling Klinik Benang Merah"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-[#EADFD5] hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#701A24]/10 flex items-center justify-center text-[#701A24]">
                <CheckIcon className="w-5 h-5 text-[#701A24]" />
              </div>
              <div>
                <p className="text-xs text-[#64748B] font-medium">Psikolog Terlisensi</p>
                <p className="text-sm font-bold text-[#1E293B]">S.Psi., M.Psi., Psikolog</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* RATING KEPERCAYAAN */}
      <section className="bg-white border-y border-[#EADFD5] py-12 px-6 shadow-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="font-serif text-3xl md:text-4xl font-bold text-[#701A24]">1,500+</p>
            <p className="text-xs md:text-sm text-[#64748B] mt-1 font-light">Sesi Terfasilitasi</p>
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-bold text-[#701A24]">100%</p>
            <p className="text-xs md:text-sm text-[#64748B] mt-1 font-light">Privasi Klien Terjaga</p>
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-bold text-[#701A24]">100%</p>
            <p className="text-xs md:text-sm text-[#64748B] mt-1 font-light">Psikolog Terlisensi SIPP</p>
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-bold text-[#701A24]">4.9/5.0</p>
            <p className="text-xs md:text-sm text-[#64748B] mt-1 font-light">Kepuasan Klien</p>
          </div>
        </div>
      </section>

      {/* LAYANAN KONSELING */}
      <section id="layanan" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-[#1E293B] mb-4">
            Layanan Konseling & Tumbuh Kembang
          </h2>
          <p className="text-[#64748B] text-sm md:text-base font-light">
            Dirancang khusus untuk membantu setiap tahapan proses pemulihan, intervensi perilaku, serta pertumbuhan kesehatan mental Anda dan keluarga.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {SERVICES_DATA.map((srv, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-3xl border border-[#EADFD5] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="mb-6 p-3 bg-[#FAF8F5] rounded-2xl w-fit border border-[#EADFD5] group-hover:scale-110 transition-transform">
                  {srv.type === 'user' && <UserCheckIcon className="w-6 h-6 text-[#701A24]" />}
                  {srv.type === 'heart' && <HeartHandshakeIcon className="w-6 h-6 text-[#701A24]" />}
                  {srv.type === 'shield' && <ShieldCheckIcon className="w-6 h-6 text-[#701A24]" />}
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1E293B] mb-3 group-hover:text-[#701A24] transition-colors">
                  {srv.title}
                </h3>
                <p className="text-[#64748B] text-sm leading-relaxed mb-6 font-light">
                  {srv.desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {srv.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-[#FAF8F5] text-[#475569] text-xs px-3 py-1 rounded-full border border-[#EADFD5]/70 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROPOSAL PELAYANAN SECTION */}
      <section id="proposal" className="py-12 px-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-[#701A24] via-[#5D151E] to-[#420E15] rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 max-w-2xl text-center md:text-left relative z-10">
            <span className="bg-white/10 text-red-200 text-xs font-semibold px-3.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-white/10 inline-flex items-center gap-1.5">
              <FileTextIcon className="w-3.5 h-3.5" />
              Dokumen Resmi
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">
              Proposal Pelayanan Benang Merah
            </h2>
            <p className="text-red-100/90 text-xs md:text-sm leading-relaxed font-light">
              Pelajari selengkapnya mengenai detail program, alur pendampingan klinis, serta penawaran kerja sama layanan kesehatan mental kami.
            </p>
          </div>

          <a
            href="https://drive.google.com/file/d/1IaaszVRamfvzgkKD1sMEYu_Q3pneQeAO/view?usp=drive_link"
            target="_blank"
            rel="noreferrer"
            className="bg-white text-[#701A24] hover:bg-red-50 font-bold px-7 py-4 rounded-full text-xs transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-0.5 whitespace-nowrap relative z-10 flex items-center gap-2"
          >
            <FileTextIcon className="w-4 h-4 text-[#701A24]" />
            <span>Buka & Download Proposal (PDF)</span>
          </a>
        </div>
      </section>

      {/* ALUR MEMULAI KONSELING */}
      <section className="bg-[#FAF8F5] py-20 px-6 border-y border-[#EADFD5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E293B] mb-4">
              Alur Memulai Konseling
            </h2>
            <p className="text-[#64748B] text-sm md:text-base font-light">
              4 Langkah mudah dan terarah menuju ruang aman Anda.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Pilih Metode', desc: 'Tentukan opsi sesi bersama Psikolog Klinis atau Terapi Tumbuh Kembang Anak (Play and Grow).' },
              { num: '02', title: 'Pilih Psikolog', desc: 'Sesuaikan pilihan psikolog atau terapis berdasarkan fokus penanganan kebutuhan Anda.' },
              { num: '03', title: 'Jadwalkan Sesi', desc: 'Pilih tanggal dan jam sesi yang paling nyaman untuk Anda dan keluarga.' },
              { num: '04', title: 'Mulai Sesi', desc: 'Jalani proses konseling dalam suasana tenang, privat, dan tanpa penghakiman.' }
            ].map((step, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-[#EADFD5] relative hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <span className="font-serif text-3xl font-bold text-[#701A24]/15 absolute top-4 right-4">
                  {step.num}
                </span>
                <h4 className="font-serif text-lg font-bold text-[#1E293B] mb-2">
                  {step.title}
                </h4>
                <p className="text-[#64748B] text-xs leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIM PROFESIONAL */}
      <section id="psikolog" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-[#1E293B] mb-4">
            Tim Profesional Kami
          </h2>
          <p className="text-[#64748B] text-sm md:text-base font-light">
            Pendampingan profesional, hangat, dan tepercaya untuk tumbuh kembang serta kesehatan mental keluarga Anda.
          </p>
        </div>

        {/* PSIKOLOG UTAMA */}
        <div className="mb-16">
          <h3 className="text-center font-serif text-2xl font-bold text-[#701A24] mb-8">
            Psikolog Utama
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PSYCHOLOGISTS_DATA.map((p, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#EADFD5] overflow-hidden flex flex-col shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-full h-72 bg-[#701A24]/5 relative flex items-center justify-center overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover object-center relative z-10 group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute z-0">
                    <PersonAvatarIcon className="w-16 h-16 text-[#701A24]/20" />
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-serif text-lg font-bold text-[#1E293B] group-hover:text-[#701A24] transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-[#701A24] text-xs font-semibold uppercase mt-1 mb-2 tracking-wider">
                    {p.role}
                  </p>
                  <p className="text-[#64748B] text-xs font-light leading-relaxed">
                    {p.spec}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TIM TERAPIS ANAK */}
        <div className="mb-16">
          <h3 className="text-center font-serif text-2xl font-bold text-[#701A24] mb-8">
            Tim Terapis Anak
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {THERAPISTS_DATA.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#EADFD5] overflow-hidden flex flex-col shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-full h-64 bg-[#701A24]/5 relative flex items-center justify-center overflow-hidden">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-full h-full object-cover object-center relative z-10 group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute z-0">
                    <PersonAvatarIcon className="w-16 h-16 text-[#701A24]/20" />
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-serif text-base font-bold text-[#1E293B] group-hover:text-[#701A24] transition-colors">
                    {t.name}
                  </h4>
                  <p className="text-[#701A24] text-[11px] font-semibold uppercase mt-1 mb-2 tracking-wider">
                    {t.role}
                  </p>
                  <p className="text-[#64748B] text-xs font-light leading-relaxed">
                    {t.spec}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* MEDIA / CREATOR TEAM */}
        <div className="mb-16">
          <h3 className="text-center font-serif text-2xl font-bold text-[#701A24] mb-8">
            Media
          </h3>
          <div className="flex justify-center max-w-md mx-auto px-4">
            {CREATOR_TEAM_DATA.map((c, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#EADFD5] overflow-hidden flex flex-col items-center shadow-xs hover:shadow-md transition-all group text-center w-full"
              >
        <div className="w-full h-64 bg-[#701A24]/5 relative flex items-center justify-center overflow-hidden">
          <img
            src={c.image}
            alt={c.name}
            className="w-full h-full object-cover object-center relative z-10 group-hover:scale-105 transition-transform duration-500 mx-auto"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute z-0 flex items-center justify-center inset-0">
            <PersonAvatarIcon className="w-16 h-16 text-[#701A24]/20" />
          </div>
        </div>
        <div className="p-5 w-full text-center">
          <h4 className="font-serif text-base font-bold text-[#1E293B] group-hover:text-[#701A24] transition-colors">
            {c.name}
          </h4>
          <p className="text-[#701A24] text-[11px] font-semibold uppercase mt-1 mb-2 tracking-wider">
            {c.role}
          </p>
          <p className="text-[#64748B] text-xs font-light leading-relaxed">
            {c.spec}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>

        {/* TIM IT (TEPAT DI BAWAH MEDIA - PASTI DI TENGAH) */}
        <div>
          <h3 className="text-center font-serif text-2xl font-bold text-[#701A24] mb-8">
            IT System
          </h3>
          <div className="flex justify-center max-w-md mx-auto px-4">
            {IT_TEAM_DATA.map((it, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-[#EADFD5] overflow-hidden flex flex-col items-center shadow-xs hover:shadow-md transition-all group text-center w-full"
              >
        <div className="w-full h-64 bg-[#701A24]/5 relative flex items-center justify-center overflow-hidden">
          <img
            src={it.image}
            alt={it.name}
            className="w-full h-full object-cover object-center relative z-10 group-hover:scale-105 transition-transform duration-500 mx-auto"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute z-0 flex items-center justify-center inset-0">
            <PersonAvatarIcon className="w-16 h-16 text-[#701A24]/20" />
          </div>
        </div>
        <div className="p-5 w-full text-center">
          <h4 className="font-serif text-base font-bold text-[#1E293B] group-hover:text-[#701A24] transition-colors">
            {it.name}
          </h4>
          <p className="text-[#701A24] text-[11px] font-semibold uppercase mt-1 mb-2 tracking-wider">
            {it.role}
          </p>
          <p className="text-[#64748B] text-xs font-light leading-relaxed">
            {it.spec}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>

      {/* FAQ SECTION */}
      <section id="faq" className="bg-white py-20 px-6 border-t border-[#EADFD5]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-[#1E293B] mb-3">
              Pertanyaan Umum (FAQ)
            </h2>
            <p className="text-[#64748B] text-sm font-light">
              Hal-hal yang sering ditanyakan sebelum memulai sesi konseling.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS_DATA.map((faq, idx) => (
              <div
                key={idx}
                className="border border-[#EADFD5] rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-5 bg-[#FAF8F5] flex justify-between items-center font-medium text-sm text-[#1E293B] hover:bg-white transition-colors"
                >
                  <span className="font-semibold">{faq.q}</span>
                  <span className="text-[#701A24] font-bold">
                    {openFaq === idx ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="p-5 bg-white text-xs md:text-sm text-[#64748B] border-t border-[#EADFD5] leading-relaxed font-light animate-fade-up">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111827] text-slate-300 py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 border-b border-slate-700 pb-12 mb-8 text-xs">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Logo Benang Merah"
                className="w-8 h-8 object-contain rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo.jpeg';
                }}
              />
              <span className="font-serif text-xl font-bold text-white">
                Benang Merah
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed font-light">
              Layanan psikologi dan kesehatan mental tepercaya. Menyediakan lingkungan yang aman, suportif, dan tanpa keraguan untuk perjalanan pemulihan diri Anda.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="font-semibold text-white uppercase tracking-wider mb-2 text-xs">
              Kontak Klinik
            </p>
            <p className="text-slate-400 flex items-start gap-2">
              <MapPinIcon className="w-4 h-4 text-[#701A24] shrink-0 mt-0.5" />
              Perumahan Nuansa Majasem, Jl. Bandung No. B9/16, Cirebon.
            </p>
            <p className="text-slate-400 flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-[#701A24] shrink-0" />
              0822-9858-5310 (WhatsApp Official)
            </p>
            <p className="text-slate-400 flex items-center gap-2">
              <MailIcon className="w-4 h-4 text-[#701A24] shrink-0" />
              benangmerahpsy@gmail.com
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="font-semibold text-white uppercase tracking-wider mb-2 text-xs">
              Jam Operasional
            </p>
            <p className="text-slate-400 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-[#701A24] shrink-0" />
              Senin - Sabtu : 08.00 - 17.00 WIB
            </p>
            <p className="text-slate-500 italic mt-2">
              * Seluruh sesi konseling tatap muka maupun online dilakukan dengan perjanjian terlebih dahulu.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto text-center text-xs text-slate-500">
          <p>© 2026 Klinik Benang Merah. Seluruh hak cipta dilindungi undang-undang.</p>
        </div>
      </footer>

    </div>
  );
}
