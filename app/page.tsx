'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ============ TYPES ============
type Tab = 'inicio' | 'aprende' | 'tracker' | 'comparar' | 'logros'
type Mode = 'comun' | 'girly'
type CategoryFilter = 'todos' | 'dinero' | 'tarjetas' | 'errores' | 'invertir'
type PeriodFilter = 'semanal' | 'mensual' | 'semestral' | 'anual'
type CompareTab = 'tarjetas' | 'cuentas'

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
  educacion: { emoji: '📚', color: 'lavender', name: 'Educación' },
  ocio: { emoji: '🎬', color: 'amber', name: 'Ocio' },
  vivienda: { emoji: '🏠', color: 'rose', name: 'Vivienda' },
  otros: { emoji: '📦', color: 'mint', name: 'Otros' },
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
  { id: 1, name: 'Aprendiz financiera', emoji: '🌱', color: 'mint', points: 0 },
  { id: 2, name: 'Organizadora de dinero', emoji: '💸', color: 'sky', points: 500 },
  { id: 3, name: 'Mujer financiera', emoji: '📊', color: 'lavender', points: 1500 },
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

const CREDIT_CARDS = [
  { bank: 'BCP', bankColor: '#0033A0', product: 'Visa Clásica', rate: '79.9%', fee: 'S/ 0', benefits: 'Puntos Ripley + seguros', score: 72, recommended: false },
  { bank: 'Interbank', bankColor: '#E40000', product: 'Visa Platinum', rate: '69.9%', fee: 'S/ 0 primer año', benefits: 'Travel Club + cashback 1%', score: 91, recommended: true },
  { bank: 'BBVA', bankColor: '#004A97', product: 'Visa Signature', rate: '74.9%', fee: 'S/ 99 año', benefits: 'Millas + salas VIP', score: 80, recommended: false },
  { bank: 'Scotiabank', bankColor: '#EC111A', product: 'Preferred', rate: '72.5%', fee: 'S/ 55 año', benefits: 'Descuentos establecimientos', score: 76, recommended: false },
]

const SAVINGS_ACCOUNTS = [
  { bank: 'BCP', bankColor: '#0033A0', product: 'Cuenta Simple', rate: '0.50% TEA', fee: 'S/ 0', benefits: 'Sin saldo mínimo', recommended: false },
  { bank: 'Interbank', bankColor: '#E40000', product: 'Cuenta Sueldo', rate: '1.20% TEA', fee: 'S/ 0', benefits: 'Depósito inmediato', recommended: false },
  { bank: 'BBVA', bankColor: '#004A97', product: 'Cuenta Ahorro+', rate: '2.10% TEA', fee: 'S/ 500 mínimo', benefits: 'Mayor rentabilidad', recommended: true },
  { bank: 'Scotiabank', bankColor: '#EC111A', product: 'Ahorro Plus', rate: '1.80% TEA', fee: 'S/ 200 mínimo', benefits: 'Transferencias gratis', recommended: false },
]

// ============ COLOR HELPERS ============
const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; light: string; border: string }> = {
    rose: { bg: 'bg-[#E8436A]', text: 'text-[#E8436A]', light: 'bg-[#FEE7ED]', border: 'border-[#E8436A]' },
    peach: { bg: 'bg-[#FF8C5A]', text: 'text-[#FF8C5A]', light: 'bg-[#FFEEE6]', border: 'border-[#FF8C5A]' },
    amber: { bg: 'bg-[#F5A623]', text: 'text-[#F5A623]', light: 'bg-[#FEF3DB]', border: 'border-[#F5A623]' },
    mint: { bg: 'bg-[#1DB985]', text: 'text-[#1DB985]', light: 'bg-[#E6F9F2]', border: 'border-[#1DB985]' },
    sky: { bg: 'bg-[#4A90D9]', text: 'text-[#4A90D9]', light: 'bg-[#E6F0FA]', border: 'border-[#4A90D9]' },
    lavender: { bg: 'bg-[#8B5CF6]', text: 'text-[#8B5CF6]', light: 'bg-[#F0EBFE]', border: 'border-[#8B5CF6]' },
  }
  return colors[color] || colors.rose
}

