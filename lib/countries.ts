// Lista de países para selección de ubicación
// Códigos ISO 3166-1 alpha-2 (compatibles con flagcdn.com)

export interface Country {
  code: string
  name: string
}

export const COUNTRIES: Country[] = [
  // Mundial 2026 (países clasificados confirmados)
  { code: 'mx', name: 'México' },
  { code: 'us', name: 'Estados Unidos' },
  { code: 'ca', name: 'Canadá' },
  { code: 'ar', name: 'Argentina' },
  { code: 'br', name: 'Brasil' },
  { code: 'uy', name: 'Uruguay' },
  { code: 'co', name: 'Colombia' },
  { code: 'cl', name: 'Chile' },
  { code: 'ec', name: 'Ecuador' },
  { code: 'pe', name: 'Perú' },
  { code: 'py', name: 'Paraguay' },
  { code: 've', name: 'Venezuela' },
  { code: 'bo', name: 'Bolivia' },
  
  // CONCACAF
  { code: 'cr', name: 'Costa Rica' },
  { code: 'pa', name: 'Panamá' },
  { code: 'hn', name: 'Honduras' },
  { code: 'jm', name: 'Jamaica' },
  { code: 'gt', name: 'Guatemala' },
  { code: 'sv', name: 'El Salvador' },
  { code: 'ni', name: 'Nicaragua' },
  { code: 'cu', name: 'Cuba' },
  { code: 'do', name: 'República Dominicana' },
  { code: 'pr', name: 'Puerto Rico' },
  
  // Europa
  { code: 'es', name: 'España' },
  { code: 'de', name: 'Alemania' },
  { code: 'fr', name: 'Francia' },
  { code: 'gb', name: 'Reino Unido' },
  { code: 'it', name: 'Italia' },
  { code: 'pt', name: 'Portugal' },
  { code: 'nl', name: 'Países Bajos' },
  { code: 'be', name: 'Bélgica' },
  { code: 'ch', name: 'Suiza' },
  { code: 'at', name: 'Austria' },
  { code: 'dk', name: 'Dinamarca' },
  { code: 'se', name: 'Suecia' },
  { code: 'no', name: 'Noruega' },
  { code: 'pl', name: 'Polonia' },
  { code: 'ua', name: 'Ucrania' },
  { code: 'cz', name: 'República Checa' },
  { code: 'gr', name: 'Grecia' },
  { code: 'ie', name: 'Irlanda' },
  { code: 'rs', name: 'Serbia' },
  { code: 'hr', name: 'Croacia' },
  
  // Asia
  { code: 'jp', name: 'Japón' },
  { code: 'kr', name: 'Corea del Sur' },
  { code: 'cn', name: 'China' },
  { code: 'in', name: 'India' },
  { code: 'sa', name: 'Arabia Saudita' },
  { code: 'ir', name: 'Irán' },
  { code: 'au', name: 'Australia' },
  { code: 'nz', name: 'Nueva Zelanda' },
  
  // África
  { code: 'ma', name: 'Marruecos' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'sn', name: 'Senegal' },
  { code: 'eg', name: 'Egipto' },
  { code: 'za', name: 'Sudáfrica' },
  { code: 'gh', name: 'Ghana' },
  { code: 'cm', name: 'Camerún' },
  { code: 'tn', name: 'Túnez' },
  
  // Otros países comunes
  { code: 'ru', name: 'Rusia' },
  { code: 'tr', name: 'Turquía' },
  { code: 'il', name: 'Israel' },
].sort((a, b) => a.name.localeCompare(b.name, 'es'))
