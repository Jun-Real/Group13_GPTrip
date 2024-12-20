import os
import io
import re
import sqlite3
import requests
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field, validator
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.ext.declarative import declarative_base
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
import openai
import logging
import traceback
import googlemaps
from database import engine, SessionLocal, init_db
from datetime import date, datetime
from alembic import command
from alembic.config import Config
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Table
from datetime import datetime
from bs4 import BeautifulSoup
from sqlalchemy.sql import func
import random
from fastapi import Query

GMAP_API_KEY = "AIzaSyDbNb_h1RT5vUhywnigScdzZQQZVV-NuUE"
# API 할당 필요

openai.api_key = os.getenv("OPENAI_API_KEY")
logging.getLogger("googlemaps").setLevel(logging.WARNING)
logging.disable(logging.DEBUG)  # DEBUG 로그 비활성화
engine = create_engine("sqlite:///./test.db", echo=True)


def get_most_recent_row_as_list():
    # 데이터베이스 연결
    conn = sqlite3.connect('travel.db')
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM travel_info ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()

    if row:
        values = [str(value) for value in row]
        return values

    conn.close()
    return []

def search_and_generate(prompt, location, radius=7000, query="", language="ko", API=GMAP_API_KEY):
    search_results = gmaps.places(
        query=query,
        location=location,
        radius=radius,
        language=language
    )
    
    places = []
    for place in search_results["results"]:
        name = place.get("name", "이름 없음")
        address = place.get("formatted_address", "주소 없음")
        rating = place.get("rating", "평점 없음")

        places.append(f"{name} ({rating}) - {address}")
    
    places_text = "\n".join(places)
    gpt_prompt = f"""
    다음은 {location}에서 {query}를 할 수 있는 추천 장소들입니다:
    {places_text}
    
    사용자 요청: {prompt}
    
    반드시 아래의 형식으로만 답변을 작성하세요. 형식 외의 다른 내용은 절대 추가하지 마세요:
    ***형식: {query}//장소 이름//주소//간단한 설명//평점***

    예시:
    {query}//도쿄 타워//도쿄도 미나토구 시바코엔4초메 2-8//이 지역에서 가장 유명한 랜드마크 중 하나입니다.//4.5

    위의 형식을 반드시 따르고 형식을 벗어나는 응답은 절대 작성하지 마세요.
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "당신은 일본 여행 추천 전문가입니다. 반드시 일본 부분에서만 추천해주세요. 일본이 아닌 지역은 무조건 배제해주세요."},
            {"role": "user", "content": gpt_prompt}
        ],
        max_tokens=200,
        temperature=0.2,
        top_p=0.7,
        frequency_penalty=0.0,
        presence_penalty=0.0
    )

    return response["choices"][0]["message"]["content"], places_text

def only_generate(prompt, location, query, place_data):
    gpt_prompt = f"""
    다음은 {location}에서 {query}를 할 수 있는 추천 장소들입니다:
    {place_data}
    
    사용자 요청: {prompt}
    
    반드시 아래 형식을 사용해 답변하세요. 형식을 벗어나는 응답은 절대 작성하지 마세요:
    ***{query}//장소 이름//주소//간단한 설명//평점***

    형식 예시:
    {query}//도쿄 타워//도쿄도 미나토구 시바코엔4초메 2-8//이 지역에서 가장 유명한 랜드마크 중 하나입니다.//4.5

    주의사항:
    1. 장소와 주소는 반드시 {place_data}에 있는 그대로 사용해야 합니다.
    2. 한 번에 한 가지 추천만 제공하세요.
    3. 추가적인 설명, 형식에 맞지 않는 내용, 또는 한국어 외의 언어는 포함하지 마세요.
    4. 형식 오류가 있으면 자동으로 실패로 간주됩니다.
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": f"당신은 일본 여행 추천 전문가입니다. 반드시 일본 지역에서만 추천해주세요. 일본 외 지역은 배제하고, 요청된 형식만 따라야 합니다."},
            {"role": "user", "content": gpt_prompt}
        ],
        max_tokens=200,
        temperature=0.3,
        top_p=0.7,
        frequency_penalty=0.0,
        presence_penalty=0.0
    )

    return response["choices"][0]["message"]["content"]


