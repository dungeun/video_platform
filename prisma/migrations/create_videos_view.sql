-- Create a view to maintain backward compatibility
-- This view maps the campaigns table to a "videos" interface
-- allowing gradual migration from Campaign to Video model

CREATE OR REPLACE VIEW videos AS
SELECT 
    id,
    business_id as channel_id,
    title,
    description,
    thumbnail_image_url as thumbnail_url,
    video_url,
    duration,
    view_count,
    like_count,
    dislike_count,
    CASE 
        WHEN is_live = true THEN 'live'
        WHEN status = 'ACTIVE' THEN 'published'
        WHEN status = 'DRAFT' THEN 'private'
        ELSE 'processing'
    END as status,
    CASE 
        WHEN status = 'ACTIVE' THEN created_at
        ELSE NULL
    END as published_at,
    hashtags as tags,
    platform as category,
    false as is_short,
    created_at,
    updated_at
FROM campaigns
WHERE video_url IS NOT NULL;

-- Create trigger function to handle inserts/updates on the view
CREATE OR REPLACE FUNCTION handle_videos_view_dml() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO campaigns (
            id, business_id, title, description, 
            thumbnail_image_url, video_url, duration,
            view_count, like_count, dislike_count,
            is_live, status, hashtags, platform,
            created_at, updated_at
        ) VALUES (
            NEW.id, NEW.channel_id, NEW.title, NEW.description,
            NEW.thumbnail_url, NEW.video_url, NEW.duration,
            NEW.view_count, NEW.like_count, NEW.dislike_count,
            CASE WHEN NEW.status = 'live' THEN true ELSE false END,
            CASE 
                WHEN NEW.status = 'published' THEN 'ACTIVE'
                WHEN NEW.status = 'private' THEN 'DRAFT'
                ELSE 'DRAFT'
            END,
            NEW.tags, NEW.category,
            NEW.created_at, NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE campaigns SET
            business_id = NEW.channel_id,
            title = NEW.title,
            description = NEW.description,
            thumbnail_image_url = NEW.thumbnail_url,
            video_url = NEW.video_url,
            duration = NEW.duration,
            view_count = NEW.view_count,
            like_count = NEW.like_count,
            dislike_count = NEW.dislike_count,
            is_live = CASE WHEN NEW.status = 'live' THEN true ELSE false END,
            status = CASE 
                WHEN NEW.status = 'published' THEN 'ACTIVE'
                WHEN NEW.status = 'private' THEN 'DRAFT'
                ELSE 'DRAFT'
            END,
            hashtags = NEW.tags,
            platform = NEW.category,
            updated_at = NEW.updated_at
        WHERE id = NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM campaigns WHERE id = OLD.id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the view
CREATE TRIGGER videos_view_insert_trigger
    INSTEAD OF INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION handle_videos_view_dml();

CREATE TRIGGER videos_view_update_trigger
    INSTEAD OF UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION handle_videos_view_dml();

CREATE TRIGGER videos_view_delete_trigger
    INSTEAD OF DELETE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION handle_videos_view_dml();

-- Add comments for documentation
COMMENT ON VIEW videos IS 'Compatibility view mapping campaigns table to video interface for gradual migration';