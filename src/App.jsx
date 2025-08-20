import React, { useState, useEffect } from 'react';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc } from "firebase/firestore";

// Icon Imports
import { Clock, BookOpen, Award, Play, RotateCcw, CheckCircle, XCircle, AlertCircle, BarChart3, Home, Download, Bookmark, Moon, Sun, ChevronLeft, ChevronRight, Calendar, Target, LogOut } from 'lucide-react';

// Charting Library Imports
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Question Data Import
import rawQuestionsData from './qae.json';

// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCH29kltN8xU390rU5PmRxDA1kmQAKaNvM",
  authDomain: "qwen-bank.firebaseapp.com",
  projectId: "qwen-bank",
  storageBucket: "qwen-bank.appspot.com",
  messagingSenderId: "718284252163",
  appId: "1:718284252163:web:306747fd2c55413f8e5a36",
  measurementId: "G-7CHP1T9YPV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HELPER FUNCTIONS FOR FIRESTORE DATA CONVERSION ---
const convertSetsToArrays = (data) => {
  const converted = { ...data };
  if (data.bookmarkedQuestions instanceof Set) {
    converted.bookmarked = Array.from(data.bookmarkedQuestions);
    delete converted.bookmarkedQuestions;
  }
  if (data.incorrectlyAnswered instanceof Set) {
    converted.incorrect = Array.from(data.incorrectlyAnswered);
    delete converted.incorrectlyAnswered;
  }
  return converted;
};

const convertArraysToSets = (data) => {
  const converted = { ...data };
  if (data.bookmarked && Array.isArray(data.bookmarked)) {
    converted.bookmarkedQuestions = new Set(data.bookmarked);
    delete converted.bookmarked;
  }
  if (data.incorrect && Array.isArray(data.incorrect)) {
    converted.incorrectlyAnswered = new Set(data.incorrect);
    delete converted.incorrect;
  }
  return converted;
};

