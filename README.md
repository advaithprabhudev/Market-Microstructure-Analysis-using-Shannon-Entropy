# Market Microstructure Analysis Using Shannon Entropy

A comprehensive framework for analyzing financial markets through the lens of information theory. This project combines Shannon entropy calculations with classical market microstructure theory to detect market regimes, quantify liquidity conditions, and identify periods of pricing efficiency or inefficiency.

## What This Project Does

Traditional financial analysis relies on price movements, volatility, and technical indicators. This framework takes a different approach. It uses Shannon entropy, a concept from information theory, to measure the degree of disorder or randomness in market behavior. High entropy suggests efficient markets with random pricing. Low entropy suggests structured, predictable behavior where opportunities for mean reversion might exist.

The system analyzes bid-ask spreads, order flow patterns, price discovery efficiency, and portfolio-wide entropy characteristics. It helps traders and analysts understand whether markets are behaving randomly or exhibiting detectable patterns.

## Core Mathematical Concepts

### Shannon Entropy

Shannon entropy measures the average information content in a dataset. For a probability distribution P, Shannon entropy is defined as:

H = -sum(p_i * log(p_i)) for all i where p_i > 0

The entropy is then normalized by dividing by the maximum possible entropy (log of number of bins) to produce a value between 0 and 1. This normalized entropy has practical interpretation:

- Entropy close to 1.0: Prices are distributed uniformly across bins. This suggests random, efficient pricing behavior.
- Entropy close to 0.0: Prices cluster in specific bins. This suggests structured, predictable behavior.

The framework applies entropy calculations to multiple aspects of market microstructure:

1. **Price Returns Entropy**: Measures randomness in price changes. High entropy indicates efficient markets where predicting the next price movement is difficult.

2. **Spread Entropy**: Analyzes the distribution of bid-ask spreads. Uniform spread behavior (high entropy) suggests stable liquidity. Clustered spreads (low entropy) suggest liquidity varies predictably.

3. **Multiscale Entropy**: Calculates entropy across different time windows simultaneously. This reveals whether patterns exist at short time scales but vanish at longer scales, or vice versa.

### Market Regimes

The system classifies market behavior into three regimes based on entropy values:

- **Low Regime** (entropy < 0.50): Strong non-random behavior. Prices exhibit mean reversion tendencies. Spreads are predictable. Order flow has predictive power.

- **Medium Regime** (0.50 <= entropy < 0.70): Transitional behavior. Some structure exists but not as pronounced. Markets are neither clearly efficient nor clearly inefficient.

- **High Regime** (entropy >= 0.70): Random, efficient behavior. Prices follow a random walk. Spreads are unpredictable. No profitable trading patterns detected.

### Liquidity and Market Microstructure

Beyond entropy, the system calculates several classical microstructure metrics:

1. **Bid-Ask Spread**: The difference between ask and bid prices, expressed in basis points (bps). Tighter spreads indicate better liquidity.

2. **Amihud Illiquidity Ratio**: A measure of how much price movement results from a given volume of trading. Calculated as average(|return| / volume).

3. **Kyle Lambda (proxy)**: Estimates the price impact of trading. Larger values indicate adverse selection or inventory costs.

4. **Roll Spread Estimate**: Infers the effective spread from observed price changes without requiring quote data.

5. **Order Flow Toxicity**: Measures whether trades move prices against the direction of future price movement. High toxicity suggests adverse selection where one side of the market has information advantage.

6. **Price Efficiency Ratio**: Measures the directionality of price movement relative to total price motion. Values close to 1 suggest strong trends. Values close to 0 suggest mean reversion.

7. **Variance Ratio Test**: Compares the variance of returns at different frequencies to detect mean reversion or momentum.

## Project Structure

