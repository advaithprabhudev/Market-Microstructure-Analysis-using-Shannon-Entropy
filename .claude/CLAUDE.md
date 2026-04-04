# Claude.MD - Market Microstructure Analysis Framework

## Project Overview

**Market Microstructure Analysis Framework** - A Python-based financial market analysis system that uses Shannon entropy and information-theoretic techniques to detect market regimes, quantify microstructure costs, and identify anomalous trading conditions.

**Location:** `c:\Users\prabh\Technical_Project`  
**Python Version:** 3.8+  
**Key Dependencies:** numpy, pandas, scipy, matplotlib, streamlit

---

## Core Architecture

### Module Organization

```
src/
├── config.py                 # Global configuration, constants, paths
├── entropy_core.py          # Shannon, Renyi, approximate entropy calculations
├── data_handler.py          # Tick data generation and I/O
├── microstructure.py        # Bid-ask analysis, regime detection, order flow
├── utils.py                 # Data processing, validation, discretization
├── visualization.py         # Matplotlib plotting and figure generation
├── comprehensive_analysis.py # Full pipeline orchestration
├── regime_analysis.py       # Multi-scale entropy and regime transitions
├── streamlit_app.py         # Interactive UI (6 analysis pages)
├── validation_tester.py     # Automated test suite
└── deploy.py                # Deployment utilities
```

### Data Flow

```
DataHandler → Raw Tick Data
    ↓
EntropyCalculator → Entropy Metrics
    ↓
MicrostructureAnalyzer → Bid-Ask, Order Flow, Regimes
    ↓
Visualizer → PNG Charts
    ↓
results/ → JSON reports + PNG outputs
```

---

## Key Design Patterns

### 1. Configuration-Driven Constants
All runtime parameters centralized in `config.py`:
- Entropy bins: `ENTROPY_BINS_DEFAULT = 10`
- Thresholds: `ENTROPY_THRESHOLD_NORMALIZED = 0.65`
- Rolling window sizes: `ROLLING_WINDOW_SIZE = 100`
- Bootstrap params: `BOOTSTRAP_ITERATIONS = 1000`

**Usage:** Import and reference constants, avoid hardcoding.
```python
from config import ENTROPY_BINS_DEFAULT, ENTROPY_THRESHOLD_NORMALIZED
```

### 2. Dataclasses for Structured Returns
Core data structures use `@dataclass` for clarity and type safety:

```python
@dataclass
class EntropyMetrics:
    entropy: float
    normalized_entropy: float
    probability_distribution: np.ndarray
    bin_edges: np.ndarray
    sample_size: int
    method: str

@dataclass
class MicrostructureSnapshot:
    timestamp: pd.Timestamp
    bid: float
    ask: float
    spread_bps: float
    spread_entropy: float
    return_entropy: float
    # ... more fields

@dataclass
class RegimeCharacteristics:
    regime_id: int
    start_time: pd.Timestamp
    end_time: pd.Timestamp
    duration_minutes: float
    # ... more fields
```

**Pattern:** Always return dataclass instances instead of dicts for structured data.

### 3. Type Hints Throughout
All functions have explicit type annotations:
```python
def analyze_bid_ask_dynamics(self, bids: np.ndarray,
                             asks: np.ndarray) -> Dict:
    
def calculate_log_returns(prices: np.ndarray) -> np.ndarray:

def discretize_data(data: np.ndarray, n_bins: int, 
                   method: str = "quantile") -> Tuple[np.ndarray, np.ndarray]:
```

**Convention:** Return types are explicit. Raise `ValueError` for invalid inputs.

### 4. Comprehensive Input Validation
Functions validate inputs early:

```python
def validate_price_series(prices: np.ndarray) -> bool:
    if not isinstance(prices, (np.ndarray, pd.Series)):
        raise TypeError("Prices must be numpy array or pandas Series")
    if len(prices) < 2:
        raise ValueError("Price series must have at least 2 observations")
    if np.any(prices <= 0):
        raise ValueError("Prices must be strictly positive")
    if np.any(np.isnan(prices) | np.isinf(prices)):
        raise ValueError("Prices contain NaN or infinite values")
    return True
```

**Pattern:** Fail fast with descriptive error messages.

### 5. Path Management
Use `pathlib.Path` for all file operations:
```python
from pathlib import Path

DATA_DIR = BASE_DIR / "data"
RESULTS_DIR = BASE_DIR / "results"
filepath = self.data_dir / filename
```

**Never** use string concatenation for paths.

### 6. Relative/Absolute Import Fallback
Handle both package imports and direct script execution:

```python
try:
    from entropy_core import EntropyCalculator
    from utils import calculate_log_returns
except ImportError:
    from .entropy_core import EntropyCalculator
    from .utils import calculate_log_returns
```

**Pattern:** Try absolute first, fall back to relative for package execution.

