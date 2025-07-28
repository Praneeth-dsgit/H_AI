# Daily Appointments Setup Guide

## Overview

The Patient Engagement dashboard now includes a daily appointments feature that automatically shows today's appointments without requiring manual queries. This is powered by a scheduled task that runs daily at 12:00 AM.

## Features

- **Automatic Daily Updates**: Appointments are refreshed daily at 12:00 AM
- **Caching System**: Results are cached for fast loading
- **Real-time Display**: Shows appointments immediately when the dashboard loads
- **Status Indicators**: Color-coded appointment status (confirmed, pending, cancelled)

## Database Requirements

Your database should have the following tables:

### Appointments Table
```sql
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    doctor_id INT,
    appointment_time DATETIME,
    status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

### Patients Table
```sql
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Doctors Table
```sql
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Setup Instructions

### 1. Manual Testing

First, test the functionality manually:

```bash
cd api
python db_read_agent.py
```

Choose option 2 to view today's appointments, or option 3 to update the cache.

### 2. Test the Scheduler

Run the scheduler manually to test:

```bash
cd api
python schedule_daily_appointments.py
```

### 3. Set Up Automated Scheduling

#### Option A: Using Cron (Linux/Mac)

1. Open crontab:
```bash
crontab -e
```

2. Add this line to run daily at 12:00 AM:
```bash
0 0 * * * cd /path/to/your/api && python schedule_daily_appointments.py
```

#### Option B: Using Windows Task Scheduler

1. Open Task Scheduler
2. Create a new Basic Task
3. Set trigger to Daily at 12:00 AM
4. Set action to start a program
5. Program: `python`
6. Arguments: `schedule_daily_appointments.py`
7. Start in: `C:\path\to\your\api`

#### Option C: Using systemd (Linux)

1. Create a service file `/etc/systemd/system/daily-appointments.service`:
```ini
[Unit]
Description=Daily Appointments Update
After=network.target

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/path/to/your/api
ExecStart=/usr/bin/python3 schedule_daily_appointments.py
Environment=PATH=/usr/bin:/usr/local/bin

[Install]
WantedBy=multi-user.target
```

2. Create a timer file `/etc/systemd/system/daily-appointments.timer`:
```ini
[Unit]
Description=Run daily appointments update at midnight
Requires=daily-appointments.service

[Timer]
OnCalendar=*-*-* 00:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

3. Enable and start the timer:
```bash
sudo systemctl enable daily-appointments.timer
sudo systemctl start daily-appointments.timer
```

## Monitoring

### Log Files

The scheduler creates log files:
- `daily_appointments_scheduler.log` - Scheduler execution logs
- `daily_appointments_cache.json` - Cached appointment data

### Check Status

To check if the scheduler is working:

```bash
# Check cron jobs
crontab -l

# Check systemd timer
sudo systemctl status daily-appointments.timer

# Check log files
tail -f api/daily_appointments_scheduler.log
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `.env` file has correct database credentials
   - Ensure MySQL server is running
   - Verify database and tables exist

2. **Permission Errors**
   - Ensure the script has read/write permissions
   - Check the working directory permissions

3. **Python Path Issues**
   - Use absolute paths in cron/systemd
   - Ensure virtual environment is activated if using one

4. **Cache Not Updating**
   - Check the scheduler logs for errors
   - Manually run the scheduler to test
   - Verify the cache file is being created

### Manual Cache Update

If the automatic update fails, you can manually update the cache:

```bash
cd api
python db_read_agent.py
# Choose option 3
```

### Reset Cache

To reset the cache and force a fresh update:

```bash
cd api
rm daily_appointments_cache.json
python schedule_daily_appointments.py
```

## API Endpoints

The system provides these endpoints:

- `GET /api/patient-engagement/daily-appointments` - Get today's appointments
- `POST /api/patient-engagement/query` - Run custom database queries

## Frontend Integration

The Patient Engagement dashboard automatically:
1. Loads daily appointments when the component mounts
2. Displays appointments in the left panel
3. Shows appointment status with color coding
4. Updates automatically when the cache is refreshed

## Security Considerations

- The scheduler runs with the same permissions as the user
- Cache files should be protected from unauthorized access
- Database credentials should be stored securely in `.env`
- Log files may contain sensitive information

## Performance

- Cache reduces database load
- Appointments are loaded once per day
- Frontend loads cached data instantly
- Manual cache updates available for urgent changes 