import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./MyPlan.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MyPlan = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [details, setDetails] = useState([]);

  const fetchSavedPlans = async (day) => {
    try {
      const userId = localStorage.getItem("userId");
      const tripId = localStorage.getItem("tripId");

      if (!userId || !tripId) {
        alert("플랜을 불러오는 데 필요한 정보가 없습니다.");
        return;
      }

      const response = await axios.get(`/api/get_plans/${day}`, {
        params: { user_id: parseInt(userId, 10), trip_id: parseInt(tripId, 10) },
      });

      if (response.status === 200) {
        setDetails(response.data);
        setSelectedDay(day);
      } else {
        console.error("Error fetching saved plans:", response.statusText);
        setDetails([]);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("No plans found for the specified day, user, and trip.");
        setDetails([]);
      } else {
        console.error("Error fetching saved plans:", error);
      }
    }
  };

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const userId = localStorage.getItem("userId");
  
        if (!userId) {
          alert("사용자 ID가 없습니다. 로그인 후 다시 시도하세요.");
          return;
        }
  
        const response = await axios.get("/api/get_trips", {
          params: { user_id: parseInt(userId, 10) },
        });
  
        if (response.status === 200) {
          setTrips(response.data);
        } else {
          console.error("Error fetching trips:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
      }
    };
  
    fetchTrips();
  }, []);
  useEffect(() => {
    if (selectedTrip) {
      fetchSavedPlans(selectedDay);
    }
  }, [selectedDay, selectedTrip]);

  const openModal = (trip, day = 1) => {
    setSelectedTrip(trip);
    setSelectedDay(day);
    setIsModalOpen(true);
    localStorage.setItem("tripId", trip.id.toString());
    fetchSavedPlans(day);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDetails([]);
  };

  const calculateTripDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="page-container">
      <div className="overlay"></div>
      <div className="content-wrapper">
        <button className="home-button" onClick={() => navigate("/")}>
          메인으로 가기
        </button>
        <h1 className="title">나의 여행 계획</h1>
        <div className="trip-grid">
          {trips.map((trip) => (
            <motion.div
              key={trip.id}
              className="trip-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => openModal(trip, 1)}
            >
              <img
                className="trip-image"
                src={trip.image || "/placeholder.jpg"}
                alt={trip.title}
              />
              <div className="trip-info">
                <h2 className="trip-title">{trip.title}</h2>
                <p className="trip-date">
                  {trip.startDate} - {trip.endDate}
                </p>
                <p className="trip-description">{trip.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <button className="new-plan-button" onClick={() => navigate("/travelers-input-selection")}>
          새로운 계획 만들기
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedTrip && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
  className="modal-content"
  initial={{ y: 50, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 50, opacity: 0 }}
>
  <div className="modal-layout">
    <button onClick={closeModal} className="close-icon">
      &times;
    </button>
    <div className="modal-sidebar">
      <h2>{selectedTrip.title}</h2>
      <p>{selectedTrip.startDate} - {selectedTrip.endDate}</p>
      <img src={selectedTrip.image} alt={selectedTrip.title} />
      <p>{selectedTrip.description}</p>
      <div className="day-buttons">
        {[...Array(calculateTripDuration(selectedTrip.startDate, selectedTrip.endDate))].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => fetchSavedPlans(i + 1)}
            className={selectedDay === i + 1 ? "active" : ""}
          >
            Day {i + 1}
          </button>
        ))}
      </div>
    </div>
    <div className="modal-main-content">
      <h3>상세 일정 (Day {selectedDay})</h3>
      <ul>
        {details.length > 0 ? (
          details.map((plan, index) => (
            <li key={index}>
              <img
            src={plan.url || "/placeholder.jpg"}
            alt={plan.title}
            className="plan-image"
            />
              <strong>{plan.plan_title}:</strong> {plan.title}
              <p>위치: {plan.location}</p>
              <p>설명: {plan.description}</p>
              <p>평점: {plan.rating}</p>
            </li>
          ))
        ) : (
          <p>이 날짜의 일정이 없습니다.</p>
        )}
      </ul>
    </div>
  </div>
</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyPlan;

