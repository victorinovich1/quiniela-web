#!/usr/bin/env node

// Script de auditoría de la tabla matches
// Verifica que los 104 partidos del Mundial 2026 estén limpios y correctos

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Cargar variables de entorno desde .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

try {
  const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      process.env[key] = value
    }
  })
} catch (err) {
  console.error('❌ No se pudo leer .env.local')
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Asegúrate de tener .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🔍 AUDITORÍA DE TABLA MATCHES - Mundial 2026')
console.log('=' .repeat(60))
console.log('')

// 1. Conteo total y verificación de numeración
console.log('📊 1. CONTEO Y NUMERACIÓN')
const { data: allMatches, error: countError } = await supabase
  .from('matches')
  .select('match_number')
  .order('match_number')

if (countError) {
  console.error('❌ Error al consultar matches:', countError.message)
  process.exit(1)
}

const totalMatches = allMatches.length
console.log(`   Total de partidos: ${totalMatches} ${totalMatches === 104 ? '✅' : '❌ (Esperado: 104)'}`)

// Verificar secuencia 1-104
const matchNumbers = allMatches.map(m => m.match_number).sort((a, b) => a - b)
const duplicates = matchNumbers.filter((num, idx) => matchNumbers.indexOf(num) !== idx)
const missing = []
for (let i = 1; i <= 104; i++) {
  if (!matchNumbers.includes(i)) missing.push(i)
}

if (duplicates.length > 0) {
  console.log(`   ❌ Duplicados encontrados: ${duplicates.join(', ')}`)
} else {
  console.log('   ✅ Sin duplicados')
}

if (missing.length > 0) {
  console.log(`   ❌ Números faltantes: ${missing.join(', ')}`)
} else {
  console.log('   ✅ Numeración completa (1-104)')
}

console.log('')

// 2. Verificación de fechas
console.log('📅 2. VALIDACIÓN DE FECHAS')
const startDate = new Date('2026-06-11T00:00:00Z')
const endDate = new Date('2026-07-20T23:59:59Z')

const { data: matchesWithDates, error: dateError } = await supabase
  .from('matches')
  .select('match_number, kickoff')
  .order('match_number')

if (!dateError && matchesWithDates) {
  const outOfRange = matchesWithDates.filter(m => {
    const kickoff = new Date(m.kickoff)
    return kickoff < startDate || kickoff > endDate
  })
  
  if (outOfRange.length > 0) {
    console.log(`   ❌ Partidos fuera de rango (11 Jun - 19 Jul 2026):`)
    outOfRange.forEach(m => {
      console.log(`      M${m.match_number}: ${new Date(m.kickoff).toISOString().split('T')[0]}`)
    })
  } else {
    console.log('   ✅ Todas las fechas dentro del rango del torneo')
  }
}

console.log('')

// 3. Verificación de sedes clave
console.log('🏟️  3. VERIFICACIÓN DE SEDES CLAVE')
const { data: m1, error: m1Error } = await supabase
  .from('matches')
  .select('match_number, stadium')
  .eq('match_number', 1)
  .single()

const { data: m104, error: m104Error } = await supabase
  .from('matches')
  .select('match_number, stadium')
  .eq('match_number', 104)
  .single()

if (m1) {
  const isAzteca = m1.stadium?.includes('Azteca') || m1.stadium?.includes('Ciudad de México')
  console.log(`   M1 (Inauguración): ${m1.stadium} ${isAzteca ? '✅' : '❌ (Esperado: Azteca)'}`)
}

if (m104) {
  const isMetLife = m104.stadium?.includes('MetLife') || m104.stadium?.includes('Nueva York')
  console.log(`   M104 (Final): ${m104.stadium} ${isMetLife ? '✅' : '❌ (Esperado: MetLife)'}`)
}

console.log('')

// 4. Estado de los partidos
console.log('📋 4. ESTADO DE LOS PARTIDOS')
const { data: statusCounts, error: statusError } = await supabase
  .from('matches')
  .select('status')

if (!statusError && statusCounts) {
  const counts = statusCounts.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1
    return acc
  }, {})
  
  console.log(`   Scheduled: ${counts.scheduled || 0}`)
  console.log(`   Live: ${counts.live || 0}`)
  console.log(`   Finished: ${counts.finished || 0}`)
  
  if (counts.finished > 0) {
    console.log(`   ⚠️  Hay ${counts.finished} partidos marcados como finalizados`)
  }
}

