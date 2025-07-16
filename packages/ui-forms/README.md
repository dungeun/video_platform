# @company/ui-forms

UI Form Components - Ultra-Fine-Grained Module for Forms Only

## 개요

`@company/ui-forms`는 폼 컴포넌트에만 특화된 초세분화 모듈입니다. 입력 필드, 검증, 폼 상태 관리 등 폼과 관련된 모든 기능을 제공합니다.

## 주요 기능

### 🎯 핵심 특징
- **초세분화 설계**: 폼 기능만 담당하는 단일 책임 모듈
- **완전한 TypeScript 지원**: 모든 컴포넌트와 유틸리티에 대한 타입 안전성
- **접근성 우선**: ARIA 속성과 키보드 네비게이션 기본 지원
- **검증 시스템**: 내장된 검증 규칙과 커스텀 검증 지원
- **테마 지원**: 커스터마이징 가능한 스타일 시스템

### 📦 포함된 컴포넌트
- `Form`: 폼 상태를 관리하는 메인 컨테이너
- `Field`: 라벨, 힌트, 에러를 포함한 필드 래퍼
- `TextInput`: 단일 라인 텍스트 입력
- `TextArea`: 멀티라인 텍스트 입력
- `Select`: 드롭다운 선택 컴포넌트
- `Checkbox`: 체크박스 입력
- `RadioGroup`: 라디오 버튼 그룹

### 🔧 훅 (Hooks)
- `useForm`: 폼 상태 및 검증 관리
- `useFieldState`: 개별 필드 상태 관리
- `useFormClasses`: CSS 클래스 생성
- `useFormContext`: 폼 컨텍스트 접근

### 🛠️ 유틸리티
- **검증 함수**: required, email, pattern, 길이 검증 등
- **테마 함수**: 스타일과 클래스 생성
- **에러 처리**: 에러 메시지 처리 유틸리티

## 설치

```bash
npm install @company/ui-forms
```

## 기본 사용법

### 간단한 폼

```tsx
import { Form, Field, TextInput } from '@company/ui-forms';

function ContactForm() {
  const handleSubmit = (values, formState) => {
    console.log('Form submitted:', values);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Field name="name" label="이름" required>
        <TextInput name="name" placeholder="이름을 입력하세요" />
      </Field>
      
      <Field name="email" label="이메일" required>
        <TextInput 
          name="email" 
          type="email" 
          placeholder="이메일을 입력하세요" 
        />
      </Field>
      
      <button type="submit">제출</button>
    </Form>
  );
}
```

### 검증이 포함된 폼

```tsx
import { Form, Field, TextInput, TextArea } from '@company/ui-forms';

function UserForm() {
  const validationRules = {
    name: { required: true, minLength: 2 },
    email: { required: true, email: true },
    bio: { maxLength: 500 }
  };

  const handleSubmit = (values) => {
    // 폼 제출 처리
  };

  return (
    <Form 
      validationRules={validationRules}
      onSubmit={handleSubmit}
    >
      <Field name="name" label="이름" required>
        <TextInput name="name" />
      </Field>
      
      <Field name="email" label="이메일" required>
        <TextInput name="email" type="email" />
      </Field>
      
      <Field name="bio" label="자기소개" hint="최대 500자">
        <TextArea name="bio" rows={4} />
      </Field>
      
      <button type="submit">저장</button>
    </Form>
  );
}
```

### 커스텀 훅 사용

```tsx
import { useForm, TextInput } from '@company/ui-forms';

function CustomForm() {
  const form = useForm({
    initialValues: { username: '', password: '' },
    validationRules: {
      username: { required: true, minLength: 3 },
      password: { required: true, minLength: 8 }
    },
    onSubmit: (values) => {
      console.log('Login:', values);
    }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.submit(); }}>
      <TextInput 
        {...form.getFieldProps('username')}
        placeholder="사용자명"
      />
      
      <TextInput 
        {...form.getFieldProps('password')}
        type="password"
        placeholder="비밀번호"
      />
      
      <button type="submit" disabled={!form.isValid}>
        로그인
      </button>
    </form>
  );
}
```

## 검증 시스템

### 내장 검증 규칙

```tsx
const validationRules = {
  email: { 
    required: true,
    email: true 
  },
  password: { 
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ 
  },
  age: { 
    min: 18,
    max: 100 
  }
};
```

### 커스텀 검증

```tsx
const customRules = {
  username: {
    required: true,
    custom: (value) => {
      if (value && value.includes('admin')) {
        return '관리자 계정명은 사용할 수 없습니다';
      }
      return true;
    }
  }
};
```

## 테마 커스터마이징

```tsx
import { setFormTheme } from '@company/ui-forms';

// 커스텀 테마 적용
setFormTheme({
  colors: {
    primary: '#007bff',
    error: '#dc3545',
    border: '#ced4da'
  },
  sizes: {
    large: {
      height: '3.5rem',
      padding: '1rem',
      fontSize: '1.25rem'
    }
  }
});
```

## 타입 정의

```tsx
import type {
  FormProps,
  FieldProps,
  TextInputProps,
  ValidationRule,
  FieldError,
  UseFormReturn
} from '@company/ui-forms';
```

## 접근성

이 모듈의 모든 컴포넌트는 접근성을 고려하여 설계되었습니다:

- **ARIA 속성**: 적절한 역할과 상태 정보 제공
- **키보드 네비게이션**: 탭, 엔터, 스페이스 키 지원
- **스크린 리더**: 라벨, 힌트, 에러 메시지 연결
- **포커스 관리**: 시각적 포커스 인디케이터

## 개발

```bash
# 의존성 설치
npm install

# 개발 모드
npm run dev

# 빌드
npm run build

# 테스트
npm test

# 린트
npm run lint
```

## 라이센스

MIT

## 기여

이 모듈에 대한 개선사항이나 버그 리포트는 언제나 환영합니다.

---

**@company/ui-forms** - 폼 컴포넌트에만 집중하는 초세분화 모듈