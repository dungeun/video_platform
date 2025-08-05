export interface YouTubeVideoInfo {
  youtubeId: string;
  youtubeUrl: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: Date;
  tags: string[];
  category: string;
  embedHtml: string;
}

export class YouTubeService {
  /**
   * Extract video ID from YouTube URL
   * Supports various YouTube URL formats:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://www.youtube.com/watch?v=VIDEO_ID&ab_channel=CHANNEL
   * - https://youtu.be/VIDEO_ID
   * - https://youtu.be/VIDEO_ID?si=TRACKING_ID
   * - https://m.youtube.com/watch?v=VIDEO_ID
   * - https://youtube.com/embed/VIDEO_ID
   */
  static extractVideoId(url: string): string | null {
    // Clean the URL first
    url = url.trim();
    
    // Pattern 1: youtu.be short URL
    const shortUrlPattern = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
    const shortMatch = url.match(shortUrlPattern);
    if (shortMatch) return shortMatch[1];
    
    // Pattern 2: youtube.com/watch URLs
    const watchPattern = /[?&]v=([a-zA-Z0-9_-]{11})/;
    const watchMatch = url.match(watchPattern);
    if (watchMatch) return watchMatch[1];
    
    // Pattern 3: youtube.com/embed URLs
    const embedPattern = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/;
    const embedMatch = url.match(embedPattern);
    if (embedMatch) return embedMatch[1];
    
    // Pattern 4: youtube.com/v/ URLs (old style)
    const vPattern = /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/;
    const vMatch = url.match(vPattern);
    if (vMatch) return vMatch[1];
    
    return null;
  }

  /**
   * Get video info from YouTube URL using oEmbed API
   */
  static async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    try {
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Use YouTube oEmbed API (no API key required)
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch video info from YouTube');
      }

      const oembedData = await response.json();
      
      // Extract thumbnail URL from oEmbed or use default
      const thumbnailUrl = oembedData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      // Try to get higher quality thumbnail
      const highQualityThumbnail = thumbnailUrl.replace('/hqdefault.jpg', '/maxresdefault.jpg');

      return {
        youtubeId: videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: oembedData.title || 'Untitled Video',
        description: '', // oEmbed doesn't provide description
        thumbnailUrl: highQualityThumbnail,
        channelTitle: oembedData.author_name || 'Unknown Channel',
        channelId: oembedData.author_url?.split('/').pop() || '',
        duration: 'PT0S', // Duration not available from oEmbed
        viewCount: 0, // View count not available from oEmbed
        likeCount: 0,
        commentCount: 0,
        publishedAt: new Date(),
        tags: [],
        category: '',
        embedHtml: oembedData.html || this.generateEmbedCode(videoId)
      };
    } catch (error) {
      console.error('Error fetching YouTube video info:', error);
      throw new Error(`Failed to fetch video info: ${error.message}`);
    }
  }

  /**
   * Search YouTube videos - simplified version without external packages
   */
  static async searchVideos(query: string, limit: number = 10): Promise<YouTubeVideoInfo[]> {
    try {
      // Since we can't search without API key, return empty array
      // User should use direct URL import instead
      console.log('YouTube search requires API key. Please use direct URL import.');
      return [];
    } catch (error) {
      console.error('Error searching YouTube videos:', error);
      return [];
    }
  }

  /**
   * Generate YouTube embed HTML code
   */
  private static generateEmbedCode(videoId: string): string {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  /**
   * Get channel videos - simplified version
   */
  static async getChannelVideos(channelUrl: string, limit: number = 10): Promise<YouTubeVideoInfo[]> {
    try {
      // Can't get channel videos without API key
      console.log('Channel videos require API key. Please use direct URL import.');
      return [];
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      return [];
    }
  }
}