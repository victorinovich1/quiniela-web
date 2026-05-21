#!/usr/bin/env node

// Script de verificación de mapeo de fases
// Compara los nombres de stage en BD vs API

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar .env.local
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

const { createClient } = await import('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const apiKey = process.env.FOOTBALL_DATA_API_KEY

if (!supabaseUrl || !supabaseKey || !apiKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 VERIFICACIÓN DE MAPEO DE FASES')
console.log('=' .repeat(70))
console.log('')

// 1. Obtener partidos de la BD
console.log('📊 Consultando partidos en BD...')
const { data: matches, error } = await supabase
  .from('matches')
  .select('match_number, phase, kickoff_at, home_team_id, away_team_id')
  .order('match_number')

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

console.log(`✅ ${matches.length} partidos en BD`)
console.log('')

// Agrupar por phase
const byPhase = {}
matches.forEach(m => {
  if (!byPhase[m.phase]) byPhase[m.phase] = []
  byPhase[m.phase].push(m)
})

console.log('📋 PARTIDOS POR FASE EN BD:')
Object.keys(byPhase).sort().forEach(phase => {
  const count = byPhase[phase].length
  const withTeams = byPhase[phase].filter(m => m.home_team_id && m.away_team_id).length
  const withoutTeams = count - withTeams
  console.log(`   ${phase}: ${count} partidos (${withTeams} con equipos, ${withoutTeams} sin equipos)`)
})
console.log('')

// 2. Obtener partidos de la API
console.log('📡 Consultando API de football-data.org...')
const apiUrl = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026'
const apiRes = await fetch(apiUrl, {
  headers: { 'X-Auth-Token': apiKey }
})

if (!apiRes.ok) {
  console.error(`❌ API error: ${apiRes.status}`)
  process.exit(1)
}

const apiData = await apiRes.json()
const apiMatches = apiData.matches || []

console.log(`✅ ${apiMatches.length} partidos en API`)
console.log('')

// Agrupar por stage de API
const apiByStage = {}
apiMatches.forEach(m => {
  const stage = m.stage?.toUpperCase() || 'UNKNOWN'
  if (!apiByStage[stage]) apiByStage[stage] = []
  apiByStage[stage].push(m)
})

console.log('📋 PARTIDOS POR FASE EN API:')
Object.keys(apiByStage).sort().forEach(stage => {
  console.log(`   ${stage}: ${apiByStage[stage].length} partidos`)
})
console.log('')

// Función de mapeo (igual que en route.ts)
function mapPhaseApiToDB(apiStage) {
  if (!apiStage) return null
  const normalized = apiStage.toUpperCase()
  
  const mapping = {
    'GROUP_STAGE': 'group',
    'LAST_32': 'r32',
    'ROUND_OF_32': 'r32',
    'LAST_16': 'r16',
    'ROUND_OF_16': 'r16',
    'QUARTER_FINALS': 'qf',
    'QUARTER_FINAL': 'qf',
    'SEMI_FINALS': 'sf',
    'SEMI_FINAL': 'sf',
    'THIRD_PLACE': 'third',
    'FINAL': 'final',
  }
  
  return mapping[normalized] || null
}

// 3. Comparar nombres de fases
console.log('🔍 COMPARACIÓN DE NOMBRES DE FASES:')
console.log('=' .repeat(70))

const dbPhases = new Set(Object.keys(byPhase))
const apiStages = new Set(Object.keys(apiByStage))

console.log('✅ MAPEO API → BD:')
apiStages.forEach(apiStage => {
  const dbPhase = mapPhaseApiToDB(apiStage)
  const exists = dbPhase && dbPhases.has(dbPhase)
  const symbol = exists ? '✅' : '❌'
  console.log(`   ${symbol} ${apiStage} → ${dbPhase || 'DESCONOCIDO'}`)
})
console.log('')

const unmapped = [...apiStages].filter(s => !mapPhaseApiToDB(s))
if (unmapped.length > 0) {
  console.log('⚠️  FASES DE API SIN MAPEO:')
  unmapped.forEach(s => console.log(`   - ${s}`))
  console.log('')
}

// 4. Simulación de mapeo
console.log('🎯 SIMULACIÓN DE MAPEO POR FECHA+FASE:')
console.log('=' .repeat(70))

let wouldMatchByTeams = 0
let wouldMatchByDatePhase = 0
let wouldNotMatch = 0

for (const apiMatch of apiMatches) {
  const apiStage = apiMatch.stage
  const dbPhase = mapPhaseApiToDB(apiStage)
  const apiDate = new Date(apiMatch.utcDate)
  
  // Simular búsqueda por fecha+fase
  let foundByDatePhase = false
  
  if (dbPhase && byPhase[dbPhase]) {
    for (const dbMatch of byPhase[dbPhase]) {
      const dbDate = new Date(dbMatch.kickoff_at)
      const diffMinutes = Math.abs(apiDate.getTime() - dbDate.getTime()) / (1000 * 60)
      
      // Margen de 180 minutos (3 horas) para ajustes de horario
      if (diffMinutes <= 180) {
        foundByDatePhase = true
        wouldMatchByDatePhase++
        break
      }
    }
  }
  
  if (!foundByDatePhase) {
    wouldNotMatch++
    if (wouldNotMatch <= 5) {
      console.log(`   ❌ NO MATCH: ${apiMatch.homeTeam?.name || '???'} vs ${apiMatch.awayTeam?.name || '???'}`)
      console.log(`      API Stage: ${apiStage || 'N/A'} → DB Phase: ${dbPhase || 'N/A'}, Date: ${apiMatch.utcDate}`)
    }
  }
}

console.log('')
console.log('📊 RESULTADO DE SIMULACIÓN:')
console.log(`   Total en API: ${apiMatches.length}`)
console.log(`   ✅ Mapearían por fecha+fase: ${wouldMatchByDatePhase}`)
console.log(`   ❌ NO mapearían: ${wouldNotMatch}`)
console.log('')

if (wouldMatchByDatePhase === apiMatches.length) {
  console.log('🎉 ¡PERFECTO! Todos los partidos de la API se pueden mapear')
} else if (wouldMatchByDatePhase >= 72) {
  console.log(`✅ BUENO: Se mapearían ${wouldMatchByDatePhase} partidos (suficiente para fase de grupos)`)
  if (wouldNotMatch > 0) {
    console.log(`⚠️  ${wouldNotMatch} partidos no se mapearían (probablemente eliminatorias con fechas no exactas)`)
  }
} else {
  console.log('⚠️  PROBLEMA: Menos de 72 partidos se mapearían')
}
