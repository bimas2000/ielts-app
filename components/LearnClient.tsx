"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BookOpen, Headphones, PenLine, Mic,
  ChevronRight, ChevronLeft, CheckCircle2,
  Lightbulb, Target, AlertTriangle, Star,
  Clock, ArrowRight, Play
} from "lucide-react";

export type Section = "reading" | "listening" | "writing" | "speaking";

interface Lesson {
  title: string;
  icon: string;
  duration: number; // minutes
  steps: LessonStep[];
  practiceLink: string;
}

interface LessonStep {
  type: "intro" | "tip" | "strategy" | "example" | "mistake" | "checklist";
  title: string;
  content: string;
  items?: string[];
  highlight?: string;
}

const LESSONS: Record<Section, Lesson> = {
  reading: {
    title: "IELTS Reading",
    icon: "📖",
    duration: 20,
    practiceLink: "/reading",
    steps: [
      {
        type: "intro",
        title: "Gambaran IELTS Reading",
        content: "IELTS Academic Reading memiliki 3 passage dengan total 40 pertanyaan dalam waktu 60 menit. Setiap passage semakin sulit — Passage 3 setara teks jurnal akademik.",
        items: [
          "3 passage teks akademik panjang (600–900 kata/passage)",
          "40 pertanyaan total — sekitar 13–14 per passage",
          "60 menit tanpa waktu transfer jawaban",
          "Band dihitung: 40 benar = Band 9, 35 benar = Band 7.5",
        ],
        highlight: "Kunci utama: Jangan baca seluruh passage dulu — ini membuang waktu!"
      },
      {
        type: "strategy",
        title: "Strategi Utama: Skimming & Scanning",
        content: "Dua teknik paling penting untuk menghemat waktu di Reading:",
        items: [
          "SKIMMING (2-3 menit): Baca hanya kalimat pertama dan terakhir tiap paragraf untuk dapat gambaran umum. Jangan baca detail!",
          "SCANNING: Cari kata kunci spesifik yang diminta soal. Matamu bergerak cepat sampai ketemu kata itu.",
          "Urutan yang benar: Baca soal dulu → Underline keywords di soal → Scan passage untuk temukan lokasinya",
        ],
        highlight: "⏱️ Alokasi waktu ideal: 20 menit per passage = 60 menit total"
      },
      {
        type: "tip",
        title: "Tips True / False / Not Given",
        content: "Tipe soal ini paling sering bikin salah karena banyak yang bingung antara FALSE dan NOT GIVEN:",
        items: [
          "TRUE: Informasi di soal SESUAI dengan passage (mungkin dengan kata berbeda/sinonim)",
          "FALSE: Informasi di soal BERLAWANAN dengan passage (passage menyatakan kebalikannya)",
          "NOT GIVEN: Topik di soal TIDAK DIBAHAS sama sekali di passage — bukan berarti salah, tapi tidak ada",
          "Jebakan: Jangan gunakan pengetahuan umum kamu — hanya berdasarkan isi passage!",
        ],
        highlight: "Ingat: NOT GIVEN ≠ FALSE. NOT GIVEN = passage diam saja soal itu."
      },
      {
        type: "tip",
        title: "Tips Fill in the Blank & Summary",
        content: "Soal ini mengharuskan kamu mengisi kata yang tepat dari passage:",
        items: [
          "Selalu perhatikan batas kata: 'NO MORE THAN TWO WORDS' = maksimal 2 kata",
          "Jawaban SELALU ada di passage — copy persis, jangan ubah kata",
          "Perhatikan grammar: kalau butuh noun, cari noun; kalau butuh adjective, cari adjective",
          "Kalimat di soal biasanya paraphrase dari passage — cari sinonimnya",
        ],
        highlight: "Jangan ubah kata dari passage! Bahkan ejaan harus sama persis."
      },
      {
        type: "strategy",
        title: "Strategi Matching Headings",
        content: "Tipe soal ini meminta mencocokkan judul dengan paragraf:",
        items: [
          "Baca semua pilihan heading dulu sebelum baca passage",
          "Setiap paragraf punya satu 'main idea' — biasanya di kalimat pertama",
          "Eliminasi heading yang sudah dipakai",
          "Heading yang mirip tapi tidak tepat adalah jebakan — pilih yang paling mewakili SELURUH paragraf",
        ],
        highlight: "Fokus pada main idea tiap paragraf, bukan detail kecil."
      },
      {
        type: "mistake",
        title: "Kesalahan Umum yang Harus Dihindari",
        content: "Ini adalah kesalahan yang paling sering dilakukan peserta IELTS:",
        items: [
          "❌ Membaca seluruh passage dari awal sebelum lihat soal — buang 10 menit!",
          "❌ Terjebak di satu soal terlalu lama — skip dan kembali nanti",
          "❌ Menggunakan pengetahuan umum sendiri untuk menjawab T/F/NG",
          "❌ Tidak memperhatikan batas kata di fill-in-the-blank",
          "❌ Panik karena tidak tahu semua kata — konteks cukup untuk menjawab",
        ],
        highlight: "Manajemen waktu lebih penting dari memahami 100% passage."
      },
      {
        type: "example",
        title: "Contoh: Cara Menjawab MCQ dengan Benar",
        content: "Contoh approach untuk Multiple Choice Question:",
        items: [
          "Step 1: Baca pertanyaan dan options dengan teliti",
          "Step 2: Underline keywords di pertanyaan (misal: 'main reason', 'according to paragraph 2')",
          "Step 3: Scan passage untuk temukan bagian relevan",
          "Step 4: Baca bagian itu detail (bukan seluruh passage)",
          "Step 5: Eliminasi jawaban yang jelas salah, pilih yang paling sesuai passage",
        ],
        highlight: "Selalu kembali ke passage — jangan mengandalkan ingatan atau asumsi."
      },
      {
        type: "checklist",
        title: "Checklist Sebelum Mulai Test",
        content: "Pastikan kamu siap dengan checklist ini:",
        items: [
          "✅ Sudah paham perbedaan True/False/Not Given",
          "✅ Tahu strategi skimming dan scanning",
          "✅ Ingat alokasi waktu: 20 menit per passage",
          "✅ Siap skip soal yang sulit dan kembali nanti",
          "✅ Tidak akan membaca seluruh passage di awal",
        ],
        highlight: "Sudah siap? Mulai practice sekarang! 💪"
      }
    ]
  },
  listening: {
    title: "IELTS Listening",
    icon: "🎧",
    duration: 15,
    practiceLink: "/listening",
    steps: [
      {
        type: "intro",
        title: "Gambaran IELTS Listening",
        content: "IELTS Listening memiliki 4 bagian dengan total 40 pertanyaan dalam waktu sekitar 30-40 menit. Audio diputar SATU KALI saja — tidak ada pengulangan!",
        items: [
          "Part 1: Percakapan sehari-hari (2 orang) — paling mudah",
          "Part 2: Monolog situasi sosial (misalnya tur, pengumuman)",
          "Part 3: Diskusi akademik (2-4 orang mahasiswa/dosen)",
          "Part 4: Kuliah/ceramah akademik — paling sulit",
        ],
        highlight: "Audio diputar hanya SEKALI — konsentrasi penuh dari awal!"
      },
      {
        type: "strategy",
        title: "Strategi Kunci: Predict Before You Listen",
        content: "Teknik paling ampuh: predict jawaban sebelum audio mulai:",
        items: [
          "Saat ada waktu jeda, baca soal yang akan datang dan predict tipe jawaban",
          "Untuk fill-blank: predict apakah jawabannya nama, angka, waktu, atau kata benda",
          "Untuk MCQ: baca semua options agar tahu apa yang harus didengarkan",
          "Untuk angka/nama: siap-siap tulis saat dengar karena tidak akan diulang",
        ],
        highlight: "Gunakan setiap detik jeda untuk baca soal berikutnya!"
      },
      {
        type: "tip",
        title: "Tips Part 1: Form Filling & Note Taking",
        content: "Part 1 biasanya berupa percakapan mengisi formulir (booking, pendaftaran, dll):",
        items: [
          "Jawaban biasanya nama orang, nomor telepon, tanggal, waktu, atau alamat",
          "Ejaan nama sering dieja huruf per huruf — siap tulis: A-N-D-E-R-S-O-N",
          "Angka bisa diucapkan cepat — fokus dan langsung tulis",
          "Jika soal meminta nomor telepon, biasanya ada dalam format tertentu",
        ],
        highlight: "Part 1 paling mudah — jangan sampai miss untuk mendapat skor tinggi!"
      },
      {
        type: "tip",
        title: "Tips Part 3 & 4: Academic Content",
        content: "Part 3 dan 4 semakin akademik dengan vocabulary yang lebih kompleks:",
        items: [
          "Pahami konteks umum dulu (topik apa?) sebelum detail",
          "Pembicara sering menggunakan discourse markers: 'however', 'on the other hand', 'in contrast'",
          "Jawaban untuk MCQ sering bukan kata yang sama persis — dengarkan paraphrase",
          "Di Part 4 (kuliah), perhatikan ketika pembicara menekankan: 'importantly', 'the key point is'",
        ],
        highlight: "Dengarkan signal words yang menandai jawaban penting."
      },
      {
        type: "strategy",
        title: "Strategi Distractor: Jebakan Jawaban",
        content: "IELTS sering membuat distractor (jawaban palsu) dalam audio:",
        items: [
          "Pembicara menyebut sesuatu lalu mengoreksinya: 'I mean... actually...' — tulis yang terakhir!",
          "Dua orang berbeda pendapat — perhatikan siapa yang akhirnya setuju/memutuskan",
          "Pembicara menyebut beberapa pilihan lalu memilih satu — ikuti pilihan finalnya",
          "Hati-hati dengan negasi: 'NOT interested in...' — jangan tulis yang di-negate",
        ],
        highlight: "Selalu tunggu sampai pembicara selesai sebelum tulis jawaban final."
      },
      {
        type: "mistake",
        title: "Kesalahan Umum dalam Listening",
        content: "Hindari kesalahan ini saat listening test:",
        items: [
          "❌ Terpaku pada satu soal yang terlewat — maju terus ke soal berikutnya",
          "❌ Tidak memperhatikan ejaan — tulis sesuai yang dieja di audio",
          "❌ Tidak baca soal di muka saat ada jeda — waktu jeda sangat berharga",
          "❌ Menulis terlalu banyak kata pada fill-blank — perhatikan batas kata",
          "❌ Tidak memeriksa grammar jawaban (singular/plural, tense)",
        ],
        highlight: "Jika terlewat satu soal, lanjut ke soal berikutnya — jangan stuck!"
      },
      {
        type: "checklist",
        title: "Checklist Sebelum Mulai Test",
        content: "Siapkan dirimu dengan checklist ini:",
        items: [
          "✅ Tahu format 4 part listening",
          "✅ Siap gunakan waktu jeda untuk baca soal berikutnya",
          "✅ Tidak akan panik kalau satu soal terlewat",
          "✅ Siap dengarkan dan langsung tulis angka/nama",
          "✅ Waspada terhadap distractor/koreksi di tengah audio",
        ],
        highlight: "Konsentrasi penuh dari awal karena tidak ada pengulangan! 🎧"
      }
    ]
  },
  writing: {
    title: "IELTS Writing",
    icon: "✍️",
    duration: 25,
    practiceLink: "/writing",
    steps: [
      {
        type: "intro",
        title: "Gambaran IELTS Writing",
        content: "IELTS Writing memiliki 2 task dalam 60 menit. Task 2 memiliki bobot nilai LEBIH BESAR dari Task 1 — prioritaskan Task 2!",
        items: [
          "Task 1: Deskripsikan grafik/diagram/proses (minimal 150 kata, 20 menit)",
          "Task 2: Esai argumentatif/diskusi (minimal 250 kata, 40 menit)",
          "Task 2 = 2/3 dari total nilai Writing",
          "4 kriteria penilaian sama untuk keduanya (bobot berbeda di Task 1 & 2)",
        ],
        highlight: "Prioritas: Kerjakan Task 2 dengan lebih banyak waktu dan usaha!"
      },
      {
        type: "strategy",
        title: "4 Kriteria Penilaian Band Score",
        content: "Pahami apa yang dinilai examiner untuk memaksimalkan score:",
        items: [
          "Task Achievement/Response (25%): Apakah kamu menjawab semua poin pertanyaan? Apakah posisimu jelas?",
          "Coherence & Cohesion (25%): Apakah tulisanmu mengalir logis? Gunakan linking words!",
          "Lexical Resource (25%): Variasi kosakata, penggunaan idiom/collocations akademik",
          "Grammatical Range & Accuracy (25%): Variasi struktur kalimat, minim kesalahan grammar",
        ],
        highlight: "Nilai akhir = rata-rata dari 4 kriteria. Lemah di satu = turun semua!"
      },
      {
        type: "strategy",
        title: "Struktur Esai Task 2 yang Ideal",
        content: "Gunakan struktur ini untuk setiap esai Task 2:",
        items: [
          "Paragraf 1 — Introduction (2-3 kalimat): Paraphrase pertanyaan + thesis statement yang jelas",
          "Paragraf 2 — Body 1 (4-5 kalimat): Main idea + penjelasan + contoh spesifik",
          "Paragraf 3 — Body 2 (4-5 kalimat): Main idea berbeda + penjelasan + contoh",
          "Paragraf 4 — Conclusion (2 kalimat): Ringkasan singkat posisimu, tidak ada ide baru",
        ],
        highlight: "4 paragraf sudah cukup untuk band 7+. Kualitas > Kuantitas!"
      },
      {
        type: "tip",
        title: "Tips Task 1: Grafik & Diagram",
        content: "Cara menjawab Task 1 dengan benar untuk band tinggi:",
        items: [
          "Overview paragraph adalah WAJIB — examiner mencari ini untuk band 6+",
          "Jangan describe setiap data point — pilih trends dan extreme values (highest, lowest, significant changes)",
          "Gunakan language of change: 'rose sharply', 'declined gradually', 'remained stable at'",
          "Bandingkan data antar kategori — ini yang dinilai, bukan hanya listing angka",
          "Tidak perlu kesimpulan/opini — hanya describe dan compare data",
        ],
        highlight: "Selalu tulis Overview — tanpa ini nilai tidak bisa 6!"
      },
      {
        type: "tip",
        title: "Vocabulary Akademik untuk Band 7+",
        content: "Tingkatkan band dengan menggunakan vocabulary ini:",
        items: [
          "Pengganti 'big/small': substantial, considerable, significant / marginal, negligible, minimal",
          "Pengganti 'increase/decrease': surge, escalate, soar / plummet, decline, diminish",
          "Linking words: Furthermore, Moreover, In contrast, Nevertheless, Consequently, Therefore",
          "Academic phrases: 'It is argued that...', 'Evidence suggests that...', 'This can be attributed to...'",
        ],
        highlight: "Hindari kata sederhana berulang — gunakan sinonim dan paraphrase!"
      },
      {
        type: "strategy",
        title: "Grammar Band 7: Variasi Kalimat",
        content: "Untuk mencapai band 7+ di Grammatical Range, gunakan variasi ini:",
        items: [
          "Simple: 'The number increased.' → Compound: 'The number increased, and this trend continued.'",
          "Complex: 'Although prices rose, demand remained high.'",
          "Passive voice: 'The data shows...' → 'It can be seen that...' / 'The trend is illustrated by...'",
          "Conditionals: 'If this trend continues, the figure will double by 2030.'",
          "Relative clauses: 'The country, which experienced rapid growth, saw...'",
        ],
        highlight: "Mix simple, compound, dan complex sentences — jangan semua satu tipe!"
      },
      {
        type: "mistake",
        title: "Kesalahan Fatal dalam Writing",
        content: "Hindari kesalahan ini yang langsung menurunkan band:",
        items: [
          "❌ Kurang dari 150 kata (Task 1) atau 250 kata (Task 2) — PENALTY langsung",
          "❌ Copy paste kalimat dari soal ke esai tanpa paraphrase",
          "❌ Off-topic — tidak menjawab semua poin yang diminta",
          "❌ Tidak ada overview di Task 1",
          "❌ Menulis kesimpulan/opini di Task 1",
          "❌ Menggunakan bahasa informal: 'a lot of', 'I think', 'lots'",
        ],
        highlight: "Selalu hitung kata di akhir! Di bawah minimum = langsung penalti."
      },
      {
        type: "checklist",
        title: "Checklist Sebelum Submit",
        content: "Gunakan 2-3 menit terakhir untuk cek:",
        items: [
          "✅ Task 1 minimal 150 kata, Task 2 minimal 250 kata",
          "✅ Ada overview paragraph di Task 1",
          "✅ Thesis statement jelas di Task 2",
          "✅ Setiap body paragraph punya main idea yang berbeda",
          "✅ Grammar dasar sudah benar (subject-verb agreement, tense)",
          "✅ Menggunakan linking words yang bervariasi",
        ],
        highlight: "Siap tulis esai? Mulai practice dan dapatkan feedback AI! ✍️"
      }
    ]
  },
  speaking: {
    title: "IELTS Speaking",
    icon: "🗣️",
    duration: 15,
    practiceLink: "/speaking",
    steps: [
      {
        type: "intro",
        title: "Gambaran IELTS Speaking",
        content: "IELTS Speaking adalah wawancara tatap muka dengan examiner selama 11-14 menit, dibagi dalam 3 part. Ini satu-satunya section yang langsung dengan orang.",
        items: [
          "Part 1 (4-5 menit): Pertanyaan umum tentang dirimu, keluarga, hobby, pekerjaan",
          "Part 2 (3-4 menit): Long turn — bicara 2 menit tentang topik kartu (cue card)",
          "Part 3 (4-5 menit): Diskusi mendalam tentang topik yang sama dengan Part 2",
        ],
        highlight: "Speaking dinilai oleh examiner langsung — bukan komputer. Kepercayaan diri itu penting!"
      },
      {
        type: "strategy",
        title: "4 Kriteria Penilaian Speaking",
        content: "Pahami apa yang dinilai untuk menjawab dengan tepat sasaran:",
        items: [
          "Fluency & Coherence (25%): Bicara dengan lancar, tidak terlalu banyak pause, ide terorganisir",
          "Lexical Resource (25%): Kosakata yang bervariasi dan tepat, bisa menjelaskan saat tidak tahu kata",
          "Grammatical Range & Accuracy (25%): Variasi tense dan struktur, minim kesalahan",
          "Pronunciation (25%): Kejelasan pengucapan, intonasi, stress pada kata yang tepat",
        ],
        highlight: "Accent tidak dinilai! Yang dinilai adalah clarity dan intelligibility."
      },
      {
        type: "strategy",
        title: "Strategi Part 1: Elaborasi Jawaban",
        content: "Di Part 1, jangan jawab terlalu pendek — elaborasi dengan teknik AREA:",
        items: [
          "A - Answer: Jawab pertanyaan langsung",
          "R - Reason: Berikan alasan mengapa",
          "E - Example: Berikan contoh spesifik",
          "A - Add: Tambahkan info relevan atau balik pertanyaan",
          "Contoh: 'Do you like reading?' → 'Yes, I really enjoy reading, especially non-fiction books. I find them educational because they teach me real-world knowledge. For example, I recently finished a book about psychology that changed how I see human behavior.'",
        ],
        highlight: "Jawaban ideal 3-4 kalimat per pertanyaan — tidak terlalu pendek, tidak bertele-tele."
      },
      {
        type: "strategy",
        title: "Strategi Part 2: Long Turn (Cue Card)",
        content: "Part 2 kamu punya 1 menit persiapan sebelum bicara 2 menit:",
        items: [
          "Gunakan 1 menit persiapan dengan maksimal — tulis kata kunci, bukan kalimat lengkap",
          "Cover SEMUA bullet points di cue card — examiner mendengarkan ini",
          "Gunakan opener yang kuat: 'I'd like to talk about...' atau 'The [topic] that comes to mind is...'",
          "Gunakan contoh spesifik dan cerita personal — lebih engaging dan mudah dielaborasi",
          "Kalau hampir 2 menit tapi ide habis, simpulkan: 'Overall, this is why I believe...'",
        ],
        highlight: "2 menit terasa lama, tapi dengan persiapan dan contoh personal, mudah diisi!"
      },
      {
        type: "tip",
        title: "Tips Vocabulary: Paraphrase & Circumlocution",
        content: "Strategi ketika tidak tahu kata yang tepat dalam bahasa Inggris:",
        items: [
          "Circumlocution — jelaskan konsepnya: 'I don't know the exact word, but it's the thing that... / It's a device that...'",
          "Gunakan collocations alih-alih kata sendiri-sendiri: 'make a decision', 'take responsibility', 'pay attention'",
          "Upgrade vocabulary umum: good → excellent/outstanding, bad → detrimental/inadequate, big → substantial/considerable",
          "Gunakan idioms yang natural: 'on the other hand', 'to be honest', 'as far as I know'",
        ],
        highlight: "Examiner menghargai usaha untuk paraphrase daripada diam atau bilang 'I don't know'!"
      },
      {
        type: "tip",
        title: "Tips Fluency: Mengelola Pause",
        content: "Cara bicara lebih lancar dan natural:",
        items: [
          "Gunakan fillers akademik: 'That's an interesting question...', 'Let me think about that...'",
          "Hindari fillers buruk: 'eehhh', 'umm' berlebihan — pakai pause singkat yang natural",
          "Bicara sedikit lebih lambat dari biasanya — examiner perlu mengerti setiap kata",
          "Jika salah grammar, koreksi dirimu: 'I mean...', 'What I meant to say was...' — ini justru menunjukkan self-correction yang bagus",
        ],
        highlight: "Silence sebentar (1-2 detik) lebih baik dari 'umm...' yang panjang."
      },
      {
        type: "mistake",
        title: "Kesalahan Umum dalam Speaking",
        content: "Hindari kesalahan yang sering menurunkan band speaking:",
        items: [
          "❌ Jawaban terlalu pendek: 'Yes, I do.' — selalu elaborasi!",
          "❌ Menghafal jawaban — examiner tahu dan bisa mengubah pertanyaan",
          "❌ Bicara terlalu cepat karena nervous — clarity lebih penting dari speed",
          "❌ Selalu mulai dengan 'I think that...' — variasikan opener",
          "❌ Mengulang kata yang sama berkali-kali — gunakan sinonim",
        ],
        highlight: "Examiner ingin mendengar kamu berkomunikasi, bukan performing hafalan!"
      },
      {
        type: "checklist",
        title: "Persiapan Sebelum Speaking Test",
        content: "Checklist persiapan mental dan teknis:",
        items: [
          "✅ Tahu struktur Part 1, 2, 3",
          "✅ Siap elaborasi jawaban dengan AREA technique",
          "✅ Punya stok kata penghubung: furthermore, however, on the other hand",
          "✅ Siap gunakan 1 menit persiapan Part 2 dengan efektif",
          "✅ Tidak akan panik kalau salah — koreksi natural itu bagus",
        ],
        highlight: "Kepercayaan diri adalah kunci! Mulai practice sekarang 🗣️"
      }
    ]
  }
};

