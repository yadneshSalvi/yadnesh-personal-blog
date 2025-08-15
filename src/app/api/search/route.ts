import { NextRequest, NextResponse } from 'next/server';
import { search, getAutocomplete, getAllTags, getSearchStats, getRecentPosts, getPopularTags } from '@/lib/search';
import { SearchOptions } from '@/lib/search/types';

// Rate limiting (simple in-memory implementation)
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'search';
    
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    switch (action) {
      case 'search': {
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '10');
        const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
        const sortBy = (searchParams.get('sortBy') as 'relevance' | 'date' | 'title') || 'relevance';
        const fromDate = searchParams.get('from') || undefined;
        const toDate = searchParams.get('to') || undefined;

        // Validate parameters
        if (limit > 50) {
          return NextResponse.json(
            { error: 'Limit cannot exceed 50 results' },
            { status: 400 }
          );
        }

        if (query.length > 100) {
          return NextResponse.json(
            { error: 'Query too long. Maximum 100 characters allowed.' },
            { status: 400 }
          );
        }

        const searchOptions: SearchOptions = {
          query,
          limit,
          tags: tags.length > 0 ? tags : undefined,
          sortBy,
          dateRange: fromDate || toDate ? { from: fromDate, to: toDate } : undefined,
        };

        const results = await search(searchOptions);
        
        // Add CORS headers for client-side requests
        const response = NextResponse.json(results);
        response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
        return response;
      }

      case 'autocomplete': {
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '5');

        if (query.length < 2) {
          return NextResponse.json({ suggestions: [] });
        }

        if (query.length > 50) {
          return NextResponse.json(
            { error: 'Query too long for autocomplete' },
            { status: 400 }
          );
        }

        const suggestions = await getAutocomplete(query, Math.min(limit, 10));
        
        const response = NextResponse.json({ suggestions });
        response.headers.set('Cache-Control', 'public, max-age=600'); // 10 minutes cache
        return response;
      }

      case 'tags': {
        const tags = await getAllTags();
        
        const response = NextResponse.json({ tags });
        response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
        return response;
      }

      case 'popular-tags': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const popularTags = await getPopularTags(Math.min(limit, 20));
        
        const response = NextResponse.json({ tags: popularTags });
        response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
        return response;
      }

      case 'stats': {
        const stats = await getSearchStats();
        
        const response = NextResponse.json(stats);
        response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
        return response;
      }

      case 'recent': {
        const limit = parseInt(searchParams.get('limit') || '5');
        const recentPosts = await getRecentPosts(Math.min(limit, 10));
        
        const response = NextResponse.json({ posts: recentPosts });
        response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
        return response;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// Handle POST requests for more complex search queries
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'search': {
        const searchOptions: SearchOptions = {
          query: params.query || '',
          limit: Math.min(params.limit || 10, 50),
          tags: params.tags,
          sortBy: params.sortBy || 'relevance',
          dateRange: params.dateRange,
        };

        // Validate query
        if (searchOptions.query.length > 100) {
          return NextResponse.json(
            { error: 'Query too long. Maximum 100 characters allowed.' },
            { status: 400 }
          );
        }

        const results = await search(searchOptions);
        
        const response = NextResponse.json(results);
        response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
        return response;
      }

      case 'batch-autocomplete': {
        const queries = params.queries || [];
        
        if (!Array.isArray(queries) || queries.length > 5) {
          return NextResponse.json(
            { error: 'Invalid queries array. Maximum 5 queries allowed.' },
            { status: 400 }
          );
        }

        const results = await Promise.all(
          queries.map(async (query: string) => ({
            query,
            suggestions: await getAutocomplete(query, 5),
          }))
        );

        const response = NextResponse.json({ results });
        response.headers.set('Cache-Control', 'public, max-age=600'); // 10 minutes cache
        return response;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Search API POST error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
