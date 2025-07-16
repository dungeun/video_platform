# Analytics Influencer Module

Comprehensive analytics and performance tracking for influencers, providing insights, trends, and predictions.

## Features

- **Influencer Analytics**: Comprehensive metrics including followers, engagement, reach, and audience demographics
- **Performance Tracking**: Score calculation, tier determination, and ranking
- **Audience Analysis**: Demographics, interests, locations, and quality assessment
- **Engagement Metrics**: Rate calculation, pattern analysis, and anomaly detection
- **Trend Analysis**: Historical trends, predictions, and seasonal patterns
- **Real-time Updates**: Live analytics from social media platforms
- **Campaign Analytics**: ROI, cost metrics, and performance evaluation
- **Benchmarking**: Industry and competitor comparisons
- **Report Generation**: PDF, Excel, and JSON formats

## Services

### AnalyticsService
Main service for comprehensive analytics operations.

```typescript
const analytics = await analyticsService.getInfluencerAnalytics(
  influencerId,
  { start: startDate, end: endDate, type: 'monthly' }
);

const campaignAnalytics = await analyticsService.getCampaignAnalytics(
  campaignId,
  influencerId
);
```

### PerformanceService
Handles performance scoring and ranking.

```typescript
const score = await performanceService.calculatePerformanceScore(
  influencerId,
  historicalData
);

const ranking = await performanceService.getPerformanceRanking(
  influencerId,
  'fashion'
);
```

### AudienceService
Manages audience analytics and segmentation.

```typescript
const audience = await audienceService.getAudienceAnalytics(influencerId);
const quality = await audienceService.analyzeAudienceQuality(influencerId);
const overlap = await audienceService.getAudienceOverlap(influencer1, influencer2);
```

### EngagementService
Tracks and analyzes engagement metrics.

```typescript
const engagement = await engagementService.getEngagementMetrics(
  influencerId,
  period
);
const patterns = await engagementService.analyzeEngagementPatterns(
  influencerId,
  period
);
```

### TrendService
Analyzes trends and generates predictions.

```typescript
const trends = await trendService.analyzeTrends(influencerId, period);
const forecast = await trendService.forecastTrends(influencerId, 3); // 3 months
```

## Events

### Emitted Events
- `analytics.influencer.generated`: When influencer analytics are generated
- `analytics.campaign.generated`: When campaign analytics are generated
- `analytics.realtime.update`: Real-time analytics updates
- `audience.analytics.fetched`: Audience data retrieved
- `engagement.patterns.analyzed`: Engagement patterns analyzed
- `trends.analysis.complete`: Trend analysis completed

### Subscribed Events
- `influencer.created`: Initialize analytics for new influencer
- `campaign.completed`: Generate campaign report
- `social.media.updated`: Refresh metrics from social platforms

## Configuration

```typescript
interface AnalyticsConfig {
  refreshInterval: number;      // Analytics refresh interval (ms)
  retentionDays: number;       // Data retention period
  samplingRate: number;        // Data sampling rate (0-1)
  enableRealtime: boolean;     // Enable real-time updates
  benchmarkSource: 'internal' | 'external';
}
```

## Data Types

### InfluencerMetrics
```typescript
interface InfluencerMetrics {
  influencerId: UUID;
  period: MetricsPeriod;
  followers: FollowerMetrics;
  engagement: EngagementMetrics;
  reach: ReachMetrics;
  audience: AudienceData;
  content: ContentMetrics;
  performance: PerformanceData;
}
```

### TrendAnalysis
```typescript
interface TrendAnalysis {
  trends: {
    engagement: TrendData;
    followers: TrendData;
    content: TrendData;
  };
  predictions: Predictions;
  insights: Insight[];
}
```

## Usage Examples

### Get Comprehensive Analytics
```typescript
const period = {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
  type: 'monthly'
};

const analytics = await analyticsService.getInfluencerAnalytics(
  influencerId,
  period
);

console.log(`Engagement Rate: ${analytics.engagement.rate}%`);
console.log(`Follower Growth: ${analytics.followers.growthRate}%`);
```

### Compare with Competitors
```typescript
const comparison = await trendService.compareTrendsWithCompetitors(
  mainInfluencerId,
  competitorIds
);

console.log(`Performance vs competitors: ${comparison.analysis.relativePerformance}`);
```

### Generate Reports
```typescript
const report = await analyticsService.generateReport(
  influencerId,
  period,
  'pdf'
);

// Save report
fs.writeFileSync('analytics-report.pdf', report);
```

## Testing

```bash
npm test
```

Test coverage includes:
- Analytics generation
- Performance calculations
- Audience analysis
- Engagement tracking
- Trend predictions
- Report generation