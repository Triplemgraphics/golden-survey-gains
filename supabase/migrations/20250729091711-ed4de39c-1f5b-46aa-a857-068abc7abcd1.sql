-- Create a special survey record for the free demographics survey
INSERT INTO public.surveys (
  id,
  title,
  description,
  reward,
  status,
  category,
  duration_minutes,
  questions
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Free Demographics Survey',
  'Help us understand our community better',
  25.00,
  'active',
  'demographics',
  10,
  '{
    "questions": [
      {
        "id": "q1",
        "question": "What is your age range?",
        "type": "single_choice",
        "options": ["18-24", "25-34", "35-44", "45-54", "55+"],
        "required": true
      },
      {
        "id": "q2", 
        "question": "What is your highest level of education?",
        "type": "single_choice",
        "options": ["Primary", "Secondary", "Certificate/Diploma", "Bachelor''s Degree", "Master''s Degree", "PhD"],
        "required": true
      },
      {
        "id": "q3",
        "question": "What is your current employment status?", 
        "type": "single_choice",
        "options": ["Employed Full-time", "Employed Part-time", "Self-employed", "Student", "Unemployed", "Retired"],
        "required": true
      },
      {
        "id": "q4",
        "question": "Which county do you live in?",
        "type": "single_choice", 
        "options": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Machakos", "Kiambu", "Other"],
        "required": true
      },
      {
        "id": "q5",
        "question": "How often do you use the internet?",
        "type": "single_choice",
        "options": ["Daily", "Several times a week", "Once a week", "Few times a month", "Rarely"], 
        "required": true
      },
      {
        "id": "q6",
        "question": "What best describes your monthly income range?",
        "type": "single_choice",
        "options": ["Below Ksh 20,000", "Ksh 20,000 - 50,000", "Ksh 50,000 - 100,000", "Ksh 100,000 - 200,000", "Above Ksh 200,000"],
        "required": true
      }
    ]
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;