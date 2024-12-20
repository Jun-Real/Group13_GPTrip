import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ActivitySelection.css';

const activities = [
  { id: 1, name: '온천 체험', image: "/onsen.png" },
  { id: 2, name: '신사 방문', image: "/shrine.png" },
  { id: 3, name: '유니버설 스튜디오 방문', image: "/universalstudio.png" },
  { id: 4, name: '나라 공원 방문', image: "/narapark.png" },
  { id: 5, name: '스쿠버 다이빙 체험', image: "/diving.png" },
  { id: 6, name: '후지 산 방문', image: "/huji.jpg" },
  { id: 7, name: '도쿄 디즈니랜드 방문', image: "/disney.png" },
  { id: 8, name: '성(Castle) 방문', image: "/castle.png" },
  { id: 9, name: '전통 공연 관람', image: "/trad.png" },
  { id: 10, name: '축제 관람', image: "/festival.png" },
  { id: 11, name: '맛집 탐방', image: "/food.png" },
  { id: 12, name: '카페 탐방', image: "/cafe.png" },


];

function ActivitySelection() {
  const [selectedActivities, setSelectedActivities] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId'); // 사용자 ID 가져오기

  useEffect(() => {
    const savedActivities = localStorage.getItem('selectedActivities');
    if (savedActivities) {
      setSelectedActivities(JSON.parse(savedActivities));
    }
  }, []);

  const toggleActivity = (id) => {
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(activityId => activityId !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    console.log('선택된 활동:', selectedActivities);
    localStorage.setItem('selectedActivities', JSON.stringify(selectedActivities));
    
    try {
      const response = await axios.post('http://localhost:8000/save-activities', {
        user_id: userId,
        activities: selectedActivities
      });
      console.log('활동 저장 성공:', response.data);
      navigate('/map-selection');
    } catch (error) {
      console.error('활동 저장 실패:', error);

    }
  };

  return (
    <div className="activity-selection-container">
      <div className="overlay"></div>
      <div className="activity-selection">
        <h2 className="fade-in title-background">원하는 활동을 선택해주세요</h2>
        <div className="activity-grid">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`activity-item fade-in ${selectedActivities.includes(activity.id) ? 'selected' : ''}`}
              onClick={() => toggleActivity(activity.id)}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <img src={activity.image} alt={activity.name} />
              <div className="activity-overlay">
                <h3>{activity.name}</h3>
              </div>
              {selectedActivities.includes(activity.id) && (
                <div className="activity-check">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="next-button fade-in" onClick={handleNext}>다음으로</button>
      </div>
    </div>
  );
}

export default ActivitySelection;

