import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import apiService from '../../../apiService';
const SAAnalysis = () => {
  const { token } = useParams();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const response = await apiService.get(`/quiz-responses/${token}`);
        setQuizData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response ? err.response.data.error : 'Error fetching quiz data');
        setLoading(false);
      }
    };
    fetchQuizData();
  }, [token]);

  const openModal = (response) => {
    setSelectedResponse(response);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedResponse(null);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      {quizData && quizData.responses && quizData.responses.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Domain</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration (sec)</th>
              <th>Score</th>
              <th>Grade</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizData.responses.map((data, index) => (
              <tr key={index}>
                <td>{data.user_name}</td>
                <td>{data.user_email}</td>
                <td>{data.domain}</td>
                <td>{new Date(data.start_time).toLocaleString()}</td>
                <td>{new Date(data.end_time).toLocaleString()}</td>
                <td>{data.duration / 10}</td>
                <td>{data.score}</td>
                <td>{data.grade}</td>
                <td>
                  <button onClick={() => openModal(data)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No responses available for this quiz</p>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Quiz Details"
      >
        <div style={{ position: 'relative', padding: '20px' }}>
          <button
            onClick={closeModal}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
          {selectedResponse ? (
            <div>
              <h2>Quiz Details</h2>
              <p><strong>Date submitted:</strong> {new Date(selectedResponse.start_time).toLocaleString()}</p>
              <p><strong>Score:</strong> {selectedResponse.score}</p>
              <p><strong>Duration:</strong> {selectedResponse.duration / 10} seconds</p>
              <hr />
              <div>
                <p><strong>Questions and Answers:</strong></p>
                {quizData && quizData.pages_data && quizData.pages_data.length > 0 ? (
                  quizData.pages_data.map((page, pageIndex) => (
                    page.question_list.map((question, questionIndex) => {
                      const userAnswer = selectedResponse.responses.find(response =>
                        response.questionText === question.question_text
                      )?.answer;

                      return (
                        <div key={`${pageIndex}-${questionIndex}`} style={{ marginBottom: '20px' }}>
                          <p><strong>Question {pageIndex * 10 + questionIndex + 1}:</strong> {question.question_text}</p>
                          <div style={{ marginLeft: '20px' }}>
                            {question.options_list.map((option, i) => {
                              const isCorrect = option === question.correct_answer;
                              const isUserAnswer = option === userAnswer;
                              const isIncorrectAnswer = isUserAnswer && !isCorrect;

                              return (
                                <p key={i} style={{
                                  color: isCorrect ? 'green' : (isIncorrectAnswer ? 'red' : 'black'),
                                  fontWeight: isCorrect || isUserAnswer ? 'bold' : 'normal',
                                  backgroundColor: isIncorrectAnswer ? '#ffe6e6' : (isCorrect ? '#e6ffe6' : 'transparent'),
                                  padding: '2px',
                                  borderRadius: '4px'
                                }}>
                                  {option}
                                </p>
                              );
                            })}
                          </div>
                          <hr />
                        </div>
                      );
                    })
                  ))
                ) : (
                  <p>No pages data available</p>
                )}
              </div>
            </div>
          ) : (
            <p>Loading response details...</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SAAnalysis;
