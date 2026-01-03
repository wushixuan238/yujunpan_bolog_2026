import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
// @ts-ignore
import frontMatter from 'front-matter';

interface BlogPost {
  id: string;
  title: string;
  titleJp: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
}

interface FrontMatterAttributes {
  id: string;
  title: string;
  titleJp: string;
  date: string;
  excerpt: string;
  tags: string[];
}

export const Blog: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = () => {
      const modules = import.meta.glob('./../posts/*.md', { eager: true, as: 'raw' });

      const posts: BlogPost[] = Object.values(modules).map((raw: string) => {
        try {
          const { attributes, body } = frontMatter<FrontMatterAttributes>(raw);
          return {
            id: attributes.id || String(Math.random()),
            title: attributes.title || 'Untitled',
            titleJp: attributes.titleJp || '',
            date: attributes.date || new Date().toISOString(),
            excerpt: attributes.excerpt || '',
            tags: attributes.tags || [],
            content: body,
          };
        } catch (e) {
          console.error('Error parsing frontmatter:', e);
          return null;
        }
      }).filter((post): post is BlogPost => post !== null);

      // Sort by date descending
      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBlogPosts(posts);
    };

    loadPosts();
  }, []);

  if (selectedPost) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 md:px-12 pt-32 pb-20">
        <button
          onClick={() => setSelectedPost(null)}
          className="mb-12 text-sm text-saka-ink/60 hover:text-saka-ink transition-colors duration-300 flex items-center gap-2"
        >
          <span>←</span>
          <span className="tracking-widest">Back to writings</span>
        </button>

        <article>
          <header className="mb-12">
            <time className="text-sm text-saka-ink/50 tracking-widest">{selectedPost.date}</time>
            <h1 className="text-2xl md:text-4xl font-light text-saka-ink/90 mt-3 mb-2 tracking-wide">
              {selectedPost.title}
            </h1>
            <p className="text-base text-saka-ink/60 tracking-wider">{selectedPost.titleJp}</p>
            <div className="flex gap-3 mt-6">
              {selectedPost.tags?.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-saka-ink/5 text-saka-ink/70">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 h-px w-24 bg-saka-ink/20" />
          </header>

          <div className="prose prose-lg max-w-none text-saka-ink/90 leading-loose font-light">
            <Markdown components={{
              p: ({ node, ...props }) => <p className="mb-6" {...props} />
            }}>
              {selectedPost.content}
            </Markdown>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-8 md:px-12 pt-32 pb-20">
      <header className="mb-16 md:mb-20">
        <h1 className="text-3xl md:text-4xl font-light text-saka-ink/90 tracking-wider mb-3">
          Writings
        </h1>
        <p className="text-sm text-saka-ink/50 tracking-wider">随筆 · Essays</p>
        <div className="mt-6 h-px w-16 bg-saka-ink/20" />
      </header>

      {blogPosts.length === 0 && (
        <div className="text-saka-ink/40 text-center mt-20 text-sm tracking-widest">Loading posts or no posts found...</div>
      )}

      <div className="space-y-8">
        {blogPosts.map((post) => (
          <article
            key={post.id}
            onClick={() => setSelectedPost(post)}
            onMouseEnter={() => setHoveredId(post.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group cursor-pointer"
          >
            <div className={`transition-all duration-500 ${hoveredId === post.id ? 'translate-x-4' : ''}`}>
              <div className="flex items-baseline justify-between mb-2">
                <time className="text-xs text-saka-ink/40 tracking-widest">{post.date}</time>
                <div className="flex gap-2">
                  {post.tags?.map((tag) => (
                    <span key={tag} className="text-[10px] text-saka-ink/40 tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h2 className="text-lg md:text-xl font-light text-saka-ink/80 mb-1 tracking-wide group-hover:text-saka-ink transition-colors duration-300">
                《{post.title}》
              </h2>

              <p className={`text-sm text-saka-ink/50 tracking-wider transition-all duration-500 ${hoveredId === post.id ? 'opacity-100' : 'opacity-60'}`}>
                {post.titleJp}
              </p>

              <p className={`mt-3 text-sm text-saka-ink/80 leading-relaxed max-w-2xl transition-all duration-500 overflow-hidden ${hoveredId === post.id ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                {post.excerpt}
              </p>

              <div className={`mt-4 h-px bg-saka-ink/20 transition-all duration-500 ${hoveredId === post.id ? 'w-full' : 'w-0'}`} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
