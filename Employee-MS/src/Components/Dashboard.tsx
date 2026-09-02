import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import "bootstrap-icons/font/bootstrap-icons.css";
import { Outlet } from 'react-router-dom' //! It is used to render the child routes

const Dashboard = () => {
    const navigate = useNavigate()
    const [checkingSession, setCheckingSession] = useState(true)

    useEffect(() => {
        axios.get('http://localhost:3000/auth/verify')
            .then(() => setCheckingSession(false))
            .catch(() => navigate('/adminlogin', { replace: true }))
    }, [navigate])

    const handleLogout = () => {
        axios.post('http://localhost:3000/auth/logout')
            .finally(() => navigate('/adminlogin', { replace: true }))
    }

    if (checkingSession) return <div className='p-5 text-center'>Checking session...</div>

    return (
        <div className='container-fluid'>
            <div className='row flex-nowrap '>
                {/* //! Sidebar */}
                <div className='col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark'>
                    <div className='d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 min-vh-100'>
                        <Link 
                          to="/dashboard"
                          className='d-flex align-items-center pb-3 mb-md-1 mt-md-3 me-md-auto text-white text-decoration-none'
                          >
                            <span className='fs-5 d-none d-sm-inline'>
                                    Code With Shubh
                            </span>
                        </Link>
                        <ul
                            className='nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start'
                            id='menu'
                        >
                            <li className='w-100'>
                                <Link 
                                    to="/dashboard"
                                    className='nav-link align-middle px-0 text-white'
                                    >
                                      <i className="fs-4 bi-speedometer2 ms-2"></i>                  
                                      <span className='ms-2 d-none d-sm-inline '>Dashboard</span>
                                </Link>
                            </li>
                            <li className="w-100">
                                <button
                                    type='button'
                                    onClick={handleLogout}
                                    className="nav-link px-0 align-middle text-white"
                                >
                                    <i className="fs-4 bi-people ms-2"></i>
                                    <span className="ms-2 d-none d-sm-inline">Manage Employees</span>
                                </button>
                            </li>
                            <li className="w-100">
                                <Link 
                                    to="/dashboard/category" 
                                    className="nav-link px-0 align-middle text-white"
                                >
                                    <i className="fs-4 bi-columns ms-2"></i>
                                    <span className="ms-2 d-none d-sm-inline">Category</span>
                                </Link>
                            </li>
                            <li className="w-100">
                                <Link 
                                    to="/dashboard/profile" 
                                    className="nav-link px-0 align-middle text-white"
                                >
                                    <i className="fs-4 bi-person ms-2"></i>
                                    <span className="ms-2 d-none d-sm-inline">Profile</span>
                                </Link>
                            </li>
                            <li className="w-100">
                                <Link 
                                    to="/dashboard/employee" 
                                    className="nav-link px-0 align-middle text-white"
                                >
                                    <i className="fs-4 bi-power ms-2"></i>
                                    <span className="ms-2 d-none d-sm-inline">Logout</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                {/* //! Main Body */}
                <div className='col p-0 m-0'>
                    <div className='p-2 d-flex justify-content-center shadow'>
                        <h4>Employee Management System</h4>
                    </div>                          
                    <Outlet /> {/* //! It is used to render the child routes */}  
                </div>
            </div>
        </div>
    );
};

export default Dashboard;