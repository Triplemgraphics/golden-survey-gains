-- Insert sample Kenya company surveys
INSERT INTO public.surveys (title, description, category, reward, duration_minutes, status, questions) VALUES
(
  'Safaricom Services Survey',
  'Share your experience with Safaricom mobile services, M-Pesa, and network coverage',
  'Telecommunications',
  150.00,
  10,
  'active',
  '[
    {
      "id": "q1",
      "question": "Which Safaricom services do you use regularly?",
      "type": "multiple_choice",
      "options": ["Voice calls", "SMS", "M-Pesa", "Data/Internet", "Bonga Points"],
      "required": true
    },
    {
      "id": "q2", 
      "question": "How would you rate Safaricom''s network coverage in your area?",
      "type": "single_choice",
      "options": ["Excellent", "Good", "Fair", "Poor"],
      "required": true
    },
    {
      "id": "q3",
      "question": "How often do you use M-Pesa for transactions?",
      "type": "single_choice", 
      "options": ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
      "required": true
    }
  ]'
),
(
  'Equity Bank Customer Experience',
  'Tell us about your experience with Equity Bank services and digital banking',
  'Banking',
  200.00,
  12,
  'active',
  '[
    {
      "id": "q1",
      "question": "Which Equity Bank services do you use?",
      "type": "multiple_choice",
      "options": ["Savings Account", "Current Account", "Loans", "Equitel", "EazzyApp"],
      "required": true
    },
    {
      "id": "q2",
      "question": "How satisfied are you with Equity Bank''s customer service?",
      "type": "single_choice",
      "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
      "required": true
    },
    {
      "id": "q3",
      "question": "How often do you visit Equity Bank branches?",
      "type": "single_choice",
      "options": ["Weekly", "Monthly", "Quarterly", "Rarely", "Never - I use digital only"],
      "required": true
    }
  ]'
),
(
  'KCB Bank Digital Services',
  'Evaluate KCB Bank''s mobile banking and online services',
  'Banking',
  180.00,
  8,
  'active',
  '[
    {
      "id": "q1",
      "question": "Which KCB digital platforms do you use?",
      "type": "multiple_choice", 
      "options": ["KCB Mobile App", "Internet Banking", "KCB-MPESA", "ATMs", "None"],
      "required": true
    },
    {
      "id": "q2",
      "question": "How easy is it to use KCB''s mobile banking app?",
      "type": "single_choice",
      "options": ["Very Easy", "Easy", "Moderate", "Difficult", "Very Difficult"],
      "required": true
    }
  ]'
),
(
  'Airtel Kenya Services Review',
  'Share your thoughts on Airtel Kenya''s mobile and data services',
  'Telecommunications',
  120.00,
  8,
  'active',
  '[
    {
      "id": "q1",
      "question": "What Airtel services do you use?",
      "type": "multiple_choice",
      "options": ["Voice calls", "SMS", "Data bundles", "Airtel Money", "International calls"],
      "required": true
    },
    {
      "id": "q2",
      "question": "How is Airtel''s data speed in your area?",
      "type": "single_choice",
      "options": ["Excellent", "Good", "Average", "Below Average", "Poor"],
      "required": true
    }
  ]'
),
(
  'Tusker Beer Brand Perception',
  'Help us understand your perception of Tusker beer and EABL products',
  'Consumer Goods',
  250.00,
  15,
  'active', 
  '[
    {
      "id": "q1",
      "question": "Which EABL beer brands are you familiar with?",
      "type": "multiple_choice",
      "options": ["Tusker", "Tusker Lite", "Pilsner", "White Cap", "Guinness", "Senator"],
      "required": true
    },
    {
      "id": "q2",
      "question": "How often do you consume Tusker beer?",
      "type": "single_choice",
      "options": ["Daily", "Weekly", "Monthly", "Special occasions only", "Never"],
      "required": true
    },
    {
      "id": "q3",
      "question": "What influences your beer choice most?",
      "type": "single_choice",
      "options": ["Price", "Taste", "Brand reputation", "Availability", "Alcohol content"],
      "required": true
    }
  ]'
),
(
  'Kenya Power Service Quality',
  'Rate your experience with Kenya Power electricity services',
  'Utilities',
  180.00,
  10,
  'active',
  '[
    {
      "id": "q1",
      "question": "How often do you experience power outages?",
      "type": "single_choice",
      "options": ["Daily", "Weekly", "Monthly", "Rarely", "Never"],
      "required": true
    },
    {
      "id": "q2",
      "question": "How do you pay your electricity bills?",
      "type": "single_choice",
      "options": ["M-Pesa", "Bank", "Kenya Power offices", "Mobile app", "Online"],
      "required": true
    },
    {
      "id": "q3",
      "question": "Rate Kenya Power''s customer service",
      "type": "single_choice",
      "options": ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
      "required": true
    }
  ]'
);

-- Create a test survey for new users (no reward)
INSERT INTO public.surveys (title, description, category, reward, duration_minutes, status, questions) VALUES
(
  'Kenya Companies Knowledge Test',
  'Test your knowledge about major Kenyan companies and their services - No reward, just for skill assessment',
  'Knowledge Test',
  0.00,
  5,
  'active',
  '[
    {
      "id": "test1",
      "question": "Which company is the largest telecommunications provider in Kenya?",
      "type": "single_choice",
      "options": ["Safaricom", "Airtel", "Telkom Kenya", "Jamii Telecommunications"],
      "required": true,
      "correct_answer": "Safaricom"
    },
    {
      "id": "test2", 
      "question": "What is the name of Safaricom''s mobile money service?",
      "type": "single_choice",
      "options": ["M-Shwari", "M-Pesa", "KCB-MPESA", "Airtel Money"],
      "required": true,
      "correct_answer": "M-Pesa"
    },
    {
      "id": "test3",
      "question": "Which of these is a major Kenyan bank?",
      "type": "single_choice",
      "options": ["Equity Bank", "Standard Bank", "First National Bank", "Access Bank"],
      "required": true,
      "correct_answer": "Equity Bank"
    },
    {
      "id": "test4",
      "question": "What is the main brewery company in Kenya?",
      "type": "single_choice", 
      "options": ["Kenya Breweries", "East African Breweries Limited", "Tusker Breweries", "Kenya Beer Company"],
      "required": true,
      "correct_answer": "East African Breweries Limited"
    }
  ]'
);