console.log('')

// 5. Placeholders de eliminatorias (M73-M104)
console.log('🎯 5. PLACEHOLDERS DE ELIMINATORIAS (M73-M104)')
const { data: knockoutMatches, error: koError } = await supabase
  .from('matches')
  .select('match_number, home_team_id, away_team_id')
  .gte('match_number', 73)
  .lte('match_number', 104)
  .order('match_number')

if (!koError && knockoutMatches) {
  const withTeams = knockoutMatches.filter(m => m.home_team_id !== null || m.away_team_id !== null)
  
  if (withTeams.length > 0) {
    console.log(`   ⚠️  ${withTeams.length} partidos de eliminatorias tienen equipos asignados:`)
    withTeams.forEach(m => {
      console.log(`      M${m.match_number}: home=${m.home_team_id}, away=${m.away_team_id}`)
    })
  } else {
    console.log('   ✅ Todos los partidos de eliminatorias tienen equipos NULL (correcto)')
  }
}

console.log('')

// 6. Búsqueda de anomalías en estadios
console.log('🌎 6. VALIDACIÓN DE ESTADIOS')
const { data: allStadiums, error: stadiumError } = await supabase
  .from('matches')
  .select('match_number, stadium')
  .order('match_number')

if (!stadiumError && allStadiums) {
  // Buscar estadios sospechosos (que no contengan palabras clave de sedes oficiales)
  const officialKeywords = [
    'México', 'Ciudad de México', 'Guadalajara', 'Monterrey', 'Azteca', 'Akron', 'BBVA',
    'Toronto', 'Vancouver', 'BMO', 'BC Place',
    'Los Angeles', 'San Francisco', 'Nueva York', 'Boston', 'Houston', 'Dallas', 
    'Filadelfia', 'Atlanta', 'Seattle', 'Miami', 'Kansas City',
    'SoFi', 'Levi', 'MetLife', 'Gillette', 'NRG', 'AT&T', 'Lincoln', 'Mercedes-Benz', 'Lumen', 'Hard Rock', 'Arrowhead'
  ]
  
  const suspicious = allStadiums.filter(m => {
    if (!m.stadium) return true
    return !officialKeywords.some(keyword => m.stadium.includes(keyword))
  })
  
  if (suspicious.length > 0) {
    console.log(`   ⚠️  ${suspicious.length} partidos con estadios no reconocidos:`)
    suspicious.slice(0, 10).forEach(m => {
      console.log(`      M${m.match_number}: ${m.stadium || 'NULL'}`)
    })
    if (suspicious.length > 10) {
      console.log(`      ... y ${suspicious.length - 10} más`)
    }
  } else {
    console.log('   ✅ Todos los estadios corresponden a sedes oficiales')
  }
}

console.log('')
console.log('=' .repeat(60))
console.log('📊 RESUMEN DE AUDITORÍA')
console.log('=' .repeat(60))

let isClean = true
const issues = []

if (totalMatches !== 104) {
  isClean = false
  issues.push(`Total de partidos incorrecto: ${totalMatches} (esperado: 104)`)
}

if (duplicates.length > 0) {
  isClean = false
  issues.push(`${duplicates.length} números duplicados`)
}

if (missing.length > 0) {
  isClean = false
  issues.push(`${missing.length} números faltantes`)
}

if (isClean) {
  console.log('✅ BASE DE DATOS LIMPIA')
  console.log('   La tabla matches está correctamente configurada para el Mundial 2026')
} else {
  console.log('❌ SE ENCONTRARON DISCREPANCIAS')
  issues.forEach(issue => console.log(`   • ${issue}`))
  console.log('')
  console.log('⚠️  Requiere corrección antes de producción')
}

console.log('')
