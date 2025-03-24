-- Custom SQL migration file, put your code below! --
ALTER TABLE user_agent_weight 
ALTER COLUMN weight TYPE real USING weight::real;
