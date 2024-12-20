import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MapSelection.css';

const regions = [
  { id: 1, name: '홋카이도', color: '#3949AB', prefectures: ['홋카이도'] },
  { id: 2, name: '도호쿠', color: '#1E88E5', prefectures: ['아오모리', '이와테', '미야기', '아키타', '야마가타', '후쿠시마'] },
  { id: 3, name: '간토', color: '#43A047', prefectures: ['이바라키', '토치기', '군마', '사이타마', '치바', '도쿄', '가나가와'] },
  { id: 4, name: '주부', color: '#7CB342', prefectures: ['니가타', '토야마', '이시카와', '후쿠이', '야마나시', '나가노', '기후', '시즈오카', '아이치'] },
  { id: 5, name: '긴키', color: '#FDD835', prefectures: ['미에', '시가', '교토', '오사카', '효고', '나라', '와카야마'] },
  { id: 6, name: '츄고쿠', color: '#FB8C00', prefectures: ['돗토리', '시마네', '오카야마', '히로시마', '야마구치'] },
  { id: 7, name: '시코쿠', color: '#F4511E', prefectures: ['도쿠시마', '카가와', '에히메', '코우치'] },
  { id: 8, name: '규슈', color: '#6D4C41', prefectures: ['후쿠오카', '사가', '나가사키', '구마모토', '오이타', '미야자키', '가고시마', '오키나와'] },
];

const paths = [
  "M472,193 L478,204 L510,184 L583,179 L605,141 L655,117 L648,68 L528,12 L460,154 L474,175 Z",
  "M527,190 L547,285 L495,411 L483,413 L463,392 L438,402 L436,381 L452,370 L461,344 L452,330 L467,303 L464,266 L467,231 L491,208 Z",
  "M323,448 L392,446 L426,508 L392,509 L376,503 L343,482 L300,459 L343,373 L437,328 L457,337 L460,349 L455,359 L449,370 L438,382 L436,396 L438,405 L409,414 L406,428 L412,435 L413,446 L423,457 L421,466 L419,475 L425,487 L427,497 Z",
  "M422,483 L446,480 L455,494 L473,489 L483,468 L490,460 L482,436 L495,413 L479,407 L462,397 L439,401 L408,412 L405,423 L417,456 Z",
  "M252,447 L246,468 L244,482 L255,484 L270,490 L254,509 L272,530 L288,547 L311,533 L338,517 L339,500 L329,484 L332,477 L321,467 L321,454 L280,438 Z",
  "M108,481 L109,500 L134,503 L157,504 L171,494 L197,497 L210,498 L247,485 L249,460 L251,444 L210,441 L189,447 L164,449 Z",
  "M147,535 L184,507 L245,500 L258,516 L260,533 L232,549 L167,572 Z",
  "M48,614 L40,684 L75,677 L142,559 L136,520 L115,504 L94,496 L54,517 L31,524 Z",
];

function MapSelection() {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const navigate = useNavigate();

  const handleMouseEnter = useCallback((region) => {
    setHoveredRegion(region);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredRegion(null);
  }, []);

  const handleClick = useCallback((region) => {
    setSelectedRegion(region);
  }, []);

  const handleNext = useCallback(async () => {
    if (selectedRegion) {
      setIsLoading(true);
      setError(null);
      const userId = localStorage.getItem('userId');
      const regionName = regions[selectedRegion - 1].name;

      if (!userId) {
        setError('사용자 ID를 찾을 수 없습니다. 다시 로그인해 주세요.');
        setIsLoading(false);
        return;
      }

      try {
        console.log('지역 저장 요청 전송:', { user_id: parseInt(userId), region: regionName });
        const response = await axios.post('http://localhost:8000/save-region', {
          user_id: parseInt(userId),
          region: regionName
        });
        console.log('지역 저장 응답:', response.data);
        localStorage.setItem('selectedRegion', JSON.stringify(selectedRegion));
        setShowAnalysisPopup(true);
        setTimeout(() => {
          setShowAnalysisPopup(false);
          navigate('/blocks');
        }, 3000);
      } catch (error) {
        console.error('지역 저장 중 오류 발생:', error);
        if (error.response) {
          console.error('오류 응답:', error.response.data);
          console.error('오류 상태:', error.response.status);
          console.error('오류 헤더:', error.response.headers);
        } else if (error.request) {
          console.error('오류 요청:', error.request);
        } else {
          console.error('오류 메시지:', error.message);
        }
        setError('지역 저장에 실패했습니다. 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedRegion, navigate, regions]);

  return (
    <div className="map-selection-wrapper">
      <div className="map-container">
        <h2 className="map-title">원하는 여행 지역을 선택해주세요</h2>
        <svg viewBox="0 0 700 800" className="japan-map">
          {paths.map((path, index) => (
            <path
              key={index}
              d={path}
              className={`region ${hoveredRegion === index + 1 ? 'hovered' : ''} ${selectedRegion === index + 1 ? 'selected' : ''}`}
              fill={regions[index].color}
              onMouseEnter={() => handleMouseEnter(index + 1)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(index + 1)}
            />
          ))}
        </svg>
        
        {hoveredRegion && (
          <div className="region-info">
            <h3>{regions[hoveredRegion - 1].name}</h3>
            <ul>
              {regions[hoveredRegion - 1].prefectures.map((prefecture, index) => (
                <li key={index}>{prefecture}</li>
              ))}
            </ul>
          </div>
        )}

        {selectedRegion && (
          <div className="selection-info">
            <p>{regions[selectedRegion - 1].name} 지역을 선택하였습니다.</p>
            <button 
              className="next-button" 
              onClick={handleNext} 
              disabled={isLoading}
            >
              {isLoading ? '저장 중...' : '다음으로'}
            </button>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
        {showAnalysisPopup && (
          <div className="analysis-popup">
            <p>사용자 정보 분석이 완료되었습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapSelection;

