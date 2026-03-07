'use client'

import { useState, useEffect, useRef, useCallback, createContext, useContext, useReducer, type ReactNode } from 'react'

// ============ TYPES ============
type Tab = 'inicio' | 'aprende' | 'tracker' | 'comparar' | 'logros'
type Mode = 'claro' | 'cercano'
type CategoryFilter = 'todos' | 'dinero' | 'tarjetas' | 'errores' | 'invertir'
type PeriodFilter = 'semana' | 'mes' | 'semestre' | 'año'
type CompareTab = 'tarjetas' | 'cuentas'
type CompareSubTab = 'credito' | 'debito' | 'ahorro' | 'sueldo' | 'cts'
type CreditLevel = 'basico' | 'intermedio' | 'premium' | 'exclusivo'
type ChartType = 'barras' | 'circular' | 'tendencia' | 'arbol'
type ToastType = 'success' | 'error' | 'info' | 'warning'
type Occupation = 'estudiante' | 'trabajando' | 'freelancer'

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  level: number
  points: number
  createdAt: string
  mode: Mode
  occupation: Occupation
  age: number
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
}

type AuthAction = 
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_LOADING'; payload: boolean }

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
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

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface VideoContent {
  title: string
  duration: string
  slides: {
    emoji: string
    headline: string
    body: string
    tip: string
  }[]
  keyTakeaway: string
  relatedTopics: string[]
}

interface PointsAnimation {
  id: string
  amount: number
  x: number
  y: number
}

