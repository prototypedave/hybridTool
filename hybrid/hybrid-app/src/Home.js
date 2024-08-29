import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [urls, setUrls] = useState('');
    const navigate = useNavigate();
  
    const processUrls = (value) => {
      if (!value) {
        return { message: "No URLs provided" };
      }
  
      const validatedUrls = value
        .split("\n")
        .reduce((urls, split) => urls.concat(split.split(",")), [])
        .map(url => url.trim())
        .map(url => {
          try {
            const instance = new URL(url);
            if (!instance.origin || !instance.protocol) {
              return false;
            }
            return instance.toString();
          } catch (e) {
            return false;
          }
        });
  
      if (validatedUrls.includes(false)) {
        return { message: "One or more URLs provided are not valid" };
      }
  
      return { validUrls: validatedUrls };
    };
  
    const handleScheduleClick = () => {
      const result = processUrls(urls);
      if (result.message) {
        alert(result.message);
        return;
      }
  
      const { validUrls } = result; 
      setUrls('');
      navigate('/dashboard', { state: { urls: validUrls } });
    };  

  return (
    <div className="Home">
      <textarea
        rows="10"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
      />
      <button type="button" onClick={handleScheduleClick}>
        Schedule Reports
      </button>
    </div>
  );
}

export default Home;
