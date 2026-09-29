from sqlalchemy.orm import Session
from backend.app.models.user import User
from typing import Optional

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, user_data: dict) -> User:
        db_user = User(**user_data)
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update(self, user_id: int, updates: dict) -> Optional[User]:
        user = self.get_by_id(user_id)
        if user:
            for key, value in updates.items():
                setattr(user, key, value)
            self.db.commit()
            self.db.refresh(user)
        return user