```
backend/
  main.py                    - FastAPI application entry point
  requirements.txt           - Python dependencies
  
  api/
    routes/
      analysis.py            - Endpoint for multi-ticker analysis
      health.py              - System health check endpoint
      tickers.py             - Ticker lookup and metadata endpoint
    schemas/
      request.py             - Request body definitions (portfolio input)
      response.py            - Response body definitions (analysis results)
  
  core/
    entropy.py               - Shannon entropy calculation engine
    microstructure.py        - Bid-ask spread, order flow, liquidity analysis
    regime.py                - Market regime classification and detection
    portfolio.py             - Multi-ticker aggregation and correlation
    data_fetcher.py          - Yahoo Finance data retrieval
  
  utils/
    math_helpers.py          - Statistical functions, discretization, rolling windows
    validators.py            - Input validation for API requests

frontend/
  src/
    api/
      client.ts              - HTTP client for backend communication
    components/
      charts/                - Plotly-based interactive visualizations
        EntropyHeatmap.tsx       - 2D heatmap of entropy across time scales
        Interactive3DChart.tsx   - 3D surface for multiscale entropy
        LiquidityMetricsChart.tsx - Liquidity indicators over time
        OrderFlowChart.tsx       - Order flow toxicity visualization
        RegimeTimeline.tsx       - Regime periods as colored timeline
        RollingEntropyChart.tsx  - Rolling entropy time series
        SpreadAnalysisChart.tsx   - Bid-ask spread distribution and trends
      dashboard/             - Summary and status components
        EntropyGauge.tsx      - Circular gauge showing current entropy level
        PortfolioHeatmap.tsx  - Heatmap of correlation matrix
        RegimeBadge.tsx       - Current regime indicator
        SummaryBar.tsx        - Key metrics summary
        TickerSelector.tsx    - Multi-select input for ticker selection
      input/                 - User input components
        PortfolioInput.tsx    - Weight allocation interface
      layout/                - Layout structure
        Navbar.tsx            - Navigation header
        PageTransition.tsx    - Page transition animations
      terminal/              - Terminal-style chat interface
        TerminalChat.tsx      - AI assistant for analysis queries
    pages/
      DashboardPage.tsx      - Main analysis dashboard
      LandingPage.tsx        - Project introduction page
    store/
      analysisStore.ts       - State management for analysis results
    hooks/
      useAnalysis.ts         - React hook for analysis API calls
      useAnimatedNumber.ts   - Animation hook for numeric changes
    types/
      api.ts                 - TypeScript interfaces for API responses
      ui.ts                  - UI component type definitions
    styles/
      globals.css            - Global stylesheet
```

## File-by-File Breakdown

### Backend Core Files

#### `backend/main.py`
Initializes the FastAPI application with CORS middleware configuration. CORS (Cross-Origin Resource Sharing) allows the React frontend to make requests to the Python backend without browser security restrictions. The file registers three routers that define the available API endpoints.

#### `backend/core/entropy.py`
Contains the EntropyCalculator class that computes Shannon entropy. The calculation process involves:

1. Discretization: Raw continuous data (price returns, spreads) are binned into discrete categories using either uniform or quantile-based binning.
2. Probability Calculation: Count observations in each bin and divide by total to get probability for each bin.
3. Entropy Computation: Apply the Shannon entropy formula.
4. Normalization: Divide by log(n_bins) to get a value between 0 and 1.
5. Regime Classification: Based on thresholds, assign "low", "medium", or "high" regime.

The EntropyResult dataclass returns all intermediate results including the probability distribution and bin edges, allowing visualization of the underlying data distribution.

#### `backend/core/microstructure.py`
Implements the MicrostructureAnalyzer class that computes multiple market microstructure metrics:

**SpreadAnalysis**: Calculates bid-ask spread statistics in absolute and basis point terms, includes entropy of the spread distribution, and tracks rolling entropy.

**OrderFlowAnalysis**: Computes buy and sell pressure from volume data, determines the net order flow, and calculates toxicity scores that measure information asymmetry.

**LiquidityMetrics**: Combines multiple measures into a unified liquidity score. The metrics include:
- Amihud: price_impact = average(|returns| / volume)
- Kyle Lambda Proxy: estimated from price impact
- Turnover: volume / market_cap
- Roll Spread: estimated from autocovariance of returns
- Final Score: weighted combination of the above

**PriceDiscovery**: Tests whether prices follow a random walk or exhibit mean reversion through the variance ratio test. The variance ratio compares variance at different frequencies. VR near 1 suggests random walk. VR < 1 suggests mean reversion. VR > 1 suggests momentum.

#### `backend/core/regime.py`
Defines regime classification logic and builds multiscale entropy surfaces for 3D visualization. The classification uses fixed thresholds:
- Low: entropy < 0.50 (mean reverting)
- Medium: 0.50 <= entropy < 0.70 (transitional)
- High: entropy >= 0.70 (random walk)

