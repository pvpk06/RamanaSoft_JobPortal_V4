import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import apiService from '../../../apiService';
import { Card, Button, Container, Row, Col, ListGroup } from 'react-bootstrap';
import { Typography } from '@mui/material';
import { FaChevronRight } from 'react-icons/fa';

const Quiz = () => {
  const user_id = Cookies.get("internID");
  const [assignedQuizzes, setAssignedQuizzes] = useState([]);
  const [submittedQuizzes, setSubmittedQuizzes] = useState([]);

  useEffect(() => {
    fetchData();
  }, [user_id])
  
    const fetchData = async () => {
      try {
        const response = await apiService.get(`/user-quizzes/${user_id}`);
        console.log(response);
        const data = response.data;
        const assigned = data.filter(quiz => !quiz.status);
        const submitted = data.filter(quiz => quiz.status);

        setAssignedQuizzes(assigned);
        setSubmittedQuizzes(submitted);
      } catch (err) {
        console.log(err);
      }
    };


  const handleAttemptQuiz = (quizId) => {
    const url = `#/test/${quizId}`;
    window.open(url, '_blank');
  };

  const handleViewAnalysis = (quizToken) => {
    const url = `#/quiz-analysis/${user_id}/${quizToken}`;
    window.open(url, '_blank');
  };

  return (
    <Container style={{ marginTop: '20px' }}>
      {assignedQuizzes.length > 0 ? (
        <Row>
          <Col>
            <Typography variant="h5" gutterBottom>
              Available Quizzes
            </Typography>
            <ListGroup>
              {assignedQuizzes.map((quiz) => (
                <ListGroup.Item key={quiz.id} className="mb-3">

                  <Card.Body className="d-flex justify-content-between align-items-center">
                  <Typography style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', padding: '5px 0', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '70%' }}>{quiz.quiz_name}</Typography>
                  <a href style={{
                      cursor: "pointer",
                      textAlign: "right",
                      textDecoration: 'none',
                      color: '#53289e',
                      fontWeight: '500',
                    }} onClick={() => handleAttemptQuiz(quiz.token)}>Attempt Quiz
                      <FaChevronRight style={{ marginLeft: '8px', marginBottom: "2px" }} size={15} />
                    </a>
                  </Card.Body>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
        </Row>
      ) : (
        <Typography variant="body1" align="center" style={{ margin: '20px 0' }}>
          No quizzes assigned
        </Typography>
      )}

      {submittedQuizzes.length > 0 ? (
        <Row style={{ marginTop: '40px' }}>
          <Col>
            <Typography variant="h5" gutterBottom>
              Your Submissions
            </Typography>
            <ListGroup>
              {submittedQuizzes.map((quiz) => (
                <ListGroup.Item key={quiz.id} className="mb-3">
                  <Card>
                    <Card.Body className="d-flex justify-content-between align-items-center">
                      <Typography variant="h6">{quiz.quiz_name}</Typography>
                      <Button variant="success" onClick={() => handleViewAnalysis(quiz.token)}>
                        View Analysis
                      </Button>
                    </Card.Body>
                  </Card>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
        </Row>
      ) : (
        <Typography variant="body1" align="center" style={{ margin: '20px 0' }}>
          No quizzes submitted yet
        </Typography>
      )}
    </Container>
  );
};

export default Quiz;
