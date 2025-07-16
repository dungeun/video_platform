import { BaseService } from '@revu/core';
import type {
  Content,
  ContentFilter,
  ContentBrief,
  ContentTemplate,
  MediaAsset,
  ContentRevision,
  ApprovalInfo,
  ContentPerformance
} from '../types';

export class ContentService extends BaseService {
  async createContent(data: Partial<Content>): Promise<Content> {
    return this.post<Content>('/contents', data);
  }

  async getContent(contentId: string): Promise<Content> {
    return this.get<Content>(`/contents/${contentId}`);
  }

  async updateContent(
    contentId: string,
    updates: Partial<Content>
  ): Promise<Content> {
    return this.put<Content>(`/contents/${contentId}`, updates);
  }

  async deleteContent(contentId: string): Promise<void> {
    return this.delete(`/contents/${contentId}`);
  }

  async listContents(filter?: ContentFilter): Promise<{
    contents: Content[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.get('/contents', { params: filter });
  }

  async uploadMedia(
    contentId: string,
    file: File,
    metadata?: Record<string, any>
  ): Promise<MediaAsset> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return this.post<MediaAsset>(
      `/contents/${contentId}/media`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }

  async deleteMedia(contentId: string, mediaId: string): Promise<void> {
    return this.delete(`/contents/${contentId}/media/${mediaId}`);
  }

  async submitForApproval(contentId: string): Promise<Content> {
    return this.post<Content>(`/contents/${contentId}/submit-approval`);
  }

  async approveContent(
    contentId: string,
    feedback?: string
  ): Promise<Content> {
    return this.post<Content>(`/contents/${contentId}/approve`, { feedback });
  }

  async rejectContent(
    contentId: string,
    reason: string
  ): Promise<Content> {
    return this.post<Content>(`/contents/${contentId}/reject`, { reason });
  }

  async requestRevision(
    contentId: string,
    revision: Partial<ContentRevision>
  ): Promise<Content> {
    return this.post<Content>(`/contents/${contentId}/revisions`, revision);
  }

  async scheduleContent(
    contentId: string,
    scheduledAt: Date
  ): Promise<Content> {
    return this.post<Content>(`/contents/${contentId}/schedule`, {
      scheduledAt
    });
  }

  async publishContent(contentId: string): Promise<Content> {
    return this.post<Content>(`/contents/${contentId}/publish`);
  }

  async getContentPerformance(
    contentId: string
  ): Promise<ContentPerformance> {
    return this.get<ContentPerformance>(`/contents/${contentId}/performance`);
  }

  async syncContentPerformance(
    contentId: string
  ): Promise<ContentPerformance> {
    return this.post<ContentPerformance>(
      `/contents/${contentId}/sync-performance`
    );
  }

  async duplicateContent(contentId: string): Promise<Content> {
    return this.post<Content>(`/contents/${contentId}/duplicate`);
  }

  async archiveContent(contentId: string): Promise<void> {
    return this.post(`/contents/${contentId}/archive`);
  }

  async getBulkContents(contentIds: string[]): Promise<Content[]> {
    return this.post<Content[]>('/contents/bulk', { contentIds });
  }

  async bulkUpdateContents(
    contentIds: string[],
    updates: Partial<Content>
  ): Promise<void> {
    return this.put('/contents/bulk', { contentIds, updates });
  }

  async exportContents(filter?: ContentFilter): Promise<Blob> {
    const response = await this.get('/contents/export', {
      params: filter,
      responseType: 'blob'
    });
    return response as Blob;
  }
}