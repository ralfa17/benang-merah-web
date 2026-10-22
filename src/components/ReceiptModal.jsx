import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import {
  ReceiptIcon,
  CloseIcon,
  WhatsAppIcon,
  PrinterIcon,
  CheckIcon,
  DownloadIcon
} from './icons';
import { formatRupiah, formatDate, parseAppointmentNotes } from '../lib/helpers';
import { SERVICE_PRICES } from '../lib/constants';

export default function ReceiptModal({
  appointment,
  receiptType = 'invoice', // 'invoice' | 'paid'
  onClose,
  onMarkAsPaid
}) {
  const [downloadingPng, setDownloadingPng] = useState(false);
  if (!appointment) return null;

  const isPaid = appointment.status === 'lunas' || receiptType === 'paid';
  const meta = parseAppointmentNotes(appointment.notes);

  const adminFee = Number(appointment.admin_fee ?? 30000);
  const totalAmount = Number(appointment.price ?? 30000);
  const hasVoucher = meta.voucherCode === 'OPENING100K';
  const baseServicePrice = SERVICE_PRICES[appointment.service_type] || Math.max(0, totalAmount - adminFee + (hasVoucher ? 100000 : 0));

  // UNDUH STRUK SEBAGAI GAMBAR PNG KE GALERI HP / LAPTOP
  const handleDownloadPng = async () => {
    const element = document.getElementById('printable-receipt');
    if (!element) return;

    setDownloadingPng(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 3, // Kualitas tinggi & tajam
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FAF8F5',
        logging: false,
        onclone: (clonedDoc) => {
          // 1. Hapus stylesheet Tailwind v4 dari dokumen klon agar tidak menghasilkan computed color oklab/oklch
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach((s) => s.remove());

          // 2. Pasang stylesheet reset murni berformat Hex untuk dokumen struk yang direkam
          const safeStyle = clonedDoc.createElement('style');
          safeStyle.innerHTML = `
            * {
              box-sizing: border-box !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-receipt {
              background-color: #FAF8F5 !important;
              color: #1E293B !important;
              border: 2px dashed #701A24 !important;
              border-radius: 16px !important;
              padding: 16px !important;
              position: relative !important;
              overflow: hidden !important;
              width: 100% !important;
            }
            p, span, h2, div {
              color: inherit;
            }
          `;
          clonedDoc.head.appendChild(safeStyle);

          // 3. Sanitasi mendalam: pastikan tidak ada inline style yang memakai oklab / oklch
          const clonedReceipt = clonedDoc.getElementById('printable-receipt');
          if (clonedReceipt) {
            const allElements = [clonedReceipt, ...clonedReceipt.querySelectorAll('*')];
            allElements.forEach((el) => {
              if (el.style) {
                ['color', 'backgroundColor', 'borderColor', 'outlineColor'].forEach((prop) => {
                  if (el.style[prop]) {
                    const val = String(el.style[prop]).toLowerCase();
                    if (val.includes('oklab') || val.includes('oklch') || val.includes('color(')) {
                      el.style[prop] = prop === 'backgroundColor' ? '#FAF8F5' : (prop === 'borderColor' ? '#EADFD5' : '#1E293B');
                    }
                  }
                });
                el.style.boxShadow = 'none';
              }
            });
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const cleanPatient = (appointment.patient_name || 'Pasien').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Struk-${isPaid ? 'Lunas' : 'Invoice'}-BenangMerah-${cleanPatient}-Sesi${appointment.visit_number || 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Gagal unduh gambar struk:', err);
      alert('Gagal mengunduh gambar struk: ' + err.message);
    } finally {
      setDownloadingPng(false);
    }
  };

  // KIRIM PESAN WHATSAPP
  const handleSendWa = () => {
    let rawPhone = meta.phone;
    if (rawPhone.startsWith('0')) {
      rawPhone = '62' + rawPhone.slice(1);
    }

    const title = isPaid ? 'NOTA BUKTI PEMBAYARAN LUNAS' : 'INVOICE TAGIHAN PEMBAYARAN';
    let msg = `*BENANG MERAH - ${title}*\n`;
    msg += `-------------------------------------------\n`;
    msg += `*Nama Klien/Pasien:* ${appointment.patient_name || 'Klien'}\n`;
    msg += `*Kunjungan Ke-: * ${appointment.visit_number || 1}\n`;
    msg += `*Tanggal Sesi:* ${appointment.booking_date} (${appointment.booking_time || 'Sesuai Janji'})\n`;
    msg += `*Layanan:* ${(appointment.service_type || appointment.category || 'Konseling').toUpperCase()}\n`;
    msg += `*Psikolog PJ:* ${appointment.doctor_name || '-'}\n`;
    if (appointment.assigned_terapis) {
      msg += `*Terapis PJ:* ${appointment.assigned_terapis}\n`;
    }
    msg += `*Handle By:* ${meta.handleBy}\n`;
    msg += `*Metode Bayar:* ${meta.paymentMethod}\n`;
    msg += `-------------------------------------------\n`;
    msg += `Biaya Layanan: ${formatRupiah(baseServicePrice)}\n`;
    if (hasVoucher) {
      msg += `Voucher Diskon (OPENING100K): -Rp 100.000\n`;
    }
    if (meta.overtimeFee > 0) {
      msg += `Overtime / Kelebihan Sesi (${meta.overtimeMinutes || 0} Menit): +${formatRupiah(meta.overtimeFee)}\n`;
    }
    msg += `Biaya Administrasi: ${formatRupiah(adminFee)}\n`;
    msg += `*TOTAL ${isPaid ? 'BAYAR' : 'TAGIHAN'}: ${formatRupiah(totalAmount)}*\n`;
    msg += `-------------------------------------------\n`;
    if (!isPaid) {
      msg += `Status: *MENUNGGU PEMBAYARAN*\n`;
      msg += `Silakan melakukan pembayaran via ${meta.paymentMethod} / Kasir Klinik Benang Merah.\n`;
    } else {
      msg += `Status: *LUNAS / PAID*\n`;
      msg += `Terima kasih telah mempercayakan ruang pemulihan Anda bersama Benang Merah.\n`;
    }

    const targetUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(targetUrl, '_blank');
  };

  // CETAK STRUK DI BROWSER
  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isPaid ? 'NOTA LUNAS' : 'INVOICE'} - ${appointment.patient_name || 'Pasien'}</title>
          <style>
            body { font-family: monospace; padding: 20px; margin: 0; background: #ffffff; color: #111827; }
            .receipt-box { border: 2px dashed #701A24; padding: 24px; border-radius: 16px; max-width: 440px; margin: 0 auto; position: relative; }
            .text-center { text-align: center; }
            .border-b { border-bottom: 1px solid #EADFD5; padding-bottom: 8px; }
            .border-t { border-top: 1px solid #EADFD5; padding-top: 8px; }
            .font-bold { font-weight: bold; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .flex-between { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .brand { color: #701A24; font-family: serif; font-size: 18px; margin: 0; }
            .sub { color: #6B7280; font-size: 10px; margin: 2px 0; }
            .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-top: 6px; text-transform: uppercase; }
            .badge-paid { background: #D1FAE5; color: #065F46; }
            .badge-inv { background: #FEF3C7; color: #92400E; }
            .stamp { position: absolute; right: 15px; bottom: 40px; transform: rotate(-12deg); border: 3px double #701A24; padding: 4px 8px; border-radius: 8px; color: #701A24; font-weight: bold; font-size: 11px; background: rgba(255,255,255,0.95); }
            .qr-code { text-align: center; margin: 12px 0; }
            .qr-code img { width: 140px; height: 140px; border: 1px solid #ddd; padding: 4px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            ${isPaid ? '<div class="stamp">LUNAS / PAID<br/><span style="font-size:7px;">BENANG MERAH</span></div>' : ''}
            
            <div class="text-center border-b">
              <h2 class="brand">BENANG MERAH</h2>
              <p class="sub">Layanan Psikologi & Kesehatan Mental</p>
              <p class="sub">Jl. Bandung No. B9/16, Nuansa Majasem | WA: 0822-9858-5310</p>
              <span class="badge ${isPaid ? 'badge-paid' : 'badge-inv'}">
                ${isPaid ? 'NOTA BUKTI PEMBAYARAN LUNAS' : 'INVOICE TAGIHAN PEMBAYARAN'}
              </span>
            </div>

            <div style="margin: 12px 0;" class="text-xs">
              <p style="margin: 3px 0;"><span style="color:#6B7280;">Tanggal & Sesi:</span> ${appointment.booking_date} (${appointment.booking_time || 'Sesuai Janji'})</p>
              <p style="margin: 3px 0;"><span style="color:#6B7280;">Klien / Pasien:</span> <strong>${appointment.patient_name || '-'}</strong> (Sesi #${appointment.visit_number || 1})</p>
              <p style="margin: 3px 0;"><span style="color:#6B7280;">Layanan:</span> ${(appointment.service_type || appointment.category || 'Konseling').toUpperCase()}</p>
              <p style="margin: 3px 0;"><span style="color:#6B7280;">Psikolog PJ:</span> ${appointment.doctor_name || '-'}</p>
              ${appointment.assigned_terapis ? `<p style="margin: 3px 0;"><span style="color:#6B7280;">Terapis PJ:</span> ${appointment.assigned_terapis}</p>` : ''}
              <p style="margin: 3px 0;"><span style="color:#6B7280;">Handle By:</span> ${meta.handleBy} | <span style="color:#6B7280;">Metode Bayar:</span> ${meta.paymentMethod}</p>
            </div>

            ${!isPaid && meta.paymentMethod === 'QRIS' ? `
              <div class="qr-code">
                <p style="font-size:10px; color:#701A24; font-weight:bold; margin-bottom:4px;">SCAN QRIS UNTUK PEMBAYARAN:</p>
                <img src="/qris.jpeg" alt="QRIS Pembayaran"/>
              </div>
            ` : ''}

            <div class="border-t border-b text-xs" style="margin: 10px 0; padding: 8px 0;">
              <div class="flex-between">
                <span>Biaya Layanan / Sesi:</span>
                <span>${formatRupiah(baseServicePrice)}</span>
              </div>

              ${hasVoucher ? `
                <div class="flex-between" style="color:#047857; font-weight:bold;">
                  <span>Voucher Diskon (OPENING100K):</span>
                  <span>- Rp 100.000</span>
                </div>
              ` : ''}

              ${meta.overtimeFee > 0 ? `
                <div class="flex-between" style="color:#92400E; font-weight:bold;">
                  <span>Overtime / Kelebihan Sesi (${meta.overtimeMinutes || 0} Menit):</span>
                  <span>+ ${formatRupiah(meta.overtimeFee)}</span>
                </div>
              ` : ''}

              <div class="flex-between">
                <span>Biaya Administrasi:</span>
                <span>${formatRupiah(adminFee)}</span>
              </div>

              <div class="flex-between font-bold text-sm" style="color:#701A24; margin-top:6px; border-top:1px dashed #ccc; padding-top:6px;">
                <span>TOTAL ${isPaid ? 'BAYAR' : 'TAGIHAN'}:</span>
                <span>${formatRupiah(totalAmount)}</span>
              </div>
            </div>

            <div class="text-center text-xs" style="color:#6B7280; font-style:italic;">
              ${!isPaid ? '* Silakan lakukan pembayaran sesuai nominal di atas ke kasir / QRIS resmi Benang Merah.' : '*** Pembayaran telah diterima. Terima kasih telah mempercayakan ruang pemulihan Anda bersama Benang Merah ***'}
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-up">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-[#EADFD5]">
        
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center border-b border-[#EADFD5] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#701A24]/10 flex items-center justify-center text-[#701A24]">
              <ReceiptIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-gray-800 text-sm leading-tight">
                {isPaid ? 'Nota Bukti Pembayaran Lunas' : 'Invoice Tagihan Konseling'}
              </h3>
              <p className="text-[10px] text-gray-500 font-medium">
                Klinik Layanan Psikologi Benang Merah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* STATUS BADGE */}
        <div>
          {isPaid ? (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Status: LUNAS / PAID
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Terverifikasi
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#701A24]/5 border border-[#701A24]/15 rounded-2xl text-[#701A24] text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#701A24] animate-pulse"></span>
                Status: MENUNGGU PEMBAYARAN
              </span>
              <span className="text-[10px] bg-[#701A24] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-xs">
                Invoice Tagihan
              </span>
            </div>
          )}
        </div>

        {/* TAMPILAN KERTAS STRUK (MENGGUNAKAN INLINE STYLES HEX BEBAS OKLAB) */}
        <div
          id="printable-receipt"
          style={{
            backgroundColor: '#FAF8F5',
            color: '#1E293B',
            borderColor: '#701A24',
            borderWidth: '2px',
            borderStyle: 'dashed',
            borderRadius: '16px',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        >
          {isPaid && (
            <div
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '48px',
                pointerEvents: 'none',
                transform: 'rotate(-12deg)',
                opacity: 0.95
              }}
            >
              <div
                style={{
                  border: '2px double #701A24',
                  borderRadius: '8px',
                  padding: '4px 12px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.1em', color: '#701A24', textTransform: 'uppercase' }}>
                  LUNAS / PAID
                </span>
                <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#701A24', marginTop: '2px', borderTop: '1px solid #701A24', paddingTop: '2px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  BENANG MERAH
                </p>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', borderBottom: '1px solid #EADFD5', paddingBottom: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <img
                src="/logo.png"
                alt="Logo Benang Merah"
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/logo.jpeg";
                }}
              />
              <h2 style={{ fontWeight: 'bold', fontSize: '16px', fontFamily: 'serif', color: '#701A24', margin: 0 }}>
                BENANG MERAH
              </h2>
            </div>
            <p style={{ fontSize: '10px', color: '#64748B', fontFamily: 'sans-serif', margin: '2px 0' }}>
              Layanan Psikologi & Kesehatan Mental
            </p>
            <p style={{ fontSize: '9px', color: '#94A3B8', fontFamily: 'sans-serif', margin: '2px 0' }}>
              Jl. Bandung No. B9/16, Nuansa Majasem | WA: 0822-9858-5310
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontFamily: 'sans-serif', marginBottom: '12px' }}>
            <p style={{ margin: 0 }}><span style={{ color: '#64748B' }}>Tanggal & Sesi:</span> {formatDate(appointment.booking_date)} ({appointment.booking_time || 'Sesuai Janji'})</p>
            <p style={{ margin: 0 }}><span style={{ color: '#64748B' }}>Klien / Pasien:</span> <strong style={{ color: '#1E293B' }}>{appointment.patient_name || '-'}</strong> (Sesi #{appointment.visit_number || 1})</p>
            <p style={{ margin: 0 }}><span style={{ color: '#64748B' }}>Layanan:</span> {(appointment.service_type || appointment.category || 'Konseling').toUpperCase()}</p>
            <p style={{ margin: 0 }}><span style={{ color: '#64748B' }}>Psikolog PJ:</span> {appointment.doctor_name || '-'}</p>
            {appointment.assigned_terapis && (
              <p style={{ margin: 0 }}><span style={{ color: '#64748B' }}>Terapis:</span> {appointment.assigned_terapis}</p>
            )}
            <p style={{ margin: 0 }}><span style={{ color: '#64748B' }}>Handle By:</span> {meta.handleBy} | <span style={{ color: '#64748B' }}>Metode:</span> {meta.paymentMethod}</p>
          </div>

          {!isPaid && meta.paymentMethod === 'QRIS' && (
            <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '12px', borderRadius: '16px', border: '1px solid #EADFD5', marginBottom: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#701A24', marginBottom: '6px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SCAN QRIS UNTUK PEMBAYARAN
              </p>
              <img
                src="/qris.jpeg"
                alt="QRIS Pembayaran"
                style={{ width: '128px', height: '128px', objectFit: 'contain', margin: '0 auto', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '4px', backgroundColor: '#ffffff' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div style={{ borderTop: '1px solid #EADFD5', borderBottom: '1px solid #EADFD5', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontFamily: 'sans-serif', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Biaya Layanan / Sesi:</span>
              <span>{formatRupiah(baseServicePrice)}</span>
            </div>

            {hasVoucher && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857', fontWeight: 'bold' }}>
                <span>Voucher Diskon (OPENING100K):</span>
                <span>- Rp 100.000</span>
              </div>
            )}

            {meta.overtimeFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400E', fontWeight: 'bold' }}>
                <span>Overtime / Kelebihan Sesi ({meta.overtimeMinutes || 0} Menit):</span>
                <span>+ {formatRupiah(meta.overtimeFee)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Biaya Administrasi:</span>
              <span>{formatRupiah(adminFee)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', color: '#701A24', paddingTop: '6px', borderTop: '1px dashed #EADFD5' }}>
              <span>TOTAL {isPaid ? 'BAYAR' : 'TAGIHAN'}:</span>
              <span>{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '10px', color: '#64748B', fontStyle: 'italic', paddingTop: '2px', fontFamily: 'sans-serif' }}>
            {!isPaid
              ? `* Silakan lakukan pembayaran sesuai nominal di atas via ${meta.paymentMethod} / kasir resmi Benang Merah.`
              : '*** Pembayaran telah diterima. Terima kasih telah mempercayakan ruang pemulihan Anda bersama Benang Merah ***'}
          </div>
        </div>

        {/* TOMBOL AKSI */}
        <div className="space-y-2 pt-1 text-xs">
          {/* TOMBOL UNDUH GAMBAR STRUK PNG (SAVE TO GALLERY) */}
          <button
            type="button"
            disabled={downloadingPng}
            onClick={handleDownloadPng}
            className="w-full py-2.5 bg-[#701A24] hover:bg-[#54121B] text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-60"
            title="Unduh struk pembayaran langsung sebagai file gambar PNG (Tersimpan ke Galeri HP)"
          >
            <DownloadIcon className="w-4 h-4 text-white" />
            <span>{downloadingPng ? 'Membuat Gambar PNG...' : 'Download Struk PNG (Simpan ke Galeri)'}</span>
          </button>

          {!isPaid && (
            <button
              type="button"
              onClick={onMarkAsPaid}
              className="w-full py-2.5 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <CheckIcon className="w-4 h-4" />
              Verifikasi Pembayaran & Terbitkan Struk Lunas
            </button>
          )}

          <button
            type="button"
            onClick={handleSendWa}
            className="w-full py-2.5 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Kirim WA Tagihan/Nota ke Klien
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2 bg-white border border-[#701A24] text-[#701A24] font-semibold rounded-xl hover:bg-[#701A24]/5 flex items-center justify-center gap-1.5 transition"
          >
            <PrinterIcon className="w-4 h-4" />
            Cetak Struk Transaksi
          </button>
        </div>

      </div>
    </div>
  );
}
