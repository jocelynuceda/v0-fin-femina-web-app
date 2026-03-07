'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ============ TYPES ============
type Tab = 'inicio' | 'aprende' | 'tracker' | 'comparar' | 'logros'
type Mode = 'claro' | 'cercano'
type CategoryFilter = 'todos' | 'dinero' | 'tarjetas' | 'errores' | 'invertir'
type PeriodFilter = 'semana' | 'mes' | 'semestre' | 'año'
type CompareTab = 'tarjetas' | 'cuentas'
type CompareSubTab = 'credito' | 'debito' | 'ahorro' | 'sueldo' | 'cts'
type CreditLevel = 'basico' | 'intermedio' | 'premium' | 'exclusivo'
type ChartType = 'barras' | 'circular' | 'tendencia' | 'arbol'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Transaction {
  id: number
  type: 'gasto' | 'ingreso'
  category: string
  description: string
  amount: number
  date: string
}

interface QuizState {
  isOpen: boolean
  videoId: number | null
  answered: boolean
  selectedAnswer: number | null
  correctAnswer: number
}

// ============ DATA ============
const CATEGORIES = {
  alimentacion: { emoji: '🍽️', color: 'peach', name: 'Alimentación' },
  transporte: { emoji: '🚌', color: 'sky', name: 'Transporte' },
  educacion: { emoji: '📚', color: 'lilac', name: 'Educación' },
  ocio: { emoji: '🎬', color: 'sage', name: 'Ocio' },
  vivienda: { emoji: '🏠', color: 'rose', name: 'Vivienda' },
  otros: { emoji: '📦', color: 'ink', name: 'Otros' },
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, type: 'ingreso', category: 'otros', description: 'Sueldo mensual', amount: 1550, date: '2024-01-01' },
  { id: 2, type: 'gasto', category: 'alimentacion', description: 'Supermercado Wong', amount: 180, date: '2024-01-02' },
  { id: 3, type: 'gasto', category: 'transporte', description: 'Recarga Metropolitano', amount: 50, date: '2024-01-03' },
  { id: 4, type: 'gasto', category: 'educacion', description: 'Curso de inglés', amount: 200, date: '2024-01-04' },
  { id: 5, type: 'gasto', category: 'ocio', description: 'Netflix', amount: 45, date: '2024-01-05' },
  { id: 6, type: 'gasto', category: 'vivienda', description: 'Luz y agua', amount: 150, date: '2024-01-06' },
  { id: 7, type: 'gasto', category: 'alimentacion', description: 'Almuerzo trabajo', amount: 199, date: '2024-01-07' },
]

const VIDEOS = [
  { id: 1, category: 'dinero', emoji: '🏦', title: '¿Qué es una cuenta de ahorros?', duration: '45s', tip: 'Una cuenta de ahorros te permite guardar dinero y ganar intereses.' },
  { id: 2, category: 'dinero', emoji: '📋', title: 'Cómo hacer tu primer presupuesto', duration: '1:20', tip: 'El 50-30-20: 50% necesidades, 30% deseos, 20% ahorro.' },
  { id: 3, category: 'tarjetas', emoji: '📊', title: '¿Cómo funciona la tasa de interés?', duration: '55s', tip: 'La TEA (Tasa Efectiva Anual) te muestra el costo real del crédito.' },
  { id: 4, category: 'tarjetas', emoji: '💳', title: 'Tarjetas de débito vs crédito', duration: '1:10', tip: 'Débito usa tu dinero, crédito es un préstamo del banco.' },
  { id: 5, category: 'errores', emoji: '⚠️', title: '¿Qué es el sobreendeudamiento?', duration: '50s', tip: 'Nunca destines más del 30% de tus ingresos a pagar deudas.' },
  { id: 6, category: 'errores', emoji: '🚨', title: 'Peligros de los préstamos informales', duration: '1:05', tip: 'Los prestamistas informales cobran hasta 300% de interés anual.' },
  { id: 7, category: 'invertir', emoji: '📈', title: '¿Qué son los fondos mutuos?', duration: '1:30', tip: 'Un fondo mutuo agrupa el dinero de muchos inversionistas.' },
  { id: 8, category: 'invertir', emoji: '🌐', title: 'ETFs para principiantes', duration: '1:45', tip: 'Los ETFs son fondos que se negocian como acciones en bolsa.' },
]

const QUIZ_QUESTIONS: Record<number, { question: string; answers: string[]; correct: number }> = {
  1: { question: '¿Cuál es la principal ventaja de una cuenta de ahorros?', answers: ['No paga impuestos', 'Genera intereses sobre tu dinero', 'Te dan una tarjeta de crédito gratis', 'Puedes gastar más de lo que tienes'], correct: 1 },
  2: { question: 'En la regla 50-30-20, ¿cuánto se destina al ahorro?', answers: ['50%', '30%', '20%', '10%'], correct: 2 },
  3: { question: '¿Qué significa TEA?', answers: ['Tipo de Encuesta Anual', 'Tasa Efectiva Anual', 'Tarifa Extra Aplicable', 'Total de Euros Acumulados'], correct: 1 },
  4: { question: '¿Cuál es la diferencia principal entre débito y crédito?', answers: ['El color de la tarjeta', 'El tamaño del plástico', 'Débito usa tu dinero, crédito es préstamo', 'No hay diferencia'], correct: 2 },
  5: { question: '¿Cuánto de tus ingresos máximo deberías destinar a deudas?', answers: ['50%', '40%', '30%', '60%'], correct: 2 },
  6: { question: '¿Por qué son peligrosos los préstamos informales?', answers: ['Son muy baratos', 'Cobran intereses muy altos', 'Te dan mucho tiempo para pagar', 'Son regulados por la SBS'], correct: 1 },
  7: { question: '¿Qué es un fondo mutuo?', answers: ['Una cuenta bancaria especial', 'Dinero de muchos inversionistas juntos', 'Un préstamo grupal', 'Una tarjeta de crédito'], correct: 1 },
  8: { question: '¿Cómo se negocian los ETFs?', answers: ['Solo en el banco', 'Como acciones en bolsa', 'Por correo', 'Solo los fines de semana'], correct: 1 },
}

const LEVELS = [
  { id: 1, name: 'Aprendiz financiera', emoji: '🌱', color: 'sage', points: 0 },
  { id: 2, name: 'Organizadora de dinero', emoji: '💸', color: 'sky', points: 500 },
  { id: 3, name: 'Mujer financiera', emoji: '📊', color: 'lilac', points: 1500 },
  { id: 4, name: 'Inversionista principiante', emoji: '📈', color: 'peach', points: 3000 },
  { id: 5, name: 'Líder financiera', emoji: '👑', color: 'rose', points: 5000 },
]

const BADGES = [
  { id: 1, emoji: '🏦', name: 'Primera cuenta entendida', earned: true },
  { id: 2, emoji: '💳', name: 'Experta en tarjetas', earned: true },
  { id: 3, emoji: '📊', name: '7 días registrando gastos', earned: true },
  { id: 4, emoji: '📉', name: 'Cazadora de intereses altos', earned: false },
  { id: 5, emoji: '💰', name: 'Primera meta cumplida', earned: false },
  { id: 6, emoji: '🎓', name: '5 videos completados', earned: false },
  { id: 7, emoji: '🌟', name: 'Primera inversión', earned: false },
  { id: 8, emoji: '🛂', name: 'Pasaporte financiero', earned: false },
]

