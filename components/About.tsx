import React from 'react';

interface TimelineItem {
  title: string;
  subtitle: string;
  location: string;
  duration: string;
  type?: string;
}

const experiences: TimelineItem[] = [
  {
    title: '云账房',
    subtitle: 'Backend Development Engineer',
    location: 'NanJing, CN',
    duration: '2026 - Present',
    type: 'Full-time',
  },
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
    <div className="absolute left-[3px] top-2 bottom-0 w-px bg-saka-highlight/20 group-last:hidden" />

    {/* Timeline dot */}
    <div className="absolute left-0 top-2 w-[7px] h-[7px] rounded-full bg-saka-highlight/60 ring-2 ring-saka-highlight/20" />

    <div className="transition-all duration-500 group-hover:translate-x-2">
      <h3 className="text-lg md:text-xl font-medium text-saka-ink/90 mb-1">
        {item.title}
      </h3>
      <p className="text-sm md:text-base text-saka-ink/70 italic mb-2">
        {item.subtitle}
      </p>
      <div className="flex flex-wrap gap-3 text-xs md:text-sm text-saka-highlight/70">
        {item.type && (
          <span className="px-2 py-0.5 rounded-full bg-saka-highlight/10 backdrop-blur-sm">
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
      <span className="text-sm text-saka-highlight/50 tracking-wider">{titleJp}</span>
      <div className="mt-3 h-px w-16 bg-saka-highlight/30" />
    </div>
    {children}
  </div>
);

export const About: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-8 md:px-12 pt-32 pb-20">
      {/* Header */}
      <header className="mb-16 md:mb-20 text-center">
        <h1 className="text-3xl md:text-5xl font-light text-saka-ink/90 tracking-wider mb-4">
          About Me
        </h1>
        <p className="text-base md:text-lg text-saka-highlight/70 max-w-2xl mx-auto leading-relaxed font-light">
          私の骨も青いから。
        </p>
        <div className="mt-6 h-px w-24 bg-saka-highlight/30 mx-auto" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Experience Section */}
        {/* <Section title="Experience" titleJp="経験"> */}
        <Section title="Experience">
          {experiences.map((exp, index) => (
            <TimelineCard key={index} item={exp} index={index} />
          ))}
        </Section>

        {/* Education Section */}
        {/* <Section title="Education" titleJp="学歴"> */}
        <Section title="Education">
          {education.map((edu, index) => (
            <TimelineCard key={index} item={edu} index={index} />
          ))}
        </Section>
      </div>

      {/* Interests Section */}
      {/* <Section title="Interests" titleJp="興味"> */}
      <Section title="Interests">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Open Source', icon: '{ }', desc: 'Contributing to React and Node.js ecosystems' },
            { title: 'Hiking', icon: '⛰', desc: 'Exploring trails and reconnecting with nature' },
            { title: 'Guitar', icon: '♪', desc: 'Playing acoustic from rock to indie folk' },
          ].map((interest, index) => (
            <div
              key={index}
              className="group p-6 rounded-lg bg-saka-highlight/5 backdrop-blur-sm border border-saka-highlight/10 hover:border-saka-highlight/30 transition-all duration-500 hover:-translate-y-1"
            >
              <span className="text-2xl mb-3 block opacity-60 group-hover:opacity-100 transition-opacity">
                {interest.icon}
              </span>
              <h3 className="text-base font-medium text-saka-ink/80 mb-2">{interest.title}</h3>
              <p className="text-sm text-saka-highlight/60 leading-relaxed">{interest.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </div >
  );
};
