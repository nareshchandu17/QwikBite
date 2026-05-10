# Progressive Analytics Data Blending System

A sophisticated data blending system that seamlessly transitions from mock data to real data without changing the UI appearance or breaking user trust.

## 🎯 Overview

The Analytics page supports three modes of operation:

1. **100% Mock Data** - When backend analytics is not ready
2. **Mixed Data Mode** - Progressive blending with configurable real data percentage
3. **100% Real Data** - When backend is fully reliable

## 🏗️ Architecture

```
/analytics
├─ mockAnalytics.ts      # Realistic mock data generation
├─ fetchAnalytics.ts      # Real data fetching with error handling
├─ blendAnalyticsData.ts  # Sophisticated data blending algorithms
├─ useAnalyticsData.ts    # React hooks for state management
├─ types.ts              # TypeScript type definitions
└─ index.ts              # Central exports
```

## 🚀 Quick Start

### Environment Configuration

Set the real data percentage using environment variable:

```bash
# .env.local
NEXT_PUBLIC_ANALYTICS_REAL_DATA_PERCENT=25
```

### Usage in Components

```tsx
import { useAnalytics } from '@/lib/analytics';

function MyComponent() {
  const {
    dailySales,
    topDishes,
    peakHours,
    insights,
    isLoading,
    error,
    isUsingRealData,
    realDataPercentage,
  } = useAnalytics();

  return (
    <div>
      <div>Data Source: {realDataPercentage}% Real</div>
      {/* Your analytics UI */}
    </div>
  );
}
```

## 📊 Data Blending Rules

### Visual Consistency Rule
- When real data ≤ 50%, analytics page looks identical to mock
- No sudden drops, spikes, or empty charts
- Trends remain smooth and believable

### Blending Algorithms

#### Numeric Values
```typescript
// Weighted average with natural variance
blendedValue = (realValue * realWeight) + (mockValue * mockWeight) + variance
```

#### Array Data (Charts)
- Maintains data structure integrity
- Preserves temporal ordering
- Applies trend preservation algorithms

#### Insights
- Text-based insights prefer real data
- Percentages are blended with proper formatting
- Currency values use weighted averages

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_ANALYTICS_REAL_DATA_PERCENT` | `0` | Percentage of real data (0-100) |

### Blend Config

```typescript
interface BlendConfig {
  realDataPercentage: number;    // 0-100
  mockDataPercentage: number;    // 0-100
  preserveTrends: boolean;       // Maintain data trends
  smoothTransitions: boolean;    // Add natural variance
}
```

## 🎨 UI Features

### Data Source Indicator
- Shows current data source (Live/Demo/Blended)
- Displays real data percentage
- Real-time updates

### Error Handling
- Graceful fallback to mock data
- User-friendly error messages
- Retry mechanisms

### Loading States
- Skeleton loaders for charts
- Smooth transitions
- Progressive data loading

## 🔄 Data Flow

```
1. useAnalytics() hook called
2. Fetch real data (if percentage > 0)
3. Get mock data (always available)
4. Blend data based on configuration
5. Return blended data to component
6. UI renders seamlessly
```

## 🛠️ Advanced Usage

### Custom Blend Configuration

```tsx
import { blendAnalyticsData, getBlendConfig } from '@/lib/analytics';

const customBlend = blendAnalyticsData(realData, mockData, {
  realDataPercentage: 75,
  preserveTrends: true,
  smoothTransitions: false,
});
```

### Debug Mode

```tsx
import { useAnalyticsDebug } from '@/lib/analytics';

function DebugComponent() {
  const { debugInfo, ...analytics } = useAnalyticsDebug();
  
  console.log('Blend Config:', debugInfo.blendConfig);
  console.log('Data Source:', debugInfo.dataInfo);
  
  return <AnalyticsDashboard {...analytics} />;
}
```

## 📈 Performance Considerations

### Caching
- API responses cached for 5 minutes
- Mock data cached for session duration
- Intelligent cache invalidation

### Error Recovery
- Automatic retry with exponential backoff
- Partial data handling
- Graceful degradation

### Bundle Size
- Tree-shaking enabled
- Minimal runtime overhead
- Lazy loading of analytics components

## 🔒 Security

### Authentication
- Session-based authentication
- Role-based access control
- API endpoint protection

### Data Validation
- Input sanitization
- Response structure validation
- Type safety throughout

## 🧪 Testing

### Unit Tests
```bash
# Test blending algorithms
npm test -- blendAnalyticsData.test.ts

# Test data fetching
npm test -- fetchAnalytics.test.ts

# Test React hooks
npm test -- useAnalyticsData.test.ts
```

### Integration Tests
```bash
# Test complete analytics flow
npm test -- analytics.integration.test.ts
```

## 🚀 Production Deployment

### Environment Setup
1. Set `NEXT_PUBLIC_ANALYTICS_REAL_DATA_PERCENT=100`
2. Ensure analytics API endpoint is available
3. Configure proper caching headers

### Monitoring
- Track data source percentages
- Monitor API response times
- Log blending errors

### Scaling
- Horizontal scaling support
- Database query optimization
- CDN integration for static assets

## 🐛 Troubleshooting

### Common Issues

#### Data Not Loading
- Check environment variable
- Verify API endpoint accessibility
- Check authentication status

#### Inconsistent Charts
- Verify data structure consistency
- Check blend configuration
- Review console for errors

#### Performance Issues
- Reduce real data percentage
- Optimize database queries
- Enable aggressive caching

### Debug Tools

```tsx
// Enable debug mode
const analytics = useAnalyticsDebug();

// Check blend configuration
console.log(analytics.debugInfo.blendConfig);

// Monitor data source changes
useEffect(() => {
  console.log('Data source changed:', analytics.dataSource);
}, [analytics.dataSource]);
```

## 📚 API Reference

### useAnalytics()
Main hook for accessing analytics data.

### useAnalyticsData()
Advanced hook with more control over fetching.

### blendAnalyticsData()
Utility function for manual data blending.

### getBlendConfig()
Get current blend configuration.

## 🤝 Contributing

1. Follow the existing code style
2. Add comprehensive tests
3. Update documentation
4. Ensure type safety

## 📄 License

This analytics system is part of the qwikBite platform.
