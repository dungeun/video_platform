import React from 'react';
import {
  Card,
  Text,
  Badge,
  Button,
  Tabs,
  TabPanel,
  Timeline,
  Progress,
  Checkbox
} from '@revu/ui-kit';
import { formatDate } from '@revu/shared-utils';
import type { ContentBrief, Deliverable } from '../types';

interface ContentBriefViewProps {
  brief: ContentBrief;
  onEdit?: () => void;
  onExport?: (format: 'pdf' | 'docx') => void;
  onShare?: () => void;
  onUpdateDeliverable?: (deliverableId: string, status: Deliverable['status']) => void;
  editable?: boolean;
}

export const ContentBriefView: React.FC<ContentBriefViewProps> = ({
  brief,
  onEdit,
  onExport,
  onShare,
  onUpdateDeliverable,
  editable = false
}) => {
  const getDeliverableStatusColor = (status: Deliverable['status']) => {
    const colors = {
      pending: 'secondary',
      in_progress: 'warning',
      submitted: 'info',
      approved: 'success',
      rejected: 'error'
    };
    return colors[status];
  };

  const completedDeliverables = brief.deliverables.filter(
    d => d.status === 'approved'
  ).length;
  const completionPercentage = (completedDeliverables / brief.deliverables.length) * 100;

  return (
    <div className="content-brief">
      <Card>
        <div className="brief-header">
          <div>
            <Text variant="h1">{brief.title}</Text>
            <Text variant="body2" color="secondary">
              Created {formatDate(brief.createdAt)}
            </Text>
          </div>
          <div className="brief-actions">
            {editable && (
              <Button variant="secondary" size="small" onClick={onEdit}>
                Edit Brief
              </Button>
            )}
            <Button
              variant="ghost"
              size="small"
              onClick={() => onExport?.('pdf')}
            >
              Export PDF
            </Button>
            <Button variant="ghost" size="small" onClick={onShare}>
              Share
            </Button>
          </div>
        </div>

        <div className="brief-progress">
          <Text variant="body2">Overall Progress</Text>
          <Progress value={completionPercentage} />
          <Text variant="caption" color="secondary">
            {completedDeliverables} of {brief.deliverables.length} deliverables completed
          </Text>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabPanel value="overview" label="Overview">
          <Card>
            <Text variant="h3">Objective</Text>
            <Text variant="body1">{brief.objective}</Text>

            <Text variant="h3">Target Audience</Text>
            <Text variant="body1">{brief.targetAudience}</Text>

            <Text variant="h3">Key Messages</Text>
            <ul className="key-messages">
              {brief.keyMessages.map((message, index) => (
                <li key={index}>
                  <Text variant="body2">{message}</Text>
                </li>
              ))}
            </ul>

            {brief.budget && (
              <>
                <Text variant="h3">Budget</Text>
                <Text variant="h2" color="primary">
                  ${brief.budget.toLocaleString()}
                </Text>
              </>
            )}
          </Card>
        </TabPanel>

        <TabPanel value="requirements" label="Requirements">
          <Card>
            <Text variant="h3">Content Requirements</Text>
            {brief.contentRequirements.map((req, index) => (
              <Card key={index} variant="secondary">
                <div className="requirement-header">
                  <Badge variant="primary">{req.platform}</Badge>
                  <Badge variant="outline">{req.type}</Badge>
                  <Text variant="body2">Quantity: {req.quantity}</Text>
                </div>
                {req.specifications && (
                  <div className="requirement-specs">
                    {Object.entries(req.specifications).map(([key, value]) => (
                      <Text key={key} variant="caption" color="secondary">
                        {key}: {value}
                      </Text>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </Card>

          <Card>
            <Text variant="h3">Brand Guidelines</Text>
            {brief.brandGuidelines.map((guideline, index) => (
              <div key={index} className="guideline">
                <Badge variant="secondary" size="small">
                  {guideline.type}
                </Badge>
                <Text variant="body2">{guideline.description}</Text>
                {guideline.examples && (
                  <div className="guideline-examples">
                    <Text variant="caption" color="secondary">Examples:</Text>
                    {guideline.examples.map((example, idx) => (
                      <Text key={idx} variant="caption">• {example}</Text>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Card>
        </TabPanel>

        <TabPanel value="deliverables" label="Deliverables">
          <Card>
            <Text variant="h3">Deliverables</Text>
            <div className="deliverables-list">
              {brief.deliverables.map((deliverable) => (
                <Card key={deliverable.id} variant="secondary">
                  <div className="deliverable-header">
                    <div>
                      <Text variant="h4">{deliverable.name}</Text>
                      <div className="deliverable-meta">
                        <Badge variant="outline" size="small">
                          {deliverable.platform}
                        </Badge>
                        <Badge variant="outline" size="small">
                          {deliverable.type}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      variant={getDeliverableStatusColor(deliverable.status)}
                    >
                      {deliverable.status}
                    </Badge>
                  </div>
                  <Text variant="body2" color="secondary">
                    Due: {formatDate(deliverable.dueDate)}
                  </Text>
                  {editable && deliverable.status !== 'approved' && (
                    <Button
                      size="small"
                      variant="primary"
                      onClick={() => onUpdateDeliverable?.(
                        deliverable.id,
                        deliverable.status === 'pending' ? 'in_progress' : 'submitted'
                      )}
                    >
                      {deliverable.status === 'pending' ? 'Start' : 'Submit'}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </TabPanel>

        <TabPanel value="timeline" label="Timeline">
          <Card>
            <Text variant="h3">Project Timeline</Text>
            <Timeline>
              {brief.timeline.map((phase, index) => (
                <Timeline.Item
                  key={index}
                  title={phase.phase}
                  date={`${formatDate(phase.startDate)} - ${formatDate(phase.endDate)}`}
                  active={new Date() >= phase.startDate && new Date() <= phase.endDate}
                >
                  <div className="phase-milestones">
                    {phase.milestones.map((milestone, idx) => (
                      <div key={idx} className="milestone">
                        <Checkbox
                          checked={milestone.completed}
                          readOnly={!editable}
                        />
                        <Text variant="body2">{milestone.name}</Text>
                        <Text variant="caption" color="secondary">
                          {formatDate(milestone.date)}
                        </Text>
                      </div>
                    ))}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPanel>

        <TabPanel value="examples" label="Examples & Restrictions">
          <Card>
            <Text variant="h3">Reference Examples</Text>
            <div className="examples-list">
              {brief.examples.map((example, index) => (
                <a
                  key={index}
                  href={example}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="example-link"
                >
                  <Text variant="body2" color="primary">
                    {example}
                  </Text>
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <Text variant="h3">Restrictions</Text>
            <ul className="restrictions-list">
              {brief.restrictions.map((restriction, index) => (
                <li key={index}>
                  <Text variant="body2" color="error">
                    {restriction}
                  </Text>
                </li>
              ))}
            </ul>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default ContentBriefView;