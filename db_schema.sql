-- Database schema for NexTime application

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    avatar TEXT,
    global_role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    gender VARCHAR(50),
    birthday VARCHAR(50), -- kept as VARCHAR to align with react string picker YYYY-MM-DD
    skills TEXT[] DEFAULT '{}'
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50),
    budget NUMERIC,
    members JSONB DEFAULT '[]'::jsonb
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    assignee_id VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    estimated_hours NUMERIC NOT NULL DEFAULT 0,
    created_at VARCHAR(50) NOT NULL,
    parent_id VARCHAR(50),
    start_date VARCHAR(50),
    end_date VARCHAR(50)
);

-- 4. Task Templates Table
CREATE TABLE IF NOT EXISTS task_templates (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    start_percent NUMERIC NOT NULL DEFAULT 0,
    end_percent NUMERIC NOT NULL DEFAULT 100,
    estimated_hours NUMERIC NOT NULL DEFAULT 0
);

-- 5. Timesheets Table
CREATE TABLE IF NOT EXISTS timesheets (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    project_id VARCHAR(50) NOT NULL,
    task_id VARCHAR(50),
    date VARCHAR(50) NOT NULL,
    hours NUMERIC NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),
    approved_at VARCHAR(50)
);
