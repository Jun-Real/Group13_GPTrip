import sys
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import SessionLocal, engine
from models import Base, User

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def add_user(username: str, password: str, db: Session):
    # 사용자 존재 여부 확인
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        print(f"오류: 사용자 '{username}'은(는) 이미 존재합니다.")
        return

    # 새 사용자 생성
    hashed_password = get_password_hash(password)
    new_user = User(username=username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"사용자 '{username}'이(가) 성공적으로 추가되었습니다.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("사용법: python add_user.py <username> <password>")
    else:
        username = sys.argv[1]
        password = sys.argv[2]
        db = SessionLocal()
        try:
            add_user(username, password, db)
        finally:
            db.close()

