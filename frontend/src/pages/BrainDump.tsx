import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, CheckCircle, Loader2, ArrowRight, Save, Trash2, Mic, MicOff } from 'lucide-react';
import { aiService } from '../services/aiService';
import { Task } from '../services/taskService';
import toast from 'react-hot-toast';

interface ExtractedTask extends Task {
  selected?: boolean;
}

const BrainDump: React.FC = () => {
  const navigate = useNavigate();
  const [dumpText, setDumpText] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [savedDumps, setSavedDumps] = useState<Array<{ id: string; text: string; date: Date }>>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const pendingTranscriptRef = useRef<string>(''); // Used to track listening state

  const handleExtractTasks = async () => {
    if (!dumpText.trim()) {
      toast.error('Please write something in your brain dump first!');
      return;
    }

    setIsExtracting(true);
    try {
      const response = await aiService.extractTasksFromText(dumpText);
      const tasksWithSelection = response.tasks.map(task => ({
        ...task,
        selected: true
      }));
      setExtractedTasks(tasksWithSelection);
      setShowResults(true);
      toast.success(`Extracted ${response.tasks.length} tasks from your brain dump!`);
    } catch (error: any) {
      console.error('Error extracting tasks:', error);
      toast.error(error.response?.data?.error || 'Failed to extract tasks. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setExtractedTasks(prev =>
      prev.map(task =>
        task._id === taskId ? { ...task, selected: !task.selected } : task
      )
    );
  };

  const handleCreateTasks = () => {
    const selectedTasks = extractedTasks.filter(task => task.selected);
    if (selectedTasks.length === 0) {
      toast.error('Please select at least one task to create');
      return;
    }

    // Navigate to tasks page with the selected tasks to be created
    navigate('/tasks', { state: { tasksToCreate: selectedTasks } });
  };

  const saveDump = () => {
    if (!dumpText.trim()) {
      toast.error('Nothing to save!');
      return;
    }

    const newDump = {
      id: Date.now().toString(),
      text: dumpText,
      date: new Date()
    };

    const dumps = JSON.parse(localStorage.getItem('brainDumps') || '[]');
    dumps.unshift(newDump);
    localStorage.setItem('brainDumps', JSON.stringify(dumps.slice(0, 10))); // Keep last 10
    setSavedDumps(dumps.slice(0, 10));
    toast.success('Brain dump saved!');
  };

  const loadDump = (dump: { id: string; text: string; date: Date }) => {
    setDumpText(dump.text);
    setShowResults(false);
    setExtractedTasks([]);
    toast.success('Brain dump loaded!');
  };

  const clearDump = () => {
    if (window.confirm('Are you sure you want to clear this brain dump?')) {
      setDumpText('');
      setExtractedTasks([]);
      setShowResults(false);
      toast.success('Brain dump cleared');
    }
  };

  useEffect(() => {
    const dumps = JSON.parse(localStorage.getItem('brainDumps') || '[]');
    setSavedDumps(dumps);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Disable continuous to get one clean result per session
    recognition.interimResults = false; // No interim results
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      if (!pendingTranscriptRef.current) {
        toast.success('Voice recording started. Speak now!', { icon: '🎤' });
      }
    };

    recognition.onresult = (event: any) => {
      // With continuous=false, we only get one result per start/stop cycle
      const result = event.results[0];
      if (result.isFinal) {
        const transcript = result[0].transcript.trim();
        if (transcript) {
          setDumpText(prev => prev + transcript + ' ');
        }
      }
    };

    recognition.onspeechend = () => {
      // When user stops speaking, automatically restart if still in listening mode
      recognition.stop();
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable microphone permissions.');
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart recognition if user hasn't manually stopped
      if (pendingTranscriptRef.current === 'listening') {
        try {
          setTimeout(() => recognition.start(), 100);
        } catch (error) {
          console.error('Error restarting recognition:', error);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      // Signal to stop auto-restart
      pendingTranscriptRef.current = '';
      recognitionRef.current?.stop();
      setIsListening(false);
      toast.success('Voice recording stopped', { icon: '⏸️' });
    } else {
      try {
        // Signal that we're in listening mode for auto-restart
        pendingTranscriptRef.current = 'listening';
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error('Failed to start voice recording. Please try again.');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Brain Dump</h1>
        </div>
        <p className="text-gray-600 ml-14">
          Dump all your thoughts, ideas, and to-dos here. AI will help you extract actionable tasks!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Brain Dump Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Write or Speak Your Thoughts</h2>
              <div className="flex space-x-2">
                <button
                  onClick={toggleVoiceInput}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                      : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                  }`}
                  title={isSupported ? (isListening ? 'Stop voice input' : 'Start voice input') : 'Voice input not supported'}
                  disabled={!isSupported}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-1" />
                      Voice
                    </>
                  )}
                </button>
                <button
                  onClick={saveDump}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={!dumpText.trim()}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </button>
                <button
                  onClick={clearDump}
                  className="flex items-center px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  disabled={!dumpText.trim()}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </button>
              </div>
            </div>

            <div className="relative">
              {isListening && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg shadow-lg animate-pulse">
                  <Mic className="w-4 h-4" />
                  <span className="text-sm font-medium">Listening...</span>
                </div>
              )}
              <textarea
                value={dumpText}
                onChange={(e) => setDumpText(e.target.value)}
                placeholder="Just start typing or click 'Voice' to speak... dump everything that's on your mind. Don't worry about formatting or organization - the AI will help you make sense of it all!

Examples:
- Need to finish the project proposal by Friday
- Call mom about birthday plans
- Research new marketing strategies
- Team meeting tomorrow at 2pm to discuss Q2 goals
- Fix that annoying bug in the login page
- Remember to buy groceries and pick up dry cleaning"
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-700 placeholder-gray-400"
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                {dumpText.length} characters
              </p>

              <button
                onClick={handleExtractTasks}
                disabled={isExtracting || !dumpText.trim()}
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Extracting Tasks...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Extract Tasks with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted Tasks */}
          {showResults && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Extracted Tasks ({extractedTasks.filter(t => t.selected).length} selected)
                </h2>
                <button
                  onClick={handleCreateTasks}
                  disabled={extractedTasks.filter(t => t.selected).length === 0}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Selected Tasks
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>

              {extractedTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tasks extracted yet.</p>
              ) : (
                <div className="space-y-3">
                  {extractedTasks.map((task, index) => (
                    <div
                      key={index}
                      onClick={() => toggleTaskSelection(task._id || index.toString())}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        task.selected
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircle
                            className={`w-5 h-5 ${
                              task.selected ? 'text-purple-600' : 'text-gray-400'
                            }`}
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded">
                              {task.category}
                            </span>
                            {task.estimatedTime && (
                              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 rounded">
                                {task.estimatedTime} min
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="px-2 py-1 text-xs font-medium bg-pink-100 text-pink-800 border border-pink-200 rounded">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Saved Brain Dumps Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Brain Dumps</h3>
            {savedDumps.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No saved brain dumps yet. Save your current dump to see it here!
              </p>
            ) : (
              <div className="space-y-3">
                {savedDumps.map((dump) => (
                  <div
                    key={dump.id}
                    onClick={() => loadDump(dump)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <p className="text-sm text-gray-900 line-clamp-2 mb-1">
                      {dump.text.substring(0, 80)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(dump.date).toLocaleDateString()} at{' '}
                      {new Date(dump.date).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Tips</h4>
              <ul className="text-xs text-gray-600 space-y-2">
                <li>• Write or speak naturally - no need to format</li>
                <li>• Click "Voice" to use speech-to-text</li>
                <li>• Include deadlines when you know them</li>
                <li>• Mention priority levels if important</li>
                <li>• AI will organize everything for you</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainDump;
