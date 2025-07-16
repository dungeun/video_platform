import { CreateUserProfileInput, UpdateUserProfileInput, UserProfileValidationRules } from '../types';

export const DEFAULT_VALIDATION_RULES: UserProfileValidationRules = {
  nameMinLength: 1,
  nameMaxLength: 100,
  bioMaxLength: 500,
  pictureMaxSize: 5 * 1024 * 1024, // 5MB
};

export class UserProfileValidator {
  private rules: UserProfileValidationRules;

  constructor(rules: Partial<UserProfileValidationRules> = {}) {
    this.rules = { ...DEFAULT_VALIDATION_RULES, ...rules };
  }

  validateCreateInput(input: CreateUserProfileInput): string[] {
    const errors: string[] = [];

    // Validate ID
    if (!input.id || typeof input.id !== 'string' || input.id.trim().length === 0) {
      errors.push('ID is required and must be a non-empty string');
    }

    // Validate name
    if (!input.name || typeof input.name !== 'string') {
      errors.push('Name is required and must be a string');
    } else {
      const trimmedName = input.name.trim();
      if (trimmedName.length === 0) {
        errors.push('Name is required and must be a string');
      } else {
        if (trimmedName.length < this.rules.nameMinLength) {
          errors.push(`Name must be at least ${this.rules.nameMinLength} characters long`);
        }
        if (trimmedName.length > this.rules.nameMaxLength) {
          errors.push(`Name must not exceed ${this.rules.nameMaxLength} characters`);
        }
      }
    }

    // Validate picture URL
    if (input.picture !== undefined) {
      if (typeof input.picture !== 'string') {
        errors.push('Picture must be a string URL');
      } else if (input.picture.trim().length > 0 && !this.isValidUrl(input.picture)) {
        errors.push('Picture must be a valid URL');
      }
    }

    // Validate bio
    if (input.bio !== undefined) {
      if (typeof input.bio !== 'string') {
        errors.push('Bio must be a string');
      } else if (input.bio.length > this.rules.bioMaxLength) {
        errors.push(`Bio must not exceed ${this.rules.bioMaxLength} characters`);
      }
    }

    return errors;
  }

  validateUpdateInput(input: UpdateUserProfileInput): string[] {
    const errors: string[] = [];

    // Validate name if provided
    if (input.name !== undefined) {
      if (typeof input.name !== 'string') {
        errors.push('Name must be a string');
      } else {
        const trimmedName = input.name.trim();
        if (trimmedName.length < this.rules.nameMinLength) {
          errors.push(`Name must be at least ${this.rules.nameMinLength} characters long`);
        }
        if (trimmedName.length > this.rules.nameMaxLength) {
          errors.push(`Name must not exceed ${this.rules.nameMaxLength} characters`);
        }
      }
    }

    // Validate picture URL if provided
    if (input.picture !== undefined) {
      if (typeof input.picture !== 'string') {
        errors.push('Picture must be a string URL');
      } else if (input.picture.trim().length > 0 && !this.isValidUrl(input.picture)) {
        errors.push('Picture must be a valid URL');
      }
    }

    // Validate bio if provided
    if (input.bio !== undefined) {
      if (typeof input.bio !== 'string') {
        errors.push('Bio must be a string');
      } else if (input.bio.length > this.rules.bioMaxLength) {
        errors.push(`Bio must not exceed ${this.rules.bioMaxLength} characters`);
      }
    }

    return errors;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}