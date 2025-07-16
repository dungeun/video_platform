# Notification Module

다국어 지원과 한국 SMS 프로바이더를 포함한 종합적인 알림 시스템 모듈입니다.

## 주요 기능

- 🔔 **다중 채널 지원**: 이메일, SMS, 푸시 알림, 인앱 알림
- 🇰🇷 **한국 SMS 프로바이더**: Aligo, SolutionBox 통합
- 📧 **이메일 프로바이더**: AWS SES, SendGrid 지원
- 🌐 **다국어 템플릿**: Handlebars 기반 템플릿 엔진
- 📊 **전송 추적**: 실시간 전송 상태 추적 및 통계
- ⏰ **큐 관리**: Redis 기반 비동기 처리
- 🔧 **사용자 설정**: 알림 선호도 및 방해 금지 시간
- 🧪 **테스트 도구**: 알림 테스트 전송 기능

## 설치

```bash
npm install @modules/notification
```

## 기본 사용법

### 1. 서비스 초기화

```typescript
import { createNotificationService } from '@modules/notification';

const notificationService = createNotificationService({
  email: {
    provider: {
      type: 'ses',
      config: {
        region: 'ap-northeast-2',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    },
    defaultFrom: 'noreply@company.com'
  },
  sms: {
    provider: {
      type: 'aligo',
      config: {
        apiKey: process.env.ALIGO_API_KEY,
        userId: process.env.ALIGO_USER_ID
      }
    },
    defaultSender: '1588-0000'
  },
  queue: {
    redis: {
      host: 'localhost',
      port: 6379
    }
  }
});
```

### 2. 이메일 전송

```typescript
// 직접 콘텐츠로 전송
await notificationService.send({
  type: NotificationType.EMAIL,
  recipient: {
    email: 'user@example.com',
    locale: 'ko'
  },
  content: {
    subject: '주문 확인',
    body: '주문이 확인되었습니다.',
    html: '<h1>주문이 확인되었습니다.</h1>'
  },
  priority: NotificationPriority.HIGH
});

// 템플릿 사용
await notificationService.send({
  type: NotificationType.EMAIL,
  recipient: {
    email: 'user@example.com',
    locale: 'ko'
  },
  templateId: 'order-confirmation',
  variables: {
    userName: '홍길동',
    orderNumber: 'ORD-2024-0001',
    amount: 50000
  }
});
```

### 3. SMS 전송 (한국)

```typescript
// Aligo SMS
await notificationService.send({
  type: NotificationType.SMS,
  recipient: {
    phone: '010-1234-5678'
  },
  content: {
    body: '[우리회사] 인증번호: 123456'
  }
});

// LMS (장문 메시지)
await notificationService.send({
  type: NotificationType.SMS,
  recipient: {
    phone: '010-1234-5678'
  },
  content: {
    body: '긴 메시지 내용...'  // 90바이트 초과시 자동으로 LMS로 전송
  },
  metadata: {
    title: 'LMS 제목'
  }
});
```

### 4. 템플릿 관리

```typescript
// 템플릿 등록
notificationService.registerTemplate({
  id: 'welcome-email',
  name: '회원가입 환영 이메일',
  type: NotificationType.EMAIL,
  subject: '{{companyName}}에 오신 것을 환영합니다!',
  content: `
    안녕하세요 {{userName}}님,
    
    {{companyName}}에 가입해 주셔서 감사합니다.
    
    가입일: {{dateFormat joinDate "YYYY년 MM월 DD일"}}
    회원등급: {{membershipLevel}}
    
    감사합니다.
  `,
  language: 'ko',
  variables: ['userName', 'companyName', 'joinDate', 'membershipLevel']
});

// 템플릿으로 전송
await notificationService.send({
  type: NotificationType.EMAIL,
  recipient: { email: 'user@example.com' },
  templateId: 'welcome-email',
  variables: {
    userName: '홍길동',
    companyName: '우리회사',
    joinDate: new Date(),
    membershipLevel: '실버'
  }
});
```

### 5. React 컴포넌트 사용

```tsx
import { 
  NotificationPreferences, 
  TemplateEditor, 
  NotificationHistory,
  TestSender,
  useNotification 
} from '@modules/notification';

// 사용자 알림 설정
function UserNotificationSettings() {
  const { updateUserPreferences } = useNotification();
  
  return (
    <NotificationPreferences
      userId="user123"
      categories={[
        { id: 'order', name: '주문 알림' },
        { id: 'promotion', name: '프로모션' },
        { id: 'account', name: '계정 알림' }
      ]}
      onSave={async (preferences) => {
        await updateUserPreferences('user123', preferences);
      }}
    />
  );
}

// 템플릿 편집기
function TemplateManager() {
  const { saveTemplate } = useNotification();
  
  return (
    <TemplateEditor
      onSave={async (template) => {
        await saveTemplate(template);
      }}
      onValidate={(content) => {
        // 템플릿 검증 로직
        return { valid: true, variables: ['userName'] };
      }}
    />
  );
}

// 알림 전송 내역
function NotificationDashboard() {
  const { deliveries, fetchDeliveries, resendNotification } = useNotification();
  
  useEffect(() => {
    fetchDeliveries();
  }, []);
  
  return (
    <NotificationHistory
      deliveries={deliveries}
      onRefresh={fetchDeliveries}
      onResend={resendNotification}
    />
  );
}

// 테스트 전송
function NotificationTester() {
  const { sendNotification, templates } = useNotification();
  
  return (
    <TestSender
      templates={templates}
      onSend={sendNotification}
    />
  );
}
```