The build_regime_surface function converts entropy matrices into regime-encoded matrices for visualization, where low regime displays as 0.2, medium as 0.5, and high as 1.0.

#### `backend/core/portfolio.py`
The PortfolioAggregator class aggregates metrics across multiple tickers in a portfolio:

1. **Weighted Entropy**: Combines individual ticker entropy values using portfolio weights. This shows the overall market efficiency at the portfolio level.

2. **Entropy Dispersion**: Measures how much ticker entropies differ from the weighted average. High dispersion means some tickers are efficient while others are not.

3. **Correlation Matrix**: Computes pairwise return correlations between tickers, showing diversification benefits.

4. **Dominant Regime**: Determines the most common regime across all tickers weighted by portfolio allocation.

#### `backend/core/data_fetcher.py`
The YFinanceFetcher class retrieves historical OHLCV (Open, High, Low, Close, Volume) data from Yahoo Finance API. It handles data validation, alignment to common dates across tickers, and returns data in a standardized format for analysis.

#### `backend/utils/math_helpers.py`
Contains utility functions used throughout the codebase:

- **discretize_data**: Converts continuous data into bins using either uniform width or quantile-based (approximately equal frequency) binning. Quantile binning is preferred because it ensures reasonable probability counts in each bin.

- **log_returns**: Calculates logarithmic returns from prices. log_return_t = log(price_t / price_{t-1}). Log returns are additive across time periods and are commonly used in quantitative finance.

- **rolling_window_view**: Creates sliding windows of data for rolling calculations. Used for entropy calculations at different time scales.

- **safe_divide**: Division with zero-handling to avoid NaN values in metrics like Amihud illiquidity.

#### `backend/utils/validators.py`
Input validation functions that check:
- Required fields are present
- Ticker symbols are valid
- Portfolio weights sum to 1.0
- Weights are between 0 and 1
- Date ranges are valid

Invalid inputs raise descriptive errors that guide users to correct their requests.

### Backend API Routes

#### `backend/api/routes/analysis.py`
Main analysis endpoint that processes portfolio requests. The _analyze_ticker function orchestrates the full analysis pipeline:

1. Fetches historical data for the ticker
2. Calculates returns and log-returns
3. Computes entropy metrics at multiple time scales (10, 20, 30, 60 day windows)
4. Analyzes bid-ask spread patterns
5. Calculates order flow metrics
6. Classifies market regimes
7. Performs price discovery efficiency tests
8. Builds 3D surfaces for multiscale entropy visualization

The endpoint returns a comprehensive PortfolioAnalysisResponse containing all metrics for each ticker and aggregated portfolio metrics.

#### `backend/api/routes/health.py`
Simple health check endpoint used for monitoring and load balancer verification.

#### `backend/api/routes/tickers.py`
Provides autocomplete and validation for ticker symbols. Helps the frontend guide users to valid ticker input.

### Request and Response Schemas

#### `backend/api/schemas/request.py`
Defines the PortfolioRequest dataclass with fields:
- tickers: list of stock symbols
- weights: portfolio allocation weights
- date_from: analysis start date
- date_to: analysis end date

#### `backend/api/schemas/response.py`
Defines comprehensive response structures for all analysis results. Each response includes raw data for visualization (time series arrays) and summary statistics. The TickerAnalysis response includes entropy metrics, microstructure measures, and regime classification for a single ticker. The PortfolioAnalysisResponse aggregates results across all tickers.

### Frontend Components

#### `frontend/src/api/client.ts`
HTTP client using fetch API to communicate with the backend. Handles request/response serialization and error management. All API calls to `/api/analysis`, `/api/tickers`, and `/api/health` go through this client.

#### Chart Components (`frontend/src/components/charts/`)
Each chart component accepts analysis data and renders interactive Plotly visualizations:

- **EntropyHeatmap**: 2D heatmap where X-axis is time, Y-axis is entropy level. Color intensity shows density of observations at that entropy level during that period.

- **Interactive3DChart**: 3D surface plot where X and Y axes represent different entropy calculation scales, Z-axis represents normalized entropy, and color represents regime classification. This reveals whether entropy patterns persist across different time scales.

- **LiquidityMetricsChart**: Time series of liquidity metrics (spreads, Amihud ratio, Kyle lambda, turnover). Shows how market liquidity conditions evolve.

