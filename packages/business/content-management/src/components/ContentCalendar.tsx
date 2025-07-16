import React, { useState } from 'react';
import {
  Calendar,
  Card,
  Text,
  Button,
  Badge,
  Modal,
  Select
} from '@revu/ui-kit';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import type { Content, CalendarEntry } from '../types';
import { ContentCard } from './ContentCard';
import { useContentStore } from '../store';

interface ContentCalendarProps {
  entries: CalendarEntry[];
  onDateClick?: (date: Date) => void;
  onContentClick?: (content: Content) => void;
  onSchedule?: (date: Date) => void;
  onReschedule?: (content: Content, newDate: Date) => void;
  loading?: boolean;
}

export const ContentCalendar: React.FC<ContentCalendarProps> = ({
  entries,
  onDateClick,
  onContentClick,
  onSchedule,
  onReschedule,
  loading = false
}) => {
  const { calendarView, setCalendarView, selectedDate, setSelectedDate } = useContentStore();
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayContents, setSelectedDayContents] = useState<Content[]>([]);

  const getEntriesMap = () => {
    const map = new Map<string, CalendarEntry>();
    entries.forEach(entry => {
      const key = format(entry.date, 'yyyy-MM-dd');
      map.set(key, entry);
    });
    return map;
  };

  const entriesMap = getEntriesMap();

  const renderCalendarDay = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const entry = entriesMap.get(key);
    
    if (!entry || entry.contents.length === 0) {
      return (
        <div className="calendar-day empty" onClick={() => onSchedule?.(date)}>
          <Text variant="caption" color="secondary">
            No content
          </Text>
        </div>
      );
    }

    const platformCounts = entry.contents.reduce((acc, content) => {
      acc[content.platform] = (acc[content.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div
        className="calendar-day has-content"
        onClick={() => {
          setSelectedDayContents(entry.contents);
          setShowDayModal(true);
        }}
      >
        <div className="content-count">
          <Badge variant="primary" size="small">
            {entry.contents.length}
          </Badge>
        </div>
        <div className="platform-indicators">
          {Object.entries(platformCounts).map(([platform, count]) => (
            <div key={platform} className="platform-dot" title={`${count} ${platform}`}>
              <Badge variant="outline" size="small" icon={platform}>
                {count}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const currentMonth = selectedDate;
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="content-calendar">
      <Card>
        <div className="calendar-header">
          <Text variant="h2">Content Calendar</Text>
          <div className="calendar-controls">
            <Select
              value={calendarView}
              onChange={setCalendarView as any}
              options={[
                { value: 'month', label: 'Month' },
                { value: 'week', label: 'Week' },
                { value: 'day', label: 'Day' }
              ]}
            />
            <Button
              variant="primary"
              size="small"
              onClick={() => onSchedule?.(selectedDate)}
            >
              Schedule Content
            </Button>
          </div>
        </div>

        {calendarView === 'month' && (
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            renderDay={renderCalendarDay}
            loading={loading}
          />
        )}

        {calendarView === 'week' && (
          <div className="week-view">
            {/* Week view implementation */}
            <Text variant="body2" color="secondary">
              Week view coming soon
            </Text>
          </div>
        )}

        {calendarView === 'day' && (
          <div className="day-view">
            <Text variant="h3">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
            <div className="day-contents">
              {entriesMap.get(format(selectedDate, 'yyyy-MM-dd'))?.contents.map(content => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onClick={() => onContentClick?.(content)}
                  showActions={false}
                />
              )) || (
                <Empty message="No content scheduled for this day" />
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Day Contents Modal */}
      <Modal
        open={showDayModal}
        onClose={() => setShowDayModal(false)}
        title={`Content for ${format(selectedDate, 'MMMM d, yyyy')}`}
        size="large"
      >
        <div className="day-modal-contents">
          {selectedDayContents.map(content => (
            <ContentCard
              key={content.id}
              content={content}
              onClick={() => {
                onContentClick?.(content);
                setShowDayModal(false);
              }}
              showActions={false}
            />
          ))}
        </div>
      </Modal>

      {/* Calendar Legend */}
      <Card className="calendar-legend">
        <Text variant="h4">Legend</Text>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color draft" />
            <Text variant="caption">Draft</Text>
          </div>
          <div className="legend-item">
            <div className="legend-color scheduled" />
            <Text variant="caption">Scheduled</Text>
          </div>
          <div className="legend-item">
            <div className="legend-color published" />
            <Text variant="caption">Published</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContentCalendar;