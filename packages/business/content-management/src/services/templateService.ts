import { BaseService } from '@revu/core';
import type {
  ContentTemplate,
  ContentPlatform,
  ContentType,
  TemplateSection,
  TemplatePlaceholder
} from '../types';

export class TemplateService extends BaseService {
  async createTemplate(
    data: Partial<ContentTemplate>
  ): Promise<ContentTemplate> {
    return this.post<ContentTemplate>('/content-templates', data);
  }

  async getTemplate(templateId: string): Promise<ContentTemplate> {
    return this.get<ContentTemplate>(`/content-templates/${templateId}`);
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<ContentTemplate>
  ): Promise<ContentTemplate> {
    return this.put<ContentTemplate>(
      `/content-templates/${templateId}`,
      updates
    );
  }

  async deleteTemplate(templateId: string): Promise<void> {
    return this.delete(`/content-templates/${templateId}`);
  }

  async listTemplates(filter?: {
    category?: string;
    platform?: ContentPlatform;
    type?: ContentType;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    templates: ContentTemplate[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.get('/content-templates', { params: filter });
  }

  async getPopularTemplates(
    limit: number = 10
  ): Promise<ContentTemplate[]> {
    return this.get<ContentTemplate[]>('/content-templates/popular', {
      params: { limit }
    });
  }

  async getRecommendedTemplates(
    campaignId?: string,
    platform?: ContentPlatform
  ): Promise<ContentTemplate[]> {
    return this.get<ContentTemplate[]>('/content-templates/recommended', {
      params: { campaignId, platform }
    });
  }

  async duplicateTemplate(templateId: string): Promise<ContentTemplate> {
    return this.post<ContentTemplate>(
      `/content-templates/${templateId}/duplicate`
    );
  }

  async rateTemplate(
    templateId: string,
    rating: number
  ): Promise<ContentTemplate> {
    return this.post<ContentTemplate>(
      `/content-templates/${templateId}/rate`,
      { rating }
    );
  }

  async addSection(
    templateId: string,
    section: TemplateSection
  ): Promise<ContentTemplate> {
    return this.post<ContentTemplate>(
      `/content-templates/${templateId}/sections`,
      section
    );
  }

  async updateSection(
    templateId: string,
    sectionId: string,
    updates: Partial<TemplateSection>
  ): Promise<ContentTemplate> {
    return this.put<ContentTemplate>(
      `/content-templates/${templateId}/sections/${sectionId}`,
      updates
    );
  }

  async deleteSection(
    templateId: string,
    sectionId: string
  ): Promise<ContentTemplate> {
    return this.delete<ContentTemplate>(
      `/content-templates/${templateId}/sections/${sectionId}`
    );
  }

  async reorderSections(
    templateId: string,
    sectionIds: string[]
  ): Promise<ContentTemplate> {
    return this.put<ContentTemplate>(
      `/content-templates/${templateId}/sections/reorder`,
      { sectionIds }
    );
  }

  async addPlaceholder(
    templateId: string,
    placeholder: TemplatePlaceholder
  ): Promise<ContentTemplate> {
    return this.post<ContentTemplate>(
      `/content-templates/${templateId}/placeholders`,
      placeholder
    );
  }

  async generateContentFromTemplate(
    templateId: string,
    data: Record<string, any>
  ): Promise<{
    content: string;
    media: any[];
  }> {
    return this.post(
      `/content-templates/${templateId}/generate`,
      data
    );
  }

  async importTemplate(file: File): Promise<ContentTemplate> {
    const formData = new FormData();
    formData.append('template', file);

    return this.post<ContentTemplate>(
      '/content-templates/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }

  async exportTemplate(
    templateId: string,
    format: 'json' | 'zip'
  ): Promise<Blob> {
    const response = await this.get(
      `/content-templates/${templateId}/export`,
      {
        params: { format },
        responseType: 'blob'
      }
    );
    return response as Blob;
  }

  async getTemplateCategories(): Promise<string[]> {
    return this.get<string[]>('/content-templates/categories');
  }
}