import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('Received POST request to create a new post');
  try {
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // 1. Save to local DB
    const post = await prisma.post.create({
      data: { title, content },
    });

    // 2. Post to Facebook Page
    const fbPageId = process.env.FB_PAGE_ID;
    const fbAccessToken = process.env.FB_ACCESS_TOKEN;
    const fbApiVersion = process.env.FB_API_VERSION || '19.0';
    console.log('FB Page ID:', fbPageId);
    console.log('FB Access Token Length:', fbAccessToken ? fbAccessToken.length : 'Missing');
    if (!fbPageId || !fbAccessToken) {
      console.error('Facebook credentials missing');
      return NextResponse.json({ id: post.id, message: 'Post saved locally, but FB failed due to missing credentials' });
    }

    // Dynamically import the fb package and assert as any to bypass TypeScript error
    const FB: any = await import('fb').then((module) => module.default);

    // Set access token for FB SDK
    FB.setAccessToken(fbAccessToken);

    // Prepare the message
    const message = `${title}\n\n${content}`.trim();

    // Post to Facebook using FB.api
    const fbResponse = await new Promise((resolve, reject) => {
      FB.api(
        `/${fbPageId}/feed`,
        'POST',
        { message },
        (response) => {
          if (response.error) {
            console.error('FB Post Error:', response.error);
            reject(new Error(response.error.message));
          } else {
            console.log('FB Post Success:', response);
            resolve(response);
          }
        }
      );
    });

    // Optionally fetch the post ID (if not in initial response)
    const postIdResponse = await new Promise((resolve, reject) => {
      FB.api(
        `/${fbPageId}/feed`,
        'GET',
        { fields: 'id', limit: 1 },
        (response) => {
          if (response.error) reject(new Error(response.error.message));
          else resolve(response);
        }
      );
    });
    const fbPostId = postIdResponse.data[0]?.id;

    return NextResponse.json({ id: post.id, fbPostId });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}