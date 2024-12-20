import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import axios from 'axios';
import 'react-datepicker/dist/react-datepicker.css';
import './TravelInfoInput.css';
import { useAuth } from './AuthContext';

export default function TravelInfoInput() {
  const [year, setYear] = useState('');
  const [travelers, setTravelers] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState('');
  const currentYear = new Date().getFullYear() - 10;
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const navigate = useNavigate();
  const { userId, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    console.log('Current userId:', userId);
  }, [userId]);

  const validateForm = () => {
    if (!year || !travelers || !budget || !startDate || !endDate) {
      setError('모든 정보를 입력해주세요.');
      return false;
    }
    if (parseInt(travelers) < 1 || parseInt(travelers) > 10) {
      setError('여행 인원은 1명에서 10명 사이여야 합니다.');
      return false;
    }
    if (parseFloat(budget) < 200000) {
      setError('예산은 최소 200,000원 이상이어야 합니다.');
      return false;
    }
    if (startDate >= endDate) {
      setError('종료일은 시작일보다 늦어야 합니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Form submitted');

    if (!validateForm()) {
      return;
    }

    if (!userId) {
      setError('사용자 ID를 찾을 수 없습니다. 다시 로그인해 주세요.');
      console.error('User ID is undefined');
      navigate('/');
      return;
    }

    try {
      const travelData = {
        user_id: parseInt(userId, 10),
        birth_year: parseInt(year),
        travelers: parseInt(travelers),
        budget: parseFloat(budget),
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      };
      console.log('Sending travel data:', travelData);
      const response = await axios.post('http://localhost:8000/travelers-input-selection', travelData);
      console.log('Travel info saved:', response.data);
      navigate(`/activity-selection?id=${response.data.id}`);
    } catch (error) {
      console.error('Error saving travel info:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
          setError(error.response.data.detail.map(err => err.msg).join(', '));
        } else {
          setError(`여행 정보 저장 중 오류가 발생했습니다: ${error.response.data.detail || '알 수 없는 오류'}`);
        }
      } else if (error.request) {
        console.error('Error request:', error.request);
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.');
      } else {
        console.error('Error message:', error.message);
        setError('오류가 발생했습니다. 다시 시도해 주세요.');
      }
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="travel-info-container">
      <div className="overlay"></div>
      <div className="content-wrapper">
        <div className="card">
          <h2 className="title">여행 정보를 알려주세요.</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <label htmlFor="year-select">태어난 연도</label>
              <div className="select-wrapper">
                <select
                  id="year-select"
                  className="info-select"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                >
                  <option value="">선택해주세요</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
                <span className="select-icon">▼</span>
              </div>
            </div>
            <div className="input-wrapper">
              <label htmlFor="travelers-input">여행 인원</label>
              <input
                id="travelers-input"
                type="number"
                className="info-input"
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                min="1"
                max="10"
                required
                placeholder="인원 수 입력 (1-10)"
              />
            </div>
            <div className="input-wrapper">
              <label htmlFor="budget-input">예산 (원)</label>
              <input
                id="budget-input"
                type="number"
                className="info-input"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="200000"
                step="100000"
                required
                placeholder="예산 입력 (최소 200,000원)"
              />
            </div>
            <div className="input-wrapper">
              <label>여행 기간</label>
              <div className="date-picker-wrapper">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  minDate={new Date()}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="시작일"
                  className="date-picker"
                  required
                />
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="종료일"
                  className="date-picker"
                  required
                />
              </div>
            </div>
            <button type="submit" className="submit-button">다음으로</button>
          </form>
        </div>
      </div>
    </div>
  );
}

