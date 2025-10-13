const { getGeminiModel } = require('../config/gemini');

class GeminiService {
  async generateContent(prompt) {
    try {
      const model = getGeminiModel('gemini-2.0-flash');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw new Error('Failed to generate content with Gemini AI');
    }
  }

  async extractTasksFromText(text) {
    const prompt = `
Analyze this text and extract ALL actionable tasks. For complex tasks, include subtasks within the task object.

Text: "${text}"

Return ONLY a valid JSON array with this exact format (no markdown, no code blocks, just JSON):
[
  {
    "title": "Complete Task Title",
    "description": "Overview of what needs to be accomplished",
    "priority": "low|medium|high|urgent",
    "estimatedTime": 120,
    "category": "work|personal|meeting|email|planning|learning|health|other",
    "suggestedDeadline": "2025-10-15",
    "tags": [],
    "subtasks": [
      {
        "title": "Step 1: Specific first action",
        "completed": false,
        "description": "What this step involves"
      },
      {
        "title": "Step 2: Specific second action",
        "completed": false,
        "description": "What this step involves"
      }
    ]
  },
  {
    "title": "Simple task without subtasks",
    "description": "A straightforward task that doesn't need breakdown",
    "priority": "medium",
    "estimatedTime": 30,
    "category": "work",
    "tags": [],
    "subtasks": []
  }
]

Rules:
- For complex tasks that require multiple steps, include subtasks array within the task
- For simple tasks, use empty subtasks array
- Each subtask should have: title, completed (always false initially), and optional description
- Main task estimatedTime should account for all subtasks
- Order subtasks logically (Step 1, Step 2, etc.)
- Suggest appropriate deadlines
- Return valid JSON only
`;

    try {
      const response = await this.generateContent(prompt);
      console.log('Gemini raw response:', response.substring(0, 500)); // Log first 500 chars

      // Clean response to extract JSON
      let jsonText = response.trim();

      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Try to find JSON array
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Try parsing the whole response
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Task extraction error:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Failed to parse response');
      return [];
    }
  }

  async prioritizeTasks(tasks) {
    const prompt = `
Analyze and prioritize these tasks using the Eisenhower Matrix (urgent vs important).
Consider deadlines, dependencies, impact, and effort.

Tasks: ${JSON.stringify(tasks)}

Return the same tasks with added AI insights as valid JSON (no markdown):
[
  {
    ...original task fields,
    "priorityScore": 85,
    "aiInsights": {
      "priorityReason": "Brief explanation of priority",
      "suggestedTime": "Best time to work on this",
      "matrix": "urgent-important|important|urgent|delegate|eliminate",
      "recommendations": ["Specific actionable tips"]
    }
  }
]

Sort by priorityScore (highest first). Return valid JSON only.
`;

    try {
      const response = await this.generateContent(prompt);

      let jsonText = response.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Task prioritization error:', error);
      return tasks;
    }
  }

  async generateDailyPlan(tasks, userPreferences = {}) {
    const { workingHours = { start: '09:00', end: '17:00' }, timezone = 'UTC' } = userPreferences;

    const prompt = `
Create an optimal daily schedule for these tasks:

Tasks: ${JSON.stringify(tasks)}
Working Hours: ${workingHours.start} to ${workingHours.end}
Timezone: ${timezone}

Consider:
- Energy levels (morning = high focus, afternoon = meetings/admin, evening = wrap-up)
- Task complexity and mental load
- Break times (every 90 minutes)
- Deep work blocks for complex tasks
- Time blocking principles

Return as valid JSON (no markdown):
{
  "summary": "Brief overview of the day",
  "timeBlocks": [
    {
      "startTime": "09:00",
      "endTime": "10:30",
      "taskId": "task-id-if-available",
      "taskTitle": "Task title",
      "type": "deep-work|meeting|admin|break|planning",
      "notes": "Why this time slot"
    }
  ],
  "tips": ["3-5 productivity tips for the day"],
  "estimatedProductivity": 85
}
`;

    try {
      const response = await this.generateContent(prompt);

      let jsonText = response.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Daily plan generation error:', error);
      return null;
    }
  }

  async analyzeProductivity(completedTasks, timeData) {
    const prompt = `
Analyze productivity patterns from this data:

Completed Tasks: ${JSON.stringify(completedTasks)}
Time Data: ${JSON.stringify(timeData)}

Provide comprehensive insights as valid JSON (no markdown):
{
  "productivityScore": 75,
  "strengths": ["What user is doing well"],
  "improvements": ["Specific areas to improve"],
  "patterns": {
    "mostProductiveTime": "Time range when most productive",
    "taskCompletionRate": 85,
    "averageTaskTime": 45,
    "commonCategories": ["Most worked on categories"]
  },
  "recommendations": ["3-5 actionable recommendations"],
  "insights": "Overall productivity analysis"
}
`;

    try {
      const response = await this.generateContent(prompt);

      let jsonText = response.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Productivity analysis error:', error);
      return null;
    }
  }

  async generateMeetingPrep(meetingInfo) {
    const { title, attendees, date, duration, context } = meetingInfo;

    const prompt = `
Generate comprehensive meeting preparation for:

Meeting Title: ${title}
Attendees: ${attendees || 'Not specified'}
Date: ${date || 'TBD'}
Duration: ${duration || '30 minutes'}
Context: ${context || 'No additional context'}

Create as valid JSON (no markdown):
{
  "agenda": ["Key discussion points in order"],
  "talkingPoints": ["Your main points to cover"],
  "questions": ["Important questions to ask"],
  "backgroundInfo": "Relevant context and preparation needed",
  "actionItems": ["Expected outcomes and deliverables"],
  "followUp": ["Post-meeting tasks"],
  "timeAllocation": {
    "intro": "5 min",
    "discussion": "20 min",
    "conclusion": "5 min"
  }
}
`;

    try {
      const response = await this.generateContent(prompt);

      let jsonText = response.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Meeting prep generation error:', error);
      return null;
    }
  }