### 7. Sys.path Management
Insert current module directory for proper imports:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
```

---

## Core Components

### EntropyCalculator (`entropy_core.py`)
Computes information-theoretic measures on discretized price series.

**Methods:**
- `shannon_entropy(data)` → EntropyMetrics
- `renyi_entropy(data, alpha=2.0)` → float
- `approximate_entropy(data, embedding_dim=2, tolerance=None)` → float

**Key Insight:** Normalized entropy > 0.65 indicates random/efficient pricing; < 0.65 indicates structured/mean-reverting.

### MicrostructureAnalyzer (`microstructure.py`)
Analyzes bid-ask dynamics and market regimes.

**Methods:**
- `analyze_bid_ask_dynamics(bids, asks)` → Dict
  - Returns: spread stats, spread entropy, skewness, kurtosis
- `calculate_order_flow_toxicity(buys, sells, next_returns)` → float
- `detect_regime_transitions(df, lookback=100)` → List[Dict]

**Outputs:**
- Spread analysis (bps, entropy, skewness)
- Volatility metrics
- Price efficiency ratios
- Order flow toxicity scores

### DataHandler (`data_handler.py`)
Manages tick data generation and loading.

**Methods:**
- `load_csv(filename)` → pd.DataFrame
- `create_tick_data(n_ticks)` → pd.DataFrame
- `create_ohlcv_data(n_periods)` → pd.DataFrame

**Data Schema:**
```python
{
    'timestamp': pd.Timestamp,
    'bid': float,
    'ask': float,
    'mid': float,
    'volume': int
}
```

### Visualizer (`visualization.py`)
Generates publication-quality matplotlib charts.

**Methods:**
- `plot_bid_ask_dynamics(df)` → str (filepath)
- `plot_entropy_time_series(df)` → str
- `plot_returns_distribution(returns)` → str
- `plot_spread_analysis(spreads)` → str

**Style:**
- Color palette defined in `_setup_style()`: bid (#2E86AB), ask (#A23B72), mid (#F18F01)
- DPI: 100 (configurable)
- Format: PNG with tight bounding box

---

## Critical Constants & Thresholds

| Constant | Value | Usage |
|----------|-------|-------|
| `ENTROPY_THRESHOLD_NORMALIZED` | 0.65 | Separates random vs. structured pricing |
| `REGIME_ENTROPY_CHANGE_THRESHOLD` | 0.25 | Minimum entropy delta for regime transition |
| `REGIME_DETECTION_LOOKBACK_WINDOW` | 100 | Samples for regime analysis |
| `ENTROPY_BINS_DEFAULT` | 10 | Discretization bins for entropy |
| `ROLLING_WINDOW_SIZE` | 100 | Samples for rolling metrics |
| `BOOTSTRAP_CI_LEVEL` | 0.95 | Confidence interval for bootstrapping |

**Note:** `ENTROPY_THRESHOLD_NORMALIZED (0.65)` requires real data calibration; currently based on synthetic data only.

---

## Entropy Interpretation Guide

### Normalized Entropy Values
- **> 0.75:** High randomness, no pattern (efficient market)
- **0.65 - 0.75:** Moderate efficiency
- **0.50 - 0.65:** Structured pricing, mean-reverting tendencies
- **< 0.50:** Strong non-random behavior, predictability possible

### Spread Entropy
- **High entropy (> 0.7):** Spreads are unpredictable, high market uncertainty
- **Low entropy (< 0.4):** Spreads are predictable, stable liquidity

### Order Flow Toxicity
- **High toxicity (> 0.5):** Adverse selection risk; order flow predicts future price
- **Low toxicity (< 0.2):** Stable market; order flow is random

---

## Common Workflows

### 1. Add a New Metric
1. Implement calculation in appropriate module (entropy_core.py, microstructure.py, utils.py)
2. Add type hints and validation
3. Return as dataclass field or dict value
4. Add visualization in visualization.py
5. Integrate into comprehensive_analysis.py

**Example:**
```python
# In microstructure.py
def calculate_new_metric(self, data: np.ndarray) -> float:
    """Calculate novel metric with proper validation."""
    if len(data) < 10:
        raise ValueError("Need at least 10 samples")
    # Implementation
    return float(result)
