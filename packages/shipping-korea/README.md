# @repo/shipping-korea

Korean domestic delivery services integration module

## Overview

통합 한국 택배 서비스 모듈 - CJ대한통운, 한진택배, 롯데택배, 우체국택배, 로젠택배 API 통합

## Features

- 🚚 **Multi-carrier Support**: 주요 택배사 통합 지원
- 📦 **Tracking System**: 실시간 배송 추적
- 💰 **Cost Calculation**: 배송비 계산 및 비교
- 📊 **Status Management**: 배송 상태 관리
- 🔔 **Webhook Support**: 상태 변경 알림
- ⚡ **Batch Processing**: 대량 조회 처리
- 🔒 **Rate Limiting**: API 요청 제한 관리
- 💾 **Caching**: 효율적인 캐싱 시스템

## Installation

```bash
npm install @repo/shipping-korea
```

## Quick Start

### Basic Tracking

```typescript
import { TrackingService, CARRIERS } from '@repo/shipping-korea';

// Initialize service
const trackingService = new TrackingService({
  carriers: {
    cj: {
      apiKey: 'your-api-key',
      apiSecret: 'your-secret',
      baseUrl: 'https://api.cjlogistics.com'
    }
  },
  cache: {
    enabled: true,
    ttl: 300000 // 5 minutes
  }
});

// Track shipment
const result = await trackingService.track({
  carrier: 'CJ',
  trackingNumber: '1234567890'
});

if (result.success) {
  console.log('Current Status:', result.data.status);
  console.log('Location:', result.data.currentLocation);
}
```

### Cost Calculation

```typescript
import { CostCalculator } from '@repo/shipping-korea';

const calculator = new CostCalculator({
  carriers: {
    cj: { /* config */ },
    hanjin: { /* config */ }
  }
});

// Calculate cost
const cost = await calculator.calculate({
  carrier: 'CJ',
  service: 'STANDARD',
  origin: {
    postalCode: '06234',
    province: '서울특별시',
    city: '강남구',
    street: '테헤란로 123',
    phone: '02-1234-5678',
    name: '홍길동'
  },
  destination: {
    postalCode: '48058',
    province: '부산광역시',
    city: '해운대구',
    street: '해운대로 456',
    phone: '051-1234-5678',
    name: '김철수'
  },
  package: {
    weight: 2.5, // kg
    dimensions: {
      length: 30, // cm
      width: 20,
      height: 15
    }
  }
});

// Compare costs across carriers
const comparison = await calculator.compareCosts({
  service: 'STANDARD',
  origin: { /* ... */ },
  destination: { /* ... */ },
  package: { /* ... */ }
});
```

### React Hooks

```typescript
import { useTracking } from '@repo/shipping-korea';

function TrackingComponent() {
  const { data, loading, error, track } = useTracking(trackingService, {
    autoRefresh: true,
    refreshInterval: 60000,
    onStatusChange: (info) => {
      console.log('Status changed to:', info.status);
    }
  });

  const handleTrack = () => {
    track('CJ', '1234567890');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <button onClick={handleTrack}>Track</button>;

  return (
    <div>
      <h3>Status: {data.status}</h3>
      <p>Location: {data.currentLocation}</p>
    </div>
  );
}
```

## API Reference

### Types

- `CarrierCode`: 'CJ' | 'HANJIN' | 'LOTTE' | 'POST_OFFICE' | 'LOGEN'
- `ShippingService`: 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'DAWN' | 'INSTALLATION' | 'FRESH'
- `DeliveryStatus`: 'PENDING' | 'RECEIVED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED'

### TrackingService

```typescript
class TrackingService {
  track(request: TrackingRequest): Promise<ApiResponse<TrackingInfo>>
  trackBatch(request: BatchTrackingRequest): Promise<BatchTrackingResponse>
  getUpdates(trackingNumbers: Array<{carrier, trackingNumber}>): Promise<Map<string, TrackingInfo>>
}
```

### CostCalculator

```typescript
class CostCalculator {
  calculate(request: ShippingCostRequest): Promise<ApiResponse<ShippingCostResponse>>
  compareCosts(request: Omit<ShippingCostRequest, 'carrier'>): Promise<ShippingCostResponse[]>
}
```

## Supported Carriers

| Carrier | Code | Customer Service | Features |
|---------|------|------------------|----------|
| CJ대한통운 | CJ | 1588-1255 | ✅ Tracking, ✅ Cost, ✅ Webhook |
| 한진택배 | HANJIN | 1588-0011 | 🚧 In Progress |
| 롯데택배 | LOTTE | 1588-2121 | 🚧 In Progress |
| 우체국택배 | POST_OFFICE | 1588-1300 | 🚧 In Progress |
| 로젠택배 | LOGEN | 1588-9988 | 🚧 In Progress |

## Configuration

```typescript
const config = {
  tracking: {
    cache: {
      enabled: true,
      ttl: 300000 // 5 minutes
    },
    retry: {
      attempts: 3,
      delay: 1000
    }
  },
  webhook: {
    timeout: 30000,
    maxRetries: 3
  },
  rateLimit: {
    default: {
      limit: 100,
      window: 60000 // 1 minute
    }
  }
};
```

## Error Handling

```typescript
try {
  const result = await trackingService.track({
    carrier: 'CJ',
    trackingNumber: '1234567890'
  });
} catch (error) {
  if (error.retryable) {
    // Retry logic
  } else {
    // Handle non-retryable error
  }
}
```

## License

MIT