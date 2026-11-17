import crypto from 'crypto';

const DEFAULT_SCHEME_PERMISSIONS = JSON.stringify({
  browse_project: ['Admin', 'Manager', 'PM', 'Team Lead', 'Member'],
  create_task: ['Admin', 'PM', 'Team Lead', 'Member'],
  edit_task: ['Admin', 'PM', 'Team Lead', 'Assignee'],
  assign_task: ['Admin', 'Manager', 'PM', 'Team Lead'],
  delete_task: ['Admin', 'PM', 'Team Lead'],
  transition_task: ['Admin', 'PM', 'Team Lead', 'Assignee', 'Member'],
  manage_sprints: ['Admin', 'PM', 'Team Lead'],
  manage_releases: ['Admin', 'PM', 'Team Lead'],
  manage_members: ['Admin', 'PM', 'Team Lead'],
});

const DEFAULT_WORKFLOW_STATUSES = JSON.stringify(['To Do', 'In Progress', 'Review', 'Done']);
const DEFAULT_WORKFLOW_TRANSITIONS = JSON.stringify([
  { from: 'To Do', to: 'In Progress', conditions: [] },
  { from: 'In Progress', to: 'Review', conditions: [] },
  { from: 'In Progress', to: 'To Do', conditions: [] },
  { from: 'Review', to: 'Done', conditions: [] },
  { from: 'Review', to: 'In Progress', conditions: [] },
  { from: 'Done', to: 'In Progress', conditions: [{ type: 'pm_or_admin_only' }] },
]);

