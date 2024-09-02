import React, { useState, useEffect } from 'react';
import './publish.css';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import apiService from '../../../../../../../apiService';
const Publish = () => {
  const { token } = useParams();
  const [quizDetails, setQuizDetails] = useState({});
  const [quizLink, setQuizLink] = useState('');
  const [isLinkVisible, setIsLinkVisible] = useState(false);
  const [status, setStatus] = useState('In Design');
  const [domains, setDomains] = useState([]);
  const [showDomains, setShowDomains] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [showUserAssignment, setShowUserAssignment] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [buttonLabel, setButtonLabel] = useState('Publish');
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [isAssignedTableVisible, setIsAssignedTableVisible] = useState(true);

  const handleClick = async () => {
    let newStatus = '';
    let confirmationMessage = '';
  
    if (buttonLabel === 'Publish') {
      confirmationMessage = 'Quiz successfully published';
      newStatus = 'Published';
      setButtonLabel('Close Quiz');
    } else if (buttonLabel === 'Close Quiz') {
      confirmationMessage = 'Your quiz is now closed and respondents will be able to access it. You can re-open your quiz at a later time with the Re-open Quiz button';
      newStatus = 'Closed';
      setButtonLabel('Re-open Quiz');
    } else if (buttonLabel === 'Re-open Quiz') {
      confirmationMessage = 'Your quiz is now open again and respondents will be able to access it';
      newStatus = 'Published';
      setButtonLabel('Close Quiz');
    }
  
    if (window.confirm(confirmationMessage)) {
      try {
        await apiService.post('/update-quiz-status', {
          quizId: token,
          status: newStatus
        });
        setStatus(newStatus);
      } catch (error) {
        console.error('Error updating quiz status', error);
        alert('Failed to update quiz status. Please try again.');
      }
    }
  };

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await apiService.get('/domains');
        setDomains(response.data);
      } catch (error) {
        console.error('Error fetching domains', error);
      }
    };

    fetchDomains();
  }, []);

  useEffect(() => {
    fetchAssignedStudents();
  }, [])

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await apiService.get(`/get-quiz/${token}`);
        const quizData = response.data;
        if (quizData) {
          const link = `http://localhost:3000/quiz/${token}`;
          setQuizLink(link);
          setIsLinkVisible(true);
          setStatus(quizData.status || 'In Design');
          setPublishedDate(quizData.publishedDate || 'Not Published');
          setQuizDetails(quizData);
        }
      } catch (error) {
        console.error('Error fetching quiz details', error);
      }
    };

    fetchQuizDetails();
  }, [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiService.get('/intern_data');
        setAvailableUsers(response.data);
      } catch (error) {
        console.error('Error fetching users', error);
      }
    };

    fetchUsers();
  }, []);

  const fetchAssignedStudents = async () => {
    try {
      const response = await apiService.get(`/quiz_data/${token}`);
      if (response.data && Array.isArray(response.data)) {
        setAssignedStudents(response.data);
      } else {
        setAssignedStudents([]);  // Handle the case where no students are assigned
      }
    } catch (error) {
      console.error('Error fetching assigned students', error);
      alert('Failed to fetch assigned students. Please try again.');
    }
  };
  
  const handleSaveAssignments = async () => {
    setIsLoading(true);
    try {
      await apiService.post('/assign-quiz-to-user', {
        quizId: token,
        userIds: assignedUsers.map(u => u.candidateID)
      });
      alert('Quiz assigned successfully!');
      setShowUserAssignment(false);
      fetchAssignedStudents();
    } catch (error) {
      console.error('Error assigning quiz', error);
      alert('Failed to assign quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToUsers = () => {
    setShowUserAssignment(true);
  };

  const assignUser = (user) => {
    setAssignedUsers([...assignedUsers, user]);
    setAvailableUsers(availableUsers.filter(u => u.candidateID !== user.candidateID));
  };

  const unassignUser = (user) => {
    setAvailableUsers([...availableUsers, user]);
    setAssignedUsers(assignedUsers.filter(u => u.candidateID !== user.candidateID));
  };

  const handleAssignToGroups = () => {
    setShowDomains(true);
  };

  const handleDomainChange = (e) => {
    setSelectedDomain(e.target.value);
  };

  const handleDomainSelect = async () => {
    try {
      const response = await apiService.post('/assign-quiz-to-domain', {
        domain: selectedDomain,
        quizId: token
      });
      if (response.data.success) {
        alert('Quiz assigned to domain successfully!');
      }
    } catch (error) {
      console.error('Error assigning quiz to domain', error);
    }
  };



  const filteredAvailableUsers = availableUsers.filter(user => 
    user.candidateID?.includes(searchTerm) || false
  );
  
  const toggleAssignedTableVisibility = () => {
    setIsAssignedTableVisible(!isAssignedTableVisible);
  };

  return (
    <div className="publish-container">
      <div className='Publish_quiz_container'>

        <div className="form-group1">
          <button id="assignUsers" className="assign-button" onClick={handleAssignToUsers}>
            Assign Users
          </button>
        </div>
        <div className="form-group1">
          <button id="assignGroups" className="assign-button" onClick={handleAssignToGroups}>
            Assign Groups
          </button>
        </div>
        
        {showDomains && (
          <div className="form-group">
            <label htmlFor="domain">Select Domain to Assign:</label>
            <select id="domain" value={selectedDomain} onChange={handleDomainChange}>
              <option value="">Select Domain</option>
              {domains.map((domain) => (
                <option key={domain.domain} value={domain.domain}>
                  {domain.domain}
                </option>
              ))}
            </select>
            <button onClick={handleDomainSelect} className="assign-button">Assign to Domain</button>
          </div>
        )}
        
        <div className="assigned-students-container">
          <span>Assigned Users</span>
          <button className="publish-toggle-button" onClick={toggleAssignedTableVisibility}>
            <FontAwesomeIcon icon={isAssignedTableVisible ? faEyeSlash : faEye} />
          </button>
          {isAssignedTableVisible && (
            <table className="assigned-students-table">
              <thead>
                <tr>
                  <th>Candidate ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Domain</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignedStudents.map(user => (
                  <tr key={user.candidateID}>
                    <td>{user.internID}</td>
                    <td>{user.user_name}</td>
                    <td>{user.user_email}</td>
                    <td>{user.user_domain}</td>
                    <td>{user.status ? 'Completed' : 'Not completed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {showUserAssignment && (
        <div className="user-assignment-modal">
          <h3>Select users to assign</h3>
          <div className="user-lists">
            <div>
              <h4>Available</h4>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="user-search"
              />
              <ul>
                {filteredAvailableUsers.map(user => (
                  <li key={user.candidateID} onClick={() => assignUser(user)}>{user.candidateID}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Assigned</h4>
              <ul>
                {assignedUsers.map(user => (
                  <li key={user.candidateID} onClick={() => unassignUser(user)}>{user.fullName}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="modal-actions">
            <button onClick={() => setShowUserAssignment(false)}>Cancel</button>
            <button onClick={handleSaveAssignments} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
      {showUserAssignment && <div className="modal-backdrop" onClick={() => setShowUserAssignment(false)}></div>}
    </div>
  );
};

export default Publish;
