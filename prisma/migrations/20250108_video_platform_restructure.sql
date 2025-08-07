-- Video Platform Database Restructure Migration
-- This migration transforms the campaign-focused schema to a video-focused schema

-- ============================================
-- 1. RENAME AND RESTRUCTURE EXISTING TABLES
-- ============================================

-- Rename campaigns table to legacy_campaigns (keep for reference)
ALTER TABLE campaigns RENAME TO legacy_campaigns;
ALTER TABLE campaign_applications RENAME TO legacy_campaign_applications;
ALTER TABLE campaign_likes RENAME TO legacy_campaign_likes;
ALTER TABLE campaign_templates RENAME TO legacy_campaign_templates;

-- ============================================
-- 2. UPDATE VIDEOS TABLE STRUCTURE
-- ============================================

-- Add missing columns to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS channel_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS channel_avatar VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS monetization_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ad_revenue DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_restricted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS likes_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'ko',
ADD COLUMN IF NOT EXISTS subtitle_languages TEXT[],
ADD COLUMN IF NOT EXISTS video_quality VARCHAR(20) DEFAULT '1080p',
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS encoding_status VARCHAR(50) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at);
CREATE INDEX IF NOT EXISTS idx_videos_view_count ON videos(view_count);
CREATE INDEX IF NOT EXISTS idx_videos_is_featured ON videos(is_featured);
CREATE INDEX IF NOT EXISTS idx_videos_is_premium ON videos(is_premium);

-- ============================================
-- 3. CREATE VIDEO CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS video_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(500),
  parent_id VARCHAR(36),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  video_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES video_categories(id) ON DELETE SET NULL
);

-- Insert default categories
INSERT INTO video_categories (name, slug, description, display_order) VALUES
('엔터테인먼트', 'entertainment', '음악, 코미디, 예능 등', 1),
('게임', 'gaming', '게임 플레이, 리뷰, 공략', 2),
('교육', 'education', '강의, 튜토리얼, 학습 콘텐츠', 3),
('스포츠', 'sports', '스포츠 경기, 하이라이트, 분석', 4),
('뉴스', 'news', '시사, 정치, 경제 뉴스', 5),
('음악', 'music', '뮤직비디오, 라이브, 커버', 6),
('영화/애니메이션', 'film', '영화 리뷰, 예고편, 애니메이션', 7),
('과학기술', 'tech', 'IT, 과학, 기술 리뷰', 8),
('요리', 'cooking', '레시피, 요리 방법, 맛집', 9),
('뷰티/패션', 'beauty', '메이크업, 패션, 스타일링', 10),
('여행', 'travel', '여행 브이로그, 여행 정보', 11),
('자동차', 'auto', '자동차 리뷰, 시승기', 12),
('반려동물', 'pets', '펫 브이로그, 훈련, 정보', 13),
('부동산/재테크', 'finance', '부동산, 주식, 재테크 정보', 14),
('라이프스타일', 'lifestyle', '일상, 브이로그, 라이프스타일', 15)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 4. CREATE VIDEO PLAYLISTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS video_playlists (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  channel_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  is_public BOOLEAN DEFAULT true,
  video_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

-- ============================================
-- 5. CREATE PLAYLIST VIDEOS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS playlist_videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  playlist_id VARCHAR(36) NOT NULL,
  video_id VARCHAR(36) NOT NULL,
  position INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (playlist_id) REFERENCES video_playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  UNIQUE(playlist_id, video_id),
  UNIQUE(playlist_id, position)
);

-- ============================================
-- 6. CREATE VIDEO ANALYTICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS video_analytics (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  video_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  watch_time_minutes INTEGER DEFAULT 0,
  average_view_duration INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  subscriber_gained INTEGER DEFAULT 0,
  subscriber_lost INTEGER DEFAULT 0,
  estimated_revenue DECIMAL(10,2) DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  UNIQUE(video_id, date)
);

-- ============================================
-- 7. CREATE FEATURED VIDEOS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS featured_videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  video_id VARCHAR(36) NOT NULL,
  section VARCHAR(50) NOT NULL, -- 'home', 'trending', 'recommended', 'premium'
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- ============================================
-- 8. CREATE PREMIUM SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) NOT NULL,
  plan_type VARCHAR(50) NOT NULL, -- 'basic', 'standard', 'premium'
  price DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT true,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 9. MIGRATE DATA FROM CAMPAIGNS TO VIDEOS
