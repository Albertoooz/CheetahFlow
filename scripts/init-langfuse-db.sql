-- Create the langfuse database alongside agentflow (runs once on first postgres start)
SELECT 'CREATE DATABASE langfuse'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'langfuse')\gexec