def result(result, query):
    prompt = f"""
    다음은 요청한 형식으로 변환하는 작업입니다.

    1.`{result}` 내용을 반드시 다음 형식으로 변환하세요:
       - 형식: ***{query}//장소 이름//주소//간단한 설명//평점***
       - 예시: {query}//도쿄 타워//도쿄도 미나토구 시바코엔4초메 2-8//이 지역에서 가장 유명한 랜드마크 중 하나입니다.//4.5
    2. 출력 형식에 반드시 다섯 가지 항목만 포함되어야 합니다. (그보다 많거나 적으면 안 됩니다.)
    3. 첫 번째 칸에는 반드시 아래 중 하나가 포함되어야 합니다:
       - "아침 식사", "오전 활동", "점심 식사", "오후 활동", "저녁 식사"
    4. 형식을 벗어난 추가적인 텍스트는 절대 포함하지 마세요.

    입력 데이터:
    - 변환 대상 데이터: `{result}`
    """

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "당신은 지시를 엄격히 따르는 AI입니다. 요청한 작업을 정확히 수행하세요."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=200,
        temperature=0.8,
        top_p=0.9,
        frequency_penalty=0.5,
        presence_penalty=0.6
    )

    return response["choices"][0]["message"]["content"]




def isduple(result, duplication):
        prompt = f"""
        {duplication}안의 내용이 {result}에 포함되면 "O",
        아니라면 "X"라고 답해주세요
        반드시 답은 O , X 로만 답해야합니다."""
        response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "내용 포함 여부 확인 후 O 또는 X로만 답해주세요"},
            {"role": "user", "content": prompt}
        ],
        max_tokens=5,
        temperature=0.2,
        top_p=0.7,
        frequency_penalty=0.0,
        presence_penalty=0.0
    )
        

        return response["choices"][0]["message"]["content"]


data = get_most_recent_row_as_list()


load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

gmaps = googlemaps.Client(key=GMAP_API_KEY)

# Logging setup
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s',
                  handlers=[logging.StreamHandler(), logging.FileHandler("app.log")])
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = "sqlite:///./travel.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



# Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    travel_infos = relationship("TravelInfo", back_populates="user")

class TravelInfo(Base):
    __tablename__ = "travel_info"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    birth_year = Column(Integer)
    travelers = Column(Integer)
    budget = Column(Float)
    start_date = Column(Date)
    end_date = Column(Date)
    region = Column(String)
    activities = Column(String)  
    user = relationship("User", back_populates="travel_infos")


# Pydantic models
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ActivityCreate(BaseModel):
    user_id: int
    activities: List[int]

class RegionUpdate(BaseModel):
    user_id: int
    region: str


class TravelInfoCreate(BaseModel):
    user_id: int
    birth_year: int = Field(..., ge=1900, le=datetime.now().year)
    travelers: int = Field(..., ge=1, le=100)
    budget: float = Field(..., ge=200000)
    start_date: date
    end_date: date

    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('종료일은 시작일보다 늦어야 합니다')
        return v

    @validator('start_date', 'end_date')
    def dates_must_be_in_future(cls, v):
        if v < date.today():
            raise ValueError('날짜는 현재 이후여야 합니다')
        return v

    @validator('user_id', 'birth_year', 'travelers', pre=True)
    def ensure_integer(cls, v):
        if isinstance(v, str):
            return int(v)
        return v

    @validator('budget', pre=True)
    def ensure_float(cls, v):
        if isinstance(v, str):
            return float(v)
        return v

class Message(BaseModel):
    message: str


class PlanRequest(BaseModel):
    day: int
    locks: List[bool] = [0,0,0,0,0]
    condition: str

class Plan(BaseModel):
    planTitle: str
    title: str
    location: str
    description: str
    rating: str
    url: str

