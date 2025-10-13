-- Insert Builders Template
-- This template provides a comprehensive system for builders/contractors with:
-- - Design drawing board
-- - Client management
-- - Job tracking
-- - Invoice input

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
  'Builders & Contractors',
  'Complete workspace for builders with design board, client management, job tracking, and invoicing',
  'business',
  'kanban',
  'light',
  'gradient',
  'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  '#f97316',
  '#ea580c',
  '[
    {
      "view_type": "kanban",
      "name": "Job Pipeline",
      "config": {
        "columns": [
          {
            "id": "quoted",
            "title": "Quoted",
            "color": "#3b82f6"
          },
          {
            "id": "approved",
            "title": "Approved",
            "color": "#8b5cf6"
          },
          {
            "id": "in-progress",
            "title": "In Progress",
            "color": "#f59e0b"
          },
          {
            "id": "inspection",
            "title": "Inspection",
            "color": "#ec4899"
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
      "name": "Clients",
      "config": {
        "groupBy": "status",
        "sortBy": "created_at",
        "filters": {
          "category": ["client"]
        },
        "customFields": [
          {
            "id": "client_name",
            "label": "Client Name",
            "type": "text",
            "required": true
          },
          {
            "id": "client_phone",
            "label": "Phone",
            "type": "text",
            "required": true
          },
          {
            "id": "client_email",
            "label": "Email",
            "type": "email",
            "required": false
          },
          {
            "id": "client_address",
            "label": "Property Address",
            "type": "textarea",
            "required": true
          },
          {
            "id": "client_notes",
            "label": "Notes",
            "type": "textarea",
            "required": false
          }
        ]
      }
    },
    {
      "view_type": "canvas",
      "name": "Design Board",
      "config": {
        "gridSize": 20,
        "canvasWidth": 1200,
        "canvasHeight": 800,
        "showGrid": true,
        "snapToGrid": true,
        "tools": ["pen", "line", "rectangle", "circle", "text", "eraser"],
        "layers": true,
        "exportFormats": ["png", "pdf"]
      }
    },
    {
      "view_type": "list",
      "name": "Invoices",
      "config": {
        "groupBy": "status",
        "sortBy": "due_date",
        "filters": {
          "category": ["invoice"]
        },
        "customFields": [
          {
            "id": "invoice_number",
            "label": "Invoice #",
            "type": "text",
            "required": true
          },
          {
            "id": "client_name",
            "label": "Client",
            "type": "text",
            "required": true
          },
          {
            "id": "job_description",
            "label": "Job Description",
            "type": "textarea",
            "required": true
          },
          {
            "id": "amount",
            "label": "Amount",
            "type": "currency",
            "required": true
          },
          {
            "id": "due_date",
            "label": "Due Date",
            "type": "date",
            "required": true
          },
          {
            "id": "payment_status",
            "label": "Payment Status",
            "type": "select",
            "options": ["Pending", "Partially Paid", "Paid", "Overdue"],
            "required": true
          },
          {
            "id": "line_items",
            "label": "Line Items",
            "type": "json",
            "required": false
          }
        ]
      }
    },
    {
      "view_type": "calendar",
      "name": "Job Schedule",
      "config": {
        "defaultView": "month",
        "showWeekends": true,
        "filters": {
          "category": ["job", "inspection"]
        }
      }
    },
    {
      "view_type": "list",
      "name": "Materials & Orders",
      "config": {
        "groupBy": "status",
        "sortBy": "order_date",
        "filters": {
          "category": ["materials"]
        },
        "customFields": [
          {
            "id": "supplier",
            "label": "Supplier",
            "type": "text",
            "required": true
          },
          {
            "id": "order_number",
            "label": "Order #",
            "type": "text",
            "required": false
          },
          {
            "id": "items",
            "label": "Items",
            "type": "textarea",
            "required": true
          },
          {
            "id": "cost",
            "label": "Cost",
            "type": "currency",
            "required": true
          },
          {
            "id": "order_date",
            "label": "Order Date",
            "type": "date",
            "required": true
          },
          {
            "id": "delivery_date",
            "label": "Delivery Date",
            "type": "date",
            "required": false
          },
          {
            "id": "job_allocated",
            "label": "Allocated to Job",
            "type": "text",
            "required": false
          }
        ]
      }
    }
  ]'::jsonb,
  '[
    {
      "title": "123 Smith St - Kitchen Renovation",
      "description": "Complete kitchen renovation including new cabinets, countertops, and appliances",
      "status": "in-progress",
      "priority": "high",
      "category": "job",
      "tags": ["renovation", "kitchen"],
      "estimatedTime": 480,
      "dueDate": "2025-11-15",
      "customData": {
        "client_name": "John & Mary Smith",
        "client_phone": "0412 345 678",
        "client_address": "123 Smith Street, Brisbane QLD 4000",
        "quoted_amount": "$45,000",
        "start_date": "2025-10-20"
      }
    },
    {
      "title": "456 Jones Ave - Bathroom Reno Quote",
      "description": "Quote for master bathroom renovation",
      "status": "quoted",
      "priority": "medium",
      "category": "job",
      "tags": ["quote", "bathroom"],
      "estimatedTime": 240,
      "dueDate": "2025-10-25",
      "customData": {
        "client_name": "Sarah Jones",
        "client_phone": "0423 456 789",
        "client_address": "456 Jones Avenue, Gold Coast QLD 4217",
        "quoted_amount": "$28,500"
      }
    },
    {
      "title": "Invoice #INV-2024-089 - Smith Kitchen",
      "description": "Deposit invoice for Smith kitchen renovation",
      "status": "pending",
      "priority": "high",
      "category": "invoice",
      "tags": ["invoice", "deposit"],
      "dueDate": "2025-10-30",
      "customData": {
        "invoice_number": "INV-2024-089",
        "client_name": "John & Mary Smith",
        "job_description": "Kitchen Renovation - Deposit (50%)",
        "amount": "$22,500",
        "payment_status": "Pending",
        "line_items": [
          {"description": "Kitchen Cabinets", "quantity": 1, "rate": "$12,000", "amount": "$12,000"},
          {"description": "Countertops - Stone Benchtops", "quantity": 1, "rate": "$8,500", "amount": "$8,500"},
          {"description": "Labour", "quantity": 1, "rate": "$2,000", "amount": "$2,000"}
        ]
      }
    },
    {
      "title": "Materials Order - Bunnings",
      "description": "Timber, screws, and fixtures for Smith kitchen",
      "status": "ordered",
      "priority": "medium",
      "category": "materials",
      "tags": ["materials", "bunnings"],
      "dueDate": "2025-10-18",
      "customData": {
        "supplier": "Bunnings Trade",
        "order_number": "BUN-45678",
        "items": "Pine timber 90x45, Stainless steel screws, Door hinges",
        "cost": "$842.50",
        "order_date": "2025-10-15",
        "delivery_date": "2025-10-18",
        "job_allocated": "Smith Kitchen"
      }
    },
    {
      "title": "Client: Thompson Family",
      "description": "Regular clients - multiple properties",
      "status": "active",
      "priority": "medium",
      "category": "client",
      "tags": ["client", "repeat-customer"],
      "customData": {
        "client_name": "David & Lisa Thompson",
        "client_phone": "0434 567 890",
        "client_email": "thompson.family@email.com",
        "client_address": "789 Park Road, Brisbane QLD 4000",
        "client_notes": "Preferred customer - always pays on time. Have 3 rental properties that need regular maintenance."
      }
    },
    {
      "title": "Final Inspection - Smith Kitchen",
      "description": "Building inspector final check before handover",
      "status": "scheduled",
      "priority": "high",
      "category": "inspection",
      "tags": ["inspection", "final"],
      "dueDate": "2025-11-14",
      "customData": {
        "inspector": "Brisbane Building Certifiers",
        "job": "Smith Kitchen Renovation",
        "scheduled_time": "10:00 AM"
      }
    }
  ]'::jsonb,
  false,
  true,
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT 'Builders template created successfully!' as status;
