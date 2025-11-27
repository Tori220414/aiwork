import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, CheckCircle, Plus, Trash2, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: {
    type: string;
    task?: any;
    taskId?: string;
    tasks?: any[];
  };
  suggestions?: string[];
  mood?: string;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start conversation on mount
  useEffect(() => {
    const startConversation = async () => {
      setIsLoading(true);
      try {
        const response = await api.post('/ai/chat', {
          message: "Hi Aurora!",
          conversationHistory: []
        });

        const greeting: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          suggestions: response.data.suggestions,
          mood: response.data.mood
        };
        setMessages([greeting]);
      } catch (error) {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: "Hi! I'm Aurora, your AI assistant. How can I help you today?",
          timestamp: new Date(),
          suggestions: ['Show my tasks', 'Help me get organized', 'Just chat']
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    startConversation();
  }, []);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    // Add user message first
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build FULL conversation history for context
      const conversationHistory = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await api.post('/ai/chat', {
        message: text,
        conversationHistory
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        action: response.data.action,
        suggestions: response.data.suggestions,
        mood: response.data.mood
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show toast for actions
      if (response.data.action) {
        const { type } = response.data.action;
        if (type === 'task_created') {
          toast.success('Task created!');
        } else if (type === 'task_completed') {
          toast.success('Task marked complete!');
        } else if (type === 'task_updated') {
          toast.success('Task updated!');
        } else if (type === 'task_deleted') {
          toast.success('Task deleted!');
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
        suggestions: ['Try again', 'Show my tasks']
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const clearChat = async () => {
    setMessages([]);
    setIsLoading(true);
    try {
      const response = await api.post('/ai/chat', {
        message: "Let's start fresh!",
        conversationHistory: []
      });
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        suggestions: response.data.suggestions
      }]);
    } catch (error) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Fresh start! What would you like to talk about?",
        timestamp: new Date(),
        suggestions: ['Show my tasks', 'Help me plan my day', 'Just chat']
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActionBadge = (action: Message['action']) => {
    if (!action) return null;

    const badges: Record<string, { icon: any; text: string; color: string }> = {
      task_created: { icon: Plus, text: 'Task Created', color: 'bg-green-100 text-green-700' },
      task_completed: { icon: CheckCircle, text: 'Task Completed', color: 'bg-blue-100 text-blue-700' },
      task_updated: { icon: RefreshCw, text: 'Task Updated', color: 'bg-yellow-100 text-yellow-700' },
      task_deleted: { icon: Trash2, text: 'Task Deleted', color: 'bg-red-100 text-red-700' },
      tasks_listed: { icon: Sparkles, text: `${action.tasks?.length || 0} Tasks`, color: 'bg-purple-100 text-purple-700' }
    };

    const badge = badges[action.type];
    if (!badge) return null;

    const Icon = badge.icon;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color} mt-2`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-gray-50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Aurora AI</h1>
            <p className="text-sm text-gray-500">Your task management assistant</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-white shadow-sm border border-gray-100 rounded-bl-md'
              }`}
            >
              <p className={`whitespace-pre-wrap ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                {message.content}
              </p>

              {message.action && renderActionBadge(message.action)}

              {/* Task card if created */}
              {message.action?.type === 'task_created' && message.action.task && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-green-800">{message.action.task.title}</p>
                  <div className="flex gap-2 mt-1 text-xs text-green-600">
                    <span className="capitalize">{message.action.task.priority}</span>
                    <span>•</span>
                    <span className="capitalize">{message.action.task.category}</span>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your tasks..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Aurora can create, update, and manage your tasks through natural conversation
        </p>
      </div>
    </div>
  );
};

export default AIChat;