// ============ AUTH CONTEXT ============
const AuthContext = createContext<{
  state: AuthState
  dispatch: React.Dispatch<AuthAction>
  login: (user: User) => void
  logout: () => void
  updatePoints: (points: number) => void
} | null>(null)

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { isAuthenticated: true, user: action.payload, isLoading: false }
    case 'LOGOUT':
      return { isAuthenticated: false, user: null, isLoading: false }
    case 'UPDATE_USER':
      return state.user ? { ...state, user: { ...state.user, ...action.payload } } : state
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    isLoading: true,
  })

  // Rehydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('finfemina_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        dispatch({ type: 'LOGIN', payload: user })
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const login = useCallback((user: User) => {
    localStorage.setItem('finfemina_user', JSON.stringify(user))
    dispatch({ type: 'LOGIN', payload: user })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('finfemina_user')
    dispatch({ type: 'LOGOUT' })
  }, [])

  const updatePoints = useCallback((points: number) => {
    dispatch({ type: 'UPDATE_USER', payload: { points } })
    if (state.user) {
      const updated = { ...state.user, points }
      localStorage.setItem('finfemina_user', JSON.stringify(updated))
    }
  }, [state.user])

  return (
    <AuthContext.Provider value={{ state, dispatch, login, logout, updatePoints }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

// ============ TOAST CONTEXT ============
const ToastContext = createContext<{
  toasts: Toast[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
} | null>(null)

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
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
  { id: 5, name: 'Líder financiera', emoji: '👑', color: 'rose', points: 6000 },
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

// Toast Container
function ToastContainer() {
  const { toasts, removeToast } = useToast()
  
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return { border: 'border-l-[#2DBD96]', icon: '✅' }
      case 'error': return { border: 'border-l-[#D63F74]', icon: '❌' }
      case 'info': return { border: 'border-l-[#9B72CF]', icon: '💜' }
      case 'warning': return { border: 'border-l-[#E9A23B]', icon: '⚠️' }
    }
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type)
        return (
          <div
            key={toast.id}
            className={`w-80 bg-white rounded-2xl shadow-lg border-l-4 ${styles.border} p-4 animate-slideIn`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{styles.icon}</span>
              <p className="flex-1 text-sm text-[#1C0E1A]">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="text-[#B08DA8] hover:text-[#D63F74]">
                ✕
              </button>
            </div>
            <div className="mt-2 h-1 bg-[#EDD9EA] rounded-full overflow-hidden">
              <div className="h-full gradient-signature animate-shrink" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Points Animation
function PointsAnimationOverlay({ animations, onComplete }: { animations: PointsAnimation[], onComplete: (id: string) => void }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {animations.map((anim) => (
        <div
          key={anim.id}
          className="absolute font-serif text-xl font-black gradient-signature-text animate-points-float"
          style={{ left: anim.x, top: anim.y }}
          onAnimationEnd={() => onComplete(anim.id)}
        >
          +{anim.amount} pts
        </div>
      ))}
    </div>
  )
}

// Confetti Component - Lightweight version with CSS-only animation
function Confetti() {
  const pieces = [10, 25, 40, 55, 70, 85, 15, 35, 60, 80] // Fixed positions
  return (
    <div className="fixed inset-0 pointer-events-none z-[9997] overflow-hidden">
      {pieces.map((left, i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 animate-confetti"
          style={{
            left: `${left}%`,
            backgroundColor: ['#D63F74', '#9B72CF', '#F4A261', '#2DBD96', '#5B9BD5'][i % 5],
            borderRadius: i % 2 === 0 ? '50%' : '0',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

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

// Auth Modal
function AuthModal({ isOpen, onClose, defaultTab = 'register' }: { isOpen: boolean; onClose: () => void; defaultTab?: 'register' | 'login' }) {
  const [tab, setTab] = useState<'register' | 'login'>(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const { login } = useAuth()
  const { addToast } = useToast()

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    email: '',
    password: '',
    age: '',
    occupation: '' as Occupation | '',
    mode: 'claro' as Mode,
  })
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false })
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const handlePasswordChange = (password: string) => {
    setRegisterForm({ ...registerForm, password })
    setPasswordStrength(calculatePasswordStrength(password))
  }

  const handleRegisterSubmit = async () => {
    const errors: Record<string, string> = {}
    if (!registerForm.firstName.trim()) errors.firstName = 'Ingresa tu nombre'
    if (!validateEmail(registerForm.email)) errors.email = 'Ingresa un email válido'
    if (registerForm.password.length < 8) errors.password = 'Mínimo 8 caracteres'
    if (!registerForm.age || parseInt(registerForm.age) < 16 || parseInt(registerForm.age) > 35) errors.age = 'Edad entre 16 y 35'
    if (!registerForm.occupation) errors.occupation = 'Selecciona una opción'

    setRegisterErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1200))

    const newUser: User = {
      id: Date.now().toString(),
      name: registerForm.firstName,
      email: registerForm.email,
      avatar: null,
      level: 1,
      points: 0,
      createdAt: new Date().toISOString(),
      mode: registerForm.mode,
      occupation: registerForm.occupation as Occupation,
      age: parseInt(registerForm.age),
    }

    setIsLoading(false)
    setShowSuccess(true)
    setShowConfetti(true)
    
    setTimeout(() => {
      login(newUser)
      addToast('success', `¡Bienvenida a FinFémina, ${newUser.name}! 🎉`)
      onClose()
      setShowSuccess(false)
      setShowConfetti(false)
    }, 2000)
  }

  const handleLoginSubmit = async () => {
    const errors: Record<string, string> = {}
    if (!validateEmail(loginForm.email)) errors.email = 'Ingresa un email válido'
    if (!loginForm.password) errors.password = 'Ingresa tu contraseña'

    setLoginErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1200))

    // Demo account check
    if (loginForm.email === 'demo@finfemina.pe' && loginForm.password === 'demo1234') {
      const demoUser: User = {
        id: 'demo',
        name: 'Valeria',
        email: 'demo@finfemina.pe',
        avatar: null,
        level: 2,
        points: 1240,
        createdAt: '2024-01-01',
        mode: 'cercano',
        occupation: 'trabajando',
        age: 24,
      }
      login(demoUser)
      addToast('info', `¡Hola de nuevo, ${demoUser.name}! 💜`)
      onClose()
    } else {
      // For demo, accept any valid-looking credentials
      const user: User = {
        id: Date.now().toString(),
        name: loginForm.email.split('@')[0],
        email: loginForm.email,
        avatar: null,
        level: 1,
        points: 0,
        createdAt: new Date().toISOString(),
        mode: 'claro',
        occupation: 'trabajando',
        age: 25,
      }
      login(user)
      addToast('info', `¡Hola de nuevo, ${user.name}! 💜`)
      onClose()
    }
    setIsLoading(false)
  }

  if (!isOpen) return null

  return (
    <>
      {showConfetti && <Confetti />}
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(28,14,26,0.7)' }}
      >
        <div 
          className="relative w-full max-w-[520px] md:max-w-[900px] bg-white rounded-[28px] overflow-hidden animate-fadeIn"
          style={{ border: '1.5px solid #EDD9EA', boxShadow: '0 16px 48px rgba(214,63,116,0.12)' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#F0E8FD] text-[#9B72CF] flex items-center justify-center hover:bg-[#E0D4F7] transition-all"
          >
            ✕
          </button>

          {showSuccess ? (
            // Success State
            <div className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#E4F7F1] flex items-center justify-center">
                <svg className="w-12 h-12 text-[#2DBD96] animate-draw-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="font-serif text-3xl font-black text-[#1C0E1A] mb-2">
                ¡Bienvenida, {registerForm.firstName}! 🎉
              </h2>
              <p className="text-[#6B3F5E]">Tu cuenta ha sido creada. Prepárate para transformar tus finanzas.</p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Left Panel (Desktop only) */}
              <div className="hidden md:flex md:w-[45%] gradient-signature p-8 flex-col justify-between relative overflow-hidden">
                <div>
                  <h2 className="font-serif text-3xl font-black text-white italic mb-8">
                    Tu viaje financiero empieza aquí 💜
                  </h2>
                  <div className="space-y-4">
                    {[
                      'Aprende con videos y quizzes',
                      'Rastrea tus finanzas',
                      'Obtén tu Pasaporte Financiero',
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3 text-white">
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">✓</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-white/80 text-sm">Más de 2,300 mujeres ya empezaron</p>
              </div>

              {/* Right Panel (Form) */}
              <div className="flex-1 p-6 md:p-8">
                {/* Tab Switcher */}
                <div className="flex p-1.5 rounded-full bg-[#FDE8F0] mb-6">
                  <button
                    onClick={() => setTab('register')}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                      tab === 'register' ? 'gradient-signature text-white' : 'text-[#6B3F5E]'
                    }`}
                  >
                    Crear cuenta
                  </button>
                  <button
                    onClick={() => setTab('login')}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                      tab === 'login' ? 'gradient-signature text-white' : 'text-[#6B3F5E]'
                    }`}
                  >
                    Iniciar sesión
                  </button>
                </div>

                {tab === 'register' ? (
                  // Register Form
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-[#1C0E1A] mb-1">Crea tu cuenta gratis</h3>
                      <p className="text-sm text-[#6B3F5E]">Toma solo 2 minutos. Sin tarjeta de crédito.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#1C0E1A] mb-1">¿Cómo te llamas? 😊</label>
                      <input
                        type="text"
                        placeholder="Tu nombre (ej. Valeria)"
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                        className={`w-full p-3 rounded-xl border-2 ${registerErrors.firstName ? 'border-[#D63F74] animate-shake' : 'border-[#EDD9EA]'} bg-[#FDFAF8] text-[#1C0E1A]`}
                      />
                      {registerErrors.firstName && <p className="text-xs text-[#D63F74] mt-1">{registerErrors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#1C0E1A] mb-1">Tu correo electrónico 📧</label>
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className={`w-full p-3 rounded-xl border-2 ${registerErrors.email ? 'border-[#D63F74] animate-shake' : 'border-[#EDD9EA]'} bg-[#FDFAF8] text-[#1C0E1A]`}
                      />
                      {registerErrors.email && <p className="text-xs text-[#D63F74] mt-1">{registerErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#1C0E1A] mb-1">Crea una contraseña 🔒</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 8 caracteres"
                          value={registerForm.password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          className={`w-full p-3 pr-12 rounded-xl border-2 ${registerErrors.password ? 'border-[#D63F74] animate-shake' : 'border-[#EDD9EA]'} bg-[#FDFAF8] text-[#1C0E1A]`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B3F5E]"
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i < passwordStrength
                                ? ['bg-[#D63F74]', 'bg-[#F4A261]', 'bg-[#2DBD96]', 'bg-gradient-to-r from-[#D63F74] to-[#9B72CF]'][passwordStrength - 1]
                                : 'bg-[#EDD9EA]'
                            }`}
                          />
                        ))}
                      </div>
                      {registerErrors.password && <p className="text-xs text-[#D63F74] mt-1">{registerErrors.password}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#1C0E1A] mb-1">Edad 🎂</label>
                        <input
                          type="number"
                          min="16"
                          max="35"
                          placeholder="25"
                          value={registerForm.age}
                          onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })}
                          className={`w-full p-3 rounded-xl border-2 ${registerErrors.age ? 'border-[#D63F74] animate-shake' : 'border-[#EDD9EA]'} bg-[#FDFAF8] text-[#1C0E1A]`}
                        />
                        {registerErrors.age && <p className="text-xs text-[#D63F74] mt-1">{registerErrors.age}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#1C0E1A] mb-1">¿Cómo te describes? ✨</label>
                        <div className="flex gap-1">
                          {[
                            { id: 'estudiante', emoji: '👩‍🎓' },
                            { id: 'trabajando', emoji: '💼' },
                            { id: 'freelancer', emoji: '🚀' },
                          ].map((occ) => (
                            <button
                              key={occ.id}
                              type="button"
                              onClick={() => setRegisterForm({ ...registerForm, occupation: occ.id as Occupation })}
                              className={`flex-1 p-2 rounded-xl text-center transition-all ${
                                registerForm.occupation === occ.id
                                  ? 'bg-[#FDE8F0] border-2 border-[#D63F74]'
                                  : 'bg-[#FDFAF8] border-2 border-[#EDD9EA]'
                              }`}
                            >
                              {occ.emoji}
                            </button>
                          ))}
                        </div>
                        {registerErrors.occupation && <p className="text-xs text-[#D63F74] mt-1">{registerErrors.occupation}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#1C0E1A] mb-2">¿Cómo prefieres aprender?</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'claro', emoji: '📚', name: 'Modo Claro', desc: 'Directo y preciso' },
                          { id: 'cercano', emoji: '💅', name: 'Modo Cercano', desc: 'Como entre amigas' },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setRegisterForm({ ...registerForm, mode: mode.id as Mode })}
                            className={`p-4 rounded-xl text-left transition-all ${
                              registerForm.mode === mode.id
                                ? 'bg-[#F0E8FD] border-2 border-[#9B72CF]'
                                : 'bg-[#FDFAF8] border-2 border-[#EDD9EA]'
                            }`}
                          >
                            <div className="text-xl mb-1">{mode.emoji}</div>
                            <div className="font-bold text-[#1C0E1A] text-sm">{mode.name}</div>
                            <div className="text-xs text-[#6B3F5E]">{mode.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleRegisterSubmit}
                      disabled={isLoading}
                      className="w-full py-4 rounded-2xl text-white font-extrabold text-lg gradient-signature disabled:opacity-70"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creando tu cuenta...
                        </span>
                      ) : (
                        'Crear mi cuenta →'
                      )}
                    </button>

                    <p className="text-xs text-center text-[#B08DA8]">
                      Al crear tu cuenta aceptas los <button className="text-[#D63F74]">Términos</button> y la <button className="text-[#D63F74]">Política de privacidad</button>
                    </p>
                  </div>
                ) : (
                  // Login Form
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-[#1C0E1A] mb-1">¡Hola de nuevo!</h3>
                      <p className="text-sm text-[#6B3F5E]">Ingresa a tu cuenta para continuar.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#1C0E1A] mb-1">Tu correo electrónico</label>
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className={`w-full p-3 rounded-xl border-2 ${loginErrors.email ? 'border-[#D63F74] animate-shake' : 'border-[#EDD9EA]'} bg-[#FDFAF8] text-[#1C0E1A]`}
                      />
                      {loginErrors.email && <p className="text-xs text-[#D63F74] mt-1">{loginErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#1C0E1A] mb-1">Tu contraseña</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Tu contraseña"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className={`w-full p-3 pr-12 rounded-xl border-2 ${loginErrors.password ? 'border-[#D63F74] animate-shake' : 'border-[#EDD9EA]'} bg-[#FDFAF8] text-[#1C0E1A]`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B3F5E]"
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                      {loginErrors.password && <p className="text-xs text-[#D63F74] mt-1">{loginErrors.password}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={loginForm.remember}
                          onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${loginForm.remember ? 'bg-[#D63F74] border-[#D63F74]' : 'border-[#EDD9EA]'}`}>
                          {loginForm.remember && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-sm text-[#6B3F5E]">Recordarme</span>
                      </label>
                      <button className="text-sm text-[#9B72CF] font-medium">¿Olvidaste tu contraseña?</button>
                    </div>

                    <button
                      onClick={handleLoginSubmit}
                      disabled={isLoading}
                      className="w-full py-4 rounded-2xl text-white font-extrabold text-lg gradient-signature disabled:opacity-70"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Iniciando sesión...
                        </span>
                      ) : (
                        'Iniciar sesión →'
                      )}
                    </button>

                    {/* Demo credentials */}
                    <div className="p-4 rounded-xl bg-[#E4F7F1] border border-[#2DBD96]">
                      <p className="text-sm font-bold text-[#1C0E1A] mb-1">Cuenta demo:</p>
                      <p className="text-sm text-[#6B3F5E]">demo@finfemina.pe / demo1234</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// User Dropdown
function UserDropdown({ onLogout, setActiveTab }: { onLogout: () => void; setActiveTab: (tab: Tab) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const { state } = useAuth()
  const { addToast } = useToast()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    const name = state.user?.name || ''
    onLogout()
    addToast('info', `Hasta pronto, ${name} 👋`)
    setIsOpen(false)
  }

  if (!state.user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <div className="w-9 h-9 rounded-full gradient-signature flex items-center justify-center text-white font-bold text-sm">
          {state.user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block text-sm font-bold text-[#1C0E1A]">{state.user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#EDD9EA] py-2 animate-fadeUp">
          <button
            onClick={() => { setActiveTab('logros'); setIsOpen(false) }}
            className="w-full px-4 py-2 text-left text-sm text-[#1C0E1A] hover:bg-[#FDE8F0]"
          >
            👤 Mi perfil
          </button>
          <button
            onClick={() => { setActiveTab('logros'); setIsOpen(false) }}
            className="w-full px-4 py-2 text-left text-sm text-[#1C0E1A] hover:bg-[#FDE8F0]"
          >
            🏆 Mis logros
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-[#1C0E1A] hover:bg-[#FDE8F0]">
            ⚙️ Configuración
          </button>
          <hr className="my-2 border-[#EDD9EA]" />
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-sm text-[#D63F74] hover:bg-[#FDE8F0]"
          >
            Cerrar sesión →
          </button>
        </div>
      )}
    </div>
  )
}

// Navigation Component
function Navigation({ 
  activeTab, 
  setActiveTab, 
  onAuthClick 
}: { 
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  onAuthClick: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { state, logout } = useAuth()

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

        {/* Desktop CTA / User */}
        <div className="hidden md:block">
          {state.isAuthenticated ? (
            <UserDropdown onLogout={logout} setActiveTab={setActiveTab} />
          ) : (
            <button onClick={onAuthClick} className="btn-gradient px-5 py-2.5 text-sm">
              Comenzar gratis 💜
            </button>
          )}
        </div>

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
            {state.isAuthenticated ? (
              <button onClick={logout} className="px-4 py-3 rounded-xl text-left font-bold text-[#D63F74]">
                Cerrar sesión →
              </button>
            ) : (
              <button onClick={onAuthClick} className="btn-gradient px-5 py-3 mt-2 text-sm">
                Comenzar gratis 💜
              </button>
            )}
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

// Auth Guard Overlay
function AuthGuard({ message, onAuthClick }: { message: string; onAuthClick: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px] overflow-hidden">
      <div className="absolute inset-0 bg-white/90" />
      <div className="relative text-center p-6">
        <p className="text-[#6B3F5E] mb-4">{message}</p>
        <button onClick={onAuthClick} className="btn-gradient px-6 py-3 text-sm">
          Crear cuenta gratis
        </button>
      </div>
    </div>
  )
}

// Tour Overlay
function TourOverlay({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const steps = [
    { target: 'nav', title: '5 secciones para tu vida financiera', desc: 'Navega fácilmente entre todas las herramientas.' },
    { target: 'tracker', title: 'Registra tu dinero aquí', desc: 'Controla tus ingresos y gastos con gráficos visuales.' },
    { target: 'learn', title: 'Videos de 60s + quizzes', desc: 'Aprende finanzas de forma divertida y gana puntos.' },
    { target: 'compare', title: 'Datos reales de la SBS', desc: 'Compara tarjetas y cuentas con información oficial.' },
    { target: 'passport', title: 'Tu credencial financiera', desc: 'Completa el programa y obtén tu Pasaporte Financiero.' },
  ]

  const currentStep = steps[step]

  return (
    <div className="fixed inset-0 z-[200]" style={{ background: 'rgba(28,14,26,0.72)' }}>
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 text-white/80 hover:text-white text-sm font-medium"
      >
        Saltar tour ✕
      </button>

      {/* Tooltip */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="gradient-signature p-6 rounded-2xl text-white max-w-sm animate-fadeUp">
          <h3 className="font-serif text-xl font-bold mb-2">{currentStep.title}</h3>
          <p className="text-white/90 mb-4">{currentStep.desc}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
            <button
              onClick={onNext}
              className="px-4 py-2 rounded-xl bg-white text-[#D63F74] font-bold text-sm"
            >
              {step === steps.length - 1 ? 'Terminar' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ INICIO PAGE ============
function InicioPage({ onAuthClick, setActiveTab, onStartTour }: { onAuthClick: () => void; setActiveTab: (tab: Tab) => void; onStartTour: () => void }) {
  const [mode, setMode] = useState<Mode>('claro')
  const { state } = useAuth()

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

  const handleStartClick = () => {
    if (state.isAuthenticated) {
      setActiveTab('aprende')
    } else {
      onAuthClick()
    }
  }

  const handleDemoClick = () => {
    if (state.isAuthenticated) {
      onStartTour()
    } else {
      onAuthClick()
    }
  }

  const handlePassportClick = () => {
    if (state.isAuthenticated) {
      setActiveTab('logros')
    } else {
      onAuthClick()
    }
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
            <button onClick={handleStartClick} className="btn-gradient px-8 py-4 text-lg">
              Empezar gratis ✨
            </button>
            <button onClick={handleDemoClick} className="px-8 py-4 rounded-2xl border-2 border-[#D63F74] text-[#D63F74] font-extrabold hover:bg-[#FDE8F0] transition-all">
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
          <button onClick={handlePassportClick} className="px-8 py-4 rounded-2xl bg-white text-[#D63F74] font-extrabold hover:shadow-lg transition-all">
            Obtener mi Pasaporte Financiero 🚀
          </button>
        </div>
      </section>
    </div>
  )
}

// ============ APRENDE PAGE ============
function AprendePage({ 
  onAuthClick,
  onEarnPoints,
}: { 
  onAuthClick: () => void
  onEarnPoints: (amount: number, x: number, y: number) => void
}) {
  const { state } = useAuth()
  const { addToast } = useToast()
  const [filter, setFilter] = useState<CategoryFilter>('todos')
  const [quiz, setQuiz] = useState<QuizState>({ isOpen: false, videoId: null, answered: false, selectedAnswer: null, correctAnswer: 0 })
  const [streak, setStreak] = useState(5)
  const [watchedVideos, setWatchedVideos] = useState<Set<number>>(new Set())
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; videoId: number | null; content: VideoContent | null; isLoading: boolean; currentSlide: number; isPlaying: boolean }>({
    isOpen: false,
    videoId: null,
    content: null,
    isLoading: false,
    currentSlide: 0,
    isPlaying: true,
  })
  
  const weekDays = [true, true, true, true, true, false, false]
  const userPoints = state.user?.points || 0

  const filteredVideos = filter === 'todos' ? VIDEOS : VIDEOS.filter(v => v.category === filter)

  const categoryColors: Record<string, string> = {
    dinero: 'sage',
    tarjetas: 'lilac',
    errores: 'peach',
    invertir: 'sky',
  }

  const openQuiz = (videoId: number) => {
    if (!state.isAuthenticated) {
      onAuthClick()
      return
    }
    const q = QUIZ_QUESTIONS[videoId]
    setQuiz({ isOpen: true, videoId, answered: false, selectedAnswer: null, correctAnswer: q.correct })
  }

  const answerQuiz = (answerIndex: number, e: React.MouseEvent) => {
    setQuiz(prev => ({ ...prev, answered: true, selectedAnswer: answerIndex }))
    if (answerIndex === quiz.correctAnswer) {
      onEarnPoints(50, e.clientX, e.clientY)
      setStreak(s => s + 1)
      addToast('success', '¡Respuesta correcta! +50 pts 🎉')
    } else {
      addToast('warning', 'Casi... ¡Sigue aprendiendo! 💪')
    }
  }

  const closeQuiz = () => {
    setQuiz({ isOpen: false, videoId: null, answered: false, selectedAnswer: null, correctAnswer: 0 })
  }

  const openVideoModal = async (videoId: number) => {
    if (!state.isAuthenticated) {
      onAuthClick()
      return
    }

    const video = VIDEOS.find(v => v.id === videoId)
    if (!video) return

    setVideoModal({ isOpen: true, videoId, content: null, isLoading: true, currentSlide: 0, isPlaying: true })

    try {
      const response = await fetch('/api/video-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: video.title,
          videoCategory: video.category,
          videoTip: video.tip,
          userMode: state.user?.mode || 'claro',
        }),
      })

      if (!response.ok) throw new Error('Failed to generate content')

      const data = await response.json()
      setVideoModal(prev => ({ ...prev, content: data, isLoading: false }))
    } catch {
      // Fallback content
      const fallbackContent: VideoContent = {
        title: video.title,
        duration: '2 min',
        slides: [
          { emoji: '📚', headline: '¿Qué aprenderás hoy?', body: video.tip, tip: 'Toma notas si te ayuda' },
          { emoji: video.emoji, headline: 'Concepto clave', body: `${video.title} es fundamental para tu educación financiera.`, tip: 'Guarda este concepto' },
          { emoji: '💡', headline: '¿Cómo te afecta?', body: 'Entender este tema te ayudará a tomar mejores decisiones con tu dinero.', tip: 'Aplícalo hoy mismo' },
          { emoji: '🚀', headline: '¿Qué hacer ahora?', body: 'Completa el quiz para ganar puntos y reforzar lo aprendido.', tip: '¡Tú puedes!' },
        ],
        keyTakeaway: video.tip,
        relatedTopics: ['Ahorro', 'Presupuesto', 'Crédito'],
      }
      setVideoModal(prev => ({ ...prev, content: fallbackContent, isLoading: false }))
    }
  }

  const markVideoAsWatched = (videoId: number, e: React.MouseEvent) => {
    if (!watchedVideos.has(videoId)) {
      setWatchedVideos(prev => new Set([...prev, videoId]))
      onEarnPoints(30, e.clientX, e.clientY)
      addToast('success', '¡Video completado! +30 pts ✨')
    }
  }

  // Auto-advance slides
  useEffect(() => {
    if (!videoModal.isOpen || !videoModal.content || !videoModal.isPlaying) return

    const timer = setInterval(() => {
      setVideoModal(prev => {
        if (prev.currentSlide < (prev.content?.slides.length || 0) - 1) {
          return { ...prev, currentSlide: prev.currentSlide + 1 }
        }
        return { ...prev, isPlaying: false }
      })
    }, 4000)

    return () => clearInterval(timer)
  }, [videoModal.isOpen, videoModal.content, videoModal.isPlaying, videoModal.currentSlide])

  // Keyboard support for video modal
  useEffect(() => {
    if (!videoModal.isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVideoModal(prev => ({ ...prev, isOpen: false }))
      } else if (e.key === 'ArrowRight' && videoModal.content) {
        setVideoModal(prev => ({
          ...prev,
          currentSlide: Math.min(prev.currentSlide + 1, (prev.content?.slides.length || 1) - 1),
          isPlaying: false,
        }))
      } else if (e.key === 'ArrowLeft') {
        setVideoModal(prev => ({
          ...prev,
          currentSlide: Math.max(prev.currentSlide - 1, 0),
          isPlaying: false,
        }))
      } else if (e.key === ' ') {
        e.preventDefault()
        setVideoModal(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [videoModal.isOpen, videoModal.content])

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
              <div className="font-serif text-xl font-black gradient-signature-text">{userPoints}</div>
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
            const isWatched = watchedVideos.has(video.id)
            return (
              <div key={video.id} className="card-finfemina overflow-hidden animate-fadeUp" style={{ animationDelay: `${i * 50}ms` }}>
                {/* Thumbnail */}
                <div className={`h-[150px] ${colors.light} flex items-center justify-center relative ${isWatched ? 'opacity-80' : ''}`}>
                  <span className="text-5xl">{video.emoji}</span>
                  <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-full bg-white text-xs font-bold ${colors.text}`}>
                    {isWatched ? '✓ Visto' : `▶ ${video.duration}`}
                  </div>
                  {isWatched && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#2DBD96] flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                  )}
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => openVideoModal(video.id)}
                      className={`flex-1 py-2 rounded-xl border-2 ${colors.border} ${colors.text} font-bold text-sm hover:bg-[#FDE8F0] transition-all`}
                    >
                      ▶ Ver
                    </button>
                    <button
                      onClick={() => openQuiz(video.id)}
                      className="flex-1 py-2 rounded-xl border-2 border-[#D63F74] text-[#D63F74] font-bold text-sm hover:bg-[#FDE8F0] transition-all"
                    >
                      📝 Quiz
                    </button>
                  </div>
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
                    onClick={(e) => !quiz.answered && answerQuiz(i, e)}
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

      {/* Video Modal */}
      {videoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C0E1A]/75">
          <div 
            className="w-full max-w-[720px] rounded-[28px] overflow-hidden animate-fadeUp"
            style={{ 
              background: '#1C0E1A', 
              border: '2px solid transparent',
              backgroundImage: 'linear-gradient(#1C0E1A, #1C0E1A), linear-gradient(135deg, #D63F74, #9B72CF)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box'
            }}
          >
            {/* Video Area */}
            <div className="relative h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden">
              {videoModal.isLoading ? (
                // Loading state
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-signature animate-pulse-soft flex items-center justify-center">
                    💜
                  </div>
                  <p className="text-white/80">Femi está preparando tu clase... ✨</p>
                </div>
              ) : videoModal.content && (
                // Slide content
                <div className="text-center px-8 animate-fadeUp">
                  <div className="text-7xl mb-4 animate-float">
                    {videoModal.content.slides[videoModal.currentSlide].emoji}
                  </div>
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-white italic mb-4">
                    {videoModal.content.slides[videoModal.currentSlide].headline}
                  </h3>
                  <p className="text-white/80 max-w-md mx-auto leading-relaxed">
                    {videoModal.content.slides[videoModal.currentSlide].body}
                  </p>
                  <div className="mt-6 px-4 py-2 rounded-full gradient-signature inline-block">
                    <span className="text-white text-sm">💡 {videoModal.content.slides[videoModal.currentSlide].tip}</span>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {videoModal.content && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div 
                    className="h-full gradient-signature transition-all duration-300"
                    style={{ width: `${((videoModal.currentSlide + 1) / videoModal.content.slides.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Slide counter */}
              {videoModal.content && (
                <div className="absolute top-4 right-4 text-white/60 text-sm">
                  {videoModal.currentSlide + 1} / {videoModal.content.slides.length}
                </div>
              )}

              {/* Controls */}
              {videoModal.content && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <button
                    onClick={() => setVideoModal(prev => ({ ...prev, currentSlide: Math.max(0, prev.currentSlide - 1), isPlaying: false }))}
                    className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setVideoModal(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
                    className="w-12 h-12 rounded-full bg-white text-[#1C0E1A] flex items-center justify-center"
                  >
                    {videoModal.isPlaying ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={() => setVideoModal(prev => ({ ...prev, currentSlide: Math.min((prev.content?.slides.length || 1) - 1, prev.currentSlide + 1), isPlaying: false }))}
                    className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            {/* Bottom content area */}
            <div className="bg-white p-6">
              {videoModal.content && (
                <>
                  <div className="mb-4">
                    <h4 className="font-bold text-[#1C0E1A] mb-2">🎯 Lo más importante:</h4>
                    <p className="text-[#D63F74] font-serif text-lg">{videoModal.content.keyTakeaway}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold text-[#1C0E1A] mb-2">Sigue aprendiendo:</h4>
                    <div className="flex flex-wrap gap-2">
                      {videoModal.content.relatedTopics.map((topic, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-[#F0E8FD] text-[#9B72CF] text-sm font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        markVideoAsWatched(videoModal.videoId!, e)
                        setVideoModal(prev => ({ ...prev, isOpen: false }))
                      }}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        watchedVideos.has(videoModal.videoId!)
                          ? 'bg-[#E4F7F1] text-[#2DBD96]'
                          : 'bg-[#E4F7F1] text-[#2DBD96] hover:bg-[#D0F0E5]'
                      }`}
                    >
                      {watchedVideos.has(videoModal.videoId!) ? '✓ Marcado como visto' : 'Marcar como visto ✓'}
                    </button>
                    <button
                      onClick={() => {
                        setVideoModal(prev => ({ ...prev, isOpen: false }))
                        if (videoModal.videoId) openQuiz(videoModal.videoId)
                      }}
                      className="flex-1 py-3 rounded-xl font-bold btn-gradient"
                    >
                      📝 Hacer quiz
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => setVideoModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full mt-3 py-2 text-[#6B3F5E] font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ TRACKER PAGE ============
function TrackerPage({ onAuthClick }: { onAuthClick: () => void }) {
  const { state } = useAuth()
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

  const userName = state.user?.name || 'Usuario'

  return (
    <div className="min-h-screen pt-[68px]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl font-black text-[#1C0E1A]">Tracker Personal</h1>
            <p className="text-[#6B3F5E]">Hola, {userName} 👋 • Controla tus finanzas y alcanza tus metas</p>
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
                  {item.isPercent ? item.value : `S/ ${(item.value as number).toLocaleString()}`}
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
          <div className="card-finfemina p-6 relative">
            {!state.isAuthenticated && (
              <AuthGuard 
                message="Inicia sesión para guardar tus movimientos 💜" 
                onAuthClick={onAuthClick} 
              />
            )}
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
              <div key={goal.id} className="card-finfemina p-6 gradient-pastel relative">
                {!state.isAuthenticated && (
                  <AuthGuard 
                    message="Inicia sesión para crear metas 💜" 
                    onAuthClick={onAuthClick} 
                  />
                )}
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
function LogrosPage({ onAuthClick }: { onAuthClick: () => void }) {
  const { state } = useAuth()
  const points = state.user?.points || 0
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
          
          <button 
            onClick={() => !state.isAuthenticated && onAuthClick()}
            className="px-6 py-3 rounded-xl bg-white text-[#D63F74] font-extrabold hover:shadow-lg transition-all"
          >
            {state.isAuthenticated ? 'Ver mi progreso 🚀' : 'Comenzar mi Pasaporte 🚀'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ AI CHAT WIDGET ============
function AIChatWidget({ onAuthClick, activeTab }: { onAuthClick: () => void; activeTab: Tab }) {
  const { state } = useAuth()
  const { addToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const maxChars = 200

  // Contextual suggestions based on active tab (4 chips per page)
  const getSuggestions = () => {
    switch (activeTab) {
      case 'inicio':
        return ['¿Por dónde empiezo?', '¿Qué es el interés compuesto?', '¿Cómo abro mi primera cuenta?', '¿Cuánto debo ahorrar?']
      case 'tracker':
        return ['¿Estoy gastando bien?', '¿Cómo puedo ahorrar más?', 'Analiza mis gastos', '¿Cuál es mi meta ideal?']
      case 'comparar':
        return ['¿Qué tarjeta me conviene?', '¿Cuál banco es mejor?', '¿Qué es la TEA?', '¿Qué significa TCEA?']
      case 'aprende':
        return ['¿Cuál video veo primero?', 'Explícame más sobre este tema', '¿Qué tema es más importante?', '¿Cómo empiezo a invertir?']
      case 'logros':
        return ['¿Cómo obtengo mi Pasaporte?', '¿Qué nivel sigue?', '¿Cómo gano más puntos?', '¿Qué desbloqueo después?']
      default:
        return ['¿Cómo empiezo a ahorrar?', '¿Qué es un ETF?', '¿Cuánto debo tener de fondo?', '¿Cómo hago presupuesto?']
    }
  }

  const suggestions = getSuggestions()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load chat history from localStorage
  useEffect(() => {
    if (state.user) {
      const stored = localStorage.getItem(`finfemina_chat_${state.user.id}`)
      if (stored) {
        try {
          setMessages(JSON.parse(stored))
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [state.user])

  // Save chat history
  useEffect(() => {
    if (state.user && messages.length > 0) {
      localStorage.setItem(`finfemina_chat_${state.user.id}`, JSON.stringify(messages))
    }
  }, [messages, state.user])

  const handleChatButtonClick = () => {
    if (!state.isAuthenticated) {
      onAuthClick()
      return
    }
    setIsOpen(!isOpen)
  }

  const clearChat = () => {
    setMessages([])
    if (state.user) {
      localStorage.removeItem(`finfemina_chat_${state.user.id}`)
    }
    addToast('info', 'Chat limpiado')
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || !state.isAuthenticated) return

    const timestamp = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    const userMessage: ChatMessage = { role: 'user', content: text, timestamp }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          user: state.user,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('rate_limit')
        }
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      
      // Simulate streaming effect
      const fullText = data.message
      let displayedText = ''
      const assistantMessage: ChatMessage = { role: 'assistant', content: '', timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) }
      setMessages(prev => [...prev, assistantMessage])

      for (let i = 0; i < fullText.length; i++) {
        await new Promise(r => setTimeout(r, 15))
        displayedText += fullText[i]
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = { ...assistantMessage, content: displayedText }
          return newMessages
        })
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'rate_limit') {
        setError('Femi está muy solicitada ahora mismo ⏳ Intenta en 30 segundos')
      } else {
        setError('Femi está descansando un momento ☕ Intenta en unos segundos.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const userName = state.user?.name || 'amiga'

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleChatButtonClick}
        className="fixed bottom-6 right-6 z-50 w-[62px] h-[62px] rounded-full flex items-center justify-center text-2xl text-white shadow-lg transition-all hover:scale-110 gradient-signature"
        style={{ border: '3px solid white' }}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Panel */}
      {isOpen && state.isAuthenticated && (
        <div className="fixed bottom-24 right-6 z-50 w-[370px] h-[530px] rounded-[28px] overflow-hidden shadow-2xl flex flex-col bg-white animate-slideIn">
          {/* Header */}
          <div className="p-4 flex items-center gap-3 gradient-signature">
            <div className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-xl">
              🤖
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">Femi — FinFémina</div>
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#2DBD96] animate-blink" />
                En línea 24/7
              </div>
            </div>
            <button
              onClick={clearChat}
              className="px-3 py-1.5 rounded-lg border border-white/30 text-white/80 text-xs font-medium hover:bg-white/10"
            >
              🗑️ Limpiar
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-[#6B3F5E] text-sm text-center mb-4">
                  ¡Hola, {userName}! 💜 Soy Femi, tu asistente financiera personal. ¿En qué te ayudo hoy?
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
                <div className="flex flex-col">
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'text-white rounded-br-sm gradient-signature' 
                        : 'bg-[#FDFAF8] text-[#1C0E1A] rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <span className={`text-xs text-[#B08DA8] mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </span>
                  )}
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

            {error && (
              <div className="p-3 rounded-xl bg-[#FEF0E4] border border-[#F4A261] text-sm text-[#1C0E1A]">
                {error}
                <button 
                  onClick={() => setError(null)}
                  className="block mt-2 text-[#D63F74] font-bold text-xs"
                >
                  Reintentar
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#EDD9EA]">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, maxChars))}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Escribe tu pregunta..."
                  className="w-full p-3 pr-16 rounded-xl bg-[#FDFAF8] border-2 border-[#EDD9EA] text-[#1C0E1A] text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#B08DA8]">
                  {input.length}/{maxChars}
                </span>
              </div>
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
function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'register' | 'login'>('register')
  const [tourStep, setTourStep] = useState<number | null>(null)
  const [pointsAnimations, setPointsAnimations] = useState<PointsAnimation[]>([])
  const { state, updatePoints } = useAuth()

  const openAuthModal = (tab: 'register' | 'login' = 'register') => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const [levelUpOverlay, setLevelUpOverlay] = useState<{ level: typeof LEVELS[0] } | null>(null)

  const getLevelFromPoints = (pts: number) => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (pts >= LEVELS[i].points) return LEVELS[i]
    }
    return LEVELS[0]
  }

  const handleEarnPoints = (amount: number, x: number, y: number) => {
    if (!state.user) return
    
    // Add animation
    const id = Date.now().toString()
    setPointsAnimations(prev => [...prev, { id, amount, x, y }])
    
    const newPoints = state.user.points + amount
    const oldLevel = getLevelFromPoints(state.user.points)
    const newLevel = getLevelFromPoints(newPoints)
    
    // Check for level up
    if (newLevel.id > oldLevel.id) {
      setLevelUpOverlay({ level: newLevel })
      setTimeout(() => setLevelUpOverlay(null), 3500)
    }
    
    // Update points
    updatePoints(newPoints)
  }

  const removePointsAnimation = (id: string) => {
    setPointsAnimations(prev => prev.filter(a => a.id !== id))
  }

  return (
    <main className="relative min-h-screen">
      <BackgroundBlobs />
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAuthClick={() => openAuthModal('register')}
      />
      
      <div className="relative z-10">
        {activeTab === 'inicio' && <InicioPage onAuthClick={() => openAuthModal('register')} setActiveTab={setActiveTab} onStartTour={() => setTourStep(0)} />}
        {activeTab === 'aprende' && (
          <AprendePage 
            onAuthClick={() => openAuthModal('register')} 
            onEarnPoints={handleEarnPoints}
          />
        )}
        {activeTab === 'tracker' && <TrackerPage onAuthClick={() => openAuthModal('register')} />}
        {activeTab === 'comparar' && <CompararPage />}
        {activeTab === 'logros' && <LogrosPage onAuthClick={() => openAuthModal('register')} />}
      </div>
      
      <Footer />
      <AIChatWidget onAuthClick={() => openAuthModal('register')} activeTab={activeTab} />
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultTab={authModalTab}
      />

      {tourStep !== null && (
        <TourOverlay 
          step={tourStep} 
          onNext={() => {
            if (tourStep < 4) {
              setTourStep(tourStep + 1)
            } else {
              setTourStep(null)
            }
          }}
          onSkip={() => setTourStep(null)}
        />
      )}

      <ToastContainer />
      <PointsAnimationOverlay animations={pointsAnimations} onComplete={removePointsAnimation} />
      
      {/* Level-Up Celebration Overlay */}
      {levelUpOverlay && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#1C0E1A]/85">
          <Confetti />
          <div className="text-center animate-fadeIn">
            <div 
              className="w-28 h-28 mx-auto mb-5 rounded-full flex items-center justify-center text-5xl"
              style={{ background: getColorClasses(levelUpOverlay.level.color).hex }}
            >
              {levelUpOverlay.level.emoji}
            </div>
            <h2 className="font-serif text-3xl font-black text-white mb-2">
              Subiste de nivel!
            </h2>
            <p className="text-xl text-white/90 font-semibold">
              Nivel {levelUpOverlay.level.id}: {levelUpOverlay.level.name}
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

export default function FinFeminaApp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}
