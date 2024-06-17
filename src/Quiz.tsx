import React, { useState, useEffect } from "react";
import { quizData } from "./quizData";
import screenfull from "screenfull";

const Quiz: React.FC = () => {
  // Initialize quiz state from localStorage or default values
  const initialProgress = localStorage.getItem("quizProgress");
  const initialProgressState = initialProgress
    ? JSON.parse(initialProgress)
    : {
        activeQuestion: 0,
        selectedAnswer: "",
        checked: false,
        selectedAnswerIndex: null,
        showResults: false,
        results: { score: 0, correctAnswers: 0, wrongAnswers: 0 },
        isFullscreen: false,
        quizTimeRemaining: 600, // 10 minutes in seconds
        quizTimerRunning: false,
        timestamp: Date.now(),
      };

  // Quiz state
  const [activeQuestion, setActiveQuestion] = useState<number>(
    initialProgressState.activeQuestion || 0
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string>(
    initialProgressState.selectedAnswer || ""
  );
  const [checked, setChecked] = useState<boolean>(
    initialProgressState.checked || false
  );
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(
    initialProgressState.selectedAnswerIndex || null
  );
  const [showResults, setShowResults] = useState<boolean>(
    initialProgressState.showResults || false
  );
  const [results, setResults] = useState<{
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
  }>({
    score: initialProgressState.results?.score || 0,
    correctAnswers: initialProgressState.results?.correctAnswers || 0,
    wrongAnswers: initialProgressState.results?.wrongAnswers || 0,
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    initialProgressState.isFullscreen || false
  );

  // Overall quiz timer state
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number>(
    initialProgressState.quizTimeRemaining || 600
  );
  const [quizTimerRunning, setQuizTimerRunning] = useState<boolean>(
    initialProgressState.quizTimerRunning || false
  );
  const [timestamp, setTimestamp] = useState<number>(
    initialProgressState.timestamp || Date.now()
  );

  // State to manage whether "Enter Quiz" button should be visible

  useEffect(() => {
    // Subscribe to fullscreen change events
    if (screenfull.isEnabled) {
      screenfull.on("change", handleFullscreenChange);
    }

    return () => {
      // Cleanup: Unsubscribe from fullscreen change events
      if (screenfull.isEnabled) {
        screenfull.off("change", handleFullscreenChange);
      }
    };
  }, []); // Only run on component mount

  useEffect(() => {
    // Save quiz progress to localStorage
    localStorage.setItem(
      "quizProgress",
      JSON.stringify({
        activeQuestion,
        selectedAnswer,
        checked,
        selectedAnswerIndex,
        showResults,
        results,
        isFullscreen,
        quizTimeRemaining,
        quizTimerRunning,
        timestamp,
      })
    );
  }, [
    activeQuestion,
    selectedAnswer,
    checked,
    selectedAnswerIndex,
    showResults,
    results,
    isFullscreen,
    quizTimeRemaining,
    quizTimerRunning,
    timestamp,
  ]);

  useEffect(() => {
    // Handle overall quiz timer countdown
    let quizTimer: any | undefined = undefined;
    if (quizTimerRunning && quizTimeRemaining > 0) {
      quizTimer = setTimeout(() => {
        setQuizTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (quizTimeRemaining === 0) {
      handleQuizTimeUp(); // Overall quiz timer has reached zero
    }

    return () => {
      if (quizTimer) clearTimeout(quizTimer);
    };
  }, [quizTimeRemaining, quizTimerRunning]);

  const handleFullscreenChange = () => {
    setIsFullscreen(screenfull.isFullscreen);
    if (!screenfull.isFullscreen) {
      setShowResults(false); // Reset quiz state on exit
    }
  };

  const startQuizTimer = () => {
    setQuizTimerRunning(true);
    setTimestamp(Date.now()); // Update timestamp to current time
  };

  const stopQuizTimer = () => {
    setQuizTimerRunning(false);
  };

  const resetQuizTimer = () => {
    setQuizTimeRemaining(600); // Reset overall quiz timer to 10 minutes
  };

  const handleQuizTimeUp = () => {
    stopQuizTimer();
    setShowResults(true); // Automatically show results when overall quiz time is up
  };

  const onAnswerSelected = (answer: string, idx: number) => {
    setChecked(true);
    setSelectedAnswerIndex(idx);
    if (answer === quizData[activeQuestion].answer) {
      setSelectedAnswer(answer);
    } else {
      setSelectedAnswer("");
    }
  };

  const nextQuestion = () => {
    setSelectedAnswerIndex(null);
    setResults((prev) =>
      selectedAnswer
        ? {
            ...prev,
            score: prev.score + 1,
            correctAnswers: prev.correctAnswers + 1,
          }
        : {
            ...prev,
            wrongAnswers: prev.wrongAnswers + 1,
          }
    );
    if (activeQuestion < quizData.length - 1) {
      setActiveQuestion((prev) => prev + 1);
    } else {
      handleQuizTimeUp(); // Show results when all questions are answered
    }
    setChecked(false);
  };

  const handleFullscreenToggle = () => {
    if (screenfull.isEnabled) {
      if (screenfull.isFullscreen) {
        screenfull.exit();
      } else {
        screenfull.request();
      }
    }
  };

  const handleRestartQuiz = () => {
    localStorage.removeItem("quizProgress");
    setActiveQuestion(0);
    setSelectedAnswer("");
    setChecked(false);
    setSelectedAnswerIndex(null);
    setShowResults(false);
    setResults({ score: 0, correctAnswers: 0, wrongAnswers: 0 });
    resetQuizTimer();
    startQuizTimer();
  };

  useEffect(() => {
    // Check if there are previous results in localStorage to determine if the quiz was finished
    if (initialProgressState.showResults) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center overflow-y-auto justify-center">
      <div className="max-w-xl w-full bg-white shadow-lg rounded-lg p-8">
        {!showResults && isFullscreen ? (
          <>
            <div className="flex justify-between mb-6 gap-2">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-md">
                <h2 className="text-lg font-semibold">
                  Question: {activeQuestion + 1}/{quizData.length}
                </h2>
              </div>
              <div className="bg-blue-500 text-white px-4 py-2 rounded-md">
                <p className="text-lg font-semibold">
                  Time Remaining: {Math.floor(quizTimeRemaining / 60)}:
                  {("0" + (quizTimeRemaining % 60)).slice(-2)}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                {quizData[activeQuestion].question}
              </h3>
              <ul className="space-y-2">
                {quizData[activeQuestion].options.map((option, idx) => (
                  <li
                    key={idx}
                    className={`cursor-pointer py-2 px-4 rounded-md transition duration-300 ease-in-out ${
                      selectedAnswerIndex === idx
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                    onClick={() => onAnswerSelected(option, idx)}
                  >
                    <span className="text-base">{option}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={nextQuestion}
                disabled={!checked}
                className={`mt-6 py-2 px-4 rounded-md font-semibold text-white transition duration-300 ${
                  checked
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {activeQuestion === quizData.length - 1
                  ? "Finish"
                  : "Next Question →"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">Results 📊</h3>
            <p className="mb-4 text-lg">
              You scored <span className="font-bold">{results.score}</span> out
              of <span className="font-bold">{quizData.length}</span>
            </p>
            <div className="flex justify-center space-x-4">
              <div>
                <p className="text-sm text-gray-600">Correct Answers</p>
                <p className="font-bold">{results.correctAnswers}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Wrong Answers</p>
                <p className="font-bold">{results.wrongAnswers}</p>
              </div>
            </div>
            <button
              onClick={handleRestartQuiz}
              className="mt-6 py-2 px-4 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 transition duration-300"
            >
              Click here to Initialize or Restart Quiz
            </button>
            <h1 className="mt-4 text-lg font-bold text-gray-700">
              Begin or Complete the Quiz by Clicking on Enter Quiz
            </h1>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleFullscreenToggle}
            className="py-2 px-4 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 transition duration-300"
          >
            {screenfull.isEnabled && screenfull.isFullscreen
              ? "Exit Quiz"
              : "Enter Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
