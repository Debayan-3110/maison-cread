import psycopg2

DATABASE_URL = 'postgresql://neondb_owner:npg_r6oBvfzNngI3@ep-shy-mouse-b3lw7wan-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
print("Existing Tables:", cur.fetchall())
cur.execute("SELECT current_database(), current_user")
print("Database & User:", cur.fetchone())
conn.close()