  async suggestTasks(context) {
    const { currentTasks, userRole, timeOfDay, dayOfWeek, recentActivity } = context;

    const prompt = `
Based on user context, suggest 5 relevant and helpful tasks:

Current Tasks: ${JSON.stringify(currentTasks || [])}
User Role: ${userRole || 'professional'}
Time of Day: ${timeOfDay || 'morning'}
Day of Week: ${dayOfWeek || 'Monday'}
Recent Activity: ${JSON.stringify(recentActivity || [])}

Suggest smart, contextual tasks as valid JSON (no markdown):
[
  {
    "title": "Specific, actionable task",
    "description": "Why this task is relevant now",
    "priority": "low|medium|high",
    "estimatedTime": 30,
    "category": "work|personal|planning|learning|health",
    "reasoning": "Why AI suggested this task"
  }
]

Make suggestions practical and timely.
`;

    try {
      const response = await this.generateContent(prompt);

      let jsonText = response.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Task suggestion error:', error);
      return [];
    }
  }

  async generateWeeklyPlan(tasks, userPreferences = {}, weekStart = new Date()) {
    const {
      workStartTime = '09:00',
      workEndTime = '17:00',
      workDaysPerWeek = 5,
      breakDuration = 60,
      deepWorkPreference = 'morning'
    } = userPreferences;

    const prompt = `
Create an optimal weekly schedule for these tasks:

Tasks: ${JSON.stringify(tasks)}
Week Starting: ${weekStart.toISOString()}
Work Hours: ${workStartTime} to ${workEndTime}
Work Days: ${workDaysPerWeek} days per week
Break Duration: ${breakDuration} minutes
Deep Work Preference: ${deepWorkPreference}

Consider:
- Distribute tasks across the week based on priority and deadlines
- Schedule complex tasks during peak productivity times (${deepWorkPreference})
- Balance workload across days
- Include breaks and planning time
- Group similar tasks together
- Consider task dependencies and estimated time

Return as valid JSON (no markdown):
{
  "summary": "Overview of the week's plan",
  "days": [
    {
      "date": "2025-01-13",
      "dayName": "Monday",
      "tasksCount": 5,
      "plan": {
        "summary": "Focus for the day",
        "timeBlocks": [
          {
            "startTime": "09:00",
            "endTime": "10:30",
            "taskId": "task-id-if-available",
            "taskTitle": "Task title",
            "type": "deep-work|meeting|admin|break|planning",
            "notes": "Why this time slot"
          }
        ],
        "tips": ["Tips for this specific day"],
        "estimatedProductivity": 85
      }
    }
  ],
  "totalTasks": 25,
  "totalEstimatedHours": 40,
  "weeklyGoals": ["3-5 main goals for the week"],
  "balanceScore": 85
}

Create plans for ${workDaysPerWeek} working days. Return valid JSON only.
`;

    try {
      const response = await this.generateContent(prompt);

      let jsonText = response.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Weekly plan generation error:', error);
      return null;
    }
  }

  async generateWorkspaceTemplate(userPrompt) {
    const prompt = `
Generate a custom workspace template based on this user request:

User Request: "${userPrompt}"

Create a comprehensive workspace template as valid JSON (no markdown):
{
  "name": "Workspace Name (2-4 words)",
  "description": "Clear description of workspace purpose and use case",
  "category": "personal|work|team|education|health|finance|custom",
  "default_view": "kanban|list|calendar|timeline",
  "theme": "light|dark",
  "background_type": "color|gradient",
  "background_value": "hex color OR CSS gradient (e.g., linear-gradient(135deg, #667eea 0%, #764ba2 100%))",
  "primary_color": "#hexcolor",
  "secondary_color": "#hexcolor",
  "board_configs": [
    {
      "view_type": "kanban|list|calendar|timeline",
      "name": "Board name",
      "config": {
        "columns": [
          {"id": "column-id", "title": "Column Title"}
        ]
      }
    }
  ],
  "sample_tasks": [
    {
      "title": "Sample task title",
      "description": "What this task involves",
      "priority": "low|medium|high|urgent",
      "category": "work|personal|planning|other"
    }
  ]
}

Guidelines:
- Choose colors that match the workspace theme and purpose
- For gradients, use complementary colors that create visual appeal
- Create 2-4 board configurations with different view types
- Include 3-5 sample tasks that demonstrate the workspace use case
- Make column names specific to the use case
- Ensure the design is professional and functional
- **IMPORTANT - Workspace Type Detection**: The name field MUST include specific keywords based on the workspace type:
  * For hospitality/restaurants/pubs/hotels/bars/liquor/gaming/RSA/compliance: Include "Hospitality", "Pub", "Hotel", "Club", or "Licensee" in the name
  * For construction/building/trades/contractors: Include "Builder" or "Contractor" in the name
  * Examples: "Hospitality Management", "Pub Operations", "Hotel Admin", "Club Manager", "Builder Projects", "Contractor Admin"
  * This is critical for enabling specialized features - if the request mentions orders, stocktakes, invoices, rosters, gaming, or bar/restaurant operations, use hospitality keywords
- Return valid JSON only
`;

    try {
      const response = await this.generateContent(prompt);

      let jsonText = response.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Workspace template generation error:', error);
      return null;
    }
  }
}

module.exports = new GeminiService();
