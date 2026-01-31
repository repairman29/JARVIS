# Calculator — Advanced Mathematical Computing

Use this skill for **mathematical calculations**, **unit conversions**, **currency exchange**, **programming calculations**, **financial modeling**, and **scientific computations**. Provides comprehensive calculation capabilities that far surpass Raycast's basic calculator with advanced mathematics, real-time data, and intelligent context understanding.

## Setup

1. Install the skill: `clawdbot skills install ./skills/calculator` or copy to `~/jarvis/skills/calculator`.
2. **Environment variables** (optional):
   - `JARVIS_CALC_PRECISION` - Default decimal precision (default 10)
   - `JARVIS_CALC_CURRENCY_API_KEY` - API key for live currency rates
   - `JARVIS_CALC_PREFERRED_UNITS` - Default unit preferences (metric/imperial)
3. **Dependencies**: No additional dependencies required
4. Restart gateway: `clawdbot gateway restart`

## When to use

- **Basic math**: "calculate 15% of 240", "what's sqrt(144)?", "2^10"
- **Unit conversions**: "convert 5 miles to kilometers", "100 fahrenheit to celsius"
- **Currency**: "convert 100 USD to EUR", "exchange rate for GBP to JPY"
- **Programming**: "convert FF to binary", "bitwise AND of 1010 and 1100"
- **Date calculations**: "days between Jan 1 and today", "add 45 days to March 15"
- **Financial**: "compound interest on $1000 at 5% for 10 years"
- **Scientific**: "speed of light", "kinetic energy formula", "standard deviation"

## Tools

| Tool | Use for |
|------|---------|
| `calculate` | Basic and advanced mathematical expressions |
| `convert_units` | Length, weight, temperature, volume conversions |
| `convert_currency` | Currency exchange with live rates |
| `programming_calc` | Binary, hex, bitwise operations, base conversions |
| `date_time_calc` | Date differences, additions, timezone conversions |
| `statistics_calc` | Mean, median, regression, probability calculations |
| `financial_calc` | Interest, loans, investments, ROI calculations |
| `scientific_calc` | Physical constants, formulas, advanced functions |
| `solve_equation` | Equation solving and systems of equations |
| `calc_history` | Calculation history management |
| `quick_reference` | Mathematical formulas and constants reference |

## Examples

### Basic Mathematical Calculations
- **"Calculate 15% of 240"** → `calculate({ expression: "0.15 * 240" })`
- **"What's the square root of 144?"** → `calculate({ expression: "sqrt(144)" })`
- **"2 to the power of 10"** → `calculate({ expression: "2^10" })`
- **"Sine of 45 degrees"** → `calculate({ expression: "sin(45)", degrees: true })`

### Unit Conversions
- **"Convert 5 miles to kilometers"** → `convert_units({ value: 5, fromUnit: "miles", toUnit: "kilometers" })`
- **"100 degrees Fahrenheit to Celsius"** → `convert_units({ value: 100, fromUnit: "fahrenheit", toUnit: "celsius" })`
- **"50 pounds to kilograms"** → `convert_units({ value: 50, fromUnit: "pounds", toUnit: "kilograms" })`
- **"2 liters to gallons"** → `convert_units({ value: 2, fromUnit: "liters", toUnit: "gallons" })`

### Currency Conversion
- **"Convert 100 USD to EUR"** → `convert_currency({ amount: 100, fromCurrency: "USD", toCurrency: "EUR" })`
- **"Exchange rate for GBP to JPY"** → `convert_currency({ amount: 1, fromCurrency: "GBP", toCurrency: "JPY" })`
- **"1000 euros to dollars"** → `convert_currency({ amount: 1000, fromCurrency: "EUR", toCurrency: "USD" })`

### Programming Calculations
- **"Convert FF hex to binary"** → `programming_calc({ operation: "base_convert", value: "0xFF", targetBase: "binary" })`
- **"Bitwise AND of 1010 and 1100"** → `programming_calc({ operation: "bitwise", value: "0b1010", secondValue: "0b1100", operation_type: "and" })`
- **"Convert 255 to all bases"** → `programming_calc({ operation: "base_convert", value: "255", targetBase: "all" })`

### Date and Time Calculations
- **"Days between January 1 and today"** → `date_time_calc({ operation: "difference", date1: "2024-01-01", date2: "today" })`
- **"Add 45 days to March 15, 2024"** → `date_time_calc({ operation: "add_subtract", date1: "2024-03-15", amount: 45, unit: "days" })`
- **"Convert 3pm EST to PST"** → `date_time_calc({ operation: "timezone_convert", date1: "15:00", fromTimezone: "EST", toTimezone: "PST" })`

