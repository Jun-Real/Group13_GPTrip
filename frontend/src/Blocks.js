import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { Modal, Box,TextField, Button, CircularProgress } from "@mui/material";
import styles from "./Blocks.module.css";
function Blocks() {
  //
  const [day, setDay] = useState(1);
  const [loading, setLoading] = useState([false, false, false, false, false]);
  const [maxDay, setMaxDay] = useState(1);
  const [locks, setLocks] = useState([0, 0, 0, 0, 0]);
  const [condition, setCondition] = useState("");
  const [highlightRefresh, setHighlightRefresh] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [allPlans, setAllPlans] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true); 
  const [showFooterMessage, setShowFooterMessage] = useState(false);
  const planTitles = ["아침 식사", "오전 활동", "점심 식사", "오후 활동", "저녁 식사"]
  const initialPlans = planTitles.map((planTitle) => ({"planTitle": planTitle, "title": "", "location": "", "description": "", "rating": "", "url": ""}));
  const [plans, setPlans] = useState(initialPlans);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [randomFact, setRandomFact] = useState("");


  const refreshPlans = useCallback(async (day, locks, condition, plans) => {
    if (loading.some(item => item)) return;
  
    setLoading(prevLoading => prevLoading.map((_, index) => !locks[index]));
  
    try {
      const request = { day, locks, condition };
      const response = await axios.post("https://crispy-adventure-wr74x4pxpwr7cg56v-8000.app.github.dev/api/request_plans", request);
  
      console.log("Response data:", response.data);
  
      const newPlans = plans.map((plan, index) => ({
        ...(locks[index] ? plan : response.data[index]),
      }));
  
      setPlans(newPlans);
      setAllPlans(prev => ({ ...prev, [day]: newPlans }));
      setShowFooterMessage(true);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading([false, false, false, false, false]);
    }
  }, [day, locks, condition, plans, loading]);


  const changeLock = (index) => {
    const changedLock = [...locks];
    changedLock[index] = 1 - changedLock[index];
    setLocks(changedLock);
  };

  const requestPlans = () => {
    refreshPlans(day, locks, condition, plans)
    setHighlightRefresh(false);
  }

  const getTripIdForUser = async () => {
    try {
      
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("로그인 정보가 없습니다. userId를 찾을 수 없습니다.");
        return null;
      }
  
  
      const response = await axios.get(`/api/max_id_by_user`, {
        params: { user_id: userId },
      });
  
      console.log("Fetched trip_id:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching trip_id:", error);
      alert("Trip ID를 가져오는 데 실패했습니다.");
      return null;
    }
  };

  const savePlansToDatabase = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("로그인 정보가 없습니다.");
        return;
      }
  
      const tripId = await getTripIdForUser();
      if (!tripId) {
        alert("Trip ID를 찾을 수 없습니다.");
        return;
      }
  
      const response = await axios.post("/api/save_plans", {
        userId: parseInt(userId, 10),
        tripId,
        day,
        plans,
      });
  
      console.log("Plans saved successfully:", response.data);
  
      setSaveMessage("성공적으로 저장되었습니다!");
      setTimeout(() => setSaveMessage(""), 3000);
      setIsSaved(true);
    } catch (error) {
      console.error("Error saving plans:", error);
  
      setSaveMessage("저장에 실패했습니다. 다시 시도해주세요.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };
  
  //
  const requestPrevPlans = () => {
    const newDay = day - 1;
    setDay(newDay);
    setLocks([0, 0, 0, 0, 0]);
    if (allPlans[newDay]) {
      setPlans(allPlans[newDay]);
    }
  };

  const requestNextPlans = () => {
    const newDay = day + 1;
    setDay(newDay);
    setCondition("");
    setChatHistory([]);
    setLocks([0, 0, 0, 0, 0]);
    if (allPlans[newDay]) {
      setPlans(allPlans[newDay]);
    }
    setHighlightRefresh(true);
  };

  const navigate = useNavigate();
  const completePlans = () => {
    navigate("/my-plan");
  }
  const japanFacts = [
    "일본에는 6,852개의 섬이 있습니다.",
    "세계에서 가장 오래된 회사는 일본에 있습니다. '겐코구미'는 578년에 설립되었습니다.",
    "도쿄는 세계에서 가장 큰 메트로폴리탄 지역으로, 3,700만 명이 넘는 사람들이 거주합니다.",
    "일본에는 자판기가 약 500만 대 있습니다.",
    "후지산은 일본에서 가장 높은 산으로, 높이는 3,776m입니다.",
    "일본은 세계에서 가장 많은 노벨상을 수상한 아시아 국가입니다.",
    "스시의 기원은 사실 동남아시아에서 비롯되었습니다."
  ];
  
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const handleOpen = (index) => {
    setIdx(index);
    setOpen(true);
  };
  
  const handleClose = () => setOpen(false);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const newChatHistory = [...chatHistory, { type: 'user', message: chatInput, day: day }];
      setChatHistory(newChatHistory);
      setCondition(chatInput);
      setChatInput("");
      refreshPlans(day, locks, chatInput, plans);
    }
  };

  useEffect(() => {
    const fetchTravelInfo = async () => {
      try {
        const response = await axios.get("https://crispy-adventure-wr74x4pxpwr7cg56v-8000.app.github.dev/api/travel-info");
        const { start_date, end_date } = response.data;
        const start = new Date(start_date);
        const end = new Date(end_date);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        setMaxDay(duration);
        setIsInitialLoad(false);
      } catch (error) {
        console.error("Error fetching travel info:", error);
      }
    };
    fetchTravelInfo();
  }, []);


  useEffect(() => {
    const initializePlans = async () => {
      if (isInitialLoad) {
        console.log("Initializing plans...");
        await refreshPlans(day, locks, condition, plans);
        setIsInitialLoad(false);
      }
    };
  
    initializePlans();
  }, [isInitialLoad])
  
  useEffect(() => {
    if (loading.some(item => item)) {
      const fact = japanFacts[Math.floor(Math.random() * japanFacts.length)];
      setRandomFact(fact);
    }
  }, [loading]);

  //
  return (
    
    <div className={styles.container}>
      {loading.some(item => item) && (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingBox}>
          <div className={styles.loadingMessage}>
            정보를 불러오는 중입니다! 잠시만 기다려주세요.
          </div>
          <div className={styles.japanFact}>
            알고 계셨나요? {randomFact}
          </div>
        </div>
      </div>
    )}
    {saveMessage && (
      <div className={styles.saveMessage}>
        {saveMessage}
      </div>
    )}
    {highlightRefresh && (
      <div className={styles.refreshMessage}>
      
      </div>
    )}
      {saveMessage && (
  <div className={styles.saveMessage}>
    {saveMessage}
  </div>
)}
      {highlightRefresh && (
      <div className={styles.refreshMessage}>
        {day}일차 계획 입니다! 갱신 버튼을 눌러주세요!
      </div>
    )}
    <div className={styles.headContainer}>
  <div className={styles.head}>
    <button
      className={`${styles.control} ${styles.prev}`}
      disabled={day === 1 || loading.some(item => item)}
      onClick={requestPrevPlans}
    >
      이전
    </button>
  </div>
  <div className={styles.centerHead}>
  <button
  className={`${styles.control} ${styles.save}`}
  onClick={savePlansToDatabase}
  disabled={loading.some(item => item)}
