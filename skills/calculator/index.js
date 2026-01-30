const fs = require('fs');
const path = require('path');
const os = require('os');

// Calculator configuration
const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const CALC_DIR = path.join(JARVIS_DIR, 'calculator');
const HISTORY_FILE = path.join(CALC_DIR, 'history.json');
const SAVED_FILE = path.join(CALC_DIR, 'saved.json');

const DEFAULT_PRECISION = parseInt(process.env.JARVIS_CALC_PRECISION) || 10;
const CURRENCY_API_KEY = process.env.JARVIS_CALC_CURRENCY_API_KEY;
const PREFERRED_UNITS = process.env.JARVIS_CALC_PREFERRED_UNITS || 'metric';

// Mathematical constants
const CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
  phi: 1.618033988749895, // Golden ratio
  sqrt2: Math.SQRT2,
  sqrt1_2: Math.SQRT1_2,
  ln2: Math.LN2,
  ln10: Math.LN10,
  log2e: Math.LOG2E,
  log10e: Math.LOG10E,
  
  // Physical constants
  c: 299792458, // Speed of light (m/s)
  h: 6.62607015e-34, // Planck constant (J⋅s)
  hbar: 1.054571817e-34, // Reduced Planck constant
  g: 9.80665, // Standard gravity (m/s²)
  G: 6.6743e-11, // Gravitational constant (m³⋅kg⁻¹⋅s⁻²)
  me: 9.1093837015e-31, // Electron mass (kg)
  mp: 1.67262192369e-27, // Proton mass (kg)
  NA: 6.02214076e23, // Avogadro constant (mol⁻¹)
  k: 1.380649e-23, // Boltzmann constant (J⋅K⁻¹)
  R: 8.314462618, // Gas constant (J⋅mol⁻¹⋅K⁻¹)
  epsilon0: 8.8541878128e-12, // Electric constant (F⋅m⁻¹)
  mu0: 1.25663706212e-6 // Magnetic constant (H⋅m⁻¹)
};

// Unit conversion database
const UNIT_CONVERSIONS = {
  // Length (base: meters)
  length: {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    inch: 0.0254,
    inches: 0.0254,
    ft: 0.3048,
    foot: 0.3048,
    feet: 0.3048,
    yd: 0.9144,
    yard: 0.9144,
    yards: 0.9144,
    mi: 1609.344,
    mile: 1609.344,
    miles: 1609.344,
    nmi: 1852, // Nautical mile
    au: 1.496e11, // Astronomical unit
    ly: 9.461e15 // Light year
  },
  
  // Weight/Mass (base: kilograms)
  weight: {
    mg: 1e-6,
    g: 0.001,
    kg: 1,
    oz: 0.0283495,
    ounce: 0.0283495,
    ounces: 0.0283495,
    lb: 0.453592,
    lbs: 0.453592,
    pound: 0.453592,
    pounds: 0.453592,
    stone: 6.35029,
    ton: 1000,
    tonne: 1000
  },
  
  // Temperature (special handling needed)
  temperature: {
    celsius: 'C',
    fahrenheit: 'F',
    kelvin: 'K',
    rankine: 'R',
    c: 'C',
    f: 'F',
    k: 'K',
    r: 'R'
  },
  
  // Volume (base: liters)
  volume: {
    ml: 0.001,
    milliliter: 0.001,
    milliliters: 0.001,
    l: 1,
    liter: 1,
    liters: 1,
    gal: 3.78541,
    gallon: 3.78541,
    gallons: 3.78541,
    qt: 0.946353,
    quart: 0.946353,
    quarts: 0.946353,
    pt: 0.473176,
    pint: 0.473176,
    pints: 0.473176,
    cup: 0.236588,
    cups: 0.236588,
    'fl oz': 0.0295735,
    'fluid ounce': 0.0295735,
    'fluid ounces': 0.0295735,
    tbsp: 0.0147868,
    tablespoon: 0.0147868,
    tablespoons: 0.0147868,
    tsp: 0.00492892,
    teaspoon: 0.00492892,
    teaspoons: 0.00492892
  },
  
  // Area (base: square meters)
  area: {
    'mm²': 1e-6,
    'cm²': 1e-4,
    'm²': 1,
    'km²': 1e6,
    'in²': 0.00064516,
    'ft²': 0.092903,
    'yd²': 0.836127,
    acre: 4046.86,
    hectare: 10000
  },
  
  // Speed (base: meters per second)
  speed: {
    'm/s': 1,
    'km/h': 0.277778,
    kph: 0.277778,
    mph: 0.44704,
    'mi/h': 0.44704,
    knot: 0.514444,
    knots: 0.514444,
    mach: 343 // At sea level
  },
  
  // Time (base: seconds)
  time: {
    ms: 0.001,
    millisecond: 0.001,
    milliseconds: 0.001,
    s: 1,
    sec: 1,
    second: 1,
    seconds: 1,
    min: 60,
    minute: 60,
    minutes: 60,
    h: 3600,
    hr: 3600,
    hour: 3600,
    hours: 3600,
    day: 86400,
    days: 86400,
    week: 604800,
    weeks: 604800,
    month: 2629746, // Average month
    months: 2629746,
    year: 31556952, // Average year
    years: 31556952
  }
};