-- ============================================

-- Insert campaign data as videos (transform campaigns to videos)
INSERT INTO videos (
  id,
  channel_id,
  title,
  description,
  thumbnail_url,
  video_url,
  duration,
  view_count,
  status,
  published_at,
  category,
  created_at,
  updated_at
)
SELECT 
  lc.id,
  COALESCE(c.id, lc.business_id), -- Use channel if exists, otherwise business_id
  lc.title,
  lc.description,
  COALESCE(lc.image_url, 'https://via.placeholder.com/640x360'),
  COALESCE(lc.image_url, 'https://via.placeholder.com/640x360'), -- Use image as video placeholder
  FLOOR(RANDOM() * 600 + 60)::INTEGER, -- Random duration 1-10 minutes
  COALESCE(lc.view_count, 0),
  CASE 
    WHEN lc.status = 'ACTIVE' THEN 'published'
    WHEN lc.status = 'COMPLETED' THEN 'published'
    ELSE 'draft'
  END,
  lc.created_at,
  'general', -- Default category
  lc.created_at,
  lc.updated_at
FROM legacy_campaigns lc
LEFT JOIN channels c ON c.user_id = lc.business_id
WHERE NOT EXISTS (
  SELECT 1 FROM videos v WHERE v.id = lc.id
);

-- ============================================
-- 10. UPDATE YOUTUBE VIDEOS TABLE
-- ============================================

ALTER TABLE youtube_videos
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS revenue_share DECIMAL(5,2) DEFAULT 55.00,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0;

-- ============================================
-- 11. CREATE VIDEO RECOMMENDATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS video_recommendations (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) NOT NULL,
  video_id VARCHAR(36) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  reason VARCHAR(100), -- 'trending', 'similar_watched', 'subscribed_channel', 'category_interest'
  is_shown BOOLEAN DEFAULT false,
  is_clicked BOOLEAN DEFAULT false,
  shown_at TIMESTAMP,
  clicked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- ============================================
-- 12. UPDATE SITE CONFIG FOR VIDEO PLATFORM
-- ============================================

-- Update site configuration for video platform
UPDATE site_config 
SET value = jsonb_set(value::jsonb, '{platform_type}', '"video"', true)::text
WHERE key = 'general_settings';

-- Add video platform specific settings
INSERT INTO site_config (id, key, value, updated_at, created_at) VALUES
(gen_random_uuid()::text, 'video_upload_settings', '{"max_file_size_mb": 5000, "allowed_formats": ["mp4", "webm", "mov"], "max_duration_minutes": 60}', NOW(), NOW()),
(gen_random_uuid()::text, 'monetization_settings', '{"ad_revenue_share": 55, "min_watch_time_hours": 4000, "min_subscribers": 1000}', NOW(), NOW()),
(gen_random_uuid()::text, 'streaming_settings', '{"rtmp_server": "rtmp://stream.videopick.com/live", "max_bitrate": 6000, "max_resolution": "1080p"}', NOW(), NOW())
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();

-- ============================================
-- 13. CREATE MATERIALIZED VIEW FOR TRENDING
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS trending_videos AS
SELECT 
  v.id,
  v.title,
  v.thumbnail_url,
  v.view_count,
  v.like_count,
  v.published_at,
  v.duration,
  c.name as channel_name,
  c.avatar_url as channel_avatar,
  (v.view_count * 0.4 + v.like_count * 10 + v.share_count * 5 - v.dislike_count * 2) as trending_score
FROM videos v
JOIN channels c ON v.channel_id = c.id
WHERE v.status = 'published'
  AND v.published_at > NOW() - INTERVAL '7 days'
ORDER BY trending_score DESC
LIMIT 100;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_trending_videos_score ON trending_videos(trending_score);

-- ============================================
-- 14. ADD TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_categories_updated_at BEFORE UPDATE ON video_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_playlists_updated_at BEFORE UPDATE ON video_playlists
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 15. GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions (adjust based on your user)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ============================================
-- MIGRATION COMPLETED
-- ============================================