>
  저장
</button>

    <button
  className={`${styles.control} ${styles.next} ${highlightRefresh ? styles.highlight : ""}`}
  onClick={requestPlans}
  disabled={loading.some(item => item)}
>
  갱신
</button>
  </div>
  <div className={styles.rightHead}>
  <button
  className={`${styles.control} ${styles.next}`}
  onClick={day === maxDay ? completePlans : requestNextPlans}
  disabled={loading.some(item => item) || !isSaved}
>
  {day === maxDay ? "완료" : "다음"}
</button>
  </div>
</div>
    <div className={styles.blockContainer}>
      <div className={styles.block}>
        <div className={styles.chatContainer}>
          <div className={styles.chatHistory}>
            <div className={styles.item}>
            {chatHistory.map((chat, index) => (
                    <div key={index} className={chat.type === 'user' ? styles.userChat : styles.aiChat}>
                      {`(${chat.day}일차) ${chat.message}`}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleChatSubmit} className={styles.chatInputContainer}>
  <TextField
    value={chatInput}
    onChange={(e) => setChatInput(e.target.value)}
    placeholder="요청사항을 입력하세요..."
    fullWidth
    variant="outlined"
    size="small"
    disabled={loading.some(item => item)}
  />
  <Button
  type="submit"
  variant="contained"
  color="primary"
  size="small"
  disabled={loading.some(item => item)}
>
  {loading.some(item => item) ? "로딩" : "전송"}
</Button>
</form>
            </div>
          </div>
          <div className={styles.title}>{day}일차</div>
          <div className={styles.planTitle}>{loading.some(item => item) ? "정보를 받아오는 중입니다..." : ""}</div>

        </div>
      {plans.slice(0, 2).map((plan, index) => (
        <div key={index} className={styles.block}>
          <div>
            {loading[index] ? (
              <CircularProgress />
            ) : (
              <img className={styles.image} src={plan.url} alt="" onClick={() => handleOpen(index)}/>
            )}
          </div>
          <div className={styles.itemContainer}>
            <div className={styles.item}>
              <div className={styles.title}>{plan.title}</div>
              <div className={styles.planTitle}>{plan.planTitle}</div>
            </div>
            <div className={styles.rightItem}>
              <button onClick={() => changeLock(index)} style={{border: "none"}}>
                {locks[index] ? <img src="/img4.jpg" alt="" style={{ width: "40px", height: "40px" }}/> : 
                <img src="/img5.jpg" alt="" style={{ width: "40px", height: "40px" }}/>} 
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className={styles.blockContainer}>
      {plans.slice(2).map((plan, index) => (
        <div key={index + 2} className={styles.block}>
          <div>
            {loading[index + 2] ? (
              <CircularProgress />
            ) : (
              <img className={styles.image} src={plan.url} alt="" onClick={() => handleOpen(index + 2)}/>
            )}
          </div>
          <div className={styles.itemContainer}>
            <div className={styles.item}>
              <div className={styles.title}>{plan.title}</div>
              <div className={styles.planTitle}>{plan.planTitle}</div>
            </div>
            <div className={styles.rightItem}>
              <button onClick={() => changeLock(index + 2)} style={{border: "none"}}>
                {locks[index + 2] ? <img src="/img4.jpg" alt="" style={{ width: "40px", height: "40px" }}/> : 
                <img src="/img5.jpg" alt="" style={{ width: "40px", height: "40px" }}/>} 
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          boxShadow: 24, borderRadius: 2,
          height: "80vh", width: "80vw", bgcolor: "#EDEDE9",
          p: 4}}>
        <div className={styles.modalControl}><button className={styles.control} onClick={handleClose} style={{border: "none"}}>이전</button></div>
        {plans?.[idx] && (
          <>
            <img className={styles.modalImage} src={plans[idx].url} alt=""/>
            <div className={styles.modalPlanTitle}>{plans[idx].planTitle}</div>
            <div className={styles.modalPlanTitle}>평점:  {plans[idx].rating}</div>
            <div className={styles.modalPlanTitle}>주소:  {plans[idx].location}</div>
            <div className={styles.modalTitle}>{plans[idx].title}</div>
            <div className={styles.modalInfo}>{plans[idx].description}</div>
          </>
        )}
      </Box>
    </Modal>
    {showFooterMessage && (
  <div className={styles.footerMessage}>
    계획이 마음에 드셨나요? 각 계획은 잠금 버튼을 누르면 고정이 가능합니다! 
    바꾸고 싶은 계획을 제외하고 잠금 버튼을 누른 채로 갱신하거나             요구사항을 입력하시면 해당 계획만 변경 가능합니다!
    하루 일정이 마음에 드시면 저장 버튼을 누른 뒤 다음 버튼을 눌러주세요! 
  </div>
)}
    </div>
    
  );
  
}


export default Blocks

