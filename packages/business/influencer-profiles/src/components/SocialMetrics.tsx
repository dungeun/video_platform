import React from 'react';
import {
  Card,
  Text,
  Grid,
  Chart,
  Table,
  Progress,
  Badge
} from '@revu/ui-kit';
import { formatNumber, formatPercentage } from '@revu/shared-utils';
import type { InfluencerMetrics, SocialAccount } from '../types';

interface SocialMetricsProps {
  metrics: InfluencerMetrics;
  accounts: SocialAccount[];
}

export const SocialMetrics: React.FC<SocialMetricsProps> = ({
  metrics,
  accounts
}) => {
  const platformColors: Record<string, string> = {
    instagram: '#E4405F',
    youtube: '#FF0000',
    tiktok: '#000000',
    twitter: '#1DA1F2',
    facebook: '#1877F2',
    linkedin: '#0A66C2',
    pinterest: '#E60023',
    twitch: '#9146FF'
  };

  const audienceData = Object.entries(metrics.audienceDemographics.ageGroups).map(
    ([age, percentage]) => ({
      name: age,
      value: percentage
    })
  );

  const genderData = Object.entries(metrics.audienceDemographics.gender).map(
    ([gender, percentage]) => ({
      name: gender,
      value: percentage
    })
  );

  const locationData = Object.entries(metrics.audienceDemographics.locations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([location, percentage]) => ({
      name: location,
      value: percentage
    }));

  return (
    <div className="social-metrics">
      {/* Overview Cards */}
      <Grid columns={{ xs: 1, sm: 2, md: 4 }} gap="medium">
        <Card>
          <Text variant="caption" color="secondary">Total Reach</Text>
          <Text variant="h2">{formatNumber(metrics.totalFollowers)}</Text>
          <Progress value={75} size="small" color="primary" />
        </Card>
        <Card>
          <Text variant="caption" color="secondary">Avg. Engagement</Text>
          <Text variant="h2">{metrics.averageEngagement.toFixed(2)}%</Text>
          <Text variant="caption" color={metrics.averageEngagement > 3 ? 'success' : 'warning'}>
            {metrics.averageEngagement > 3 ? '↑ Above average' : '↓ Below average'}
          </Text>
        </Card>
        <Card>
          <Text variant="caption" color="secondary">Est. Impressions</Text>
          <Text variant="h2">{formatNumber(metrics.reachEstimate)}</Text>
          <Text variant="caption" color="secondary">per post</Text>
        </Card>
        <Card>
          <Text variant="caption" color="secondary">Growth Rate</Text>
          <Text variant="h2">+{metrics.growthRate.toFixed(1)}%</Text>
          <Text variant="caption" color="secondary">monthly</Text>
        </Card>
      </Grid>

      {/* Platform Breakdown */}
      <Card>
        <Text variant="h3">Platform Performance</Text>
        <Table
          columns={[
            { key: 'platform', label: 'Platform' },
            { key: 'followers', label: 'Followers' },
            { key: 'engagement', label: 'Engagement' },
            { key: 'status', label: 'Status' }
          ]}
          data={accounts.map(account => ({
            platform: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: platformColors[account.platform]
                  }}
                />
                <Text variant="body2">{account.platform}</Text>
              </div>
            ),
            followers: formatNumber(account.followers),
            engagement: `${account.engagement.toFixed(2)}%`,
            status: account.verified ? (
              <Badge variant="success" size="small">Verified</Badge>
            ) : (
              <Badge variant="secondary" size="small">Unverified</Badge>
            )
          }))}
        />
      </Card>

      {/* Audience Demographics */}
      <Grid columns={{ xs: 1, md: 3 }} gap="medium">
        <Card>
          <Text variant="h3">Age Distribution</Text>
          <Chart
            type="pie"
            data={audienceData}
            height={200}
          />
        </Card>
        <Card>
          <Text variant="h3">Gender Distribution</Text>
          <Chart
            type="doughnut"
            data={genderData}
            height={200}
          />
        </Card>
        <Card>
          <Text variant="h3">Top Locations</Text>
          <Chart
            type="bar"
            data={locationData}
            height={200}
            options={{
              indexAxis: 'y',
              responsive: true,
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </Card>
      </Grid>

      {/* Content Performance */}
      <Card>
        <Text variant="h3">Content Performance</Text>
        <Grid columns={{ xs: 2, md: 4 }} gap="small">
          <div className="metric-item">
            <Text variant="caption" color="secondary">Avg. Likes</Text>
            <Text variant="h4">{formatNumber(metrics.contentPerformance.averageLikes)}</Text>
          </div>
          <div className="metric-item">
            <Text variant="caption" color="secondary">Avg. Comments</Text>
            <Text variant="h4">{formatNumber(metrics.contentPerformance.averageComments)}</Text>
          </div>
          <div className="metric-item">
            <Text variant="caption" color="secondary">Avg. Shares</Text>
            <Text variant="h4">{formatNumber(metrics.contentPerformance.averageShares)}</Text>
          </div>
          <div className="metric-item">
            <Text variant="caption" color="secondary">Top Posts</Text>
            <Text variant="h4">{metrics.contentPerformance.topPerformingContent.length}</Text>
          </div>
        </Grid>
      </Card>

      {/* Audience Interests */}
      <Card>
        <Text variant="h3">Audience Interests</Text>
        <div className="interest-tags">
          {metrics.audienceDemographics.interests.map((interest, index) => (
            <Badge key={index} variant="secondary">
              {interest}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SocialMetrics;