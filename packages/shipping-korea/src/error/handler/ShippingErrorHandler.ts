/**
 * Error handler for shipping module
 */

import { ErrorHandler } from '@repo/core';
import { ApiError } from '../../types';

export class ShippingErrorHandler extends ErrorHandler {
  handleApiError(error: any): ApiError {
    return {
      code: error.code || 'SHIPPING_ERROR',
      message: error.message || 'Shipping operation failed',
      retryable: error.status >= 500,
      details: error
    };
  }
}