const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');
const { getGemini } = require('../config/gemini');

// Protect all routes
router.use(protect);

// ============================================
// COMPLIANCE TEMPLATES ROUTES
// ============================================

// Get all templates for a workspace
router.get('/:workspaceId/templates', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('user_id', req.user.id)
      .single();

    if (workspaceError || !workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Get templates
    const { data: templates, error } = await supabase
      .from('compliance_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch templates'
      });
    }

    res.json({
      success: true,
      templates: templates || []
    });
  } catch (error) {
    console.error('Error in get templates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get a single template by ID
router.get('/:workspaceId/templates/:templateId', async (req, res) => {
  try {
    const { workspaceId, templateId } = req.params;
    const supabase = getSupabase();

    const { data: template, error } = await supabase
      .from('compliance_templates')
      .select('*')
      .eq('id', templateId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error in get template:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Generate checklist using AI
router.post('/:workspaceId/templates/generate', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { prompt, industry, category } = req.body;
    const supabase = getSupabase();

    // Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('user_id', req.user.id)
      .single();

    if (workspaceError || !workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Industry-specific compliance standards
    const industryStandards = {
      hospitality: 'Include OLGR (Office of Liquor and Gaming Regulation) requirements, food safety standards, hygiene protocols, RSA (Responsible Service of Alcohol) compliance, workplace health and safety, fire safety, and customer service standards.',
      construction: 'Include WorkSafe requirements, site safety protocols, PPE (Personal Protective Equipment) requirements, machinery safety checks, scaffolding inspections, fall protection measures, hazardous materials handling, and building code compliance.',
      healthcare: 'Include infection control protocols, patient safety standards, medication management, medical equipment sterilization, PPE requirements, HIPAA compliance, emergency response procedures, and clinical documentation standards.',
      finance: 'Include anti-money laundering (AML) checks, KYC (Know Your Customer) procedures, data security protocols, financial reporting standards, audit compliance, cybersecurity measures, and regulatory compliance (ASIC, APRA).',
      retail: 'Include customer safety protocols, cash handling procedures, inventory security, workplace safety, fire safety, accessibility compliance, payment security (PCI DSS), and consumer protection law compliance.',
      manufacturing: 'Include quality control checks, equipment maintenance protocols, workplace safety standards, hazardous materials handling, environmental compliance, production safety protocols, and ISO certification requirements.',
      other: 'Include general workplace health and safety standards, occupational health regulations, fire safety protocols, emergency evacuation procedures, and industry-specific regulatory requirements.'
    };

    const standardsContext = industryStandards[industry] || industryStandards.other;

    // Build AI prompt
    const aiPrompt = `You are a compliance expert. Generate a comprehensive, industry-standard compliance checklist based on the following requirements:

Industry: ${industry}
Category: ${category || 'General Compliance'}
User Request: ${prompt}

Industry Standards to Consider:
${standardsContext}

Generate a detailed checklist with 10-20 items (adjust based on complexity). Each item should be:
1. Specific and actionable
2. Based on actual industry regulations and best practices
3. Clear and easy to understand
4. Compliance-focused

Return ONLY a JSON array of checklist items in this EXACT format, with no additional text:
[
  {
    "text": "Check item description",
    "required": true,
    "notes": "Additional context or regulatory reference"
  }
]

Make sure items are relevant to the industry and cover all critical compliance areas.`;

    try {
      const gemini = getGemini();
      const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(aiPrompt);
      const response = await result.response;
      let aiText = response.text();

      // Clean up response - remove markdown code blocks if present
      aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse the JSON response
      const checklistItems = JSON.parse(aiText);

      // Add IDs to each item
      const itemsWithIds = checklistItems.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        text: item.text,
        required: item.required !== false, // default to true
        notes: item.notes || '',
        completed: false,
        completedAt: null,
        completedBy: null
      }));

      res.json({
        success: true,
        items: itemsWithIds,
        message: 'Checklist generated successfully'
      });
    } catch (aiError) {
      console.error('Error with AI generation:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate checklist with AI',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Error in generate checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new template
router.post('/:workspaceId/templates', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, industry, category, items } = req.body;
    const supabase = getSupabase();

    // Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('user_id', req.user.id)
      .single();

    if (workspaceError || !workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Create template
    const { data: newTemplate, error } = await supabase
      .from('compliance_templates')
      .insert({
        workspace_id: workspaceId,
        name,
        description: description || null,
        industry,
        category: category || null,
        items: items || [],
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create template'
      });
    }

    res.status(201).json({
      success: true,
      template: newTemplate
    });
  } catch (error) {
    console.error('Error in create template:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update a template
router.put('/:workspaceId/templates/:templateId', async (req, res) => {
  try {
    const { workspaceId, templateId } = req.params;
    const { name, description, industry, category, items } = req.body;
    const supabase = getSupabase();

    // Verify user has access
    const { data: template, error: templateError } = await supabase
      .from('compliance_templates')
      .select('*, workspaces!inner(user_id)')
      .eq('id', templateId)
      .eq('workspace_id', workspaceId)
      .single();

    if (templateError || !template || template.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Update template
    const { data: updatedTemplate, error } = await supabase
      .from('compliance_templates')
      .update({
        name,
        description: description || null,
        industry,
        category: category || null,
        items: items || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update template'
      });
    }

    res.json({
      success: true,
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Error in update template:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete a template
router.delete('/:workspaceId/templates/:templateId', async (req, res) => {
  try {
    const { workspaceId, templateId } = req.params;
    const supabase = getSupabase();

    // Verify user has access
    const { data: template, error: templateError } = await supabase
      .from('compliance_templates')
      .select('*, workspaces!inner(user_id)')
      .eq('id', templateId)
      .eq('workspace_id', workspaceId)
      .single();

    if (templateError || !template || template.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Delete template
    const { error } = await supabase
      .from('compliance_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete template'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete template:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// CHECKLIST INSTANCES ROUTES
// ============================================

// Get all checklist instances for a workspace
router.get('/:workspaceId/instances', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('user_id', req.user.id)
      .single();

    if (workspaceError || !workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Get instances
    const { data: instances, error } = await supabase
      .from('checklist_instances')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching instances:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch checklist instances'
      });
    }

    res.json({
      success: true,
      instances: instances || []
    });
  } catch (error) {
    console.error('Error in get instances:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create checklist instance from template
router.post('/:workspaceId/instances/from-template/:templateId', async (req, res) => {
  try {
    const { workspaceId, templateId } = req.params;
    const { name, dueDate, assignedTo } = req.body;
    const supabase = getSupabase();

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('compliance_templates')
      .select('*')
      .eq('id', templateId)
      .eq('workspace_id', workspaceId)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Create instance from template
    const { data: newInstance, error } = await supabase
      .from('checklist_instances')
      .insert({
        workspace_id: workspaceId,
        template_id: templateId,
        name: name || template.name,
        industry: template.industry,
        category: template.category,
        items: template.items,
        status: 'in_progress',
        due_date: dueDate || null,
        assigned_to: assignedTo || null,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating instance:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create checklist instance'
      });
    }

    res.status(201).json({
      success: true,
      instance: newInstance
    });
  } catch (error) {
    console.error('Error in create instance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update checklist instance
router.put('/:workspaceId/instances/:instanceId', async (req, res) => {
  try {
    const { workspaceId, instanceId } = req.params;
    const { name, items, status, dueDate, assignedTo } = req.body;
    const supabase = getSupabase();

    // Check if all items are completed
    const allCompleted = items && items.every(item => item.completed);
    const updateData = {
      name,
      items,
      status: allCompleted ? 'completed' : (status || 'in_progress'),
      due_date: dueDate || null,
      assigned_to: assignedTo || null,
      updated_at: new Date().toISOString()
    };

    if (allCompleted && status !== 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Update instance
    const { data: updatedInstance, error } = await supabase
      .from('checklist_instances')
      .update(updateData)
      .eq('id', instanceId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating instance:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update checklist instance'
      });
    }

    res.json({
      success: true,
      instance: updatedInstance
    });
  } catch (error) {
    console.error('Error in update instance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete checklist instance
router.delete('/:workspaceId/instances/:instanceId', async (req, res) => {
  try {
    const { workspaceId, instanceId } = req.params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('checklist_instances')
      .delete()
      .eq('id', instanceId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error deleting instance:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete checklist instance'
      });
    }

    res.json({
      success: true,
      message: 'Checklist instance deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete instance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
