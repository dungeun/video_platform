// Types
export * from './types';

// Services
export * from './services';

// Components - rename to avoid conflicts
export { 
  NotificationPreferences as NotificationPreferencesComponent,
  TemplateEditor,
  NotificationHistory,
  TestSender
} from './components';

// Hooks
export * from './hooks';

// Utils
export * from './utils';

// Main notification service factory
import { NotificationService, NotificationServiceConfig } from './services';

export const createNotificationService = (config: NotificationServiceConfig) => {
  return new NotificationService(config);
};

// Default export
export default {
  createNotificationService
};