# Patient Engagement Dashboard

## Overview

The Patient Engagement capability is a completely different functionality from the other three capabilities (General, Radiology, Lab). Instead of using a chat interface, it provides a database query interface that allows you to query patient data directly using natural language.

## Features

- **Natural Language Database Queries**: Ask questions about patient data in plain English
- **Quick Query Templates**: Pre-built queries for common patient engagement scenarios
- **Real-time Results**: Get instant database results in a table format
- **No Patient Information Required**: Unlike other capabilities, this doesn't require patient info input

## How to Use

### 1. Select Patient Engagement Mode
- Choose "Patient Engagement" from the capability selector
- This will open the Patient Engagement Dashboard instead of the chat interface

### 2. Query the Database
- Use the text area to ask questions about patient data
- Examples:
  - "Show me all patients with diabetes"
  - "List patients who need follow-up appointments"
  - "Find patients with high blood pressure"
  - "Show patient satisfaction scores"

### 3. Use Quick Queries
- Click on any of the pre-built quick queries in the left panel
- These are common queries that you can use as starting points

### 4. View Results
- Results are displayed in a table format on the right panel
- Each row represents a database record
- Column headers are automatically generated from the database schema

## Backend Implementation

The Patient Engagement functionality uses the modified `db_read_agent.py` in the api folder:

- **Endpoint**: `/api/patient-engagement/query`
- **Method**: POST
- **Request Body**: `{ "query": "your natural language query" }`
- **Response**: 
  ```json
  {
    "success": true,
    "results": [...],
    "count": 5
  }
  ```
  or
  ```json
  {
    "success": false,
    "error": "error message"
  }
  ```

## Database Requirements

To use this functionality, you need:

1. **MySQL Database**: Running and accessible
2. **Environment Variables**: Set in `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=hospital_db
   ```

## Testing the Integration

To test the database agent integration:

```bash
cd api
python test_db_agent.py
```

This will test the database connection and run sample queries to verify everything works correctly.

## Running Database Agent Independently

You can also run the database agent independently:

```bash
cd api
python db_read_agent.py
```

This will start an interactive session where you can query the database directly from the command line.

## Security Features

- **SQL Injection Protection**: All queries are validated and sanitized
- **Read-Only Queries**: Only SELECT statements are allowed
- **Query Limits**: Results are automatically limited to prevent large data dumps
- **Input Validation**: Natural language queries are processed safely

## Example Queries

### Patient Demographics
- "Show me all patients over 65 years old"
- "List patients by gender"
- "Find patients in specific age ranges"

### Medical Conditions
- "Show patients with diabetes"
- "List patients with chronic conditions"
- "Find patients with specific diagnoses"

### Appointments and Follow-ups
- "Show patients who missed appointments"
- "List patients due for follow-up"
- "Find patients with upcoming appointments"

### Engagement Metrics
- "Show patient satisfaction scores"
- "List patients with low engagement"
- "Find patients who need outreach"

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check if MySQL server is running
   - Verify database credentials in `.env` file
   - Ensure database exists

2. **OpenAI API Error**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check API key permissions and quota

3. **No Results**
   - Verify your database has data
   - Try simpler queries first
   - Check if the query matches your database schema

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your environment variables are set correctly
3. Ensure the backend server is running
4. Check the database connection and schema 