class PlanModel(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    trip_id = Column(Integer, nullable=False)
    day = Column(Integer, index=True)
    plan_title = Column(String)
    title = Column(String)
    location = Column(String)
    description = Column(String)
    rating = Column(Float)
    url = Column(String)

plans_database = [[]]
day = [1]
place_data = [[],[],[],[],[]]
duplication = "서울, "
# Create tables
Base.metadata.create_all(bind=engine)

# Alembic configuration
alembic_cfg = Config("alembic.ini")

# Function to run migrations
def run_migrations():
    command.upgrade(alembic_cfg, "head")

# FastAPI app setup
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Middleware for logging all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Received request: {request.method} {request.url}")
    body = await request.body()
    logger.debug(f"Request body: {body.decode()}")
    try:
        response = await call_next(request)
        logger.info(f"Sent response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# Routes
@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "GPTrip API에 오신 것을 환영합니다"}

@app.post("/register")
async def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    logger.info(f"Registration attempt for user: {user.username}")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        logger.warning(f"Registration failed: Username {user.username} already exists")
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자명입니다.")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info(f"User {user.username} registered successfully")
    return {"message": "회원가입이 완료되었습니다.", "userId": new_user.id}

@app.post("/login")
async def login(user: UserLogin, request: Request, db: Session = Depends(get_db)):
    logger.info(f"Login attempt for user: {user.username}")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        logger.warning(f"Login failed for user: {user.username}")
        raise HTTPException(status_code=400, detail="아이디 또는 비밀번호가 잘못되었습니다.")
    
    logger.info(f"Login successful for user: {user.username}")
    return {"message": "로그인 성공!", "userId": db_user.id}

@app.post("/chat")
async def chat_with_gpt(message: Message):
    if not message.message.strip():
        raise HTTPException(status_code=400, detail="메시지가 비어 있습니다. 올바른 메시지를 입력해주세요.")
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 일본여행을 계획해주는 사이트인 GPTrip의 인공지능 챗봇입니다. 일본여행 혹은 사이트와 관련 없는 대화엔 답변을 회피해주세요."},
                {"role": "user", "content": message.message}
            ],
            max_tokens=200,
            temperature=0.7,
            top_p=0.9,
            presence_penalty=0.1,
        )
        gpt_answer = response['choices'][0]['message']['content'].strip()
        return {"success": True, "response": gpt_answer}

    except openai.error.RateLimitError as e:
        logger.error(f"Rate limit error: {e}")
        raise HTTPException(status_code=429, detail="API 호출 제한을 초과했습니다.")
    
    except openai.error.AuthenticationError as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="API 인증에 실패했습니다.")
    
    except openai.error.InvalidRequestError as e:
        logger.error(f"Invalid request: {e}")
        raise HTTPException(status_code=400, detail="잘못된 요청입니다.")
    
    except openai.error.APIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail="OpenAI API 호출 중 오류가 발생했습니다.")
    
    except Exception as e:
        logger.error(f"Unexpected error: {e}")


@app.get("/api/some_endpoint")
def some_endpoint():
    response = JSONResponse(content={"message": "OK"})
    response.set_cookie(
        key="your_cookie_name",
        value="your_cookie_value",
        httponly=True,
        samesite="None",
        secure=False
    )
    return response
@app.post("/travelers-input-selection")
async def create_travel_info(travel_info: TravelInfoCreate, db: Session = Depends(get_db)):
    logger.info(f"Received travel info: {travel_info.dict()}")
    logger.info(f"Saving travel info for user ID: {travel_info.user_id}")
    
    try:
        # Check for existing info
        existing_info = db.query(TravelInfo).filter(
            TravelInfo.user_id == travel_info.user_id,
            TravelInfo.birth_year == travel_info.birth_year,
            TravelInfo.travelers == travel_info.travelers,
            TravelInfo.budget == travel_info.budget,
            TravelInfo.start_date == travel_info.start_date,
            TravelInfo.end_date == travel_info.end_date
        ).first()
        
        if existing_info:
            logger.info(f"Existing travel info found with id: {existing_info.id}")
            return {"id": existing_info.id, "message": "기존 정보가 존재합니다.", **travel_info.dict()}
        
        # Save new info
        db_travel_info = TravelInfo(**travel_info.dict())
        db.add(db_travel_info)
        db.commit()
        db.refresh(db_travel_info)
        logger.info(f"New travel info saved with id: {db_travel_info.id}")
        return {"id": db_travel_info.id, "message": "새로운 정보가 저장되었습니다.", **travel_info.dict()}
    except Exception as e:
        logger.error(f"Error saving travel info: {str(e)}")
        logger.error(f"Travel info causing error: {travel_info.dict()}")
        raise HTTPException(status_code=422, detail=f"데이터 처리 중 오류가 발생했습니다: {str(e)}")

