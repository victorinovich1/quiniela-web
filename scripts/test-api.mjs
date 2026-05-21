#!/usr/bin/env node

// Script de prueba de API football-data.org
// Verifica cuántos partidos devuelve para el Mundial 2026

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

const API_KEY = process.env.FOOTBALL_DATA_API_KEY
const COMPETITION_CODE = process.env.FOOTBALL_DATA_COMPETITION_CODE || 'WC'
const SEASON = process.env.FOOTBALL_DATA_SEASON || '2026'

if (!API_KEY) {
  console.error('❌ Error: FOOTBALL_DATA_API_KEY no está configurada en .env.local')
  process.exit(1)
}

console.log('🔍 PRUEBA DE API FOOTBALL-DATA.ORG - Mundial 2026')
console.log('=' .repeat(60))
console.log(`Competición: ${COMPETITION_CODE}`)
console.log(`Temporada: ${SEASON}`)
console.log(`API Key: ${API_KEY.substring(0, 8)}...`)
console.log('')

const url = `https://api.football-data.org/v4/competitions/${COMPETITION_CODE}/matches?season=${SEASON}`

console.log(`📡 Llamando a: ${url}`)
console.log('')

try {
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': API_KEY,
    },
  })

  console.log(`📊 Status: ${response.status} ${response.statusText}`)
  console.log('')

  if (!response.ok) {
    const text = await response.text()
    console.error('❌ ERROR DE API:')
    console.error(text.substring(0, 500))
    
    if (response.status === 403) {
      console.log('')
      console.log('⚠️  NOTA: Error 403 significa que tu plan gratuito no incluye el Mundial 2026')
      console.log('   La API de football-data.org requiere un plan de pago para torneos futuros')
      console.log('   Nuestro sistema puede usar datos de prueba hasta que el torneo esté disponible')
    } else if (response.status === 404) {
      console.log('')
      console.log('⚠️  NOTA: Error 404 significa que el Mundial 2026 aún no está cargado en la API')
      console.log('   El fixture se cargará más cerca de la fecha del torneo (junio 2026)')
    }
    
    process.exit(1)
  }

  const data = await response.json()
  const matches = data.matches || []

  console.log(`✅ Respuesta exitosa`)
  console.log(`📋 Total de partidos: ${matches.length}`)
  console.log('')

  // Agrupar por fase (stage)
  const byStage = {}
  matches.forEach(m => {
    const stage = m.stage || 'UNKNOWN'
    if (!byStage[stage]) byStage[stage] = []
    byStage[stage].push(m)
  })

  console.log('📊 PARTIDOS POR FASE:')
  Object.keys(byStage).sort().forEach(stage => {
    console.log(`   ${stage}: ${byStage[stage].length} partidos`)
  })
  console.log('')

  // Verificar si hay partidos de eliminatorias
  const knockoutStages = [
    'ROUND_OF_32',
    'ROUND_OF_16', 
    'QUARTER_FINALS',
    'SEMI_FINALS',
    'THIRD_PLACE',
    'FINAL'
  ]
  
  const hasKnockout = knockoutStages.some(stage => byStage[stage] && byStage[stage].length > 0)
  
  if (hasKnockout) {
    console.log('✅ La API devuelve partidos de ELIMINATORIAS')
  } else {
    console.log('⚠️  La API NO devuelve partidos de eliminatorias (solo fase de grupos)')
  }
  console.log('')

  // Mostrar muestra de 3 partidos
  console.log('📋 MUESTRA DE PARTIDOS:')
  matches.slice(0, 3).forEach((m, idx) => {
    console.log(`   ${idx + 1}. ${m.homeTeam?.tla || '???'} vs ${m.awayTeam?.tla || '???'}`)
    console.log(`      Fase: ${m.stage || 'N/A'}`)
    console.log(`      Fecha: ${m.utcDate ? new Date(m.utcDate).toISOString().split('T')[0] : 'N/A'}`)
    console.log(`      ID: ${m.id}`)
    console.log('')
  })

  // Análisis de mapeo
  console.log('=' .repeat(60))
  console.log('🔍 ANÁLISIS DE MAPEO')
  console.log('=' .repeat(60))
  console.log('')
  
  if (matches.length === 104) {
    console.log('✅ La API devuelve los 104 partidos completos')
    console.log('   Nuestro sistema puede sincronizar todos los partidos')
  } else if (matches.length === 72) {
    console.log('⚠️  La API solo devuelve 72 partidos (fase de grupos)')
    console.log('   Los 32 partidos de eliminatorias aparecerán después de la fase de grupos')
  } else {
    console.log(`⚠️  La API devuelve ${matches.length} partidos (no es 72 ni 104)`)
  }
  console.log('')

  // Verificar si la API asigna matchday/order
  const hasMatchday = matches.some(m => m.matchday !== null && m.matchday !== undefined)
  const hasGroup = matches.some(m => m.group !== null && m.group !== undefined)
  
  console.log('📊 CAMPOS DISPONIBLES PARA MAPEO:')
  console.log(`   stage: ${matches.every(m => m.stage) ? '✅ Todos' : '⚠️  Algunos'}`)
  console.log(`   matchday: ${hasMatchday ? '✅ Disponible' : '❌ No disponible'}`)
  console.log(`   group: ${hasGroup ? '✅ Disponible' : '❌ No disponible'}`)
  console.log(`   utcDate: ${matches.every(m => m.utcDate) ? '✅ Todos' : '⚠️  Algunos'}`)
  console.log('')

  console.log('🎯 RECOMENDACIÓN DE MAPEO:')
  console.log('   Actual: home_team_id + away_team_id (solo funciona si equipos ya asignados)')
  console.log('   Propuesta: stage + utcDate + order (funciona incluso con equipos NULL)')
  console.log('')

} catch (error) {
  console.error('❌ Error al llamar a la API:')
  console.error(error.message)
  process.exit(1)
}
