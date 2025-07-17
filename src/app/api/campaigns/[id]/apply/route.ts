import { NextRequest, NextResponse } from 'next/server';
import { campaignService, applyCampaignSchema } from '@/lib/services/campaign.service';
import { handleApiError } from '@/lib/utils/errors';
import { UserType } from '@/lib/types';

// POST /api/campaigns/[id]/apply - 캠페인 지원 (인플루언서 전용)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || userType !== UserType.INFLUENCER) {
      return NextResponse.json(
        { error: '인플루언서만 캠페인에 지원할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = applyCampaignSchema.parse(body);
    
    const application = await campaignService.applyCampaign(params.id, userId, validatedData);
    
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}