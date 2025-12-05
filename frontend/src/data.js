// frontend/src/data.js

export const YEARS = ['2022', '2023', '2024', '2025'];

export const DRIVERS = [
  { id: 'VER', name: 'Max Verstappen' },
  { id: 'PER', name: 'Sergio Pérez' },
  { id: 'HAM', name: 'Lewis Hamilton' },
  { id: 'RUS', name: 'George Russell' },
  { id: 'LEC', name: 'Charles Leclerc' },
  { id: 'SAI', name: 'Carlos Sainz' },
  { id: 'NOR', name: 'Lando Norris' },
  { id: 'PIA', name: 'Oscar Piastri' },
  { id: 'ALO', name: 'Fernando Alonso' },
  { id: 'STR', name: 'Lance Stroll' },
  { id: 'GAS', name: 'Pierre Gasly' },
  { id: 'OCO', name: 'Esteban Ocon' },
  { id: 'ALB', name: 'Alexander Albon' },
  { id: 'SAR', name: 'Logan Sargeant' },
  { id: 'TSU', name: 'Yuki Tsunoda' },
  { id: 'RIC', name: 'Daniel Ricciardo' },
  { id: 'BOT', name: 'Valtteri Bottas' },
  { id: 'ZHO', name: 'Guanyu Zhou' },
  { id: 'HUL', name: 'Nico Hulkenberg' },
  { id: 'MAG', name: 'Kevin Magnussen' }
];

// VALUE = Lo que enviamos a Python (Oficial)
// LABEL = Lo que ve el usuario (Bonito)
export const CIRCUITS = [
  { value: 'Bahrain Grand Prix', label: '🇧🇭 Bahrain' },
  { value: 'Saudi Arabian Grand Prix', label: '🇸🇦 Saudi Arabia' },
  { value: 'Australian Grand Prix', label: '🇦🇺 Australia' },
  { value: 'Azerbaijan Grand Prix', label: '🇦🇿 Azerbaijan' },
  { value: 'Miami Grand Prix', label: '🇺🇸 Miami' },
  { value: 'Monaco Grand Prix', label: '🇲🇨 Monaco' },
  { value: 'Spanish Grand Prix', label: '🇪🇸 Spain' },
  { value: 'Canadian Grand Prix', label: '🇨🇦 Canada' },
  { value: 'Austrian Grand Prix', label: '🇦🇹 Austria' },
  { value: 'British Grand Prix', label: '🇬🇧 Great Britain' },
  { value: 'Hungarian Grand Prix', label: '🇭🇺 Hungary' },
  { value: 'Belgian Grand Prix', label: '🇧🇪 Belgium' }, // <--- AQUÍ ESTABA EL TRUCO
  { value: 'Dutch Grand Prix', label: '🇳🇱 Netherlands' },
  { value: 'Italian Grand Prix', label: '🇮🇹 Italy (Monza)' },
  { value: 'Singapore Grand Prix', label: '🇸🇬 Singapore' },
  { value: 'Japanese Grand Prix', label: '🇯🇵 Japan' },
  { value: 'Qatar Grand Prix', label: '🇶🇦 Qatar' },
  { value: 'United States Grand Prix', label: '🇺🇸 USA (Austin)' },
  { value: 'Mexico City Grand Prix', label: '🇲🇽 Mexico' },
  { value: 'São Paulo Grand Prix', label: '🇧🇷 Brazil' },
  { value: 'Las Vegas Grand Prix', label: '🇺🇸 Las Vegas' },
  { value: 'Abu Dhabi Grand Prix', label: '🇦🇪 Abu Dhabi' }
];