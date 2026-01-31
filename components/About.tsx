import { GitHubCalendar } from 'react-github-calendar';

interface TimelineItem {
  title: string;
  subtitle: string;
  location: string;
  duration: string;
  type?: string;
}

const experiences: TimelineItem[] = [
  {
    title: 'DiDi',
    subtitle: 'Backend Development Engineer',
    location: 'Hangzhou, CN',
    duration: '2026 - Present',
    type: 'Full-time',
  },
];

const workbench = [
  { category: 'Languages', items: ['TypeScript', 'Java', 'Python', 'SQL'] },
  { category: 'Frameworks', items: ['React', 'Next.js', 'Spring Boot', 'Tailwind'] },
  { category: 'Tools', items: ['Git', 'Docker', 'Figma', 'PostgreSQL'] },
];

const projects = [
  {
    title: 'Personal Website',
    desc: 'A digital garden built with React and Tailwind, featuring organic design and interactive elements.',
    link: 'https://github.com/wushixuan238/persional-web',
    tech: 'React · Vite · Tailwind'
  },
  {
    title: 'Ship Management System',
    desc: 'Enterprise-grade backend system for maritime logistics.',
    link: 'https://github.com/wushixuan238',
    tech: 'Java · Spring Boot · MySQL'
  }
];

const education: TimelineItem[] = [
  {
    title: 'Anhui University',
    subtitle: 'M.Eng. in Software Engineering',
    location: 'Hefei, Anhui, CN',
    duration: '2023 - 2026',
  },
  {
    title: 'Anhui University',
    subtitle: 'B.Eng. in Software Engineering',
    location: 'Hefei, Anhui, CN',
    duration: '2019 - 2023',
  },
];

const TimelineCard: React.FC<{ item: TimelineItem; index: number }> = ({ item, index }) => (
  <div
    className="group relative pl-8 pb-10 last:pb-0"
    style={{ animationDelay: `${index * 150}ms` }}
  >
    {/* Timeline line */}
    <div className="absolute left-[3px] top-2 bottom-0 w-px bg-saka-ink/20 group-last:hidden" />

    {/* Timeline dot */}
    <div className="absolute left-0 top-2 w-[7px] h-[7px] rounded-full bg-saka-ink/60 ring-2 ring-saka-ink/20" />

    <div className="transition-all duration-500 group-hover:translate-x-2">
      <h3 className="text-lg md:text-xl font-medium text-saka-ink/90 mb-1">
        {item.title}
      </h3>
      <p className="text-sm md:text-base text-saka-ink/70 italic mb-2">
        {item.subtitle}
      </p>
      <div className="flex flex-wrap gap-3 text-xs md:text-sm text-saka-ink/70">
        {item.type && (
          <span className="px-2 py-0.5 rounded-full bg-saka-ink/10 backdrop-blur-sm">
            {item.type}
          </span>
        )}
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {item.location}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {item.duration}
        </span>
      </div>
    </div>
  </div>
);

interface SectionProps {
  title: string;
  titleJp: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, titleJp, children }) => (
  <div className="mb-12 md:mb-16">
    <div className="mb-6 md:mb-8">
      <h2 className="text-xl md:text-2xl font-light text-saka-ink/80 tracking-widest mb-1">
        {title}
      </h2>
      <span className="text-sm text-saka-ink/50 tracking-wider">{titleJp}</span>
      <div className="mt-3 h-px w-16 bg-saka-ink/20" />
    </div>
    {children}
  </div>
);

export const About: React.FC = () => {
  return (
    <div className="w-full min-h-screen flex flex-col items-center px-8 md:px-20 py-32 animate-fade-in">
      {/* Header */}
      <header className="mb-20 text-center">
        <h1 className="text-3xl md:text-5xl font-light text-saka-ink/90 tracking-wider mb-3">
          About Me
        </h1>
        <p className="text-sm md:text-base text-saka-ink/50 max-w-2xl mx-auto leading-relaxed font-serif italic">
          "The code is the bone, the design is the flesh."
        </p>
        <div className="mt-8 h-px w-24 bg-saka-ink/20 mx-auto" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 max-w-5xl w-full mb-24">
        {/* Left Column: Experience & Education */}
        <div className="space-y-16">
          <Section title="Experience" titleJp="経歴">
            {experiences.map((exp, index) => (
              <TimelineCard key={index} item={exp} index={index} />
            ))}
          </Section>

          <Section title="Education" titleJp="学歴">
            {education.map((edu, index) => (
              <TimelineCard key={index} item={edu} index={index} />
            ))}
          </Section>
        </div>

        {/* Right Column: Workbench & Projects */}
        <div className="space-y-16">
          <Section title="Workbench" titleJp="技能">
            <div className="space-y-8">
              {workbench.map((group) => (
                <div key={group.category}>
                  <h4 className="text-sm font-medium text-saka-ink/60 uppercase tracking-widest mb-3">{group.category}</h4>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-saka-ink/80 font-serif text-lg">
                    {group.items.map(item => (
                      <span key={item} className="relative group cursor-default">
                        <span className="group-hover:text-saka-deep-red transition-colors duration-300">{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Selected Works" titleJp="代表作">
            <div className="space-y-8">
              {projects.map((project, index) => (
                <a
                  key={index}
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group p-6 -mx-6 rounded-xl hover:bg-saka-ink/5 transition-all duration-500"
                >
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-xl font-normal text-saka-ink/90 group-hover:text-saka-deep-red transition-colors">
                      {project.title}
                    </h3>
                    <span className="text-xs text-saka-ink/40 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                  </div>
                  <p className="text-sm text-saka-ink/60 leading-relaxed mb-3 font-serif">
                    {project.desc}
                  </p>
                  <div className="text-xs text-saka-ink/40 tracking-wider font-mono">
                    {project.tech}
                  </div>
                </a>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* GitHub Activity Section */}
      <div className="w-full max-w-4xl mx-auto border-t border-saka-ink/10 pt-20">
        <div className="flex flex-col items-center">
          <h3 className="text-sm text-saka-ink/40 uppercase tracking-[0.2em] mb-8">Code Activity</h3>
          <div className="p-8 rounded-2xl bg-white/30 backdrop-blur-sm border border-saka-ink/5 hover:border-saka-ink/10 transition-colors duration-500 w-full overflow-hidden flex justify-center">
            <GitHubCalendar
              username="wushixuan238"
              colorScheme="light"
              style={{ color: '#2A1B1B' }}
              theme={{
                light: ['#EBE9E4', '#D5D2C8', '#A8A49C', '#787368', '#2A1B1B'],
                dark: ['#EBE9E4', '#D5D2C8', '#A8A49C', '#787368', '#2A1B1B'],
              }}
              fontSize={12}
              blockSize={12}
              blockMargin={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