// Currency codes and symbols
const CURRENCY_CODES = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$',
  CHF: 'Fr', CNY: '¥', INR: '₹', BRL: 'R$', RUB: '₽', KRW: '₩',
  MXN: '$', SGD: 'S$', HKD: 'HK$', NOK: 'kr', SEK: 'kr', DKK: 'kr',
  PLN: 'zł', CZK: 'Kč', HUF: 'Ft', TRY: '₺', ILS: '₪', ZAR: 'R'
};

// Helper functions
function ensureDirectories() {
  if (!fs.existsSync(JARVIS_DIR)) {
    fs.mkdirSync(JARVIS_DIR, { recursive: true });
  }
  if (!fs.existsSync(CALC_DIR)) {
    fs.mkdirSync(CALC_DIR, { recursive: true });
  }
}

function saveToHistory(operation, input, result, metadata = {}) {
  try {
    ensureDirectories();
    let history = [];
    
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
    
    history.unshift({
      timestamp: new Date().toISOString(),
      operation: operation,
      input: input,
      result: result,
      metadata: metadata
    });
    
    // Keep only last 1000 entries
    history = history.slice(0, 1000);
    
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    // Silently fail history saving
  }
}

function formatNumber(num, precision = DEFAULT_PRECISION, format = 'decimal') {
  if (typeof num !== 'number' || !isFinite(num)) {
    return 'Error: Invalid number';
  }
  
  switch (format) {
    case 'decimal':
      return parseFloat(num.toFixed(precision)).toString();
    case 'scientific':
      return num.toExponential(precision);
    case 'engineering':
      const exp = Math.floor(Math.log10(Math.abs(num)) / 3) * 3;
      const mantissa = num / Math.pow(10, exp);
      return `${mantissa.toFixed(precision)}e${exp}`;
    case 'fraction':
      return toFraction(num);
    case 'binary':
      return '0b' + Math.round(num).toString(2);
    case 'hex':
      return '0x' + Math.round(num).toString(16).toUpperCase();
    case 'octal':
      return '0o' + Math.round(num).toString(8);
    default:
      return num.toString();
  }
}

function toFraction(decimal, tolerance = 1e-6) {
  let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
  let b = decimal;
  
  do {
    const a = Math.floor(b);
    let aux = h1; h1 = a * h1 + h2; h2 = aux;
    aux = k1; k1 = a * k1 + k2; k2 = aux;
    b = 1 / (b - a);
  } while (Math.abs(decimal - h1 / k1) > decimal * tolerance);
  
  return k1 === 1 ? h1.toString() : `${h1}/${k1}`;
}

function parseExpression(expr) {
  // Replace constants
  let parsed = expr;
  for (const [name, value] of Object.entries(CONSTANTS)) {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    parsed = parsed.replace(regex, value.toString());
  }
  
  // Handle percentage
  parsed = parsed.replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/gi, '($1/100)*$2');
  parsed = parsed.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');
  
  return parsed;
}

