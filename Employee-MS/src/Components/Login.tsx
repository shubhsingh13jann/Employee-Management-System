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
    <div className='d-flex justify-content-center align-items-center vh-100 loginPage'>
        <div className='p-3 rounded w-30 border loginForm'>
            <div className='text-danger'>
                {error && error}
            </div>
            <h2>Login Page</h2>
            <form onSubmit={handleSubmit}>
                <div className='mb-3'>
                    <label htmlFor="email"><strong>Email:</strong></label>
                    <input
                            type="email"
                            name="email"
                            autoComplete='off'
                            placeholder="Enter your Email"
                            value={values.email}
                            onChange={(e) => setValues({ ...values, email: e.target.value })}
                            className="form-control rounded-0"
                    />
                </div>
                <div className='mb-3'>
                    <label htmlFor="password"><strong>Password:</strong></label>
                    <input
                            type="password"
                            name="password"
                            placeholder="Enter your Password"
                            value={values.password}
                            onChange={(e) => setValues({ ...values, password: e.target.value })}
                            className="form-control rounded-0"
                    />
                </div>
                <button disabled={isSubmitting} className='btn btn-success w-100 rounded-0 mb-2'>
                    {isSubmitting ? 'Signing in...' : 'Log in'}
                </button>
                <div className='mb-1'>
                    <input type="checkbox" name="tick" id="tick" className='me-2'/> 
                    <label htmlFor="tick">You agree to our terms and conditions</label>
                </div>
            </form>
        </div>
    </div>
  )
}

export default Login
