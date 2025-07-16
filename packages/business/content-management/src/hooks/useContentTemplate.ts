import { useState, useCallback, useEffect } from 'react';
import { useNotification } from '@revu/ui-kit';
import { TemplateService } from '../services';
import type {
  ContentTemplate,
  ContentPlatform,
  ContentType,
  TemplateSection,
  TemplatePlaceholder
} from '../types';

const templateService = new TemplateService();

export function useContentTemplate(templateId?: string) {
  const [template, setTemplate] = useState<ContentTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();

  const fetchTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await templateService.getTemplate(id);
      setTemplate(data);
    } catch (err) {
      setError(err as Error);
      showNotification({
        type: 'error',
        message: 'Failed to load template'
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const createTemplate = useCallback(async (
    data: Partial<ContentTemplate>
  ) => {
    setLoading(true);
    try {
      const created = await templateService.createTemplate(data);
      setTemplate(created);
      showNotification({
        type: 'success',
        message: 'Template created successfully'
      });
      return created;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to create template'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<ContentTemplate>
  ) => {
    setLoading(true);
    try {
      const updated = await templateService.updateTemplate(id, updates);
      setTemplate(updated);
      showNotification({
        type: 'success',
        message: 'Template updated successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to update template'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const deleteTemplate = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await templateService.deleteTemplate(id);
      setTemplate(null);
      showNotification({
        type: 'success',
        message: 'Template deleted successfully'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to delete template'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const generateContent = useCallback(async (
    id: string,
    data: Record<string, any>
  ) => {
    setLoading(true);
    try {
      const result = await templateService.generateContentFromTemplate(id, data);
      showNotification({
        type: 'success',
        message: 'Content generated from template'
      });
      return result;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to generate content'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const rateTemplate = useCallback(async (
    id: string,
    rating: number
  ) => {
    try {
      const updated = await templateService.rateTemplate(id, rating);
      setTemplate(updated);
      showNotification({
        type: 'success',
        message: 'Thank you for rating!'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to rate template'
      });
      throw err;
    }
  }, [showNotification]);

  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    }
  }, [templateId, fetchTemplate]);

  return {
    template,
    loading,
    error,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    generateContent,
    rateTemplate,
    refetch: () => templateId && fetchTemplate(templateId)
  };
}

export function useTemplateList(filter?: {
  category?: string;
  platform?: ContentPlatform;
  type?: ContentType;
  search?: string;
}) {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async (params?: typeof filter) => {
    setLoading(true);
    setError(null);
    try {
      const result = await templateService.listTemplates(params || filter);
      setTemplates(result.templates);
      setTotal(result.total);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    total,
    loading,
    error,
    refetch: fetchTemplates
  };
}

export function usePopularTemplates(limit: number = 10) {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      setLoading(true);
      try {
        const data = await templateService.getPopularTemplates(limit);
        setTemplates(data);
      } catch (err) {
        console.error('Failed to fetch popular templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopular();
  }, [limit]);

  return { templates, loading };
}

export function useRecommendedTemplates(
  campaignId?: string,
  platform?: ContentPlatform
) {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommended = async () => {
      setLoading(true);
      try {
        const data = await templateService.getRecommendedTemplates(
          campaignId,
          platform
        );
        setTemplates(data);
      } catch (err) {
        console.error('Failed to fetch recommended templates:', err);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId || platform) {
      fetchRecommended();
    }
  }, [campaignId, platform]);

  return { templates, loading };
}

export function useTemplateCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await templateService.getTemplateCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch template categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
}