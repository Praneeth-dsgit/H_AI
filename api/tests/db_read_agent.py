import pymysql
import os
import re
from dotenv import load_dotenv
import openai
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY not found in environment variables")
    exit(1)

openai.api_key = OPENAI_API_KEY

# MySQL configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'hospital_db')

DB_CONFIG = {
    "host": MYSQL_HOST,
    "database": MYSQL_DATABASE,
    "user": MYSQL_USER,
    "password": MYSQL_PASSWORD,
    "port": MYSQL_PORT,
    "charset": "utf8mb4"
}

class DatabaseAgent:
    def __init__(self):
        self.schema_cache = None
    
    def get_database_schema(self):
        """Dynamically retrieve the actual database schema"""
        if self.schema_cache:
            return self.schema_cache
            
        try:
            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            # Get all tables
            cursor.execute("SHOW TABLES")
            tables = [row[0] for row in cursor.fetchall()]
            
            schema_info = {}
            for table in tables:
                # Get column information for each table
                cursor.execute(f"DESCRIBE {table}")
                columns = cursor.fetchall()
                schema_info[table] = {
                    'columns': [
                        {
                            'name': col[0],
                            'type': col[1],
                            'null': col[2],
                            'key': col[3],
                            'default': col[4],
                            'extra': col[5]
                        } for col in columns
                    ]
                }
            
            cursor.close()
            conn.close()
            
            self.schema_cache = schema_info
            return schema_info
            
        except Exception as e:
            logger.error(f"Error retrieving schema: {e}")
            return {}
    
    def format_schema_for_gpt(self, schema):
        """Format schema information for GPT prompt"""
        formatted = "DATABASE SCHEMA:\n\n"
        
        for table_name, table_info in schema.items():
            formatted += f"Table: {table_name}\n"
            for col in table_info['columns']:
                key_info = f" ({col['key']})" if col['key'] else ""
                null_info = "NOT NULL" if col['null'] == 'NO' else "NULL"
                formatted += f"  - {col['name']} ({col['type']}) {null_info}{key_info}\n"
            formatted += "\n"
        
        return formatted
    
    def validate_sql(self, sql_query):
        """Basic SQL validation and safety checks"""
        # Convert to lowercase for checking
        sql_lower = sql_query.lower().strip()
        
        # Only allow SELECT statements
        if not sql_lower.startswith('select'):
            return False, "Only SELECT queries are allowed"
        
        # Block dangerous keywords
        dangerous_keywords = [
            'drop', 'delete', 'insert', 'update', 'create', 'alter', 
            'truncate', 'exec', 'execute', 'xp_', 'sp_'
        ]
        
        for keyword in dangerous_keywords:
            if keyword in sql_lower:
                return False, f"Dangerous keyword '{keyword}' not allowed"
        
        # Basic SQL injection patterns
        injection_patterns = [
            r';\s*(drop|delete|insert|update)', 
            r'union\s+select',
            r'--\s*\w+',
            r'/\*.*\*/'
        ]
        
        for pattern in injection_patterns:
            if re.search(pattern, sql_lower):
                return False, "Potential SQL injection detected"
        
        return True, "Valid"
    
    def generate_sql(self, question):
        """Generate SQL using GPT"""
        schema = self.get_database_schema()
        formatted_schema = self.format_schema_for_gpt(schema)
        
        prompt = f"""You are a database assistant that generates safe SQL queries.

{formatted_schema}

INSTRUCTIONS:
1. Generate ONLY SELECT queries - no INSERT/UPDATE/DELETE
2. Use proper JOIN clauses when needed
3. Return only the SQL query, no explanations
4. Use LIMIT to prevent large result sets
5. Handle common date/time queries appropriately
6. Use appropriate WHERE clauses for filtering

USER QUESTION: "{question}"

SQL Query:"""

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.1
            )
            
            sql_query = response.choices[0].message['content'].strip()
            
            # Remove markdown formatting if present
            sql_query = re.sub(r'^```sql\s*', '', sql_query)
            sql_query = re.sub(r'```$', '', sql_query)
            sql_query = sql_query.strip()
            
            return sql_query
            
        except Exception as e:
            logger.error(f"Error generating SQL: {e}")
            return None
    
    def execute_query(self, sql_query):
        """Execute SQL query safely"""
        # Validate SQL first
        is_valid, message = self.validate_sql(sql_query)
        if not is_valid:
            return None, f"SQL Validation Error: {message}"
        
        try:
            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor(pymysql.cursors.DictCursor)
            
            # Add LIMIT if not present for safety
            if 'limit' not in sql_query.lower():
                sql_query += " LIMIT 100"
            
            cursor.execute(sql_query)
            results = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return results, None
            
        except Exception as e:
            logger.error(f"Database query error: {e}")
            return None, str(e)
    
    def process_question(self, question):
        """Main method to process natural language questions"""
        print(f"\n🔍 Processing question: '{question}'")
        
        # Generate SQL query
        print("\n🧠 Generating SQL query...")
        sql_query = self.generate_sql(question)
        
        if not sql_query:
            return "❌ Failed to generate SQL query"
        
        print(f"📝 Generated SQL: {sql_query}")
        
        # Execute query
        print("\n🗄️ Executing database query...")
        results, error = self.execute_query(sql_query)
        
        if error:
            return f"❌ Database Error: {error}"
        
        if not results:
            return "✅ Query executed successfully but returned no results"
        
        # Format results
        print(f"\n✅ Found {len(results)} result(s):")
        for i, row in enumerate(results, 1):
            print(f"\n--- Result {i} ---")
            for key, value in row.items():
                print(f"{key}: {value}")
        
        return results

def main():
    """Main function to run the database agent"""
    print("🗄️ Database Agent with Natural Language Processing")
    print("=" * 55)
    
    agent = DatabaseAgent()
    
    # Test database connection
    try:
        schema = agent.get_database_schema()
        if schema:
            print(f"✅ Connected to database '{MYSQL_DATABASE}'")
            print(f"📊 Found {len(schema)} table(s): {', '.join(schema.keys())}")
        else:
            print("❌ Failed to connect to database")
            return
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return
    
    # Interactive mode
    while True:
        print("\n" + "-" * 55)
        question = input("\n💬 Enter your database question (or 'quit' to exit): ").strip()
        
        if question.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            break
        
        if not question:
            continue
        
        try:
            agent.process_question(question)
        except Exception as e:
            logger.error(f"Error processing question: {e}")
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()