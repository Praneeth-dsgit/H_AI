#!/usr/bin/env python3
"""
Scheduled task script for updating daily appointments
This script should be run daily at 12:00 AM to update the appointments cache
"""

import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('daily_appointments_scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Main function to run the daily appointments update"""
    try:
        logger.info("=" * 60)
        logger.info(f"🕛 Starting daily appointments update at {datetime.now()}")
        logger.info("=" * 60)
        
        # Check if required environment variables are set
        if not os.getenv('OPENAI_API_KEY'):
            logger.error("❌ OPENAI_API_KEY not found in environment variables")
            return False
        
        # Import and run the daily appointments update
        from db_read_agent import run_daily_appointments_update
        
        # Run the update
        success = run_daily_appointments_update()
        
        if success:
            logger.info("✅ Daily appointments update completed successfully")
        else:
            logger.error("❌ Daily appointments update failed")
        
        logger.info("=" * 60)
        return success
        
    except Exception as e:
        logger.error(f"❌ Fatal error in daily appointments scheduler: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 