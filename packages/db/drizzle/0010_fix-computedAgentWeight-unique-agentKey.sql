-- Custom SQL migration file, put your code below! --
ALTER TABLE computed_agent_weight
ADD CONSTRAINT computed_agent_weight_agent_key_unique UNIQUE (agent_key);
