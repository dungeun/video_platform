import {
  CreateContractParams,
  UpdateContractParams,
  Contract,
  ValidationError,
  ContractStatus
} from '../types';

export class ContractValidator {
  validateCreateParams(params: CreateContractParams): void {
    const errors: string[] = [];

    // Must have either template or content
    if (!params.templateId && !params.content) {
      errors.push('Either templateId or content must be provided');
    }

    // Validate parties
    if (!params.parties || params.parties.length === 0) {
      errors.push('At least one party is required');
    } else {
      // Must have at least one client and one contractor
      const hasClient = params.parties.some(p => p.role === 'client');
      const hasContractor = params.parties.some(p => p.role === 'contractor');
      
      if (!hasClient) {
        errors.push('At least one party with role "client" is required');
      }
      if (!hasContractor) {
        errors.push('At least one party with role "contractor" is required');
      }

      // Validate party details
      params.parties.forEach((party, index) => {
        if (!party.name || party.name.trim().length === 0) {
          errors.push(`Party ${index + 1}: name is required`);
        }
        if (!party.email || !this.isValidEmail(party.email)) {
          errors.push(`Party ${index + 1}: valid email is required`);
        }
        if (!party.type) {
          errors.push(`Party ${index + 1}: type is required`);
        }
        if (!party.role) {
          errors.push(`Party ${index + 1}: role is required`);
        }
      });
    }

    // Validate expiry
    if (params.expiresIn !== undefined && params.expiresIn <= 0) {
      errors.push('expiresIn must be a positive number');
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `Validation failed: ${errors.join(', ')}`,
        errors
      );
    }
  }

  validateUpdateParams(params: UpdateContractParams, contract: Contract): void {
    const errors: string[] = [];

    // Cannot update certain fields after contract is sent
    if (contract.status !== ContractStatus.DRAFT) {
      if (params.parties) {
        errors.push('Cannot update parties after contract is sent');
      }
      if (params.content) {
        errors.push('Cannot update content after contract is sent');
      }
    }

    // Validate status transitions
    if (params.status) {
      if (!this.isValidStatusTransition(contract.status, params.status)) {
        errors.push(`Invalid status transition from ${contract.status} to ${params.status}`);
      }
    }

    // Validate parties if provided
    if (params.parties) {
      params.parties.forEach((party, index) => {
        if (!party.email || !this.isValidEmail(party.email)) {
          errors.push(`Party ${index + 1}: valid email is required`);
        }
      });
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `Validation failed: ${errors.join(', ')}`,
        errors
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidStatusTransition(from: ContractStatus, to: ContractStatus): boolean {
    const validTransitions: Record<ContractStatus, ContractStatus[]> = {
      [ContractStatus.DRAFT]: [
        ContractStatus.REVIEW,
        ContractStatus.PENDING_APPROVAL,
        ContractStatus.APPROVED,
        ContractStatus.SENT,
        ContractStatus.CANCELLED
      ],
      [ContractStatus.REVIEW]: [
        ContractStatus.DRAFT,
        ContractStatus.PENDING_APPROVAL,
        ContractStatus.APPROVED,
        ContractStatus.CANCELLED
      ],
      [ContractStatus.PENDING_APPROVAL]: [
        ContractStatus.APPROVED,
        ContractStatus.DRAFT,
        ContractStatus.CANCELLED
      ],
      [ContractStatus.APPROVED]: [
        ContractStatus.SENT,
        ContractStatus.DRAFT,
        ContractStatus.CANCELLED
      ],
      [ContractStatus.SENT]: [
        ContractStatus.VIEWED,
        ContractStatus.PARTIALLY_SIGNED,
        ContractStatus.EXPIRED,
        ContractStatus.CANCELLED
      ],
      [ContractStatus.VIEWED]: [
        ContractStatus.PARTIALLY_SIGNED,
        ContractStatus.SIGNED,
        ContractStatus.EXPIRED,
        ContractStatus.CANCELLED
      ],
      [ContractStatus.PARTIALLY_SIGNED]: [
        ContractStatus.SIGNED,
        ContractStatus.EXPIRED,
        ContractStatus.CANCELLED
      ],
      [ContractStatus.SIGNED]: [
        ContractStatus.ACTIVE,
        ContractStatus.TERMINATED
      ],
      [ContractStatus.ACTIVE]: [
        ContractStatus.EXPIRED,
        ContractStatus.TERMINATED
      ],
      [ContractStatus.EXPIRED]: [
        ContractStatus.TERMINATED
      ],
      [ContractStatus.CANCELLED]: [],
      [ContractStatus.TERMINATED]: []
    };

    return validTransitions[from]?.includes(to) || false;
  }

  validateSignature(signatureData: string, type: 'drawn' | 'typed' | 'uploaded'): void {
    const errors: string[] = [];

    switch (type) {
      case 'drawn':
      case 'uploaded':
        if (!signatureData.startsWith('data:image/')) {
          errors.push('Signature must be a valid base64 image');
        }
        const base64Data = signatureData.split(',')[1];
        if (!base64Data) {
          errors.push('Invalid signature image format');
        }
        break;
      
      case 'typed':
        if (!signatureData || signatureData.trim().length < 3) {
          errors.push('Typed signature must be at least 3 characters');
        }
        break;
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `Invalid signature: ${errors.join(', ')}`,
        errors
      );
    }
  }
}