```

### 2. Generate Analysis Report
```bash
python src/comprehensive_analysis.py
```
Outputs:
- `results/analysis_report.json` (metrics)
- `results/*_data.csv` (raw results)
- `results/*.png` (visualizations)

### 3. Run Regime Detection
```bash
python src/regime_analysis.py
```
Outputs:
- `results/regime_analysis_report.json`
- Regime transitions with entropy deltas

### 4. Launch Interactive UI
```bash
python run_ui.py
# or
streamlit run src/streamlit_app.py
```
Pages: Overview, Entropy Analysis, Microstructure, Regime Detection, Time Series, Statistical Tests

---

## Best Practices

### Data Validation
✅ Always call `validate_price_series()` on input data  
✅ Check bid/ask invariants: `bids < asks`  
✅ Validate array lengths match before paired operations  
✅ Use `np.any(np.isnan(...))` before statistical calculations

### Error Handling
✅ Raise `ValueError` for data issues  
✅ Raise `TypeError` for type mismatches  
✅ Include expected vs. actual values in error messages  
✅ Never silently return None on error

### Performance
✅ Pre-allocate numpy arrays when possible  
✅ Use `np.sum(probs[probs > 0] * ...)` to skip zero probabilities  
✅ Cache rolling metrics; recalculate only on new data  
✅ Use `numba.jit` for tight loops if needed (currently not used)

### Testing
✅ Run `python src/validation_tester.py` before commits  
✅ Test suite includes 27 tests covering all modules  
✅ Always test with synthetic data first

### Logging
```python
import logging
logger = logging.getLogger(__name__)
logger.info(f"Processing {len(data)} samples")
logger.warning("Spreads have outliers")
logger.error("Invalid price series")
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Module not found" | Python path | Add `sys.path.insert(0, str(Path(__file__).parent))` |
| "n_bins must be >= 2" | Invalid discretization | Use ENTROPY_BINS_DEFAULT from config |
| "Prices contain NaN" | Data quality | Filter data before validation |
| "All bids must be < asks" | Data error | Check bid-ask ordering |
| Visualization not saving | Permission issue | Ensure results/ directory exists and is writable |

---

## Testing Strategy

**Test File:** `src/validation_tester.py` (27 tests)

Run all tests:
```bash
python src/validation_tester.py
```

Test categories:
1. **Data validation** - Input checks, edge cases
2. **Entropy calculations** - Shannon, Renyi, approximate
3. **Microstructure metrics** - Spread analysis, order flow
4. **Regime detection** - Transitions, duration
5. **Utils** - Discretization, rolling windows
6. **Visualization** - Plot generation

---

## Key Dependencies

```
numpy>=1.20.0       # Array operations
pandas>=1.3.0       # DataFrames
scipy>=1.7.0        # Statistics (stats, special)
matplotlib>=3.5.0   # Visualization
streamlit>=1.0.0    # Interactive UI
```

---

## Configuration Reference

**File:** `src/config.py`

Key settings:
```python
# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
RESULTS_DIR = BASE_DIR / "results"
LOGS_DIR = BASE_DIR / "logs"

# Entropy
ENTROPY_BINS_DEFAULT = 10
ENTROPY_METHOD = "quantile"  # or "uniform"
ENTROPY_THRESHOLD_NORMALIZED = 0.65

# Regime detection
REGIME_ENTROPY_CHANGE_THRESHOLD = 0.25
REGIME_DETECTION_LOOKBACK_WINDOW = 100

# Rolling metrics
ROLLING_WINDOW_SIZE = 100
ROLLING_WINDOW_MINUTES = 5

# Data
DATA_FREQ_MILLISECONDS = 100
TICK_SIZE_TOLERANCE = 1e-4

# Statistical tests
BOOTSTRAP_ITERATIONS = 1000
BOOTSTRAP_CI_LEVEL = 0.95
```

---

## File Structure Reference

```
Technical_Project/
├── src/
│   ├── __init__.py
│   ├── config.py                 ← Start here for constants
│   ├── entropy_core.py           ← Entropy computations
│   ├── data_handler.py           ← Data I/O
│   ├── microstructure.py         ← Market analysis
│   ├── utils.py                  ← Helpers
│   ├── visualization.py          ← Charts
│   ├── comprehensive_analysis.py ← Main pipeline
│   ├── regime_analysis.py        ← Regime detection
│   ├── streamlit_app.py          ← UI
│   ├── validation_tester.py      ← Tests
│   └── deploy.py                 ← Deployment
├── data/
│   └── [input data files]
├── results/
│   ├── analysis_report.json
│   ├── regime_analysis_report.json
│   ├── *_data.csv
│   └── *.png
├── logs/
│   └── [log files]
├── requirements.txt
├── README.md
└── run_ui.py                     ← Launch streamlit

```

---

## Development Notes

### Recent Fixes
- Fixed spread skewness calculation to use actual skewness instead of proportion
- Added kurtosis metric for spread distribution tail analysis
- Standardized microstructure snapshot dataclass

### Known Limitations
- Entropy thresholds calibrated on synthetic data only
- Bootstrap analysis not yet integrated into regime detection
- Real tick data loading requires external data source

### Future Enhancements
- [ ] Kallman filter integration for regime smoothing
- [ ] Machine learning classifier for regime prediction
- [ ] High-frequency data optimization (tick batching)
- [ ] Real-time streaming data support
- [ ] GPU acceleration for large datasets

---

## Quick Start for New Code

When adding new functionality:

1. **Follow the dataclass pattern** for return types
2. **Add comprehensive type hints** to all functions
3. **Validate inputs** with clear error messages
4. **Use pathlib** for all file paths
5. **Import from config** for constants
6. **Test with synthetic data** first
7. **Add visualization** if metric is interpretable
8. **Document in comprehensive_analysis.py** output

---

## References

- **Market Microstructure Theory:** Bid-ask spreads, order flow, information asymmetry
- **Information Theory:** Shannon entropy, Renyi entropy, approximate entropy
- **Regime Detection:** Multi-scale entropy analysis, transition detection
- **Financial Engineering:** Microstructure costs, liquidity measurement, volatility regimes

---

**Last Updated:** April 3, 2026  
**Maintainer:** prabh (Technical_Project)  
**Status:** Active development with 8 visualization outputs