export const runSeedInitialData = async (client) => {
  const defaultPwHash = crypto.createHash('sha256').update('password123').digest('hex');

  const costRatesCount = await client.query('SELECT COUNT(*) FROM cost_rates');
  if (parseInt(costRatesCount.rows[0].count, 10) === 0) {
    const roles = [
      ['cr_1', 'Business Solution Analyst'],
      ['cr_2', 'Tech Lead / Architecture'],
      ['cr_3', 'Backend Developer'],
      ['cr_4', 'Frontend Developer'],
      ['cr_5', 'Integration Engineer'],
      ['cr_6', 'Quality Assurance'],
      ['cr_7', 'Scrum Master / Project'],
      ['cr_8', 'DevOps / Release Mgmt'],
      ['cr_9', 'Application Support'],
    ];
    for (const [id, roleName] of roles) {
      await client.query(
        'INSERT INTO cost_rates (id, role_name, rate_per_day, rate_per_hour, currency) VALUES ($1, $2, $3, $4, $5)',
        [id, roleName, 6500, 812.5, 'THB']
      );
    }
  }

  const schemeCount = await client.query('SELECT COUNT(*) FROM permission_schemes');
  if (parseInt(schemeCount.rows[0].count, 10) === 0) {
    await client.query(
      'INSERT INTO permission_schemes (id, name, description, permissions) VALUES ($1, $2, $3, $4)',
      [
        'scheme_default',
        'Default Permission Scheme',
        'Standard permissions for project members, managers, and admins.',
        DEFAULT_SCHEME_PERMISSIONS,
      ]
    );
    await client.query(
      "UPDATE projects SET permission_scheme_id = 'scheme_default' WHERE permission_scheme_id IS NULL"
    );
  }

  const workflowCount = await client.query('SELECT COUNT(*) FROM project_workflows');
  if (parseInt(workflowCount.rows[0].count, 10) === 0) {
    const projectsRes = await client.query('SELECT id FROM projects');
    for (const p of projectsRes.rows) {
      await client.query(
        'INSERT INTO project_workflows (project_id, statuses, transitions) VALUES ($1, $2, $3) ON CONFLICT (project_id) DO NOTHING',
        [p.id, DEFAULT_WORKFLOW_STATUSES, DEFAULT_WORKFLOW_TRANSITIONS]
      );
    }
  }

  const userCount = await client.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCount.rows[0].count, 10) === 0) {
    const mockUsers = [
      ['u1', 'John Doe', 'john.doe@company.com', 'https://i.pravatar.cc/150?u=u1', 'Manager', 'Engineering'],
      ['u2', 'Jane Smith', 'jane.smith@company.com', 'https://i.pravatar.cc/150?u=u2', 'Employee', 'Engineering'],
      ['u3', 'Mike Johnson', 'mike.j@company.com', 'https://i.pravatar.cc/150?u=u3', 'Employee', 'Design'],
      ['u4', 'isarachootip', 'isarachootip@gmail.com', 'https://i.pravatar.cc/150?u=u4', 'Admin', 'Management'],
    ];
    for (const [id, name, email, avatar, role, dept] of mockUsers) {
      await client.query(
        'INSERT INTO users (id, name, email, avatar, global_role, department, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, name, email, avatar, role, dept, defaultPwHash]
      );
    }

    const mockProjects = [
      [
        'p1', 'ChronoTrack Internal Tool', 'Developing the internal project and time management system.',
        'Active', '2026-06-01', '2026-08-30', 50000,
        JSON.stringify([{ userId: 'u1', role: 'PM' }, { userId: 'u2', role: 'Frontend dev' }, { userId: 'u3', role: 'Designer' }]),
      ],
      [
        'p2', 'E-Commerce Platform Redesign', 'Overhauling the client e-commerce portal with modern tech stack.',
        'Planning', '2026-07-15', '2026-10-30', 120000,
        JSON.stringify([{ userId: 'u1', role: 'PM' }, { userId: 'u2', role: 'SA' }, { userId: 'u3', role: 'Designer' }]),
      ],
    ];
    for (const [id, name, desc, status, sDate, eDate, budget, members] of mockProjects) {
      await client.query(
        'INSERT INTO projects (id, name, description, status, start_date, end_date, budget, members, permission_scheme_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [id, name, desc, status, sDate, eDate, budget, members, 'scheme_default']
      );
      await client.query(
        'INSERT INTO project_workflows (project_id, statuses, transitions) VALUES ($1, $2, $3) ON CONFLICT (project_id) DO NOTHING',
        [id, DEFAULT_WORKFLOW_STATUSES, DEFAULT_WORKFLOW_TRANSITIONS]
      );
    }
  }

  const templateCount = await client.query('SELECT COUNT(*) FROM task_templates');
  if (parseInt(templateCount.rows[0].count, 10) === 0) {
    const defaultTemplates = [
      ['tpl_1', 'Kick off Meeting', 'Align project stakeholders, clarify roles, objectives, and communication guidelines.', 'High', 0, 2, 4],
      ['tpl_2', 'SOW & Contract Sign off', 'Review, negotiate, and execute formal Statement of Work and contract agreements.', 'High', 2, 6, 8],
      ['tpl_3', 'Get Requirements & User Stories', 'Conduct requirement gathering sessions, detail user stories and acceptances.', 'Medium', 6, 20, 16],
      ['tpl_4', 'UX/UI Design & Prototyping', 'Design wireframes, mockups, design systems, and clickable prototypes.', 'Medium', 20, 35, 24],
      ['tpl_5', 'Setup Cloud Infrastructure & Environments', 'Provision servers, networks, PostgreSQL database clusters, SSL certificates, staging environment.', 'Medium', 25, 32, 12],
      ['tpl_6', 'API Contract & Backend Architecture Setup', 'Structure code repository, setup Express/Database config, write boilerplate APIs.', 'High', 32, 40, 16],
      ['tpl_7', 'Core Backend & Frontend Development', 'Code the core logic, business logic controllers, database integration, UI state management.', 'High', 40, 75, 40],
      ['tpl_8', 'Data Migration & Seeding', 'Develop ETL scripts, clean production dataset, perform dry-run imports.', 'Medium', 70, 75, 16],
      ['tpl_9', 'SIT (System Integration Testing)', 'Conduct end-to-end integration tests, trace network logs, and resolve edge cases.', 'High', 75, 85, 16],
      ['tpl_10', 'UAT (User Acceptance Testing)', 'User-facing validation testing, gather customer feedback, patch blocking bugs.', 'Urgent', 85, 95, 24],
      ['tpl_11', 'Production Release & Handover', 'Deploy build artifacts to production, verify functionality, transfer credentials and documentation.', 'Urgent', 95, 100, 8],
    ];
    for (const [id, title, desc, priority, sPct, ePct, hours] of defaultTemplates) {
      await client.query(
        'INSERT INTO task_templates (id, title, description, priority, start_percent, end_percent, estimated_hours) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, title, desc, priority, sPct, ePct, hours]
      );
    }
  }

  await client.query('UPDATE users SET password_hash = $1 WHERE password_hash IS NULL', [defaultPwHash]);

  const adminEmail = 'isarachootip@gmail.com';
  const adminExists = await client.query('SELECT id, global_role FROM users WHERE email = $1', [adminEmail]);
  if (adminExists.rows.length === 0) {
    await client.query(
      `INSERT INTO users (id, name, email, avatar, global_role, department, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, email = EXCLUDED.email, global_role = EXCLUDED.global_role,
         department = EXCLUDED.department, password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash)`,
      ['u_admin', 'isarachootip', adminEmail, 'https://i.pravatar.cc/150?u=u_admin', 'Admin', 'Management', defaultPwHash]
    );
  } else if (adminExists.rows[0].global_role !== 'Admin') {
    await client.query('UPDATE users SET global_role = $1 WHERE email = $2', ['Admin', adminEmail]);
  }
};