// --- 2. LOGIN COMPONENT ---
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        // --- INVITATION CHECK LOGIC ---
        const invitationsRef = collection(db, "invitations");
        const q = query(invitationsRef, 
          where("code", "==", invitationCode.toUpperCase()), 
          where("email", "==", email.toLowerCase()),
          where("status", "==", "pending")
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Invalid invitation code or email, or the code has already been used.");
          setLoading(false);
          return;
        }
        
        // --- If code is valid, proceed ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Mark the invitation as used
        const invitationDoc = querySnapshot.docs[0];
        const invitationDocRef = doc(db, "invitations", invitationDoc.id);
        await updateDoc(invitationDocRef, {
          status: 'used',
          usedAt: new Date().toISOString(),
          usedBy: userCredential.user.uid
        });

        // Create initial user document in Firestore
        const defaultProgress = {
          sessionHistory: [],
          domainPerformance: {},
          questionPerformance: {},
          bookmarked: [], // Store as array for Firestore
          incorrect: [], // Store as array for Firestore
          examDate: null,
          studyPlan: [],
          isDarkMode: false,
          createdAt: new Date().toISOString(),
          email: userCredential.user.email
        };
        
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, defaultProgress);
        console.log("User document created successfully");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.message.replace('Firebase: ', ''));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    CISA Practice App
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {isSignUp ? "Create an account to save your progress" : "Welcome back! Sign in to continue"}
                </p>
            </div>
          <form onSubmit={handleAuth}>
            {isSignUp && (
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="invitationCode">
                  Invitation Code
                </label>
                <input type="text" id="invitationCode" value={invitationCode} onChange={(e) => setInvitationCode(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm" required />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm" required />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm" required />
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>}
            <div className="flex flex-col gap-4">
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50">
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
              </button>
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- DATA TRANSFORMATION FUNCTION ---
const transformQuestions = (rawData) => {
  return rawData.map((rawQ, index) => {
    const options = [rawQ.OptionA, rawQ.OptionB, rawQ.OptionC, rawQ.OptionD].filter(Boolean);
    const correctAnswerLetter = (rawQ.CorrectAnswer || 'A').trim().toUpperCase();
    let correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswerLetter);
    if (correctAnswerIndex === -1) correctAnswerIndex = 0;
    const domain = (rawQ.Domain || 'General').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    let difficulty = parseInt(rawQ.Difficulty, 10);
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) difficulty = 3;
    return {
      id: rawQ.id || index + 1,
      question: rawQ.Question,
      options: options,
      correctAnswer: correctAnswerIndex,
      domain: domain,
      explanation: rawQ.Explanation || 'No explanation provided.',
      difficulty: difficulty
    };
  });
};

// --- NEW EXPLANATION FORMATTING COMPONENT ---
const Explanation = ({ text, correctAnswerIndex }) => {
  const correctLetter = String.fromCharCode(65 + correctAnswerIndex);
  const parts = text.split(/(?=[A-Z]\.)/).filter(part => part.trim() !== '');

  return (
    <div className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed space-y-2">
      {parts.map((part, index) => {
        const trimmedPart = part.trim();
        const isCorrect = trimmedPart.startsWith(correctLetter + '.');
        
        return (
          <p key={index} className={isCorrect ? 'font-bold' : ''}>
            {trimmedPart}
          </p>
        );
      })}
    </div>
  );
};

// --- 3. MAIN CISA PRACTICE APP COMPONENT ---
const CISAPracticeApp = ({ user, initialProgress }) => {
  const [allQuestions] = useState(() => transformQuestions(rawQuestionsData));
  const [questions, setQuestions] = useState([]);
  const [currentMode, setCurrentMode] = useState('analytics');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [lastSessionResults, setLastSessionResults] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [examStartTime, setExamStartTime] = useState(null);
  const [examDuration, setExamDuration] = useState(240 * 60);
  const [timeRemaining, setTimeRemaining] = useState(240 * 60);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [numberOfQuestions, setNumberOfQuestions] = useState(20);
  const [examQuestionCount, setExamQuestionCount] = useState(150);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [sessionHistory, setSessionHistory] = useState(initialProgress.sessionHistory);
  const [domainPerformance, setDomainPerformance] = useState(initialProgress.domainPerformance);
  const [questionPerformance, setQuestionPerformance] = useState(initialProgress.questionPerformance);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(initialProgress.bookmarkedQuestions);
  const [incorrectlyAnswered, setIncorrectlyAnswered] = useState(initialProgress.incorrectlyAnswered);
  const [examDate, setExamDate] = useState(initialProgress.examDate);
  const [studyPlan, setStudyPlan] = useState(initialProgress.studyPlan);
  const [isDarkMode, setIsDarkMode] = useState(initialProgress.isDarkMode);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({});
  const [adaptivePracticeMode, setAdaptivePracticeMode] = useState(false);
  const [assessmentReport, setAssessmentReport] = useState(null);
  const [assessmentQuestionCount, setAssessmentQuestionCount] = useState(60);
  const [sessionToReview, setSessionToReview] = useState(null);
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const CISA_DOMAIN_WEIGHTS = {
    "Information System Auditing Process": 0.18,
    "Governance And Management Of It": 0.18,
    "Information Systems Acquisition, Development And Implementation": 0.12,
    "Information Systems Operations And Business Resilience": 0.26,
    "Protection Of Information Assets": 0.26,
  };
  
  useEffect(() => {
    const saveProgressToFirestore = async () => {
      if (!user) return;
      try {
        const progressData = convertSetsToArrays({
          sessionHistory,
          domainPerformance,
          questionPerformance,
          bookmarkedQuestions,
          incorrectlyAnswered,
          examDate,
          studyPlan,
          isDarkMode,
          lastUpdated: new Date().toISOString()
        });
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, progressData, { merge: true });
      } catch (error) {
        console.error("Error saving progress to Firestore:", error);
      }
    };
    const handler = setTimeout(saveProgressToFirestore, 2000);
    return () => clearTimeout(handler);
  }, [sessionHistory, domainPerformance, questionPerformance, bookmarkedQuestions, incorrectlyAnswered, examDate, studyPlan, isDarkMode, user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleHomeClick = () => {
    const activeModes = ['practice', 'exam', 'assessment', 'practice-incorrect', 'practice-bookmarked'];
    if (activeModes.includes(currentMode)) {
      if (window.confirm('Are you sure? Your current session will not be saved.')) {
        setCurrentMode('analytics');
      }
    } else {
      setCurrentMode('analytics');
    }
  };

  const handleDeleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to permanently delete this session?')) {
      setSessionHistory(prev => prev.filter(s => s.id !== sessionId));
    }
  };
  
  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    if (!inviteeEmail) {
      setInviteMessage('Please enter an email address.');
      return;
    }
    setInviteMessage('Generating code...');
    setGeneratedCode('');
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const invitationsCol = collection(db, "invitations");
      await addDoc(invitationsCol, {
        code: code,
        email: inviteeEmail.toLowerCase(),
        generatedBy: user.uid,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      setGeneratedCode(code);
      setInviteMessage(`Success! Share this code with ${inviteeEmail}.`);
      setInviteeEmail('');
    } catch (error) {
      setInviteMessage('Could not generate code. Please try again.');
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      const domains = [...new Set(allQuestions.map(q => q.domain))];
      setAvailableDomains(domains);
    }
  }, [allQuestions]);

  useEffect(() => {
    let timer;
    if (currentMode === 'exam' && examStartTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
        const remaining = examDuration - elapsed;
        if (remaining <= 0) {
          clearInterval(timer);
          handleSubmit();
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentMode, examStartTime, examDuration]);

  const resetSession = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setQuestionTimes({});
    setSessionStartTime(Date.now());
  };

  const startPracticeMode = (practiceQuestions, mode = 'practice') => {
    let questionsToSet;
    if (mode === 'practice') {
      let filtered = selectedDomain === 'all' ? [...allQuestions] : allQuestions.filter(q => q.domain === selectedDomain);
      questionsToSet = filtered.sort(() => 0.5 - Math.random()).slice(0, numberOfQuestions);
    } else {
      questionsToSet = practiceQuestions;
    }
    if (!questionsToSet || questionsToSet.length === 0) {
      alert("No questions available for this mode.");
      return;
    }
    setQuestions(questionsToSet);
    setCurrentMode(mode);
    resetSession();
  };

  const startExamMode = () => {
    const questionsByDomain = allQuestions.reduce((acc, q) => {
      acc[q.domain] = acc[q.domain] || [];
      acc[q.domain].push(q);
      return acc;
    }, {});
    let examQuestions = [];
    for (const domain in CISA_DOMAIN_WEIGHTS) {
      if (questionsByDomain[domain]) {
        const count = Math.round(examQuestionCount * CISA_DOMAIN_WEIGHTS[domain]);
        examQuestions.push(...questionsByDomain[domain].sort(() => 0.5 - Math.random()).slice(0, count));
      }
    }
    while (examQuestions.length < examQuestionCount && allQuestions.length > examQuestions.length) {
      const randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
      if (!examQuestions.find(q => q.id === randomQ.id)) {
        examQuestions.push(randomQ);
      }
    }
    examQuestions = examQuestions.slice(0, examQuestionCount);
    const duration = Math.round((examQuestionCount / 150) * 240) * 60;
    setExamDuration(duration);
    setTimeRemaining(duration);
    setQuestions(examQuestions.sort(() => 0.5 - Math.random()));
    setCurrentMode('exam');
    resetSession();
    setExamStartTime(Date.now());
  };

  const startAssessmentMode = () => {
    const questionsByDomain = allQuestions.reduce((acc, q) => {
      acc[q.domain] = acc[q.domain] || [];
      acc[q.domain].push(q);
      return acc;
    }, {});
    let assessmentQuestions = [];
    for (const domain in CISA_DOMAIN_WEIGHTS) {
      if (questionsByDomain[domain]) {
        const count = Math.round(assessmentQuestionCount * CISA_DOMAIN_WEIGHTS[domain]);
        assessmentQuestions.push(...questionsByDomain[domain].sort(() => 0.5 - Math.random()).slice(0, count));
      }
    }
    while (assessmentQuestions.length < assessmentQuestionCount && allQuestions.length > assessmentQuestions.length) {
      const randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
      if (!assessmentQuestions.find(q => q.id === randomQ.id)) {
        assessmentQuestions.push(randomQ);
      }
    }
    assessmentQuestions = assessmentQuestions.slice(0, assessmentQuestionCount);
    setQuestions(assessmentQuestions.sort(() => 0.5 - Math.random()));
    setCurrentMode('assessment');
    resetSession();
  };

  const calculateScore = () => {
    const correct = questions.filter(q => selectedAnswers[q.id] === q.correctAnswer).length;
    const total = questions.length;
    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  };

  const recordSession = () => {
    const score = calculateScore();
    const timeSpent = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 60000) : 0;
    const domainBreakdown = questions.reduce((acc, q) => {
      acc[q.domain] = acc[q.domain] || { correct: 0, total: 0 };
      acc[q.domain].total++;
      if (selectedAnswers[q.id] === q.correctAnswer) acc[q.domain].correct++;
      return acc;
    }, {});
    const sessionData = {
      id: Date.now(),
      date: new Date().toISOString(),
      mode: currentMode,
      totalQuestions: questions.length,
      correctAnswers: score.correct,
      percentage: score.percentage,
      timeSpent,
      domainBreakdown,
      questionIds: questions.map(q => q.id),
      selectedAnswers: { ...selectedAnswers },
    };
    setSessionHistory(prev => [sessionData, ...prev]);
    setDomainPerformance(prev => {
      const updated = { ...prev };
      for (const domain in domainBreakdown) {
        if (!updated[domain]) updated[domain] = { correct: 0, total: 0 };
        updated[domain].correct += domainBreakdown[domain].correct;
        updated[domain].total += domainBreakdown[domain].total;
      }
      return updated;
    });
    return sessionData;
  };

  const handleSubmit = () => {
    const results = recordSession();
    if (currentMode === 'assessment') {
      setAssessmentReport(results);
      setCurrentMode('assessment-report');
    } else {
      setLastSessionResults(results);
      setCurrentMode('results');
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    if (currentMode.startsWith('practice')) {
      const currentQ = questions[currentQuestion];
      const isCorrect = currentQ.correctAnswer === answerIndex;
      setQuestionPerformance(prev => {
        const updated = { ...prev };
        const qStats = updated[questionId] || { correctCount: 0, totalCount: 0 };
        qStats.totalCount += 1;
        if (isCorrect) qStats.correctCount += 1;
        updated[questionId] = qStats;
        return updated;
      });
      if (!isCorrect) setIncorrectlyAnswered(prev => new Set(prev).add(questionId));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const toggleBookmark = (questionId) => {
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) newSet.delete(questionId);
      else newSet.add(questionId);
      return newSet;
    });
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getOverallStats = () => {
    if (sessionHistory.length === 0) return { averageScore: 0, totalSessions: 0, totalQuestions: 0 };
    const totalQuestions = sessionHistory.reduce((sum, s) => sum + s.totalQuestions, 0);
    const averageScore = sessionHistory.reduce((sum, s) => sum + s.percentage, 0) / sessionHistory.length;
    return { averageScore: Math.round(averageScore), totalSessions: sessionHistory.length, totalQuestions };
  };

  const getDomainChartData = () => Object.entries(domainPerformance).map(([domain, stats]) => ({
    domain,
    percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  }));

  const getProgressChartData = () => sessionHistory.slice().reverse().map((session, index) => ({
    session: `S${index + 1}`,
    score: session.percentage
  }));

  const generateStudyPlan = () => {
    if (!examDate) {
      alert("Please set an exam date first.");
      return;
    }
    if (!assessmentReport) {
        alert("Please take the assessment test first.");
        return;
    }
    const examDateObj = new Date(examDate);
    const today = new Date();
    const daysUntilExam = Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (daysUntilExam <= 0) {
      alert("Exam date must be in the future.");
      return;
    }
    const newPlan = [];
    const avgQuestionsPerDay = Math.max(20, Math.round((allQuestions.length * 0.8) / daysUntilExam));
    const weakDomains = Object.entries(assessmentReport.domainBreakdown)
      .filter(([, stats]) => stats.total > 0 && (stats.correct / stats.total) < 0.7)
      .map(([domain]) => domain);
    const strongDomains = Object.entries(assessmentReport.domainBreakdown)
      .filter(([, stats]) => stats.total > 0 && (stats.correct / stats.total) >= 0.8)
      .map(([domain]) => domain);

    for (let i = 0; i < daysUntilExam; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      let tasks = [];
      if (i % 7 === 6) {
        tasks.push("Take a practice exam (50-100 questions)");
      } else if (i % 5 === 4) {
        tasks.push("Review incorrect answers and explanations", "Focus on bookmarked questions");
        if (weakDomains.length > 0) tasks.push(`Target weak domains: ${weakDomains.join(', ')}`);
      } else {
        tasks.push(`Practice ${avgQuestionsPerDay} questions`);
        if (weakDomains.length > 0 && i % 2 === 0) {
            tasks.push(`Focus on weak domains: ${weakDomains.join(', ')}`);
        } else if (strongDomains.length > 0 && i % 3 === 0) {
             tasks.push(`Quick review of strong domains: ${strongDomains.join(', ')}`);
        } else {
            tasks.push("Mixed domain practice");
        }
      }
      newPlan.push({ date: dateString, tasks });
    }
    setStudyPlan(newPlan);
    alert("Study plan generated!");
  };

  // --- Rendering Logic ---
  const incorrectToReview = allQuestions.filter(q => incorrectlyAnswered.has(q.id));
  const bookmarkedToReview = allQuestions.filter(q => bookmarkedQuestions.has(q.id));

  if (currentMode === 'setup' || currentMode === 'exam-setup' || currentMode === 'assessment-setup') {
    const isExamSetup = currentMode === 'exam-setup';
    const isAssessmentSetup = currentMode === 'assessment-setup';
    const domainQuestionCount = selectedDomain === 'all' ? allQuestions.length : allQuestions.filter(q => q.domain === selectedDomain).length;
    let setupContent, startButtonAction, startButtonText;

    if (isExamSetup) {
      startButtonAction = startExamMode;
      startButtonText = 'Start Exam';
      setupContent = (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Exam Duration & Questions</label>
          <select value={examQuestionCount} onChange={(e) => setExamQuestionCount(Number(e.target.value))} className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700">
            <option value={150}>150 Questions (4 hours) - Full Exam</option>
            <option value={100}>100 Questions (~2h 40m) - Practice Exam</option>
            <option value={50}>50 Questions (~1h 20m) - Quick Test</option>
          </select>
        </div>
      );
    } else if (isAssessmentSetup) {
      startButtonAction = startAssessmentMode;
      startButtonText = 'Start Assessment';
      setupContent = (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Number of Questions</label>
          <select value={assessmentQuestionCount} onChange={(e) => setAssessmentQuestionCount(Number(e.target.value))} className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700">
            <option value={60}>60 Questions</option>
            <option value={120}>120 Questions</option>
          </select>
        </div>
      );
    } else {
      startButtonAction = () => startPracticeMode(null, 'practice');
      startButtonText = 'Start Practice';
      setupContent = (
        <>
          <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <div className="font-semibold text-gray-800 dark:text-gray-200">Adaptive Practice</div>
            <button onClick={() => setAdaptivePracticeMode(!adaptivePracticeMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${adaptivePracticeMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adaptivePracticeMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Knowledge Domain</label>
            <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700">
              <option value="all">All Domains ({allQuestions.length})</option>
              {availableDomains.map(d => (
                <option key={d} value={d}>{d} ({allQuestions.filter(q => q.domain === d).length})</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Number of Questions: {numberOfQuestions}</label>
            <input type="range" min="1" max={domainQuestionCount} value={numberOfQuestions} onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer" />
          </div>
        </>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 p-4 flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {isExamSetup ? "Exam Configuration" : isAssessmentSetup ? "Assessment Setup" : "Practice Setup"}
              </h1>
              <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={handleHomeClick} title="Back to Dashboard" className="p-2 sm:p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                    <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button onClick={toggleDarkMode} className="p-2 sm:p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                  {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                </button>
              </div>
            </div>
            <div className="space-y-6">{setupContent}</div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button onClick={() => setCurrentMode('analytics')} className="flex-1 order-2 sm:order-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold py-3 px-6 rounded-xl">
                Back
              </button>
              <button onClick={startButtonAction} className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                {startButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentMode === 'analytics') {
    const stats = getOverallStats();
    const domainData = getDomainChartData();
    const progressData = getProgressChartData();
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
        <div className="w-full max-w-screen-2xl mx-auto p-4 lg:p-8 pb-40">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CISA Performance Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-base sm:text-lg">
                Welcome, {user.email}!
              </p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={toggleDarkMode} className="p-3 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 shadow-lg">
                  {isDarkMode ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-gray-600" />}
                </button>
                <button onClick={handleLogout} title="Logout" className="p-3 rounded-full bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 shadow-lg">
                    <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
                </button>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Personalized Study Plan
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {!assessmentReport && (
                    <button onClick={() => setCurrentMode('assessment-setup')} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-lg whitespace-nowrap">
                    <Target className="w-4 h-4" /> Take Assessment
                  </button>
                )}
                <input type="date" value={examDate || ""} onChange={(e) => setExamDate(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={generateStudyPlan} disabled={!assessmentReport} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-lg whitespace-nowrap disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed">
                  <Target className="w-4 h-4" /> Generate Plan
                </button>
              </div>
            </div>
            {studyPlan.length > 0 ? (
              <div className="overflow-x-auto rounded-xl max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white/80 dark:bg-gray-800/80 z-10">
                    <tr className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm">
                      <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 rounded-tl-lg">Date</th>
                      <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 rounded-tr-lg">Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studyPlan.map((day, index) => (
                      <tr key={index} className="border-t border-gray-100 dark:border-gray-600/30">
                        <td className="p-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{day.date}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          <ul className="list-disc pl-5 space-y-1">
                            {day.tasks.map((task, i) => (<li key={i} className="text-sm">{task}</li>))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                {assessmentReport ? "Set your exam date and click 'Generate Plan'." : "Take the assessment test to unlock the study plan."}
              </p>
            )}
          </div>
          {sessionHistory.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4"><BarChart3 className="w-6 h-6 text-white" /></div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.averageScore}%</p>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-6 h-6 text-white" /></div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Sessions Completed</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.totalSessions}</p>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4"><BookOpen className="w-6 h-6 text-white" /></div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Questions Answered</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{stats.totalQuestions}</p>
                </div>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 mb-8">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">Invite a New User</h3>
                <form onSubmit={handleGenerateInvite} className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                    placeholder="Enter new user's email"
                    className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button type="submit" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg font-medium shadow-lg">
                    Generate Code
                  </button>
                </form>
                {inviteMessage && (
                  <div className="mt-4 text-center text-sm text-gray-700 dark:text-gray-300">
                    <p>{inviteMessage}</p>
                    {generatedCode && (
                      <p className="mt-2 text-2xl font-bold tracking-widest bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                        {generatedCode}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div>Score Progress</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="session" stroke="#64748b" /><YAxis domain={[0, 100]} stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }}/>
                        <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20">
                  <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full"></div>Domain Performance</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={domainData} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" domain={[0, 100]} stroke="#64748b" /><YAxis type="category" dataKey="domain" width={120} interval={0} stroke="#64748b" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px' }}/>
                        <Bar dataKey="percentage" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div>Recent Sessions</h3>
                </div>
                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm">
                        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200 rounded-tl-lg">Date</th><th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200">Mode</th><th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200">Score</th><th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionHistory.slice(0, 5).map((s) => (
                        <tr key={s.id} className="border-t border-gray-100 dark:border-gray-600/30">
                          <td className="p-4 text-gray-800 dark:text-gray-200">{new Date(s.date).toLocaleDateString()}</td>
                          <td className="p-4"><span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">{s.mode.replace('-', ' ')}</span></td>
                          <td className="p-4 font-bold text-gray-800 dark:text-gray-200"><span className={`${s.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>{s.percentage}%</span></td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button onClick={() => { setSessionToReview(s); setCurrentMode('review-session'); }} className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                                Review
                              </button>
                              <button onClick={() => handleDeleteSession(s.id)} className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/20 p-4">
          <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={() => setCurrentMode('setup')} className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"><BookOpen className="w-5 h-5" /><span className="hidden sm:inline">Practice Mode</span><span className="sm:hidden">Practice</span></button>
            <button onClick={() => setCurrentMode('exam-setup')} className="group bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"><Award className="w-5 h-5" /><span className="hidden sm:inline">Exam Mode</span><span className="sm:hidden">Exam</span></button>
            <button onClick={() => startPracticeMode(incorrectToReview, 'practice-incorrect')} disabled={incorrectToReview.length === 0} className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:from-gray-400 disabled:to-gray-500"><RotateCcw className="w-5 h-5" /><span className="hidden lg:inline">Review Incorrect</span><span className="lg:hidden">Incorrect</span><span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">({incorrectToReview.length})</span></button>
            <button onClick={() => startPracticeMode(bookmarkedToReview, 'practice-bookmarked')} disabled={bookmarkedToReview.length === 0} className="group bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:from-gray-400 disabled:to-gray-500"><Bookmark className="w-5 h-5" /><span className="hidden lg:inline">Review Bookmarked</span><span className="lg:hidden">Bookmarked</span><span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">({bookmarkedToReview.length})</span></button>
          </div>
        </div>
      </div>
    );
  }

  if (currentMode === 'practice' || currentMode === 'practice-incorrect' || currentMode === 'practice-bookmarked' || currentMode === 'exam' || currentMode === 'assessment') {
    const currentQ = questions[currentQuestion];
    if (!currentQ) return null;

    const isExamMode = currentMode === 'exam';
    const isPracticeMode = currentMode.startsWith('practice');
    const selectedAnswer = selectedAnswers[currentQ.id];
    const showExplanation = isPracticeMode && selectedAnswer !== undefined;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  {isExamMode ? <Award className="w-6 h-6 text-red-500" /> : <BookOpen className="w-6 h-6 text-blue-500" />}
                  {isExamMode ? 'CISA Exam Mode' : 'Practice Session'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Question {currentQuestion + 1} of {questions.length} • {currentQ.domain}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {isExamMode && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-mono">
                    <Clock className="w-5 h-5" />
                    {formatTime(timeRemaining)}
                  </div>
                )}
                <button onClick={handleHomeClick} title="Back to Dashboard" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                  <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button onClick={() => toggleBookmark(currentQ.id)} className={`p-2 rounded-lg ${bookmarkedQuestions.has(currentQ.id) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Bookmark className="w-5 h-5" />
                </button>
                <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                  {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Difficulty:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div key={level} className={`w-2 h-2 rounded-full ${level <= currentQ.difficulty ? 'bg-orange-400' : 'bg-gray-200 dark:bg-gray-600'}`} />
                  ))}
                </div>
              </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 leading-relaxed mb-6">
              {currentQ.question}
            </h2>
            <div className="space-y-3 mb-6">
              {currentQ.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQ.correctAnswer;
                let buttonClass = "w-full p-4 text-left rounded-xl border-2 ";
                if (showExplanation) {
                  if (isCorrect) buttonClass += "bg-green-100 border-green-400";
                  else if (isSelected) buttonClass += "bg-red-100 border-red-400";
                  else buttonClass += "bg-gray-50 border-gray-200";
                } else {
                  if (isSelected) buttonClass += "bg-blue-100 border-blue-400";
                  else buttonClass += "bg-white hover:bg-gray-50 border-gray-200";
                }
                return (
                  <button key={index} onClick={() => handleAnswerSelect(currentQ.id, index)} disabled={showExplanation} className={buttonClass}>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {showExplanation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Explanation</h4>
                    <Explanation text={currentQ.explanation} correctAnswerIndex={currentQ.correctAnswer} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6">
            <div className="flex justify-between items-center">
              <button onClick={handlePreviousQuestion} disabled={currentQuestion === 0} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button onClick={handleNextQuestion} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
                {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentMode === 'review-session' && sessionToReview) {
    const reviewQuestions = allQuestions.filter(q => sessionToReview.questionIds.includes(q.id));
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-6 mb-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reviewing Session</h1>
                <button onClick={() => setCurrentMode('analytics')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
                    <Home className="w-4 h-4" />
                    Back to Dashboard
                </button>
            </div>
          </div>
          <div className="space-y-6">
            {reviewQuestions.map((q, index) => {
              const selectedAnswerIndex = sessionToReview.selectedAnswers[q.id];
              return (
                <div key={q.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Question {index + 1}: {q.question}
                  </h2>
                  <div className="space-y-3 mb-4">
                    {q.options.map((option, optIndex) => {
                      let optionClass = "w-full p-3 text-left rounded-lg border ";
                      if (optIndex === q.correctAnswer) optionClass += "bg-green-100 border-green-300";
                      else if (optIndex === selectedAnswerIndex) optionClass += "bg-red-100 border-red-300";
                      else optionClass += "bg-gray-50 border-gray-200";
                      return (
                        <div key={optIndex} className={optionClass}>
                            <span>{String.fromCharCode(65 + optIndex)}. </span>{option}
                        </div>
                      );
                    })}
                  </div>
                   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Explanation</h4>
                        <Explanation text={q.explanation} correctAnswerIndex={q.correctAnswer} />
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (currentMode === 'results' && lastSessionResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 p-4 flex items-center justify-center">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Session Complete!</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <p className="text-sm font-medium text-blue-600 mb-1">Final Score</p>
                <p className="text-4xl font-bold text-blue-700">{lastSessionResults.percentage}%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                <p className="text-sm font-medium text-purple-600 mb-1">Time Spent</p>
                <p className="text-4xl font-bold text-purple-700">{lastSessionResults.timeSpent} min</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                <p className="text-sm font-medium text-green-600 mb-1">Correct Answers</p>
                <p className="text-4xl font-bold text-green-700">{lastSessionResults.correctAnswers}/{lastSessionResults.totalQuestions}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setCurrentMode('analytics')} className="flex-1 bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Dashboard
              </button>
              <button onClick={() => setCurrentMode('setup')} className="flex-1 bg-green-500 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Practice Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Loading...</h2>
      </div>
    </div>
  );
};

// --- 4. TOP-LEVEL APP COMPONENT (CONTROLLER) ---
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialProgress, setInitialProgress] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          const defaultProgress = {
            sessionHistory: [],
            domainPerformance: {},
            questionPerformance: {},
            bookmarkedQuestions: new Set(),
            incorrectlyAnswered: new Set(),
            examDate: null,
            studyPlan: [],
            isDarkMode: false
          };
          if (docSnap.exists()) {
            const data = docSnap.data();
            const convertedData = convertArraysToSets(data);
            setInitialProgress({
              ...defaultProgress,
              ...convertedData,
            });
          } else {
            const firestoreData = convertSetsToArrays(defaultProgress);
            firestoreData.createdAt = new Date().toISOString();
            firestoreData.email = currentUser.email;
            await setDoc(userDocRef, firestoreData);
            setInitialProgress(defaultProgress);
          }
        } catch (error) {
          console.error("Error loading/creating user progress:", error);
          setInitialProgress({
            sessionHistory: [],
            domainPerformance: {},
            questionPerformance: {},
            bookmarkedQuestions: new Set(),
            incorrectlyAnswered: new Set(),
            examDate: null,
            studyPlan: [],
            isDarkMode: false
          });
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setInitialProgress(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading || (user && !initialProgress)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <CISAPracticeApp user={user} initialProgress={initialProgress} /> : <Login />;
};

export default App;