const STEP_ICONS: Record<string, React.ElementType> = {
  intro: BookOpen,
  tip: Lightbulb,
  strategy: Target,
  example: Star,
  mistake: AlertTriangle,
  checklist: CheckCircle2,
};

const STEP_COLORS: Record<string, string> = {
  intro: "bg-blue-50 border-blue-200 text-blue-700",
  tip: "bg-yellow-50 border-yellow-200 text-yellow-700",
  strategy: "bg-indigo-50 border-indigo-200 text-indigo-700",
  example: "bg-purple-50 border-purple-200 text-purple-700",
  mistake: "bg-red-50 border-red-200 text-red-700",
  checklist: "bg-green-50 border-green-200 text-green-700",
};

const STEP_BADGE: Record<string, string> = {
  intro: "Gambaran",
  tip: "Tips",
  strategy: "Strategi",
  example: "Contoh",
  mistake: "Hindari",
  checklist: "Checklist",
};

interface Props {
  section: Section;
}

export default function LearnClient({ section }: Props) {
  const lesson = LESSONS[section];
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const step = lesson.steps[currentStep];
  const Icon = STEP_ICONS[step.type] || Lightbulb;
  const totalSteps = lesson.steps.length;
  const isLast = currentStep === totalSteps - 1;
  const allDone = completedSteps.size === totalSteps;

  function goNext() {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (!isLast) setCurrentStep(p => p + 1);
  }

  function goPrev() {
    if (currentStep > 0) setCurrentStep(p => p - 1);
  }

  const SECTION_ICONS: Record<Section, React.ElementType> = {
    reading: BookOpen,
    listening: Headphones,
    writing: PenLine,
    speaking: Mic,
  };
  const SectionIcon = SECTION_ICONS[section];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <SectionIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Belajar: {lesson.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>~{lesson.duration} menit</span>
              <span>·</span>
              <span>{totalSteps} materi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Materi {currentStep + 1} dari {totalSteps}</span>
          <span>{completedSteps.size} selesai</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex gap-1 mt-2">
          {lesson.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={cn(
                "h-1.5 rounded-full flex-1 transition-all",
                i === currentStep ? "bg-indigo-500" :
                completedSteps.has(i) ? "bg-indigo-200" : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
        {/* Step type badge */}
        <div className={cn("px-5 py-3 border-b flex items-center gap-2", STEP_COLORS[step.type])}>
          <Icon className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">{STEP_BADGE[step.type]}</span>
        </div>

        <div className="p-5 md:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.content}</p>

          {step.items && (
            <ul className="space-y-2.5 mb-4">
              {step.items.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                  <span className="text-indigo-400 font-bold shrink-0 mt-0.5">
                    {step.type === "mistake" ? "" : `${i + 1}.`}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}

          {step.highlight && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium leading-relaxed">{step.highlight}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Sebelumnya
        </button>

        <div className="flex-1" />

        {isLast ? (
          <Link
            href={lesson.practiceLink}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
            onClick={() => setCompletedSteps(prev => new Set([...prev, currentStep]))}
          >
            <Play className="w-4 h-4" />
            Mulai Practice Test
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Lanjut <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick nav to all steps */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">Daftar Materi</p>
        <div className="grid grid-cols-1 gap-1">
          {lesson.steps.map((s, i) => {
            const StepIcon = STEP_ICONS[s.type] || Lightbulb;
            return (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors",
                  i === currentStep ? "bg-indigo-100 text-indigo-700 font-medium" :
                  completedSteps.has(i) ? "text-gray-500 hover:bg-gray-100" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <StepIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{s.title}</span>
                {completedSteps.has(i) && <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />}
                {i === currentStep && <ChevronRight className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Start test button if all completed */}
      {allDone && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-green-800 mb-3">Semua materi selesai! 🎉</p>
          <Link
            href={lesson.practiceLink}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" /> Mulai Practice Test
          </Link>
        </div>
      )}
    </div>
  );
}