# OPTIONS handler for CORS preflight requests
@app.options("/{path_name:path}")
async def preflight_handler(path_name: str):
    return JSONResponse(content="OK")


@app.get("/api/travel-info")
async def get_travel_info(db: Session = Depends(get_db)):

    travel_info = db.query(TravelInfo).order_by(TravelInfo.id.desc()).first()
    if not travel_info:
        raise HTTPException(status_code=404, detail="Travel info not found")
    
    return {
        "start_date": travel_info.start_date,
        "end_date": travel_info.end_date
    }



@app.on_event("startup")
async def startup_event():
    logger.info("서버 시작: 데이터베이스 초기화 중...")
    init_db()
    logger.info("데이터베이스 초기화 완료")

@app.post("/save-activities")
async def save_activities(activity_data: ActivityCreate, db: Session = Depends(get_db)):
    logger.info(f"Saving activities for user ID: {activity_data.user_id}")
    
    try:
   
        travel_info = db.query(TravelInfo).filter(TravelInfo.user_id == activity_data.user_id).order_by(TravelInfo.id.desc()).first()
        
        if not travel_info:
            raise HTTPException(status_code=404, detail="Travel info not found")
        
       
        activities_str = ",".join(map(str, activity_data.activities))
        
        travel_info.activities = activities_str
        
        db.commit()
        logger.info(f"Activities saved successfully for user ID: {activity_data.user_id}")
        return {"message": "Activities saved successfully"}
    except Exception as e:
        logger.error(f"Error saving activities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving activities: {str(e)}")

@app.post("/save-region")
async def save_region(region_data: RegionUpdate, db: Session = Depends(get_db)):
    logger.info(f"Saving region for user ID: {region_data.user_id}")
    
    try:

        travel_info = db.query(TravelInfo).filter(TravelInfo.user_id == region_data.user_id).order_by(TravelInfo.id.desc()).first()
        
        if not travel_info:
            raise HTTPException(status_code=404, detail="Travel info not found")
        
    
        travel_info.region = region_data.region
        
        db.commit()
        logger.info(f"Region saved successfully for user ID: {region_data.user_id}")
        return {"message": "Region saved successfully"}
    except Exception as e:
        logger.error(f"Error saving region: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving region: {str(e)}")



@app.post("/api/request_plans", response_model=List[Plan])
def request_plans(request: PlanRequest, db: Session = Depends(get_db)):
    global plans_database
    global day
    global data
    global place_data
    global duplication

    options = ["온천","신사","유니버설스튜디오","나라공원","스쿠버다이빙","후지산","디즈니랜드","성","전통공연","축제","맛집","카페"]
    data_list = data[8].split(",")
    chosen = random.choice(data_list)

    date_format = "%Y-%m-%d"
    date1 = datetime.strptime(data[5], date_format)
    date2 = datetime.strptime(data[6], date_format)
    duration = (date2 - date1).days
    if request.day ==1:
        duplication = "서울, "


    if request.day < day[0]:
        day[0] = request.day
        return plans_database[day[0]]

    keys = ["planTitle", "title", "location", "description", "rating", "url"]
    planTitles = ["아침 식사", "오전 활동", "점심 식사", "오후 활동", "저녁 식사"]
    
    region = data[7]
    
    prompt = f"""일본 {region} 에서 {request.day}일차 여행 계획을 세우고 있습니다.
        {data[2]}:탄생연도, 중요도 낮음
        {data[3]}:여행인원, 중요도 낮음
        {data[4]}:예산, 중요도 높음
        을 고려해주세요.
        이후의 내용은 우선적으로 고려해야할 사용자의 추가적인 요구 사항입니다:
        {request.condition}
"""      

    locks = request.locks
    
    plans = []
    for k in range(5):
        plans.append(dict(zip(keys, [""] * len(keys))))
    
    p=0
    while not all(locks):
        p+=1
        for i in range(5):
            if locks[i]:
                continue
            print(f"locks[{i}]: {locks}")
            if p==1:
                response, place_datas = search_and_generate(prompt, region, 20000, planTitles[i])
                place_data[i] = place_datas
            if p==3 and (i ==0 or i ==2 or i== 4):
                response, place_datas = search_and_generate(prompt,  region, 20000,  "식당")
                place_data[i] = place_data
            if p>=3 and (i ==1 or i ==3):
                response, place_datas = search_and_generate(prompt,region, 20000, options[int(chosen)-1])
                place_data[i] = place_data

            response = only_generate(prompt, region, planTitles[i], place_data[i])
            response_data = response.split("//")
            response_data_copy = response.split("//")
            if response_data[0] != planTitles[i] or len(response_data) != 5:
                while response_data[0] == planTitles[i] and len(response_data) == 5 and response_data[1] !="":
                    response_data = result(response_data_copy, planTitles[i])
                    response_data = response_data.split("//")

            response_data.append("")
            if isduple(response_data[1],duplication) == "O":
                continue

            if response_data[0] != planTitles[i]:
                response_data[0] = planTitles[i]
                response_data[-2] = response_data[-2][:3]

            response_2 = gmaps.find_place(
                input=f"{response_data[1]}, {region}",
                input_type="textquery",
                fields=["photos"]
            )["candidates"]

            photo_references = [
            photo["photo_reference"]
            for candidate in response_2
            if "photos" in candidate
            for photo in candidate["photos"]
            ]
            
            if photo_references:
                response_data[-1] = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_references[0]}&key={GMAP_API_KEY}"
            else:
                continue

            
            print(f"response[-1] : {response_data}")
            if len(response_data) == 6 and response_data[0] == planTitles[i]:
                plans[i] = dict(zip(keys[:], [c.strip() for c in response_data]))
                locks[i] = 1
                print(f"Updated locks[{i}] to True: {locks}")
                print(f"{duplication}")
            duplication += f"{response_data[1]},"
            
                
    day[0] = request.day
    plans_database = plans_database[:day[0]]
    plans_database.append(plans)

    return plans
    

