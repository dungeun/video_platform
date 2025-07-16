import {
  FollowerAnalysisParams,
  FollowerAnalysis,
  BotIndicator,
  RedFlag,
  ProfileScore,
  Severity,
  SocialAccount
} from '../types';

export class FakeFollowerDetector {
  private readonly BOT_USERNAME_PATTERNS = [
    /^[a-z]+[0-9]{4,}$/i, // letters followed by 4+ numbers
    /^[a-z]+_[0-9]+$/i,   // letters_numbers
    /^user[0-9]+$/i,      // user123
    /^[0-9]+[a-z]+$/i     // numbers followed by letters
  ];

  private readonly SUSPICIOUS_KEYWORDS = [
    'fake', 'bot', 'auto', 'follow', 'like', 'buy', 'cheap'
  ];

  async analyze(params: FollowerAnalysisParams): Promise<FollowerAnalysis> {
    // In a real implementation, this would fetch actual follower data
    // For now, we'll simulate the analysis
    const mockFollowers = this.generateMockFollowers(params.sampleSize || 100);
    
    const profileScores = mockFollowers.map(follower => 
      this.analyzeFollowerProfile(follower)
    );

    const fakeCount = profileScores.filter(score => score.isFake).length;
    const fakePercentage = (fakeCount / profileScores.length) * 100;

    const botIndicators = this.analyzeBotIndicators(profileScores);
    const redFlags = this.identifyRedFlags(profileScores);

    return {
      totalFollowers: params.sampleSize || 100, // In real impl, would be actual count
      analyzedSample: profileScores.length,
      fakePercentage,
      botIndicators,
      redFlags,
      profileScores,
      confidence: this.calculateConfidence(profileScores.length, fakePercentage)
    };
  }

  private analyzeFollowerProfile(follower: any): ProfileScore {
    // Profile completeness score (0-1)
    const profileScore = this.calculateProfileScore(follower);
    
    // Activity score (0-1)
    const activityScore = this.calculateActivityScore(follower);
    
    // Network score (0-1)
    const networkScore = this.calculateNetworkScore(follower);
    
    // Overall score (weighted average)
    const overallScore = (profileScore * 0.4) + (activityScore * 0.4) + (networkScore * 0.2);
    
    return {
      followerId: follower.id,
      username: follower.username,
      profileScore,
      activityScore,
      networkScore,
      overallScore,
      isFake: overallScore < 0.5 // Threshold for fake detection
    };
  }

  private calculateProfileScore(follower: any): number {
    let score = 1.0;
    
    // Profile picture
    if (!follower.profilePicture || follower.profilePicture.includes('default')) {
      score -= 0.3;
    }
    
    // Bio/description
    if (!follower.bio || follower.bio.length < 10) {
      score -= 0.2;
    }
    
    // Username patterns
    if (this.hasSuspiciousUsername(follower.username)) {
      score -= 0.4;
    }
    
    // Name vs username similarity
    if (follower.name && this.namesAreTooSimilar(follower.name, follower.username)) {
      score -= 0.2;
    }
    
    // Suspicious keywords in bio
    if (follower.bio && this.containsSuspiciousKeywords(follower.bio)) {
      score -= 0.3;
    }
    
    return Math.max(0, score);
  }

  private calculateActivityScore(follower: any): number {
    let score = 1.0;
    
    // Post count
    if (follower.postCount === 0) {
      score -= 0.5;
    } else if (follower.postCount < 5) {
      score -= 0.3;
    }
    
    // Account age vs activity
    const accountAgeMonths = this.getAccountAgeMonths(follower.createdAt);
    if (accountAgeMonths > 12 && follower.postCount < 10) {
      score -= 0.3;
    }
    
    // Last activity
    if (follower.lastActive) {
      const daysSinceActive = this.getDaysSince(follower.lastActive);
      if (daysSinceActive > 180) {
        score -= 0.4;
      }
    }
    
    // Following/followers ratio
    if (follower.following > 0 && follower.followers > 0) {
      const ratio = follower.following / follower.followers;
      if (ratio > 10) { // Following way more than followers
        score -= 0.3;
      }
    }
    
    return Math.max(0, score);
  }

  private calculateNetworkScore(follower: any): number {
    let score = 1.0;
    
    // Extreme following/followers numbers
    if (follower.following > 5000 && follower.followers < 100) {
      score -= 0.5;
    }
    
    // Following too many accounts
    if (follower.following > 7500) {
      score -= 0.3;
    }
    
    // Account created in suspicious time clusters
    if (this.isCreatedInSuspiciousCluster(follower.createdAt)) {
      score -= 0.4;
    }
    
    return Math.max(0, score);
  }

  private hasSuspiciousUsername(username: string): boolean {
    return this.BOT_USERNAME_PATTERNS.some(pattern => pattern.test(username));
  }

  private namesAreTooSimilar(name: string, username: string): boolean {
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    const cleanUsername = username.toLowerCase().replace(/[^a-z]/g, '');
    return cleanName === cleanUsername;
  }

