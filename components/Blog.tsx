import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
// @ts-ignore
import frontMatter from 'front-matter';

type PostCategory = 'tech' | 'life' | 'other';
type FilterCategory = 'all' | PostCategory;

interface BlogPost {
  id: string;
  title: string;
  titleJp: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  category: PostCategory;
  path: string;
}

interface FrontMatterAttributes {
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

  // Filtering State
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    const loadPosts = () => {
      // Import all markdown files from ../posts
      const modules = import.meta.glob('./../posts/**/*.md', { eager: true, query: '?raw', import: 'default' });

      const posts: BlogPost[] = Object.entries(modules).map(([path, raw]: [string, any]) => {
        try {
          const { attributes, body } = frontMatter<FrontMatterAttributes>(raw);

          // Determine category from path
          // Path example: ./../posts/tech/ai/agent/some-post.md
          let category: PostCategory = 'other';
          if (path.includes('/posts/life/')) {
            category = 'life';
          } else if (path.includes('/posts/tech/')) {
            category = 'tech';
          }

          // Robust tag parsing
          let tags = attributes.tags || [];
          if (typeof tags === 'string') {
            // Handle case where tags might be a comma-separated string
            tags = (tags as string).split(',').map(t => t.trim());
          } else if (Array.isArray(tags)) {
            tags = tags.map(t => String(t).trim());
          } else {
            tags = [];
          }

          return {
            // Use path as the ID. It is unique and stable.
            id: path,
            title: attributes.title || 'Untitled',
            titleJp: attributes.titleJp || '',
            date: attributes.date || new Date().toISOString(),
            excerpt: attributes.excerpt || '',
            tags: tags,
            content: body,
            category: category,
            path: path
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

  // -- Filtering Logic --

  // 1. Filter by Category first
  const requestsByCategory = selectedCategory === 'all'
    ? blogPosts
    : blogPosts.filter(post => post.category === selectedCategory);

  // 2. Extract available tags from the *filtered by category* posts
  //    This ensures regular users don't see "Investment" tags when looking at "Tech"
  const availableTags = Array.from(new Set(requestsByCategory.flatMap(post => post.tags || []))).sort();

  // 3. Filter by Tag (if selected)
  //    Reset selectedTag if it's not in the new availableTags?
  //    For better UX, if we switch category, we probably want to reset tag too.
  //    (Handled in category click handler)
  const filteredPosts = selectedTag
    ? requestsByCategory.filter(post => post.tags?.includes(selectedTag))
    : requestsByCategory;

  // Pagination Logic
  const indexOfLastPost = currentPage * POSTS_PER_PAGE;
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

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
            <div className="flex items-center gap-4 mb-3">
              <time className="text-sm text-saka-ink/60 tracking-widest">{selectedPost.date}</time>
              <span className="text-xs uppercase tracking-widest px-2 py-0.5 border border-saka-ink/20 rounded-full text-saka-ink/50">
                {selectedPost.category}
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-normal text-saka-ink mt-3 mb-2 tracking-wide">
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

          <div className="prose prose-lg max-w-none text-saka-ink leading-loose font-normal">
            <Markdown components={{
              p: ({ node, ...props }) => <p className="mb-6 opacity-90" {...props} />
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
      <header className="mb-12 md:mb-16">
        <h1 className="text-3xl md:text-4xl font-light text-saka-ink/90 tracking-wider mb-3">
          Writings
        </h1>
        <p className="text-sm text-saka-ink/50 tracking-wider">随筆 · Essays</p>
        <div className="mt-6 h-px w-16 bg-saka-ink/20" />
      </header>

      {/* Category Switcher */}
      <div className="flex gap-8 mb-10 border-b border-saka-ink/10 pb-4">
        {(['all', 'tech', 'life'] as FilterCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              if (selectedCategory !== cat) {
                setSelectedCategory(cat);
                setSelectedTag(null); // Reset tag when switching category
                setCurrentPage(1);
              }
            }}
            className={`
              text-sm tracking-[0.2em] uppercase transition-all duration-300 relative
              ${selectedCategory === cat
                ? 'text-saka-ink font-normal'
                : 'text-saka-ink/40 hover:text-saka-ink/70 font-light'}
            `}
          >
            {cat}
            {selectedCategory === cat && (
              <span className="absolute -bottom-[17px] left-0 w-full h-px bg-saka-ink/60" />
            )}
          </button>
        ))}
      </div>

      {/* Tag Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-16 justify-start animate-fade-in">
        <button
          onClick={() => {
            setSelectedTag(null);
            setCurrentPage(1);
          }}
          className={`text-xs tracking-widest uppercase transition-all duration-300 px-4 py-2 rounded-full border ${selectedTag === null
            ? 'border-saka-ink/30 text-saka-ink'
            : 'border-transparent text-saka-ink/40 hover:text-saka-ink/70'
            }`}
        >
          All Tags
        </button>
        {availableTags.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setSelectedTag(tag === selectedTag ? null : tag);
              setCurrentPage(1);
            }}
            className={`text-xs tracking-widest uppercase transition-all duration-300 px-4 py-2 rounded-full border ${selectedTag === tag
              ? 'border-saka-ink/30 text-saka-ink'
              : 'border-transparent text-saka-ink/40 hover:text-saka-ink/70'
              }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {currentPosts.length === 0 && (
        <div className="text-saka-ink/40 text-center mt-20 text-sm tracking-widest">
          No posts found...
        </div>
      )}

      <div className="space-y-8">
        {currentPosts.map((post) => (
          <article
            key={post.id}
            onClick={() => setSelectedPost(post)}
            onMouseEnter={() => setHoveredId(post.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group cursor-pointer"
          >
            <div className={`transition-all duration-500 ${hoveredId === post.id ? 'translate-x-4' : ''}`}>
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-center gap-3">
                  <time className="text-xs text-saka-ink/40 tracking-widest">{post.date}</time>
                  <span className="text-[10px] uppercase tracking-wider text-saka-ink/30 border border-saka-ink/10 px-1.5 rounded-sm">
                    {post.category}
                  </span>
                </div>

                <div className="flex gap-2">
                  {post.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] text-saka-ink/40 tracking-wider">
                      {tag}
                    </span>
                  ))}
                  {(post.tags?.length || 0) > 3 && (
                    <span className="text-[10px] text-saka-ink/40 tracking-wider">...</span>
                  )}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-8 mt-20 text-xs tracking-widest text-saka-ink/60">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPage(prev => Math.max(prev - 1, 1));
            }}
            disabled={currentPage === 1}
            className={`transition-colors duration-300 ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-saka-deep-red'}`}
          >
            PREV
          </button>

          <span className="font-mono opacity-50">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPage(prev => Math.min(prev + 1, totalPages));
            }}
            disabled={currentPage === totalPages}
            className={`transition-colors duration-300 ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:text-saka-deep-red'}`}
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  );
};
