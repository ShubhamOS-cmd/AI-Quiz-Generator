import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setGeneratedQuestions, setQuizDraftMeta, clearQuizDraft } from '../store/quizSlice';
import { quizApi } from '../services/api';
import { Sparkles, Plus, Trash2, Edit3, CheckCircle2, AlertCircle, Save, Clock, Calendar, Copy, ChevronRight, Sliders, ShieldAlert } from 'lucide-react';

export default function CreateQuiz() {
  const { generatedQuestions, quizDraft } = useSelector((state) => state.quiz);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Generator Config state
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [number, setNumber] = useState(5);
  const [numberOfOptions, setNumberOfOptions] = useState(4);
  const [defaultPositiveScore, setDefaultPositiveScore] = useState(1);
  const [defaultNegativeScore, setDefaultNegativeScore] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Save Modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [startTime, setStartTime] = useState(new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16));
  const [duration, setDuration] = useState(15);
  const [saving, setSaving] = useState(false);
  const [savedQuizId, setSavedQuizId] = useState(null);

  const presets = ['JavaScript ES6 & Async', 'Python Data Structures', 'Quantum Computing', 'World War II History', 'React Hooks & State'];

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a valid topic.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const res = await quizApi.generateQuiz({
        topic: topic.trim(),
        difficulty,
        number: Number(number),
        numberOfOptions: Number(numberOfOptions),
      });

      const rawQuestions = res.data?.data || [];

      // Transform into schema format with default positive and negative scores
      const formatted = rawQuestions.map((q, idx) => ({
        questionText: q.question || q.questionText || '',
        options: (q.options || []).map(opt => ({ text: typeof opt === 'string' ? opt : opt.text || String(opt) })),
        correctOption: q.correctOption,
        explanation: q.Explanation || q.explanation || '',
        scoreOnCorrect: Number(defaultPositiveScore) || 1,
        scoreOnIncorrect: Number(defaultNegativeScore) || 0,
        order: idx + 1,
      }));

      dispatch(setGeneratedQuestions(formatted));
      setQuizTitle(`Quiz on ${topic}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate quiz. Ensure topic is clear and valid.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...generatedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    dispatch(setGeneratedQuestions(updated));
  };

  const handleUpdateOption = (qIndex, oIndex, value) => {
    const updated = [...generatedQuestions];
    const newOptions = [...updated[qIndex].options];
    newOptions[oIndex] = { text: value };
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    dispatch(setGeneratedQuestions(updated));
  };

  const handleAddOption = (qIndex) => {
    const updated = [...generatedQuestions];
    if (updated[qIndex].options.length < 6) {
      updated[qIndex].options.push({ text: `Option ${updated[qIndex].options.length + 1}` });
      dispatch(setGeneratedQuestions(updated));
    }
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updated = [...generatedQuestions];
    if (updated[qIndex].options.length > 2) {
      updated[qIndex].options.splice(oIndex, 1);
      dispatch(setGeneratedQuestions(updated));
    }
  };

  const handleRemoveQuestion = (index) => {
    const updated = [...generatedQuestions];
    updated.splice(index, 1);
    dispatch(setGeneratedQuestions(updated));
  };

  const handleAddQuestion = () => {
    const newQ = {
      questionText: 'New Question',
      options: [{ text: 'Option 1' }, { text: 'Option 2' }, { text: 'Option 3' }, { text: 'Option 4' }],
      correctOption: 'Option 1',
      explanation: '',
      scoreOnCorrect: Number(defaultPositiveScore) || 1,
      scoreOnIncorrect: Number(defaultNegativeScore) || 0,
      order: generatedQuestions.length + 1,
    };
    dispatch(setGeneratedQuestions([...generatedQuestions, newQ]));
  };

  const handleSaveQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizTitle.trim() || generatedQuestions.length === 0) return;

    setSaving(true);
    setError('');

    try {
      // Backend validation format check
      const payload = {
        title: quizTitle.trim(),
        startTime: new Date(startTime).toISOString(),
        duration: Number(duration),
        questions: generatedQuestions.map(q => ({
          questionText: q.questionText,
          options: q.options.map(o => typeof o === 'string' ? { text: o } : o),
          correctOption: q.correctOption,
          explanation: q.explanation || '',
          scoreOnCorrect: Number(q.scoreOnCorrect) || 1,
          scoreOnIncorrect: Number(q.scoreOnIncorrect) || 0,
        })),
      };

      const res = await quizApi.saveQuiz(payload);
      const newQuizId = res.data?.data?.quizId;
      setSavedQuizId(newQuizId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save quiz. Check start time and questions format.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Quiz Studio & Marking Configuration
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Generate & Host Quizzes</h1>
        </div>

        {generatedQuestions.length > 0 && (
          <button
            onClick={() => setSaveModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Schedule Quiz ({generatedQuestions.length} Qs)</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Configurator Panel */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          AI Generator & Marking Parameters
        </h3>

        <form onSubmit={handleGenerate} className="space-y-6">

          {/* Topic Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Quiz Topic / Subject
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Machine Learning Algorithms, World History, JavaScript ES6"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-slate-500 flex items-center">Presets:</span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700/60 text-xs transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="difficult">Difficult</option>
              </select>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Positive Score */}
            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                Marks on Correct (+pt)
              </label>
              <input
                type="number"
                min={1}
                value={defaultPositiveScore}
                onChange={(e) => setDefaultPositiveScore(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-900/90 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Negative Score */}
            <div>
              <label className="block text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                Penalty on Incorrect (-pt)
              </label>
              <input
                type="number"
                min={0}
                value={defaultNegativeScore}
                onChange={(e) => setDefaultNegativeScore(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-900/90 border border-red-500/40 rounded-xl text-red-300 font-bold text-sm focus:outline-none focus:border-red-500"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={generating || !topic.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-base shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin text-amber-300" />
                <span>Validating Topic & Generating Questions with Groq AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-white" />
                <span>Generate Questions via Groq AI</span>
              </>
            )}
          </button>

        </form>
      </div>

      {/* Questions Preview & Customization Editor */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-400" />
              Generated Questions Studio ({generatedQuestions.length})
            </h3>

            <button
              onClick={handleAddQuestion}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Plus className="w-4 h-4" />
              Add Custom Question
            </button>
          </div>

          <div className="space-y-6">
            {generatedQuestions.map((q, qIdx) => (
              <div key={qIdx} className="glass-card rounded-3xl p-6 border border-slate-800 relative">

                {/* Header info */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <span className="font-extrabold text-sm text-indigo-400">
                    Question #{qIdx + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-400 font-semibold">+Score:</span>
                      <input
                        type="number"
                        min={1}
                        value={q.scoreOnCorrect}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'scoreOnCorrect', e.target.value)}
                        className="w-14 px-2 py-1 bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg text-center"
                      />
                      <span className="text-red-400 font-semibold ml-2">-Score:</span>
                      <input
                        type="number"
                        min={0}
                        value={q.scoreOnIncorrect}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'scoreOnIncorrect', e.target.value)}
                        className="w-14 px-2 py-1 bg-slate-900 border border-red-500/40 text-red-300 text-xs font-bold rounded-lg text-center"
                      />
                    </div>

                    <button
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Question Prompt</label>
                  <input
                    type="text"
                    value={q.questionText}
                    onChange={(e) => handleUpdateQuestion(qIdx, 'questionText', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2.5 mb-4">
                  <label className="block text-xs font-semibold text-slate-400">Options (Select correct option radio)</label>
                  {q.options.map((opt, oIdx) => {
                    const optText = typeof opt === 'string' ? opt : opt.text;
                    const isCorrect = (typeof q.correctOption === 'string' ? q.correctOption : q.correctOption?.text) === optText;

                    return (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-opt-${qIdx}`}
                          checked={isCorrect}
                          onChange={() => handleUpdateQuestion(qIdx, 'correctOption', optText)}
                          className="w-4 h-4 accent-indigo-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={optText}
                          onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                          className={`flex-1 px-3.5 py-2 bg-slate-900 border rounded-xl text-xs text-white ${isCorrect ? 'border-emerald-500/80 bg-emerald-500/5 font-semibold' : 'border-slate-800'
                            }`}
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(qIdx, oIdx)}
                            className="text-slate-600 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {q.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIdx)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  )}
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Explanation (Optional)</label>
                  <input
                    type="text"
                    placeholder="Provide reasoning for correct answer"
                    value={q.explanation || ''}
                    onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
                  />
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Quiz Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 lg:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">

            {!savedQuizId ? (
              <form onSubmit={handleSaveQuizSubmit} className="space-y-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  Schedule & Host Quiz
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    required
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setSaveModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20"
                  >
                    {saving ? 'Saving Quiz...' : 'Publish & Host Now'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-5 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Quiz Published!</h3>
                  <p className="text-xs text-slate-400 mt-1">Share this Quiz ID with participants to join the live session.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-sm text-indigo-300">
                  <span className="truncate">{savedQuizId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(savedQuizId);
                      alert('Quiz ID copied!');
                    }}
                    className="p-2 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      dispatch(clearQuizDraft());
                      setSaveModalOpen(false);
                      setSavedQuizId(null);
                    }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Create Another
                  </button>
                  <button
                    onClick={() => navigate(`/quiz/${savedQuizId}`)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>Enter Live Arena</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
