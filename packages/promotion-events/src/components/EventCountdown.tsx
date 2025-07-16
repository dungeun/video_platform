/**
 * EventCountdown Component
 * Displays countdown timer for promotional events
 */

import React, { useState, useEffect } from 'react';
import { Event, EventStatus } from '../types';

export interface EventCountdownProps {
  event: Event;
  onEventStart?: (event: Event) => void;
  onEventEnd?: (event: Event) => void;
  format?: 'full' | 'compact' | 'minimal';
  showLabels?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const EventCountdown: React.FC<EventCountdownProps> = ({
  event,
  onEventStart,
  onEventEnd,
  format = 'full',
  showLabels = true,
  className = '',
  style = {}
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [countdownType, setCountdownType] = useState<'start' | 'end' | 'finished'>('start');

  useEffect(() => {
    const calculateTimeRemaining = (): TimeRemaining | null => {
      const now = new Date().getTime();
      const startTime = new Date(event.startDate).getTime();
      const endTime = new Date(event.endDate).getTime();

      let targetTime: number;
      let newCountdownType: 'start' | 'end' | 'finished';

      if (event.status === EventStatus.UPCOMING || (event.status === EventStatus.LIVE && now < startTime)) {
        targetTime = startTime - now;
        newCountdownType = 'start';
      } else if (event.status === EventStatus.LIVE || (now >= startTime && now < endTime)) {
        targetTime = endTime - now;
        newCountdownType = 'end';
      } else {
        newCountdownType = 'finished';
        return null;
      }

      if (targetTime <= 0) {
        if (newCountdownType === 'start') {
          // Event is starting
          if (onEventStart) {
            onEventStart(event);
          }
          // Switch to countdown to end
          targetTime = endTime - now;
          newCountdownType = 'end';
          
          if (targetTime <= 0) {
            newCountdownType = 'finished';
            if (onEventEnd) {
              onEventEnd(event);
            }
            return null;
          }
        } else {
          // Event is ending
          newCountdownType = 'finished';
          if (onEventEnd) {
            onEventEnd(event);
          }
          return null;
        }
      }

      setCountdownType(newCountdownType);

      const days = Math.floor(targetTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((targetTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((targetTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((targetTime % (1000 * 60)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        total: targetTime
      };
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Set up interval for updates
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [event, onEventStart, onEventEnd]);

  const getCountdownPrefix = (): string => {
    switch (countdownType) {
      case 'start':
        return 'Starts in';
      case 'end':
        return 'Ends in';
      default:
        return '';
    }
  };

  const formatTime = (time: TimeRemaining): string => {
    switch (format) {
      case 'compact':
        if (time.days > 0) {
          return `${time.days}d ${time.hours}h ${time.minutes}m`;
        } else if (time.hours > 0) {
          return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
        } else {
          return `${time.minutes}m ${time.seconds}s`;
        }
      
      case 'minimal':
        if (time.days > 0) {
          return `${time.days}d ${time.hours}h`;
        } else if (time.hours > 0) {
          return `${time.hours}h ${time.minutes}m`;
        } else {
          return `${time.minutes}:${time.seconds.toString().padStart(2, '0')}`;
        }
      
      default: // full
        return `${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s`;
    }
  };

  const renderTimeUnit = (value: number, label: string, showUnit: boolean = true) => {
    if (format === 'minimal' && value === 0) return null;
    
    return (
      <div className="countdown-unit">
        <span className="countdown-value">{value.toString().padStart(2, '0')}</span>
        {showLabels && showUnit && <span className="countdown-label">{label}</span>}
      </div>
    );
  };

  const renderFullCountdown = (time: TimeRemaining) => {
    return (
      <div className="countdown-units">
        {time.days > 0 && renderTimeUnit(time.days, 'days')}
        {(time.days > 0 || time.hours > 0) && renderTimeUnit(time.hours, 'hours')}
        {(time.days > 0 || time.hours > 0 || time.minutes > 0) && renderTimeUnit(time.minutes, 'minutes')}
        {renderTimeUnit(time.seconds, 'seconds')}
      </div>
    );
  };

  if (!event.showCountdown || countdownType === 'finished') {
    return null;
  }

  if (!timeRemaining) {
    return (
      <div className={`event-countdown countdown-finished ${className}`} style={style}>
        <span className="countdown-status">
          {event.status === EventStatus.ENDED ? 'Event has ended' : 'Event finished'}
        </span>
      </div>
    );
  }

  const baseClasses = [
    'event-countdown',
    `countdown-format-${format}`,
    `countdown-type-${countdownType}`,
    timeRemaining.total < 60000 ? 'countdown-urgent' : '', // Less than 1 minute
    timeRemaining.total < 3600000 ? 'countdown-warning' : '', // Less than 1 hour
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={baseClasses} style={style}>
      {showLabels && (
        <div className="countdown-prefix">
          {getCountdownPrefix()}
        </div>
      )}
      
      {format === 'full' ? (
        renderFullCountdown(timeRemaining)
      ) : (
        <div className="countdown-text">
          {formatTime(timeRemaining)}
        </div>
      )}
      
      <div className="countdown-event-info">
        <span className="countdown-event-name">{event.name}</span>
        {event.type && (
          <span className="countdown-event-type">
            {event.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        )}
      </div>
    </div>
  );
};

// Event Progress Bar Component
export interface EventProgressProps {
  event: Event;
  showPercentage?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const EventProgress: React.FC<EventProgressProps> = ({
  event,
  showPercentage = true,
  className = '',
  style = {}
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      const now = new Date().getTime();
      const startTime = new Date(event.startDate).getTime();
      const endTime = new Date(event.endDate).getTime();
      const totalDuration = endTime - startTime;

      if (now < startTime) {
        return 0;
      } else if (now > endTime) {
        return 100;
      } else {
        const elapsed = now - startTime;
        return (elapsed / totalDuration) * 100;
      }
    };

    setProgress(calculateProgress());

    const interval = setInterval(() => {
      setProgress(calculateProgress());
    }, 1000);

    return () => clearInterval(interval);
  }, [event.startDate, event.endDate]);

  return (
    <div className={`event-progress ${className}`} style={style}>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="progress-text">
          {Math.round(progress)}% complete
        </div>
      )}
    </div>
  );
};

// Multiple Events Countdown Component
export interface MultiEventCountdownProps {
  events: Event[];
  maxDisplay?: number;
  format?: 'full' | 'compact' | 'minimal';
  showLabels?: boolean;
  onEventStart?: (event: Event) => void;
  onEventEnd?: (event: Event) => void;
  className?: string;
}

export const MultiEventCountdown: React.FC<MultiEventCountdownProps> = ({
  events,
  maxDisplay = 3,
  format = 'compact',
  showLabels = true,
  onEventStart,
  onEventEnd,
  className = ''
}) => {
  const activeEvents = events
    .filter(event => 
      event.showCountdown && 
      (event.status === EventStatus.UPCOMING || event.status === EventStatus.LIVE)
    )
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, maxDisplay);

  if (activeEvents.length === 0) {
    return null;
  }

  return (
    <div className={`multi-event-countdown ${className}`}>
      <h3 className="countdown-title">Upcoming Events</h3>
      <div className="countdown-list">
        {activeEvents.map(event => (
          <EventCountdown
            key={event.id}
            event={event}
            format={format}
            showLabels={showLabels}
            onEventStart={onEventStart}
            onEventEnd={onEventEnd}
            className="countdown-item"
          />
        ))}
      </div>
    </div>
  );
};

export default EventCountdown;