  private containsSuspiciousKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.SUSPICIOUS_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }

  private getAccountAgeMonths(createdAt: Date): number {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  private getDaysSince(date: Date): number {
    const now = new Date();
    const target = new Date(date);
    const diffTime = Math.abs(now.getTime() - target.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private isCreatedInSuspiciousCluster(createdAt: Date): boolean {
    // Check if account was created during known bot creation periods
    // This would use historical data in a real implementation
    const created = new Date(createdAt);
    const hour = created.getHours();
    const minute = created.getMinutes();
    
    // Suspicious if created at exact hour intervals (bot-like behavior)
    return minute === 0 && hour % 2 === 0;
  }

  private analyzeBotIndicators(profileScores: ProfileScore[]): BotIndicator[] {
    const indicators: BotIndicator[] = [];
    
    // Profile incomplete indicator
    const incompleteProfiles = profileScores.filter(p => p.profileScore < 0.5);
    if (incompleteProfiles.length > 0) {
      indicators.push({
        type: 'profile_incomplete',
        count: incompleteProfiles.length,
        percentage: (incompleteProfiles.length / profileScores.length) * 100,
        examples: incompleteProfiles.slice(0, 5).map(p => p.username)
      });
    }
    
    // Username pattern indicator
    const suspiciousUsernames = profileScores.filter(p => 
      this.hasSuspiciousUsername(p.username)
    );
    if (suspiciousUsernames.length > 0) {
      indicators.push({
        type: 'username_pattern',
        count: suspiciousUsernames.length,
        percentage: (suspiciousUsernames.length / profileScores.length) * 100,
        examples: suspiciousUsernames.slice(0, 5).map(p => p.username)
      });
    }
    
    // Low activity indicator
    const lowActivityProfiles = profileScores.filter(p => p.activityScore < 0.3);
    if (lowActivityProfiles.length > 0) {
      indicators.push({
        type: 'activity_pattern',
        count: lowActivityProfiles.length,
        percentage: (lowActivityProfiles.length / profileScores.length) * 100,
        examples: lowActivityProfiles.slice(0, 5).map(p => p.username)
      });
    }
    
    return indicators;
  }

  private identifyRedFlags(profileScores: ProfileScore[]): RedFlag[] {
    const redFlags: RedFlag[] = [];
    
    const fakePercentage = (profileScores.filter(p => p.isFake).length / profileScores.length) * 100;
    
    if (fakePercentage > 50) {
      redFlags.push({
        type: 'high_fake_percentage',
        description: `${fakePercentage.toFixed(1)}% of followers appear to be fake`,
        severity: Severity.CRITICAL,
        count: profileScores.filter(p => p.isFake).length
      });
    } else if (fakePercentage > 20) {
      redFlags.push({
        type: 'moderate_fake_percentage',
        description: `${fakePercentage.toFixed(1)}% of followers appear to be fake`,
        severity: Severity.HIGH,
        count: profileScores.filter(p => p.isFake).length
      });
    }
    
    // Check for sudden follower spikes (would need historical data)
    // This is a simplified check
    const recentFollowers = profileScores.filter(p => {
      // Simulate recent followers
      return Math.random() < 0.1; // 10% are "recent"
    });
    
    if (recentFollowers.length > profileScores.length * 0.3) {
      redFlags.push({
        type: 'sudden_follower_spike',
        description: 'Unusual increase in followers detected',
        severity: Severity.HIGH,
        count: recentFollowers.length
      });
    }
    
    return redFlags;
  }

  private calculateConfidence(sampleSize: number, fakePercentage: number): number {
    // Confidence increases with sample size and decreases with extreme percentages
    let confidence = Math.min(sampleSize / 1000, 1.0); // Max confidence at 1000+ samples
    
    // Reduce confidence for extreme percentages (might be false positives/negatives)
    if (fakePercentage > 80 || fakePercentage < 5) {
      confidence *= 0.8;
    }
    
    return Math.max(0.5, confidence); // Minimum 50% confidence
  }

  private generateMockFollowers(count: number): any[] {
    const followers = [];
    
    for (let i = 0; i < count; i++) {
      const isFake = Math.random() < 0.15; // 15% fake followers
      
      followers.push({
        id: `follower_${i}`,
        username: isFake ? this.generateBotUsername() : this.generateRealUsername(),
        name: isFake ? '' : `User ${i}`,
        profilePicture: isFake && Math.random() < 0.7 ? 'default.jpg' : 'profile.jpg',
        bio: isFake && Math.random() < 0.8 ? '' : 'Real user bio here',
        postCount: isFake ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 50) + 1,
        followers: Math.floor(Math.random() * 1000),
        following: isFake ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 500),
        createdAt: this.generateCreationDate(isFake),
        lastActive: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      });
    }
    
    return followers;
  }

  private generateBotUsername(): string {
    const patterns = [
      () => `user${Math.floor(Math.random() * 10000)}`,
      () => `${this.randomString(5)}${Math.floor(Math.random() * 1000)}`,
      () => `${this.randomString(3)}_${Math.floor(Math.random() * 1000)}`
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  private generateRealUsername(): string {
    const names = ['alex', 'sam', 'jordan', 'casey', 'taylor', 'morgan'];
    const name = names[Math.floor(Math.random() * names.length)];
    const suffix = Math.random() < 0.3 ? Math.floor(Math.random() * 100) : '';
    return `${name}${suffix}`;
  }

  private randomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateCreationDate(isFake: boolean): Date {
    const now = new Date();
    if (isFake && Math.random() < 0.3) {
      // Some fake accounts created in suspicious clusters
      const hoursAgo = Math.floor(Math.random() * 24);
      return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    } else {
      // Random date in the past 3 years
      const daysAgo = Math.floor(Math.random() * 1095);
      return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    }
  }
}