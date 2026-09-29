import sqlite3
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal, engine
from backend.app.models.user import User
from backend.app.models.product import Product
from backend.app.models.order import Order, OrderItem
import json
from datetime import datetime

def migrate():
    # Connect to SQLite
    sqlite_conn = sqlite3.connect("C:/Users/debay/Downloads/E-commerce/backend/ecommerce.db")
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()
    
    db = SessionLocal()
    try:
        print("Migrating Users...")
        users = cursor.execute("SELECT * FROM users").fetchall()
        for u in users:
            user = User(
                id=u['id'],
                email=u['email'],
                hashed_password=u['password_hash'],
                full_name=u['full_name'],
                address=u.get('address'),
                is_verified=bool(u['is_verified']),
                two_factor_enabled=bool(u.get('two_factor_enabled', 0)),
                two_factor_secret=u.get('two_factor_secret'),
                verification_token=u.get('verification_token'),
                verification_token_expires_at=u.get('verification_token_expires_at'),
                reset_token=u.get('reset_token'),
                reset_token_expires_at=u.get('reset_token_expires_at'),
                failed_login_attempts=u.get('failed_login_attempts', 0),
                lockout_until=u.get('lockout_until')
            )
            db.merge(user)
        
        print("Migrating Products...")
        products = cursor.execute("SELECT * FROM products").fetchall()
        for p in products:
            product = Product(
                id=p['id'],
                title=p['title'],
                description=p['description'],
                price=p['price'],
                category=p['category'],
                thumbnail=p['thumbnail'],
                rating=p['rating'],
                stock=p['stock'],
                brand=p['brand'],
                discount_percentage=p['discountPercentage']
            )
            db.merge(product)
            
        print("Migrating Orders...")
        orders = cursor.execute("SELECT * FROM orders").fetchall()
        for o in orders:
            # Handle JSON fields from SQLite
            shipping_info = json.loads(o['shippingInfo']) if isinstance(o['shippingInfo'], str) else o['shippingInfo']
            payment_info = json.loads(o['paymentInfo']) if isinstance(o['paymentInfo'], str) else o['paymentInfo']
            summary = json.loads(o['summary']) if isinstance(o['summary'], str) else o['summary']
            
            order = Order(
                id=o['id'],
                user_id=o['user_id'],
                date=o['date'],
                status=o['status'],
                estimated_delivery=o['estimatedDelivery'],
                shipping_info=shipping_info,
                payment_info=payment_info,
                summary=summary
            )
            db.merge(order)
        
        db.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()
        sqlite_conn.close()

if __name__ == "__main__":
    migrate()
