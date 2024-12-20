from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

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
    user = relationship("User", back_populates="travel_infos")
    activities = relationship("Activity", secondary="travel_info_activity", back_populates="travel_infos")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    travel_infos = relationship("TravelInfo", secondary="travel_info_activity", back_populates="activities")

travel_info_activity = Table('travel_info_activity', Base.metadata,
    Column('travel_info_id', Integer, ForeignKey('travel_info.id')),
    Column('activity_id', Integer, ForeignKey('activities.id'))
)

