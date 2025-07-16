/**
 * Tracking widget component
 */

import React from 'react';
import { TrackingInfo } from '../types';

export interface TrackingWidgetProps {
  trackingInfo?: TrackingInfo | null;
  loading?: boolean;
  error?: string | null;
}

export function TrackingWidget({ trackingInfo, loading, error }: TrackingWidgetProps) {
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!trackingInfo) return <div>No tracking information</div>;

  return (
    <div className="tracking-widget">
      <h3>Tracking: {trackingInfo.trackingNumber}</h3>
      <p>Status: {trackingInfo.status}</p>
      <p>Location: {trackingInfo.currentLocation}</p>
    </div>
  );
}