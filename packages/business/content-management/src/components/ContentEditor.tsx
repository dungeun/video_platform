import React, { useState, useCallback } from 'react';
import {
  Card,
  Text,
  Input,
  TextArea,
  Select,
  Button,
  Tabs,
  TabPanel,
  Chip,
  Alert
} from '@revu/ui-kit';
import { Editor } from 'draft-js';
import type { Content, ContentPlatform, ContentType } from '../types';
import { MediaUploader } from './MediaUploader';
import { useContentStore } from '../store';

interface ContentEditorProps {
  content?: Content;
  campaignId?: string;
  influencerId?: string;
  onSave: (content: Partial<Content>) => Promise<void>;
  onCancel?: () => void;
  autoSave?: boolean;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  campaignId,
  influencerId,
  onSave,
  onCancel,
  autoSave = true
}) => {
  const { saveDraft, getDraft, removeDraft } = useContentStore();
  const draftId = content?.id || `draft-${Date.now()}`;
  const savedDraft = getDraft(draftId);

  const [formData, setFormData] = useState<Partial<Content>>({
    ...content,
    ...savedDraft,
    campaignId: campaignId || content?.campaignId,
    influencerId: influencerId || content?.influencerId,
    title: content?.title || savedDraft?.title || '',
    description: content?.description || savedDraft?.description || '',
    platform: content?.platform || savedDraft?.platform || 'instagram',
    type: content?.type || savedDraft?.type || 'post',
    caption: content?.caption || savedDraft?.caption || '',
    hashtags: content?.hashtags || savedDraft?.hashtags || [],
    mentions: content?.mentions || savedDraft?.mentions || [],
    media: content?.media || savedDraft?.media || []
  });

  const [saving, setSaving] = useState(false);
  const [hashtag, setHashtag] = useState('');
  const [mention, setMention] = useState('');

  const handleChange = useCallback((
    field: keyof Content,
    value: any
  ) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-save draft
      if (autoSave) {
        saveDraft(draftId, updated);
      }
      
      return updated;
    });
  }, [draftId, autoSave, saveDraft]);

  const addHashtag = useCallback(() => {
    if (hashtag && !formData.hashtags?.includes(hashtag)) {
      handleChange('hashtags', [...(formData.hashtags || []), hashtag]);
      setHashtag('');
    }
  }, [hashtag, formData.hashtags, handleChange]);

  const removeHashtag = useCallback((tag: string) => {
    handleChange(
      'hashtags',
      formData.hashtags?.filter(h => h !== tag) || []
    );
  }, [formData.hashtags, handleChange]);

  const addMention = useCallback(() => {
    if (mention && !formData.mentions?.includes(mention)) {
      handleChange('mentions', [...(formData.mentions || []), mention]);
      setMention('');
    }
  }, [mention, formData.mentions, handleChange]);

  const removeMention = useCallback((m: string) => {
    handleChange(
      'mentions',
      formData.mentions?.filter(men => men !== m) || []
    );
  }, [formData.mentions, handleChange]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      removeDraft(draftId);
    } catch (err) {
      console.error('Failed to save content:', err);
    } finally {
      setSaving(false);
    }
  };

  const getPlatformRequirements = (platform: ContentPlatform, type: ContentType) => {
    const requirements: Record<string, any> = {
      instagram: {
        post: { maxImages: 10, maxCaption: 2200 },
        story: { maxDuration: 15, aspectRatio: '9:16' },
        reel: { maxDuration: 90, aspectRatio: '9:16' }
      },
      youtube: {
        video: { maxDuration: 12 * 60, minDuration: 60 },
        short: { maxDuration: 60, aspectRatio: '9:16' }
      },
      tiktok: {
        video: { maxDuration: 180, aspectRatio: '9:16' }
      }
    };

    return requirements[platform]?.[type] || {};
  };

  const requirements = getPlatformRequirements(
    formData.platform as ContentPlatform,
    formData.type as ContentType
  );

  return (
    <div className="content-editor">
      <Card>
        <Text variant="h2">Content Details</Text>
        
        <Input
          label="Title"
          value={formData.title}
          onChange={(value) => handleChange('title', value)}
          placeholder="Enter content title"
          required
        />

        <TextArea
          label="Description"
          value={formData.description}
          onChange={(value) => handleChange('description', value)}
          placeholder="Brief description for internal use"
          rows={2}
        />

        <div className="platform-type-selectors">
          <Select
            label="Platform"
            value={formData.platform}
            onChange={(value) => handleChange('platform', value)}
            options={[
              { value: 'instagram', label: 'Instagram' },
              { value: 'youtube', label: 'YouTube' },
              { value: 'tiktok', label: 'TikTok' },
              { value: 'twitter', label: 'Twitter' },
              { value: 'facebook', label: 'Facebook' },
              { value: 'linkedin', label: 'LinkedIn' }
            ]}
          />

          <Select
            label="Content Type"
            value={formData.type}
            onChange={(value) => handleChange('type', value)}
            options={[
              { value: 'post', label: 'Post' },
              { value: 'story', label: 'Story' },
              { value: 'reel', label: 'Reel' },
              { value: 'video', label: 'Video' },
              { value: 'live', label: 'Live' }
            ]}
          />
        </div>

        {requirements && (
          <Alert variant="info">
            <Text variant="caption">
              Platform requirements: {JSON.stringify(requirements)}
            </Text>
          </Alert>
        )}
      </Card>

      <Tabs defaultValue="content">
        <TabPanel value="content" label="Content">
          <Card>
            <TextArea
              label="Caption/Copy"
              value={formData.caption}
              onChange={(value) => handleChange('caption', value)}
              placeholder="Write your caption here..."
              rows={6}
              maxLength={requirements.maxCaption}
              showCount
            />

            <div className="hashtags-section">
              <Text variant="h4">Hashtags</Text>
              <div className="hashtag-input">
                <Input
                  value={hashtag}
                  onChange={setHashtag}
                  placeholder="Add hashtag"
                  prefix="#"
                  onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                />
                <Button size="small" onClick={addHashtag}>Add</Button>
              </div>
              <div className="hashtag-list">
                {formData.hashtags?.map((tag) => (
                  <Chip key={tag} onRemove={() => removeHashtag(tag)}>
                    #{tag}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="mentions-section">
              <Text variant="h4">Mentions</Text>
              <div className="mention-input">
                <Input
                  value={mention}
                  onChange={setMention}
                  placeholder="Add mention"
                  prefix="@"
                  onKeyPress={(e) => e.key === 'Enter' && addMention()}
                />
                <Button size="small" onClick={addMention}>Add</Button>
              </div>
              <div className="mention-list">
                {formData.mentions?.map((m) => (
                  <Chip key={m} onRemove={() => removeMention(m)}>
                    @{m}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>
        </TabPanel>

        <TabPanel value="media" label="Media">
          <Card>
            <MediaUploader
              contentId={content?.id || draftId}
              media={formData.media || []}
              onMediaChange={(media) => handleChange('media', media)}
              maxFiles={requirements.maxImages || 10}
              acceptedTypes={
                formData.type === 'video' || formData.type === 'reel'
                  ? ['video/*']
                  : ['image/*', 'video/*']
              }
            />
          </Card>
        </TabPanel>

        <TabPanel value="guidelines" label="Guidelines">
          <Card>
            <Text variant="h4">Content Guidelines</Text>
            {formData.guidelines?.map((guideline, index) => (
              <div key={guideline.id} className="guideline-item">
                <Text variant="body2">
                  {index + 1}. {guideline.requirement}
                </Text>
                {guideline.mandatory && (
                  <Badge variant="error" size="small">Required</Badge>
                )}
              </div>
            ))}
          </Card>
        </TabPanel>
      </Tabs>

      <div className="editor-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={saving}
        >
          {content ? 'Update Content' : 'Create Content'}
        </Button>
      </div>
    </div>
  );
};

export default ContentEditor;