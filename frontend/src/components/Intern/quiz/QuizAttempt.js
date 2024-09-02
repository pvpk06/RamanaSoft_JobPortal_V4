import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './quizattempt.css'; 
import Cookies from 'js-cookie';
import apiService from '../../../apiService';
const SuccessPopup = ({ message, onClose }) => (
  <div className="Attempt_popupStyle">
    <p>{message}</p>
    <button onClick={onClose}>Close</button>
  </div>
);

const QuizAttempt = () => {
  const { token } = useParams();
  const user_id = Cookies.get("internID");
  const [quizData, setQuizData] = useState(null);
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [questionsPerPage, setQuestionsPerPage] = useState(5);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const navigate = useNavigate();

  const convertToUTC = (dateString) => {
    const date = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const utcDate = new Date(date.getTime() - istOffset);
    return utcDate.toISOString().slice(0, 19).replace('T', ' '); // Format as 'YYYY-MM-DD HH:MM:SS'
};


  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        console.log('Quiz Token:', token); 
        const response = await apiService.get(`/get-quiz/${token}`);
        console.log("response", response.data);
        const data = response.data;

        if (typeof data.pages_data === 'string') {
          try {
            data.pages_data = JSON.parse(data.pages_data);
          } catch (parseError) {
            console.error('Error parsing pages_data:', parseError);
            setError('Error parsing quiz data');
            return;
          }
        }

        // Randomize questions
        if (data.randomize_questions) {
          data.pages_data = data.pages_data.map(page => ({
            ...page,
            question_list: shuffleArray(page.question_list)
          }));
        }

        setQuizData(data);
        setQuestionsPerPage(data.no_of_qns_per_page || 5);

        const startTime = localStorage.getItem(`startTime_${token}_${user_id}`);
        if (startTime) {
          const elapsedTime = Math.floor((Date.now() - new Date(startTime)) / 1000);
          const savedTime = localStorage.getItem(`timeLeft_${token}_${user_id}`);
          const remainingTime = parseInt(savedTime, 10) - elapsedTime;
          setTimeLeft(remainingTime > 0 ? remainingTime : 0);
        } else if (data.time_limit) {
          const totalTime = data.time_limit * 60;
          setTimeLeft(totalTime);
          localStorage.setItem(`timeLeft_${token}_${user_id}`, totalTime);
          localStorage.setItem(`startTime_${token}_${user_id}`, new Date().toISOString());
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error.response ? error.response.data : error.message);
        setError('Error fetching quiz data');
      }
    };

    fetchQuizData();
  }, [token, user_id]);

  useEffect(() => {
    if (timeLeft <= 0 || !quizData) return;

    const timerId = setInterval(() => {
      setTimeLeft(prevTimeLeft => {
        const newTime = prevTimeLeft - 1;
        localStorage.setItem(`timeLeft_${token}_${user_id}`, newTime);
        if (newTime <= 0) {
          handleSubmit();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, quizData, token, user_id]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handleInputChange = (questionText, value) => {
    setResponses(prevResponses => ({
      ...prevResponses,
      [questionText]: value
    }));
  };

  const handleSubmit = async () => {
    if (!quizData) return;
  
    if (!checkQuizSchedule()) {
      setError('Quiz is not available at this time.');
      return;
    }
  
    const userId = user_id;
    const quizId = token;
    const startTime = localStorage.getItem(`startTime_${token}_${user_id}`);
    const endTime = new Date().toISOString();
  
    const formattedStartTime = convertToUTC(startTime);
    const formattedEndTime = convertToUTC(endTime);
  
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);
    const duration = Math.floor((endTimeDate - startTimeDate) / 1000); // Fix duration calculation
  
    const formattedResponses = Object.entries(responses).map(([questionText, answer]) => ({
      questionText,
      answer
    }));
  
    const submissionData = {
      userId,
      token: quizId,
      responses: formattedResponses,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      duration
    };
  
    try {
      await apiService.post('/submit-quiz', submissionData);
      await apiService.put(`/update-user-quiz-status/${userId}/${quizId}`);
      setShowSuccessPopup(true);
      localStorage.removeItem(`timeLeft_${token}_${user_id}`);
      localStorage.removeItem(`startTime_${token}_${user_id}`);
    } catch (error) {
      console.error('Error submitting quiz:', error.response ? error.response.data : error.message);
      setError('Error submitting quiz');
    }
  };
  

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    navigate(`/results/${token}/${user_id}`);
  };

  const checkQuizSchedule = () => {
    if (!quizData) return false;

    const now = new Date();
    const start = new Date(quizData.schedule_quiz_from);
    const end = new Date(quizData.schedule_quiz_to);

    if (now < start) {
      alert('The quiz is not activated yet.');
      return false;
    } else if (now > end) {
      alert('The quiz link has expired.');
      return false;
    } else {
      return true;
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < numPages) {
      setCurrentPage(newPage);
    }
  };

  const numPages = Math.ceil((quizData?.pages_data || []).reduce((acc, page) => acc + (page.question_list?.length || 0), 0) / questionsPerPage);

  const getQuestionsForCurrentPage = () => {
    if (!quizData) return [];

    const allQuestions = (quizData.pages_data || []).reduce((acc, page) => acc.concat(page.question_list || []), []);
    const start = currentPage * questionsPerPage;
    const end = start + questionsPerPage;
    return allQuestions.slice(start, end);
  };

  if (error) return <div className="Attempt_error">Error: {error}</div>;
  if (!quizData) return <div className="Attempt_loading">Loading...</div>;

  const questionsForCurrentPage = getQuestionsForCurrentPage();

  return (
    <div className="Attempt_container">
      <h2 className="Attempt_heading">Quiz Attempt</h2>
      <div className="Attempt_timeLeft">Time Left: {formatTime(timeLeft)}</div>
      {questionsForCurrentPage.length > 0 ? (
        <div className="Attempt_questionPreview">
          {questionsForCurrentPage.map((question, index) => (
            <div key={index} className="Attempt_questionContainer">
              <p className="Attempt_questionHeader">Question {index + 1 + currentPage * questionsPerPage}</p>
              <p className="Attempt_questionText" dangerouslySetInnerHTML={{ __html: question.question_text }}></p>
              {question.options_list && Array.isArray(question.options_list) ? (
                question.options_list.map((option, optionIndex) => (
                  <div key={optionIndex} className="Attempt_option">
                    <label>
                      <input
                        type="radio"
                        name={`question-${index + 1}`}
                        value={option}
                        checked={responses[question.question_text] === option}
                        onChange={(e) => handleInputChange(question.question_text, e.target.value)}
                      />
                      {option}
                    </label>
                  </div>
                ))
              ) : (
                <p>No options available for this question.</p>
              )}
            </div>
          ))}
          <div className="Attempt_paginationControls">
            <button className="Attempt_button" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
              Previous
            </button>
            <button className="Attempt_button" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === numPages - 1}>
              Next
            </button>
          </div>
          <button className="Attempt_button Attempt_submitButton" onClick={handleSubmit}>
            Submit Quiz
          </button>
        </div>
      ) : (
        <p>No questions available for this page.</p>
      )}
      {showSuccessPopup && <SuccessPopup message="Quiz submitted successfully!" onClose={handleClosePopup} />}
    </div>
  );
};

export default QuizAttempt;
