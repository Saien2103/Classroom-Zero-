import React, { useState, useEffect, useRef } from 'react';
import { Assignment, ChatMessage, GuardianInsight } from './types';
import { INITIAL_ASSIGNMENTS, INITIAL_CHAT } from './data';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import AIAssistant from './pages/AIAssistant';
import EmergencyMode from './pages/EmergencyMode';
import AssignmentDetails from './pages/AssignmentDetails';
import Settings from './pages/Settings';
import { initAuth, googleSignIn, logout } from './firebase';
import { fetchClassroomData } from './classroomService';
import { LayoutDashboard, BookOpen, MessageSquare, AlertOctagon, Settings as SettingsIcon } from 'lucide-react';

export default function App() {
  // Load initial state from localStorage or fallback
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('c0_assignments');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('c0_chat');
    return saved ? JSON.parse(saved) : INITIAL_CHAT;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedAsgnId, setSelectedAsgnId] = useState<string | null>(null);
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);
  const [generatingErrors, setGeneratingErrors] = useState<{ [id: string]: string | null }>({});

  // Google Auth & Classroom states
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncingClassroom, setIsSyncingClassroom] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Proactive AI Deadline Guardian States
  const [guardianInsight, setGuardianInsight] = useState<GuardianInsight | null>(() => {
    const saved = localStorage.getItem('c0_guardian_insight');
    return saved ? JSON.parse(saved) : null;
  });
  const [guardianLoading, setGuardianLoading] = useState<boolean>(false);
  const [guardianError, setGuardianError] = useState<string | null>(null);


  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (usr, token) => {
        setUser(usr);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setSyncError(null);
        // Automatically sync Classroom after signing in
        await handleClassroomSync(result.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setSyncError(err.message || 'Google Sign-In failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setAssignments(INITIAL_ASSIGNMENTS);
      localStorage.removeItem('c0_assignments');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const triggerAutoAnalysis = async (list: Assignment[]) => {
    const activeToAnalyze = list.filter(asgn => !asgn.completed);
    
    // Process sequentially to be gentle on Gemini APIs and give real-time updates
    for (const asgn of activeToAnalyze) {
      setGeneratingPlanId(asgn.id);
      try {
        const response = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: asgn.title,
            description: asgn.description,
            dueDate: asgn.dueDate,
            course: asgn.course,
            courseCode: asgn.courseCode
          })
        });

        if (response.ok) {
          const data = await response.json();
          setAssignments(prev =>
            prev.map(item => {
              if (item.id === asgn.id) {
                return {
                  ...item,
                  aiStudyPlan: data.studyPlan,
                  aiEstimatedHours: data.estimatedHours,
                  aiRiskLevel: data.riskLevel,
                  aiRecommendation: data.recommendation,
                  estimatedEffort: data.estimatedHours || item.estimatedEffort,
                  risk: data.riskLevel || item.risk,
                  suggestedNextStep: data.recommendation || item.suggestedNextStep
                };
              }
              return item;
            })
          );
        }
      } catch (err) {
        console.error(`Auto analysis failed for ${asgn.title}:`, err);
      }
    }
    setGeneratingPlanId(null);
  };

  // Proactively run AI Deadline Guardian Analysis
  const analyzeWorkloadWithGuardian = async (currentAssignments: Assignment[]) => {
    setGuardianLoading(true);
    setGuardianError(null);
    try {
      const active = currentAssignments.filter(a => !a.completed);
      const response = await fetch('/api/analyze-deadline-guardian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments: active })
      });

      if (!response.ok) {
        throw new Error(`Deadline Guardian Analysis failed (status: ${response.status})`);
      }

      const data = await response.json();
      setGuardianInsight(data);
      if (data) {
        localStorage.setItem('c0_guardian_insight', JSON.stringify(data));
      } else {
        localStorage.removeItem('c0_guardian_insight');
      }
    } catch (err: any) {
      console.error('Error running AI Deadline Guardian workload scan:', err);
      setGuardianError(err.message || 'An unexpected error occurred during workload analysis.');
    } finally {
      setGuardianLoading(false);
    }
  };

  // Track the active assignments list's active keys and automatically trigger scan
  const activeAssignmentsSummary = assignments
    .filter(a => !a.completed)
    .map(a => `${a.id}-${a.progress}-${a.dueDate}`)
    .join('|');
  const lastActiveSummaryRef = useRef<string | null>(null);

  useEffect(() => {
    // Automatically trigger workload analysis on app start or when the student's active assignments update
    if (activeAssignmentsSummary !== lastActiveSummaryRef.current) {
      lastActiveSummaryRef.current = activeAssignmentsSummary;
      analyzeWorkloadWithGuardian(assignments);
    }
  }, [assignments, activeAssignmentsSummary]);

  const handleClassroomSync = async (tokenToUse?: string) => {
    const activeToken = tokenToUse || accessToken;
    if (!activeToken) {
      setSyncError('Google token expired or not loaded. Please sign in again.');
      return;
    }

    setIsSyncingClassroom(true);
    setSyncError(null);

    try {
      const imported = await fetchClassroomData(activeToken);
      if (imported.length > 0) {
        setAssignments(imported);
        // Instant trigger Deadline Guardian for imported courses
        analyzeWorkloadWithGuardian(imported);
        // Auto trigger Gemini plan generation background tasks
        triggerAutoAnalysis(imported);
      } else {
        setSyncError('No coursework assignments found on your active Google Classroom courses.');
      }
    } catch (err: any) {
      console.error('Classroom Sync Error:', err);
      setSyncError(err.message || 'Failed to sync coursework. Try reconnecting your Google account.');
    } finally {
      setIsSyncingClassroom(false);
    }
  };

  // Persist state to localStorage on modification
  useEffect(() => {
    localStorage.setItem('c0_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('c0_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Compute live high risk counts for badges
  const highRiskCount = assignments.filter(a => a.risk === 'high' && !a.completed).length;

  // Handler: Selecting assignment to inspect details
  const handleSelectAssignment = (id: string) => {
    setSelectedAsgnId(id);
    setActiveTab('details');
  };

  // Handler: Toggling completion status
  const handleToggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssignments(prev =>
      prev.map(asgn => {
        if (asgn.id === id) {
          const nextCompleted = !asgn.completed;
          return {
            ...asgn,
            completed: nextCompleted,
            progress: nextCompleted ? 100 : asgn.progress === 100 ? 50 : asgn.progress,
            suggestedNextStep: nextCompleted ? 'Submitted! No action needed.' : 'Review assignment instructions.'
          };
        }
        return asgn;
      })
    );
  };

  // Handler: Slider progress modification
  const handleUpdateProgress = (id: string, progress: number) => {
    setAssignments(prev =>
      prev.map(asgn => {
        if (asgn.id === id) {
          return {
            ...asgn,
            progress,
            completed: progress === 100,
            suggestedNextStep: progress === 100 ? 'Submitted! No action needed.' : asgn.suggestedNextStep
          };
        }
        return asgn;
      })
    );
  };

  // Handler: Manual add of a new coursework assignment
  const handleAddNewAssignment = (newAsgn: Omit<Assignment, 'id' | 'completed' | 'progress'>) => {
    const newId = `asgn-${Date.now()}`;
    const asgnObj: Assignment = {
      ...newAsgn,
      id: newId,
      completed: false,
      progress: 0,
      aiStudyPlan: []
    };
    setAssignments(prev => [asgnObj, ...prev]);
  };

  // Handler: Generating a study plan
  const handleGeneratePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (generatingPlanId) return;

    setGeneratingPlanId(id);
    setGeneratingErrors(prev => ({ ...prev, [id]: null }));

    const targetAsgn = assignments.find(a => a.id === id);
    if (!targetAsgn) {
      setGeneratingPlanId(null);
      return;
    }

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: targetAsgn.title,
          description: targetAsgn.description,
          dueDate: targetAsgn.dueDate,
          course: targetAsgn.course,
          courseCode: targetAsgn.courseCode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      setAssignments(prev =>
        prev.map(asgn => {
          if (asgn.id === id) {
            return {
              ...asgn,
              aiStudyPlan: data.studyPlan,
              aiEstimatedHours: data.estimatedHours,
              aiRiskLevel: data.riskLevel,
              aiRecommendation: data.recommendation,
              // Update core attributes to match real AI recommendations
              estimatedEffort: data.estimatedHours || asgn.estimatedEffort,
              risk: data.riskLevel || asgn.risk,
              suggestedNextStep: data.recommendation || asgn.suggestedNextStep
            };
          }
          return asgn;
        })
      );
    } catch (err: any) {
      console.error("Failed to generate AI plan:", err);
      setGeneratingErrors(prev => ({ 
        ...prev, 
        [id]: err.message || "An unexpected error occurred while communicating with Gemini." 
      }));
    } finally {
      setGeneratingPlanId(null);
    }
  };

  // Handler: Quick action dashboard recommendation trigger
  const handleQuickActionRecommendation = () => {
    // Open details of the Database systems assignment (asgn-1)
    const dbAsgn = assignments.find(a => a.id === 'asgn-1');
    if (dbAsgn) {
      handleSelectAssignment('asgn-1');
    } else {
      setActiveTab('assignments');
    }
  };

  // Handler: Sending custom/quick student messages in AI Assistant page
  const handleSendMessage = (text: string) => {
    const studentMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, studentMsg]);

    // Simulate smart responder after delay
    setTimeout(() => {
      let gText = "I am processing your query across your Classroom syllabus files. How else can I help simplify your deadline scheduling today?";
      const lower = text.toLowerCase();

      if (lower.includes('database') || lower.includes('cs 301')) {
        gText = "Database Project Stage 3 is heavily weighted! Make sure to write your DDL schema scripts with index constraints first. Doing EXPLAIN ANALYZE will count for 15% of your final grade. Try adding indexes on `user_id` and `timestamp` variables.";
      } else if (lower.includes('backpropagation') || lower.includes('neural')) {
        gText = "Backpropagation applies the calculus Chain Rule backwards! Remember that the error gradient with respect to hidden weights depends on downstream delta errors. Double check your matrix transpose alignments when calculating: `dW = dZ * A_prev.T` in your Numpy code.";
      } else if (lower.includes('math 201') || lower.includes('linear algebra') || lower.includes('study')) {
        gText = "For your MATH 201 Midterm, focus on Orthogonality, Eigenvalues, and SVD! In SVD, recall that `A = U * Sigma * V^T`. Singularity matrices are diagonal and contain square roots of the eigenvalues of `A^T * A`. Try writing down practice derivations for a 2x2 matrix.";
      } else if (lower.includes('lab 3') || lower.includes('operating systems')) {
        gText = "Operating Systems Lab 3 focuses on virtual memory! To implement LRU replacement, use a queue or stack data structure. When a page fault occurs, evict the least recently referenced page descriptor from your tracker.";
      }

      const geminiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'gemini',
        text: gText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, geminiMsg]);
    }, 1000);
  };

  // Determine active title for navbar
  const getNavTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Classroom Zero';
      case 'assignments':
        return 'Assignments Registry';
      case 'assistant':
        return 'AI Study Assistant';
      case 'emergency':
        return 'Crisis Emergency Mode';
      case 'details':
        return 'Assignment Inspect Deck';
      case 'settings':
        return 'Configurations';
      default:
        return 'Classroom Zero';
    }
  };

  // Main navigation switcher
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            assignments={assignments}
            onSelectAssignment={handleSelectAssignment}
            onToggleComplete={handleToggleComplete}
            onGeneratePlan={handleGeneratePlan}
            generatingPlanId={generatingPlanId}
            onQuickActionRecommendation={handleQuickActionRecommendation}
            user={user}
            onClassroomSync={() => handleClassroomSync()}
            isSyncingClassroom={isSyncingClassroom}
            syncError={syncError}
            onLogin={handleLogin}
            guardianLoading={guardianLoading}
            guardianInsight={guardianInsight}
            guardianError={guardianError}
            onTriggerGuardianAnalysis={() => analyzeWorkloadWithGuardian(assignments)}
          />
        );
      case 'assignments':
        return (
          <Assignments
            assignments={assignments}
            onSelectAssignment={handleSelectAssignment}
            onToggleComplete={handleToggleComplete}
            onGeneratePlan={handleGeneratePlan}
            generatingPlanId={generatingPlanId}
            onAddNewAssignment={handleAddNewAssignment}
          />
        );
      case 'assistant':
        return (
          <AIAssistant
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            assignments={assignments}
          />
        );
      case 'emergency':
        return (
          <EmergencyMode
            assignments={assignments}
            onSelectAssignment={handleSelectAssignment}
            onGeneratePlan={handleGeneratePlan}
            generatingPlanId={generatingPlanId}
          />
        );
      case 'details':
        const selectedAsgn = assignments.find(a => a.id === selectedAsgnId);
        if (!selectedAsgn) {
          setActiveTab('dashboard');
          return null;
        }
        return (
          <AssignmentDetails
            assignment={selectedAsgn}
            onBack={() => setActiveTab('assignments')}
            onToggleComplete={handleToggleComplete}
            onGeneratePlan={handleGeneratePlan}
            onUpdateProgress={handleUpdateProgress}
            isGeneratingPlan={generatingPlanId === selectedAsgnId}
            generatingError={selectedAsgnId ? generatingErrors[selectedAsgnId] : null}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <div className="p-8">Page Not Found</div>;
    }
  };

  return (
    <div id="classroom-zero-app" className="min-h-screen bg-[#F8F9FA] text-slate-800 dark:bg-[#202124] dark:text-slate-100 flex font-sans">
      
      {/* Sidebar - Persistent layout - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          activeTab={activeTab === 'details' ? 'assignments' : activeTab}
          setActiveTab={(tab) => {
            setSelectedAsgnId(null);
            setActiveTab(tab);
          }}
          highRiskCount={highRiskCount}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content viewport block */}
      <div className="flex-1 pl-0 md:pl-64 flex flex-col min-h-screen">
        <Navbar title={getNavTitle()} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {renderMainContent()}
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#2D2F31] border-t border-slate-200 dark:border-[#3C4043] flex justify-around items-center h-16 pb-safe shadow-lg">
        <button
          onClick={() => { setSelectedAsgnId(null); setActiveTab('dashboard'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ${activeTab === 'dashboard' ? 'text-google-green dark:text-emerald-400' : ''}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans mt-0.5">Home</span>
        </button>
        <button
          onClick={() => { setSelectedAsgnId(null); setActiveTab('assignments'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ${activeTab === 'assignments' || activeTab === 'details' ? 'text-google-green dark:text-emerald-400' : ''}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans mt-0.5">Assignments</span>
        </button>
        <button
          onClick={() => { setSelectedAsgnId(null); setActiveTab('assistant'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ${activeTab === 'assistant' ? 'text-google-green dark:text-emerald-400' : ''}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans mt-0.5">AI Assistant</span>
        </button>
        <button
          onClick={() => { setSelectedAsgnId(null); setActiveTab('emergency'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ${activeTab === 'emergency' ? 'text-google-green dark:text-emerald-400' : ''}`}
        >
          <AlertOctagon className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans mt-0.5">Emergency</span>
          {highRiskCount > 0 && (
            <span className="absolute top-1.5 right-6 w-2.5 h-2.5 bg-google-red rounded-full ring-2 ring-white dark:ring-[#2D2F31]" />
          )}
        </button>
        <button
          onClick={() => { setSelectedAsgnId(null); setActiveTab('settings'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ${activeTab === 'settings' ? 'text-google-green dark:text-emerald-400' : ''}`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium font-sans mt-0.5">Settings</span>
        </button>
      </nav>

    </div>
  );
}
