import React, { useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  titleJp: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Art of Minimalism in Code',
    titleJp: 'コードにおけるミニマリズムの芸術',
    date: '2024.12.20',
    excerpt: 'Exploring how less can be more when writing elegant, maintainable software.',
    content: `In the world of software development, there's a constant tension between adding features and maintaining simplicity. The best code often isn't the most clever—it's the most clear.

Minimalism in code means:
- Writing only what's necessary
- Choosing clarity over cleverness  
- Embracing constraints as creative catalysts

When we strip away the unnecessary, what remains is pure intention.`,
    tags: ['Philosophy', 'Clean Code'],
  },
  {
    id: '2',
    title: 'Building with React and TypeScript',
    titleJp: 'ReactとTypeScriptで構築する',
    date: '2024.12.15',
    excerpt: 'A journey through type-safe component architecture and modern patterns.',
    content: `TypeScript transforms React development from a guessing game into a conversation with your code. Types become documentation, and the compiler becomes your pair programmer.

Key insights:
- Generic components unlock reusability
- Discriminated unions model complex state
- Strict mode catches bugs before users do

The initial investment pays dividends in confidence and velocity.`,
    tags: ['React', 'TypeScript'],
  },
  {
    id: '3',
    title: 'On Digital Gardens',
    titleJp: 'デジタルガーデンについて',
    date: '2024.12.10',
    excerpt: 'Why I chose to cultivate ideas rather than publish posts.',
    content: `A digital garden is not a blog. It's a space for ideas to grow, connect, and evolve over time. Unlike the chronological tyranny of traditional blogs, gardens embrace non-linearity.

Seeds become saplings become trees. Some wither. That's okay.

The garden metaphor reminds us that knowledge is organic, interconnected, and always in flux.`,
    tags: ['Writing', 'PKM'],
  },
  {
    id: '4',
    title: 'Wabi-Sabi in Interface Design',
    titleJp: '侘び寂びとインターフェースデザイン',
    date: '2024.12.05',
    excerpt: 'Finding beauty in imperfection and transience within digital experiences.',
    content: `Wabi-sabi teaches us to appreciate the imperfect, impermanent, and incomplete. How might this ancient aesthetic philosophy inform modern interface design?

Consider:
- Embracing whitespace as breathing room
- Allowing asymmetry to create visual interest
- Designing for graceful degradation

Perfection is not the goal. Authenticity is.`,
    tags: ['Design', 'Philosophy'],
  },
];

export const Blog: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (selectedPost) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 md:px-12 pt-32 pb-20">
        <button
          onClick={() => setSelectedPost(null)}
          className="mb-12 text-sm text-saka-highlight/60 hover:text-saka-highlight transition-colors duration-300 flex items-center gap-2"
        >
          <span>←</span>
          <span className="tracking-widest">Back to writings</span>
        </button>

        <article>
          <header className="mb-12">
            <time className="text-sm text-saka-highlight/50 tracking-widest">{selectedPost.date}</time>
            <h1 className="text-2xl md:text-4xl font-light text-saka-ink/90 mt-3 mb-2 tracking-wide">
              {selectedPost.title}
            </h1>
            <p className="text-base text-saka-highlight/60 tracking-wider">{selectedPost.titleJp}</p>
            <div className="flex gap-3 mt-6">
              {selectedPost.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-saka-highlight/10 text-saka-highlight/70">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 h-px w-24 bg-saka-highlight/30" />
          </header>

          <div className="prose prose-lg max-w-none">
            {selectedPost.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-saka-ink/70 leading-loose mb-6 font-light">
                {paragraph}
              </p>
            ))}
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
        <p className="text-sm text-saka-highlight/50 tracking-wider">随筆 · Essays</p>
        <div className="mt-6 h-px w-16 bg-saka-highlight/30" />
      </header>

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
                <time className="text-xs text-saka-highlight/40 tracking-widest">{post.date}</time>
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-saka-highlight/40 tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <h2 className="text-lg md:text-xl font-light text-saka-ink/80 mb-1 tracking-wide group-hover:text-saka-ink transition-colors duration-300">
                《{post.title}》
              </h2>
              
              <p className={`text-sm text-saka-highlight/50 tracking-wider transition-all duration-500 ${hoveredId === post.id ? 'opacity-100' : 'opacity-60'}`}>
                {post.titleJp}
              </p>
              
              <p className={`mt-3 text-sm text-saka-ink/60 leading-relaxed max-w-2xl transition-all duration-500 overflow-hidden ${hoveredId === post.id ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                {post.excerpt}
              </p>
              
              <div className={`mt-4 h-px bg-saka-highlight/20 transition-all duration-500 ${hoveredId === post.id ? 'w-full' : 'w-0'}`} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
