import { Assignment, ChatMessage, Course } from './types';

export const COURSES: Course[] = [
  { id: '1', name: 'Database Systems', code: 'CS 301', color: 'from-blue-500 to-indigo-600' },
  { id: '2', name: 'Machine Learning', code: 'CS 421', color: 'from-purple-500 to-pink-600' },
  { id: '3', name: 'Software Architecture', code: 'SWE 310', color: 'from-emerald-500 to-teal-600' },
  { id: '4', name: 'Linear Algebra', code: 'MATH 201', color: 'from-amber-500 to-orange-600' },
  { id: '5', name: 'Operating Systems', code: 'CS 330', color: 'from-rose-500 to-red-600' },
  { id: '6', name: 'Modern Philosophy', code: 'HUM 102', color: 'from-cyan-500 to-blue-600' }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asgn-1',
    title: 'Project Stage 3: Schema Implementation & Optimization',
    description: 'Implement the database schema designed in Stage 2. Write and optimize complex SQL queries including JOINs, subqueries, and indexes. Provide a benchmark analysis showing execution times before and after index optimization.',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    course: 'Database Systems',
    courseCode: 'CS 301',
    estimatedEffort: 6,
    completed: false,
    progress: 25,
    risk: 'high',
    priority: 'high',
    suggestedNextStep: 'Write query benchmarks and create secondary indexes.',
    aiInsight: 'Your DB Project is due in 48 hours and typically takes students 6+ hours to optimize. Start tonight to avoid index compilation issues.',
    aiStudyPlan: [
      'Day 1: Setup Docker containers, import test datasets, and run raw unindexed query tests.',
      'Day 2: Identify bottlenecks with EXPLAIN ANALYZE, implement clustered and non-clustered indexes.',
      'Day 3: Write the benchmarking report and submit the schema and SQL files.'
    ]
  },
  {
    id: 'asgn-2',
    title: 'Midterm Prep & Practice Sets',
    description: 'Solve the complete practice sets covering Vector Spaces, Orthogonality, Eigenvalues, and Singular Value Decomposition. Review homework assignments 1 to 4.',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day from now
    course: 'Linear Algebra',
    courseCode: 'MATH 201',
    estimatedEffort: 4,
    completed: false,
    progress: 10,
    risk: 'high',
    priority: 'high',
    suggestedNextStep: 'Solve SVD and Eigenvalues section from the practice questions.',
    aiInsight: 'This exam is weighted at 25% of your final grade. Complete the 3 high-probability questions recommended by Classroom Zero.',
    aiStudyPlan: [
      'Tonight: Focused review of Orthogonality and Projection matrices (1.5h).',
      'Tomorrow Morning: SVD practice problem worksheet (1.5h).',
      '1 Hour Before Exam: Cheat-sheet summary active recall session (1h).'
    ]
  },
  {
    id: 'asgn-3',
    title: 'Problem Set 4: Backpropagation & Neural Nets',
    description: 'Derive the gradient update rules for a 3-layer neural network using cross-entropy loss. Implement the backpropagation algorithm from scratch in NumPy and train it on the MNIST handwritten digit dataset.',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
    course: 'Machine Learning',
    courseCode: 'CS 421',
    estimatedEffort: 8,
    completed: false,
    progress: 0,
    risk: 'medium',
    priority: 'high',
    suggestedNextStep: 'Derive the partial derivatives mathematically before starting the code.',
    aiInsight: 'You have not started yet. Neural net mathematical derivations are notorious for tricky off-by-one matrix dimensions.',
    aiStudyPlan: [
      'Day 1: Complete backpropagation mathematical derivations on paper (2 hours).',
      'Day 2: Write basic feedforward code and verify matrix dimension alignments (2 hours).',
      'Day 3: Implement gradient updates, loss tracking, and train on MNIST dataset (3 hours).',
      'Day 4: Run parameter tuning (learning rate, batch size) and compile PDF report (1 hour).'
    ]
  },
  {
    id: 'asgn-4',
    title: 'Lab 3: Virtual Memory Management',
    description: 'Implement a user-level virtual memory page replacement simulator. Support FIFO, LRU, and Optimal page replacement algorithms. Handle page faults, physical memory frame allocation, and dirty page writeback simulation.',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    course: 'Operating Systems',
    courseCode: 'CS 330',
    estimatedEffort: 7,
    completed: false,
    progress: 40,
    risk: 'medium',
    priority: 'medium',
    suggestedNextStep: 'Implement the LRU page replacement algorithm state logic.',
    aiInsight: 'Your code compiles, but double-free issues are common when simulating frame allocations. Review segment allocation logic.',
    aiStudyPlan: [
      'Day 1: Design data structures for page tables and free frame lists (Completed).',
      'Day 2: Implement FIFO and basic frame tracking modules (In progress).',
      'Day 3: Implement the LRU stack and list-based algorithms (2 hours).',
      'Day 4: Implement the optimal (clairvoyant) replacement strategy (2 hours).',
      'Day 5: Extensive test scenarios and benchmark memory efficiency graphs (1.5 hours).'
    ]
  },
  {
    id: 'asgn-5',
    title: 'Case Study: Microservices vs Monolith Architecture',
    description: 'Read the architectural case study for a high-traffic e-commerce platform. Write a comprehensive report analyzing the trade-offs of refactoring their legacy monolith into distributed microservices. Address data consistency, network latency, and deployment complexity.',
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 8 days from now
    course: 'Software Architecture',
    courseCode: 'SWE 310',
    estimatedEffort: 3,
    completed: false,
    progress: 60,
    risk: 'low',
    priority: 'low',
    suggestedNextStep: 'Write the section on Saga pattern for distributed transactions.',
    aiInsight: 'You are in excellent shape. Completed over half of the essay. Spend 1 hour tomorrow summarizing transaction patterns.',
    aiStudyPlan: [
      'Day 1: Read paper and construct comparison tables (Completed).',
      'Day 2: Draft microservice trade-offs and network latency concerns (Completed).',
      'Day 3: Write transaction models section (Saga, 2PC) and wrap up draft (1 hour).',
      'Day 4: Self-review and export submission (0.5 hour).'
    ]
  },
  {
    id: 'asgn-6',
    title: 'Essay: Rationalism vs Empiricism',
    description: 'Write a 1500-word essay comparing Descarte’s rationalism with John Locke’s empiricism. Critically evaluate their claims on innate ideas and primary vs secondary qualities.',
    dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 11 days from now
    course: 'Modern Philosophy',
    courseCode: 'HUM 102',
    estimatedEffort: 4,
    completed: true,
    progress: 100,
    risk: 'low',
    priority: 'low',
    suggestedNextStep: 'Submitted! No action needed.',
    aiInsight: 'Congratulations! This assignment was submitted early, giving you extra buffer time for Linear Algebra.',
    aiStudyPlan: []
  }
];

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'gemini',
    text: "Hi! I am your Classroom Zero AI companion. I constantly parse your coursework, predict risks, and compile study blocks. What can I help you with today? I can break down Operating Systems, write sample database queries, or create a study timeline.",
    timestamp: '09:00 AM'
  },
  {
    id: 'msg-2',
    sender: 'student',
    text: "Can you help me understand how John Locke's primary and secondary qualities differ for my philosophy essay?",
    timestamp: '09:02 AM'
  },
  {
    id: 'msg-3',
    sender: 'gemini',
    text: "Absolutely! John Locke separates qualities into two distinct kinds:\n\n1. **Primary Qualities**: These are intrinsic properties of an object that exist independently of any observer. Examples include *solidity, extension, figure, motion, and number*. No matter who looks at an apple, its bulk and shape remain unchanged.\n\n2. **Secondary Qualities**: These are not in the object themselves, but are powers to produce sensations in us through our senses. Examples include *colors, sounds, tastes, and smells*. They depend on our sensory organs.\n\n*Classroom Zero Tip*: For your essay, focus on Descartes' counter-claim that we can only trust rational, mathematical truths (which align with Locke's primary qualities) and that secondary qualities are deceptive.",
    timestamp: '09:03 AM'
  },
  {
    id: 'msg-4',
    sender: 'student',
    text: "Thanks, that is really clear! What about my Linear Algebra exam? I am feeling stressed.",
    timestamp: '09:10 AM'
  },
  {
    id: 'msg-5',
    sender: 'gemini',
    text: "I completely understand! Linear Algebra is highly conceptual, but highly predictable. According to your coursework, your **Midterm is in 24 hours** and we estimate you need about 4 hours of study. \n\nI have created a condensed **Emergency Mode Plan** for you:\n- **Topic 1**: Orthogonal Projections and Least Squares (40% probability of appearing).\n- **Topic 2**: Eigenvalues and Eigenvectors computation.\n- **Topic 3**: Singular Value Decomposition (SVD) formula applications.\n\nWould you like me to generate a 3-step practice quiz for Orthogonal Projections right now?",
    timestamp: '09:12 AM'
  }
];
