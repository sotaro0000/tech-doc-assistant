CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    department VARCHAR(50),
    salary INTEGER,
    hire_date DATE
);

INSERT INTO employees (name, department, salary, hire_date) VALUES
('Alice Smith', 'Engineering', 75000, '2020-01-15'),
('Bob Johnson', 'Marketing', 65000, '2019-06-20'),
('Charlie Brown', 'Engineering', 85000, '2018-03-10'),
('Diana Prince', 'Sales', 70000, '2021-02-28'),
('Eve Davis', 'Engineering', 80000, '2020-09-05');

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(100),
    status VARCHAR(20),
    budget INTEGER
);

INSERT INTO projects (project_name, status, budget) VALUES
('Project Alpha', 'Active', 500000),
('Project Beta', 'Completed', 300000),
('Project Gamma', 'Planning', 750000);

INSERT INTO "User" (id, email, name, image)
VALUES (
  'demo-user-001',
  'demo@example.com',
  'Demo User',
  'https://avatars.githubusercontent.com/u/0'
);