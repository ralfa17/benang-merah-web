import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import { formatDate, parseAppointmentNotes } from './helpers';

/**
 * Helper untuk membuat sel tabel dengan padding dan border halus
 */
function createCell(text, { bold = false, width = 50, color = '1E293B', fill = null } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: fill ? { fill } : undefined,
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text || '-'),
            bold,
            color,
            size: 20 // 10pt
          })
        ]
      })
    ]
  });
}

/**
 * Ekspor Laporan Rekam Medis & Asesmen Psikolog ke format .docx
 */
export async function exportPsychologistReportDocx(appointment, allPatientSessions = []) {
  if (!appointment) return;
  const meta = parseAppointmentNotes(appointment.notes);
  const patientName = appointment.patient_name || 'Pasien';
  const visitNum = appointment.visit_number || 1;
  const psychologistName = appointment.doctor_name || 'Psikolog Klinis Penanggung Jawab';

  // Sesi-sesi sebelumnya
  const previousSessions = allPatientSessions.filter(
    (s) => s.id !== appointment.id && Number(s.visit_number) < Number(visitNum)
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } // 1 inch margins
          }
        },
        children: [
          // KOP KLINIK BENANG MERAH
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'KLINIK PSIKOLOGI BENANG MERAH',
                bold: true,
                size: 28, // 14pt
                color: '701A24',
                font: 'Georgia'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Layanan Rekam Medis, Psikologi Klinis & Konseling Terpadu',
                size: 18,
                color: '64748B'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Perumahan Nuansa Majasem, Jl. Bandung No. B9/16, Cirebon | WhatsApp: 0822-9858-5310',
                size: 16,
                color: '94A3B8'
              })
            ]
          }),

          // GARIS PEMISAH KOP
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 240 },
            border: {
              bottom: { color: '701A24', style: BorderStyle.DOUBLE, size: 6 }
            },
            children: []
          }),

          // JUDUL LAPORAN
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'LAPORAN REKAM MEDIS & EVALUASI PSIKOLOGIS',
                bold: true,
                size: 24, // 12pt
                color: '1E293B'
              })
            ]
          }),

          // TABEL IDENTITAS PASIEN
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Nama Pasien / Klien', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(patientName, { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Usia / Kontak Telepon', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(`${appointment.age ? `${appointment.age} Tahun` : '-'} / ${meta.phone || '-'}`, { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Kunjungan Sesi Ke-', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(`Sesi #${visitNum} (Total ${allPatientSessions.length || 1} Sesi Terjadwal)`, { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Tanggal & Jam Sesi', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(`${formatDate(appointment.booking_date)} (${appointment.booking_time || 'Sesuai Janji'})`, { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Layanan Konseling', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell((appointment.service_type || appointment.category || 'Konseling').toUpperCase(), { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Psikolog Penanggung Jawab', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(psychologistName, { bold: true, width: 72 }),
                ]
              }),
              ...(appointment.assigned_terapis
                ? [
                    new TableRow({
                      children: [
                        createCell('Rujukan Terapis', { bold: true, width: 28, fill: 'FAF8F5' }),
                        createCell(appointment.assigned_terapis, { width: 72 }),
                      ]
                    })
                  ]
                : []),
              new TableRow({
                children: [
                  createCell('Status Pembayaran', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(appointment.status === 'lunas' ? 'LUNAS / VERIFIED' : 'PENDING TAGIHAN', {
                    bold: true,
                    width: 72,
                    color: appointment.status === 'lunas' ? '065F46' : '92400E'
                  }),
                ]
              }),
            ]
          }),

          // 1. ANAMNESA & KELUHAN
          new Paragraph({
            spacing: { before: 240, after: 80 },
            children: [
              new TextRun({
                text: '1. Catatan Anamnesa & Dinamika Keluhan Klien:',
                bold: true,
                size: 22,
                color: '701A24'
              })
            ]
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: meta.anamnesa || '(Belum ada catatan anamnesa tertulis untuk sesi ini)',
                size: 20
              })
            ]
          }),

          // 2. DIAGNOSA PSIKOLOGIS
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: '2. Diagnosa Dinamika Psikologis:',
                bold: true,
                size: 22,
                color: '701A24'
              })
            ]
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: meta.diagnosis || '(Belum ditetapkan diagnosa khusus)',
                size: 20,
                bold: !!meta.diagnosis
              })
            ]
          }),

          // 3. RANCANGAN TINDAK LANJUT
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: '3. Rancangan Tindak Lanjut & Rencana Intervensi:',
                bold: true,
                size: 22,
                color: '701A24'
              })
            ]
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: meta.followUpPlan || '(Belum ada rencana tindak lanjut tercatat)',
                size: 20
              })
            ]
          }),

          // 4. RUJUKAN EKSTERNAL & INTERNAL
          ...(meta.internalReferral || meta.externalReferral
            ? [
                new Paragraph({
                  spacing: { before: 120, after: 80 },
                  children: [
                    new TextRun({
                      text: '4. Rekomendasi Rujukan:',
                      bold: true,
                      size: 22,
                      color: '701A24'
                    })
                  ]
                }),
                new Paragraph({
                  spacing: { after: 180 },
                  children: [
                    new TextRun({
                      text: `Rujukan Terapis: ${meta.internalReferral || '-'} | Rujukan Medis/Eksternal: ${meta.externalReferral || '-'}`,
                      size: 20
                    })
                  ]
                })
              ]
            : []),

          // 5. RIWAYAT SESI SEBELUMNYA
          ...(previousSessions.length > 0
            ? [
                new Paragraph({
                  spacing: { before: 180, after: 80 },
                  children: [
                    new TextRun({
                      text: `5. Ringkasan Riwayat Sesi Sebelumnya (${previousSessions.length} Sesi Terdata):`,
                      bold: true,
                      size: 22,
                      color: '1E293B'
                    })
                  ]
                }),
                ...previousSessions.map((prev, pIdx) => {
                  const pMeta = parseAppointmentNotes(prev.notes);
                  return new Paragraph({
                    spacing: { after: 80 },
                    children: [
                      new TextRun({
                        text: `• Sesi #${prev.visit_number || pIdx + 1} (${formatDate(prev.booking_date)}): `,
                        bold: true,
                        size: 19
                      }),
                      new TextRun({
                        text: `Diagnosa: ${pMeta.diagnosis || '-'} | Rencana: ${pMeta.followUpPlan || '-'}`,
                        size: 19,
                        color: '475569'
                      })
                    ]
                  });
                })
              ]
            : []),

          // TANDA TANGAN
          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Cirebon, ${formatDate(appointment.booking_date || new Date().toISOString())}`,
                size: 20
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Psikolog Penanggung Jawab,',
                size: 20
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 600 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: psychologistName,
                bold: true,
                underline: {},
                size: 20,
                color: '701A24'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Klinik Psikologi Benang Merah',
                size: 18,
                color: '64748B'
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
  saveAs(blob, `Laporan-Medis-BenangMerah-${cleanName}-Sesi${visitNum}.docx`);
}

/**
 * Ekspor Laporan Perkembangan Terapi Tumbuh Kembang Terapis ke format .docx
 */
export async function exportTherapistProgressDocx(appointment, allPatientSessions = [], therapistName = 'Terapis Anak') {
  if (!appointment) return;
  const meta = parseAppointmentNotes(appointment.notes);
  const patientName = appointment.patient_name || 'Pasien Anak';
  const visitNum = appointment.visit_number || 1;

  const previousSessions = allPatientSessions.filter(
    (s) => s.id !== appointment.id && Number(s.visit_number) < Number(visitNum)
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
          }
        },
        children: [
          // KOP KLINIK BENANG MERAH
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'KLINIK PSIKOLOGI BENANG MERAH',
                bold: true,
                size: 28,
                color: '701A24',
                font: 'Georgia'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Divisi Terapi Tumbuh Kembang, Play & Grow, serta Stimulasi Pra-Literasi',
                size: 18,
                color: '64748B'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 240 },
            border: {
              bottom: { color: '701A24', style: BorderStyle.DOUBLE, size: 6 }
            },
            children: []
          }),

          // JUDUL
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'LAPORAN PROGRESS & PERKEMBANGAN TERAPI ANAK',
                bold: true,
                size: 24,
                color: '1E293B'
              })
            ]
          }),

          // IDENTITAS PASIEN
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Nama Pasien / Anak', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(patientName, { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Usia / Kontak Wali', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(`${appointment.age ? `${appointment.age} Tahun` : '-'} / ${meta.phone || '-'}`, { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Sesi Terapi Ke-', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(`Kunjungan #${visitNum}`, { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Tanggal & Jam Terapi', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(`${formatDate(appointment.booking_date)} (${appointment.booking_time || 'Sesuai Janji'})`, { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Metode / Program', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(appointment.service_type || meta.directMethod || 'Play and Grow', { width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Terapis Penanggung Jawab', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(appointment.assigned_terapis || therapistName, { bold: true, width: 72 }),
                ]
              }),
              new TableRow({
                children: [
                  createCell('Psikolog Pembimbing / Perujuk', { bold: true, width: 28, fill: 'FAF8F5' }),
                  createCell(appointment.doctor_name || 'Layanan Terapi Terpadu', { width: 72 }),
                ]
              }),
            ]
          }),

          // CATATAN PROGRESS SAAT INI
          new Paragraph({
            spacing: { before: 240, after: 80 },
            children: [
              new TextRun({
                text: `Catatan Perkembangan Sesi #${visitNum}:`,
                bold: true,
                size: 22,
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: meta.therapyProgress || '(Belum ada catatan perkembangan tertulis untuk sesi ini)',
                size: 20
              })
            ]
          }),

          // RIWAYAT SESI SEBELUMNYA
          ...(previousSessions.length > 0
            ? [
                new Paragraph({
                  spacing: { before: 180, after: 80 },
                  children: [
                    new TextRun({
                      text: `Riwayat Perkembangan Sesi Sebelumnya:`,
                      bold: true,
                      size: 22,
                      color: '1E293B'
                    })
                  ]
                }),
                ...previousSessions.map((prev, pIdx) => {
                  const pMeta = parseAppointmentNotes(prev.notes);
                  return new Paragraph({
                    spacing: { after: 80 },
                    children: [
                      new TextRun({
                        text: `• Sesi #${prev.visit_number || pIdx + 1} (${formatDate(prev.booking_date)}): `,
                        bold: true,
                        size: 19
                      }),
                      new TextRun({
                        text: pMeta.therapyProgress || '(Tidak ada catatan)',
                        size: 19,
                        color: '475569'
                      })
                    ]
                  });
                })
              ]
            : []),

          // TANDA TANGAN TERAPIS
          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Cirebon, ${formatDate(appointment.booking_date || new Date().toISOString())}`,
                size: 20
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Terapis Penanggung Jawab,',
                size: 20
              })
            ]
          }),
          new Paragraph({
            spacing: { before: 600 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: appointment.assigned_terapis || therapistName,
                bold: true,
                underline: {},
                size: 20,
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Klinik Psikologi Benang Merah',
                size: 18,
                color: '64748B'
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
  saveAs(blob, `Laporan-Progress-Terapi-${cleanName}-Sesi${visitNum}.docx`);
}