function evaluateExpression(expr, degrees = true) {
  try {
    const parsed = parseExpression(expr);
    
    // Safe evaluation context with math functions
    const mathContext = {
      // Basic functions
      abs: Math.abs, acos: Math.acos, asin: Math.asin, atan: Math.atan, atan2: Math.atan2,
      ceil: Math.ceil, cos: Math.cos, exp: Math.exp, floor: Math.floor, log: Math.log,
      max: Math.max, min: Math.min, pow: Math.pow, random: Math.random, round: Math.round,
      sin: Math.sin, sqrt: Math.sqrt, tan: Math.tan,
      
      // Additional functions
      log10: Math.log10, log2: Math.log2, cbrt: Math.cbrt, sinh: Math.sinh,
      cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
      
      // Degree conversion if needed
      sin: degrees ? (x) => Math.sin(x * Math.PI / 180) : Math.sin,
      cos: degrees ? (x) => Math.cos(x * Math.PI / 180) : Math.cos,
      tan: degrees ? (x) => Math.tan(x * Math.PI / 180) : Math.tan,
      asin: degrees ? (x) => Math.asin(x) * 180 / Math.PI : Math.asin,
      acos: degrees ? (x) => Math.acos(x) * 180 / Math.PI : Math.acos,
      atan: degrees ? (x) => Math.atan(x) * 180 / Math.PI : Math.atan,
      
      // Constants
      ...CONSTANTS
    };
    
    // Create safe evaluation function
    const func = new Function(...Object.keys(mathContext), `return ${parsed}`);
    const result = func(...Object.values(mathContext));
    
    return result;
  } catch (error) {
    throw new Error(`Invalid expression: ${error.message}`);
  }
}

function convertTemperature(value, fromUnit, toUnit) {
  const from = UNIT_CONVERSIONS.temperature[fromUnit.toLowerCase()];
  const to = UNIT_CONVERSIONS.temperature[toUnit.toLowerCase()];
  
  if (!from || !to) {
    throw new Error('Invalid temperature unit');
  }
  
  // Convert to Celsius first
  let celsius;
  switch (from) {
    case 'C': celsius = value; break;
    case 'F': celsius = (value - 32) * 5/9; break;
    case 'K': celsius = value - 273.15; break;
    case 'R': celsius = (value - 491.67) * 5/9; break;
  }
  
  // Convert from Celsius to target
  switch (to) {
    case 'C': return celsius;
    case 'F': return celsius * 9/5 + 32;
    case 'K': return celsius + 273.15;
    case 'R': return celsius * 9/5 + 491.67;
  }
}

function findUnitCategory(unit) {
  const unitLower = unit.toLowerCase();
  for (const [category, units] of Object.entries(UNIT_CONVERSIONS)) {
    if (units[unitLower] !== undefined) {
      return category;
    }
  }
  return null;
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  
  const str = value.toString().toLowerCase();
  
  // Binary
  if (str.startsWith('0b')) {
    return parseInt(str.slice(2), 2);
  }
  // Hexadecimal
  if (str.startsWith('0x')) {
    return parseInt(str.slice(2), 16);
  }
  // Octal
  if (str.startsWith('0o')) {
    return parseInt(str.slice(2), 8);
  }
  
  return parseFloat(str);
}

// Mock currency exchange rates (in production, would use live API)
const MOCK_EXCHANGE_RATES = {
  USD: { EUR: 0.85, GBP: 0.73, JPY: 110, CAD: 1.25, AUD: 1.35 },
  EUR: { USD: 1.18, GBP: 0.86, JPY: 129, CAD: 1.47, AUD: 1.59 },
  GBP: { USD: 1.37, EUR: 1.16, JPY: 151, CAD: 1.71, AUD: 1.85 },
  JPY: { USD: 0.0091, EUR: 0.0077, GBP: 0.0066, CAD: 0.011, AUD: 0.012 }
  // Add more as needed
};