// Real Peruvian Bank Credit Card Data 2024
const CREDIT_CARDS_BY_LEVEL = {
  basico: [
    { bank: 'BCP', bankColor: '#0033A0', product: 'Visa Clásica', tea: '79.9%', fee: 'S/ 0 primer año', benefit: 'Puntos Bonus + seguros básicos', score: 72 },
    { bank: 'Interbank', bankColor: '#00A859', product: 'Visa Clásica', tea: '79.9%', fee: 'S/ 0 primer año', benefit: 'LifeMiles básicos + Yape', score: 78 },
    { bank: 'BBVA', bankColor: '#004A97', product: 'Visa Clásica', tea: '74.99%', fee: 'S/ 0 primer año', benefit: 'Cashback básico 0.3%', score: 75 },
    { bank: 'Scotiabank', bankColor: '#EC111A', product: 'Visa Clásica', tea: '72.5%', fee: 'S/ 55/año', benefit: 'Red de descuentos Scotia', score: 70 },
    { bank: 'BanBif', bankColor: '#E31937', product: 'Visa Clásica', tea: '78%', fee: 'S/ 0', benefit: 'Ideal para jóvenes', score: 74 },
    { bank: 'Ripley', bankColor: '#E4002B', product: 'Visa', tea: '79.9%', fee: 'S/ 0', benefit: 'Descuentos Ripley/Oechsle', score: 68 },
    { bank: 'Falabella', bankColor: '#CCFF00', product: 'CMR Visa', tea: '79.9%', fee: 'S/ 0', benefit: 'Cashback tiendas asociadas', score: 67 },
  ],
  intermedio: [
    { bank: 'BCP', bankColor: '#0033A0', product: 'Visa Gold', tea: '69.9%', fee: 'S/ 99/año', benefit: 'Puntos Bonus 2x + seguro viaje', score: 80 },
    { bank: 'Interbank', bankColor: '#00A859', product: 'Gold Visa', tea: '69.9%', fee: 'S/ 0 primer año', benefit: 'LifeMiles 2x + descuentos restaurantes', score: 85 },
    { bank: 'BBVA', bankColor: '#004A97', product: 'Gold Visa', tea: '69.99%', fee: 'S/ 99/año', benefit: 'Cashback 0.5% + viajes', score: 78 },
    { bank: 'Scotiabank', bankColor: '#EC111A', product: 'Gold', tea: '67.9%', fee: 'S/ 99/año', benefit: 'Scotia Rewards 2x', score: 76 },
  ],
  premium: [
    { bank: 'BCP', bankColor: '#0033A0', product: 'Visa Platinum', tea: '64.9%', fee: 'S/ 0', benefit: 'Puntos 3x + sala VIP LATAM', score: 88 },
    { bank: 'Interbank', bankColor: '#00A859', product: 'Visa Platinum', tea: '64.9%', fee: 'S/ 0 primer año', benefit: 'LifeMiles 3x + Priority Pass', score: 91 },
    { bank: 'BBVA', bankColor: '#004A97', product: 'Visa Signature', tea: '64.99%', fee: 'S/ 149/año', benefit: 'Millas 3x + travel insurance', score: 84 },
    { bank: 'Scotiabank', bankColor: '#EC111A', product: 'Platinum', tea: '62.5%', fee: 'S/ 149/año', benefit: 'Scotia Rewards 3x + concierge', score: 82 },
    { bank: 'Amex', bankColor: '#006FCF', product: 'Gold (BCP)', tea: '64.9%', fee: 'S/ 299/año', benefit: 'Membership Rewards premium', score: 80 },
  ],
  exclusivo: [
    { bank: 'BCP', bankColor: '#0033A0', product: 'Visa Infinite', tea: '54.9%', fee: 'S/ 599/año', benefit: 'Puntos 5x + concierge 24/7 + VIP ilimitado', score: 95 },
    { bank: 'Interbank', bankColor: '#00A859', product: 'Visa Infinite', tea: '54.9%', fee: 'Negociable', benefit: 'LifeMiles 5x + Priority Pass ilimitado', score: 94 },
    { bank: 'BBVA', bankColor: '#004A97', product: 'Visa Infinite', tea: '54.99%', fee: 'S/ 499/año', benefit: 'Millas 5x + seguro médico internacional', score: 92 },
    { bank: 'Amex', bankColor: '#006FCF', product: 'Platinum (BCP)', tea: '54.9%', fee: 'S/ 1,299/año', benefit: 'Centurion lounge + Fine Hotels', score: 90 },
  ],
}