// ============ COMPONENTS ============

// Logo Component
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
           style={{ background: 'linear-gradient(135deg, #E8436A 0%, #FF8C5A 100%)' }}>
        💜
      </div>
      <span className="font-serif text-xl font-bold">
        <span className="text-[#1A0A0E]">Fin</span>
        <span className="gradient-text">Fémina</span>
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
    <nav className={`fixed top-0 left-0 right-0 z-50 h-[68px] transition-all duration-300 ${scrolled ? 'glass-nav shadow-lg' : 'bg-white/50'}`}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Logo />
        
        {/* Desktop Tabs */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-[#FEE7ED]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-[#E8436A] shadow-md'
                  : 'text-[#9E7A82] hover:text-[#E8436A]'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <button className="hidden md:flex btn-gradient px-5 py-2.5 text-sm">
          Empezar gratis
        </button>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-[#1A0A0E]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[68px] left-0 right-0 bg-white shadow-lg border-t border-[#F0DCE4] p-4">
          <div className="flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-4 py-3 rounded-xl text-left font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#FEE7ED] text-[#E8436A]'
                    : 'text-[#1A0A0E] hover:bg-[#FEF6F0]'
                }`}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
            <button className="btn-gradient px-5 py-3 mt-2 text-sm">
              Empezar gratis
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
        className="absolute -top-20 -right-20 w-[500px] h-[500px] opacity-60 animate-blob"
        style={{ background: 'radial-gradient(circle, #FEE7ED 0%, transparent 70%)' }}
      />
      <div 
        className="absolute bottom-20 -left-40 w-[600px] h-[600px] opacity-50 animate-blob animation-delay-200"
        style={{ background: 'radial-gradient(circle, #FEF3DB 0%, transparent 70%)' }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-40 animate-blob animation-delay-400"
        style={{ background: 'radial-gradient(circle, #FFEEE6 0%, transparent 70%)' }}
      />
    </div>
  )
}

// ============ INICIO PAGE ============
function InicioPage() {
  const [mode, setMode] = useState<Mode>('comun')

  const modeContent = {
    comun: {
      title: 'Interés Compuesto',
      text: 'El interés compuesto es cuando los intereses que ganas se suman a tu capital inicial, y luego también generan intereses. Es la forma más eficiente de hacer crecer tu dinero a largo plazo.',
      bg: 'from-[#E6F0FA] to-[#F0EBFE]',
    },
    girly: {
      title: 'Interés Compuesto',
      text: 'Bestie, imagina que tu dinero tiene bebés, y esos bebés también tienen bebés. Así funciona el interés compuesto: tu plata crece solita mientras tú te tomas un café. Es como magia financiera. 💅✨',
      bg: 'from-[#FEE7ED] to-[#FFEEE6]',
    },
  }

  return (
    <div className="min-h-screen pt-[68px]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="animate-fadeUp">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FEE7ED] text-[#E8436A] text-sm font-semibold mb-6">
            🇵🇪 Diseñado para mujeres peruanas
          </div>

          {/* Hero Heading */}
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6">
            <span className="text-[#1A0A0E]">Tu historial</span>
            <br />
            <span className="gradient-text">empieza hoy.</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-[#9E7A82] max-w-xl mb-8 leading-relaxed">
            Aprende a manejar tu dinero, construye tu historial crediticio y alcanza tus metas financieras. 
            Todo en un solo lugar, diseñado especialmente para ti.
          </p>

          {/* Mode Toggle */}
          <div className="mb-6">
            <div className="inline-flex p-1 rounded-full bg-[#FEE7ED]">
              <button
                onClick={() => setMode('comun')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  mode === 'comun' ? 'bg-white text-[#E8436A] shadow-md' : 'text-[#9E7A82]'
                }`}
              >
                📚 Modo Común
              </button>
              <button
                onClick={() => setMode('girly')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  mode === 'girly' ? 'bg-white text-[#E8436A] shadow-md' : 'text-[#9E7A82]'
                }`}
              >
                💅 Modo Girly
              </button>
            </div>
          </div>

          {/* Demo Card */}
          <div className={`p-6 rounded-3xl bg-gradient-to-r ${modeContent[mode].bg} mb-8 max-w-xl animate-fadeUp`}>
            <h3 className="font-serif text-xl font-bold text-[#1A0A0E] mb-2">{modeContent[mode].title}</h3>
            <p className="text-[#1A0A0E] leading-relaxed">{modeContent[mode].text}</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-16">
            <button className="btn-gradient px-8 py-4 text-lg">
              Empezar gratis 🚀
            </button>
            <button className="px-8 py-4 rounded-2xl border-2 border-[#E8436A] text-[#E8436A] font-bold hover:bg-[#FEE7ED] transition-all">
              Ver mi tracker 📊
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
                <div className="font-serif text-4xl font-bold gradient-text mb-1">{stat.number}</div>
                <div className="text-2xl mb-2">{stat.emoji}</div>
                <div className="text-sm text-[#9E7A82]">{stat.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12 text-[#1A0A0E]">
          Todo lo que necesitas para <span className="gradient-text">crecer</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { emoji: '🎬', title: 'Microvideos', desc: 'Aprende finanzas en menos de 2 minutos con videos cortos y divertidos.', color: 'rose' },
            { emoji: '📊', title: 'Tracker personal', desc: 'Registra tus ingresos y gastos para entender a dónde va tu dinero.', color: 'sky' },
            { emoji: '🏦', title: 'Comparador', desc: 'Encuentra las mejores tarjetas y cuentas según tu perfil.', color: 'lavender' },
            { emoji: '🤖', title: 'Asistente IA', desc: 'Resuelve tus dudas financieras con nuestra asistente 24/7.', color: 'mint' },
            { emoji: '🎯', title: 'Metas de ahorro', desc: 'Define objetivos y sigue tu progreso para alcanzarlos.', color: 'peach' },
            { emoji: '🏆', title: 'Gamificación', desc: 'Gana puntos, sube de nivel y desbloquea insignias.', color: 'amber' },
          ].map((feature, i) => {
            const colors = getColorClasses(feature.color)
            return (
              <div key={i} className="card-finfemina p-6 animate-fadeUp" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-14 h-14 rounded-2xl ${colors.light} flex items-center justify-center text-2xl mb-4`}>
                  {feature.emoji}
                </div>
                <h3 className="font-bold text-lg text-[#1A0A0E] mb-2">{feature.title}</h3>
                <p className="text-[#9E7A82] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Levels Timeline */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12 text-[#1A0A0E]">
          Tu camino al <span className="gradient-text">éxito financiero</span>
        </h2>
        <div className="overflow-x-auto pb-4">
          <div className="flex items-center gap-4 min-w-max px-4">
            {LEVELS.map((level, i) => {
              const colors = getColorClasses(level.color)
              return (
                <div key={level.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-[72px] h-[72px] rounded-full ${colors.light} ${colors.border} border-3 flex items-center justify-center text-3xl animate-pulse-soft`}>
                      {level.emoji}
                    </div>
                    <div className="mt-3 text-center">
                      <div className="font-bold text-[#1A0A0E] text-sm">{level.name}</div>
                      <div className={`text-xs ${colors.text} font-semibold`}>{level.points}+ pts</div>
                    </div>
                  </div>
                  {i < LEVELS.length - 1 && (
                    <div className="w-16 h-1 mx-2 rounded-full" style={{ background: 'linear-gradient(90deg, #E8436A, #FF8C5A)' }} />
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
          className="rounded-3xl p-8 md:p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #E8436A 0%, #FF8C5A 50%, #F5A623 100%)' }}
        >
          <div className="absolute top-4 right-8 text-6xl animate-float">🛂</div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4 max-w-lg">
            Obtén tu Pasaporte Financiero Digital en 90 días
          </h2>
          <p className="text-white/90 mb-6 max-w-md">
            Completa los módulos, gana puntos y demuestra que estás lista para el mundo financiero.
          </p>
          <button className="px-8 py-4 rounded-2xl bg-white text-[#E8436A] font-bold hover:shadow-lg transition-all">
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

  const filteredVideos = filter === 'todos' ? VIDEOS : VIDEOS.filter(v => v.category === filter)

  const categoryColors: Record<string, string> = {
    dinero: 'mint',
    tarjetas: 'lavender',
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
            <h1 className="font-serif text-4xl font-bold text-[#1A0A0E]">Aprende</h1>
            <p className="text-[#9E7A82]">Microvideos financieros de menos de 2 minutos</p>
          </div>
          <div className="card-finfemina px-6 py-3 flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="text-xs text-[#9E7A82]">Puntos ganados</div>
              <div className="font-serif text-2xl font-bold gradient-text">{points}</div>
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
            const color = tab.id === 'todos' ? 'rose' : categoryColors[tab.id]
            const colors = getColorClasses(color)
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as CategoryFilter)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive 
                    ? `${colors.bg} text-white` 
                    : `bg-white border-2 ${colors.border} ${colors.text} hover:${colors.light}`
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
                  <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-full bg-white text-xs font-semibold ${colors.text}`}>
                    ▶ {video.duration}
                  </div>
                </div>
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-[#1A0A0E] mb-3">{video.title}</h3>
                  <div className={`p-3 rounded-xl ${colors.light} border ${colors.border} mb-3`}>
                    <div className="flex items-start gap-2 text-sm">
                      <span>💡</span>
                      <span className="text-[#1A0A0E]">{video.tip}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openQuiz(video.id)}
                    className={`w-full py-2 rounded-xl border-2 ${colors.border} ${colors.text} font-semibold text-sm hover:${colors.light} transition-all`}
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
              <h3 className="font-serif text-xl font-bold text-[#1A0A0E]">
                {QUIZ_QUESTIONS[quiz.videoId].question}
              </h3>
            </div>
            <div className="flex flex-col gap-3 mb-6">
              {QUIZ_QUESTIONS[quiz.videoId].answers.map((answer, i) => {
                let buttonClass = 'p-4 rounded-xl border-2 text-left font-medium transition-all '
                if (quiz.answered) {
                  if (i === quiz.correctAnswer) {
                    buttonClass += 'bg-[#E6F9F2] border-[#1DB985] text-[#1DB985]'
                  } else if (i === quiz.selectedAnswer) {
                    buttonClass += 'bg-[#FEE7ED] border-[#E8436A] text-[#E8436A]'
                  } else {
                    buttonClass += 'border-[#F0DCE4] text-[#9E7A82]'
                  }
                } else {
                  buttonClass += 'border-[#F0DCE4] text-[#1A0A0E] hover:border-[#E8436A] hover:bg-[#FEE7ED]'
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
                  <div className="text-[#1DB985] font-bold text-lg">¡Correcto! +50 pts 🎉</div>
                ) : (
                  <div className="text-[#E8436A] font-medium">Respuesta incorrecta, ¡sigue intentando!</div>
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
  const [period, setPeriod] = useState<PeriodFilter>('mensual')
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS)
  const [newTransaction, setNewTransaction] = useState({ type: 'gasto' as 'gasto' | 'ingreso', category: 'alimentacion', description: '', amount: '' })

  const ingresos = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0)
  const gastos = transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0)
  const ahorro = ingresos - gastos
  const tasaAhorro = ingresos > 0 ? Math.round((ahorro / ingresos) * 100) : 0

  const gastosPorCategoria = Object.entries(CATEGORIES).map(([key, cat]) => {
    const total = transactions.filter(t => t.type === 'gasto' && t.category === key).reduce((sum, t) => sum + t.amount, 0)
    return { key, ...cat, total }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const maxGasto = Math.max(...gastosPorCategoria.map(c => c.total), 1)

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

  // Goal data
  const goalCurrent = 1450
  const goalTarget = 3000
  const goalProgress = (goalCurrent / goalTarget) * 100

  return (
    <div className="min-h-screen pt-[68px]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl font-bold text-[#1A0A0E]">Tracker Personal</h1>
            <p className="text-[#9E7A82]">Controla tus finanzas y alcanza tus metas</p>
          </div>
          <div className="flex gap-2 p-1 rounded-full bg-[#FEE7ED]">
            {(['semanal', 'mensual', 'semestral', 'anual'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                  period === p ? 'bg-white text-[#E8436A] shadow-md' : 'text-[#9E7A82]'
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
            { label: 'Ingresos', value: ingresos, emoji: '📥', color: 'mint' },
            { label: 'Gastos', value: gastos, emoji: '📤', color: 'rose' },
            { label: 'Ahorro', value: ahorro, emoji: '💰', color: 'amber' },
            { label: 'Tasa ahorro', value: `${tasaAhorro}%`, emoji: '📊', color: 'sky', isPercent: true },
          ].map((item, i) => {
            const colors = getColorClasses(item.color)
            return (
              <div key={i} className="card-finfemina p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl ${colors.light} flex items-center justify-center`}>
                    {item.emoji}
                  </div>
                  <span className="text-sm text-[#9E7A82]">{item.label}</span>
                </div>
                <div className={`font-serif text-2xl font-bold ${colors.text}`}>
                  {item.isPercent ? item.value : `S/ ${item.value.toLocaleString()}`}
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Gastos por categoría */}
          <div className="card-finfemina p-6">
            <h2 className="font-serif text-xl font-bold text-[#1A0A0E] mb-6">Gastos por categoría</h2>
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
                        <span className="font-medium text-[#1A0A0E]">{cat.name}</span>
                      </div>
                      <span className={`font-bold ${colors.text}`}>S/ {cat.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#FEE7ED]">
                      <div className={`h-full rounded-full ${colors.bg}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Registrar movimiento */}
          <div className="card-finfemina p-6">
            <h2 className="font-serif text-xl font-bold text-[#1A0A0E] mb-6">Registrar movimiento</h2>
            
            {/* Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setNewTransaction({ ...newTransaction, type: 'gasto' })}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  newTransaction.type === 'gasto' 
                    ? 'bg-[#FEE7ED] text-[#E8436A] border-2 border-[#E8436A]' 
                    : 'bg-[#FEF6F0] text-[#9E7A82] border-2 border-transparent'
                }`}
              >
                📤 Gasto
              </button>
              <button
                onClick={() => setNewTransaction({ ...newTransaction, type: 'ingreso' })}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  newTransaction.type === 'ingreso' 
                    ? 'bg-[#E6F9F2] text-[#1DB985] border-2 border-[#1DB985]' 
                    : 'bg-[#FEF6F0] text-[#9E7A82] border-2 border-transparent'
                }`}
              >
                📥 Ingreso
              </button>
            </div>

            {/* Category Select */}
            <select
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#FEF6F0] border-2 border-[#F0DCE4] text-[#1A0A0E] mb-4 focus:border-[#E8436A] outline-none"
            >
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.emoji} {cat.name}</option>
              ))}
            </select>

            {/* Description Input */}
            <input
              type="text"
              placeholder="Descripción"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#FEF6F0] border-2 border-[#F0DCE4] text-[#1A0A0E] mb-4 focus:border-[#E8436A] outline-none"
            />

            {/* Amount Input */}
            <input
              type="number"
              placeholder="Monto (S/)"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#FEF6F0] border-2 border-[#F0DCE4] text-[#1A0A0E] mb-4 focus:border-[#E8436A] outline-none"
            />

            <button onClick={addTransaction} className="btn-gradient w-full py-3 text-lg">
              + Agregar
            </button>
          </div>
        </div>

        {/* Meta financiera */}
        <div className="card-finfemina p-6 mb-8" style={{ background: 'linear-gradient(135deg, #FEF3DB 0%, #FFEEE6 100%)', borderColor: '#F5A623' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🎯</span>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1A0A0E]">Fondo de emergencia</h3>
              <p className="text-sm text-[#9E7A82]">Tu meta de ahorro actual</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-serif text-3xl font-bold text-[#F5A623]">S/ {goalCurrent.toLocaleString()}</span>
            <span className="text-[#9E7A82]">/ S/ {goalTarget.toLocaleString()}</span>
          </div>
          <div className="h-4 rounded-full bg-white mb-3">
            <div 
              className="h-full rounded-full" 
              style={{ width: `${goalProgress}%`, background: 'linear-gradient(90deg, #F5A623, #FF8C5A)' }} 
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#1A0A0E] font-semibold">{Math.round(goalProgress)}% completado</span>
            <span className="text-[#9E7A82]">Ahorrar S/ 258/mes → meta en 6 meses</span>
          </div>
        </div>

        {/* Movimientos recientes */}
        <div className="card-finfemina p-6">
          <h2 className="font-serif text-xl font-bold text-[#1A0A0E] mb-6">Movimientos recientes</h2>
          <div className="flex flex-col divide-y divide-[#F0DCE4]">
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
                      <div className="font-medium text-[#1A0A0E]">{t.description}</div>
                      <div className="text-xs text-[#9E7A82]">{cat.name} • {t.date}</div>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'ingreso' ? 'text-[#1DB985]' : 'text-[#E8436A]'}`}>
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

  const data = tab === 'tarjetas' ? CREDIT_CARDS : SAVINGS_ACCOUNTS
  const recommended = data.find(d => d.recommended)

  return (
    <div className="min-h-screen pt-[68px]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-[#1A0A0E]">Comparador</h1>
          <p className="text-[#9E7A82]">Encuentra el mejor producto financiero para ti</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab('tarjetas')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              tab === 'tarjetas' 
                ? 'bg-[#E8436A] text-white' 
                : 'bg-white border-2 border-[#F0DCE4] text-[#9E7A82] hover:border-[#E8436A]'
            }`}
          >
            💳 Tarjetas de crédito
          </button>
          <button
            onClick={() => setTab('cuentas')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              tab === 'cuentas' 
                ? 'bg-[#E8436A] text-white' 
                : 'bg-white border-2 border-[#F0DCE4] text-[#9E7A82] hover:border-[#E8436A]'
            }`}
          >
            🏦 Cuentas de ahorro
          </button>
        </div>

        {/* Best Pick Banner */}
        {recommended && (
          <div 
            className="p-4 rounded-2xl mb-8 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #FEF3DB 0%, #FFEEE6 100%)', border: '2px solid #F5A623' }}
          >
            <span className="text-3xl">🏆</span>
            <span className="font-semibold text-[#1A0A0E]">
              Mejor opción para ti: <span className="text-[#F5A623]">{recommended.bank} {recommended.product}</span>
            </span>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {data.map((item, i) => (
            <div key={i} className="relative">
              {item.recommended && (
                <div className="absolute -top-3 left-4 z-10 px-3 py-1 rounded-full text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #E8436A, #FF8C5A)' }}>
                  ⭐ Recomendado
                </div>
              )}
              <div className={`card-finfemina overflow-hidden ${item.recommended ? 'ring-2 ring-[#E8436A]' : ''}`}>
                {/* Header */}
                <div className="p-4 flex items-center gap-3 border-b border-[#F0DCE4]">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: item.bankColor }}
                  >
                    {item.bank.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-bold text-[#1A0A0E]">{item.bank}</div>
                    <div className="text-sm text-[#9E7A82]">{item.product}</div>
                  </div>
                </div>

                {/* Data */}
                <div className="p-4 bg-[#FEF6F0]">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[#9E7A82]">{tab === 'tarjetas' ? 'Tasa' : 'TEA'}</span>
                    <span className="font-bold text-[#E8436A]">{item.rate}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[#9E7A82]">Membresía</span>
                    <span className="font-semibold text-[#1A0A0E]">{item.fee}</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="p-4">
                  <div className="p-3 rounded-xl bg-[#F0EBFE] text-sm text-[#8B5CF6]">
                    {item.benefits}
                  </div>
                </div>

                {/* Score (only for credit cards) */}
                {tab === 'tarjetas' && 'score' in item && (
                  <div className="px-4 pb-4">
                    <div className="text-xs text-[#9E7A82] mb-1">Score FinFémina</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-[#FEE7ED]">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${item.score}%`,
                            backgroundColor: item.score >= 85 ? '#1DB985' : item.score >= 75 ? '#F5A623' : '#E8436A'
                          }}
                        />
                      </div>
                      <span className="font-bold text-[#1A0A0E]">{item.score}/100</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-[#9E7A82]">
          📌 Datos referenciales. Verifica en <a href="https://sbs.gob.pe" className="text-[#E8436A] underline" target="_blank" rel="noopener noreferrer">sbs.gob.pe</a>
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
          className="rounded-3xl p-8 mb-12"
          style={{ background: 'linear-gradient(135deg, #FEE7ED 0%, #FFEEE6 50%, #FEF3DB 100%)' }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className={`w-24 h-24 rounded-full ${currentLevelColors.light} ${currentLevelColors.border} border-4 flex items-center justify-center text-5xl animate-pulse-soft`}>
              {currentLevel.emoji}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="text-sm text-[#9E7A82] mb-1">Tu nivel actual</div>
              <h1 className="font-serif text-3xl font-bold text-[#1A0A0E] mb-2">{currentLevel.name}</h1>
              <div className="font-serif text-4xl font-bold gradient-text mb-4">{points} pts</div>
              <div className="max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#9E7A82]">Progreso a {nextLevel.name}</span>
                  <span className="text-[#E8436A] font-semibold">Faltan {pointsToNext} pts</span>
                </div>
                <div className="h-3 rounded-full bg-white">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${progressToNext}%`, background: 'linear-gradient(90deg, #E8436A, #FF8C5A)' }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to earn points */}
        <h2 className="font-serif text-2xl font-bold text-[#1A0A0E] mb-6">¿Cómo ganar puntos?</h2>
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
              <div className="w-12 h-12 rounded-xl bg-[#FEE7ED] flex items-center justify-center text-2xl">
                {item.emoji}
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#1A0A0E]">{item.action}</div>
              </div>
              <div className="font-bold gradient-text">+{item.points} pts</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <h2 className="font-serif text-2xl font-bold text-[#1A0A0E] mb-6">Insignias</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {BADGES.map((badge) => (
            <div 
              key={badge.id} 
              className={`rounded-2xl p-6 text-center transition-all ${
                badge.earned 
                  ? 'border-2 border-[#F5A623]' 
                  : 'bg-[#FEF6F0] border-2 border-[#F0DCE4] opacity-55'
              }`}
              style={badge.earned ? { background: 'linear-gradient(135deg, #FEF3DB 0%, #FFEEE6 100%)' } : {}}
            >
              <div className={`text-4xl mb-3 ${!badge.earned ? 'grayscale' : ''}`}>{badge.emoji}</div>
              <div className="font-semibold text-[#1A0A0E] text-sm mb-2">{badge.name}</div>
              {badge.earned ? (
                <div className="inline-flex px-3 py-1 rounded-full bg-[#E6F9F2] text-[#1DB985] text-xs font-semibold">
                  ✅ Obtenida
                </div>
              ) : (
                <div className="inline-flex px-3 py-1 rounded-full bg-[#F0DCE4] text-[#9E7A82] text-xs font-semibold">
                  🔒 Bloqueada
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Passport Banner */}
        <div 
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #E8436A 0%, #FF8C5A 50%, #F5A623 100%)' }}
        >
          <div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute top-8 right-16 text-5xl animate-float">🛂</div>
          
          <h2 className="font-serif text-3xl font-bold text-white mb-2">Pasaporte Financiero Digital</h2>
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
          
          <button className="px-6 py-3 rounded-xl bg-white text-[#E8436A] font-bold hover:shadow-lg transition-all">
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
        className="fixed bottom-6 right-6 z-50 w-[62px] h-[62px] rounded-full flex items-center justify-center text-2xl text-white shadow-lg transition-all hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #E8436A 0%, #FF8C5A 100%)', border: '3px solid white' }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[370px] h-[530px] rounded-3xl overflow-hidden shadow-2xl flex flex-col bg-white animate-slideIn">
          {/* Header */}
          <div className="p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #E8436A 0%, #FF8C5A 100%)' }}>
            <div className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-xl">
              🤖
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">Asistente FinFémina</div>
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#1DB985] animate-blink" />
                En línea 24/7
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-[#9E7A82] text-sm text-center mb-4">
                  ¡Hola! Soy tu asistente financiera. ¿En qué puedo ayudarte?
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(sug)}
                      className="px-3 py-2 rounded-xl bg-[#FEE7ED] text-[#E8436A] text-sm font-medium hover:bg-[#E8436A] hover:text-white transition-all"
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
                      ? 'text-white rounded-br-sm' 
                      : 'bg-[#FEF6F0] text-[#1A0A0E] rounded-bl-sm'
                  }`}
                  style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #E8436A, #FF8C5A)' } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#FEF6F0] p-3 rounded-2xl rounded-bl-sm flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#E8436A] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#E8436A] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#E8436A] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#F0DCE4]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 p-3 rounded-xl bg-[#FEF6F0] border-2 border-[#F0DCE4] text-[#1A0A0E] text-sm focus:border-[#E8436A] outline-none"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg, #E8436A 0%, #FF8C5A 100%)' }}
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
    <footer className="bg-white border-t-2 border-[#E8436A]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo Column */}
          <div>
            <Logo />
            <p className="text-[#9E7A82] text-sm mt-4 mb-3">
              Empoderamiento financiero para mujeres peruanas.
            </p>
            <div className="text-sm text-[#9E7A82]">🇵🇪 Lima, Perú</div>
            <div className="text-sm text-[#E8436A] mt-1">hola@finfemina.pe</div>
          </div>

          {/* Producto */}
          <div>
            <h4 className="font-bold text-[#1A0A0E] mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-[#9E7A82]">
              <li><button className="hover:text-[#E8436A] transition-colors">Inicio</button></li>
              <li><button className="hover:text-[#E8436A] transition-colors">Aprende</button></li>
              <li><button className="hover:text-[#E8436A] transition-colors">Tracker</button></li>
              <li><button className="hover:text-[#E8436A] transition-colors">Comparar</button></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-bold text-[#1A0A0E] mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm text-[#9E7A82]">
              <li><button className="hover:text-[#E8436A] transition-colors">Logros</button></li>
              <li><a href="https://sbs.gob.pe" target="_blank" rel="noopener noreferrer" className="hover:text-[#E8436A] transition-colors">SBS Perú</a></li>
              <li><button className="hover:text-[#E8436A] transition-colors">Blog financiero</button></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-bold text-[#1A0A0E] mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-[#9E7A82]">
              <li><button className="hover:text-[#E8436A] transition-colors">Acerca de</button></li>
              <li><button className="hover:text-[#E8436A] transition-colors">Privacidad</button></li>
              <li><button className="hover:text-[#E8436A] transition-colors">Términos</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-[#F0DCE4] text-center text-sm text-[#9E7A82]">
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
    <div className="min-h-screen bg-[#FEF6F0] relative">
      <BackgroundBlobs />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="relative z-10">
        {activeTab === 'inicio' && <InicioPage />}
        {activeTab === 'aprende' && <AprendePage points={points} setPoints={setPoints} />}
        {activeTab === 'tracker' && <TrackerPage />}
        {activeTab === 'comparar' && <CompararPage />}
        {activeTab === 'logros' && <LogrosPage points={points} />}
      </main>

      <Footer />
      <AIChatWidget />
    </div>
  )
}
