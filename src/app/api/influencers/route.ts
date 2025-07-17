import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/user.service';
import { handleApiError } from '@/lib/utils/errors';

// GET /api/influencers - 인플루언서 검색
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get('search') || undefined,
      categories: searchParams.get('categories')?.split(',').filter(Boolean),
      minFollowers: searchParams.get('minFollowers') 
        ? Number(searchParams.get('minFollowers')) 
        : undefined,
      platform: searchParams.get('platform') || undefined,
      verified: searchParams.get('verified') 
        ? searchParams.get('verified') === 'true'
        : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    const result = await userService.searchInfluencers(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}