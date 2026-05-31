import React, { useEffect, useState } from 'react';

const History = () => {
  const [history, setHistory] = useState([]);

  // Data fetch karne ke liye useEffect
  useEffect(() => {
    fetch('http://localhost:5001/history')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error("Error fetching history:", err));
  }, []);

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #ccc' }}>
      <h3>Recent Transcriptions</h3>
      {history.length > 0 ? (
        <ul>
          {history.map((item) => (
            <li key={item._id} style={{ marginBottom: '10px' }}>
              <strong>{new Date(item.timestamp).toLocaleDateString()}:</strong> {item.text}
            </li>
          ))}
        </ul>
      ) : (
        <p>No history found.</p>
      )}
    </div>
  );
};

export default History;