- **OrderFlowChart**: Time series of order flow toxicity and trade imbalance. High toxicity indicates information asymmetry.

- **RegimeTimeline**: Horizontal bar chart showing regime periods colored by regime type (low=blue, medium=yellow, high=green).

- **RollingEntropyChart**: Time series of rolling window entropy. Shows short-term market efficiency changes.

- **SpreadAnalysisChart**: Histogram of spread distribution plus time series of rolling average spreads. Shows spread patterns and trends.

#### Dashboard Components (`frontend/src/components/dashboard/`)

- **EntropyGauge**: Circular gauge from 0 to 1 showing current normalized entropy. Needle position and color indicate regime.

- **PortfolioHeatmap**: Heatmap of return correlations between portfolio holdings. Darker colors indicate higher correlation.

- **RegimeBadge**: Large badge displaying current market regime with symbolic representation.

- **SummaryBar**: Horizontal display of key metrics: weighted entropy, dominant regime, average spread, portfolio liquidity score.

- **TickerSelector**: Multi-select dropdown for choosing portfolio tickers. Stores selection in state management.

#### Input Components

- **PortfolioInput**: Weight allocation interface allowing users to specify portfolio weights. Validates that weights sum to 1.

- **TickerTag**: Visual representation of a selected ticker with remove button.

#### Layout and Pages

- **Navbar.tsx**: Navigation header with project title and links.

- **DashboardPage.tsx**: Main analysis interface. Combines ticker selector, portfolio input, and all visualization components. Calls the analysis API and handles loading/error states.

- **LandingPage.tsx**: Welcome page explaining the project concept and how to use the system.

- **PageTransition.tsx**: Animation wrapper for smooth page transitions.

#### State Management

- **analysisStore.ts**: Zustand store managing:
  - Current analysis results
  - Selected tickers and weights
  - Loading state
  - API errors
  - Date range selection

- **useAnalysis.ts**: Custom React hook that encapsulates analysis API calls and result formatting.

- **useAnimatedNumber.ts**: Animation hook that smoothly transitions numbers when values change, improving UX.

#### Type Definitions

- **api.ts**: TypeScript interfaces matching backend response structures. Ensures type safety between frontend and backend.

- **ui.ts**: Component prop types and UI-specific types.

- **plotly.d.ts**: TypeScript definitions for Plotly library used in charts.

## How to Set Up and Run

### Prerequisites

Python 3.8 or higher and Node.js 16+ are required.

### Backend Setup

1. Install Python dependencies:
```
cd backend
pip install -r requirements.txt
```

2. Start the backend server:
```
python main.py
```

The API will be available at http://localhost:8000. Interactive API documentation is at http://localhost:8000/docs.

### Frontend Setup

1. Install Node dependencies:
```
cd frontend
npm install
```

2. Start the development server:
```
npm run dev
```

The frontend will be available at http://localhost:5173.

### Running the Full System

Use the provided script:
```
./start-dev.bat
```

This starts both backend and frontend servers simultaneously.

## Understanding the Analysis Results

When you input a portfolio and submit for analysis, the system returns:

1. **Entropy Metrics**: Shows market randomness on a scale from 0 (highly structured) to 1 (highly random). Values are calculated on the closing price returns.

2. **Spread Analysis**: Displays bid-ask spread in basis points, entropy of spreads, and how spreads change over time.

3. **Order Flow Analysis**: Shows buy pressure, sell pressure, and the toxicity score indicating information asymmetry.

4. **Regime Classification**: Determines if the market is mean-reverting (low), transitional (medium), or random walk (high).

5. **Price Discovery**: Tests whether prices follow a random walk (efficient) or exhibit mean reversion (inefficient) using the variance ratio test.

6. **Multiscale Analysis**: Shows how these metrics change when calculated over different time windows, revealing whether patterns exist at different frequencies.

7. **Portfolio Aggregation**: Combines individual ticker metrics into weighted portfolio metrics showing overall exposure.

## Theoretical Foundation

The framework builds on three decades of academic research:

- Shannon entropy was first applied to markets by Maasoumi and Racine (2002) in "Entropy and Predictability of Stock Market Returns"
- Market microstructure theory originates from Kyle (1985), "Continuous Auctions and Insider Trading", and Bid (1997)
- Variance ratio testing for market efficiency comes from Lo and MacKinlay (1988)

