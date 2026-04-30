export const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biochemistry',
  'Microbiology',
  'Industrial Chemistry',
  'Physics',
  'Mathematics',
  'Statistics',
  'Accounting',
  'Business Administration',
  'Economics',
  'Mass Communication',
  'English & Literary Studies',
  'History & International Relations',
  'Political Science',
  'Sociology',
  'Psychology',
  'Nursing Science',
  'Public Health',
  'Anatomy',
  'Physiology',
  'Pharmacology',
  'Law',
  'Agricultural Science',
  'Environmental Science',
];

export const LEVELS = ['100L', '200L', '300L', '400L', '500L'];

export const NIGERIAN_LOCATIONS = [
  'Remote',
  'Lagos',
  'Abuja',
  'Ibadan',
  'Port Harcourt',
  'Enugu',
  'Kano',
  'Benin City',
  'Ede',
  'Abeokuta',
  'Kaduna',
  'Jos',
  'Warri',
  'Calabar',
  'Uyo',
];

export const INTERNSHIP_CATEGORIES = [
  'All',
  'Developer',
  'UI/UX',
  'Data',
  'Marketing',
  'Accounting',
  'Engineering',
  'Media',
  'Health',
  'Education',
];

export const SKILLS_LIST = [
  'JavaScript',
  'TypeScript',
  'React Native',
  'Flutter',
  'Python',
  'Data Analysis',
  'Machine Learning',
  'UI/UX Design',
  'Figma',
  'AutoCAD',
  'Microsoft Office',
  'Excel',
  'Communication',
  'Leadership',
  'Problem Solving',
  'Teamwork',
  'Project Management',
  'Content Writing',
  'Digital Marketing',
  'Social Media',
  'Accounting',
  'Finance',
  'Research',
  'Presentation',
  'SQL',
  'Java',
  'C++',
  'Node.js',
  'PHP',
];

export const MATRIC_REGEX = /^RUN\/[A-Z]+\/\d{2}\/\d{5}$/;

export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG')}`;
};

export const formatNairaRange = (min: number, max: number): string => {
  return `₦${min.toLocaleString('en-NG')} – ₦${max.toLocaleString('en-NG')}`;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
