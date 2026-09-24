import React, { useState } from 'react'
import './style.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'          //! It is used to navigate the page

const Login = () => {
    // const[email, setEmail] = useState()              //! It is used only for the single content storage
       const[values, setValues] = useState({
            email: '',
            password:''
       })
        
       const navigate = useNavigate()                   //! It is used to navigate the page
       const [error, setError] = useState(null)         
    const [isSubmitting, setIsSubmitting] = useState(false)

       const handleSubmit = (event) =>{
         event.preventDefault()
         setError(null)
         setIsSubmitting(true)
         axios.post('http://localhost:3000/auth/adminlogin', values) //! It should be the http 
         .then(result => {            
                if(result.data.LoginStatus){
                    navigate('/dashboard') //! It is used to navigate the page
                }
                else{
                    setError(result.data.Error) 
                }}
         )
         .catch(err => setError(err.response?.data?.Error || 'Unable to connect to the server'))
         .finally(() => setIsSubmitting(false))
       }

  return (
    <div className='flex justify-center items-center h-screen loginPage'>
        <div className='p-4 rounded w-30 border border-gray-200 loginForm'>
            <div className='text-red-600'>
                {error && error}
            </div>
            <h2>Login Page</h2>
            <form onSubmit={handleSubmit}>
                <div className='mb-4'>
                    <label htmlFor="email"><strong>Email:</strong></label>
                    <input
                            type="email"
                            name="email"
                            autoComplete='off'
                            placeholder="Enter your Email"
                            value={values.email}
                            onChange={(e) => setValues({ ...values, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
                    />
                </div>
                <div className='mb-4'>
                    <label htmlFor="password"><strong>Password:</strong></label>
                    <input
                            type="password"
                            name="password"
                            placeholder="Enter your Password"
                            value={values.password}
                            onChange={(e) => setValues({ ...values, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
                    />
                </div>
                <button disabled={isSubmitting} className='px-4 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-success w-full rounded-none mb-2'>
                    {isSubmitting ? 'Signing in...' : 'Log in'}
                </button>
                <div className='mb-1'>
                    <input type="checkbox" name="tick" id="tick" className='mr-2'/> 
                    <label htmlFor="tick">You agree to our terms and conditions</label>
                </div>
            </form>
        </div>
    </div>
  )
}

export default Login
