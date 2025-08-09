import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CONFIG_FILE_PATH = path.join(process.cwd(), 'public/config/ui-config.json');

// GET - JSON 파일에서 UI 설정 조회
export async function GET() {
  try {
    console.log('🔍 Loading UI config from JSON file...');
    
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      console.log('❌ JSON config file not found');
      return NextResponse.json({ error: 'Config file not found' }, { status: 404 });
    }

    const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    console.log('✅ JSON config loaded successfully');
    console.log('📋 SectionOrder:', config.mainPage?.sectionOrder);
    
    return NextResponse.json({ config, source: 'json' });
  } catch (error) {
    console.error('❌ Failed to load JSON config:', error);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

// POST - JSON 파일에 UI 설정 저장
export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json();
    
    console.log('💾 Saving UI config to JSON file...');
    console.log('📋 SectionOrder to save:', config.mainPage?.sectionOrder);
    
    // JSON 파일에 저장 (예쁘게 포맷팅)
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    
    // 데이터베이스에도 백업 저장
    try {
      const { prisma } = await import('@/lib/db/prisma');
      await prisma.site_config.upsert({
        where: { key: 'ui-config' },
        update: { value: JSON.stringify(config) },
        create: { 
          id: `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          key: 'ui-config', 
          value: JSON.stringify(config),
          updatedAt: new Date()
        }
      });
      console.log('✅ Config saved to both JSON and database');
    } catch (dbError) {
      console.warn('⚠️ Database backup failed, but JSON saved:', dbError);
    }
    
    return NextResponse.json({ success: true, source: 'json' });
  } catch (error) {
    console.error('❌ Failed to save JSON config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}