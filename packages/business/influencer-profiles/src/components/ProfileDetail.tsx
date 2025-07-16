import React from 'react';
import {
  Container,
  Tabs,
  TabPanel,
  Card,
  Text,
  Button,
  Avatar,
  Badge,
  Grid
} from '@revu/ui-kit';
import { formatNumber, formatDate } from '@revu/shared-utils';
import type { InfluencerProfile } from '../types';
import { VerificationBadge } from './VerificationBadge';
import { SocialMetrics } from './SocialMetrics';
import { PortfolioGallery } from './PortfolioGallery';

interface ProfileDetailProps {
  profile: InfluencerProfile;
  onEdit?: () => void;
  onContact?: () => void;
  isOwner?: boolean;
}

export const ProfileDetail: React.FC<ProfileDetailProps> = ({
  profile,
  onEdit,
  onContact,
  isOwner = false
}) => {
  return (
    <Container className="profile-detail">
      {/* Header Section */}
      <Card className="profile-detail__header">
        <div className="profile-detail__header-content">
          <Avatar
            src={profile.avatar}
            alt={profile.displayName}
            size="xlarge"
          />
          <div className="profile-detail__info">
            <div className="profile-detail__name-row">
              <Text variant="h1">{profile.displayName}</Text>
              <VerificationBadge level={profile.verification.level} size="large" />
            </div>
            <Text variant="body1" color="secondary">
              @{profile.username}
            </Text>
            <div className="profile-detail__location">
              <Text variant="body2">
                {profile.location.city}, {profile.location.country}
              </Text>
            </div>
            <div className="profile-detail__categories">
              {profile.category.map((cat) => (
                <Badge key={cat} variant="primary">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
          <div className="profile-detail__actions">
            {isOwner ? (
              <Button variant="primary" onClick={onEdit}>
                Edit Profile
              </Button>
            ) : (
              <Button variant="primary" onClick={onContact}>
                Contact
              </Button>
            )}
          </div>
        </div>
        
        <Text variant="body1" className="profile-detail__bio">
          {profile.bio}
        </Text>

        {/* Quick Stats */}
        <Grid columns={{ xs: 2, sm: 4 }} gap="medium" className="profile-detail__stats">
          <Card variant="secondary">
            <Text variant="caption" color="secondary">Total Followers</Text>
            <Text variant="h3">{formatNumber(profile.metrics.totalFollowers)}</Text>
          </Card>
          <Card variant="secondary">
            <Text variant="caption" color="secondary">Avg. Engagement</Text>
            <Text variant="h3">{profile.metrics.averageEngagement.toFixed(1)}%</Text>
          </Card>
          <Card variant="secondary">
            <Text variant="caption" color="secondary">Est. Reach</Text>
            <Text variant="h3">{formatNumber(profile.metrics.reachEstimate)}</Text>
          </Card>
          <Card variant="secondary">
            <Text variant="caption" color="secondary">Base Rate</Text>
            <Text variant="h3">
              {profile.pricing.currency} {formatNumber(profile.pricing.baseRate)}
            </Text>
          </Card>
        </Grid>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="profile-detail__tabs">
        <TabPanel value="overview" label="Overview">
          <Grid columns={{ xs: 1, md: 2 }} gap="large">
            <Card>
              <Text variant="h2">About</Text>
              <div className="profile-detail__about">
                <div className="about-item">
                  <Text variant="caption" color="secondary">Languages</Text>
                  <Text variant="body1">{profile.languages.join(', ')}</Text>
                </div>
                <div className="about-item">
                  <Text variant="caption" color="secondary">Response Time</Text>
                  <Text variant="body1">{profile.availability.responseTime}</Text>
                </div>
                <div className="about-item">
                  <Text variant="caption" color="secondary">Member Since</Text>
                  <Text variant="body1">{formatDate(profile.createdAt)}</Text>
                </div>
              </div>
            </Card>

            <Card>
              <Text variant="h2">Social Accounts</Text>
              <div className="profile-detail__social">
                {profile.socialAccounts.map((account) => (
                  <div key={account.platform} className="social-account">
                    <Badge variant="outline" icon={account.platform}>
                      {account.platform}
                    </Badge>
                    <Text variant="body2">@{account.handle}</Text>
                    <Text variant="caption" color="secondary">
                      {formatNumber(account.followers)} followers
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          </Grid>
        </TabPanel>

        <TabPanel value="metrics" label="Metrics">
          <SocialMetrics metrics={profile.metrics} accounts={profile.socialAccounts} />
        </TabPanel>

        <TabPanel value="portfolio" label="Portfolio">
          <PortfolioGallery portfolio={profile.portfolio} />
        </TabPanel>

        <TabPanel value="pricing" label="Pricing">
          <Card>
            <Text variant="h2">Pricing Packages</Text>
            <Grid columns={{ xs: 1, md: 2, lg: 3 }} gap="medium">
              {profile.pricing.packages.map((pkg) => (
                <Card key={pkg.id} variant="secondary">
                  <Text variant="h3">{pkg.name}</Text>
                  <Text variant="h2" color="primary">
                    {profile.pricing.currency} {formatNumber(pkg.price)}
                  </Text>
                  <Text variant="body2" color="secondary">
                    {pkg.description}
                  </Text>
                  <div className="package-deliverables">
                    {pkg.deliverables.map((item, idx) => (
                      <div key={idx} className="deliverable">
                        <Text variant="body2">• {item}</Text>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </Grid>
            {profile.pricing.customQuoteAvailable && (
              <Card variant="info">
                <Text variant="body1">
                  Custom packages available. Contact for personalized pricing.
                </Text>
              </Card>
            )}
          </Card>
        </TabPanel>
      </Tabs>
    </Container>
  );
};

export default ProfileDetail;