### 6. Hooks 사용

```typescript
import { useNotification, useNotificationPreferences } from '@modules/notification';

function MyComponent() {
  // 알림 관리 Hook
  const {
    loading,
    error,
    sendNotification,
    fetchDeliveries,
    getDeliveryStats
  } = useNotification({
    apiUrl: '/api',
    onSuccess: (result) => console.log('Sent:', result),
    onError: (error) => console.error('Error:', error)
  });

  // 사용자 설정 Hook
  const {
    preferences,
    savePreferences,
    toggleChannel,
    canReceiveNotification
  } = useNotificationPreferences({
    userId: 'user123',
    defaultPreferences: {
      channels: {
        email: { enabled: true, categories: {} },
        sms: { enabled: true, categories: {} }
      }
    }
  });

  // 알림 전송
  const handleSendNotification = async () => {
    if (canReceiveNotification(NotificationType.EMAIL, 'promotion')) {
      await sendNotification({
        type: NotificationType.EMAIL,
        recipient: { email: 'user@example.com' },
        templateId: 'promotion-email'
      });
    }
  };

  return (
    // UI 구현
  );
}
```

### 7. 대량 전송

```typescript
// 대량 이메일 전송
const recipients = [
  { email: 'user1@example.com', locale: 'ko' },
  { email: 'user2@example.com', locale: 'en' },
  { email: 'user3@example.com', locale: 'ko' }
];

const results = await notificationService.sendBulk(
  recipients.map(recipient => ({
    type: NotificationType.EMAIL,
    recipient,
    templateId: 'newsletter',
    variables: { month: '2024년 1월' }
  }))
);

// 결과 확인
results.forEach((result, email) => {
  console.log(`${email}: ${result.queued ? '큐에 추가됨' : '실패'}`);
});
```

### 8. 통계 조회

```typescript
// 전송 통계
const stats = await notificationService.getDeliveryStats(
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  NotificationType.EMAIL
);

console.log(`
  전체: ${stats.total}
  전송됨: ${stats.sent}
  전달됨: ${stats.delivered}
  실패: ${stats.failed}
  전달률: ${stats.deliveryRate}%
`);

// 프로바이더별 통계
Object.entries(stats.byProvider).forEach(([provider, providerStats]) => {
  console.log(`${provider}: ${providerStats.delivered}/${providerStats.total}`);
});
```

## 템플릿 헬퍼

### 기본 헬퍼

```handlebars
{{!-- 날짜 포맷팅 --}}
{{dateFormat date "YYYY년 MM월 DD일"}}

{{!-- 숫자 포맷팅 --}}
{{numberFormat 1234567 "ko-KR"}}

{{!-- 통화 포맷팅 --}}
{{currency 50000 "KRW" "ko-KR"}}

{{!-- 조건문 --}}
{{#if (gt orderAmount 100000)}}
  VIP 고객님께 특별 할인!
{{/if}}

{{!-- 복수형 --}}
{{plural itemCount "개" "개"}}

{{!-- 번역 --}}
{{t "welcome.message" lang="ko" name=userName}}
```

### 커스텀 헬퍼 등록

```typescript
const templateEngine = new TemplateEngine({
  customHelpers: {
    maskPhone: (phone: string) => {
      return phone.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
    },
    orderStatus: (status: string) => {
      const statusMap = {
        pending: '주문 접수',
        processing: '처리중',
        shipped: '배송중',
        delivered: '배송완료'
      };
      return statusMap[status] || status;
    }
  }
});
```

## 설정 옵션

### 이메일 프로바이더

```typescript
// AWS SES
{
  type: 'ses',
  config: {
    region: 'ap-northeast-2',
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY'
  }
}

// SendGrid
{
  type: 'sendgrid',
  config: {
    apiKey: 'YOUR_SENDGRID_API_KEY'
  }
}
```

### SMS 프로바이더 (한국)

```typescript
// Aligo
{
  type: 'aligo',
  config: {
    apiKey: 'YOUR_API_KEY',
    userId: 'YOUR_USER_ID',
    testMode: false
  }
}

// SolutionBox
{
  type: 'solutionbox',
  config: {
    apiKey: 'YOUR_API_KEY'
  }
}
```

## 에러 처리

```typescript
try {
  await notificationService.send(request);
} catch (error) {
  if (error.code === 'INVALID_RECIPIENT') {
    console.error('잘못된 수신자');
  } else if (error.code === 'TEMPLATE_NOT_FOUND') {
    console.error('템플릿을 찾을 수 없음');
  } else if (error.code === 'QUOTA_EXCEEDED') {
    console.error('전송 한도 초과');
  }
}
```

## 모범 사례

1. **템플릿 사용**: 하드코딩된 메시지 대신 템플릿 사용
2. **사용자 설정 존중**: 항상 사용자의 알림 설정 확인
3. **방해 금지 시간**: 사용자의 방해 금지 시간 설정 준수
4. **재시도 로직**: 실패한 알림에 대한 자동 재시도
5. **전송 제한**: 과도한 알림 전송 방지
6. **로깅**: 모든 알림 전송 기록 보관

## 라이선스

MIT