@app.get("/api/get_plans/{day}")
def get_plans(day: int, user_id: int, trip_id: int, db: Session = Depends(get_db)):
    db_plans = db.query(PlanModel).filter(
        PlanModel.user_id == user_id,
        PlanModel.trip_id == trip_id,
        PlanModel.day == day
    ).all()

    if not db_plans:
        raise HTTPException(status_code=404, detail="No plans found for the specified day, user, and trip.")

    return db_plans


@app.post("/api/save_plans")
def save_plans(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("userId")
    trip_id = data.get("tripId")
    day = data.get("day")
    plans = data.get("plans")

    if not user_id or not trip_id or not day or not plans:
        raise HTTPException(status_code=400, detail="Invalid data. userId, tripId, day, and plans are required.")

    db.query(PlanModel).filter(
        PlanModel.user_id == user_id,
        PlanModel.trip_id == trip_id,
        PlanModel.day == day
    ).delete()
    db.commit()

    for plan in plans:
        db_plan = PlanModel(
            user_id=user_id,
            trip_id=trip_id,
            day=day,
            plan_title=plan["planTitle"],
            title=plan["title"],
            location=plan["location"],
            description=plan["description"],
            rating=float(plan["rating"]) if plan["rating"] else None,
            url=plan["url"],
        )
        db.add(db_plan)

    db.commit()
    return {"message": "플랜 저장에 성공하였습니다!"}


@app.get("/api/get_trips")
def get_trips(user_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        trips = db.query(TravelInfo).filter(TravelInfo.user_id == user_id).all()
        result = [
            {
                "id": trip.id,
                "title": f"Trip to {trip.region}",
                "startDate": str(trip.start_date),
                "endDate": str(trip.end_date),
                "description": f"{trip.region}로 여행을 떠나요!.",
                "image": "/japan_main3.png"


            }
            for trip in trips
        ]
        return result
    except Exception as e:
        logger.error(f"Error fetching trips: {e}")
        raise HTTPException(status_code=500, detail="Error fetching trips.")

@app.get("/api/max_id_by_user", response_model=int)
def get_max_id_by_user(user_id: int, db: Session = Depends(get_db)):
    max_id = db.query(func.max(TravelInfo.id)).filter(TravelInfo.user_id == user_id).scalar()
    if max_id is None:
        raise HTTPException(status_code=404, detail="No records found for the given user.")
    return max_id




if __name__ == "__main__":
    run_migrations()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