// Real Peruvian Savings Account Data 2024
const SAVINGS_ACCOUNTS = {
  ahorro: [
    { bank: 'Financiera Oh!', bankColor: '#FF6B00', product: 'Cuenta Naranja', tea: '5.5%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'Mayor tasa del mercado', rank: 1 },
    { bank: 'Caja Arequipa', bankColor: '#D72323', product: 'Ahorro', tea: '5.0%', fee: 'S/ 0', minBalance: 'S/ 50', benefit: 'Garantía FENACREP', rank: 2 },
    { bank: 'Interbank', bankColor: '#00A859', product: 'Cuenta Naranja', tea: '4.5%', fee: 'S/ 0', minBalance: 'S/ 1', benefit: 'Yape gratis + sin costo', rank: 3 },
    { bank: 'BanBif', bankColor: '#E31937', product: 'Ahorro', tea: '2.5%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'Buena tasa saldos medios', rank: 4 },
    { bank: 'BBVA', bankColor: '#004A97', product: 'Cuenta Ahorro', tea: '2.1%', fee: 'S/ 0 c/sueldo', minBalance: 'Sin mínimo', benefit: 'App BBVA móvil', rank: 5 },
    { bank: 'Scotiabank', bankColor: '#EC111A', product: 'Ahorro Soles', tea: '1.8%', fee: 'S/ 0 c/sueldo', minBalance: 'Sin mínimo', benefit: 'Transferencias gratis', rank: 6 },
    { bank: 'BCP', bankColor: '#0033A0', product: 'Cuenta Ahorros', tea: '0.5%', fee: 'S/ 0 c/sueldo', minBalance: 'Sin mínimo', benefit: 'Red más grande +8,000 ATMs', rank: 7 },
  ],
  sueldo: [
    { bank: 'BCP', bankColor: '#0033A0', product: 'CuentaSueldo', tea: '0.5%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'Yape + red más grande', rank: 1 },
    { bank: 'Interbank', bankColor: '#00A859', product: 'Cuenta Sueldo', tea: '1.2%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'LifeMiles por compras', rank: 2 },
    { bank: 'BBVA', bankColor: '#004A97', product: 'Cuenta Haberes', tea: '0.8%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'Tasas preferenciales préstamos', rank: 3 },
    { bank: 'Scotiabank', bankColor: '#EC111A', product: 'Cuenta Sueldo', tea: '0.7%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'Descuentos red Scotia', rank: 4 },
    { bank: 'BanBif', bankColor: '#E31937', product: 'Cuenta Sueldo', tea: '1.0%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'Buena tasa ahorros vinculados', rank: 5 },
  ],
  cts: [
    { bank: 'Interbank', bankColor: '#00A859', product: 'CTS', tea: '6.5%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'Mejor tasa CTS del mercado', rank: 1 },
    { bank: 'BCP', bankColor: '#0033A0', product: 'CTS', tea: '5.8%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'Facilidad retiro parcial', rank: 2 },
    { bank: 'BBVA', bankColor: '#004A97', product: 'CTS', tea: '5.5%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'App gestión completa', rank: 3 },
    { bank: 'Scotiabank', bankColor: '#EC111A', product: 'CTS', tea: '5.2%', fee: 'S/ 0', minBalance: 'Sin mínimo', benefit: 'Beneficios adicionales', rank: 4 },
  ],
}

const RECOMMENDED_PACKAGES = [
  {
    id: 1,
    emoji: '🌱',
    name: 'El Kit Starter',
    products: [
      { bank: 'BCP', product: 'CuentaSueldo', type: 'Sueldo' },
      { bank: 'Financiera Oh!', product: 'Cuenta Naranja', type: 'Ahorro' },
      { bank: 'Interbank', product: 'Visa Clásica', type: 'Crédito' },
    ],
    why: 'Cero costos fijos, máximo rendimiento en ahorro, y empiezas a construir tu historial crediticio.',
  },
  {
    id: 2,
    emoji: '💜',
    name: 'El Kit Inteligente',
    products: [
      { bank: 'Interbank', product: 'Cuenta Sueldo', type: 'Sueldo' },
      { bank: 'BanBif', product: 'Cuenta Ahorro', type: 'Ahorro' },
      { bank: 'BBVA', product: 'Gold Visa', type: 'Crédito' },
    ],
    why: 'Ganar millas por tus compras diarias mientras ahorras con buena tasa.',
  },
  {
    id: 3,
    emoji: '👑',
    name: 'El Kit Premium',
    products: [
      { bank: 'BBVA', product: 'Cuenta Haberes + Ahorro', type: 'Integrado' },
      { bank: 'Interbank', product: 'Visa Platinum', type: 'Crédito' },
    ],
    why: 'Experiencia integrada en un solo banco con los mejores beneficios de viaje.',
  },
]

// ============ COLOR HELPERS ============
const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; light: string; border: string; hex: string }> = {
    rose: { bg: 'bg-[#D63F74]', text: 'text-[#D63F74]', light: 'bg-[#FDE8F0]', border: 'border-[#D63F74]', hex: '#D63F74' },
    lilac: { bg: 'bg-[#9B72CF]', text: 'text-[#9B72CF]', light: 'bg-[#F0E8FD]', border: 'border-[#9B72CF]', hex: '#9B72CF' },
    peach: { bg: 'bg-[#F4A261]', text: 'text-[#F4A261]', light: 'bg-[#FEF0E4]', border: 'border-[#F4A261]', hex: '#F4A261' },
    sage: { bg: 'bg-[#2DBD96]', text: 'text-[#2DBD96]', light: 'bg-[#E4F7F1]', border: 'border-[#2DBD96]', hex: '#2DBD96' },
    sky: { bg: 'bg-[#5B9BD5]', text: 'text-[#5B9BD5]', light: 'bg-[#EAF3FB]', border: 'border-[#5B9BD5]', hex: '#5B9BD5' },
    ink: { bg: 'bg-[#6B3F5E]', text: 'text-[#6B3F5E]', light: 'bg-[#F0E8FD]', border: 'border-[#6B3F5E]', hex: '#6B3F5E' },
  }
  return colors[color] || colors.rose
}

// ============ COMPONENTS ============

// Logo Component
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm gradient-signature">
        💜
      </div>
      <span className="font-serif text-[22px] font-black">
        <span className="text-[#1C0E1A]">Fin</span>
        <span className="gradient-signature-text">Fémina</span>
      </span>
    </div>
  )
}

// Navigation Component
function Navigation({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'inicio', label: 'Inicio', emoji: '✨' },
    { id: 'aprende', label: 'Aprende', emoji: '🎓' },
    { id: 'tracker', label: 'Tracker', emoji: '📊' },
    { id: 'comparar', label: 'Comparar', emoji: '🏦' },
    { id: 'logros', label: 'Logros', emoji: '🏆' },
  ]

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-[68px] transition-all duration-300 ${scrolled ? 'glass-nav' : 'bg-[#FDFAF8]/50'}`}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Logo />
        
        {/* Desktop Tabs */}
        <div className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-[#FDE8F0]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-[#D63F74] shadow-md'
                  : 'text-[#6B3F5E] hover:text-[#D63F74]'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <button className="hidden md:flex btn-gradient px-5 py-2.5 text-sm">
          Comenzar gratis 💜
        </button>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-[#1C0E1A]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[68px] left-0 right-0 bg-white shadow-lg border-t border-[#EDD9EA] p-4">
          <div className="flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-4 py-3 rounded-xl text-left font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#FDE8F0] text-[#D63F74]'
                    : 'text-[#1C0E1A] hover:bg-[#FDFAF8]'
                }`}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
            <button className="btn-gradient px-5 py-3 mt-2 text-sm">
              Comenzar gratis 💜
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

// Background Blobs
function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute -top-32 -right-32 w-[600px] h-[600px] opacity-35 animate-blob"
        style={{ background: 'linear-gradient(135deg, #FDE8F0 0%, #F2789F 100%)' }}
      />
      <div 
        className="absolute bottom-20 -left-40 w-[500px] h-[500px] opacity-35 animate-blob animation-delay-200"
        style={{ background: 'linear-gradient(135deg, #F0E8FD 0%, #C4A8E8 100%)' }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-30 animate-blob animation-delay-400"
        style={{ background: 'linear-gradient(135deg, #FEF0E4 0%, #F4A261 100%)' }}
      />
    </div>
  )
}

// ============ INICIO PAGE ============
function InicioPage() {
  const [mode, setMode] = useState<Mode>('claro')

  const modeContent = {
    claro: {
      title: 'Interés Compuesto',
      text: 'El interés compuesto es cuando los intereses que ganas se suman a tu capital inicial, y luego también generan intereses. Es la forma más eficiente de hacer crecer tu dinero a largo plazo.',
    },
    cercano: {
      title: 'Interés Compuesto',
      text: 'Bestie, imagina que tu dinero tiene bebés, y esos bebés también tienen bebés. Así funciona el interés compuesto: tu plata crece solita mientras tú te tomas un café. Es como magia financiera.',
    },
  }

  return (
    <div className="min-h-screen pt-[68px]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="animate-fadeUp">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0E8FD] text-sm font-bold mb-6 gradient-signature-text">
            💜 Tu dinero. Tu poder. Tu futuro.
          </div>

          {/* Hero Heading */}
          <h1 className="font-serif text-5xl md:text-7xl lg:text-[88px] font-black leading-[1.05] mb-6">
            <span className="text-[#1C0E1A]">Toma el control</span>
            <br />
            <span className="gradient-signature-text italic">de tu dinero.</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-[19px] text-[#6B3F5E] max-w-xl mb-8 leading-relaxed">
            La plataforma financiera diseñada para mujeres como tú. Sin tecnicismos. Sin letra chica. Con todo el poder que mereces.
          </p>

          {/* Mode Toggle */}
          <div className="mb-6">
            <div className="inline-flex p-1.5 rounded-full bg-[#FDE8F0]">
              <button
                onClick={() => setMode('claro')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  mode === 'claro' ? 'bg-white text-[#D63F74] shadow-md' : 'text-[#6B3F5E]'
                }`}
              >
                📚 Modo Claro
              </button>
              <button
                onClick={() => setMode('cercano')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  mode === 'cercano' ? 'bg-white text-[#D63F74] shadow-md' : 'text-[#6B3F5E]'
                }`}
              >
                💅 Modo Cercano
              </button>
            </div>
          </div>

          {/* Demo Card */}
          <div className="p-6 rounded-[28px] gradient-pastel mb-8 max-w-xl animate-fadeUp border border-[#EDD9EA]">
            <h3 className="font-serif text-xl font-bold text-[#1C0E1A] mb-2">{modeContent[mode].title}</h3>
            <p className="text-[#1C0E1A] leading-relaxed">{modeContent[mode].text}</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-16">
            <button className="btn-gradient px-8 py-4 text-lg">
              Empezar gratis ✨
            </button>
            <button className="px-8 py-4 rounded-2xl border-2 border-[#D63F74] text-[#D63F74] font-extrabold hover:bg-[#FDE8F0] transition-all">
              Ver demo →
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeUp animation-delay-200">
            {[
              { number: '2.3M', emoji: '👩', text: 'Mujeres peruanas 18–28' },
              { number: '73%', emoji: '🚫', text: 'Sin acceso a crédito formal' },
              { number: '90', emoji: '🛂', text: 'Días para tu Pasaporte' },
            ].map((stat, i) => (
              <div key={i} className="card-finfemina p-6 text-center">
                <div className="font-serif text-4xl font-black gradient-signature-text mb-1">{stat.number}</div>
                <div className="text-2xl mb-2">{stat.emoji}</div>
                <div className="text-sm text-[#6B3F5E]">{stat.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why FinFémina Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl md:text-4xl font-black text-center mb-12 text-[#1C0E1A]">
          ¿Por qué <span className="gradient-signature-text">FinFémina</span>?
        </h2>
        <div className="flex flex-col gap-6">
          {[
            { emoji: '💜', title: 'Tu historial empieza hoy', desc: 'AI scoring alternativo que construye tu perfil crediticio desde cero.', bg: 'bg-[#FDE8F0]' },
            { emoji: '📊', title: 'Entiende tu dinero de verdad', desc: 'Tracker visual con gráficos que tú eliges: barras, dona, líneas.', bg: 'bg-[#F0E8FD]' },
            { emoji: '🛂', title: 'Tu Pasaporte Financiero', desc: 'Credencial verificable que puedes compartir con bancos en 90 días.', bg: 'bg-[#FDE8F0]' },
          ].map((item, i) => (
            <div key={i} className={`card-finfemina p-6 flex items-center gap-6 ${item.bg}`}>
              <div className="w-20 h-20 rounded-2xl gradient-signature flex items-center justify-center text-4xl shrink-0">
                {item.emoji}
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1C0E1A] mb-1">{item.title}</h3>
                <p className="text-[#6B3F5E]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl md:text-4xl font-black text-center mb-12 text-[#1C0E1A]">
          Todo lo que necesitas para <span className="gradient-signature-text">crecer</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { emoji: '🎬', title: 'Microvideos', desc: 'Aprende finanzas en menos de 2 minutos con videos cortos y divertidos.', color: 'rose' },
            { emoji: '📊', title: 'Tracker personal', desc: 'Registra tus ingresos y gastos para entender a dónde va tu dinero.', color: 'sky' },
            { emoji: '🏦', title: 'Comparador', desc: 'Encuentra las mejores tarjetas y cuentas según tu perfil.', color: 'lilac' },
            { emoji: '🤖', title: 'Asistente IA', desc: 'Resuelve tus dudas financieras con nuestra asistente 24/7.', color: 'sage' },
            { emoji: '🎯', title: 'Metas de ahorro', desc: 'Define objetivos y sigue tu progreso para alcanzarlos.', color: 'peach' },
            { emoji: '🏆', title: 'Gamificación', desc: 'Gana puntos, sube de nivel y desbloquea insignias.', color: 'lilac' },
          ].map((feature, i) => {
            const colors = getColorClasses(feature.color)
            return (
              <div key={i} className="card-finfemina p-6 animate-fadeUp" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`w-14 h-14 rounded-2xl ${colors.light} flex items-center justify-center text-2xl mb-4`}>
                  {feature.emoji}
                </div>
                <h3 className="font-bold text-lg text-[#1C0E1A] mb-2">{feature.title}</h3>
                <p className="text-[#6B3F5E] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Levels Timeline */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl md:text-4xl font-black text-center mb-12 text-[#1C0E1A]">
          Tu camino al <span className="gradient-signature-text">éxito financiero</span>
        </h2>
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center gap-4 min-w-max px-4">
            {LEVELS.map((level, i) => {
              const colors = getColorClasses(level.color)
              return (
                <div key={level.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-[72px] h-[72px] rounded-full ${colors.light} ${colors.border} border-[3px] flex items-center justify-center text-3xl animate-pulse-soft`}>
                      {level.emoji}
                    </div>
                    <div className="mt-3 text-center">
                      <div className="font-bold text-[#1C0E1A] text-sm">{level.name}</div>
                      <div className={`text-xs ${colors.text} font-bold`}>{level.points}+ pts</div>
                    </div>
                  </div>
                  {i < LEVELS.length - 1 && (
                    <div className="w-16 h-1 mx-2 rounded-full gradient-signature" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div 
          className="rounded-[28px] p-8 md:p-12 relative overflow-hidden gradient-signature"
        >
          <div className="absolute top-4 right-8 text-6xl animate-float">🛂</div>
          <h2 className="font-serif text-3xl md:text-4xl font-black text-white mb-4 max-w-lg italic">
            &ldquo;No pedimos que el banco te crea. Te damos las herramientas para demostrarlo.&rdquo;
          </h2>
          <p className="text-white/90 mb-6 max-w-md">
            Completa los módulos, gana puntos y demuestra que estás lista para el mundo financiero.
          </p>
          <button className="px-8 py-4 rounded-2xl bg-white text-[#D63F74] font-extrabold hover:shadow-lg transition-all">
            Comenzar mi pasaporte 🚀
          </button>
        </div>
      </section>
    </div>
  )
}

// ============ APRENDE PAGE ============
function AprendePage({ points, setPoints }: { points: number; setPoints: (p: number) => void }) {
  const [filter, setFilter] = useState<CategoryFilter>('todos')
  const [quiz, setQuiz] = useState<QuizState>({ isOpen: false, videoId: null, answered: false, selectedAnswer: null, correctAnswer: 0 })
  const [streak, setStreak] = useState(5)
  const weekDays = [true, true, true, true, true, false, false]

  const filteredVideos = filter === 'todos' ? VIDEOS : VIDEOS.filter(v => v.category === filter)

  const categoryColors: Record<string, string> = {
    dinero: 'sage',
    tarjetas: 'lilac',
    errores: 'peach',
    invertir: 'sky',
  }

  const openQuiz = (videoId: number) => {
    const q = QUIZ_QUESTIONS[videoId]
    setQuiz({ isOpen: true, videoId, answered: false, selectedAnswer: null, correctAnswer: q.correct })
  }

  const answerQuiz = (answerIndex: number) => {
    setQuiz(prev => ({ ...prev, answered: true, selectedAnswer: answerIndex }))
    if (answerIndex === quiz.correctAnswer) {
      setPoints(points + 50)
      setStreak(s => s + 1)
    }
  }

  const closeQuiz = () => {
    setQuiz({ isOpen: false, videoId: null, answered: false, selectedAnswer: null, correctAnswer: 0 })
  }

  return (
    <div className="min-h-screen pt-[68px]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl font-black text-[#1C0E1A]">Aprende</h1>
            <p className="text-[#6B3F5E]">Microvideos financieros de menos de 2 minutos</p>
          </div>
          
          {/* Streak Card */}
          <div className="card-finfemina px-6 py-4 flex items-center gap-4">
            <div className="text-3xl">🔥</div>
            <div>
              <div className="font-serif text-2xl font-black gradient-signature-text">{streak} días</div>
              <div className="flex gap-1 mt-1">
                {weekDays.map((completed, i) => (
                  <div 
                    key={i} 
                    className={`w-3 h-3 rounded-full ${completed ? 'gradient-signature' : 'bg-[#EDD9EA]'}`}
                  />
                ))}
              </div>
            </div>
            <div className="border-l border-[#EDD9EA] pl-4 ml-2">
              <div className="text-xs text-[#6B3F5E]">Puntos</div>
              <div className="font-serif text-xl font-black gradient-signature-text">{points}</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'todos', label: 'Todos', emoji: '' },
            { id: 'dinero', label: 'Dinero básico', emoji: '💰' },
            { id: 'tarjetas', label: 'Tarjetas', emoji: '💳' },
            { id: 'errores', label: 'Evitar errores', emoji: '⚠️' },
            { id: 'invertir', label: 'Invertir', emoji: '📈' },
          ].map((tab) => {
            const isActive = filter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as CategoryFilter)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isActive 
                    ? 'gradient-signature text-white' 
                    : 'bg-white border-2 border-[#EDD9EA] text-[#6B3F5E] hover:border-[#D63F74]'
                }`}
              >
                {tab.emoji} {tab.label}
              </button>
            )
          })}
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video, i) => {
            const color = categoryColors[video.category]
            const colors = getColorClasses(color)
            return (
              <div key={video.id} className="card-finfemina overflow-hidden animate-fadeUp" style={{ animationDelay: `${i * 50}ms` }}>
                {/* Thumbnail */}
                <div className={`h-[150px] ${colors.light} flex items-center justify-center relative`}>
                  <span className="text-5xl">{video.emoji}</span>
                  <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-full bg-white text-xs font-bold ${colors.text}`}>
                    ▶ {video.duration}
                  </div>
                </div>
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-[#1C0E1A] mb-3">{video.title}</h3>
                  <div className={`p-3 rounded-xl ${colors.light} border ${colors.border} mb-3`}>
                    <div className="flex items-start gap-2 text-sm">
                      <span>💡</span>
                      <span className="text-[#1C0E1A]">{video.tip}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openQuiz(video.id)}
                    className="w-full py-2 rounded-xl border-2 border-[#D63F74] text-[#D63F74] font-bold text-sm hover:bg-[#FDE8F0] transition-all"
                  >
                    📝 Hacer quiz • +50 pts
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quiz Modal */}
      {quiz.isOpen && quiz.videoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-finfemina p-6 max-w-md w-full animate-fadeUp">
            <div className="text-center mb-6">
              <span className="text-5xl mb-4 block">{VIDEOS.find(v => v.id === quiz.videoId)?.emoji}</span>
              <h3 className="font-serif text-xl font-bold text-[#1C0E1A]">
                {QUIZ_QUESTIONS[quiz.videoId].question}
              </h3>
            </div>
            <div className="flex flex-col gap-3 mb-6">
              {QUIZ_QUESTIONS[quiz.videoId].answers.map((answer, i) => {
                let buttonClass = 'p-4 rounded-xl border-2 text-left font-medium transition-all '
                if (quiz.answered) {
                  if (i === quiz.correctAnswer) {
                    buttonClass += 'bg-[#E4F7F1] border-[#2DBD96] text-[#2DBD96]'
                  } else if (i === quiz.selectedAnswer) {
                    buttonClass += 'bg-[#FDE8F0] border-[#D63F74] text-[#D63F74]'
                  } else {
                    buttonClass += 'border-[#EDD9EA] text-[#B08DA8]'
                  }
                } else {
                  buttonClass += 'border-[#EDD9EA] text-[#1C0E1A] hover:border-[#9B72CF] hover:bg-[#F0E8FD]'
                }
                return (
                  <button
                    key={i}
                    onClick={() => !quiz.answered && answerQuiz(i)}
                    disabled={quiz.answered}
                    className={buttonClass}
                  >
                    {answer}
                    {quiz.answered && i === quiz.correctAnswer && ' ✓'}
                  </button>
                )
              })}
            </div>
            {quiz.answered && (
              <div className="text-center mb-4">
                {quiz.selectedAnswer === quiz.correctAnswer ? (
                  <div className="text-[#2DBD96] font-bold text-lg">¡Correcto! +50 pts 🎉</div>
                ) : (
                  <div className="text-[#D63F74] font-medium">Respuesta incorrecta, ¡sigue intentando!</div>
                )}
              </div>
            )}
            <button onClick={closeQuiz} className="btn-gradient w-full py-3">
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ TRACKER PAGE ============
function TrackerPage() {
  const [period, setPeriod] = useState<PeriodFilter>('mes')
  const [chartType, setChartType] = useState<ChartType>('barras')
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS)
  const [newTransaction, setNewTransaction] = useState({ type: 'gasto' as 'gasto' | 'ingreso', category: 'alimentacion', description: '', amount: '' })
  const [chartAnimating, setChartAnimating] = useState(false)

  const ingresos = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0)
  const gastos = transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0)
  const ahorro = ingresos - gastos
  const tasaAhorro = ingresos > 0 ? Math.round((ahorro / ingresos) * 100) : 0

  const gastosPorCategoria = Object.entries(CATEGORIES).map(([key, cat]) => {
    const total = transactions.filter(t => t.type === 'gasto' && t.category === key).reduce((sum, t) => sum + t.amount, 0)
    return { key, ...cat, total }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const maxGasto = Math.max(...gastosPorCategoria.map(c => c.total), 1)
  const totalGastos = gastosPorCategoria.reduce((sum, c) => sum + c.total, 0)

  const addTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) return
    const transaction: Transaction = {
      id: Date.now(),
      type: newTransaction.type,
      category: newTransaction.category,
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      date: new Date().toISOString().split('T')[0],
    }
    setTransactions([transaction, ...transactions])
    setNewTransaction({ ...newTransaction, description: '', amount: '' })
  }

  const switchChart = (type: ChartType) => {
    if (type === chartType) return
    setChartAnimating(true)
    setTimeout(() => {
      setChartType(type)
      setChartAnimating(false)
    }, 150)
  }

  // Trend data for line chart
  const trendData = [
    { day: 'Lun', amount: 45 },
    { day: 'Mar', amount: 120 },
    { day: 'Mié', amount: 80 },
    { day: 'Jue', amount: 200 },
    { day: 'Vie', amount: 150 },
    { day: 'Sáb', amount: 90 },
    { day: 'Dom', amount: 139 },
  ]
  const maxTrend = Math.max(...trendData.map(d => d.amount))

  // Goals
  const goals = [
    { id: 1, emoji: '🎯', name: 'Fondo de emergencia', current: 1450, target: 3000, months: 6 },
    { id: 2, emoji: '✈️', name: 'Viaje a Cusco', current: 800, target: 2000, months: 8 },
  ]

  return (
    <div className="min-h-screen pt-[68px]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl font-black text-[#1C0E1A]">Tracker Personal</h1>
            <p className="text-[#6B3F5E]">Hola, Valeria 👋 • Controla tus finanzas y alcanza tus metas</p>
          </div>
          <div className="flex gap-2 p-1.5 rounded-full bg-[#FDE8F0]">
            {(['semana', 'mes', 'semestre', 'año'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${
                  period === p ? 'bg-white text-[#D63F74] shadow-md' : 'text-[#6B3F5E]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Ingresos', value: ingresos, emoji: '📥', color: 'sage' },
            { label: 'Gastos', value: gastos, emoji: '📤', color: 'rose' },
            { label: 'Ahorro', value: ahorro, emoji: '💰', color: 'peach' },
            { label: 'Tasa ahorro', value: `${tasaAhorro}%`, emoji: '📊', color: 'sky', isPercent: true },
          ].map((item, i) => {
            const colors = getColorClasses(item.color)
            return (
              <div key={i} className="card-finfemina p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl ${colors.light} flex items-center justify-center`}>
                    {item.emoji}
                  </div>
                  <span className="text-sm text-[#6B3F5E]">{item.label}</span>
                </div>
                <div className={`font-serif text-2xl font-black ${colors.text}`}>
                  {item.isPercent ? item.value : `S/ ${item.value.toLocaleString()}`}
                </div>
              </div>
            )
          })}
        </div>

        {/* Chart Type Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'barras' as ChartType, emoji: '📊', label: 'Barras' },
            { id: 'circular' as ChartType, emoji: '🍩', label: 'Circular' },
            { id: 'tendencia' as ChartType, emoji: '📈', label: 'Tendencia' },
            { id: 'arbol' as ChartType, emoji: '🌳', label: 'Árbol' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => switchChart(type.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                chartType === type.id
                  ? 'gradient-signature text-white'
                  : 'bg-white border-2 border-[#EDD9EA] text-[#6B3F5E] hover:border-[#9B72CF]'
              }`}
            >
              {type.emoji} {type.label}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Chart Visualization */}
          <div className="card-finfemina p-6">
            <h2 className="font-serif text-xl font-bold text-[#1C0E1A] mb-6">
              {chartType === 'tendencia' ? 'Tendencia de gastos' : 'Gastos por categoría'}
            </h2>
            <div className={`transition-all duration-150 ${chartAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              {/* Bar Chart */}
              {chartType === 'barras' && (
                <div className="flex flex-col gap-4">
                  {gastosPorCategoria.map((cat) => {
                    const colors = getColorClasses(cat.color)
                    const width = (cat.total / maxGasto) * 100
                    return (
                      <div key={cat.key}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${colors.light} flex items-center justify-center`}>
                              {cat.emoji}
                            </div>
                            <span className="font-medium text-[#1C0E1A]">{cat.name}</span>
                          </div>
                          <span className={`font-bold ${colors.text}`}>S/ {cat.total}</span>
                        </div>
                        <div className="h-3 rounded-full bg-[#F0E8FD]">
                          <div 
                            className={`h-full rounded-full ${colors.bg} transition-all duration-700`} 
                            style={{ width: `${width}%` }} 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Donut Chart */}
              {chartType === 'circular' && (
                <div className="flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Donut using conic-gradient */}
                    <div 
                      className="w-full h-full rounded-full"
                      style={{
                        background: `conic-gradient(${gastosPorCategoria.map((cat, i) => {
                          const startPercent = gastosPorCategoria.slice(0, i).reduce((sum, c) => sum + (c.total / totalGastos) * 100, 0)
                          const endPercent = startPercent + (cat.total / totalGastos) * 100
                          const colors = getColorClasses(cat.color)
                          return `${colors.hex} ${startPercent}% ${endPercent}%`
                        }).join(', ')})`,
                      }}
                    />
                    {/* Inner circle */}
                    <div className="absolute inset-8 bg-white rounded-full flex flex-col items-center justify-center">
                      <div className="text-sm text-[#6B3F5E]">Total gastos</div>
                      <div className="font-serif text-2xl font-black gradient-signature-text">S/ {totalGastos}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Chart */}
              {chartType === 'tendencia' && (
                <div className="h-64">
                  <svg viewBox="0 0 300 150" className="w-full h-full">
                    {/* Grid lines */}
                    {[0, 1, 2, 3].map((i) => (
                      <line key={i} x1="30" y1={20 + i * 35} x2="290" y2={20 + i * 35} stroke="#EDD9EA" strokeWidth="1" />
                    ))}
                    {/* Line path */}
                    <path
                      d={`M ${trendData.map((d, i) => `${30 + i * 40},${130 - (d.amount / maxTrend) * 100}`).join(' L ')}`}
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-draw-line"
                    />
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#D63F74" />
                        <stop offset="100%" stopColor="#9B72CF" />
                      </linearGradient>
                    </defs>
                    {/* Data points */}
                    {trendData.map((d, i) => (
                      <circle
                        key={i}
                        cx={30 + i * 40}
                        cy={130 - (d.amount / maxTrend) * 100}
                        r="5"
                        fill="#D63F74"
                        className="animate-pulse-soft"
                      />
                    ))}
                    {/* X-axis labels */}
                    {trendData.map((d, i) => (
                      <text key={i} x={30 + i * 40} y="148" textAnchor="middle" fontSize="10" fill="#6B3F5E">
                        {d.day}
                      </text>
                    ))}
                  </svg>
                </div>
              )}

              {/* Treemap */}
              {chartType === 'arbol' && (
                <div className="grid grid-cols-3 gap-2 h-64">
                  {gastosPorCategoria.map((cat, i) => {
                    const colors = getColorClasses(cat.color)
                    const sizeClass = i === 0 ? 'col-span-2 row-span-2' : i === 1 ? 'col-span-1 row-span-2' : 'col-span-1'
                    return (
                      <div 
                        key={cat.key} 
                        className={`${colors.bg} rounded-xl p-3 flex flex-col justify-center items-center text-white ${sizeClass} transition-all hover:scale-[1.02]`}
                      >
                        <span className="text-2xl mb-1">{cat.emoji}</span>
                        <span className="font-bold text-sm text-center">{cat.name}</span>
                        <span className="font-black">S/ {cat.total}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Legend for donut */}
              {chartType === 'circular' && (
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {gastosPorCategoria.map((cat) => {
                    const colors = getColorClasses(cat.color)
                    return (
                      <div key={cat.key} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                        <span className="text-sm text-[#6B3F5E]">{cat.name}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Registrar movimiento */}
          <div className="card-finfemina p-6">
            <h2 className="font-serif text-xl font-bold text-[#1C0E1A] mb-6">Registrar movimiento 💜</h2>
            
            {/* Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setNewTransaction({ ...newTransaction, type: 'gasto' })}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  newTransaction.type === 'gasto' 
                    ? 'bg-[#FDE8F0] text-[#D63F74] border-2 border-[#D63F74]' 
                    : 'bg-[#FDFAF8] text-[#6B3F5E] border-2 border-transparent'
                }`}
              >
                📤 Gasto
              </button>
              <button
                onClick={() => setNewTransaction({ ...newTransaction, type: 'ingreso' })}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  newTransaction.type === 'ingreso' 
                    ? 'bg-[#E4F7F1] text-[#2DBD96] border-2 border-[#2DBD96]' 
                    : 'bg-[#FDFAF8] text-[#6B3F5E] border-2 border-transparent'
                }`}
              >
                📥 Ingreso
              </button>
            </div>

            {/* Category Select */}
            <select
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#FDFAF8] border-2 border-[#EDD9EA] text-[#1C0E1A] mb-4"
              aria-label="Categoría"
            >
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.emoji} {cat.name}</option>
              ))}
            </select>

            {/* Description Input */}
            <input
              type="text"
              placeholder="¿En qué gastaste? 💭"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#FDFAF8] border-2 border-[#EDD9EA] text-[#1C0E1A] mb-4"
            />

            {/* Amount Input */}
            <input
              type="number"
              placeholder="¿Cuánto? (S/)"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#FDFAF8] border-2 border-[#EDD9EA] text-[#1C0E1A] mb-4"
            />

            <button onClick={addTransaction} className="btn-gradient w-full py-3 text-lg">
              + Agregar movimiento
            </button>
          </div>
        </div>

        {/* Metas financieras */}
        <h2 className="font-serif text-2xl font-bold text-[#1C0E1A] mb-6">Tu siguiente meta 🎯</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {goals.map((goal) => {
            const progress = (goal.current / goal.target) * 100
            return (
              <div key={goal.id} className="card-finfemina p-6 gradient-pastel">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{goal.emoji}</span>
                  <div>
                    <h3 className="font-bold text-[#1C0E1A]">{goal.name}</h3>
                    <p className="text-sm text-[#6B3F5E]">{goal.months} meses restantes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-serif text-2xl font-black gradient-signature-text">S/ {goal.current.toLocaleString()}</span>
                  <span className="text-[#6B3F5E]">/ S/ {goal.target.toLocaleString()}</span>
                </div>
                <div className="h-3 rounded-full bg-white mb-3">
                  <div className="h-full rounded-full gradient-signature" style={{ width: `${progress}%` }} />
                </div>
                <button className="w-full py-2 rounded-xl border-2 border-[#D63F74] text-[#D63F74] font-bold text-sm hover:bg-white transition-all">
                  + Agregar ahorro
                </button>
              </div>
            )
          })}
          {/* Add Goal Card */}
          <div className="card-finfemina p-6 border-2 border-dashed border-[#C4A8E8] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0E8FD] transition-all">
            <span className="text-4xl mb-2">➕</span>
            <span className="text-[#9B72CF] font-bold">Nueva meta</span>
          </div>
        </div>

        {/* Movimientos recientes */}
        <div className="card-finfemina p-6">
          <h2 className="font-serif text-xl font-bold text-[#1C0E1A] mb-6">Movimientos recientes</h2>
          <div className="flex flex-col divide-y divide-[#EDD9EA]">
            {transactions.slice(0, 7).map((t) => {
              const cat = CATEGORIES[t.category as keyof typeof CATEGORIES] || CATEGORIES.otros
              const colors = getColorClasses(cat.color)
              return (
                <div key={t.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.light} flex items-center justify-center`}>
                      {cat.emoji}
                    </div>
                    <div>
                      <div className="font-medium text-[#1C0E1A]">{t.description}</div>
                      <div className="text-xs text-[#6B3F5E]">{cat.name} • {t.date}</div>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'ingreso' ? 'text-[#2DBD96]' : 'text-[#D63F74]'}`}>
                    {t.type === 'ingreso' ? '+' : '-'} S/ {t.amount}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ COMPARAR PAGE ============
function CompararPage() {
  const [tab, setTab] = useState<CompareTab>('tarjetas')
  const [subTab, setSubTab] = useState<CompareSubTab>('credito')
  const [creditLevel, setCreditLevel] = useState<CreditLevel>('basico')

  const creditLevels: { id: CreditLevel; emoji: string; name: string; desc: string }[] = [
    { id: 'basico', emoji: '🌱', name: 'Nivel Básico', desc: 'Para empezar a construir historial crediticio.' },
    { id: 'intermedio', emoji: '💳', name: 'Nivel Intermedio', desc: 'Para quienes ya tienen historial.' },
    { id: 'premium', emoji: '⭐', name: 'Nivel Premium', desc: 'Para ingresos medios-altos.' },
    { id: 'exclusivo', emoji: '👑', name: 'Nivel Exclusivo', desc: 'Para altos ingresos. Concierge y VIP.' },
  ]

  const currentCreditCards = CREDIT_CARDS_BY_LEVEL[creditLevel]
  const bestCard = currentCreditCards.reduce((best, card) => card.score > best.score ? card : best, currentCreditCards[0])

  const currentAccounts = tab === 'cuentas' 
    ? (subTab === 'ahorro' ? SAVINGS_ACCOUNTS.ahorro : subTab === 'sueldo' ? SAVINGS_ACCOUNTS.sueldo : SAVINGS_ACCOUNTS.cts)
    : []

  const getTeaColor = (tea: string) => {
    const teaNum = parseFloat(tea)
    if (teaNum > 75) return 'text-[#D63F74]'
    if (teaNum > 65) return 'text-[#F4A261]'
    return 'text-[#2DBD96]'
  }

  const recommendations: Record<CreditLevel, string> = {
    basico: 'Para empezar: Interbank Visa Clásica tiene la mejor relación costo-beneficio sin membresía el primer año.',
    intermedio: 'Recomendamos: Interbank Gold Visa por sus beneficios de millas y descuentos sin membresía el primer año.',
    premium: 'Para este nivel: Interbank Visa Platinum ofrece Priority Pass y LifeMiles 3x sin membresía.',
    exclusivo: 'La mejor opción: BCP Visa Infinite con concierge 24/7 y acceso VIP ilimitado.',
  }

  return (
    <div className="min-h-screen pt-[68px]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-[#EAF3FB] border border-[#5B9BD5] mb-8 flex items-start gap-3">
          <span className="text-xl">📌</span>
          <p className="text-sm text-[#1C0E1A]">
            Información basada en datos públicos de la SBS Perú. Verifica condiciones vigentes directamente con cada entidad.
            <a href="https://sbs.gob.pe" target="_blank" rel="noopener noreferrer" className="text-[#D63F74] font-bold ml-1 underline">sbs.gob.pe</a>
          </p>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl font-black text-[#1C0E1A]">Comparador</h1>
            <p className="text-[#6B3F5E]">Encuentra el mejor producto financiero para ti</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#FDE8F0]">
            <span>🇵🇪</span>
            <span className="font-bold text-[#D63F74]">Perú</span>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => { setTab('tarjetas'); setSubTab('credito') }}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              tab === 'tarjetas' 
                ? 'gradient-signature text-white' 
                : 'bg-white border-2 border-[#EDD9EA] text-[#6B3F5E] hover:border-[#D63F74]'
            }`}
          >
            💳 Tarjetas de crédito
          </button>
          <button
            onClick={() => { setTab('cuentas'); setSubTab('ahorro') }}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              tab === 'cuentas' 
                ? 'gradient-signature text-white' 
                : 'bg-white border-2 border-[#EDD9EA] text-[#6B3F5E] hover:border-[#D63F74]'
            }`}
          >
            🏦 Cuentas de ahorro
          </button>
        </div>

        {/* Credit Cards Tab */}
        {tab === 'tarjetas' && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'credito' as CompareSubTab, label: '💳 Crédito' },
                { id: 'debito' as CompareSubTab, label: '🏧 Débito' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSubTab(t.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    subTab === t.id
                      ? 'bg-[#D63F74] text-white'
                      : 'bg-white border border-[#EDD9EA] text-[#6B3F5E] hover:border-[#D63F74]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {subTab === 'credito' && (
              <>
                {/* Level Selector */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {creditLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setCreditLevel(level.id)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        creditLevel === level.id
                          ? 'gradient-pastel border-2 border-[#D63F74] shadow-lg'
                          : 'bg-white border-2 border-[#EDD9EA] hover:border-[#D63F74]'
                      }`}
                    >
                      <div className="text-2xl mb-2">{level.emoji}</div>
                      <div className="font-bold text-[#1C0E1A] text-sm">{level.name}</div>
                      <div className="text-xs text-[#6B3F5E]">{level.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Recommendation Banner */}
                <div className="p-4 rounded-xl gradient-signature mb-8 flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="text-white font-bold text-sm">Recomendación para ti:</div>
                    <div className="text-white/90 text-sm">💜 {recommendations[creditLevel]}</div>
                  </div>
                </div>

                {/* Credit Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {currentCreditCards.map((card, i) => (
                    <div key={i} className="relative">
                      {card.score === bestCard.score && (
                        <div className="absolute -top-3 left-4 z-10 px-3 py-1 rounded-full text-white text-xs font-bold gradient-signature">
                          ⭐ Recomendado
                        </div>
                      )}
                      <div className={`card-finfemina overflow-hidden ${card.score === bestCard.score ? 'ring-2 ring-[#D63F74]' : ''}`}>
                        {/* Header */}
                        <div className="p-4 flex items-center gap-3 border-b border-[#EDD9EA]">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: card.bankColor }}
                          >
                            {card.bank.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-[#1C0E1A]">{card.bank}</div>
                            <div className="text-sm text-[#6B3F5E]">{card.product}</div>
                          </div>
                        </div>

                        {/* Data */}
                        <div className="p-4 bg-[#FDFAF8]">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-[#6B3F5E]">TEA</span>
                            <span className={`font-bold ${getTeaColor(card.tea)}`}>{card.tea}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-[#6B3F5E]">Membresía</span>
                            <span className="font-semibold text-[#1C0E1A]">{card.fee}</span>
                          </div>
                        </div>

                        {/* Benefits */}
                        <div className="p-4">
                          <div className="p-3 rounded-xl bg-[#F0E8FD] text-sm text-[#9B72CF]">
                            {card.benefit}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="px-4 pb-4">
                          <div className="text-xs text-[#6B3F5E] mb-1">Score FinFémina</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-[#FDE8F0]">
                              <div 
                                className="h-full rounded-full"
                                style={{ 
                                  width: `${card.score}%`,
                                  backgroundColor: card.score >= 85 ? '#2DBD96' : card.score >= 75 ? '#F4A261' : '#D63F74'
                                }}
                              />
                            </div>
                            <span className="font-bold text-[#1C0E1A]">{card.score}/100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {subTab === 'debito' && (
              <div className="card-finfemina p-8 text-center">
                <span className="text-5xl mb-4 block">🏧</span>
                <h3 className="font-serif text-xl font-bold text-[#1C0E1A] mb-2">Tarjetas de Débito</h3>
                <p className="text-[#6B3F5E]">La mayoría de tarjetas de débito son gratuitas al abrir una cuenta. Te recomendamos revisar la sección de Cuentas de Ahorro o Cuentas Sueldo para elegir el banco que más te convenga.</p>
              </div>
            )}
          </>
        )}

        {/* Savings Accounts Tab */}
        {tab === 'cuentas' && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                { id: 'ahorro' as CompareSubTab, label: '💰 Cuentas de Ahorro' },
                { id: 'sueldo' as CompareSubTab, label: '💼 Cuentas Sueldo' },
                { id: 'cts' as CompareSubTab, label: '🏢 CTS' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSubTab(t.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    subTab === t.id
                      ? 'bg-[#D63F74] text-white'
                      : 'bg-white border border-[#EDD9EA] text-[#6B3F5E] hover:border-[#D63F74]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {currentAccounts.map((account, i) => (
                <div key={i} className="relative">
                  {account.rank === 1 && (
                    <div className="absolute -top-3 left-4 z-10 px-3 py-1 rounded-full text-white text-xs font-bold gradient-signature">
                      🏆 #1 Mejor TEA
                    </div>
                  )}
                  <div className={`card-finfemina overflow-hidden ${account.rank === 1 ? 'ring-2 ring-[#D63F74]' : ''}`}>
                    {/* Header */}
                    <div className="p-4 flex items-center gap-3 border-b border-[#EDD9EA]">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: account.bankColor }}
                      >
                        {account.bank.slice(0, 4)}
                      </div>
                      <div>
                        <div className="font-bold text-[#1C0E1A]">{account.bank}</div>
                        <div className="text-sm text-[#6B3F5E]">{account.product}</div>
                      </div>
                    </div>

                    {/* Data */}
                    <div className="p-4 bg-[#FDFAF8]">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-[#6B3F5E]">TEA</span>
                        <span className="font-bold text-[#2DBD96] text-lg">{account.tea}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-[#6B3F5E]">Mantenimiento</span>
                        <span className="font-semibold text-[#1C0E1A]">{account.fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[#6B3F5E]">Saldo mínimo</span>
                        <span className="font-semibold text-[#1C0E1A]">{account.minBalance}</span>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="p-4">
                      <div className="p-3 rounded-xl bg-[#F0E8FD] text-sm text-[#9B72CF]">
                        {account.benefit}
                      </div>
                    </div>

                    {/* FSD Badge */}
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-2 text-xs text-[#2DBD96]">
                        <span>✅</span>
                        <span>Protegida hasta S/ 125,978 (FSD)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recommended Packages */}
        <h2 className="font-serif text-2xl font-bold text-[#1C0E1A] mb-6">FinFémina recomienda 💜</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {RECOMMENDED_PACKAGES.map((pkg) => (
            <div key={pkg.id} className="card-finfemina p-6 gradient-pastel">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{pkg.emoji}</span>
                <h3 className="font-serif text-xl font-bold text-[#1C0E1A]">{pkg.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {pkg.products.map((p, i) => (
                  <div key={i} className="px-3 py-1.5 rounded-full bg-white text-xs font-bold text-[#6B3F5E] border border-[#EDD9EA]">
                    {p.bank} • {p.product}
                  </div>
                ))}
              </div>
              <details className="mb-4">
                <summary className="text-sm text-[#D63F74] font-bold cursor-pointer">¿Por qué este combo?</summary>
                <p className="mt-2 text-sm text-[#6B3F5E]">{pkg.why}</p>
              </details>
              <button className="btn-gradient w-full py-2.5 text-sm">
                Aplicar a todo
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ LOGROS PAGE ============
function LogrosPage({ points }: { points: number }) {
  const currentLevel = LEVELS.reduce((acc, level) => points >= level.points ? level : acc, LEVELS[0])
  const nextLevel = LEVELS.find(l => l.points > points) || LEVELS[LEVELS.length - 1]
  const progressToNext = nextLevel.points > currentLevel.points 
    ? ((points - currentLevel.points) / (nextLevel.points - currentLevel.points)) * 100 
    : 100
  const pointsToNext = nextLevel.points - points

  const currentLevelColors = getColorClasses(currentLevel.color)

  return (
    <div className="min-h-screen pt-[68px]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Level Hero Card */}
        <div 
          className="rounded-[28px] p-8 mb-12 gradient-pastel"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className={`w-24 h-24 rounded-full ${currentLevelColors.light} ${currentLevelColors.border} border-4 flex items-center justify-center text-5xl animate-pulse-soft`}>
              {currentLevel.emoji}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="text-sm text-[#6B3F5E] mb-1">Tu nivel actual</div>
              <h1 className="font-serif text-3xl font-black text-[#1C0E1A] mb-2">{currentLevel.name}</h1>
              <div className="font-serif text-4xl font-black gradient-signature-text mb-4">{points} pts</div>
              <div className="max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#6B3F5E]">Progreso a {nextLevel.name}</span>
                  <span className="text-[#D63F74] font-bold">Faltan {pointsToNext} pts</span>
                </div>
                <div className="h-3 rounded-full bg-white">
                  <div 
                    className="h-full rounded-full gradient-signature" 
                    style={{ width: `${progressToNext}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to earn points */}
        <h2 className="font-serif text-2xl font-bold text-[#1C0E1A] mb-6">¿Cómo ganar puntos?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {[
            { emoji: '🎬', action: 'Ver microvideo completo', points: 30 },
            { emoji: '📝', action: 'Completar un quiz', points: 50 },
            { emoji: '📥', action: 'Registrar gastos 7 días', points: 100 },
            { emoji: '🎯', action: 'Alcanzar meta de ahorro', points: 200 },
            { emoji: '🏦', action: 'Usar el comparador', points: 20 },
            { emoji: '📚', action: 'Completar módulo', points: 150 },
          ].map((item, i) => (
            <div key={i} className="card-finfemina p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FDE8F0] flex items-center justify-center text-2xl">
                {item.emoji}
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#1C0E1A]">{item.action}</div>
              </div>
              <div className="font-bold gradient-signature-text">+{item.points} pts</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <h2 className="font-serif text-2xl font-bold text-[#1C0E1A] mb-6">Insignias</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {BADGES.map((badge) => (
            <div 
              key={badge.id} 
              className={`rounded-[28px] p-6 text-center transition-all ${
                badge.earned 
                  ? 'border-2 border-[#F4A261] gradient-pastel' 
                  : 'bg-[#FDFAF8] border-2 border-[#EDD9EA] opacity-55'
              }`}
            >
              <div className={`text-4xl mb-3 ${!badge.earned ? 'grayscale' : ''}`}>{badge.emoji}</div>
              <div className="font-bold text-[#1C0E1A] text-sm mb-2">{badge.name}</div>
              {badge.earned ? (
                <div className="inline-flex px-3 py-1 rounded-full bg-[#E4F7F1] text-[#2DBD96] text-xs font-bold">
                  ✅ Obtenida
                </div>
              ) : (
                <div className="inline-flex px-3 py-1 rounded-full bg-[#EDD9EA] text-[#6B3F5E] text-xs font-bold">
                  🔒 Bloqueada
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Passport Banner */}
        <div 
          className="rounded-[28px] p-8 relative overflow-hidden gradient-signature"
        >
          <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute top-8 right-16 text-5xl animate-float">🛂</div>
          
          <h2 className="font-serif text-3xl font-black text-white mb-2">Pasaporte Financiero Digital</h2>
          <p className="text-white/90 mb-6 max-w-md">
            Completa todos los módulos en 90 días y obtén tu certificación financiera.
          </p>
          
          <div className="max-w-md mb-6">
            <div className="flex justify-between text-sm text-white/80 mb-2">
              <span>Día 23 de 90</span>
              <span>25% completado</span>
            </div>
            <div className="h-3 rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white" style={{ width: '25%' }} />
            </div>
          </div>
          
          <button className="px-6 py-3 rounded-xl bg-white text-[#D63F74] font-extrabold hover:shadow-lg transition-all">
            Ver mi progreso 🚀
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ AI CHAT WIDGET ============
function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestions = [
    '¿Estoy gastando demasiado?',
    '¿Cuál tarjeta me conviene?',
    '¿Cómo empiezo a ahorrar?',
    '¿Qué es un ETF?',
  ]

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) throw new Error('Network response was not ok')

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-[62px] h-[62px] rounded-full flex items-center justify-center text-2xl text-white shadow-lg transition-all hover:scale-110 gradient-signature"
        style={{ border: '3px solid white' }}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[370px] h-[530px] rounded-[28px] overflow-hidden shadow-2xl flex flex-col bg-white animate-slideIn">
          {/* Header */}
          <div className="p-4 flex items-center gap-3 gradient-signature">
            <div className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-xl">
              🤖
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">Asistente FinFémina</div>
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#2DBD96] animate-blink" />
                En línea 24/7
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-[#6B3F5E] text-sm text-center mb-4">
                  ¡Hola! Soy tu asistente financiera. ¿En qué puedo ayudarte? 💜
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(sug)}
                      className="px-3 py-2 rounded-xl bg-[#FDE8F0] text-[#D63F74] text-sm font-medium hover:gradient-signature hover:text-white transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'text-white rounded-br-sm gradient-signature' 
                      : 'bg-[#FDFAF8] text-[#1C0E1A] rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#FDFAF8] p-3 rounded-2xl rounded-bl-sm flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D63F74] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#D63F74] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#D63F74] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#EDD9EA]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 p-3 rounded-xl bg-[#FDFAF8] border-2 border-[#EDD9EA] text-[#1C0E1A] text-sm"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-all gradient-signature"
                aria-label="Enviar mensaje"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============ FOOTER ============
function Footer() {
  return (
    <footer className="bg-white border-t-2 border-[#D63F74]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo Column */}
          <div>
            <Logo />
            <p className="text-[#6B3F5E] text-sm mt-4 mb-3">
              Empoderamiento financiero para mujeres peruanas.
            </p>
            <div className="text-sm text-[#6B3F5E]">🇵🇪 Lima, Perú</div>
            <div className="text-sm text-[#D63F74] mt-1">hola@finfemina.pe</div>
          </div>

          {/* Producto */}
          <div>
            <h4 className="font-bold text-[#1C0E1A] mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-[#6B3F5E]">
              <li><button className="hover:text-[#D63F74] transition-colors">Inicio</button></li>
              <li><button className="hover:text-[#D63F74] transition-colors">Aprende</button></li>
              <li><button className="hover:text-[#D63F74] transition-colors">Tracker</button></li>
              <li><button className="hover:text-[#D63F74] transition-colors">Comparar</button></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-bold text-[#1C0E1A] mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm text-[#6B3F5E]">
              <li><button className="hover:text-[#D63F74] transition-colors">Logros</button></li>
              <li><a href="https://sbs.gob.pe" target="_blank" rel="noopener noreferrer" className="hover:text-[#D63F74] transition-colors">SBS Perú</a></li>
              <li><button className="hover:text-[#D63F74] transition-colors">Blog financiero</button></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-bold text-[#1C0E1A] mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-[#6B3F5E]">
              <li><button className="hover:text-[#D63F74] transition-colors">Acerca de</button></li>
              <li><button className="hover:text-[#D63F74] transition-colors">Privacidad</button></li>
              <li><button className="hover:text-[#D63F74] transition-colors">Términos</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-[#EDD9EA] text-center text-sm text-[#6B3F5E]">
          © 2024 FinFémina · Hecho con 💜 en Lima, Perú
        </div>
      </div>
    </footer>
  )
}

// ============ MAIN APP ============
export default function FinFeminaApp() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio')
  const [points, setPoints] = useState(1240)

  return (
    <main className="relative min-h-screen">
      <BackgroundBlobs />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="relative z-10">
        {activeTab === 'inicio' && <InicioPage />}
        {activeTab === 'aprende' && <AprendePage points={points} setPoints={setPoints} />}
        {activeTab === 'tracker' && <TrackerPage />}
        {activeTab === 'comparar' && <CompararPage />}
        {activeTab === 'logros' && <LogrosPage points={points} />}
      </div>
      
      <Footer />
      <AIChatWidget />
    </main>
  )
}