### Financial Calculations
- **"Compound interest on $1000 at 5% for 10 years"** → `financial_calc({ calculation: "compound_interest", principal: 1000, rate: 0.05, time: 10 })`
- **"Monthly payment on $200k mortgage at 4.5% for 30 years"** → `financial_calc({ calculation: "loan_payment", loanAmount: 200000, rate: 0.045, termYears: 30 })`
- **"Future value of $500/month at 7% for 20 years"** → `financial_calc({ calculation: "investment_growth", payment: 500, rate: 0.07, time: 20 })`

### Statistical Calculations
- **"Mean and standard deviation of [1,2,3,4,5]"** → `statistics_calc({ operation: "descriptive", data: [1,2,3,4,5] })`
- **"Linear regression of x=[1,2,3] y=[2,4,6]"** → `statistics_calc({ operation: "regression", dataX: [1,2,3], dataY: [2,4,6] })`

### Scientific Calculations
- **"Speed of light constant"** → `scientific_calc({ operation: "constants", constant: "c" })`
- **"Kinetic energy with mass 10kg, velocity 5m/s"** → `scientific_calc({ operation: "physics_formula", formula: "kinetic_energy", values: { mass: 10, velocity: 5 } })`

## Advanced Features

### Smart Expression Parsing
Supports natural language mathematical expressions:
- **Percentages**: "15% of 240", "increase 100 by 25%"
- **Fractions**: "1/3 + 1/4", "2 3/4 + 1 1/2"
- **Scientific notation**: "1.5e6 * 2.3e-4"
- **Complex numbers**: "3 + 4i", "sqrt(-1)"
- **Constants**: "pi", "e", "phi" (golden ratio)

### Comprehensive Unit Support

**Length**: mm, cm, m, km, in, ft, yd, mi, nmi, au, ly
**Weight**: g, kg, oz, lb, ton, stone
**Temperature**: C, F, K, R
**Volume**: ml, l, gal, qt, pt, cup, fl oz, tbsp, tsp
**Area**: m², ft², acre, hectare
**Speed**: mph, kph, m/s, knots, mach
**Energy**: J, kJ, cal, kcal, BTU, kWh
**Power**: W, kW, MW, hp
**Pressure**: Pa, kPa, bar, atm, psi, mmHg
**Data**: bit, byte, KB, MB, GB, TB, PB

### Programming Features

**Number Systems**:
- Binary (0b1010), Octal (0o777), Decimal (255), Hexadecimal (0xFF)
- Base-2 through Base-36 conversions
- IEEE 754 floating point analysis

**Bitwise Operations**:
- AND, OR, XOR, NOT operations
- Left shift, right shift
- Bit counting and manipulation
- Two's complement representation

### Financial Modeling

**Interest Calculations**:
- Simple and compound interest
- Continuous compounding
- Effective annual rate

**Loan Analysis**:
- Monthly payment calculation
- Amortization schedules
- Total interest paid
- Early payoff scenarios

**Investment Analysis**:
- Present and future value
- Return on investment (ROI)
- Internal rate of return (IRR)
- Net present value (NPV)

### Statistical Analysis

**Descriptive Statistics**:
- Mean, median, mode
- Standard deviation, variance
- Quartiles and percentiles
- Skewness and kurtosis

**Inferential Statistics**:
- Confidence intervals
- Hypothesis testing
- Chi-square tests
- ANOVA analysis

**Regression Analysis**:
- Linear and polynomial regression
- Correlation coefficients
- R-squared values
- Prediction intervals

## Natural Language Intelligence

JARVIS understands conversational mathematical requests:

### Contextual Understanding
- **"What's 15% tip on a $45 bill?"** → Calculates percentage with context
- **"If I save $200/month at 3% interest, how much in 5 years?"** → Financial calculation
- **"Convert my height (5'10") to centimeters"** → Unit conversion with natural input

### Smart Defaults
- **"Convert 100 degrees"** → Assumes Fahrenheit to Celsius based on context
- **"Exchange rate today"** → Uses user's local currency preferences
- **"Distance to work in miles"** → Uses preferred unit system

### Chain Calculations
- **"Calculate 15% of 240, then add 50"** → Multi-step calculations
- **"Convert 5 miles to km, then calculate time at 60 km/h"** → Complex workflows
- **"What's my age in days?"** → Date calculation from context

## Integration with Other Skills

### File Search Integration
- **"Calculate total file sizes in Downloads folder"** → File data + calculation
- **"Average file size in my projects"** → Statistical analysis of file data

