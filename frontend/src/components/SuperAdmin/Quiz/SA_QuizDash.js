import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './sa_quizAsh.css';
import apiService from '../../../apiService';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SAQuizDash = () => {
    const [folders, setFolders] = useState({});
    const [openFolders, setOpenFolders] = useState({});
    const [openSubfolders, setOpenSubfolders] = useState({});
    const [selectedSubfolder, setSelectedSubfolder] = useState(null);
    const [renameQuiz, setRenameQuiz] = useState({ token: '', name: '' });
    const [error, setError] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(prevState => !prevState);
    };

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await apiService.get('/getAllData');
            const organizedData = organizeData(response.data);
            setFolders(organizedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        }
    };

    const organizeData = (data) => {
        const organized = {};

        data.forEach(item => {
            if (!organized[item.folder_name]) {
                organized[item.folder_name] = { subfolders: [] };
            }
            if (item.subfolder_name) {
                const subfolderIndex = organized[item.folder_name].subfolders.findIndex(sf => sf.name === item.subfolder_name);
                if (subfolderIndex === -1) {
                    organized[item.folder_name].subfolders.push({
                        name: item.subfolder_name,
                        quizzes: item.quiz_name ? [{ name: item.quiz_name, type: item.quiz_type, token: item.token }] : []
                    });
                } else {
                    if (item.quiz_name) {
                        organized[item.folder_name].subfolders[subfolderIndex].quizzes.push({ name: item.quiz_name, type: item.quiz_type, token: item.token });
                    }
                }
            }
        });
        return organized;
    };

    const handleFolderClick = (folder) => {
        setOpenFolders(prevState => ({
            ...prevState,
            [folder]: !prevState[folder]
        }));
    };

    const handleSubfolderClick = (folder, subfolder) => {
        setSelectedSubfolder({ folder, subfolder });
        setOpenSubfolders(prevState => ({
            ...prevState,
            [`${folder}_${subfolder}`]: !prevState[`${folder}_${subfolder}`]
        }));
    };


    const handleQuizClick = (quizToken) => {
        navigate(`/analysis/${quizToken}`);
    };

    const handleDeleteFolder = async (folder) => {
        try {
            await apiService.delete(`/deleteFolder/${folder}`);
            fetchData();
            toast.success('Folder deleted successfully');
        } catch (error) {
            console.error('Error deleting folder:', error);
            toast.error('Failed to delete folder');
        }
    };

    const handleDeleteSubfolder = async (folder, subfolder) => {
        try {
            await apiService.delete(`/deleteSubfolder/${folder}/${subfolder}`);
            fetchData();
            toast.success('Subfolder deleted successfully');
        } catch (error) {
            console.error('Error deleting subfolder:', error);
            toast.error('Failed to delete subfolder');
        }
    };

    const handleRenameQuiz = (quizToken) => {
        if (!selectedSubfolder || !folders[selectedSubfolder.folder]) {
            setError('No subfolder selected');
            return;
        }

        const subfolder = folders[selectedSubfolder.folder].subfolders
            .find(sf => sf.name === selectedSubfolder.subfolder);

        if (!subfolder) {
            setError('Subfolder not found');
            return;
        }

        const quiz = subfolder.quizzes.find(q => q.token === quizToken);

        if (!quiz) {
            setError('Quiz not found');
            return;
        }

        setRenameQuiz({ token: quizToken, name: quiz.name });
    };


    const handleRenameChange = (e) => {
        setRenameQuiz({ ...renameQuiz, name: e.target.value });
    };

    const handleRenameSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiService.put(`/renameQuiz/${renameQuiz.token}`, { token: renameQuiz.token, name: renameQuiz.name });

            const updatedSubfolders = folders[selectedSubfolder.folder].subfolders.map((sf) => {
                if (sf.name === selectedSubfolder.subfolder) {
                    return {
                        ...sf,
                        quizzes: sf.quizzes.map((q) => (q.token === renameQuiz.token ? { ...q, name: renameQuiz.name } : q))
                    };
                }
                return sf;
            });

            setFolders({
                ...folders,
                [selectedSubfolder.folder]: {
                    ...folders[selectedSubfolder.folder],
                    subfolders: updatedSubfolders
                }
            });

            setRenameQuiz({ token: '', name: '' });
        } catch (error) {
            console.error('Error renaming quiz:', error);
            setError('Failed to rename quiz');
        }
    };

    const handlePreviewClick = (quizToken) => {
        navigate(`/sa_dash/preview/${quizToken}`);
    };

    const handleDeleteQuiz = async (quizToken) => {
        try {
            await apiService.delete(`/deleteQuiz/${quizToken}`);

            const updatedSubfolders = folders[selectedSubfolder.folder].subfolders.map((sf) => {
                if (sf.name === selectedSubfolder.subfolder) {
                    return {
                        ...sf,
                        quizzes: sf.quizzes.filter((q) => q.token !== quizToken)
                    };
                }
                return sf;
            });

            setFolders({
                ...folders,
                [selectedSubfolder.folder]: {
                    ...folders[selectedSubfolder.folder],
                    subfolders: updatedSubfolders
                }
            });
        } catch (error) {
            console.error('Error deleting quiz:', error);
            setError('Failed to delete quiz');
        }
    };

    const handleDropdownSelect = (option, quizToken) => {
        if (!selectedSubfolder) {
            setError('No subfolder selected');
            return;
        }

        switch (option) {
            case 'rename':
                handleRenameQuiz(quizToken);
                break;
            case 'delete':
                handleDeleteQuiz(quizToken);
                break;
            default:
                break;
        }
        setDropdownOpen(null);
    };


    return (
        <div className="SA_quiz-dash-container">
            <ToastContainer />
            <h2 style={{ textAlign: "center" }}>Available Folders</h2>
            {error && <div className="error-message">{error}</div>}
            <div className="SA_folder-list">
                <ul className="SA_folder-list-items">
                    {Object.keys(folders).map((folder, index) => (
                        <li key={index} className="SA_folder-item">
                            <div className="SA_folder-header" style={{ display: "flex", gap: "30px" }}>
                                <div style={{ width: "1000px" }}
                                    className="SA_folder-title"
                                    onClick={() => handleFolderClick(folder)}
                                >
                                    {folder}
                                </div>
                                <button
                                    className="SA_delete-button"
                                    style={{ background: "none", border: "none" }}
                                    onClick={() => handleDeleteFolder(folder)}
                                >
                                    <FontAwesomeIcon
                                        icon={faTrash}
                                        className="SA_delete-icon"
                                    />
                                </button>
                            </div>
                            {openFolders[folder] && (
                                <ul className="SA_folder-list">
                                    {folders[folder].subfolders.map((subfolder, subIndex) => (
                                        <li key={subIndex} className="SA_folder-item">
                                            <div className="SA_folder-header" style={{ display: "flex", gap: "30px", paddingTop: "10px" }}>
                                                <div
                                                    style={{ width: "900px" }}
                                                    className="SA_folder-title"
                                                    onClick={() => handleSubfolderClick(folder, subfolder.name)}
                                                >
                                                    {subfolder.name}
                                                </div>
                                                <button
                                                    className="SA_delete-button"
                                                    style={{ background: "none", border: "none" }}
                                                    onClick={() => handleDeleteSubfolder(folder, subfolder.name)}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faTrash}
                                                        className="SA_delete-icon"
                                                    />
                                                </button>
                                            </div>
                                            {openSubfolders[`${folder}_${subfolder.name}`] && (
                                                <ul style={{ listStyleType: "none", paddingLeft: "20px" }}>
                                                    {subfolder.quizzes.map((quiz, quizIndex) => (

                                                        <li
                                                            key={quizIndex}
                                                            style={{
                                                                marginBottom: "10px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between"
                                                            }}
                                                        >
                                                            <div
                                                                className="SA_quiz-name"
                                                                onClick={() => handleQuizClick(quiz.token)}
                                                                style={{ cursor: "pointer", color: "#007bff", fontWeight: "bold" }}
                                                            >
                                                                {quiz.name} ({quiz.type})
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "10px"
                                                                }}
                                                            >
                                                                <button
                                                                    style={{
                                                                        background: "#007bff",
                                                                        color: "#fff",
                                                                        border: "none",
                                                                        padding: "5px 10px",
                                                                        cursor: "pointer",
                                                                        borderRadius: "4px"
                                                                    }}
                                                                    onClick={() => handlePreviewClick(quiz.token)}
                                                                >
                                                                    Preview
                                                                </button>

                                                                <div
                                                                    style={{
                                                                        position: "relative",
                                                                        display: "inline-block"
                                                                    }}
                                                                >
                                                                    <button
                                                                        style={{
                                                                            background: "#6c757d",
                                                                            color: "#fff",
                                                                            border: "none",
                                                                            padding: "5px 10px",
                                                                            cursor: "pointer",
                                                                            borderRadius: "4px"
                                                                        }}
                                                                        onClick={toggleDropdown}
                                                                    >
                                                                        Options
                                                                    </button>
                                                                    {isDropdownOpen && (
                                                                        <div
                                                                            style={{
                                                                                position: "absolute",
                                                                                top: "100%",
                                                                                left: "0",
                                                                                backgroundColor: "#f9f9f9",
                                                                                boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
                                                                                zIndex: 1,
                                                                                borderRadius: "4px",
                                                                                overflow: "hidden",
                                                                                minWidth: "100px",
                                                                            }}
                                                                        >
                                                                            <button
                                                                                style={{
                                                                                    background: "#28a745",
                                                                                    color: "#fff",
                                                                                    border: "none",
                                                                                    padding: "10px",
                                                                                    width: "100%",
                                                                                    textAlign: "left",
                                                                                    cursor: "pointer",
                                                                                    borderRadius: "4px 4px 0 0"
                                                                                }}
                                                                                onClick={() => {
                                                                                    handleDropdownSelect('rename', quiz.token);
                                                                                    setIsDropdownOpen(false);
                                                                                }}
                                                                            >
                                                                                Rename
                                                                            </button>
                                                                            <button
                                                                                style={{
                                                                                    background: "#dc3545",
                                                                                    color: "#fff",
                                                                                    border: "none",
                                                                                    padding: "10px",
                                                                                    width: "100%",
                                                                                    textAlign: "left",
                                                                                    cursor: "pointer",
                                                                                    borderRadius: "0 0 4px 4px"
                                                                                }}
                                                                                onClick={() => {
                                                                                    handleDropdownSelect('delete', quiz.token);
                                                                                    setIsDropdownOpen(false);
                                                                                }}
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </li>

                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            {renameQuiz.token && (
                <form onSubmit={handleRenameSubmit} className="SA_rename-form">
                    <label htmlFor="rename-quiz-name">New Quiz Name:</label>
                    <input
                        type="text"
                        id="rename-quiz-name"
                        value={renameQuiz.name}
                        onChange={handleRenameChange}
                    />
                    <button type="submit">Rename</button>
                </form>
            )}
        </div>
    );
};

export default SAQuizDash;