export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string or human readable
  course: string;
  courseCode: string;
  estimatedEffort: number; // in hours
  completed: boolean;
  progress: number; // 0 to 100
  risk: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  suggestedNextStep: string;
  aiStudyPlan?: string[]; // Array of study steps/tasks
  aiInsight?: string;
  aiEstimatedHours?: number;
  aiRiskLevel?: 'low' | 'medium' | 'high';
  aiRecommendation?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'gemini';
  text: string;
  timestamp: string;
  relatedAssignmentId?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string; // Tailwind color class name
}

export interface StudyPlanStep {
  day: string;
  task: string;
  duration: string;
  completed: boolean;
}

export interface GuardianInsight {
  firstToStartTitle: string;
  firstToStartId: string;
  priorityReason: string;
  delayRisk: string;
  fullReasoning: string;
}

