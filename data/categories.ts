export const categories = [
  {
    id: 'cse',
    name: 'Computer Science',
    parentId: null,
    type: 'major',
    image: 'https://img.icons8.com/color/480/source-code.png' // Placeholder image
  },
  {
    id: 'web-dev',
    name: 'Web Development',
    parentId: 'cse',
    type: 'sub',
  },
  {
    id: 'cyber-security',
    name: 'Cyber Security',
    parentId: 'cse',
    type: 'sub',
  },
  {
    id: 'android',
    name: 'Android Development',
    parentId: 'cse',
    type: 'sub',
  },
  {
    id: 'embedded',
    name: 'Embedded Systems',
    parentId: 'cse',
    type: 'sub',
  },
  {
    id: 'react',
    name: 'React Native',
    parentId: 'web-dev',
    type: 'niche',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    parentId: 'web-dev',
    type: 'niche',
  },
  {
    id: 'bug-bounty',
    name: 'Bug Bounty',
    parentId: 'cyber-security',
    type: 'niche',
  },
  {
    id: 'malware',
    name: 'Malware Analysis',
    parentId: 'cyber-security',
    type: 'niche',
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    parentId: 'android',
    type: 'niche',
  },
   {
    id: 'arduino',
    name: 'Arduino',
    parentId: 'embedded',
    type: 'niche',
  }
];
