import React, { useState } from 'react';
import {
  Card,
  Text,
  Button,
  TextArea,
  Timeline,
  Avatar,
  Badge,
  Modal
} from '@revu/ui-kit';
import { formatDate, formatRelativeTime } from '@revu/shared-utils';
import type { Content, ApprovalInfo, ContentRevision } from '../types';

interface ApprovalFlowProps {
  content: Content;
  onApprove?: (feedback?: string) => void;
  onReject?: (reason: string) => void;
  onRequestRevision?: (revision: Partial<ContentRevision>) => void;
  currentUser?: string;
}

export const ApprovalFlow: React.FC<ApprovalFlowProps> = ({
  content,
  onApprove,
  onReject,
  onRequestRevision,
  currentUser
}) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');

  const canApprove = content.approval.requiredApprovers.includes(currentUser || '') &&
                    !content.approval.currentApprovers.includes(currentUser || '');

  const getApprovalProgress = () => {
    const total = content.approval.requiredApprovers.length;
    const current = content.approval.currentApprovers.length;
    return (current / total) * 100;
  };

  const handleApprove = () => {
    onApprove?.(feedback);
    setShowApprovalModal(false);
    setFeedback('');
  };

  const handleReject = () => {
    onReject?.(rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleRequestRevision = () => {
    onRequestRevision?.({
      changes: revisionNotes,
      requestedBy: currentUser
    });
    setShowRevisionModal(false);
    setRevisionNotes('');
  };

  return (
    <div className="approval-flow">
      <Card>
        <Text variant="h3">Approval Status</Text>
        
        <div className="approval-status">
          <Badge
            variant={
              content.approval.status === 'approved' ? 'success' :
              content.approval.status === 'rejected' ? 'error' :
              content.approval.status === 'revision_requested' ? 'warning' :
              'info'
            }
            size="large"
          >
            {content.approval.status.replace('_', ' ').toUpperCase()}
          </Badge>
          
          {content.approval.approvedAt && (
            <Text variant="caption" color="secondary">
              Approved {formatRelativeTime(content.approval.approvedAt)}
            </Text>
          )}
        </div>

        {content.approval.status === 'pending' && (
          <>
            <div className="approval-progress">
              <Text variant="body2">Approval Progress</Text>
              <Progress value={getApprovalProgress()} />
              <Text variant="caption" color="secondary">
                {content.approval.currentApprovers.length} of{' '}
                {content.approval.requiredApprovers.length} approvals
              </Text>
            </div>

            <div className="required-approvers">
              <Text variant="body2">Required Approvers</Text>
              <div className="approver-list">
                {content.approval.requiredApprovers.map(approver => (
                  <div key={approver} className="approver-item">
                    <Avatar name={approver} size="small" />
                    <Text variant="body2">{approver}</Text>
                    {content.approval.currentApprovers.includes(approver) && (
                      <Badge variant="success" size="small">Approved</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {content.approval.feedback && (
          <Card variant="secondary">
            <Text variant="body2">Feedback</Text>
            <Text variant="body1">{content.approval.feedback}</Text>
          </Card>
        )}

        {canApprove && content.approval.status === 'pending' && (
          <div className="approval-actions">
            <Button
              variant="success"
              onClick={() => setShowApprovalModal(true)}
            >
              Approve
            </Button>
            <Button
              variant="warning"
              onClick={() => setShowRevisionModal(true)}
            >
              Request Revision
            </Button>
            <Button
              variant="error"
              onClick={() => setShowRejectModal(true)}
            >
              Reject
            </Button>
          </div>
        )}
      </Card>

      {/* Revision History */}
      {content.revisions.length > 0 && (
        <Card>
          <Text variant="h3">Revision History</Text>
          <Timeline>
            {content.revisions.map(revision => (
              <Timeline.Item
                key={revision.id}
                title={`Version ${revision.version}`}
                date={formatDate(revision.requestedAt)}
              >
                <Text variant="body2">{revision.changes}</Text>
                <Text variant="caption" color="secondary">
                  Requested by {revision.requestedBy}
                </Text>
                {revision.completedAt && (
                  <Badge variant="success" size="small">
                    Completed {formatRelativeTime(revision.completedAt)}
                  </Badge>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}

      {/* Approval Modal */}
      <Modal
        open={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Approve Content"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowApprovalModal(false)}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleApprove}>
              Approve
            </Button>
          </>
        }
      >
        <TextArea
          label="Feedback (optional)"
          value={feedback}
          onChange={setFeedback}
          placeholder="Add any feedback or comments..."
          rows={4}
        />
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Content"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Reject
            </Button>
          </>
        }
      >
        <TextArea
          label="Reason for rejection"
          value={rejectReason}
          onChange={setRejectReason}
          placeholder="Please provide a reason for rejection..."
          rows={4}
          required
        />
      </Modal>

      {/* Revision Modal */}
      <Modal
        open={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Request Revision"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowRevisionModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={handleRequestRevision}
              disabled={!revisionNotes.trim()}
            >
              Request Revision
            </Button>
          </>
        }
      >
        <TextArea
          label="Revision notes"
          value={revisionNotes}
          onChange={setRevisionNotes}
          placeholder="Describe what changes are needed..."
          rows={4}
          required
        />
      </Modal>
    </div>
  );
};

export default ApprovalFlow;