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

    if (checkingSession) return <div className='p-12 text-center'>Checking session...</div>

    return (
        <div className='w-full px-4'>
            <div className='flex flex-wrap -mx-4 flex-nowrap '>
                {/* //! Sidebar */}
                <div className='col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-gray-900'>
                    <div className='flex flex-col items-center align-items-sm-start px-4 pt-2 min-h-screen'>
                        <Link 
                          to="/dashboard"
                          className='flex items-center pb-4 mb-md-1 mt-md-3 me-md-auto text-white text-decoration-none'
                          >
                            <span className='text-lg hidden d-sm-inline'>
                                    Code With Shubh
                            </span>
                        </Link>
                        <ul
                            className='nav nav-pills flex-col mb-sm-auto mb-0 items-center align-items-sm-start'
                            id='menu'
                        >
                            <li className='w-full'>
                                <Link 
                                    to="/dashboard"
                                    className='nav-link align-middle px-0 text-white'
                                    >
                                      <i className="text-xl bi-speedometer2 ml-2"></i>                  
                                      <span className='ml-2 hidden d-sm-inline '>Dashboard</span>
                                </Link>
                            </li>
                            <li className="w-full">
                                <button
                                    type='button'
                                    onClick={handleLogout}
                                    className="nav-link px-0 align-middle text-white"
                                >
                                    <i className="text-xl bi-people ml-2"></i>
                                    <span className="ml-2 hidden d-sm-inline">Manage Employees</span>
                                </button>
                            </li>
                            <li className="w-full">
                                <Link 
                                    to="/dashboard/category" 
                                    className="nav-link px-0 align-middle text-white"
                                >
                                    <i className="text-xl bi-columns ml-2"></i>
                                    <span className="ml-2 hidden d-sm-inline">Category</span>
                                </Link>
                            </li>
                            <li className="w-full">
                                <Link 
                                    to="/dashboard/profile" 
                                    className="nav-link px-0 align-middle text-white"
                                >
                                    <i className="text-xl bi-person ml-2"></i>
                                    <span className="ml-2 hidden d-sm-inline">Profile</span>
                                </Link>
                            </li>
                            <li className="w-full">
                                <Link 
                                    to="/dashboard/employee" 
                                    className="nav-link px-0 align-middle text-white"
                                >
                                    <i className="text-xl bi-power ml-2"></i>
                                    <span className="ml-2 hidden d-sm-inline">Logout</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                {/* //! Main Body */}
                <div className='flex-1 px-4 p-0 m-0'>
                    <div className='p-2 flex justify-center shadow'>
                        <h4>Employee Management System</h4>
                    </div>                          
                    <Outlet /> {/* //! It is used to render the child routes */}  
                </div>
            </div>
        </div>
    );
};

export default Dashboard;