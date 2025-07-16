import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  Input,
  TextArea,
  Select,
  FileUpload,
  Button,
  Card,
  Text,
  Stepper,
  Step
} from '@revu/ui-kit';
import type { InfluencerProfile } from '../types';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  category: z.array(z.string()).min(1, 'Select at least one category'),
  tags: z.array(z.string()),
  location: z.object({
    country: z.string().min(1, 'Country is required'),
    city: z.string().min(1, 'City is required'),
    timezone: z.string().min(1, 'Timezone is required')
  }),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  pricing: z.object({
    baseRate: z.number().min(0, 'Base rate must be positive'),
    currency: z.string().min(1, 'Currency is required')
  })
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile?: Partial<InfluencerProfile>;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  onCancel?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onSubmit,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || '',
      username: profile?.username || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      category: profile?.category || [],
      tags: profile?.tags || [],
      location: profile?.location || {
        country: '',
        city: '',
        timezone: ''
      },
      languages: profile?.languages || [],
      pricing: profile?.pricing || {
        baseRate: 0,
        currency: 'USD'
      }
    }
  });

  const steps = [
    { title: 'Basic Info', description: 'Your profile information' },
    { title: 'Categories', description: 'What you specialize in' },
    { title: 'Location', description: 'Where you\'re based' },
    { title: 'Pricing', description: 'Your rates and packages' }
  ];

  const onFormSubmit = async (data: ProfileFormData) => {
    await onSubmit(data);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="form-step">
            <Card>
              <Text variant="h3">Profile Images</Text>
              <div className="image-uploads">
                <FileUpload
                  label="Avatar"
                  accept="image/*"
                  value={avatar}
                  onChange={setAvatar}
                  preview
                />
                <FileUpload
                  label="Cover Image"
                  accept="image/*"
                  value={coverImage}
                  onChange={setCoverImage}
                  preview
                />
              </div>
            </Card>

            <Card>
              <Text variant="h3">Basic Information</Text>
              <Input
                {...register('displayName')}
                label="Display Name"
                error={errors.displayName?.message}
                required
              />
              <Input
                {...register('username')}
                label="Username"
                prefix="@"
                error={errors.username?.message}
                required
              />
              <Input
                {...register('email')}
                label="Email"
                type="email"
                error={errors.email?.message}
                required
              />
              <Input
                {...register('phone')}
                label="Phone (optional)"
                type="tel"
                error={errors.phone?.message}
              />
              <TextArea
                {...register('bio')}
                label="Bio"
                rows={4}
                maxLength={500}
                error={errors.bio?.message}
                helperText="Tell brands about yourself (min 50 characters)"
                required
              />
            </Card>
          </div>
        );

      case 1:
        return (
          <div className="form-step">
            <Card>
              <Text variant="h3">Categories</Text>
              <Select
                control={control}
                name="category"
                label="Select your categories"
                multiple
                options={[
                  { value: 'fashion', label: 'Fashion' },
                  { value: 'beauty', label: 'Beauty' },
                  { value: 'lifestyle', label: 'Lifestyle' },
                  { value: 'food', label: 'Food & Beverage' },
                  { value: 'travel', label: 'Travel' },
                  { value: 'fitness', label: 'Fitness & Health' },
                  { value: 'tech', label: 'Technology' },
                  { value: 'gaming', label: 'Gaming' },
                  { value: 'parenting', label: 'Parenting' },
                  { value: 'business', label: 'Business' }
                ]}
                error={errors.category?.message}
                required
              />
              <Input
                {...register('tags')}
                label="Tags"
                placeholder="Enter tags separated by commas"
                helperText="e.g., sustainable fashion, vegan lifestyle, tech reviews"
              />
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <Card>
              <Text variant="h3">Location & Languages</Text>
              <Select
                control={control}
                name="location.country"
                label="Country"
                options={[
                  { value: 'US', label: 'United States' },
                  { value: 'UK', label: 'United Kingdom' },
                  { value: 'CA', label: 'Canada' },
                  { value: 'AU', label: 'Australia' }
                ]}
                error={errors.location?.country?.message}
                required
              />
              <Input
                {...register('location.city')}
                label="City"
                error={errors.location?.city?.message}
                required
              />
              <Select
                control={control}
                name="location.timezone"
                label="Timezone"
                options={[
                  { value: 'UTC-8', label: 'Pacific Time (UTC-8)' },
                  { value: 'UTC-5', label: 'Eastern Time (UTC-5)' },
                  { value: 'UTC+0', label: 'GMT (UTC+0)' },
                  { value: 'UTC+1', label: 'Central European Time (UTC+1)' }
                ]}
                error={errors.location?.timezone?.message}
                required
              />
              <Select
                control={control}
                name="languages"
                label="Languages"
                multiple
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'zh', label: 'Chinese' },
                  { value: 'ja', label: 'Japanese' },
                  { value: 'ko', label: 'Korean' }
                ]}
                error={errors.languages?.message}
                required
              />
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <Card>
              <Text variant="h3">Pricing Information</Text>
              <div className="pricing-inputs">
                <Input
                  {...register('pricing.baseRate', { valueAsNumber: true })}
                  label="Base Rate"
                  type="number"
                  error={errors.pricing?.baseRate?.message}
                  required
                />
                <Select
                  control={control}
                  name="pricing.currency"
                  label="Currency"
                  options={[
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'AUD', label: 'AUD' },
                    { value: 'CAD', label: 'CAD' }
                  ]}
                  error={errors.pricing?.currency?.message}
                  required
                />
              </div>
              <Text variant="body2" color="secondary">
                You can add detailed pricing packages after creating your profile
              </Text>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form onSubmit={handleSubmit(onFormSubmit)} className="profile-form">
      <Stepper activeStep={currentStep} className="profile-form__stepper">
        {steps.map((step, index) => (
          <Step
            key={index}
            completed={index < currentStep}
            onClick={() => setCurrentStep(index)}
          >
            <Text variant="body2">{step.title}</Text>
            <Text variant="caption" color="secondary">
              {step.description}
            </Text>
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}

      <div className="profile-form__actions">
        {currentStep > 0 && (
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Previous
          </Button>
        )}
        {currentStep < steps.length - 1 ? (
          <Button
            variant="primary"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
            >
              {profile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </>
        )}
      </div>
    </Form>
  );
};

export default ProfileForm;