### Clipboard History Integration
- **"Calculate the numbers I copied"** → Use clipboard data in calculations
- **"Convert the measurement I copied to metric"** → Unit conversion from clipboard

### AI Workflow Integration
- **"Analyze this dataset"** → Statistical analysis with AI insights
- **"Optimize this financial scenario"** → AI-powered financial modeling

## Currency Exchange Features

### Live Exchange Rates
- **Real-time rates**: Updated rates from multiple sources
- **Historical rates**: Convert using past exchange rates
- **Rate alerts**: Track currency fluctuations
- **Multiple sources**: Fallback providers for reliability

### Supported Currencies
Major currencies: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, BRL
Cryptocurrencies: BTC, ETH, LTC, XRP, ADA, DOT (optional)
All ISO 4217 currency codes supported

## Scientific Constants Library

### Physical Constants
- **Speed of light** (c): 299,792,458 m/s
- **Planck's constant** (h): 6.62607015e-34 J⋅s
- **Gravitational constant** (G): 6.67430e-11 m³⋅kg⁻¹⋅s⁻²
- **Electron mass** (me): 9.1093837015e-31 kg
- **Proton mass** (mp): 1.67262192369e-27 kg
- **Avogadro's number** (NA): 6.02214076e23 mol⁻¹

### Mathematical Constants
- **Pi** (π): 3.14159265358979...
- **Euler's number** (e): 2.71828182845904...
- **Golden ratio** (φ): 1.61803398874989...
- **Square root of 2** (√2): 1.41421356237309...

## Performance & Accuracy

### High-Precision Arithmetic
- **Decimal precision**: Up to 50 decimal places
- **Scientific notation**: Full range support
- **Error handling**: Graceful overflow/underflow handling
- **Rounding modes**: Multiple rounding strategies

### Optimized Calculations
- **Caching**: Frequently used results cached
- **Parallel processing**: Complex calculations parallelized
- **Memory efficient**: Optimized for large datasets
- **Fast algorithms**: Optimized mathematical libraries

## Configuration Examples

### Environment Variables
```bash
# Set default precision to 15 decimal places
export JARVIS_CALC_PRECISION=15

# Currency API key for live rates
export JARVIS_CALC_CURRENCY_API_KEY="your_api_key_here"

# Preferred unit system
export JARVIS_CALC_PREFERRED_UNITS="metric"  # or "imperial"
```

### Custom Functions
```javascript
// Example of adding custom mathematical functions
const customFunctions = {
  bmi: (weight, height) => weight / (height * height),
  compound: (principal, rate, time, n) => principal * Math.pow(1 + rate/n, n*time)
};
```

## Troubleshooting

### Common Issues

**Currency conversion not working**:
- Check internet connection for live rates
- Verify currency codes are valid (ISO 4217)
- Check API key if using premium currency service

**Precision errors in calculations**:
- Use string input for very large numbers
- Adjust precision setting for requirements
- Use fraction format for exact rational numbers

**Unit conversion not recognized**:
- Check supported unit names in documentation
- Try alternative unit names (e.g., "mph" vs "miles per hour")
- Use singular form of units ("meter" not "meters")

### Performance Tips

1. **Use appropriate precision** - higher precision is slower
2. **Cache repeated calculations** - JARVIS remembers recent results
3. **Batch unit conversions** - convert multiple values at once
4. **Use scientific notation** for very large/small numbers

## Comparison with Alternatives

| Feature | Raycast Calculator | Spotlight | Wolfram Alpha | JARVIS Calculator |
|---------|-------------------|-----------|---------------|-------------------|
| **Basic Math** | Good | Basic | Excellent | Excellent |
| **Unit Conversion** | Limited | Basic | Excellent | Comprehensive |
| **Currency** | Basic | None | Good | Live rates + historical |
| **Programming** | None | None | Limited | Full support |
| **Financial** | None | None | Good | Advanced modeling |
| **Scientific** | None | None | Excellent | Comprehensive |
| **Natural Language** | Limited | None | Excellent | Full conversation |
| **History** | Basic | None | Account-based | Local + exportable |
| **Integration** | Limited | System | None | Full JARVIS ecosystem |
| **Offline** | Yes | Yes | No | Yes (except currency) |

## Tips for Power Users

1. **Create calculation shortcuts** with snippet skill for common formulas
2. **Use calculation history** to build on previous results
3. **Combine with file search** for data analysis workflows
4. **Set up currency alerts** for international transactions
5. **Use scientific constants** for physics and chemistry calculations
6. **Export calculations** for documentation and reports

This skill transforms JARVIS into the most powerful calculator system available, combining mathematical precision with natural language understanding and seamless integration with your complete workflow ecosystem.