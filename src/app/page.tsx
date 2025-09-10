'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessage(`Post created! ID: ${data.id}${data.fbPostId ? `, FB Post ID: ${data.fbPostId}` : ''}`);
      setTitle('');
      setContent('');
      fetchPosts();
    } else {
      const error = await res.json();
      setMessage(`Error: ${error.error}`);
    }

    setLoading(false);
  };

  return (
    <main className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">National Portal Bangladesh - Blog</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Post Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Post Content (supports emojis!)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Post (Website + FB Page)'}
            </Button>
          </form>
          {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
        </CardContent>
      </Card>

      <h2 className="text-2xl font-semibold mb-4">Recent Posts</h2>
      {posts.length === 0 ? (
        <p>No posts yet. Create one above!</p>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="mb-4">
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
            </CardHeader>
            <CardContent>
              <p>{post.content}</p>
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}