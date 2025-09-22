-- Create the missing demographics and test surveys
INSERT INTO public.surveys (id, title, description, category, reward, duration_minutes, status, questions, created_at, updated_at) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Free Demographics Survey',
  'Tell us about yourself to get started',
  'demographics',
  5.00,
  3,
  'active',
  '[
    {"id": "q1", "type": "single_choice", "question": "What is your age group?", "options": ["18-24", "25-34", "35-44", "45-54", "55+"], "required": true},
    {"id": "q2", "type": "single_choice", "question": "What is your highest education level?", "options": ["Primary", "Secondary", "College/University", "Postgraduate"], "required": true},
    {"id": "q3", "type": "single_choice", "question": "What is your employment status?", "options": ["Employed Full-time", "Employed Part-time", "Self-employed", "Student", "Unemployed"], "required": true},
    {"id": "q4", "type": "single_choice", "question": "Which county are you located in?", "options": ["Nairobi", "Mombasa", "Kiambu", "Nakuru", "Other"], "required": true},
    {"id": "q5", "type": "single_choice", "question": "How often do you use the internet?", "options": ["Daily", "Weekly", "Monthly", "Rarely"], "required": true},
    {"id": "q6", "type": "single_choice", "question": "What is your approximate monthly income?", "options": ["Below Ksh 20,000", "Ksh 20,000 - 50,000", "Ksh 50,000 - 100,000", "Above Ksh 100,000"], "required": true}
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Create a test survey for Kenya Companies Knowledge Test
INSERT INTO public.surveys (title, description, category, reward, duration_minutes, status, questions, created_at, updated_at) 
VALUES (
  'Kenya Companies Knowledge Test',
  'Test your knowledge about major companies in Kenya',
  'knowledge_test',
  0.00,
  5,
  'active',
  '[
    {"id": "q1", "type": "single_choice", "question": "Which is the largest bank in Kenya by asset base?", "options": ["KCB Bank", "Equity Bank", "Cooperative Bank", "Standard Chartered"], "required": true},
    {"id": "q2", "type": "single_choice", "question": "What is the main business of Safaricom?", "options": ["Banking", "Telecommunications", "Insurance", "Manufacturing"], "required": true},
    {"id": "q3", "type": "single_choice", "question": "Which company operates the Jomo Kenyatta International Airport?", "options": ["Kenya Airways", "Kenya Airports Authority", "Safaricom", "KCB Bank"], "required": true}
  ]'::jsonb,
  NOW(),
  NOW()
);