const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultSidebarConfig = {
  header: {
    logo: { text: '비디오픽' },
    menus: [
      { id: '1', label: '홈', href: '/', order: 1, visible: true },
      { id: '2', label: '인기', href: '/videos?sort=popular', order: 2, visible: true },
      { id: '3', label: '구독', href: '/subscriptions', order: 3, visible: true },
      { id: '4', label: '라이브', href: '/live', order: 4, visible: true },
      { id: '5', label: '커뮤니티', href: '/community', order: 5, visible: true },
    ],
    ctaButton: { text: '무료로 시작하기', href: '/register', visible: true }
  },
  footer: {
    columns: [
      {
        id: '1', title: '서비스', order: 1,
        links: [
          { id: '1-1', label: '비디오 둘러보기', href: '/videos', order: 1, visible: true },
          { id: '1-2', label: '크리에이터 찾기', href: '/channels', order: 2, visible: true },
          { id: '1-3', label: '스튜디오', href: '/studio', order: 3, visible: true },
        ]
      },
      {
        id: '2', title: '회사', order: 2,
        links: [
          { id: '2-1', label: '회사 소개', href: '/about', order: 1, visible: true },
          { id: '2-2', label: '블로그', href: '/blog', order: 2, visible: true },
          { id: '2-3', label: '채용', href: '/careers', order: 3, visible: true },
        ]
      },
      {
        id: '3', title: '지원', order: 3,
        links: [
          { id: '3-1', label: '도움말', href: '/help', order: 1, visible: true },
          { id: '3-2', label: '문의하기', href: '/contact', order: 2, visible: true },
          { id: '3-3', label: '이용약관', href: '/terms', order: 3, visible: true },
        ]
      }
    ],
    social: [
      { platform: 'twitter', url: 'https://twitter.com/videopick', visible: true },
      { platform: 'facebook', url: 'https://facebook.com/videopick', visible: true },
      { platform: 'instagram', url: 'https://instagram.com/videopick', visible: true },
      { platform: 'youtube', url: 'https://youtube.com/@videopick', visible: true },
    ],
    copyright: '© 2024 비디오픽. All rights reserved.'
  },
  sidebar: {
    mainMenu: [
      { id: 'home', label: '홈', href: '/', icon: 'Home', order: 1, visible: true, section: 'main' },
      { id: 'live', label: '라이브', href: '/live', icon: 'Tv', order: 2, visible: true, section: 'main' },
      { id: 'videos', label: '동영상', href: '/videos', icon: 'Video', order: 3, visible: true, section: 'main' },
      { id: 'trending', label: '인기 영상', href: '/trending', icon: 'Fire', order: 4, visible: true, section: 'main' },
      { id: 'new', label: '신규 영상', href: '/new', icon: 'Plus', order: 5, visible: true, section: 'main' },
    ],
    categoryMenu: [
      { id: 'realestate', label: '부동산', href: '/category/realestate', icon: 'Building', order: 1, visible: true, section: 'category' },
      { id: 'stock', label: '주식', href: '/category/stock', icon: 'TrendingUp', order: 2, visible: true, section: 'category' },
      { id: 'car', label: '자동차', href: '/category/car', icon: 'Car', order: 3, visible: true, section: 'category' },
      { id: 'food', label: '음식', href: '/category/food', icon: 'UtensilsCrossed', order: 4, visible: true, section: 'category' },
      { id: 'travel', label: '여행', href: '/category/travel', icon: 'Plane', order: 5, visible: true, section: 'category' },
      { id: 'game', label: '게임', href: '/category/game', icon: 'Gamepad2', order: 6, visible: true, section: 'category' },
    ],
    settingsMenu: [
      { id: 'settings', label: '설정', href: '/settings', icon: 'Settings', order: 1, visible: true, section: 'settings' },
      { id: 'help', label: '도움말', href: '/help', icon: 'HelpCircle', order: 2, visible: true, section: 'settings' },
      { id: 'feedback', label: '의견 보내기', href: '/feedback', icon: 'MessageSquare', order: 3, visible: true, section: 'settings' },
    ],
    subscribedChannels: [
      { id: 'channel1', name: '지창경', avatar: 'https://i.pravatar.cc/24?img=2', isLive: true, order: 1, visible: true },
      { id: 'channel2', name: '자랑맨', avatar: 'https://i.pravatar.cc/24?img=3', isLive: false, order: 2, visible: true },
      { id: 'channel3', name: '인순효그', avatar: 'https://i.pravatar.cc/24?img=4', isLive: false, order: 3, visible: true },
      { id: 'channel4', name: '주식왕', avatar: 'https://i.pravatar.cc/24?img=5', isLive: false, order: 4, visible: true },
    ]
  },
  mainPage: {
    heroSlides: [
      {
        id: 'slide-1',
        type: 'blue',
        tag: '신규 콘텐츠',
        title: '크리에이터와 함께하는\n창의적인 비디오 세상',
        subtitle: '다양한 비디오 콘텐츠를 만나보세요',
        bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
        order: 1,
        visible: true,
      }
    ],
    categoryMenus: [
      { id: 'cat-1', name: '뷰티', categoryId: 'beauty', icon: '', order: 1, visible: true },
      { id: 'cat-2', name: '패션', categoryId: 'fashion', icon: '', order: 2, visible: true },
      { id: 'cat-3', name: '푸드', categoryId: 'food', icon: '', badge: 'HOT', order: 3, visible: true },
    ],
    quickLinks: [
      { id: 'quick-1', title: '이벤트', icon: '🎁', link: '/events', order: 1, visible: true },
      { id: 'quick-2', title: '쿠폰팩', icon: '🎟️', link: '/coupons', order: 2, visible: true },
      { id: 'quick-3', title: '랭킹', icon: '🏆', link: '/ranking', order: 3, visible: true },
    ],
    promoBanner: {
      title: '크리에이터 지원 프로그램',
      subtitle: '수익화와 성장을 위한 다양한 혜택을 제공합니다',
      icon: '🎬',
      visible: true,
    }
  }
};

async function initSidebarConfig() {
  try {
    console.log('Initializing sidebar configuration...');
    
    // Check if config already exists
    const existingConfig = await prisma.siteConfig.findUnique({
      where: { key: 'ui-config' }
    });

    if (existingConfig) {
      console.log('Config already exists, updating...');
      
      await prisma.siteConfig.update({
        where: { key: 'ui-config' },
        data: { value: JSON.stringify(defaultSidebarConfig) }
      });
    } else {
      console.log('Creating new config...');
      
      await prisma.siteConfig.create({
        data: {
          key: 'ui-config',
          value: JSON.stringify(defaultSidebarConfig)
        }
      });
    }

    console.log('✅ Sidebar configuration initialized successfully!');
    
    // Verify the data
    const savedConfig = await prisma.siteConfig.findUnique({
      where: { key: 'ui-config' }
    });
    
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig.value);
      console.log('✅ Verification: Sidebar menu items count:', {
        mainMenu: parsedConfig.sidebar?.mainMenu?.length || 0,
        categoryMenu: parsedConfig.sidebar?.categoryMenu?.length || 0,
        settingsMenu: parsedConfig.sidebar?.settingsMenu?.length || 0,
        subscribedChannels: parsedConfig.sidebar?.subscribedChannels?.length || 0
      });
    }
    
  } catch (error) {
    console.error('❌ Error initializing sidebar config:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initSidebarConfig();