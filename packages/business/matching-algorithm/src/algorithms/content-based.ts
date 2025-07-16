import * as natural from 'natural';
import { InfluencerProfile, MatchingCriteria } from '../types';

export class ContentBasedMatching {
  private tfidf: natural.TfIdf;
  private tokenizer: natural.WordTokenizer;

  constructor() {
    this.tfidf = new natural.TfIdf();
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Build content profiles for influencers
   */
  buildProfiles(influencers: InfluencerProfile[]): void {
    influencers.forEach(influencer => {
      const content = this.extractContentFeatures(influencer);
      this.tfidf.addDocument(content);
    });
  }

  /**
   * Match based on content similarity
   */
  match(
    criteria: MatchingCriteria,
    candidates: InfluencerProfile[]
  ): ContentMatchResult[] {
    const queryVector = this.buildQueryVector(criteria);
    
    return candidates.map(candidate => {
      const similarity = this.calculateContentSimilarity(queryVector, candidate);
      const relevance = this.calculateRelevance(criteria, candidate);
      
      return {
        influencerId: candidate.id,
        contentSimilarity: similarity,
        relevance,
        score: (similarity + relevance) / 2
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Extract content features from influencer profile
   */
  private extractContentFeatures(influencer: InfluencerProfile): string {
    const features = [
      ...influencer.categories,
      ...influencer.audienceData.interests,
      ...influencer.contentData.primaryCategories,
      ...influencer.performanceHistory.specialties,
      ...this.extractKeywords(influencer)
    ];

    return features.join(' ');
  }

  /**
   * Build query vector from matching criteria
   */
  private buildQueryVector(criteria: MatchingCriteria): string {
    const features = [
      ...(criteria.preferences.categories || []),
      ...(criteria.campaign?.targetAudience.demographics.interests || []),
      ...(criteria.campaign?.goals.map(g => g.type) || [])
    ];

    return features.join(' ');
  }

  /**
   * Calculate content similarity using TF-IDF
   */
  private calculateContentSimilarity(
    query: string,
    influencer: InfluencerProfile
  ): number {
    const influencerContent = this.extractContentFeatures(influencer);
    
    // Tokenize and calculate similarity
    const queryTokens = this.tokenizer.tokenize(query.toLowerCase());
    const influencerTokens = this.tokenizer.tokenize(influencerContent.toLowerCase());
    
    const intersection = queryTokens.filter(token => influencerTokens.includes(token));
    const union = [...new Set([...queryTokens, ...influencerTokens])];
    
    return intersection.length / union.length;
  }

  /**
   * Calculate relevance based on criteria
   */
  private calculateRelevance(
    criteria: MatchingCriteria,
    influencer: InfluencerProfile
  ): number {
    let relevanceScore = 0;
    let factors = 0;

    // Platform match
    if (criteria.preferences.platforms) {
      const platformMatch = this.calculatePlatformMatch(
        criteria.preferences.platforms,
        influencer.platforms.map(p => p.platform)
      );
      relevanceScore += platformMatch;
      factors++;
    }

    // Location match
    if (criteria.preferences.locations) {
      const locationMatch = this.calculateLocationMatch(
        criteria.preferences.locations,
        influencer.locations
      );
      relevanceScore += locationMatch;
      factors++;
    }

    // Language match
    if (criteria.preferences.languages) {
      const languageMatch = this.calculateLanguageMatch(
        criteria.preferences.languages,
        influencer.languages
      );
      relevanceScore += languageMatch;
      factors++;
    }

    // Category match
    if (criteria.preferences.categories) {
      const categoryMatch = this.calculateCategoryMatch(
        criteria.preferences.categories,
        influencer.categories
      );
      relevanceScore += categoryMatch;
      factors++;
    }

    return factors > 0 ? relevanceScore / factors : 0.5;
  }

  /**
   * Extract keywords from influencer content
   */
  private extractKeywords(influencer: InfluencerProfile): string[] {
    // This would typically use NLP to extract keywords from past content
    // For now, return empty array
    return [];
  }

  /**
   * Calculate platform match score
   */
  private calculatePlatformMatch(required: string[], available: string[]): number {
    const matches = required.filter(platform => available.includes(platform));
    return matches.length / required.length;
  }

  /**
   * Calculate location match score
   */
  private calculateLocationMatch(required: string[], available: string[]): number {
    const matches = required.filter(location => available.includes(location));
    return matches.length > 0 ? 1 : 0;
  }

  /**
   * Calculate language match score
   */
  private calculateLanguageMatch(required: string[], available: string[]): number {
    const matches = required.filter(language => available.includes(language));
    return matches.length / required.length;
  }

  /**
   * Calculate category match score
   */
  private calculateCategoryMatch(required: string[], available: string[]): number {
    const matches = required.filter(category => available.includes(category));
    return matches.length / required.length;
  }
}

interface ContentMatchResult {
  influencerId: string;
  contentSimilarity: number;
  relevance: number;
  score: number;
}