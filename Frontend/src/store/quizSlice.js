import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Quiz creation / studio draft state
  generatedQuestions: [],
  quizDraft: {
    title: '',
    startTime: '',
    duration: 15, // default 15 mins
    scoreOnCorrect: 1,
    scoreOnIncorrect: 0,
  },
  
  // Live quiz session state
  activeQuizId: null,
  liveQuestions: [],
  attemptedQuestions: {}, // Map of questionId -> { selectedOption, isCorrect, submittedAt }
  userScore: 0,
  leaderboard: [],
  quizStatus: 'idle', // 'idle' | 'live' | 'completed' | 'error'
  currentQuestionIndex: 0,
  timerSecondsRemaining: 0,
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setGeneratedQuestions: (state, action) => {
      state.generatedQuestions = action.payload;
    },
    updateQuestionInDraft: (state, action) => {
      const { index, updatedQuestion } = action.payload;
      if (state.generatedQuestions[index]) {
        state.generatedQuestions[index] = { ...state.generatedQuestions[index], ...updatedQuestion };
      }
    },
    addQuestionToDraft: (state, action) => {
      state.generatedQuestions.push(action.payload);
    },
    removeQuestionFromDraft: (state, action) => {
      state.generatedQuestions.splice(action.payload, 1);
    },
    setQuizDraftMeta: (state, action) => {
      state.quizDraft = { ...state.quizDraft, ...action.payload };
    },
    clearQuizDraft: (state) => {
      state.generatedQuestions = [];
      state.quizDraft = {
        title: '',
        startTime: '',
        duration: 15,
        scoreOnCorrect: 1,
        scoreOnIncorrect: 0,
      };
    },

    // Live Quiz Actions
    initLiveQuiz: (state, action) => {
      const { quizId, questions, leaderboard } = action.payload;
      state.activeQuizId = quizId;
      state.liveQuestions = questions || [];
      state.leaderboard = leaderboard || [];
      state.quizStatus = 'live';
      state.currentQuestionIndex = 0;

      // Extract existing responses if reconnecting
      const existingAttempts = {};
      (questions || []).forEach((q) => {
        if (q.response) {
          try {
            const parsed = typeof q.response === 'string' ? JSON.parse(q.response) : q.response;
            existingAttempts[q._id || q.id] = parsed;
          } catch (e) {
            // silent parse fallback
          }
        }
      });
      state.attemptedQuestions = existingAttempts;
    },
    recordAttempt: (state, action) => {
      const { questionId, selectedOption, isCorrect, scoreDelta } = action.payload;
      state.attemptedQuestions[questionId] = {
        selectedOption,
        isCorrect,
        submittedAt: new Date().toISOString(),
      };
      if (scoreDelta !== undefined) {
        state.userScore += scoreDelta;
      }
    },
    updateLeaderboard: (state, action) => {
      state.leaderboard = action.payload;
    },
    setCurrentQuestionIndex: (state, action) => {
      state.currentQuestionIndex = action.payload;
    },
    setQuizCompleted: (state) => {
      state.quizStatus = 'completed';
    },
    resetLiveQuizState: (state) => {
      state.activeQuizId = null;
      state.liveQuestions = [];
      state.attemptedQuestions = {};
      state.userScore = 0;
      state.leaderboard = [];
      state.quizStatus = 'idle';
      state.currentQuestionIndex = 0;
      state.timerSecondsRemaining = 0;
    },
  },
});

export const {
  setGeneratedQuestions,
  updateQuestionInDraft,
  addQuestionToDraft,
  removeQuestionFromDraft,
  setQuizDraftMeta,
  clearQuizDraft,
  initLiveQuiz,
  recordAttempt,
  updateLeaderboard,
  setCurrentQuestionIndex,
  setQuizCompleted,
  resetLiveQuizState,
} = quizSlice.actions;

export default quizSlice.reducer;
