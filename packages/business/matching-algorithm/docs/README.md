# Matching Algorithm Module

AI-powered brand-influencer matching and recommendation engine using hybrid algorithms combining collaborative filtering, content-based matching, and rule-based scoring.

## Features

- **Hybrid Matching Algorithm**: Combines multiple approaches for optimal results
  - Collaborative filtering based on historical interactions
  - Content-based matching using NLP and profile analysis
  - Rule-based scoring with customizable weights
- **AI/ML Scoring**: Machine learning models that improve with feedback
- **Compatibility Analysis**: Deep analysis of brand-influencer fit
- **Recommendation Engine**: Personalized recommendations with multiple strategies
- **Portfolio Optimization**: Budget and goal-based influencer portfolio optimization
- **Real-time Updates**: Model updates based on campaign performance
- **Scenario Analysis**: Compare different portfolio strategies

## Services

### MatchingService
Core service for finding and managing matches.

```typescript
// Find matches for a brand
const matches = await matchingService.findMatches(brandId, {
  preferences: {
    platforms: ['instagram', 'youtube'],
    categories: ['fashion', 'lifestyle']
  },
  requirements: {
    minEngagementRate: 3.0,
    minFollowers: 10000,
    verifiedOnly: true
  },
  weights: {
    audienceRelevance: 0.3,
    engagementRate: 0.25,
    contentQuality: 0.2,
    brandAlignment: 0.25
  }
});

// Get single match analysis
const match = await matchingService.getMatch(brandId, influencerId);
```

### ScoringService
Manages scoring algorithms and model updates.

```typescript
// Calculate match score
const score = await scoringService.calculateScore(
  influencerProfile,
  criteria,
  brandProfile
);

// Update model with feedback
await scoringService.updateModel(match, 'positive');
```

### CompatibilityService
Analyzes deep compatibility factors.

```typescript
const compatibility = await compatibilityService.analyzeCompatibility(
  brandId,
  influencerId
);

// Returns detailed analysis including:
// - Values alignment
// - Audience fit
// - Content style compatibility
// - Geographic coverage
// - Past performance
```

### RecommendationService
Provides various recommendation strategies.

```typescript
// Get personalized recommendations
const recommendations = await recommendationService.getRecommendations({
  brandId,
  limit: 20,
  sortBy: 'score',
  includeAnalysis: true
});

// Get strategic recommendations
const strategic = await recommendationService.getStrategicRecommendations(
  brandId,
  'engagement' // or 'growth', 'conversion', 'awareness'
);

// Get complementary influencers
const complementary = await recommendationService.getComplementaryInfluencers(
  brandId,
  existingInfluencerIds
);
```

### OptimizationService
Optimizes influencer portfolios based on constraints.

```typescript
// Optimize portfolio
const portfolio = await optimizationService.optimizePortfolio({
  brandId,
  budget: 50000,
  goals: [
    { type: 'awareness', priority: 1 },
    { type: 'engagement', priority: 2 }
  ],
  constraints: {
    minInfluencers: 3,
    maxInfluencers: 10,
    platformDistribution: {
      instagram: 5,
      youtube: 3,
      tiktok: 2
    }
  }
});

// Run scenario analysis
const scenarios = await optimizationService.runScenarioAnalysis(
  brandId,
  [scenario1, scenario2, scenario3]
);
```

## Algorithms

### Hybrid Matching
Combines three approaches with configurable weights:
- **Collaborative Filtering** (30%): Based on similar brands' choices
- **Content-Based** (30%): Analyzes content similarity and relevance
- **Rule-Based Scoring** (40%): Applies business rules and requirements

### Scoring Components
Each match is scored on multiple dimensions:
- Audience Relevance (25%)
- Engagement Rate (20%)
- Content Quality (15%)
- Brand Alignment (15%)
- Reach Potential (10%)
- Cost Efficiency (10%)
- Past Performance (5%)

## Events

### Emitted Events
- `matching.completed`: When matching process completes
- `score.calculated`: When a score is calculated
- `compatibility.analyzed`: When compatibility analysis completes
- `recommendations.generated`: When recommendations are generated
- `portfolio.optimized`: When portfolio optimization completes

### Subscribed Events
- `brand.created`: Initialize matching for new brand
- `influencer.created`: Update influencer index
- `campaign.completed`: Update model with performance data
- `match.feedback.received`: Process user feedback
- `analytics.influencer.updated`: Refresh scoring data

## Configuration

```typescript
{
  modelUpdateInterval: 86400000,  // Model update frequency (ms)
  cacheEnabled: true,             // Enable result caching
  cacheTTL: 3600,                // Cache time-to-live (seconds)
  maxRecommendations: 100,        // Maximum recommendations returned
  minConfidenceScore: 0.6         // Minimum confidence threshold
}
```

## Usage Examples

### Finding Best Matches
```typescript
const criteria: MatchingCriteria = {
  brandId: 'brand_123',
  campaign: {
    budget: { min: 5000, max: 50000, currency: 'USD' },
    duration: 30,
    goals: [
      { type: 'awareness', priority: 1, target: 1000000 }
    ],
    targetAudience: {
      demographics: {
        ageRange: [18, 35],
        gender: ['female'],
        locations: ['US', 'UK'],
        interests: ['fashion', 'beauty', 'lifestyle']
      }
    }
  },
  preferences: {
    platforms: ['instagram', 'tiktok'],
    categories: ['fashion', 'beauty']
  },
  requirements: {
    minFollowers: 10000,
    maxFollowers: 1000000,
    minEngagementRate: 3.0,
    verifiedOnly: true
  }
};

const matches = await matchingService.findMatches(brandId, criteria);
```

### Optimizing Campaign Portfolio
```typescript
const optimization = await optimizationService.optimizePortfolio({
  brandId: 'brand_123',
  budget: 100000,
  goals: [
    { type: 'awareness', priority: 1, kpi: 'reach', target: 5000000 },
    { type: 'engagement', priority: 2, kpi: 'interactions', target: 50000 }
  ],
  constraints: {
    minInfluencers: 5,
    maxInfluencers: 15,
    platformDistribution: {
      instagram: 8,
      youtube: 4,
      tiktok: 3
    },
    categoryRequirements: {
      fashion: 5,
      beauty: 3,
      lifestyle: 2
    }
  }
});

console.log(`Optimized portfolio with ${optimization.portfolio.length} influencers`);
console.log(`Estimated ROI: ${optimization.estimatedROI}`);
```

### Analyzing Match Quality
```typescript
// Get detailed compatibility analysis
const compatibility = await compatibilityService.analyzeCompatibility(
  brandId,
  influencerId
);

if (compatibility.overallScore > 80) {
  console.log('Excellent match!');
  console.log('Opportunities:', compatibility.opportunities);
} else {
  console.log('Risks:', compatibility.risks);
}
```

## Model Training

The matching model continuously improves through:
1. **Campaign Performance Data**: Automatic updates based on campaign results
2. **User Feedback**: Direct feedback on match quality
3. **A/B Testing**: Comparison of different matching strategies
4. **Collaborative Learning**: Learning from similar brands' successes

## Testing

```bash
npm test
```

Test coverage includes:
- Matching algorithm accuracy
- Score calculation validation
- Optimization constraints
- Recommendation relevance
- Model performance metrics