import React, { useState } from "react";
import axios from 'axios';

function Request() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    setResponse("");

    const res = await axios.post("http://localhost:8000/api/request_gpt", {prompt: prompt});
    setResponse(res.data.response);
  };

  return (
    <div>
      <h1>GPT 챗봇</h1>
      <form onSubmit={handle}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="질문을 입력하세요"
          rows="4"
          cols="50"
          required
        />
        < br />
        <button type="submit">전송</button>
      </form>
      <h1>응답</h1>
      <p>{response}</p>
    </div>
  );
}

export default Request;