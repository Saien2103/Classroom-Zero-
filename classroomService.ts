import { Assignment } from './types';

interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  courseState?: string;
  descriptionHeading?: string;
}

interface ClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  state?: string;
  dueDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  dueTime?: {
    hours?: number;
    minutes?: number;
  };
  alternateLink?: string;
}

interface StudentSubmission {
  id: string;
  courseWorkId: string;
  state?: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT';
}

function parseClassroomDate(
  dueDate?: { year?: number; month?: number; day?: number },
  dueTime?: { hours?: number; minutes?: number }
): string {
  if (!dueDate || !dueDate.year || !dueDate.month || !dueDate.day) {
    // Fallback: 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }
  
  const monthStr = String(dueDate.month).padStart(2, '0');
  const dayStr = String(dueDate.day).padStart(2, '0');
  return `${dueDate.year}-${monthStr}-${dayStr}`;
}

export async function fetchClassroomData(accessToken: string): Promise<Assignment[]> {
  try {
    // 1. Fetch courses
    const coursesRes = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!coursesRes.ok) {
      throw new Error(`Failed to fetch Classroom courses: ${coursesRes.statusText}`);
    }
    
    const coursesData = await coursesRes.json();
    const coursesList: ClassroomCourse[] = coursesData.courses || [];
    
    if (coursesList.length === 0) {
      return [];
    }
    
    const allAssignments: Assignment[] = [];

    // Fetch coursework and submissions in parallel for active courses
    await Promise.all(
      coursesList.map(async (course) => {
        try {
          const courseWorkRes = await fetch(
            `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          
          if (!courseWorkRes.ok) {
            console.warn(`Could not fetch coursework for course ${course.name}`);
            return;
          }
          
          const courseworkData = await courseWorkRes.json();
          const courseworkList: ClassroomCourseWork[] = courseworkData.courseWork || [];
          
          if (courseworkList.length === 0) {
            return;
          }

          // Fetch submissions for this course's coursework
          // Standard endpoint returns all submissions of the user for this course:
          // GET https://classroom.googleapis.com/v1/courses/{courseId}/courseWork/-/studentSubmissions?userId=me
          const submissionsRes = await fetch(
            `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/-/studentSubmissions?userId=me`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          let submissionMap: { [courseWorkId: string]: StudentSubmission } = {};
          if (submissionsRes.ok) {
            const subsData = await submissionsRes.json();
            const subsList: StudentSubmission[] = subsData.studentSubmissions || [];
            subsList.forEach((sub) => {
              submissionMap[sub.courseWorkId] = sub;
            });
          }

          // Map to assignments
          courseworkList.forEach((work) => {
            const sub = submissionMap[work.id];
            const isCompleted = sub ? (sub.state === 'TURNED_IN' || sub.state === 'RETURNED') : false;
            
            // Extract a realistic course code if section is missing (e.g. from course name)
            let courseCode = course.section || '';
            if (!courseCode && course.name) {
              const match = course.name.match(/[A-Z]{2,4}\s?\d{3}/i);
              if (match) {
                courseCode = match[0].toUpperCase();
              } else {
                courseCode = course.name.substring(0, 7).toUpperCase();
              }
            }

            allAssignments.push({
              id: `classroom-${work.id}`,
              title: work.title,
              description: work.description || 'No additional classroom description provided.',
              dueDate: parseClassroomDate(work.dueDate, work.dueTime),
              course: course.name,
              courseCode: courseCode || 'CLASS',
              estimatedEffort: 3, // Initial default
              completed: isCompleted,
              progress: isCompleted ? 100 : 0,
              risk: 'medium', // Initial default
              priority: 'medium', // Initial default
              suggestedNextStep: 'Imported from Google Classroom. Preparing for AI analysis...'
            });
          });

        } catch (err) {
          console.error(`Error processing course ${course.name}:`, err);
        }
      })
    );

    return allAssignments;
  } catch (error) {
    console.error('Error in fetchClassroomData:', error);
    throw error;
  }
}
