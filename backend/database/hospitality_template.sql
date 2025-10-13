-- Insert Hospitality Template
-- This template provides a comprehensive system for pubs/hotels/clubs with:
-- - Orders management
-- - Stocktake tracking
-- - Rosters & Staff
-- - Compliance & Incidents
-- - Gaming Register
-- - Daily Takings

INSERT INTO workspace_templates (
  name,
  description,
  category,
  default_view,
  theme,
  background_type,
  background_value,
  primary_color,
  secondary_color,
  board_configs,
  sample_tasks,
  is_ai_generated,
  is_public,
  created_at
) VALUES (
  'Hospitality & Licensee',
  'Complete workspace for pubs, hotels, and clubs with orders, stocktake, rosters, compliance, and gaming management',
  'business',
  'kanban',
  'light',
  'gradient',
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  '#6366f1',
  '#8b5cf6',
  '[
    {
      "view_type": "kanban",
      "name": "Operations",
      "config": {
        "columns": [
          {
            "id": "pending",
            "title": "To Do",
            "color": "#3b82f6"
          },
          {
            "id": "in-progress",
            "title": "In Progress",
            "color": "#f59e0b"
          },
          {
            "id": "completed",
            "title": "Completed",
            "color": "#10b981"
          }
        ]
      }
    },
    {
      "view_type": "list",
      "name": "Staff Roster",
      "config": {
        "groupBy": "date",
        "sortBy": "start_time",
        "filters": {
          "category": ["roster"]
        },
        "customFields": [
          {
            "id": "staff_name",
            "label": "Staff Member",
            "type": "text",
            "required": true
          },
          {
            "id": "position",
            "label": "Position",
            "type": "select",
            "options": ["Bartender", "Floor Staff", "Kitchen", "Manager", "Security"],
            "required": true
          },
          {
            "id": "shift_date",
            "label": "Date",
            "type": "date",
            "required": true
          },
          {
            "id": "start_time",
            "label": "Start Time",
            "type": "time",
            "required": true
          },
          {
            "id": "end_time",
            "label": "End Time",
            "type": "time",
            "required": true
          },
          {
            "id": "hours",
            "label": "Hours",
            "type": "number",
            "required": false
          }
        ]
      }
    },
    {
      "view_type": "list",
      "name": "Compliance",
      "config": {
        "groupBy": "status",
        "sortBy": "created_at",
        "filters": {
          "category": ["compliance", "incident"]
        },
        "customFields": [
          {
            "id": "incident_type",
            "label": "Incident Type",
            "type": "select",
            "options": ["Intoxication", "Refusal of Service", "Minor Entry", "Security", "Injury", "Property Damage", "Other"],
            "required": true
          },
          {
            "id": "incident_date",
            "label": "Date & Time",
            "type": "datetime",
            "required": true
          },
          {
            "id": "location",
            "label": "Location",
            "type": "text",
            "required": true
          },
          {
            "id": "persons_involved",
            "label": "Persons Involved",
            "type": "textarea",
            "required": true
          },
          {
            "id": "action_taken",
            "label": "Action Taken",
            "type": "textarea",
            "required": true
          },
          {
            "id": "reported_by",
            "label": "Reported By",
            "type": "text",
            "required": true
          },
          {
            "id": "police_notified",
            "label": "Police Notified",
            "type": "checkbox",
            "required": false
          }
        ]
      }
    },
    {
      "view_type": "list",
      "name": "Gaming",
      "config": {
        "groupBy": "date",
        "sortBy": "date",
        "filters": {
          "category": ["gaming"]
        },
        "customFields": [
          {
            "id": "machine_number",
            "label": "Machine #",
            "type": "text",
            "required": true
          },
          {
            "id": "meter_reading",
            "label": "Meter Reading",
            "type": "number",
            "required": true
          },
          {
            "id": "date",
            "label": "Date",
            "type": "date",
            "required": true
          },
          {
            "id": "time",
            "label": "Time",
            "type": "time",
            "required": true
          },
          {
            "id": "recorded_by",
            "label": "Recorded By",
            "type": "text",
            "required": true
          },
          {
            "id": "maintenance_notes",
            "label": "Maintenance Notes",
            "type": "textarea",
            "required": false
          }
        ]
      }
    },
    {
      "view_type": "calendar",
      "name": "Event Schedule",
      "config": {
        "defaultView": "month",
        "showWeekends": true,
        "filters": {
          "category": ["event", "roster", "maintenance"]
        }
      }
    },
    {
      "view_type": "list",
      "name": "Daily Takings",
      "config": {
        "groupBy": "date",
        "sortBy": "date",
        "filters": {
          "category": ["takings"]
        },
        "customFields": [
          {
            "id": "date",
            "label": "Date",
            "type": "date",
            "required": true
          },
          {
            "id": "bar_sales",
            "label": "Bar Sales",
            "type": "currency",
            "required": true
          },
          {
            "id": "food_sales",
            "label": "Food Sales",
            "type": "currency",
            "required": false
          },
          {
            "id": "gaming_revenue",
            "label": "Gaming Revenue",
            "type": "currency",
            "required": false
          },
          {
            "id": "eftpos",
            "label": "EFTPOS Total",
            "type": "currency",
            "required": true
          },
          {
            "id": "cash",
            "label": "Cash Total",
            "type": "currency",
            "required": true
          },
          {
            "id": "total_takings",
            "label": "Total Takings",
            "type": "currency",
            "required": true
          },
          {
            "id": "variance",
            "label": "Variance",
            "type": "currency",
            "required": false
          },
          {
            "id": "manager",
            "label": "Manager on Duty",
            "type": "text",
            "required": true
          }
        ]
      }
    }
  ]'::jsonb,
  '[
    {
      "title": "Order: Lion Beer - Weekly Stock",
      "description": "Weekly beer order from Lion Nathan",
      "status": "pending",
      "priority": "high",
      "category": "orders",
      "tags": ["order", "beverage", "urgent"],
      "dueDate": "2025-10-17",
      "customData": {
        "supplier": "Lion Nathan",
        "order_number": "LN-2024-456",
        "delivery_date": "2025-10-19",
        "total": "$3,450.00",
        "status": "pending"
      }
    },
    {
      "title": "Monthly Stocktake - Bar",
      "description": "Complete bar stocktake for October",
      "status": "in-progress",
      "priority": "high",
      "category": "stocktake",
      "tags": ["stocktake", "bar"],
      "dueDate": "2025-10-31",
      "customData": {
        "stocktake_number": "ST-2024-10",
        "conducted_by": "Sarah Manager",
        "date": "2025-10-31",
        "status": "in_progress"
      }
    },
    {
      "title": "RSA Incident - Refusal of Service",
      "description": "Patron refused service due to intoxication signs",
      "status": "completed",
      "priority": "urgent",
      "category": "compliance",
      "tags": ["RSA", "incident", "compliance"],
      "customData": {
        "incident_type": "Refusal of Service",
        "incident_date": "2025-10-15 22:30",
        "location": "Main Bar",
        "persons_involved": "Male patron, approximately 35 years old",
        "action_taken": "Patron politely refused further alcohol service. Offered water and food. Arranged taxi home.",
        "reported_by": "John Bartender",
        "police_notified": false
      }
    },
    {
      "title": "Weekend Roster - Bar Staff",
      "description": "Friday and Saturday night bar roster",
      "status": "completed",
      "priority": "medium",
      "category": "roster",
      "tags": ["roster", "weekend"],
      "dueDate": "2025-10-20",
      "customData": {
        "staff": [
          {"name": "John", "position": "Bartender", "shift": "Friday 6pm-2am"},
          {"name": "Mary", "position": "Bartender", "shift": "Friday 6pm-2am"},
          {"name": "Tom", "position": "Floor Staff", "shift": "Saturday 5pm-1am"}
        ]
      }
    },
    {
      "title": "Gaming Meter Reading - Machine 5",
      "description": "Monthly meter reading for gaming machine 5",
      "status": "pending",
      "priority": "medium",
      "category": "gaming",
      "tags": ["gaming", "compliance"],
      "dueDate": "2025-10-31",
      "customData": {
        "machine_number": "GM-005",
        "meter_reading": "234567",
        "date": "2025-10-31",
        "recorded_by": "Manager"
      }
    },
    {
      "title": "Daily Takings - Friday Night",
      "description": "Record daily takings for Friday",
      "status": "completed",
      "priority": "high",
      "category": "takings",
      "tags": ["takings", "finance"],
      "dueDate": "2025-10-15",
      "customData": {
        "date": "2025-10-15",
        "bar_sales": "$4,250.00",
        "food_sales": "$1,800.00",
        "gaming_revenue": "$2,100.00",
        "eftpos": "$6,850.00",
        "cash": "$1,300.00",
        "total_takings": "$8,150.00",
        "variance": "$0.00",
        "manager": "Sarah Manager"
      }
    }
  ]'::jsonb,
  false,
  true,
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT 'Hospitality template created successfully!' as status;
