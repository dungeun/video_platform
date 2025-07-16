import React, { useState } from 'react';
import {
  Grid,
  Card,
  Text,
  Badge,
  Button,
  Rating,
  Modal,
  SearchInput,
  Select,
  Empty
} from '@revu/ui-kit';
import type { ContentTemplate, ContentPlatform, ContentType } from '../types';
import { useContentStore } from '../store';

interface TemplateGalleryProps {
  templates: ContentTemplate[];
  onSelectTemplate?: (template: ContentTemplate) => void;
  onCreateTemplate?: () => void;
  loading?: boolean;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  onSelectTemplate,
  onCreateTemplate,
  loading = false
}) => {
  const { favoriteTemplates, toggleFavoriteTemplate, isFavoriteTemplate } = useContentStore();
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<ContentPlatform | 'all'>('all');

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    const matchesPlatform = filterPlatform === 'all' || template.platform === filterPlatform;
    
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <div className="template-gallery">
      <div className="gallery-header">
        <Text variant="h2">Content Templates</Text>
        <Button variant="primary" onClick={onCreateTemplate}>
          Create Template
        </Button>
      </div>

      <div className="gallery-filters">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search templates..."
        />
        
        <Select
          value={filterCategory}
          onChange={setFilterCategory}
          options={[
            { value: 'all', label: 'All Categories' },
            ...categories.map(cat => ({ value: cat, label: cat }))
          ]}
        />
        
        <Select
          value={filterPlatform}
          onChange={setFilterPlatform as any}
          options={[
            { value: 'all', label: 'All Platforms' },
            { value: 'instagram', label: 'Instagram' },
            { value: 'youtube', label: 'YouTube' },
            { value: 'tiktok', label: 'TikTok' },
            { value: 'twitter', label: 'Twitter' }
          ]}
        />
      </div>

      {filteredTemplates.length === 0 ? (
        <Empty message="No templates found" />
      ) : (
        <Grid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="medium">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className="template-card"
              onClick={() => setSelectedTemplate(template)}
            >
              {template.thumbnailUrl && (
                <div className="template-thumbnail">
                  <img src={template.thumbnailUrl} alt={template.name} />
                </div>
              )}
              
              <div className="template-content">
                <div className="template-header">
                  <Text variant="h4" numberOfLines={1}>
                    {template.name}
                  </Text>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteTemplate(template.id);
                    }}
                    icon={isFavoriteTemplate(template.id) ? 'star-filled' : 'star'}
                  />
                </div>
                
                <div className="template-meta">
                  <Badge variant="secondary" size="small">
                    {template.category}
                  </Badge>
                  <Badge variant="outline" size="small" icon={template.platform}>
                    {template.platform}
                  </Badge>
                  <Badge variant="outline" size="small">
                    {template.type}
                  </Badge>
                </div>
                
                <div className="template-stats">
                  <div className="stat">
                    <Rating value={template.rating} size="small" readonly />
                  </div>
                  <div className="stat">
                    <Text variant="caption" color="secondary">
                      Used {template.usageCount} times
                    </Text>
                  </div>
                </div>
                
                <div className="template-tags">
                  {template.tags.slice(0, 3).map(tag => (
                    <Text key={tag} variant="caption" color="primary">
                      #{tag}
                    </Text>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </Grid>
      )}

      {/* Template Preview Modal */}
      <Modal
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.name}
        size="large"
        footer={
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => setSelectedTemplate(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (selectedTemplate) {
                  onSelectTemplate?.(selectedTemplate);
                  setSelectedTemplate(null);
                }
              }}
            >
              Use Template
            </Button>
          </div>
        }
      >
        {selectedTemplate && (
          <div className="template-preview">
            <div className="preview-meta">
              <Badge variant="secondary">{selectedTemplate.category}</Badge>
              <Badge variant="outline" icon={selectedTemplate.platform}>
                {selectedTemplate.platform}
              </Badge>
              <Badge variant="outline">{selectedTemplate.type}</Badge>
            </div>
            
            <div className="preview-sections">
              <Text variant="h3">Template Structure</Text>
              {selectedTemplate.structure.sections.map(section => (
                <Card key={section.id} variant="secondary">
                  <Text variant="h4">{section.type}</Text>
                  <Text variant="body2">{section.content}</Text>
                  {section.duration && (
                    <Text variant="caption" color="secondary">
                      Duration: {section.duration}s
                    </Text>
                  )}
                </Card>
              ))}
            </div>
            
            {selectedTemplate.structure.placeholders.length > 0 && (
              <div className="preview-placeholders">
                <Text variant="h3">Placeholders</Text>
                {selectedTemplate.structure.placeholders.map(placeholder => (
                  <div key={placeholder.id} className="placeholder-item">
                    <Text variant="body2">
                      {placeholder.name}
                      {placeholder.required && (
                        <Badge variant="error" size="small">Required</Badge>
                      )}
                    </Text>
                    <Text variant="caption" color="secondary">
                      Type: {placeholder.type}
                    </Text>
                  </div>
                ))}
              </div>
            )}
            
            <div className="preview-stats">
              <Rating value={selectedTemplate.rating} readonly />
              <Text variant="body2">
                Used {selectedTemplate.usageCount} times
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TemplateGallery;