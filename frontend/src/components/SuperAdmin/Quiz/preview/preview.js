import React, { useState, useEffect } from 'react';
import './preview.css';
import apiService from '../../../../apiService';


const PreviewQuiz = ({token}) => {
  const [quizData, setQuizData] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  useEffect(() => {
    if (token) {
      apiService.get(`/get-quiz/${token}`)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Received data:', data);
          if (data && data.pages_data) {
            const parsedPages = JSON.parse(data.pages_data);
            setQuizData(parsedPages);
          } else {
            throw new Error('Invalid quiz data structure');
          }
        })
        .catch(error => {
          console.error('Error fetching quiz data:', error);
        });
    }
  }, [token]);

  const switchPage = (pageIndex) => {
    setCurrentPageIndex(pageIndex);
  };

  if (quizData === null) {
    return <div>No Quiz data available to show</div>;
  }

  if (!Array.isArray(quizData) || quizData.length === 0) {
    return <div>No quiz data available</div>;
  }

  const currentPage = quizData[currentPageIndex];
  let questionNumber = 1;
  for (let i = 0; i < currentPageIndex; i++) {
    questionNumber += quizData[i].question_list.length;
  }

  return (
    <div className="preview-container">
      <h2 style={{textAligns:"center"}}>Quiz Preview</h2>
      <div className="page-container">
        {currentPage.question_list.map((q, questionIndex) => (
          <div key={questionIndex} className="question-preview">
            <div className="question-header">Question {questionNumber + questionIndex}</div>
            <div className="question-text" dangerouslySetInnerHTML={{ __html: q.question_text }} />
            <div className="options-preview">
              {q.options_list.map((option, optionIndex) => (
                <div key={optionIndex} className="option">
                  <input
                    type="radio"
                    id={`question-${questionNumber + questionIndex}-option-${optionIndex}`}
                    name={`question-${questionNumber + questionIndex}`}
                  />
                  <label htmlFor={`question-${questionNumber + questionIndex}-option-${optionIndex}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="controls-container">
        <div className="pagination-controls">
          {quizData.map((_, pageIndex) => (
            <button
              key={pageIndex}
              className={`page-button ${pageIndex === currentPageIndex ? 'active' : ''}`}
              onClick={() => switchPage(pageIndex)}
            >
              Page {pageIndex + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreviewQuiz;
