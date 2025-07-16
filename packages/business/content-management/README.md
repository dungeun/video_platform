# Content Management Module

## Overview
The Content Management module provides comprehensive tools for creating, managing, and tracking content across multiple social media platforms for the LinkPick platform.

## Features
- **Content Creation**: Multi-platform content editor with media upload
- **Content Briefs**: Detailed project briefs with requirements and guidelines
- **Templates**: Reusable content templates for consistency
- **Calendar Management**: Visual content calendar with scheduling
- **Approval Workflow**: Multi-stage approval process with revisions
- **Media Management**: Upload, organize, and manage media assets
- **Performance Tracking**: Monitor content performance metrics

## Installation

```bash
npm install @revu/content-management
```

## Usage

### Content Creation

```typescript
import { ContentEditor, useContent } from '@revu/content-management';

function CreateContent({ campaignId }) {
  const { createContent } = useContent();

  const handleSave = async (content) => {
    await createContent({
      ...content,
      campaignId
    });
  };

  return (
    <ContentEditor
      campaignId={campaignId}
      onSave={handleSave}
      autoSave
    />
  );
}
```

### Content Calendar

```typescript
import { ContentCalendar, useContentCalendar } from '@revu/content-management';

function CalendarView() {
  const { calendar, scheduleContent } = useContentCalendar({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  return (
    <ContentCalendar
      entries={calendar?.entries || []}
      onSchedule={scheduleContent}
    />
  );
}
```

### Content Templates

```typescript
import { TemplateGallery, useTemplateList } from '@revu/content-management';

function TemplateSelector() {
  const { templates } = useTemplateList({
    platform: 'instagram',
    type: 'post'
  });

  return (
    <TemplateGallery
      templates={templates}
      onSelectTemplate={(template) => {
        // Use template to create content
      }}
    />
  );
}
```

### Approval Workflow

```typescript
import { ApprovalFlow, useContent } from '@revu/content-management';

function ContentApproval({ contentId }) {
  const { content, approveContent, rejectContent } = useContent(contentId);

  return (
    <ApprovalFlow
      content={content}
      onApprove={approveContent}
      onReject={rejectContent}
      currentUser="reviewer@company.com"
    />
  );
}
```

## API Reference

### Types

#### Content
```typescript
interface Content {
  id: string;
  campaignId: string;
  influencerId: string;
  type: ContentType;
  platform: ContentPlatform;
  status: ContentStatus;
  title: string;
  caption: string;
  media: MediaAsset[];
  approval: ApprovalInfo;
  performance?: ContentPerformance;
  // ... more fields
}
```

### Hooks

#### useContent(contentId?: string)
- `content`: Current content data
- `createContent`: Create new content
- `updateContent`: Update existing content
- `submitForApproval`: Submit content for approval
- `approveContent`: Approve content
- `publishContent`: Publish content

#### useContentCalendar(params)
- `calendar`: Calendar data with entries
- `scheduleContent`: Schedule content for a date
- `rescheduleContent`: Change content schedule
- `exportCalendar`: Export calendar data

#### useContentTemplate(templateId?: string)
- `template`: Template data
- `createTemplate`: Create new template
- `generateContent`: Generate content from template
- `rateTemplate`: Rate template

### Components

#### ContentEditor
Full-featured content editor with platform-specific requirements.

#### ContentCalendar
Visual calendar for content scheduling and management.

#### TemplateGallery
Browse and select content templates.

#### MediaUploader
Drag-and-drop media upload with validation.

#### ApprovalFlow
Multi-stage approval workflow interface.

## Events

The module emits the following events:

- `content:created` - When new content is created
- `content:updated` - When content is updated
- `content:scheduled` - When content is scheduled
- `content:published` - When content is published
- `content:approved` - When content is approved

## Configuration

```typescript
// Configure module settings
import { configureContentManagement } from '@revu/content-management';

configureContentManagement({
  autoSaveDrafts: true,
  maxMediaSize: 500 * 1024 * 1024, // 500MB
  supportedPlatforms: ['instagram', 'youtube', 'tiktok'],
  defaultApprovalFlow: 'sequential'
});
```

## License

MIT