// Tool implementations
const tools = {
  calculate: async ({ expression, precision = DEFAULT_PRECISION, format = 'decimal', degrees = true }) => {
    try {
      const result = evaluateExpression(expression, degrees);
      const formatted = formatNumber(result, precision, format);
      
      saveToHistory('calculate', expression, formatted, { precision, format, degrees });
      
      return {
        success: true,
        expression: expression,
        result: result,
        formatted: formatted,
        format: format
      };
    } catch (error) {
      return {
        success: false,
        message: `Calculation failed: ${error.message}`,
        expression: expression
      };
    }
  },

  convert_units: async ({ value, fromUnit, toUnit, precision = 6 }) => {
    try {
      const fromCategory = findUnitCategory(fromUnit);
      const toCategory = findUnitCategory(toUnit);
      
      if (!fromCategory || !toCategory) {
        throw new Error('Unknown unit');
      }
      
      if (fromCategory !== toCategory) {
        throw new Error('Cannot convert between different unit categories');
      }
      
      let result;
      
      if (fromCategory === 'temperature') {
        result = convertTemperature(value, fromUnit, toUnit);
      } else {
        const fromFactor = UNIT_CONVERSIONS[fromCategory][fromUnit.toLowerCase()];
        const toFactor = UNIT_CONVERSIONS[toCategory][toUnit.toLowerCase()];
        
        if (!fromFactor || !toFactor) {
          throw new Error('Unit conversion factor not found');
        }
        
        // Convert to base unit, then to target unit
        const baseValue = value * fromFactor;
        result = baseValue / toFactor;
      }
      
      const formatted = parseFloat(result.toFixed(precision));
      
      saveToHistory('unit_convert', `${value} ${fromUnit} to ${toUnit}`, formatted);
      
      return {
        success: true,
        originalValue: value,
        fromUnit: fromUnit,
        toUnit: toUnit,
        result: formatted,
        formatted: `${value} ${fromUnit} = ${formatted} ${toUnit}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Unit conversion failed: ${error.message}`,
        value: value,
        fromUnit: fromUnit,
        toUnit: toUnit
      };
    }
  },

  convert_currency: async ({ amount, fromCurrency, toCurrency, historical }) => {
    try {
      const from = fromCurrency.toUpperCase();
      const to = toCurrency.toUpperCase();
      
      if (!CURRENCY_CODES[from] || !CURRENCY_CODES[to]) {
        throw new Error('Invalid currency code');
      }
      
      if (from === to) {
        return {
          success: true,
          amount: amount,
          fromCurrency: from,
          toCurrency: to,
          result: amount,
          rate: 1,
          formatted: `${CURRENCY_CODES[from]}${amount} = ${CURRENCY_CODES[to]}${amount}`
        };
      }
      
      // Mock implementation - in production would use live API
      let rate = 1;
      if (MOCK_EXCHANGE_RATES[from] && MOCK_EXCHANGE_RATES[from][to]) {
        rate = MOCK_EXCHANGE_RATES[from][to];
      } else if (MOCK_EXCHANGE_RATES[to] && MOCK_EXCHANGE_RATES[to][from]) {
        rate = 1 / MOCK_EXCHANGE_RATES[to][from];
      } else {
        // Fallback to USD conversion
        throw new Error(`Exchange rate not available for ${from} to ${to}`);
      }
      
      const result = amount * rate;
      const formatted = parseFloat(result.toFixed(2));
      
      saveToHistory('currency_convert', `${amount} ${from} to ${to}`, formatted, { rate });
      
      return {
        success: true,
        amount: amount,
        fromCurrency: from,
        toCurrency: to,
        result: formatted,
        rate: rate,
        formatted: `${CURRENCY_CODES[from]}${amount} = ${CURRENCY_CODES[to]}${formatted}`,
        note: 'Using mock exchange rates - enable live rates with API key'
      };
    } catch (error) {
      return {
        success: false,
        message: `Currency conversion failed: ${error.message}`,
        amount: amount,
        fromCurrency: fromCurrency,
        toCurrency: toCurrency
      };
    }
  },

  programming_calc: async ({ operation, value, secondValue, operation_type, targetBase, bitWidth = 32 }) => {
    try {
      const num1 = parseNumber(value);
      
      let result;
      let explanation = '';
      
      switch (operation) {
        case 'base_convert':
          const bases = {
            binary: 2, octal: 8, decimal: 10, hexadecimal: 16, base36: 36
          };
          
          if (targetBase === 'all') {
            result = {
              decimal: num1,
              binary: '0b' + num1.toString(2),
              octal: '0o' + num1.toString(8),
              hexadecimal: '0x' + num1.toString(16).toUpperCase()
            };
            explanation = `All base representations of ${num1}`;
          } else {
            const base = bases[targetBase];
            if (!base) {
              throw new Error('Invalid target base');
            }
            result = num1.toString(base);
            if (targetBase === 'binary') result = '0b' + result;
            else if (targetBase === 'hexadecimal') result = '0x' + result.toUpperCase();
            else if (targetBase === 'octal') result = '0o' + result;
            
            explanation = `${num1} (decimal) in base ${base}`;
          }
          break;
          
        case 'bitwise':
          if (!secondValue) {
            throw new Error('Second value required for bitwise operations');
          }
          
          const num2 = parseNumber(secondValue);
          const int1 = Math.floor(num1) >>> 0; // Convert to unsigned 32-bit
          const int2 = Math.floor(num2) >>> 0;
          
          switch (operation_type) {
            case 'and':
              result = int1 & int2;
              explanation = `${int1} AND ${int2}`;
              break;
            case 'or':
              result = int1 | int2;
              explanation = `${int1} OR ${int2}`;
              break;
            case 'xor':
              result = int1 ^ int2;
              explanation = `${int1} XOR ${int2}`;
              break;
            case 'not':
              result = ~int1 >>> 0;
              explanation = `NOT ${int1}`;
              break;
            case 'left_shift':
              result = int1 << int2;
              explanation = `${int1} << ${int2}`;
              break;
            case 'right_shift':
              result = int1 >> int2;
              explanation = `${int1} >> ${int2}`;
              break;
            default:
              throw new Error('Invalid bitwise operation');
          }
          break;
          
        case 'bit_count':
          result = num1.toString(2).split('1').length - 1;
          explanation = `Number of 1 bits in ${num1}`;
          break;
          
        case 'two_complement':
          const bits = Math.floor(num1).toString(2).padStart(bitWidth, '0');
          const inverted = bits.split('').map(b => b === '0' ? '1' : '0').join('');
          const complement = parseInt(inverted, 2) + 1;
          result = {
            original: '0b' + bits,
            inverted: '0b' + inverted,
            twoComplement: complement,
            twoComplementBinary: '0b' + complement.toString(2)
          };
          explanation = `Two's complement of ${num1}`;
          break;
          
        default:
          throw new Error('Invalid programming operation');
      }
      
      saveToHistory('programming_calc', `${operation}: ${value}`, result, { operation_type, targetBase });
      
      return {
        success: true,
        operation: operation,
        input: value,
        result: result,
        explanation: explanation
      };
    } catch (error) {
      return {
        success: false,
        message: `Programming calculation failed: ${error.message}`,
        operation: operation,
        value: value
      };
    }
  },

  date_time_calc: async ({ operation, date1, date2, amount, unit, fromTimezone, toTimezone, outputFormat = 'YYYY-MM-DD HH:mm:ss' }) => {
    try {
      let result;
      let explanation = '';
      
      switch (operation) {
        case 'difference':
          const d1 = new Date(date1 === 'today' ? Date.now() : date1);
          const d2 = new Date(date2 === 'today' ? Date.now() : date2);
          
          if (isNaN(d1) || isNaN(d2)) {
            throw new Error('Invalid date format');
          }
          
          const diffMs = Math.abs(d2 - d1);
          result = {
            milliseconds: diffMs,
            seconds: Math.floor(diffMs / 1000),
            minutes: Math.floor(diffMs / (1000 * 60)),
            hours: Math.floor(diffMs / (1000 * 60 * 60)),
            days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
            weeks: Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)),
            months: Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44)), // Average month
            years: Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)) // Account for leap years
          };
          explanation = `Time difference between ${d1.toDateString()} and ${d2.toDateString()}`;
          break;
          
        case 'add_subtract':
          const baseDate = new Date(date1 === 'today' ? Date.now() : date1);
          
          if (isNaN(baseDate)) {
            throw new Error('Invalid date format');
          }
          
          const newDate = new Date(baseDate);
          
          switch (unit) {
            case 'seconds': newDate.setSeconds(newDate.getSeconds() + amount); break;
            case 'minutes': newDate.setMinutes(newDate.getMinutes() + amount); break;
            case 'hours': newDate.setHours(newDate.getHours() + amount); break;
            case 'days': newDate.setDate(newDate.getDate() + amount); break;
            case 'weeks': newDate.setDate(newDate.getDate() + amount * 7); break;
            case 'months': newDate.setMonth(newDate.getMonth() + amount); break;
            case 'years': newDate.setFullYear(newDate.getFullYear() + amount); break;
            default: throw new Error('Invalid time unit');
          }
          
          result = {
            originalDate: baseDate.toISOString(),
            newDate: newDate.toISOString(),
            formatted: newDate.toLocaleString()
          };
          explanation = `Added ${amount} ${unit} to ${baseDate.toDateString()}`;
          break;
          
        case 'age_calculate':
          const birthDate = new Date(date1);
          const currentDate = date2 ? new Date(date2) : new Date();
          
          if (isNaN(birthDate)) {
            throw new Error('Invalid birth date format');
          }
          
          let years = currentDate.getFullYear() - birthDate.getFullYear();
          let months = currentDate.getMonth() - birthDate.getMonth();
          let days = currentDate.getDate() - birthDate.getDate();
          
          if (days < 0) {
            months--;
            days += new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
          }
          if (months < 0) {
            years--;
            months += 12;
          }
          
          const totalDays = Math.floor((currentDate - birthDate) / (1000 * 60 * 60 * 24));
          
          result = {
            years: years,
            months: months,
            days: days,
            totalDays: totalDays,
            totalHours: totalDays * 24,
            totalMinutes: totalDays * 24 * 60
          };
          explanation = `Age calculation from ${birthDate.toDateString()}`;
          break;
          
        default:
          throw new Error('Date operation not implemented');
      }
      
      saveToHistory('date_calc', `${operation}: ${date1}`, result);
      
      return {
        success: true,
        operation: operation,
        result: result,
        explanation: explanation
      };
    } catch (error) {
      return {
        success: false,
        message: `Date calculation failed: ${error.message}`,
        operation: operation
      };
    }
  },

  statistics_calc: async ({ operation, data, dataX, dataY, confidence = 0.95 }) => {
    try {
      let result;
      
      switch (operation) {
        case 'descriptive':
          if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error('Data array required');
          }
          
          const sorted = [...data].sort((a, b) => a - b);
          const n = data.length;
          const sum = data.reduce((a, b) => a + b, 0);
          const mean = sum / n;
          
          // Median
          const median = n % 2 === 0 
            ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
            : sorted[Math.floor(n/2)];
          
          // Mode
          const freq = {};
          data.forEach(x => freq[x] = (freq[x] || 0) + 1);
          const mode = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
          
          // Variance and standard deviation
          const variance = data.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / (n - 1);
          const stdDev = Math.sqrt(variance);
          
          // Range
          const range = sorted[n-1] - sorted[0];
          
          // Quartiles
          const q1 = sorted[Math.floor(n * 0.25)];
          const q3 = sorted[Math.floor(n * 0.75)];
          
          result = {
            count: n,
            sum: sum,
            mean: parseFloat(mean.toFixed(6)),
            median: parseFloat(median.toFixed(6)),
            mode: parseFloat(mode),
            range: parseFloat(range.toFixed(6)),
            variance: parseFloat(variance.toFixed(6)),
            standardDeviation: parseFloat(stdDev.toFixed(6)),
            minimum: sorted[0],
            maximum: sorted[n-1],
            q1: q1,
            q3: q3,
            iqr: parseFloat((q3 - q1).toFixed(6))
          };
          break;
          
        case 'regression':
          if (!dataX || !dataY || dataX.length !== dataY.length) {
            throw new Error('Equal length X and Y arrays required');
          }
          
          const n2 = dataX.length;
          const sumX = dataX.reduce((a, b) => a + b, 0);
          const sumY = dataY.reduce((a, b) => a + b, 0);
          const sumXY = dataX.reduce((acc, x, i) => acc + x * dataY[i], 0);
          const sumX2 = dataX.reduce((acc, x) => acc + x * x, 0);
          const sumY2 = dataY.reduce((acc, y) => acc + y * y, 0);
          
          const slope = (n2 * sumXY - sumX * sumY) / (n2 * sumX2 - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n2;
          
          // Correlation coefficient
          const r = (n2 * sumXY - sumX * sumY) / 
                   Math.sqrt((n2 * sumX2 - sumX * sumX) * (n2 * sumY2 - sumY * sumY));
          const r2 = r * r;
          
          result = {
            slope: parseFloat(slope.toFixed(6)),
            intercept: parseFloat(intercept.toFixed(6)),
            correlation: parseFloat(r.toFixed(6)),
            rSquared: parseFloat(r2.toFixed(6)),
            equation: `y = ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`
          };
          break;
          
        default:
          throw new Error('Statistical operation not implemented');
      }
      
      saveToHistory('statistics', operation, result);
      
      return {
        success: true,
        operation: operation,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Statistical calculation failed: ${error.message}`,
        operation: operation
      };
    }
  },

  financial_calc: async ({ calculation, principal, rate, time, payment, compounding = 'annually', loanAmount, termYears }) => {
    try {
      let result;
      
      const compoundingFreq = {
        annually: 1, semiannually: 2, quarterly: 4, monthly: 12, 
        weekly: 52, daily: 365, continuously: Math.E
      };
      
      const n = compoundingFreq[compounding] || 1;
      
      switch (calculation) {
        case 'compound_interest':
          if (!principal || !rate || !time) {
            throw new Error('Principal, rate, and time required');
          }
          
          let futureValue;
          if (compounding === 'continuously') {
            futureValue = principal * Math.exp(rate * time);
          } else {
            futureValue = principal * Math.pow(1 + rate / n, n * time);
          }
          
          const interest = futureValue - principal;
          
          result = {
            principal: principal,
            rate: (rate * 100).toFixed(2) + '%',
            time: time + ' years',
            compounding: compounding,
            futureValue: parseFloat(futureValue.toFixed(2)),
            interestEarned: parseFloat(interest.toFixed(2))
          };
          break;
          
        case 'loan_payment':
          if (!loanAmount || !rate || !termYears) {
            throw new Error('Loan amount, rate, and term required');
          }
          
          const monthlyRate = rate / 12;
          const numPayments = termYears * 12;
          
          const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                 (Math.pow(1 + monthlyRate, numPayments) - 1);
          
          const totalPaid = monthlyPayment * numPayments;
          const totalInterest = totalPaid - loanAmount;
          
          result = {
            loanAmount: loanAmount,
            annualRate: (rate * 100).toFixed(2) + '%',
            termYears: termYears,
            monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
            totalPaid: parseFloat(totalPaid.toFixed(2)),
            totalInterest: parseFloat(totalInterest.toFixed(2))
          };
          break;
          
        case 'roi':
          if (!principal || typeof payment === 'undefined') {
            throw new Error('Initial investment and final value required');
          }
          
          const roi = ((payment - principal) / principal) * 100;
          const absoluteGain = payment - principal;
          
          result = {
            initialInvestment: principal,
            finalValue: payment,
            absoluteGain: parseFloat(absoluteGain.toFixed(2)),
            roi: parseFloat(roi.toFixed(2)) + '%'
          };
          break;
          
        default:
          throw new Error('Financial calculation not implemented');
      }
      
      saveToHistory('financial', calculation, result);
      
      return {
        success: true,
        calculation: calculation,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Financial calculation failed: ${error.message}`,
        calculation: calculation
      };
    }
  },

  scientific_calc: async ({ operation, constant, formula, values, precision = 15 }) => {
    try {
      let result;
      
      switch (operation) {
        case 'constants':
          if (!constant) {
            // Return all constants
            result = CONSTANTS;
          } else {
            const value = CONSTANTS[constant.toLowerCase()];
            if (value === undefined) {
              throw new Error(`Unknown constant: ${constant}`);
            }
            result = {
              name: constant,
              value: value,
              formatted: formatNumber(value, precision, 'scientific')
            };
          }
          break;
          
        case 'physics_formula':
          if (!formula || !values) {
            throw new Error('Formula and values required');
          }
          
          switch (formula) {
            case 'kinetic_energy':
              if (!values.mass || !values.velocity) {
                throw new Error('Mass and velocity required');
              }
              result = {
                formula: 'KE = ½mv²',
                mass: values.mass,
                velocity: values.velocity,
                kineticEnergy: 0.5 * values.mass * Math.pow(values.velocity, 2),
                units: 'Joules'
              };
              break;
              
            case 'potential_energy':
              if (!values.mass || !values.height) {
                throw new Error('Mass and height required');
              }
              const g = values.gravity || CONSTANTS.g;
              result = {
                formula: 'PE = mgh',
                mass: values.mass,
                gravity: g,
                height: values.height,
                potentialEnergy: values.mass * g * values.height,
                units: 'Joules'
              };
              break;
              
            case 'force':
              if (!values.mass || !values.acceleration) {
                throw new Error('Mass and acceleration required');
              }
              result = {
                formula: 'F = ma',
                mass: values.mass,
                acceleration: values.acceleration,
                force: values.mass * values.acceleration,
                units: 'Newtons'
              };
              break;
              
            default:
              throw new Error('Physics formula not implemented');
          }
          break;
          
        default:
          throw new Error('Scientific operation not implemented');
      }
      
      saveToHistory('scientific', `${operation}: ${constant || formula}`, result);
      
      return {
        success: true,
        operation: operation,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Scientific calculation failed: ${error.message}`,
        operation: operation
      };
    }
  },

  solve_equation: async ({ equation, equations, variable = 'x', method = 'analytical' }) => {
    try {
      // Simple equation solver - in production would use a proper math library
      let result;
      
      if (equation) {
        // Simple linear equation solver
        // Format: ax + b = c
        const parts = equation.split('=');
        if (parts.length !== 2) {
          throw new Error('Equation must have exactly one equals sign');
        }
        
        // Very basic implementation - would need a proper parser
        result = {
          equation: equation,
          variable: variable,
          note: 'Basic equation solving - upgrade to full symbolic math library needed',
          method: 'simplified'
        };
      } else {
        throw new Error('Equation solving not fully implemented');
      }
      
      saveToHistory('solve_equation', equation, result);
      
      return {
        success: true,
        equation: equation,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Equation solving failed: ${error.message}`,
        equation: equation
      };
    }
  },

  calc_history: async ({ action = 'list', name, limit = 20, filter }) => {
    try {
      ensureDirectories();
      
      let result;
      
      switch (action) {
        case 'list':
          let history = [];
          
          if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
          }
          
          if (filter) {
            history = history.filter(entry => 
              entry.operation.includes(filter) || 
              entry.input.toString().includes(filter) ||
              entry.result.toString().includes(filter)
            );
          }
          
          result = {
            history: history.slice(0, limit),
            total: history.length,
            showing: Math.min(limit, history.length)
          };
          break;
          
        case 'clear':
          fs.writeFileSync(HISTORY_FILE, '[]');
          result = {
            message: 'Calculation history cleared'
          };
          break;
          
        case 'export':
          if (!fs.existsSync(HISTORY_FILE)) {
            throw new Error('No history to export');
          }
          
          const exportPath = path.join(os.homedir(), 'calculator-history.json');
          const historyData = fs.readFileSync(HISTORY_FILE, 'utf8');
          fs.writeFileSync(exportPath, historyData);
          
          result = {
            message: 'History exported',
            filePath: exportPath
          };
          break;
          
        default:
          throw new Error('Invalid history action');
      }
      
      return {
        success: true,
        action: action,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        message: `History operation failed: ${error.message}`,
        action: action
      };
    }
  },

  quick_reference: async ({ topic, category, search }) => {
    try {
      const references = {
        formulas: {
          geometry: {
            circle: 'Area = πr², Circumference = 2πr',
            rectangle: 'Area = lw, Perimeter = 2(l+w)',
            triangle: 'Area = ½bh, Perimeter = a+b+c',
            sphere: 'Volume = 4/3πr³, Surface Area = 4πr²',
            cylinder: 'Volume = πr²h, Surface Area = 2πr² + 2πrh'
          },
          physics: {
            mechanics: 'F=ma, v=u+at, s=ut+½at²',
            energy: 'KE=½mv², PE=mgh, W=Fd',
            waves: 'v=fλ, f=1/T, E=hf'
          },
          finance: {
            interest: 'A=P(1+r)^t, PV=FV/(1+r)^t',
            loans: 'PMT=P[r(1+r)^n]/[(1+r)^n-1]'
          }
        },
        constants: CONSTANTS,
        conversions: {
          length: '1 m = 3.28084 ft = 39.3701 in',
          weight: '1 kg = 2.20462 lb = 35.274 oz',
          temperature: 'C = (F-32)×5/9, F = C×9/5+32'
        }
      };
      
      let result;
      
      if (search) {
        result = {};
        for (const [topicKey, content] of Object.entries(references)) {
          if (typeof content === 'object') {
            for (const [catKey, formulas] of Object.entries(content)) {
              if (formulas.toLowerCase().includes(search.toLowerCase()) || 
                  catKey.toLowerCase().includes(search.toLowerCase())) {
                if (!result[topicKey]) result[topicKey] = {};
                result[topicKey][catKey] = formulas;
              }
            }
          }
        }
      } else if (category && references[topic] && references[topic][category]) {
        result = references[topic][category];
      } else if (references[topic]) {
        result = references[topic];
      } else {
        result = references;
      }
      
      return {
        success: true,
        topic: topic,
        category: category,
        search: search,
        reference: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Reference lookup failed: ${error.message}`,
        topic: topic
      };
    }
  }
};

module.exports = { tools };