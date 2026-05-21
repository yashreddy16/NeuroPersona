import React, { useState } from 'react';

// Questions matching our scientific BFI-10 scoring engine
const QUESTIONS = [
  { id: 'q1', trait: 'Openness (+)', text: 'I have a vivid imagination.' },
  { id: 'q2', trait: 'Openness (-)', text: 'I prefer routine over new experiences.' },
  { id: 'q3', trait: 'Conscientiousness (+)', text: 'I am always prepared and organized.' },
  { id: 'q4', trait: 'Conscientiousness (-)', text: 'I often leave my chores undone.' },
  { id: 'q5', trait: 'Extraversion (+)', text: 'I am the life of the party.' },
  { id: 'q6', trait: 'Extraversion (-)', text: 'I feel uncomfortable or quiet around strangers.' },
  { id: 'q7', trait: 'Agreeableness (+)', text: 'I sympathize with others\' feelings.' },
  { id: 'q8', trait: 'Agreeableness (-)', text: 'I sometimes insult or clash with people.' },
  { id: 'q9', trait: 'Neuroticism (+)', text: 'I get stressed or anxious easily.' },
  { id: 'q10', trait: 'Neuroticism (-)', text: 'I remain calm and relaxed in tense situations.' },
];

export default function App() {
  // State management
  const [currentStep, setCurrentStep] = useState(0); // 0 = Welcome, 1 = Quiz, 2 = Loading, 3 = Results
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);

  // Restart the quiz
  const handleRestart = () => {
    setAnswers({});
    setCurrentQuestionIdx(0);
    setResults(null);
    setError(null);
    setCurrentStep(0);
  };

  // Start the quiz
  const handleStart = () => {
    setCurrentStep(1);
  };

  // Handle selecting an answer rating (1-5)
  const handleSelectAnswer = (rating) => {
    const questionId = QUESTIONS[currentQuestionIdx].id;
    const updatedAnswers = { ...answers, [questionId]: rating };
    setAnswers(updatedAnswers);

    // If there are more questions, go to next
    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Last question completed, trigger calculation and AI generation
      submitQuiz(updatedAnswers);
    }
  };

  // Navigate backwards in the quiz if needed
  const handlePreviousQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };

  // Send quiz responses to our local FastAPI backend
  const submitQuiz = async (finalAnswers) => {
    setCurrentStep(2);
    setLoadingMessage("Calibrating psychometric engine...");
    
    // Simulate thinking states to improve user experience
    const loadingStates = [
      "Calculating Big Five traits...",
      "Analyzing personality clusters...",
      "Connecting to Google Gemini AI Engine...",
      "Generating customized self-development roadmap...",
      "Finalizing reports..."
    ];

    let stateIdx = 0;
    const interval = setInterval(() => {
      if (stateIdx < loadingStates.length) {
        setLoadingMessage(loadingStates[stateIdx]);
        stateIdx++;
      }
    }, 1200);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalAnswers),
      });

      clearInterval(interval);

      if (!response.ok) {
        throw new Error('Server responded with an error. Ensure your FastAPI server is running!');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setResults(data);
        setCurrentStep(3);
      } else {
        throw new Error('Invalid backend data format received.');
      }
    } catch (err) {
      clearInterval(interval);
      setError(err.message);
      setCurrentStep(0); // Return to home to handle retry
    }
  };

  // Helper colors for the OCEAN progress meters
  const traitColors = {
    Openness: "bg-indigo-500 shadow-indigo-500/20",
    Conscientiousness: "bg-emerald-500 shadow-emerald-500/20",
    Extraversion: "bg-amber-500 shadow-amber-500/20",
    Agreeableness: "bg-cyan-500 shadow-cyan-500/20",
    Neuroticism: "bg-rose-500 shadow-rose-500/20"
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-extrabold text-sm tracking-widest">NP</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                NeuroPersona AI
              </h1>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Academic Prototype</span>
            </div>
          </div>
          {currentStep === 3 && (
            <button 
              onClick={handleRestart}
              className="px-4 py-2 text-xs font-semibold tracking-wide border border-slate-700 hover:border-slate-500 bg-slate-900 hover:bg-slate-800 rounded-lg transition-all duration-200"
            >
              Retake Quiz
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm">
              <span>⚠️ Connection Error:</span>
            </div>
            <p className="text-xs text-rose-300/90 leading-relaxed">{error}</p>
            <p className="text-[11px] text-slate-400">Please verify that your FastAPI local backend is active (running `uvicorn main:app --reload` on port 8000) and try again.</p>
          </div>
        )}

        {/* STEP 0: Welcome Screen */}
        {currentStep === 0 && (
          <div className="max-w-2xl mx-auto text-center py-8">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
              AI-Powered Cognitive Mapping
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
              Uncover Your Psychological Architecture
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-10">
              NeuroPersona AI integrates the validated scientific standard <strong className="text-indigo-400">Big Five (BFI-10)</strong> questionnaire with Google Gemini to outline your personality percentages and build a customized, 30-day self-development roadmap.
            </p>
            <button 
              onClick={handleStart}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Begin Personality Diagnosis
            </button>
            <div className="mt-12 text-xs text-slate-500">
              Takes approximately 60 seconds • 10 Scientifically-validated questions
            </div>
          </div>
        )}

        {/* STEP 1: Interactive Quiz Mode */}
        {currentStep === 1 && (
          <div className="max-w-xl mx-auto w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-xl">
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mb-8 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIdx + 1) / QUESTIONS.length) * 100}%` }}
              ></div>
            </div>

            {/* Steps indicator */}
            <div className="flex justify-between items-center text-xs text-slate-400 font-semibold mb-6">
              <span>Question {currentQuestionIdx + 1} of {QUESTIONS.length}</span>
              <span className="text-indigo-400 uppercase tracking-widest text-[10px]">
                {QUESTIONS[currentQuestionIdx].trait.split(' ')[0]}
              </span>
            </div>

            {/* Question Text */}
            <div className="min-h-[100px] flex items-center justify-center mb-10">
              <p className="text-2xl font-bold text-center text-white leading-relaxed">
                "{QUESTIONS[currentQuestionIdx].text}"
              </p>
            </div>

            {/* Interactive Likert Scale (Ratings 1-5) */}
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2 md:gap-4 mb-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleSelectAnswer(rating)}
                    className="aspect-square flex flex-col items-center justify-center rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-bold text-lg md:text-xl border border-slate-700/50 hover:border-indigo-400 shadow-md transform hover:-translate-y-1 active:translate-y-0 transition-all duration-150"
                  >
                    {rating}
                  </button>
                ))}
              </div>
              
              {/* Likert Scale Labels */}
              <div className="flex justify-between text-[11px] text-slate-500 font-bold px-1">
                <span>STRONGLY DISAGREE</span>
                <span>STRONGLY AGREE</span>
              </div>
            </div>

            {/* Navigation back */}
            {currentQuestionIdx > 0 && (
              <button
                onClick={handlePreviousQuestion}
                className="mt-8 text-xs text-slate-400 hover:text-white font-semibold transition-colors flex items-center space-x-1"
              >
                <span>← Previous Question</span>
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Loading Analysis Screen */}
        {currentStep === 2 && (
          <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center justify-center">
            {/* Spinning Indicator */}
            <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-8"></div>
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Responses</h3>
            <p className="text-sm text-slate-400 italic animate-pulse">{loadingMessage}</p>
          </div>
        )}

        {/* STEP 3: Beautiful AI Result Dashboard */}
        {currentStep === 3 && results && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Archetype Header Card */}
            <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-950/50 to-slate-900/80 border border-indigo-900/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-48 w-48 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
              <span className="text-[10px] tracking-widest font-bold uppercase text-indigo-400 mb-2 block">Your AI Personality Archetype</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                {results.insights.archetype}
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base max-w-4xl">
                {results.insights.description}
              </p>
            </div>

            {/* Two-Column Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Personality Percentages */}
              <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                  <span>Calculated Trait Scores</span>
                  <span className="text-xs text-slate-500 font-normal">BFI-10 Standard</span>
                </h3>
                
                <div className="space-y-6">
                  {Object.entries(results.scores).map(([trait, score]) => (
                    <div key={trait} className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-300">{trait}</span>
                        <span className="text-slate-100">{score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${traitColors[trait] || "bg-indigo-500"}`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Strengths & Bottlenecks */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Primary Strengths */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold tracking-widest text-emerald-400 uppercase mb-4 flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    <span>Core Strengths</span>
                  </h3>
                  <ul className="space-y-4">
                    {results.insights.strengths.map((strength, index) => (
                      <li key={index} className="flex space-x-3 items-start">
                        <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span className="text-slate-300 text-xs leading-relaxed">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Core Challenges */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold tracking-widest text-rose-400 uppercase mb-4 flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                    <span>Bottlenecks & Struggles</span>
                  </h3>
                  <ul className="space-y-4">
                    {results.insights.challenges.map((challenge, index) => (
                      <li key={index} className="flex space-x-3 items-start">
                        <span className="text-rose-400 text-xs font-bold bg-rose-500/10 h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                          !
                        </span>
                        <span className="text-slate-300 text-xs leading-relaxed">{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>

            {/* 30-Day Developmental Roadmap Card */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <div className="mb-4 md:mb-0">
                  <span className="text-[10px] tracking-widest font-bold uppercase text-indigo-400 block mb-1">Tailored Action Plan</span>
                  <h3 className="text-xl font-extrabold text-white">Your Actionable 30-Day Development Plan</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Gemini Generated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.insights.roadmap.map((phase, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-950 rounded-xl p-5 flex flex-col justify-between transition-all duration-200">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase">
                          Phase {idx + 1}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">10 Days</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-4 border-l-2 border-indigo-500 pl-2 leading-snug">
                        {phase.area}
                      </h4>
                      <ul className="space-y-3">
                        {phase.actionable_steps.map((step, sIdx) => (
                          <li key={sIdx} className="text-xs text-slate-400 leading-relaxed flex items-start space-x-2">
                            <span className="text-indigo-400 font-extrabold mt-0.5">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} NeuroPersona AI. Designed for Academic Project Presentation.</p>
      </footer>
    </div>
  );
}