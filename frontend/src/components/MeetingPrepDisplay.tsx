import React from 'react';
import { Clock, CheckSquare, MessageSquare, HelpCircle, Info, Calendar } from 'lucide-react';

interface MeetingPrepData {
  agenda?: string[];
  talkingPoints?: string[];
  questions?: string[];
  backgroundInfo?: string;
  actionItems?: string[];
  followUp?: string[];
  timeAllocation?: {
    [key: string]: string;
  };
}

interface MeetingPrepDisplayProps {
  prepData: MeetingPrepData | string;
}

const MeetingPrepDisplay: React.FC<MeetingPrepDisplayProps> = ({ prepData }) => {
  // Parse if it's a string
  let data: MeetingPrepData;
  try {
    data = typeof prepData === 'string' ? JSON.parse(prepData) : prepData;
  } catch (error) {
    // If parsing fails, display as plain text
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <pre className="whitespace-pre-wrap text-sm text-gray-700">{String(prepData)}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Background Info */}
      {data.backgroundInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Background Information</h4>
              <p className="text-sm text-blue-800">{data.backgroundInfo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Time Allocation */}
      {data.timeAllocation && Object.keys(data.timeAllocation).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Time Allocation</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(data.timeAllocation).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded px-3 py-2">
                <div className="text-xs text-gray-500 capitalize">{key}</div>
                <div className="text-sm font-medium text-gray-900">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda */}
      {data.agenda && data.agenda.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Agenda</h4>
          </div>
          <ol className="space-y-2">
            {data.agenda.map((item, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 flex-1">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Talking Points */}
      {data.talkingPoints && data.talkingPoints.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Talking Points</h4>
          </div>
          <ul className="space-y-2">
            {data.talkingPoints.map((point, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="text-green-600 mt-1">•</span>
                <span className="text-sm text-gray-700 flex-1">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions */}
      {data.questions && data.questions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <HelpCircle className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-gray-900">Key Questions</h4>
          </div>
          <ul className="space-y-2">
            {data.questions.map((question, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 text-orange-600 font-medium">Q{index + 1}:</span>
                <span className="text-sm text-gray-700 flex-1">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {data.actionItems && data.actionItems.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Suggested Action Items</h4>
          </div>
          <ul className="space-y-2">
            {data.actionItems.map((item, index) => (
              <li key={index} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow Up */}
      {data.followUp && data.followUp.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-gray-900">Follow-Up Actions</h4>
          </div>
          <ul className="space-y-2">
            {data.followUp.map((item, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="text-indigo-600 mt-1">→</span>
                <span className="text-sm text-gray-700 flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MeetingPrepDisplay;
