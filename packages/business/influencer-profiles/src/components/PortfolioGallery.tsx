import React, { useState } from 'react';
import {
  Card,
  Text,
  Tabs,
  TabPanel,
  Grid,
  Image,
  Button,
  Modal,
  Badge,
  Rating
} from '@revu/ui-kit';
import { formatDate } from '@revu/shared-utils';
import type { Portfolio, PortfolioCampaign, MediaItem, Testimonial } from '../types';

interface PortfolioGalleryProps {
  portfolio: Portfolio;
  onAddCampaign?: () => void;
  onAddMedia?: () => void;
  onAddTestimonial?: () => void;
  isEditable?: boolean;
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  portfolio,
  onAddCampaign,
  onAddMedia,
  onAddTestimonial,
  isEditable = false
}) => {
  const [selectedCampaign, setSelectedCampaign] = useState<PortfolioCampaign | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  return (
    <div className="portfolio-gallery">
      <Tabs defaultValue="campaigns">
        <TabPanel value="campaigns" label={`Campaigns (${portfolio.campaigns.length})`}>
          {isEditable && (
            <div className="section-header">
              <Button variant="primary" size="small" onClick={onAddCampaign}>
                Add Campaign
              </Button>
            </div>
          )}
          
          <Grid columns={{ xs: 1, md: 2, lg: 3 }} gap="medium">
            {portfolio.campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="campaign-card"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <Text variant="h4">{campaign.title}</Text>
                <Text variant="body2" color="secondary">
                  {campaign.brand}
                </Text>
                <Text variant="body2" numberOfLines={3}>
                  {campaign.description}
                </Text>
                <div className="campaign-meta">
                  <Badge variant="secondary" size="small">
                    {formatDate(campaign.date)}
                  </Badge>
                  {campaign.media.length > 0 && (
                    <Badge variant="outline" size="small">
                      {campaign.media.length} media
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </Grid>

          {portfolio.campaigns.length === 0 && (
            <Card variant="secondary" className="empty-state">
              <Text variant="body1" color="secondary">
                No campaigns added yet
              </Text>
            </Card>
          )}
        </TabPanel>

        <TabPanel value="media" label={`Media (${portfolio.media.length})`}>
          {isEditable && (
            <div className="section-header">
              <Button variant="primary" size="small" onClick={onAddMedia}>
                Add Media
              </Button>
            </div>
          )}

          <Grid columns={{ xs: 2, sm: 3, md: 4 }} gap="small">
            {portfolio.media.map((item) => (
              <div
                key={item.id}
                className="media-item"
                onClick={() => setSelectedMedia(item)}
              >
                <Image
                  src={item.thumbnail || item.url}
                  alt={item.caption || 'Portfolio media'}
                  aspectRatio="square"
                  objectFit="cover"
                />
                {item.type === 'video' && (
                  <div className="media-overlay">
                    <Badge variant="dark" size="small">
                      Video
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </Grid>

          {portfolio.media.length === 0 && (
            <Card variant="secondary" className="empty-state">
              <Text variant="body1" color="secondary">
                No media added yet
              </Text>
            </Card>
          )}
        </TabPanel>

        <TabPanel value="testimonials" label={`Testimonials (${portfolio.testimonials.length})`}>
          {isEditable && (
            <div className="section-header">
              <Button variant="primary" size="small" onClick={onAddTestimonial}>
                Add Testimonial
              </Button>
            </div>
          )}

          <Grid columns={{ xs: 1, md: 2 }} gap="medium">
            {portfolio.testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="testimonial-card">
                <div className="testimonial-header">
                  {testimonial.brandLogo && (
                    <Image
                      src={testimonial.brandLogo}
                      alt={testimonial.brandName}
                      width={40}
                      height={40}
                    />
                  )}
                  <div>
                    <Text variant="h4">{testimonial.brandName}</Text>
                    <Rating value={testimonial.rating} readonly size="small" />
                  </div>
                </div>
                <Text variant="body1" className="testimonial-content">
                  "{testimonial.content}"
                </Text>
                <Text variant="caption" color="secondary">
                  {formatDate(testimonial.date)}
                </Text>
              </Card>
            ))}
          </Grid>

          {portfolio.testimonials.length === 0 && (
            <Card variant="secondary" className="empty-state">
              <Text variant="body1" color="secondary">
                No testimonials added yet
              </Text>
            </Card>
          )}
        </TabPanel>
      </Tabs>

      {/* Campaign Detail Modal */}
      <Modal
        open={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        title={selectedCampaign?.title}
      >
        {selectedCampaign && (
          <div className="campaign-detail">
            <Text variant="body2" color="secondary">
              Brand: {selectedCampaign.brand}
            </Text>
            <Text variant="body1">{selectedCampaign.description}</Text>
            {selectedCampaign.results && (
              <>
                <Text variant="h4">Results</Text>
                <Text variant="body1">{selectedCampaign.results}</Text>
              </>
            )}
            {selectedCampaign.media.length > 0 && (
              <>
                <Text variant="h4">Campaign Media</Text>
                <Grid columns={{ xs: 2, sm: 3 }} gap="small">
                  {selectedCampaign.media.map((url, index) => (
                    <Image
                      key={index}
                      src={url}
                      alt={`Campaign media ${index + 1}`}
                      aspectRatio="square"
                      objectFit="cover"
                    />
                  ))}
                </Grid>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Media Detail Modal */}
      <Modal
        open={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        size="large"
      >
        {selectedMedia && (
          <div className="media-detail">
            {selectedMedia.type === 'image' ? (
              <Image
                src={selectedMedia.url}
                alt={selectedMedia.caption || 'Portfolio media'}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            ) : (
              <video
                src={selectedMedia.url}
                controls
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            )}
            {selectedMedia.caption && (
              <Text variant="body1">{selectedMedia.caption}</Text>
            )}
            <div className="media-tags">
              {selectedMedia.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" size="small">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PortfolioGallery;