The system combines these approaches to create a practical tool for understanding market behavior through the lens of information theory rather than traditional technical analysis.

## Interpreting Low Entropy Markets

When entropy is low (< 0.50), the market exhibits detectable structure:

1. Prices are not following a random walk
2. Past price movements have some predictive power for future movements
3. Mean reversion opportunities may exist
4. Order flow is informative and predicts subsequent price movement
5. Spreads are predictable and correlated with order flow

This does not guarantee profitable trading. Transaction costs and execution friction still apply. But it suggests the market is not perfectly efficient in that particular period.

## Interpreting High Entropy Markets

When entropy is high (> 0.70), the market approaches the random walk model:

1. Prices are effectively unpredictable
2. Past movements have no power to predict future movements
3. Information is rapidly incorporated into prices
4. Spreads are essentially random
5. Order flow has minimal predictive power

This aligns with the Efficient Markets Hypothesis and suggests that beating the market through pattern recognition in this timeframe is unlikely without information advantage.

## Integration Between Frontend and Backend

The system uses a clear separation of concerns:

1. Frontend collects user input (portfolio composition, date range)
2. Frontend sends request to backend API
3. Backend fetches data, performs all calculations, returns structured results
4. Frontend receives results and renders interactive visualizations
5. User explores results through dynamic dashboards and charts

This architecture allows independent scaling of frontend and backend, and makes it possible to swap visualization frameworks without modifying analysis logic.

## Key Design Decisions

1. **Shannon Entropy Over Other Measures**: Entropy provides a probabilistic interpretation of market structure. Unlike traditional technical indicators, entropy has a clear mathematical foundation in information theory.

2. **Multiple Time Scales**: Markets exhibit different behavior at different frequencies. The system calculates metrics across multiple rolling window sizes to capture this multiscale behavior.

3. **Regime Classification**: Rather than treating market efficiency as binary, the system uses three regimes. This provides more nuance than simple efficient/inefficient classification.

4. **Spread and Order Flow Focus**: These are the most observable aspects of market microstructure without high-frequency data. They reveal information asymmetry and liquidity conditions.

5. **Portfolio Aggregation**: Individual ticker analysis is useful, but portfolio-level metrics matter most. Weighted aggregation respects different position sizes.

6. **Interactive Visualizations**: Static plots hide information. Interactive Plotly charts allow exploration and pattern discovery.

## Limitations and Caveats

1. **Historical Data Only**: The system uses end-of-day or intraday data from Yahoo Finance. It cannot detect intraday microstructure that occurs within price bars.

2. **Synthetic Order Flow**: True order flow requires tick-by-tick bid-ask data. The system infers order flow from volume and price direction, which is an approximation.

3. **Regime Thresholds Are Fixed**: The entropy thresholds for regime classification are global constants. Markets may have local variations in what constitutes "low" entropy that are not captured.

4. **No Trade Execution**: The analysis identifies potential opportunities but does not provide trading signals or execution recommendations.

5. **Statistical Significance Testing**: The results present point estimates without confidence intervals. Some metrics (like spread entropy on sparse data) may be unreliable.

6. **Look-Ahead Bias**: When examining regimes or efficiency, remember that these are calculated on past data. Future regime classification may differ.

## Contributing and Extending

To add new metrics:

1. Implement calculation in the appropriate backend module (entropy_core.py, microstructure.py, or portfolio.py)
2. Add type-safe return values using dataclasses
3. Update the API response schemas to include the new metric
4. Add frontend component to visualize the metric
5. Test with multiple stocks and market conditions

The modular design makes it straightforward to add new analyses without affecting existing calculations.

## Contact and References

For questions about the mathematical foundations:

- Maasoumi, E., & Racine, J. S. (2002). "Entropy and Predictability of Stock Market Returns" Journal of Econometrics
- Kyle, A. S. (1985). "Continuous Auctions and Insider Trading" Journal of Political Economy
- Lo, A. W., & MacKinlay, A. C. (1988). "Stock Market Prices Do Not Follow Random Walks" Journal of Finance

For documentation on the technologies:

- FastAPI: https://fastapi.tiangolo.com
- React: https://react.dev
- Plotly: https://plotly.com/javascript
- Yahoo Finance API: https://finance.yahoo.com
