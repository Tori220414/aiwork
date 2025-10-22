const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-supabase');
const { getSupabase } = require('../config/supabase');
const geminiService = require('../services/geminiService');

// All routes are protected
router.use(protect);

// @route   GET /api/workspaces
// @desc    Get all workspaces for user (personal + team workspaces where user is member)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Get personal workspaces owned by user
    const { data: personalWorkspaces, error: personalError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (personalError) {
      console.error('Get personal workspaces error:', personalError);
      return res.status(500).json({ message: 'Error fetching workspaces' });
    }

    // Get team workspaces where user is a member
    const { data: teamWorkspaces, error: teamError } = await supabase
      .from('workspaces')
      .select(`
        *,
        team_workspace_members!inner(role, joined_at)
      `)
      .eq('team_workspace_members.user_id', userId)
      .eq('workspace_type', 'team')
      .eq('is_archived', false)
      .order('created_at', { ascending: true });

    if (teamError) {
      console.error('Get team workspaces error:', teamError);
      return res.status(500).json({ message: 'Error fetching team workspaces' });
    }

    // Combine and format workspaces
    const allWorkspaces = [
      ...(personalWorkspaces || []).map(w => ({ ...w, _id: w.id, isPersonal: true })),
      ...(teamWorkspaces || []).map(w => ({
        ...w,
        _id: w.id,
        isPersonal: false,
        memberRole: w.team_workspace_members?.[0]?.role,
        memberJoinedAt: w.team_workspace_members?.[0]?.joined_at
      }))
    ];

    res.json({ workspaces: allWorkspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/workspaces/:id
// @desc    Get single workspace with board configs
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Get workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (workspaceError || !workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check access: owner for personal workspaces, or member for team workspaces
    let hasAccess = false;
    let memberRole = null;

    // First check if user owns the workspace (covers personal workspaces and NULL workspace_type)
    if (workspace.user_id === userId) {
      hasAccess = true;
    } else if (workspace.workspace_type === 'team') {
      // For team workspaces, check if user is a member
      const { data: membership } = await supabase
        .from('team_workspace_members')
        .select('role')
        .eq('workspace_id', req.params.id)
        .eq('user_id', userId)
        .single();

      if (membership) {
        hasAccess = true;
        memberRole = membership.role;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get board configs
    const { data: boardConfigs } = await supabase
      .from('board_configs')
      .select('*')
      .eq('workspace_id', req.params.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    res.json({
      ...workspace,
      _id: workspace.id,
      memberRole,
      boardConfigs: (boardConfigs || []).map(b => ({ ...b, _id: b.id }))
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/workspaces
// @desc    Create new workspace
// @access  Private
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const {
      name,
      description,
      default_view,
      theme,
      background_type,
      background_value,
      primary_color,
      secondary_color,
      settings,
      is_default,
      workspace_type
    } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('workspaces')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const workspaceData = {
      user_id: userId,
      name,
      description,
      default_view: default_view || 'kanban',
      theme: theme || 'light',
      background_type: background_type || 'color',
      background_value: background_value || '#ffffff',
      primary_color: primary_color || '#3b82f6',
      secondary_color: secondary_color || '#8b5cf6',
      settings: settings || {},
      is_default: is_default || false,
      workspace_type: workspace_type || 'personal'
    };

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert([workspaceData])
      .select()
      .single();

    if (error) {
      console.error('Create workspace error:', error);
      return res.status(500).json({ message: 'Error creating workspace' });
    }

    // If team workspace, add creator as owner
    if (workspace.workspace_type === 'team') {
      await supabase
        .from('team_workspace_members')
        .insert([{
          workspace_id: workspace.id,
          user_id: userId,
          role: 'owner',
          invited_by: userId
        }]);
    }

    res.status(201).json({ ...workspace, _id: workspace.id });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/workspaces/:id
// @desc    Update workspace
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const {
      name,
      description,
      default_view,
      theme,
      background_type,
      background_value,
      primary_color,
      secondary_color,
      settings,
      is_default
    } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('workspaces')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', req.params.id);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (default_view !== undefined) updateData.default_view = default_view;
    if (theme !== undefined) updateData.theme = theme;
    if (background_type !== undefined) updateData.background_type = background_type;
    if (background_value !== undefined) updateData.background_value = background_value;
    if (primary_color !== undefined) updateData.primary_color = primary_color;
    if (secondary_color !== undefined) updateData.secondary_color = secondary_color;
    if (settings !== undefined) updateData.settings = settings;
    if (is_default !== undefined) updateData.is_default = is_default;

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update workspace error:', error);
      return res.status(500).json({ message: 'Error updating workspace' });
    }

    res.json({ ...workspace, _id: workspace.id });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/workspaces/:id
// @desc    Archive workspace
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Don't allow deleting default workspace, just archive it
    const { error } = await supabase
      .from('workspaces')
      .update({ is_archived: true })
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Archive workspace error:', error);
      return res.status(500).json({ message: 'Error archiving workspace' });
    }

    res.json({ message: 'Workspace archived successfully' });
  } catch (error) {
    console.error('Archive workspace error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/workspaces/:id/boards
// @desc    Add board config to workspace
// @access  Private
router.post('/:id/boards', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Verify workspace ownership
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const { view_type, name, config, display_order } = req.body;

    const { data: boardConfig, error } = await supabase
      .from('board_configs')
      .insert([{
        workspace_id: req.params.id,
        user_id: userId,
        view_type,
        name,
        config: config || {},
        display_order: display_order || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Create board config error:', error);
      return res.status(500).json({ message: 'Error creating board config' });
    }

    res.status(201).json({ ...boardConfig, _id: boardConfig.id });
  } catch (error) {
    console.error('Create board config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/workspaces/:workspaceId/boards/:boardId
// @desc    Update board config
// @access  Private
router.put('/:workspaceId/boards/:boardId', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { name, config, is_active, display_order } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (config !== undefined) updateData.config = config;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data: boardConfig, error } = await supabase
      .from('board_configs')
      .update(updateData)
      .eq('id', req.params.boardId)
      .eq('workspace_id', req.params.workspaceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update board config error:', error);
      return res.status(500).json({ message: 'Error updating board config' });
    }

    res.json({ ...boardConfig, _id: boardConfig.id });
  } catch (error) {
    console.error('Update board config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/workspaces/templates
// @desc    Get available workspace templates
// @access  Private
router.get('/templates/list', async (req, res) => {
  try {
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { data: templates, error } = await supabase
      .from('workspace_templates')
      .select('*')
      .eq('is_public', true)
      .order('category', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get templates error:', error);
      return res.status(500).json({ message: 'Error fetching templates' });
    }

    res.json({
      templates: (templates || []).map(t => ({ ...t, _id: t.id }))
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/workspaces/from-template/:templateId
// @desc    Create workspace from template
// @access  Private
router.post('/from-template/:templateId', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('workspace_templates')
      .select('*')
      .eq('id', req.params.templateId)
      .single();

    if (templateError || !template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const { name } = req.body;

    // Create workspace from template
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([{
        user_id: userId,
        name: name || template.name,
        description: template.description,
        default_view: template.default_view,
        theme: template.theme,
        background_type: template.background_type,
        background_value: template.background_value,
        primary_color: template.primary_color,
        secondary_color: template.secondary_color
      }])
      .select()
      .single();

    if (workspaceError) {
      console.error('Create workspace from template error:', workspaceError);
      return res.status(500).json({ message: 'Error creating workspace' });
    }

    // Create board configs from template
    if (template.board_configs && Array.isArray(template.board_configs)) {
      const boardConfigsToInsert = template.board_configs.map((bc, index) => ({
        workspace_id: workspace.id,
        user_id: userId,
        view_type: bc.view_type,
        name: bc.name,
        config: bc.config || {},
        display_order: index
      }));

      await supabase
        .from('board_configs')
        .insert(boardConfigsToInsert);
    }

    res.status(201).json({ ...workspace, _id: workspace.id });
  } catch (error) {
    console.error('Create workspace from template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/workspaces/generate-template
// @desc    Generate custom workspace template using AI
// @access  Private
router.post('/generate-template', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { prompt, saveAsPublic } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Generate template using AI
    const templateData = await geminiService.generateWorkspaceTemplate(prompt);

    if (!templateData) {
      return res.status(500).json({ message: 'Failed to generate template' });
    }

    // Save template to database
    const { data: template, error } = await supabase
      .from('workspace_templates')
      .insert([{
        name: templateData.name,
        description: templateData.description,
        category: templateData.category || 'custom',
        default_view: templateData.default_view,
        theme: templateData.theme,
        background_type: templateData.background_type,
        background_value: templateData.background_value,
        primary_color: templateData.primary_color,
        secondary_color: templateData.secondary_color,
        board_configs: templateData.board_configs || [],
        sample_tasks: templateData.sample_tasks || [],
        is_ai_generated: true,
        ai_prompt: prompt,
        is_public: saveAsPublic || false,
        created_by: userId
      }])
      .select()
      .single();

    if (error) {
      console.error('Save template error:', error);
      return res.status(500).json({ message: 'Error saving template' });
    }

    res.status(201).json({
      ...template,
      _id: template.id,
      templateData
    });
  } catch (error) {
    console.error('Generate template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/workspaces/generate-and-create
// @desc    Generate AI template and immediately create workspace from it
// @access  Private
router.post('/generate-and-create', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { prompt, workspaceName } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Generate template using AI
    const templateData = await geminiService.generateWorkspaceTemplate(prompt);

    if (!templateData) {
      return res.status(500).json({ message: 'Failed to generate template' });
    }

    // Create workspace directly from AI-generated template
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([{
        user_id: userId,
        name: workspaceName || templateData.name,
        description: templateData.description,
        default_view: templateData.default_view,
        theme: templateData.theme,
        background_type: templateData.background_type,
        background_value: templateData.background_value,
        primary_color: templateData.primary_color,
        secondary_color: templateData.secondary_color
      }])
      .select()
      .single();

    if (workspaceError) {
      console.error('Create workspace error:', workspaceError);
      return res.status(500).json({ message: 'Error creating workspace' });
    }

    // Create board configs
    if (templateData.board_configs && Array.isArray(templateData.board_configs)) {
      const boardConfigsToInsert = templateData.board_configs.map((bc, index) => ({
        workspace_id: workspace.id,
        user_id: userId,
        view_type: bc.view_type,
        name: bc.name,
        config: bc.config || {},
        display_order: index
      }));

      await supabase
        .from('board_configs')
        .insert(boardConfigsToInsert);
    }

    res.status(201).json({
      ...workspace,
      _id: workspace.id,
      aiGenerated: true,
      templateData
    });
  } catch (error) {
    console.error('Generate and create workspace error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ TEAM WORKSPACE MEMBER MANAGEMENT ============

// @route   GET /api/workspaces/:id/members
// @desc    Get all members of a team workspace
// @access  Private (must be workspace member)
router.get('/:id/members', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Check if workspace exists and is a team workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('workspace_type')
      .eq('id', req.params.id)
      .single();

    if (!workspace || workspace.workspace_type !== 'team') {
      return res.status(404).json({ message: 'Team workspace not found' });
    }

    // Check if user is a member (check owner OR team member)
    const { data: workspaceOwner } = await supabase
      .from('workspaces')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    const isOwner = workspaceOwner?.user_id === userId;

    const { data: membership } = await supabase
      .from('team_workspace_members')
      .select('role')
      .eq('workspace_id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (!isOwner && !membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all members with user details
    const { data: members, error } = await supabase
      .from('team_workspace_members')
      .select(`
        *,
        user:users!team_workspace_members_user_id_fkey(id, email, name)
      `)
      .eq('workspace_id', req.params.id)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Get members error:', error);
      return res.status(500).json({ message: 'Error fetching members' });
    }

    res.json({
      members: (members || []).map(m => ({
        ...m,
        _id: m.id,
        user: m.user ? { ...m.user, _id: m.user.id } : null
      }))
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/workspaces/:id/members
// @desc    Add a member to team workspace
// @access  Private (must be owner or admin)
router.post('/:id/members', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { user_email, role } = req.body;

    if (!user_email) {
      return res.status(400).json({ message: 'User email is required' });
    }

    // Check if requester is owner or admin
    const { data: requesterMembership } = await supabase
      .from('team_workspace_members')
      .select('role')
      .eq('workspace_id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      return res.status(403).json({ message: 'Only owners and admins can add members' });
    }

    // Find user by email (case-insensitive)
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', user_email)
      .single();

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_workspace_members')
      .select('id')
      .eq('workspace_id', req.params.id)
      .eq('user_id', targetUser.id)
      .single();

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Add member
    const { data: member, error } = await supabase
      .from('team_workspace_members')
      .insert([{
        workspace_id: req.params.id,
        user_id: targetUser.id,
        role: role || 'member',
        invited_by: userId
      }])
      .select(`
        *,
        user:users!team_workspace_members_user_id_fkey(id, email, name)
      `)
      .single();

    if (error) {
      console.error('Add member error:', error);
      return res.status(500).json({ message: 'Error adding member' });
    }

    res.status(201).json({
      ...member,
      _id: member.id,
      user: member.user ? { ...member.user, _id: member.user.id } : null
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/workspaces/:id/members/:memberId
// @desc    Update member role
// @access  Private (must be owner or admin)
router.put('/:id/members/:memberId', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { role } = req.body;

    if (!role || !['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required' });
    }

    // Check if requester is owner or admin
    const { data: requesterMembership } = await supabase
      .from('team_workspace_members')
      .select('role')
      .eq('workspace_id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      return res.status(403).json({ message: 'Only owners and admins can update roles' });
    }

    // Update member role
    const { data: member, error } = await supabase
      .from('team_workspace_members')
      .update({ role })
      .eq('id', req.params.memberId)
      .eq('workspace_id', req.params.id)
      .select(`
        *,
        user:users!team_workspace_members_user_id_fkey(id, email, name)
      `)
      .single();

    if (error) {
      console.error('Update member role error:', error);
      return res.status(500).json({ message: 'Error updating member role' });
    }

    res.json({
      ...member,
      _id: member.id,
      user: member.user ? { ...member.user, _id: member.user.id } : null
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/workspaces/:id/members/:memberId
// @desc    Remove member from team workspace
// @access  Private (must be owner/admin, or removing self)
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Get the member to be removed
    const { data: targetMember } = await supabase
      .from('team_workspace_members')
      .select('user_id, role')
      .eq('id', req.params.memberId)
      .eq('workspace_id', req.params.id)
      .single();

    if (!targetMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Check permissions: user can remove themselves, or owner/admin can remove others
    const isRemovingSelf = targetMember.user_id === userId;

    if (!isRemovingSelf) {
      const { data: requesterMembership } = await supabase
        .from('team_workspace_members')
        .select('role')
        .eq('workspace_id', req.params.id)
        .eq('user_id', userId)
        .single();

      if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
        return res.status(403).json({ message: 'Only owners and admins can remove members' });
      }
    }

    // Prevent removing the last owner
    if (targetMember.role === 'owner') {
      const { data: owners } = await supabase
        .from('team_workspace_members')
        .select('id')
        .eq('workspace_id', req.params.id)
        .eq('role', 'owner');

      if (owners && owners.length <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last owner' });
      }
    }

    // Remove member
    const { error } = await supabase
      .from('team_workspace_members')
      .delete()
      .eq('id', req.params.memberId)
      .eq('workspace_id', req.params.id);

    if (error) {
      console.error('Remove member error:', error);
      return res.status(500).json({ message: 'Error removing member' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
