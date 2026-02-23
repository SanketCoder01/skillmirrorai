import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, AlertTriangle, Clock, ChevronRight, ChevronLeft, 
  CheckCircle, XCircle, Play, Square, Code, FileText, 
  Shield, Trophy, Loader2, Video, VideoOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Question {
  id: string;
  type: "mcq" | "coding";
  question: string;
  options?: string[];
  correct_answer?: string;
  test_cases?: { input: string; expected_output: string }[];
  language?: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

interface TestState {
  status: "setup" | "ready" | "in_progress" | "completed" | "terminated";
  questions: Question[];
  currentQuestion: number;
  answers: Record<string, string>;
  codingAnswers: Record<string, string>;
  startTime: number | null;
  endTime: number | null;
  warnings: number;
  tabSwitches: number;
  cameraWarnings: number;
  timeRemaining: number;
}

const TEST_DURATION = 90 * 60; // 90 minutes in seconds
const MAX_WARNINGS = 5;
const QUESTIONS_COUNT = 60;

const DashboardSkillTest = () => {
  const [testState, setTestState] = useState<TestState>({
    status: "setup",
    questions: [],
    currentQuestion: 0,
    answers: {},
    codingAnswers: {},
    startTime: null,
    endTime: null,
    warnings: 0,
    tabSwitches: 0,
    cameraWarnings: 0,
    timeRemaining: TEST_DURATION,
  });
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [faceDetected, setFaceDetected] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testId, setTestId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Tab switch detection
  useEffect(() => {
    if (testState.status !== "in_progress") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTestState(prev => {
          const newWarnings = prev.warnings + 1;
          const newTabSwitches = prev.tabSwitches + 1;
          
          toast({
            title: "Warning: Tab Switch Detected",
            description: `Warning ${newWarnings}/${MAX_WARNINGS}. Switching tabs may terminate your test.`,
            variant: "destructive",
          });
          
          if (newWarnings >= MAX_WARNINGS) {
            terminateTest("tab_switch_violation");
            return prev;
          }
          
          return {
            ...prev,
            warnings: newWarnings,
            tabSwitches: newTabSwitches,
          };
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [testState.status]);

  // Timer
  useEffect(() => {
    if (testState.status !== "in_progress" || !testState.startTime) return;

    timerInterval.current = setInterval(() => {
      setTestState(prev => {
        const elapsed = Math.floor((Date.now() - (prev.startTime || 0)) / 1000);
        const remaining = TEST_DURATION - elapsed;
        
        if (remaining <= 0) {
          completeTest();
          return { ...prev, timeRemaining: 0 };
        }
        
        return { ...prev, timeRemaining: remaining };
      });
    }, 1000);

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [testState.status, testState.startTime]);

  // Camera setup
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCameraPermission("granted");
      
      // Start face detection simulation (in production, use proper face detection)
      startFaceDetection();
    } catch (error) {
      console.error("Camera error:", error);
      setCameraPermission("denied");
      toast({
        title: "Camera Access Required",
        description: "Please allow camera access for proctoring.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (faceCheckInterval.current) {
      clearInterval(faceCheckInterval.current);
    }
    setCameraActive(false);
  };

  const startFaceDetection = () => {
    // Simulated face detection - in production, integrate with face-api.js or similar
    let noFaceFrames = 0;
    
    faceCheckInterval.current = setInterval(() => {
      // Simulate face detection (random for demo)
      const facePresent = Math.random() > 0.05;
      
      if (!facePresent) {
        noFaceFrames++;
        if (noFaceFrames > 3) {
          setFaceDetected(false);
          setTestState(prev => {
            const newWarnings = prev.warnings + 1;
            const newCameraWarnings = prev.cameraWarnings + 1;
            
            toast({
              title: "Warning: Face Not Detected",
              description: `Please ensure your face is visible in the camera.`,
              variant: "destructive",
            });
            
            if (newWarnings >= MAX_WARNINGS) {
              terminateTest("face_detection_violation");
              return prev;
            }
            
            return {
              ...prev,
              warnings: newWarnings,
              cameraWarnings: newCameraWarnings,
            };
          });
        }
      } else {
        noFaceFrames = 0;
        setFaceDetected(true);
      }
    }, 2000);
  };

  // Generate questions
  const generateQuestions = async (): Promise<Question[]> => {
    const questions: Question[] = [];
    
    // MCQ questions (45)
    const mcqTopics = [
      { topic: "Data Structures", questions: [
        { q: "What is the time complexity of searching in a balanced BST?", options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"], answer: "O(log n)" },
        { q: "Which data structure is best for implementing a priority queue?", options: ["Array", "Linked List", "Heap", "Stack"], answer: "Heap" },
        { q: "What is the worst case time complexity of QuickSort?", options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], answer: "O(n²)" },
        { q: "Which traversal gives sorted output in BST?", options: ["Preorder", "Inorder", "Postorder", "Level order"], answer: "Inorder" },
        { q: "What is the space complexity of Merge Sort?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], answer: "O(n)" },
      ]},
      { topic: "Algorithms", questions: [
        { q: "Which algorithm is used for finding shortest path in weighted graph?", options: ["BFS", "DFS", "Dijkstra's", "Prim's"], answer: "Dijkstra's" },
        { q: "What is the time complexity of BFS?", options: ["O(1)", "O(V+E)", "O(V²)", "O(E²)"], answer: "O(V+E)" },
        { q: "Which sorting algorithm has best average case performance?", options: ["Bubble Sort", "Selection Sort", "Quick Sort", "Insertion Sort"], answer: "Quick Sort" },
        { q: "What technique does Merge Sort use?", options: ["Greedy", "Dynamic Programming", "Divide and Conquer", "Backtracking"], answer: "Divide and Conquer" },
        { q: "Which algorithm is used for pattern matching?", options: ["KMP", "Dijkstra's", "Prim's", "Kruskal's"], answer: "KMP" },
      ]},
      { topic: "JavaScript", questions: [
        { q: "What is the output of typeof null?", options: ["null", "undefined", "object", "string"], answer: "object" },
        { q: "Which method creates a new array with results of calling a function?", options: ["forEach", "map", "filter", "reduce"], answer: "map" },
        { q: "What is closure in JavaScript?", options: ["A function with access to outer scope", "A closed function", "A private method", "A sealed object"], answer: "A function with access to outer scope" },
        { q: "What does '===' operator check?", options: ["Value only", "Type only", "Value and type", "Reference only"], answer: "Value and type" },
        { q: "Which is not a primitive type in JavaScript?", options: ["string", "number", "array", "boolean"], answer: "array" },
      ]},
      { topic: "React", questions: [
        { q: "What hook is used for side effects in React?", options: ["useState", "useEffect", "useContext", "useReducer"], answer: "useEffect" },
        { q: "What is the purpose of useMemo?", options: ["State management", "Memoizing values", "Routing", "Form handling"], answer: "Memoizing values" },
        { q: "Which method is used to update state in class components?", options: ["this.state", "this.setState", "this.updateState", "this.changeState"], answer: "this.setState" },
        { q: "What is React Fiber?", options: ["A styling library", "New reconciliation algorithm", "A router", "A state manager"], answer: "New reconciliation algorithm" },
        { q: "What does StrictMode do?", options: ["Enforces strict types", "Highlights potential problems", "Improves performance", "Adds strict mode to CSS"], answer: "Highlights potential problems" },
      ]},
      { topic: "System Design", questions: [
        { q: "What is the CAP theorem about?", options: ["Security", "Consistency, Availability, Partition tolerance", "Cache management", "API design"], answer: "Consistency, Availability, Partition tolerance" },
        { q: "Which database is best for unstructured data?", options: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"], answer: "MongoDB" },
        { q: "What is horizontal scaling?", options: ["Adding more power to single machine", "Adding more machines", "Optimizing code", "Using cache"], answer: "Adding more machines" },
        { q: "What is a CDN used for?", options: ["Database management", "Content delivery with low latency", "Code deployment", "User authentication"], answer: "Content delivery with low latency" },
        { q: "What is the purpose of load balancer?", options: ["Data storage", "Distributing traffic", "Code compilation", "User management"], answer: "Distributing traffic" },
      ]},
      { topic: "Python", questions: [
        { q: "What is a decorator in Python?", options: ["A design pattern", "A function that modifies another function", "A class modifier", "A type of loop"], answer: "A function that modifies another function" },
        { q: "What is the output of 3//2 in Python?", options: ["1.5", "1", "2", "Error"], answer: "1" },
        { q: "Which keyword is used to define a generator?", options: ["return", "yield", "generate", "produce"], answer: "yield" },
        { q: "What is list comprehension?", options: ["A loop inside list", "Concise way to create lists", "List sorting", "List filtering"], answer: "Concise way to create lists" },
        { q: "What does *args do in Python?", options: ["Multiplies arguments", "Accepts variable positional arguments", "Creates pointers", "Defines arrays"], answer: "Accepts variable positional arguments" },
      ]},
      { topic: "Databases", questions: [
        { q: "What is normalization in databases?", options: ["Sorting data", "Organizing data to reduce redundancy", "Encrypting data", "Indexing data"], answer: "Organizing data to reduce redundancy" },
        { q: "What is a foreign key?", options: ["Primary key of another table", "A unique key", "An index", "A constraint"], answer: "Primary key of another table" },
        { q: "What is ACID in databases?", options: ["A query language", "Atomicity, Consistency, Isolation, Durability", "A type of join", "A normalization form"], answer: "Atomicity, Consistency, Isolation, Durability" },
        { q: "Which JOIN returns all rows from both tables?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"], answer: "FULL OUTER JOIN" },
        { q: "What is an index in database?", options: ["A primary key", "A data structure for faster queries", "A table", "A relationship"], answer: "A data structure for faster queries" },
      ]},
      { topic: "Networking", questions: [
        { q: "What layer is HTTP in OSI model?", options: ["Transport", "Network", "Application", "Session"], answer: "Application" },
        { q: "What is the purpose of DNS?", options: ["Security", "Domain name to IP resolution", "Data storage", "Load balancing"], answer: "Domain name to IP resolution" },
        { q: "What does 404 status code mean?", options: ["Success", "Not Found", "Server Error", "Unauthorized"], answer: "Not Found" },
        { q: "What is TCP used for?", options: ["Connectionless communication", "Reliable connection-oriented communication", "Streaming", "Broadcasting"], answer: "Reliable connection-oriented communication" },
        { q: "What is REST?", options: ["A database", "An architectural style for APIs", "A protocol", "A language"], answer: "An architectural style for APIs" },
      ]},
    ];

    // Generate MCQs
    let mcqCount = 0;
    for (const topic of mcqTopics) {
      for (const q of topic.questions) {
        if (mcqCount >= 45) break;
        questions.push({
          id: `mcq-${mcqCount}`,
          type: "mcq",
          question: q.q,
          options: q.options,
          correct_answer: q.answer,
          difficulty: mcqCount < 15 ? "easy" : mcqCount < 30 ? "medium" : "hard",
          topic: topic.topic,
        });
        mcqCount++;
      }
      if (mcqCount >= 45) break;
    }

    // Coding questions (15)
    const codingQuestions: Question[] = [
      {
        id: "code-1",
        type: "coding",
        question: "Write a function to reverse a string.",
        test_cases: [
          { input: "hello", expected_output: "olleh" },
          { input: "world", expected_output: "dlrow" },
        ],
        language: "javascript",
        difficulty: "easy",
        topic: "Strings",
      },
      {
        id: "code-2",
        type: "coding",
        question: "Write a function to check if a string is a palindrome.",
        test_cases: [
          { input: "racecar", expected_output: "true" },
          { input: "hello", expected_output: "false" },
        ],
        language: "javascript",
        difficulty: "easy",
        topic: "Strings",
      },
      {
        id: "code-3",
        type: "coding",
        question: "Write a function to find the maximum element in an array.",
        test_cases: [
          { input: "[1,5,3,9,2]", expected_output: "9" },
          { input: "[-1,-5,-3]", expected_output: "-1" },
        ],
        language: "javascript",
        difficulty: "easy",
        topic: "Arrays",
      },
      {
        id: "code-4",
        type: "coding",
        question: "Write a function to merge two sorted arrays.",
        test_cases: [
          { input: "[1,3,5], [2,4,6]", expected_output: "[1,2,3,4,5,6]" },
          { input: "[1,2], [3,4,5]", expected_output: "[1,2,3,4,5]" },
        ],
        language: "javascript",
        difficulty: "medium",
        topic: "Arrays",
      },
      {
        id: "code-5",
        type: "coding",
        question: "Write a function to find the first non-repeating character in a string.",
        test_cases: [
          { input: "leetcode", expected_output: "l" },
          { input: "aabb", expected_output: "-" },
        ],
        language: "javascript",
        difficulty: "medium",
        topic: "Strings",
      },
      {
        id: "code-6",
        type: "coding",
        question: "Implement a function to validate a binary search tree.",
        test_cases: [
          { input: "[2,1,3]", expected_output: "true" },
          { input: "[5,1,4,null,null,3,6]", expected_output: "false" },
        ],
        language: "javascript",
        difficulty: "medium",
        topic: "Trees",
      },
      {
        id: "code-7",
        type: "coding",
        question: "Write a function to detect a cycle in a linked list.",
        test_cases: [
          { input: "[1,2,3,4,2]", expected_output: "true" },
          { input: "[1,2,3,4]", expected_output: "false" },
        ],
        language: "javascript",
        difficulty: "medium",
        topic: "Linked Lists",
      },
      {
        id: "code-8",
        type: "coding",
        question: "Implement a function to find the longest common prefix among strings.",
        test_cases: [
          { input: '["flower","flow","flight"]', expected_output: "fl" },
          { input: '["dog","racecar","car"]', expected_output: "" },
        ],
        language: "javascript",
        difficulty: "easy",
        topic: "Strings",
      },
      {
        id: "code-9",
        type: "coding",
        question: "Write a function to perform level order traversal of a binary tree.",
        test_cases: [
          { input: "[3,9,20,null,null,15,7]", expected_output: "[[3],[9,20],[15,7]]" },
          { input: "[1]", expected_output: "[[1]]" },
        ],
        language: "javascript",
        difficulty: "medium",
        topic: "Trees",
      },
      {
        id: "code-10",
        type: "coding",
        question: "Implement a function to solve the two-sum problem.",
        test_cases: [
          { input: "[2,7,11,15], 9", expected_output: "[0,1]" },
          { input: "[3,2,4], 6", expected_output: "[1,2]" },
        ],
        language: "javascript",
        difficulty: "easy",
        topic: "Arrays",
      },
      {
        id: "code-11",
        type: "coding",
        question: "Write a function to find all anagrams of a pattern in a string.",
        test_cases: [
          { input: '"cbaebabacd", "abc"', expected_output: "[0,6]" },
          { input: '"abab", "ab"', expected_output: "[0,1,2]" },
        ],
        language: "javascript",
        difficulty: "hard",
        topic: "Sliding Window",
      },
      {
        id: "code-12",
        type: "coding",
        question: "Implement a function to serialize and deserialize a binary tree.",
        test_cases: [
          { input: "[1,2,3,null,null,4,5]", expected_output: "[1,2,3,null,null,4,5]" },
          { input: "[]", expected_output: "[]" },
        ],
        language: "javascript",
        difficulty: "hard",
        topic: "Trees",
      },
      {
        id: "code-13",
        type: "coding",
        question: "Write a function to implement a LRU cache.",
        test_cases: [
          { input: "put(1,1), put(2,2), get(1), put(3,3), get(2)", expected_output: "1,-1" },
          { input: "put(1,1), get(1)", expected_output: "1" },
        ],
        language: "javascript",
        difficulty: "hard",
        topic: "Design",
      },
      {
        id: "code-14",
        type: "coding",
        question: "Write a function to find the median of two sorted arrays.",
        test_cases: [
          { input: "[1,3], [2]", expected_output: "2.0" },
          { input: "[1,2], [3,4]", expected_output: "2.5" },
        ],
        language: "javascript",
        difficulty: "hard",
        topic: "Arrays",
      },
      {
        id: "code-15",
        type: "coding",
        question: "Implement a function to solve the word ladder problem.",
        test_cases: [
          { input: '"hit", "cog", ["hot","dot","dog","lot","log","cog"]', expected_output: "5" },
          { input: '"hit", "cog", ["hot","dot","dog","lot","log"]', expected_output: "0" },
        ],
        language: "javascript",
        difficulty: "hard",
        topic: "BFS",
      },
    ];

    questions.push(...codingQuestions);

    return questions.slice(0, QUESTIONS_COUNT);
  };

  const startTest = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Create test record
      const { data: testData, error: testError } = await supabase
        .from("skill_tests")
        .insert({
          user_id: user.id,
          test_type: "general",
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (testError) throw testError;
      setTestId(testData.id);

      // Generate questions
      const questions = await generateQuestions();
      
      // Update test with questions
      await supabase
        .from("skill_tests")
        .update({ questions: questions as any })
        .eq("id", testData.id);

      setTestState(prev => ({
        ...prev,
        status: "in_progress",
        questions,
        startTime: Date.now(),
      }));

      // Start camera
      await startCamera();

      toast({
        title: "Test Started",
        description: "Good luck! Remember to stay focused.",
      });
    } catch (error: any) {
      console.error("Test start error:", error);
      toast({
        title: "Failed to start test",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completeTest = useCallback(async () => {
    if (!user || !testId) return;
    
    stopCamera();
    
    // Calculate score
    let correctAnswers = 0;
    testState.questions.forEach(q => {
      if (q.type === "mcq" && testState.answers[q.id] === q.correct_answer) {
        correctAnswers++;
      }
      // For coding, in production, would run test cases
      if (q.type === "coding" && testState.codingAnswers[q.id]) {
        correctAnswers += 0.5; // Partial credit for attempting
      }
    });

    const score = Math.round((correctAnswers / testState.questions.length) * 100);

    try {
      await supabase
        .from("skill_tests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          score,
          answers: testState.answers as any,
          coding_answers: testState.codingAnswers as any,
          warnings: testState.warnings,
          tab_switches: testState.tabSwitches,
          camera_warnings: testState.cameraWarnings,
          time_spent_seconds: TEST_DURATION - testState.timeRemaining,
        })
        .eq("id", testId);

      // Update profile scores
      const { data: existingTests } = await supabase
        .from("skill_tests")
        .select("score")
        .eq("user_id", user.id)
        .eq("status", "completed");

      const avgScore = existingTests && existingTests.length > 0
        ? Math.round(existingTests.reduce((sum, t) => sum + (t.score || 0), 0) / existingTests.length)
        : score;

      await supabase
        .from("profiles")
        .update({
          candidate_score: avgScore,
          risk_score: Math.min(100, testState.warnings * 20),
          skill_authenticity_score: Math.max(0, 100 - testState.warnings * 10),
          verification_status: avgScore >= 70 ? "verified" : "test_completed",
        })
        .eq("user_id", user.id);

      setTestState(prev => ({
        ...prev,
        status: "completed",
        endTime: Date.now(),
      }));

      toast({
        title: "Test Completed!",
        description: `Your score: ${score}%`,
      });
    } catch (error: any) {
      console.error("Complete test error:", error);
    }
  }, [user, testId, testState]);

  const terminateTest = useCallback(async (reason: string) => {
    if (!user || !testId) return;
    
    stopCamera();

    try {
      await supabase
        .from("skill_tests")
        .update({
          status: "terminated",
          completed_at: new Date().toISOString(),
          score: 0,
          warnings: testState.warnings,
          tab_switches: testState.tabSwitches,
          camera_warnings: testState.cameraWarnings,
        })
        .eq("id", testId);

      setTestState(prev => ({
        ...prev,
        status: "terminated",
      }));

      toast({
        title: "Test Terminated",
        description: `Test terminated due to: ${reason}`,
        variant: "destructive",
      });
    } catch (error: any) {
      console.error("Terminate test error:", error);
    }
  }, [user, testId, testState]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setTestState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }));
  };

  const handleCodingAnswerChange = (questionId: string, code: string) => {
    setTestState(prev => ({
      ...prev,
      codingAnswers: { ...prev.codingAnswers, [questionId]: code },
    }));
  };

  const nextQuestion = () => {
    setTestState(prev => ({
      ...prev,
      currentQuestion: Math.min(prev.currentQuestion + 1, prev.questions.length - 1),
    }));
  };

  const prevQuestion = () => {
    setTestState(prev => ({
      ...prev,
      currentQuestion: Math.max(prev.currentQuestion - 1, 0),
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQ = testState.questions[testState.currentQuestion];
  const progress = ((testState.currentQuestion + 1) / testState.questions.length) * 100;

  // Setup screen
  if (testState.status === "setup") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Skill Verification Test</h1>
            <p className="text-muted-foreground">Proctored assessment to verify your skills</p>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Test Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="font-medium">Test Details</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {QUESTIONS_COUNT} questions (45 MCQ + 15 Coding)</li>
                  <li>• Duration: {TEST_DURATION / 60} minutes</li>
                  <li>• Topics: DSA, JavaScript, React, System Design, Python, Databases</li>
                  <li>• Passing score: 70%</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Proctoring Rules</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Camera must stay on throughout the test</li>
                  <li>• Your face must be visible at all times</li>
                  <li>• Switching tabs will trigger warnings</li>
                  <li>• {MAX_WARNINGS} warnings = Test termination</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Important</p>
                  <p className="text-sm text-muted-foreground">
                    Ensure you have a stable internet connection and a quiet environment before starting.
                    The test cannot be paused once started.
                  </p>
                </div>
              </div>
            </div>

            {profile && (
              <div className="bg-primary/5 rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-medium">Your SkillMirror ID: </span>
                  <span className="text-primary font-mono">{profile.skillmirror_id}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your test results will be linked to this ID for recruiter visibility.
                </p>
              </div>
            )}

            <Button
              onClick={startTest}
              disabled={loading}
              className="w-full btn-glow"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting Test...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Skill Verification Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed screen
  if (testState.status === "completed") {
    const correctCount = testState.questions.filter(q => 
      q.type === "mcq" && testState.answers[q.id] === q.correct_answer
    ).length;
    const score = Math.round((correctCount / testState.questions.length) * 100);

    return (
      <div className="space-y-6">
        <Card className="glass-card text-center">
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <Trophy className="h-12 w-12 text-green-500" />
            </motion.div>
            <h1 className="text-3xl font-display font-bold mb-2">Test Completed!</h1>
            <p className="text-muted-foreground mb-6">Your skill verification test has been submitted</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="text-3xl font-bold text-primary">{score}%</div>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="text-3xl font-bold">{correctCount}/{testState.questions.length}</div>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="text-3xl font-bold">{formatTime(TEST_DURATION - testState.timeRemaining)}</div>
                <p className="text-sm text-muted-foreground">Time Taken</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="text-3xl font-bold">{testState.warnings}</div>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>

            {score >= 70 ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <p className="text-green-500 font-medium">🎉 Congratulations! You passed the verification.</p>
                <p className="text-sm text-muted-foreground">Your profile is now verified and visible to recruiters.</p>
              </div>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-500 font-medium">Score below passing threshold</p>
                <p className="text-sm text-muted-foreground">You can retake the test after 24 hours.</p>
              </div>
            )}

            <Button onClick={() => navigate("/dashboard")} className="btn-glow">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Terminated screen
  if (testState.status === "terminated") {
    return (
      <div className="space-y-6">
        <Card className="glass-card text-center">
          <CardContent className="p-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Test Terminated</h1>
            <p className="text-muted-foreground mb-6">
              Your test was terminated due to multiple proctoring violations.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test in progress
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant={testState.timeRemaining < 300 ? "destructive" : "secondary"}>
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(testState.timeRemaining)}
          </Badge>
          <Badge variant="outline">
            Question {testState.currentQuestion + 1}/{testState.questions.length}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={testState.warnings > 2 ? "destructive" : "secondary"}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warnings: {testState.warnings}/{MAX_WARNINGS}
          </Badge>
          <div className="flex items-center gap-2">
            {cameraActive ? (
              <Video className="h-4 w-4 text-green-500" />
            ) : (
              <VideoOff className="h-4 w-4 text-red-500" />
            )}
            {faceDetected ? (
              <span className="text-xs text-green-500">Face detected</span>
            ) : (
              <span className="text-xs text-red-500">No face</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Camera feed */}
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {!faceDetected && cameraActive && (
                  <div className="absolute bottom-2 left-2 right-2 bg-red-500/90 text-white text-xs p-1 rounded text-center">
                    Face not detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question area */}
        <div className="lg:col-span-3">
          <Card className="glass-card">
            <CardContent className="p-6">
              {currentQ && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentQ.topic}</Badge>
                    <Badge variant={
                      currentQ.difficulty === "easy" ? "default" :
                      currentQ.difficulty === "medium" ? "secondary" : "destructive"
                    }>
                      {currentQ.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {currentQ.type === "mcq" ? <FileText className="h-3 w-3 mr-1" /> : <Code className="h-3 w-3 mr-1" />}
                      {currentQ.type === "mcq" ? "MCQ" : "Coding"}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-medium">{currentQ.question}</h3>

                  {currentQ.type === "mcq" && currentQ.options && (
                    <RadioGroup
                      value={testState.answers[currentQ.id] || ""}
                      onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
                    >
                      {currentQ.options.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQ.type === "coding" && (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">Test Cases:</p>
                        {currentQ.test_cases?.map((tc, idx) => (
                          <div key={idx} className="text-xs font-mono bg-background/50 p-2 rounded mb-2">
                            <div>Input: {tc.input}</div>
                            <div>Expected: {tc.expected_output}</div>
                          </div>
                        ))}
                      </div>
                      <Textarea
                        value={testState.codingAnswers[currentQ.id] || ""}
                        onChange={(e) => handleCodingAnswerChange(currentQ.id, e.target.value)}
                        placeholder={`Write your ${currentQ.language || 'javascript'} solution here...`}
                        className="font-mono min-h-[200px]"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={prevQuestion}
                      disabled={testState.currentQuestion === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    {testState.currentQuestion === testState.questions.length - 1 ? (
                      <Button onClick={completeTest} className="btn-glow">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Submit Test
                      </Button>
                    ) : (
                      <Button onClick={nextQuestion}>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkillTest;
